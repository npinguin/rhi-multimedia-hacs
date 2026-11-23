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
from .validation import validate_rooms, validate_step_delay
from .foundation import SELECTION_CHANGED_EVENT, register_with_foundation, unregister_visuals_with_foundation

_LOGGER = logging.getLogger(__name__)
PLATFORMS = [Platform.MEDIA_PLAYER, Platform.SENSOR, Platform.SELECT, Platform.SWITCH, Platform.NUMBER, Platform.TEXT, Platform.BUTTON, Platform.NOTIFY]
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
        # Empty room configuration can still own an explicitly configured
        # native Dell display that Foundation must select before room binding.
        # No activity engine, room commands or synthetic projections exist yet.
        dell_configured = bool(entry.options.get("dell_displays", entry.data.get("dell_displays", {})))
        hass.data[DOMAIN] = {"entry": entry, "phase": "awaiting_foundation_configuration",
                             "dell_prepared": dell_configured}
        # Supported logical AV devices are read-only HA projections even
        # before the first room/activity. No command service or activity engine
        # is registered by this empty-configuration path.
        # The source-backed read-only logical players are also present before
        # rooms are configured. Dell remains optional and independently native.
        presentations = [Platform.MEDIA_PLAYER, Platform.SENSOR]
        await hass.config_entries.async_forward_entry_setups(entry, presentations)
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
    delay_ms = validate_step_delay(entry.options.get("default_step_delay_ms", 0))
    engine = ActivityEngine(rooms, adapter, default_step_delay_ms=delay_ms)
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
        # Capture the exact cast *before* stop mutates runtime state.
        # Upstream Loewe can report optimistic state while its TV has not yet
        # independently polled. Do not turn that into a physical PASS.
        current = rooms.get(room, {})
        cast = (current.get("activities", {}).get(activity, {}).get("devices", [])
                if activity is not None else
                getattr(engine.states.get(room), "devices", set()))
        quality_of = getattr(adapter, "native_readback_quality",
                             lambda _device: "native_ha_state")
        provider_optimistic = any(
            quality_of(current["devices"][key]) == "provider_optimistic"
            for key in cast if key in current.get("devices", {})
        )
        # Native remote-key scripts cannot confirm the target device UI
        # merely by completing a Home Assistant service call.
        definition = current.get("activities", {}).get(activity, {}) if activity else {}
        scripted_unverified = any(step.get("type") == "remote_key"
                                  for step in definition.get("steps", []))
        provider_optimistic = provider_optimistic or scripted_unverified
        try:
            operation = (engine.command(room, activity, fix_it=True)
                         if service == "recover_activity"
                         else engine.command(room, activity))
            result = await adapter.with_context(call.context, operation)
        except asyncio.CancelledError:
            if asyncio.current_task().cancelling():
                raise
            return {**response, "result": "cancelled"}
        reached = result["phase"] == ("active" if activity else "idle")
        return {**response,
                "result": ("submitted" if provider_optimistic else "confirmed") if reached else "failed",
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
        if not activity and not (engine.states[room].retiring_activity and
                                 engine.states[room].devices):
            raise MediaError(f"{room}: no previous activity or unfinished shutdown to correct")
        # When a CEC-dependent shutdown was incomplete, recovering is a
        # targeted, authorized retry of the remaining STOP plan, not a restart.
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

    async def press_button(call: ServiceCall) -> dict:
        room, button = call.data["room"], call.data["button"]
        result = await adapter.with_context(call.context, engine.press_button(room, button))
        return {"room": room, "service": "press_activity_button",
                "button": button, "result": result}

    async def run_macro(call: ServiceCall) -> dict:
        room, macro = call.data["room"], call.data["macro"]
        result = await adapter.with_context(call.context, engine.run_macro(room, macro))
        return {"room": room, "service": "run_activity_macro",
                "macro": macro, "result": result}

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
        "press_activity_button": (press_button, vol.Schema({
            vol.Required("room"): str, vol.Required("button"): str})),
        "run_activity_macro": (run_macro, vol.Schema({
            vol.Required("room"): str, vol.Required("macro"): str})),
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
        if (hass.data[DOMAIN].get("phase") == "awaiting_foundation_configuration"
                and not await hass.config_entries.async_unload_platforms(
                    entry, [Platform.MEDIA_PLAYER, Platform.SENSOR])):
            return False
        hass.data.pop(DOMAIN, None)
        unregister_visuals_with_foundation(hass)
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
    for name in ("start_activity", "stop_activity", "recover_activity", "inspect_room",
                 "control_device", "press_activity_button", "run_activity_macro"):
        hass.services.async_remove(DOMAIN, name)
    hass.data.pop(DOMAIN, None)
    unregister_visuals_with_foundation(hass)
    return True
