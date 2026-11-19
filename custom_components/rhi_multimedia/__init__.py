"""RHI Multimedia: config-entry owned AV activity orchestration.

Media endpoints and their HA devices remain owned by native source integrations.
This domain owns only activity semantics, native activity entities and command sequencing.
"""
from __future__ import annotations

import asyncio
import logging

import voluptuous as vol
from homeassistant.const import Platform
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.storage import Store
from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.event import async_track_state_change_event

from .const import EVENT_UPDATE

from .adapter import HAAdapter
from .const import CONF_ROOMS, DOMAIN, STORE_VERSION
from .engine import ActivityEngine, MediaError
from .validation import validate_rooms
from .foundation import SELECTION_CHANGED_EVENT, register_with_foundation

_LOGGER = logging.getLogger(__name__)
PLATFORMS = [Platform.SENSOR, Platform.SELECT, Platform.BUTTON]
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """HA boot: only register physical commands after a real config entry is loaded."""
    hass.data.setdefault(DOMAIN, {})
    register_with_foundation(hass)
    if getattr(hass, "http", None) is not None:
        from .frontend import async_register_frontend
        await async_register_frontend(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry) -> bool:
    """Load persisted user configuration and the last actual activity attempt."""
    if hass.data.get(DOMAIN, {}).get("engine"):
        raise ValueError("RHI Multimedia supports one household configuration entry")
    register_with_foundation(hass)
    configured = entry.options.get(CONF_ROOMS, entry.data.get(CONF_ROOMS, {}))
    if not configured:
        # Empty config entry is a real Foundation-first onboarding state. It has
        # no command services, physical devices or fake runtime projections.
        hass.data[DOMAIN] = {"entry": entry, "phase": "awaiting_foundation_configuration"}
        _register_entry_listeners(hass, entry)
        return True
    rooms = validate_rooms(configured)
    # 0.1.0 used hand-authored JSON without Foundation candidate identity.
    # Preserve the user's old room/activity data, but never grant its devices
    # command rights by inventing mappings during the upgrade.
    if any("foundation_candidate_id" not in dev or "foundation_concept" not in dev
           for spec in rooms.values() for dev in spec["devices"].values()):
        hass.data[DOMAIN] = {"entry": entry, "phase": "legacy_foundation_review_required"}
        _register_entry_listeners(hass, entry)
        return True
    # Missing/revoked selections degrade only the affected actions. Retain the
    # configured rooms and their identities for inspection and repair; the adapter
    # revalidates the exact Foundation selection before every native write.
    store = Store(hass, STORE_VERSION, f"rhi_multimedia_{entry.entry_id}")
    adapter = HAAdapter(hass, store)
    engine = ActivityEngine(rooms, adapter)
    previous = await store.async_load() or {}
    if not isinstance(previous, dict):
        previous = {}
    for room, prior in previous.items():
        if room not in engine.states or not isinstance(prior, dict):
            continue
        if prior.get("phase") != "idle":
            state = engine.states[room]
            state.phase = "interrupted"
            state.activity = prior.get("activity") if prior.get("activity") in rooms[room]["activities"] else None
            retiring = prior.get("retiring_activity")
            state.retiring_activity = retiring if retiring in rooms[room]["activities"] else None
            if state.retiring_activity:
                state.activity = None
            state.devices = set(prior.get("devices") or []) & set(rooms[room]["devices"])
            state.error = "Home Assistant restarted; recover or stop to reconcile physical device state"
            state.progress = "Recovery required"
    adapter.persisted = previous
    hass.data[DOMAIN] = {"entry": entry, "engine": engine, "adapter": adapter}
    try:
        await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
        # Refresh the published UX experience when native source readback changes.
        # Watch ONLY endpoints chosen in Multimedia after Foundation selection.
        # No domain-wide HA device discovery or guessed relationships.
        watched_entities: dict[str, set[str]] = {}
        unsubscribe_sources = None

        def refresh_source_tracker() -> None:
            nonlocal unsubscribe_sources
            updated: dict[str, set[str]] = {}
            for room, specification in rooms.items():
                for device in specification["devices"].values():
                    updated.setdefault(device["entity"], set()).add(room)
                    remote = adapter.paired_remote(device)
                    if remote:
                        updated.setdefault(remote["entity"], set()).add(room)
            if updated == watched_entities and unsubscribe_sources is not None:
                return
            if unsubscribe_sources is not None:
                unsubscribe_sources()
            watched_entities.clear()
            watched_entities.update(updated)
            unsubscribe_sources = async_track_state_change_event(
                hass, tuple(watched_entities), source_changed)

        def remove_source_tracker() -> None:
            if unsubscribe_sources is not None:
                unsubscribe_sources()
        async def source_changed(event) -> None:
            if hass.data.get(DOMAIN, {}).get("engine") is not engine:
                return
            affected = watched_entities.get(event.data.get("entity_id"), ())
            changed = False
            for room in affected:
                changed = await engine.reconcile(room) or changed
            if affected and not changed:
                async_dispatcher_send(hass, EVENT_UPDATE, "*")

        # HA's indexed tracker schedules only selected source events on the
        # event loop; a plain sync bus listener runs in an executor thread.
        refresh_source_tracker()
        entry.async_on_unload(remove_source_tracker)

        async def selection_changed(event) -> None:
            if (event.data.get("domain_id") != "multimedia"
                    or hass.data.get(DOMAIN, {}).get("engine") is not engine):
                return
            refresh_source_tracker()
            for room in rooms:
                await engine.reconcile(room)
            async_dispatcher_send(hass, EVENT_UPDATE, "*")

        if getattr(hass, "bus", None) is not None:
            entry.async_on_unload(hass.bus.async_listen(SELECTION_CHANGED_EVENT, selection_changed))
        for room in rooms:
            await engine.reconcile(room)
        _register_services(hass, engine, adapter, rooms)
        _register_entry_listeners(hass, entry)
    except Exception:
        hass.data.pop(DOMAIN, None)
        raise
    _LOGGER.info("RHI Multimedia loaded %s real AV rooms", len(rooms))
    return True


