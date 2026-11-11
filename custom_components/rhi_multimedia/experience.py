"""Authoritative, read-only Multimedia experience projection for Premium UX.

No discovery, no entity-ID guessing and no optimistic command acknowledgement.
Foundation selects devices; the Multimedia configuration owns logical AV meaning.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

CONTRACT = "RHI_MULTIMEDIA_EXPERIENCE_V1"
MANIFEST = Path(__file__).with_name("manifest.json")


def _attrs(state: Any) -> dict:
    return dict(getattr(state, "attributes", {}) or {}) if state else {}


def _valid_selected(selected: dict, device: dict) -> bool:
    identity = (device.get("foundation_concept"), device.get("entity"))
    candidate = selected.get(identity)
    return bool(candidate and getattr(candidate, "candidate_id", None) == device.get("foundation_candidate_id"))


def _device_model(key: str, device: dict, hass: Any, selected: dict) -> dict:
    entity_id = device["entity"]
    state = hass.states.get(entity_id)
    attrs = _attrs(state)
    native = str(getattr(state, "state", "unavailable") or "unavailable")
    available = native not in ("unknown", "unavailable")
    bound = _valid_selected(selected, device)
    role = str(device.get("role") or "player")
    title = attrs.get("friendly_name") or device.get("name") or key.replace("_", " ").title()
    level = attrs.get("volume_level")
    return {
        "key": key,
        "name": str(title),
        "role": role,
        "concept": device.get("foundation_concept"),
        "foundation_approved": bound,
        "entity_id": entity_id,
        "physical_id": str(device.get("physical_id") or entity_id),
        "state": native,
        "available": available,
        "source": attrs.get("source"),
        "source_list": list(attrs.get("source_list") or []),
        "volume_level": level if isinstance(level, (int, float)) else None,
        "is_volume_muted": attrs.get("is_volume_muted") if isinstance(attrs.get("is_volume_muted"), bool) else None,
        "media_title": attrs.get("media_title"),
        "media_artist": attrs.get("media_artist"),
        "media_album_name": attrs.get("media_album_name"),
        "entity_picture": attrs.get("entity_picture"),
        "playing": native == "playing",
    }


def _activity_model(key: str, definition: dict, devices: dict, state: Any) -> dict:
    cast = list(definition.get("devices") or [])
    unresolved = [item for item in cast
                  if item not in devices or not devices[item]["foundation_approved"]
                  or not devices[item]["available"]]
    return {
        "id": key,
        "name": str(definition.get("name") or key.replace("_", " ").title()),
        "device_keys": cast,
        "available": not unresolved,
        "disabled_reason": "Source not available or Foundation selection changed" if unresolved else "",
        "active": state.activity == key,
        "routes": [
            {
                "device_key": step.get("device"),
                "type": step.get("type"),
                "selected": (step.get("candidates") or [None])[0],
            }
            for step in definition.get("steps", [])
            if step.get("type") in ("source", "sound_mode")
        ],
    }


def build_experience(context: dict, hass: Any, selected: dict, revision: int = 1) -> dict:
    """Build one bounded view of backend-owned state and native source readback."""
    engine = context["engine"]
    rooms = []
    for key, spec in engine.rooms.items():
        state = engine.states[key]
        devices = {name: _device_model(name, device, hass, selected)
                   for name, device in spec["devices"].items()}
        activities = [_activity_model(name, definition, devices, state)
                      for name, definition in spec["activities"].items()]
        active_cast = set(state.devices)
        playing_devices = [device for name, device in devices.items()
                           if name in active_cast and device["playing"]]
        playing_devices.sort(key=lambda device: device["role"] != "player")
        playing = playing_devices[0] if playing_devices else None
        amp = next((device for device in devices.values()
                    if device["role"] == "receiver"), None)
        if amp is None:
            amp = next((device for device in devices.values()
                        if device["role"] == "player" and device["volume_level"] is not None), None)
        bound = all(device["foundation_approved"] for device in devices.values())
        requested = bool(state.activity)
        active = requested and state.phase in ("active", "partial")
        needs_attention = (state.phase in ("error", "partial", "interrupted") or not bound
                           or (active and any(not devices[item]["available"] for item in state.devices
                                              if item in devices)))
        busy = state.phase in ("starting", "stopping")
        rooms.append({
            "id": key,
            "name": str(spec.get("name") or key.replace("_", " ").title()),
            "area_id": spec.get("area_id"),
            "phase": state.phase,
            "activity_id": state.activity,
            "activity_name": next((item["name"] for item in activities
                                   if item["id"] == state.activity), None),
            "progress": state.progress,
            "error": state.error,
            "warnings": list(state.warnings),
            "foundation_approved": bound,
            "active": active,
            "playing": bool(playing),
            "now_playing": ({
                "device_key": playing["key"],
                "title": playing["media_title"],
                "artist": playing["media_artist"],
                "album": playing["media_album_name"],
                "picture": playing["entity_picture"],
            } if playing else None),
            "audio": ({
                "device_key": amp["key"],
                "name": amp["name"],
                "volume_level": amp["volume_level"],
                "muted": amp["is_volume_muted"],
                "available": amp["available"],
            } if amp else None),
            "devices": list(devices.values()),
            "activities": activities,
            "commands": {
                "stop": {"enabled": requested and bound and not busy,
                         "reason": "" if bound else "Foundation selection changed"},
                "recover": {"enabled": requested and bound and state.phase in ("error", "partial", "interrupted"),
                            "reason": "" if bound else "Foundation selection changed"},
            },
            "attention": bool(needs_attention),
        })
    rooms.sort(key=lambda room: (not room["active"], room["name"].casefold()))
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    return {
        "contract": CONTRACT,
        "schema_version": 1,
        "revision": revision,
        "backend_version": manifest["version"],
        "rooms": rooms,
        "summary": {
            "room_count": len(rooms),
            "active_rooms": sum(bool(room["active"]) for room in rooms),
            "playing_rooms": sum(bool(room["playing"]) for room in rooms),
            "attention_rooms": sum(bool(room["attention"]) for room in rooms),
        },
    }
