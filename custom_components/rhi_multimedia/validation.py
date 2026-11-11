"""Pure, strict model validation used by config flow, runtime and regression tests."""
from __future__ import annotations

import re

SLUG = re.compile(r"^[a-z][a-z0-9_]*$")
ALLOWED_ACTIONS = {
    "media_player.turn_on", "media_player.turn_off",
    "remote.turn_on", "remote.turn_off", "wake_on_lan.send_magic_packet",
}
ALLOWED_STEPS = {"source", "volume", "sound_mode", "play", "pause"}


def validate_action(action: dict) -> None:
    if not isinstance(action, dict) or action.get("action") not in ALLOWED_ACTIONS:
        raise ValueError(f"Power action is not an authorized native HA action: {action!r}")
    data, target = action.get("data", {}), action.get("target", {})
    if not isinstance(data, dict) or not isinstance(target, dict):
        raise ValueError("Power data and target must be mappings")
    if "entity_id" in target and not isinstance(target["entity_id"], str):
        raise ValueError("Power target entity_id must be a single entity")
    if action["action"] == "wake_on_lan.send_magic_packet":
        if not re.fullmatch(r"[0-9A-Fa-f:]{17}", str(data.get("mac", ""))):
            raise ValueError("Wake-on-LAN requires an explicit MAC")


def validate_rooms(rooms: dict) -> dict:
    if not isinstance(rooms, dict) or not rooms:
        raise ValueError("Configure at least one real room")
    physical_catalog = {}
    for room, spec in rooms.items():
        if not isinstance(room, str) or not SLUG.fullmatch(room) or not isinstance(spec, dict):
            raise ValueError(f"Invalid room id or specification: {room!r}")
        devices, activities = spec.get("devices"), spec.get("activities")
        if not isinstance(devices, dict) or not devices or not isinstance(activities, dict) or not activities:
            raise ValueError(f"{room}: nonempty devices and activities required")
        for key, device in devices.items():
            if not SLUG.fullmatch(str(key)) or not isinstance(device, dict):
                raise ValueError(f"{room}: invalid device {key!r}")
            entity = device.get("entity")
            if not isinstance(entity, str) or not entity.startswith(("media_player.", "remote.")):
                raise ValueError(f"{room}/{key}: requires native media_player or remote entity")
            physical = device.get("physical_id", f"{room}:{key}")
            if not isinstance(physical, str) or not physical:
                raise ValueError(f"{room}/{key}: invalid physical identity")
            prior = physical_catalog.setdefault(physical, entity)
            if prior != entity:
                raise ValueError(f"{room}/{key}: same physical_id assigned to different entities ({prior}, {entity})")
            if device.get("power_mode", "native") not in ("native", "passive"):
                raise ValueError(f"{room}/{key}: invalid power_mode")
            if not 0 < float(device.get("timeout", 35)) <= 300:
                raise ValueError(f"{room}/{key}: invalid timeout")
            for action_key in ("power_on", "power_off"):
                if action_key in device:
                    validate_action(device[action_key])
        for activity, definition in activities.items():
            if not SLUG.fullmatch(str(activity)) or not isinstance(definition, dict):
                raise ValueError(f"{room}: invalid activity {activity}")
            cast = definition.get("devices")
            if not isinstance(cast, list) or not cast or len(cast) != len(set(cast)):
                raise ValueError(f"{room}/{activity}: nonempty, unique device cast required")
            if any(key not in devices for key in cast):
                raise ValueError(f"{room}/{activity}: unknown device in cast")
            for step in definition.get("steps", []) + definition.get("stop_steps", []):
                if not isinstance(step, dict) or step.get("device") not in cast:
                    raise ValueError(f"{room}/{activity}: step uses uncast device")
                kind = step.get("type")
                if kind not in ALLOWED_STEPS:
                    raise ValueError(f"{room}/{activity}: unsupported step type {kind!r}")
                if kind in ("source", "sound_mode") and (
                    not isinstance(step.get("candidates"), list) or not step["candidates"]
                    or not all(isinstance(i, str) and i for i in step["candidates"])
                ):
                    raise ValueError(f"{room}/{activity}: {kind} requires exact HA option names")
                if kind == "volume" and not 0 <= float(step.get("level", -1)) <= 1:
                    raise ValueError(f"{room}/{activity}: volume must be within 0..1")
    return rooms
