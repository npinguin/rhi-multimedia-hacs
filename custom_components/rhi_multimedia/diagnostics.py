"""Read-only Multimedia diagnostics: selected sources, route evidence and execution.

Never export credentials, MAC addresses, power-action payloads or media metadata.
Foundation remains the technical selection authority.
"""
from __future__ import annotations

import json
from pathlib import Path

from .const import CONF_ROOMS, DOMAIN
from .foundation import selected_sources


async def async_get_config_entry_diagnostics(hass, entry):
    context = hass.data.get(DOMAIN, {})
    engine = context.get("engine")
    adapter = context.get("adapter")
    configured = entry.options.get(CONF_ROOMS, entry.data.get(CONF_ROOMS, {}))
    rooms = engine.rooms if engine else configured
    manifest = json.loads((Path(__file__).parent / "manifest.json").read_text())
    from .frontend import ux_diagnostics

    approved_sources, origin = selected_sources(hass)
    selected = {(source.concept, source.entity_id): source for source in approved_sources}
    selection_error = None if selected else origin

    sources, routes = {}, {}
    if engine and adapter:
        for room, spec in rooms.items():
            sources[room] = adapter.readback(spec)
            for key, device in spec["devices"].items():
                candidate = selected.get((device.get("foundation_concept"), device["entity"]))
                approved = bool(candidate and candidate.candidate_id == device.get("foundation_candidate_id"))
                sources[room][key].update({
                    "role": device.get("role"),
                    "physical_id": device.get("physical_id"),
                    "asset_id": device.get("asset_id", device.get("physical_id")),
                    "hdmi_cec_enabled": device.get("hdmi_cec_enabled") is True,
                    "native_readback_quality": adapter.native_readback_quality(device),
                    "foundation_concept": device.get("foundation_concept"),
                    "foundation_candidate_id": device.get("foundation_candidate_id"),
                    "foundation_approved": approved,
                    "integration": candidate.integration if approved else None,
                    "passive": adapter.is_passive(device),
                    "startable": approved and adapter.can_start(device, candidate),
                })
            routes[room] = {
                activity: {
                    "devices": list(definition["devices"]),
                    # The activity's producer-approved physical CEC graph,
                    # not an inferred connection or confirmed hardware action.
                    "cec_links": [
                        {key: link[key] for key in (
                            "source", "target", "verified_link",
                            "skip_power_on", "skip_power_off", "skip_source")}
                        for link in definition.get("cec_links", [])
                    ],
                    "inputs": [{"device": step["device"], "type": step["type"],
                                "candidates": list(step["candidates"]),
                                **adapter.preview_route(spec["devices"][step["device"]], step)}
                               for step in definition.get("steps", [])
                               if step["type"] in ("source", "sound_mode")],
                }
                for activity, definition in spec["activities"].items()
            }

    execution = {room: engine.snapshot(room) for room in engine.rooms} if engine else {}
    target_states = ({
        room: engine.target_state(room) if engine.states[room].activity else None
        for room in engine.rooms
    } if engine else {})
    return {
        "ux": ux_diagnostics(hass, entry),
        "identity": {"domain": DOMAIN, "version": manifest["version"],
                     "config_entry_id": entry.entry_id},
        "health": {"loaded": engine is not None, "phase": context.get("phase", "loaded" if engine else "not_loaded"),
                   "rooms": len(engine.rooms) if engine else 0,
                   "attention_rooms": sum(state["phase"] in ("error", "interrupted", "partial")
                                          for state in execution.values())},
        "configuration": {"room_ids": sorted(rooms),
                          "harmony_ownership": {room: spec["harmony_controller"] for room, spec in rooms.items()
                                                if spec.get("harmony_controller")},
                          "configured_activities": {key: sorted(v.get("activities", {}))
                                                    for key, v in rooms.items()},
                          "activity_routes": routes},
        "build_handoff": {"foundation": "required for physical command authorization",
                          "selection_error": selection_error},
        "execution": execution,
        "target_readback": target_states,
        "source_readback": sources,
        "last_controls": dict(adapter.last_controls) if adapter else {},
        "last_attempts": {room: dict(value) for room, value in engine.last_attempts.items()} if engine else {},
        "attention_events": {room: adapter.attention_observation(room) for room in rooms} if adapter else {},
        "publication": {"platforms": ["sensor", "select"], "physical_devices_duplicated": False},
    }
