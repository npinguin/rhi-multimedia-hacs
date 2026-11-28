"""RHI Multimedia: config-entry owned AV activity orchestration.

Media endpoints and their HA devices remain owned by native source integrations.
This domain owns only activity semantics, native activity entities and command sequencing.
"""
from __future__ import annotations

import asyncio
import logging
from copy import deepcopy
from datetime import datetime

import voluptuous as vol
from homeassistant.const import Platform
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.storage import Store
from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse, callback
from homeassistant.helpers.event import async_track_state_change_event

from .experience import queue_native_update, cancel_native_update

from .adapter import HAAdapter
from .const import CONFIG_VERSION, DOMAIN, STORE_VERSION
from .engine import ActivityEngine, MediaError
from .validation import (DEVICE_CATALOG, configuration_model, configuration_source, entry_rooms,
                         native_state, reconciliation_changed, validate_rooms, validate_step_delay)
from .foundation import (SELECTION_CHANGED_EVENT, register_with_foundation,
                          unregister_visuals_with_foundation, projection_source_reads)

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
    configured = entry_rooms(entry)
    catalog = configuration_source(entry).get(DEVICE_CATALOG)
    # One read-only runtime snapshot of the authoritative entry; engine rooms
    # are a derived execution view, not a second configuration owner.
    owner = {DEVICE_CATALOG: deepcopy(catalog)} if catalog is not None else {}
    if not configured:
        # Empty room configuration can still own an explicitly configured
        # native Dell display that Foundation must select before room binding.
        # No activity engine, room commands or synthetic projections exist yet.
        dell_configured = bool(entry.options.get("dell_displays", entry.data.get("dell_displays", {})))
        hass.data[DOMAIN] = {**owner, "entry": entry, "phase": "awaiting_foundation_configuration",
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
        hass.data[DOMAIN] = {**owner, "entry": entry, "phase": "legacy_foundation_review_required"}
        _register_entry_listeners(hass, entry)
        return True
    # Missing/revoked selections degrade only the affected actions. Retain the
    # configured rooms and their identities for inspection and repair; the adapter
    # revalidates the exact Foundation selection before every native write.
    store = Store(hass, STORE_VERSION, f"rhi_multimedia_{entry.entry_id}")
    adapter = HAAdapter(hass, store)
    adapter.configured_rooms = rooms
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
    runtime = {**owner, "entry": entry, "engine": engine, "adapter": adapter}
    # Compare with the authoritative loaded options, excluding the purely
    # visual flag that does not require a runtime reload. No second store.
    loaded_options = deepcopy({k: v for k, v in entry.options.items() if k != "enable_ux"})
    loaded_data = deepcopy(dict(entry.data))
    adapter.configuration_current = lambda: (
        hass.data.get(DOMAIN) is runtime and not runtime.get("_unloading")
        and loaded_options == {k: v for k, v in entry.options.items() if k != "enable_ux"}
        and loaded_data == dict(entry.data))
    hass.data[DOMAIN] = runtime
    try:
        await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
        # Refresh the published UX experience when native source readback changes.
        # Watch ONLY endpoints chosen in Multimedia after Foundation selection.
        # No domain-wide HA device discovery or guessed relationships.
        watched_entities: dict[str, set[str]] = {}
        unsubscribe_sources = None
        unsubscribe_reports = None
        readiness_trackers: dict[str, set[str]] = {}
        heos_entities = set()
        dirty_sources, dirty_rooms, dirty_presentation = set(), set(), set()
        harmony_entities = {spec["devices"][spec["harmony_controller"]]["entity"]
                            for spec in rooms.values() if spec.get("harmony_controller")}

        def refresh_source_tracker() -> None:
            nonlocal unsubscribe_sources, unsubscribe_reports
            updated: dict[str, set[str]] = {}
            reports: dict[str, set[str]] = {}
            with projection_source_reads(hass):
                for room, specification in rooms.items():
                    for device in specification["devices"].values():
                        updated.setdefault(device["entity"], set()).add(room)
                        from .foundation import computer_agent_source, computer_io_source
                        for role in device.get("computer_io", {}):
                            source = computer_io_source(hass, device, role)
                            if source:
                                updated.setdefault(source.entity_id, set()).add(room)
                                from .validation import computer_sensor_role
                                if computer_sensor_role(role):
                                    reports.setdefault(source.entity_id, set()).add(device["entity"])
                        companion = computer_agent_source(hass, device)
                        if companion:
                            updated.setdefault(companion.entity_id, set()).add(room)
                        remote = adapter.paired_remote(device)
                        if remote:
                            updated.setdefault(remote["entity"], set()).add(room)
            from homeassistant.helpers import entity_registry as er
            registry = er.async_get(hass)
            heos_entities.clear()
            heos_entities.update(entity for entity in updated
                                 if getattr(registry.async_get(entity), "platform", None) == "heos")
            if updated != watched_entities or unsubscribe_sources is None:
                if unsubscribe_sources is not None:
                    unsubscribe_sources()
                watched_entities.clear()
                watched_entities.update(updated)
                unsubscribe_sources = async_track_state_change_event(
                    hass, tuple(watched_entities), source_changed)
            if reports != readiness_trackers:
                if unsubscribe_reports is not None:
                    unsubscribe_reports()
                    unsubscribe_reports = None
                readiness_trackers.clear()
                readiness_trackers.update(reports)
                if readiness_trackers:
                    from homeassistant.helpers.event import async_track_state_report_event
                    unsubscribe_reports = async_track_state_report_event(
                        hass, tuple(readiness_trackers), source_reported)

        def remove_source_tracker() -> None:
            if unsubscribe_sources is not None:
                unsubscribe_sources()
            if unsubscribe_reports is not None:
                unsubscribe_reports()
        async def drain_native_changes() -> None:
            # One entry-owned task; at most one reconciliation per affected
            # room in each batch, no queue of historical telemetry events.
            # Reconciliation observes current native state and sends no AV
            # commands. Different room locks need not block each other.
            while dirty_sources and not runtime.get("_native_reconcile_closed"):
                sources, affected, presentation = (set(dirty_sources), set(dirty_rooms),
                                                   set(dirty_presentation))
                dirty_sources.clear()
                dirty_rooms.clear()
                dirty_presentation.clear()
                ordered = sorted(affected)
                outcomes = (await asyncio.gather(
                    *(engine.reconcile(room) for room in ordered), return_exceptions=True)
                    if ordered else ())
                for room, outcome in zip(ordered, outcomes):
                    if isinstance(outcome, BaseException):
                        _LOGGER.error("Native reconciliation failed for room %s", room,
                                      exc_info=(type(outcome), outcome, outcome.__traceback__))
                if hass.data.get(DOMAIN) is not runtime or runtime.get("_native_reconcile_closed"):
                    return
                for entity in sources:
                    queue_native_update(hass, runtime, entity, presentation)
                # New events accumulated during readback stay in the same
                # bounded sets and are processed on the next loop turn.
                await asyncio.sleep(0)

        def readiness_crossed(entity, previous, reported) -> bool:
            if not isinstance(reported, datetime) or reported.tzinfo is None:
                return False
            for tracker in readiness_trackers.get(entity, ()):
                network = native_state(hass, tracker)
                since = getattr(network, "last_changed", None)
                if (network is not None and network.state == "home"
                        and isinstance(since, datetime) and since.tzinfo is not None
                        and reported >= since
                        and (not isinstance(previous, datetime) or previous.tzinfo is None
                             or previous < since)):
                    return True
            return False

        @callback
        def source_reported(event) -> None:
            # HA emits state_reported (not state_changed) when an unchanged
            # sensor value is reported again. Only the first report crossing
            # the selected PC's online boundary needs room reconciliation.
            if readiness_crossed(event.data.get("entity_id"),
                                 event.data.get("old_last_reported"),
                                 event.data.get("last_reported")):
                source_changed(event)

        @callback
        def source_changed(event) -> None:
            if hass.data.get(DOMAIN) is not runtime or runtime.get("_native_reconcile_closed"):
                return
            entity = event.data.get("entity_id")
            affected = watched_entities.get(entity, ())
            if not affected:
                return
            dirty_sources.add(entity)
            before, after = event.data.get("old_state"), event.data.get("new_state")
            if (reconciliation_changed(before, after)
                    or readiness_crossed(entity, getattr(before, "last_reported", None),
                                         getattr(after, "last_reported", None))):
                dirty_rooms.update(affected)
            dirty_presentation.update(affected)
            # Preserve exact cross-room companion readback and actual HEOS
            # grouping dependencies; ordinary volume/position is local.
            dirty_presentation.update(runtime.get("native_projection_rooms", {}).get(entity, ()))
            if entity in harmony_entities:
                # A hub can change externally; invalidate overlapping room
                # reservations even when the hub itself is not in that room.
                keys = ("current_activity", "activity_starting", "restored")
                if (before is None or after is None or before.state != after.state
                        or any(before.attributes.get(k) != after.attributes.get(k) for k in keys)
                        or ("activity_starting" in before.attributes) != ("activity_starting" in after.attributes)):
                    dirty_rooms.update(rooms)
                    dirty_presentation.update(rooms)
            if entity in heos_entities:
                keys = ("group_members", "supported_features", "restored")
                if (before is None or after is None or before.state != after.state
                        or any(before.attributes.get(k) != after.attributes.get(k) for k in keys)):
                    dirty_presentation.update(rooms)
            task = runtime.get("_native_reconcile_task")
            if task is None or task.done():
                runtime["_native_reconcile_task"] = entry.async_create_task(
                    hass, drain_native_changes(), "Multimedia native reconciliation", eager_start=False)

        # HA's indexed event-loop callback only collects exact dirty sources;
        # room locks and live state reconciliation run in the bounded task.
        refresh_source_tracker()
        entry.async_on_unload(remove_source_tracker)

        # Native Windows has no persistent agent publishing HA events. One
        # entry-owned bounded refresh, only for explicitly configured PCs,
        # feeds the existing dirty-source reconciliation and projection.
        windows_devices = {
            device.get("physical_id", device["entity"]): device
            for specification in rooms.values()
            for device in specification["devices"].values()
            if device.get("windows_native")
        }
        if windows_devices:
            from datetime import timedelta
            from homeassistant.helpers.event import async_track_time_interval

            async def refresh_native_windows():
                for device in windows_devices.values():
                    if runtime.get("_native_reconcile_closed") or runtime.get("_unloading"):
                        return
                    if await adapter.refresh_windows(device):
                        entity = device["entity"]
                        affected = watched_entities.get(entity, ())
                        dirty_sources.add(entity)
                        dirty_rooms.update(affected)
                        dirty_presentation.update(affected)
                if (dirty_sources and not runtime.get("_native_reconcile_closed")
                        and not runtime.get("_unloading")):
                    task = runtime.get("_native_reconcile_task")
                    if task is None or task.done():
                        runtime["_native_reconcile_task"] = entry.async_create_task(
                            hass, drain_native_changes(), "Multimedia native reconciliation", eager_start=False)

            @callback
            def schedule_native_windows(_now=None):
                if runtime.get("_native_reconcile_closed") or runtime.get("_unloading"):
                    return
                task = runtime.get("_windows_refresh_task")
                if task is None or task.done():
                    runtime["_windows_refresh_task"] = entry.async_create_task(
                        hass, refresh_native_windows(), "Multimedia Windows native readback", eager_start=False)

            entry.async_on_unload(async_track_time_interval(hass, schedule_native_windows, timedelta(seconds=10)))
            schedule_native_windows()

        async def selection_changed(event) -> None:
            if (event.data.get("domain_id") != "multimedia"
                    or hass.data.get(DOMAIN, {}).get("engine") is not engine):
                return
            refresh_source_tracker()
            for room in rooms:
                await engine.reconcile(room)
            # The native sensor owner publishes the shared structural update.
            # Reconciliation emits its own room report only when state changes.

        if getattr(hass, "bus", None) is not None:
            entry.async_on_unload(hass.bus.async_listen(SELECTION_CHANGED_EVENT, selection_changed))
        for room in rooms:
            await engine.reconcile(room)
        _register_services(hass, engine, adapter, rooms)
        _register_entry_listeners(hass, entry)
    except Exception:
        await _stop_native_updates(runtime)
        hass.data.pop(DOMAIN, None)
        raise
    _LOGGER.info("RHI Multimedia loaded %s real AV rooms", len(rooms))
    return True


async def async_migrate_entry(hass: HomeAssistant, entry) -> bool:
    """Atomically replace legacy room copies with device ownership and links."""
    if entry.version > CONFIG_VERSION:
        return False
    if entry.version < CONFIG_VERSION:
        try:
            model = configuration_model(configuration_source(entry))
        except (ValueError, TypeError, KeyError, AttributeError) as exc:
            # The original entry stays intact. Do not select one copy, grant
            # authority or start a partially migrated room engine.
            _LOGGER.error("Multimedia migration requires configuration repair: %s", exc)
            return False
        data, options = dict(entry.data), dict(entry.options)
        # Options is the sole mutable configuration owner, including entries
        # originally created by the older named wizard. Do not leave a stale
        # second copy of devices/rooms in immutable initial data.
        data.pop("rooms", None)
        data.pop(DEVICE_CATALOG, None)
        options.update(model)
        for field in ("dell_displays", "enable_ux", "default_step_delay_ms"):
            if field in data:
                options.setdefault(field, data.pop(field))
        hass.config_entries.async_update_entry(
            entry, version=CONFIG_VERSION, data=data, options=options)
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
            operation = engine.command(
                room, activity, fix_it=service == "recover_activity",
                expected_activity=call.data.get("expected_activity",
                                                (activity or "") if service == "recover_activity" else None))
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
                response["room"], response["device"], response["action"], call.data.get("value"),
                **({"expected_activity": call.data["expected_activity"]} if "expected_activity" in call.data else {})))
        except asyncio.CancelledError:
            if asyncio.current_task().cancelling():
                raise
            result = "cancelled"
        return {**response, "result": result}

    async def press_button(call: ServiceCall) -> dict:
        room, button = call.data["room"], call.data["button"]
        result = await adapter.with_context(call.context, engine.press_button(room, button, expected_activity=call.data.get("expected_activity")))
        return {"room": room, "service": "press_activity_button",
                "button": button, "result": result}

    async def run_macro(call: ServiceCall) -> dict:
        room, macro = call.data["room"], call.data["macro"]
        result = await adapter.with_context(call.context, engine.run_macro(room, macro, expected_activity=call.data.get("expected_activity")))
        return {"room": room, "service": "run_activity_macro",
                "macro": macro, "result": result}

    async def inspect(call: ServiceCall) -> None:
        room = call.data["room"]
        if room not in rooms:
            raise MediaError(f"Unknown room: {room}")
        adapter.inspect(room, rooms[room])

    definitions = {
        "start_activity": (start, vol.Schema({vol.Required("room"): str, vol.Required("activity"): str})),
        "stop_activity": (stop, vol.Schema({vol.Required("room"): str, vol.Optional("expected_activity"): str})),
        "recover_activity": (recover, vol.Schema({vol.Required("room"): str, vol.Optional("expected_activity"): str})),
        "inspect_room": (inspect, vol.Schema({vol.Required("room"): str})),
        "press_activity_button": (press_button, vol.Schema({
            vol.Required("room"): str, vol.Required("button"): str, vol.Optional("expected_activity"): str})),
        "run_activity_macro": (run_macro, vol.Schema({
            vol.Required("room"): str, vol.Required("macro"): str, vol.Optional("expected_activity"): str})),
        "control_device": (control, vol.Schema({vol.Required("room"): str, vol.Required("device"): str,
                                                vol.Required("action"): str, vol.Optional("value"): object,
                                                vol.Optional("expected_activity"): str})),
    }
    for service, (handler, schema) in definitions.items():
        response = SupportsResponse.NONE if service == "inspect_room" else SupportsResponse.OPTIONAL
        hass.services.async_register(DOMAIN, service, handler, schema=schema, supports_response=response)


