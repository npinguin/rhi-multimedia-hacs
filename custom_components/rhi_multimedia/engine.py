"""Activity orchestration, intentionally independent of the Home Assistant frontend.

A command always has one owner. Device state, not successful service submission,
controls the outcome. Shared devices are protected across rooms.
"""
from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import Any, Protocol


class MediaError(Exception):
    """An activity could not achieve its required physical state."""


class Adapter(Protocol):
    async def power(self, device: dict, on: bool) -> None: ...
    async def configure(self, device: dict, operation: dict) -> None: ...
    async def wait(self, entity: str, wanted: list[str], seconds: float) -> bool: ...
    def state(self, entity: str) -> str: ...
    async def report(self, room: str, state: dict) -> None: ...


@dataclass
class RoomState:
    activity: str | None = None
    phase: str = "idle"
    error: str = ""
    progress: str = ""
    warnings: list[str] = field(default_factory=list)
    devices: set[str] = field(default_factory=set)


class ActivityEngine:
    def __init__(self, rooms: dict, adapter: Adapter):
        self.rooms = rooms
        self.adapter = adapter
        self.states = {room: RoomState() for room in rooms}
        self._room_tasks: dict[str, asyncio.Task] = {}
        self._room_locks = {room: asyncio.Lock() for room in rooms}
        self._device_locks: dict[str, asyncio.Lock] = {}

    def _physical(self, room: str, key: str) -> str:
        return self.rooms[room]["devices"][key].get("physical_id", f"{room}:{key}")

    def _owners(self, physical_id: str, excluding: str) -> bool:
        return any(self._physical(r, k) == physical_id
                   for r, s in self.states.items() if r != excluding
                   for k in s.devices)

    async def _publish(self, room: str) -> None:
        s = self.states[room]
        await self.adapter.report(room, {"phase": s.phase, "activity": s.activity,
            "error": s.error, "progress": s.progress,
            "warnings": list(s.warnings), "devices": sorted(s.devices)})

    async def _power(self, room: str, key: str, on: bool) -> None:
        device = self.rooms[room]["devices"][key]
        physical_id = self._physical(room, key)
        if device.get("power_mode") == "passive":
            if on and self.adapter.state(device["entity"]) not in ("on", "playing", "paused", "idle"):
                raise MediaError(f"{key}: passive media endpoint {device['entity']} is not ready")
            return
        lock = self._device_locks.setdefault(physical_id, asyncio.Lock())
        async with lock:
            if not on and self._owners(physical_id, room):
                return
            entity = device["entity"]
            current = self.adapter.state(entity)
            if on and current in ("on", "playing", "paused", "idle"):
                return
            if not on and current == "off":
                return
            await self.adapter.power(device, on)
            target = device.get("on_states", ["on", "playing", "paused", "idle"] if on else ["off", "unavailable"])
            timeout = float(device.get("timeout", 40 if on else 15))
            if not await self.adapter.wait(entity, target, timeout):
                raise MediaError(f"{key}: {entity} did not reach {target} after {timeout:g}s (actual: {self.adapter.state(entity)})")

    async def command(self, room: str, activity: str | None) -> None:
        """Last-command-wins per room; cancel in-flight sequence before new one."""
        if room not in self.rooms:
            raise MediaError(f"Unknown room: {room}")
        if activity is not None and activity not in self.rooms[room]["activities"]:
            raise MediaError(f"Unknown activity {room}/{activity}")
        async with self._room_locks[room]:
            previous = self._room_tasks.get(room)
            if previous and not previous.done():
                previous.cancel()
                try:
                    await previous
                except asyncio.CancelledError:
                    pass
            task = asyncio.create_task(self._run(room, activity))
            self._room_tasks[room] = task
        await task

    async def _run(self, room: str, activity: str | None) -> None:
        s = self.states[room]
        spec = self.rooms[room]
        old_activity = s.activity
        old_set = set(s.devices)
        new_set = set(spec["activities"][activity]["devices"]) if activity else set()
        s.phase = "starting" if activity else "stopping"
        s.activity = activity
        s.error = ""
        s.warnings.clear()
        await self._publish(room)
        try:
            # Reserve all targets first, protecting shared devices from other room stops.
            s.devices = old_set | new_set
            # Establish newly needed devices in declared dependency order.
            if activity:
                for key in spec["activities"][activity]["devices"]:
                    s.progress = f"Power/readback: {key}"
                    await self._publish(room)
                    await self._power(room, key, True)
                for index, step in enumerate(spec["activities"][activity].get("steps", []), 1):
                    key = step["device"]
                    physical = self._physical(room, key)
                    if step["type"] in ("source", "sound_mode") and self._owners(physical, room):
                        raise MediaError(
                            f"{room}/{key}: physical device {physical} is currently claimed "
                            "by another room; refusing source takeover"
                        )
                    s.progress = f"Step {index}: {step['type']} {key}"
                    await self._publish(room)
                    await self.adapter.configure(spec["devices"][key], step)
            # Full stop can perform explicit provider actions (e.g. stop music)
            # but ordinary activity switches never run the old stop sequence.
            if not activity and old_activity in spec["activities"]:
                for step in spec["activities"][old_activity].get("stop_steps", []):
                    try:
                        await self.adapter.configure(spec["devices"][step["device"]], step)
                    except Exception as exc:
                        s.warnings.append(f"Stop step {step['type']} failed: {exc}")
                        await self._publish(room)
            # After the new path is working, retire unused devices in reverse order.
            retained_physical = {self._physical(room, key) for key in new_set}
            failed_retire: set[str] = set()
            for key in reversed(list(spec["devices"])):
                if key in old_set - new_set:
                    if self._physical(room, key) in retained_physical:
                        s.devices.discard(key)
                        continue
                    s.progress = f"Power down: {key}"
                    await self._publish(room)
                    try:
                        await self._power(room, key, False)
                    except Exception as exc:
                        failed_retire.add(key)
                        s.warnings.append(f"Power down {key}: {exc}")
                    else:
                        s.devices.discard(key)
            s.devices = new_set | failed_retire
            s.phase = ("partial" if activity else "error") if failed_retire else ("active" if activity else "idle")
            s.error = "; ".join(s.warnings) if failed_retire else ""
            s.progress = "Check remaining devices" if failed_retire else ("Ready" if activity else "Off")
            await self._publish(room)
        except asyncio.CancelledError:
            s.phase = "interrupted"
            s.progress = "New command interrupted previous sequence"
            await self._publish(room)
            raise
        except Exception as exc:
            s.phase = "error"
            s.error = str(exc)
            s.progress = "Correct the failing device/input or stop the activity"
            await self._publish(room)
            raise

    def snapshot(self, room: str) -> dict:
        s = self.states[room]
        return {"phase": s.phase, "activity": s.activity, "error": s.error,
                "progress": s.progress, "devices": sorted(s.devices)}