async def async_migrate_entry(hass: HomeAssistant, entry) -> bool:
    """Migrate the entry schema only; never invent approved source bindings."""
    if entry.version > 2:
        return False
    if entry.version < 2:
        hass.config_entries.async_update_entry(entry, version=2)
    return True


def _register_entry_listeners(hass, entry):
    if getattr(hass, "http", None) is not None:
        from .frontend import async_setup_ux
        async_setup_ux(hass, entry)
    previous = dict(entry.options)

    async def update(hass, updated):
        nonlocal previous
        current = dict(updated.options)
        changed = {key for key in previous.keys() | current.keys()
                   if key not in previous or key not in current or previous[key] != current[key]}
        previous = current
        if changed != {"enable_ux"}:
            await _async_update_listener(hass, updated)

    entry.async_on_unload(entry.add_update_listener(update))


async def _async_update_listener(hass, entry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


def _register_services(hass, engine, adapter, rooms: dict) -> None:
    async def activity_result(call: ServiceCall, service: str, activity: str | None) -> dict:
        room = call.data["room"]
        response = {"room": room, "service": service, "activity": activity}
        try:
            result = await adapter.with_context(call.context, engine.command(room, activity))
        except asyncio.CancelledError:
            if asyncio.current_task().cancelling():
                raise
            return {**response, "result": "cancelled"}
        return {**response, "result": "confirmed" if result["phase"] == ("active" if activity else "idle") else "failed",
                "phase": result["phase"], "error": result["error"]}

    async def start(call: ServiceCall) -> dict:
        return await activity_result(call, "start_activity", call.data["activity"])

    async def stop(call: ServiceCall) -> dict:
        return await activity_result(call, "stop_activity", None)

    async def recover(call: ServiceCall) -> dict:
        room = call.data["room"]
        if room not in engine.states:
            raise MediaError(f"Unknown room: {room}")
        activity = engine.states[room].activity
        if not activity:
            raise MediaError(f"{room}: no previous activity to recover")
        return await activity_result(call, "recover_activity", activity)

    async def control(call: ServiceCall) -> dict:
        response = {"room": call.data["room"], "service": "control_device",
                    "device": call.data["device"], "action": call.data["action"]}
        try:
            result = await adapter.with_context(call.context, engine.control(
                response["room"], response["device"], response["action"], call.data.get("value")))
        except asyncio.CancelledError:
            if asyncio.current_task().cancelling():
                raise
            result = "cancelled"
        return {**response, "result": result}

    async def inspect(call: ServiceCall) -> None:
        room = call.data["room"]
        if room not in rooms:
            raise MediaError(f"Unknown room: {room}")
        adapter.inspect(room, rooms[room])

    definitions = {
        "start_activity": (start, vol.Schema({vol.Required("room"): str, vol.Required("activity"): str})),
        "stop_activity": (stop, vol.Schema({vol.Required("room"): str})),
        "recover_activity": (recover, vol.Schema({vol.Required("room"): str})),
        "inspect_room": (inspect, vol.Schema({vol.Required("room"): str})),
        "control_device": (control, vol.Schema({vol.Required("room"): str, vol.Required("device"): str,
                                                vol.Required("action"): str, vol.Optional("value"): object})),
    }
    for service, (handler, schema) in definitions.items():
        response = SupportsResponse.NONE if service == "inspect_room" else SupportsResponse.OPTIONAL
        hass.services.async_register(DOMAIN, service, handler, schema=schema, supports_response=response)


async def async_unload_entry(hass: HomeAssistant, entry) -> bool:
    """Remove service writers and native projections with the owning config entry."""
    if hass.data.get(DOMAIN, {}).get("phase") in {
        "awaiting_foundation_configuration", "legacy_foundation_review_required"
    }:
        hass.data.pop(DOMAIN, None)
        return True
    if not await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        return False
    context = hass.data.get(DOMAIN, {})
    engine = context.get("engine")
    if engine:
        pending = [task for task in engine._room_tasks.values() if not task.done()]
        for task in pending:
            task.cancel()
        if pending:
            await asyncio.gather(*pending, return_exceptions=True)
    for name in ("start_activity", "stop_activity", "recover_activity", "inspect_room", "control_device"):
        hass.services.async_remove(DOMAIN, name)
    hass.data.pop(DOMAIN, None)
    return True