async def _stop_native_updates(context) -> None:
    context["_native_reconcile_closed"] = True
    cancel_native_update(context)
    tasks = [context.pop(name, None) for name in ("_native_reconcile_task", "_windows_refresh_task")]
    pending = [task for task in tasks if task is not None and not task.done()]
    for task in pending:
        task.cancel()
    if pending:
        await asyncio.gather(*pending, return_exceptions=True)


async def async_unload_entry(hass: HomeAssistant, entry) -> bool:
    """Remove service writers and native projections with the owning config entry."""
    if hass.data.get(DOMAIN, {}).get("phase") in {
        "awaiting_foundation_configuration", "legacy_foundation_review_required"
    }:
        if (hass.data[DOMAIN].get("phase") == "awaiting_foundation_configuration"
                and not await hass.config_entries.async_unload_platforms(
                    entry, [Platform.MEDIA_PLAYER, Platform.SENSOR])):
            return False
        await _stop_native_updates(hass.data[DOMAIN])
        hass.data.pop(DOMAIN, None)
        unregister_visuals_with_foundation(hass)
        return True
    context = hass.data.get(DOMAIN, {})
    context["_unloading"] = True
    if not await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        context.pop("_unloading", None)
        return False
    await _stop_native_updates(context)
    engine = context.get("engine")
    if engine:
        pending = [task for task in engine._room_tasks.values() if not task.done()]
        for task in pending:
            task.cancel()
        if pending:
            await asyncio.gather(*pending, return_exceptions=True)
        await context["adapter"].flush()
    for name in ("start_activity", "stop_activity", "recover_activity", "inspect_room",
                 "control_device", "press_activity_button", "run_activity_macro"):
        hass.services.async_remove(DOMAIN, name)
    hass.data.pop(DOMAIN, None)
    unregister_visuals_with_foundation(hass)
    return True
