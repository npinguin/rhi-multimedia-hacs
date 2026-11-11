"""Native Home Assistant physical writer with real state/readback and persistence."""
from __future__ import annotations

import asyncio
from typing import Any

from homeassistant.helpers.dispatcher import async_dispatcher_send

from .const import DOMAIN, EVENT_UPDATE
from .engine import MediaError


class HAAdapter:
    def __init__(self, hass, store):
        self.hass = hass
        self.store = store
        self.persisted: dict[str, dict] = {}
        self.source_snapshots: dict[str, dict] = {}

    def state(self, entity: str) -> str:
        state = self.hass.states.get(entity)
        return state.state if state else "unavailable"

    async def _call(self, action: str, data: dict | None = None,
                    target: dict | None = None) -> None:
        domain, service = action.split(".", 1)
        payload = {**(data or {}), **(target or {})}
        await self.hass.services.async_call(domain, service, payload, blocking=True)

    async def power(self, device: dict, on: bool) -> None:
        explicit = device.get("power_on" if on else "power_off")
        if explicit:
            await self._call(explicit["action"], explicit.get("data"), explicit.get("target"))
        else:
            entity_domain = device["entity"].split(".", 1)[0]
            await self._call(f"{entity_domain}.turn_{'on' if on else 'off'}",
                             target={"entity_id": device["entity"]})

    async def wait(self, entity: str, wanted: list[str], seconds: float) -> bool:
        loop = asyncio.get_running_loop()
        deadline = loop.time() + seconds
        while True:
            if self.state(entity) in wanted:
                return True
            remaining = deadline - loop.time()
            if remaining <= 0:
                return False
            await asyncio.sleep(min(.4, remaining))

    def _select(self, device: dict, candidates: list[str], attribute: str) -> str:
        obj = self.hass.states.get(device["entity"])
        options = list(obj.attributes.get(attribute, [])) if obj else []
        norm = {x.strip().casefold(): x for x in options if isinstance(x, str)}
        matches = {norm[v.strip().casefold()] for v in candidates
                   if v.strip().casefold() in norm}
        if len(matches) == 1:
            return next(iter(matches))
        if len(matches) > 1:
            raise MediaError(f"{device['entity']}: ambiguous {attribute} {sorted(matches)}; "
                             "configure one actual source")
        raise MediaError(f"{device['entity']}: no matching {attribute} among {candidates}; "
                         f"HA offers {options}")

    async def _wait_attr(self, entity: str, attribute: str, value: Any,
                         timeout: float, tolerance: float = 0) -> bool:
        loop = asyncio.get_running_loop()
        deadline = loop.time() + timeout
        while True:
            obj = self.hass.states.get(entity)
            actual = obj.attributes.get(attribute) if obj else None
            try:
                matched = abs(actual - value) <= tolerance if tolerance else actual == value
            except TypeError:
                matched = False
            if matched:
                return True
            remaining = deadline - loop.time()
            if remaining <= 0:
                return False
            await asyncio.sleep(min(.4, remaining))

    async def configure(self, device: dict, operation: dict) -> None:
        entity = device["entity"]
        kind = operation["type"]
        if kind in ("source", "sound_mode"):
            attribute = "source" if kind == "source" else "sound_mode"
            selected = self._select(device, operation["candidates"], f"{attribute}_list")
            service = "select_source" if kind == "source" else "select_sound_mode"
            await self._call(f"media_player.{service}", {attribute: selected}, {"entity_id": entity})
            if not await self._wait_attr(entity, attribute, selected, float(operation.get("timeout", 12))):
                raise MediaError(f"{entity}: {attribute} {selected!r} not confirmed by readback")
        elif kind == "volume":
            volume = float(operation["level"])
            await self._call("media_player.volume_set", {"volume_level": volume}, {"entity_id": entity})
            if not await self._wait_attr(entity, "volume_level", volume, 8, tolerance=.035):
                raise MediaError(f"{entity}: volume {volume} was not confirmed")
        else:
            await self._call("media_player.media_play" if kind == "play" else "media_player.media_pause",
                             target={"entity_id": entity})
            if not await self.wait(entity, ["playing"] if kind == "play" else ["paused"], 10):
                raise MediaError(f"{entity}: media transport did not confirm {kind}")

    async def report(self, room: str, state: dict) -> None:
        self.persisted[room] = dict(state)
        self.store.async_delay_save(lambda: self.persisted, 1)
        async_dispatcher_send(self.hass, EVENT_UPDATE, room)

    def inspect(self, room: str, spec: dict) -> dict:
        snapshot = {}
        for key, device in spec["devices"].items():
            obj = self.hass.states.get(device["entity"])
            snapshot[key] = {
                "entity": device["entity"],
                "state": obj.state if obj else "unavailable",
                "sources": list(obj.attributes.get("source_list", [])) if obj else [],
                "sound_modes": list(obj.attributes.get("sound_mode_list", [])) if obj else [],
                "current_source": obj.attributes.get("source") if obj else None,
            }
        self.source_snapshots[room] = snapshot
        async_dispatcher_send(self.hass, EVENT_UPDATE, room)
        return snapshot
