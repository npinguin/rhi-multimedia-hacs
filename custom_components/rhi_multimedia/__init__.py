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
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers.dispatcher import async_dispatcher_send

from .const import EVENT_UPDATE

from .adapter import HAAdapter
from .const import CONF_ROOMS, DOMAIN, STORE_VERSION
from .engine import ActivityEngine, MediaError
from .validation import validate_rooms
from .foundation import register_with_foundation, selected_index

_LOGGER = logging.getLogger(__name__)
PLATFORMS = [Platform.SENSOR, Platform.SELECT]
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """HA boot: only register physical commands after a real config entry is loaded."""
    hass.data.setdefault(DOMAIN, {})
    register_with_foundation(hass)
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
        entry.async_on_unload(entry.add_update_listener(_async_update_listener))
        return True
    rooms = validate_rooms(configured)
    # 0.1.0 used hand-authored JSON without Foundation candidate identity.
    # Preserve the user's old room/activity data, but never grant its devices
    # command rights by inventing mappings during the upgrade.
    if any("foundation_candidate_id" not in dev or "foundation_concept" not in dev
           for spec in rooms.values() for dev in spec["devices"].values()):
        hass.data[DOMAIN] = {"entry": entry, "phase": "legacy_foundation_review_required"}
        entry.async_on_unload(entry.add_update_listener(_async_update_listener))
        return True
    selected = selected_index(hass)
    invalid = [f"{room}/{key}" for room, spec in rooms.items()
               for key, dev in spec["devices"].items()
               if (dev.get("foundation_concept"), dev["entity"]) not in selected
               or selected[(dev.get("foundation_concept"), dev["entity"])].candidate_id != dev.get("foundation_candidate_id")]
    if invalid:
        from homeassistant.exceptions import ConfigEntryNotReady
        raise ConfigEntryNotReady(
            "Multimedia has no matching approved Foundation source selection for: "
            + ", ".join(invalid) + ". Review Foundation technical selections and Multimedia mappings."
        )
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
        watched_entities = {
            device["entity"]
            for specification in rooms.values()
            for device in specification["devices"].values()
        }
        bus = getattr(hass, "bus", None)
        if bus is not None:
            def source_changed(event) -> None:
                if event.data.get("entity_id") in watched_entities:
                    async_dispatcher_send(hass, EVENT_UPDATE, "*")
            entry.async_on_unload(bus.async_listen("state_changed", source_changed))
        _register_services(hass, engine, adapter, rooms)
        entry.async_on_unload(entry.add_update_listener(_async_update_listener))
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


async def _async_update_listener(hass, entry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


def _register_services(hass, engine, adapter, rooms: dict) -> None:
    async def start(call: ServiceCall) -> None:
        await engine.command(call.data["room"], call.data["activity"])

    async def stop(call: ServiceCall) -> None:
        await engine.command(call.data["room"], None)

    async def recover(call: ServiceCall) -> None:
        room = call.data["room"]
        if room not in engine.states:
            raise MediaError(f"Unknown room: {room}")
        activity = engine.states[room].activity
        if not activity:
            raise MediaError(f"{room}: no previous activity to recover")
        await engine.command(room, activity)

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
    }
    for service, (handler, schema) in definitions.items():
        hass.services.async_register(DOMAIN, service, handler, schema=schema)


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
    for name in ("start_activity", "stop_activity", "recover_activity", "inspect_room"):
        hass.services.async_remove(DOMAIN, name)
    hass.data.pop(DOMAIN, None)
    return True
