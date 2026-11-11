"""Native HA room sensors with real entity lifecycle and unique identities."""
from __future__ import annotations

from homeassistant.components.sensor import SensorEntity
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity import EntityCategory

from .const import DOMAIN, EVENT_UPDATE


async def async_setup_entry(hass, entry, async_add_entities):
    context = hass.data[DOMAIN]
    rooms = context["engine"].rooms
    async_add_entities([RoomSensor(context, entry.entry_id, room, kind)
                        for room in rooms for kind in ("status", "sources")])


class RoomSensor(SensorEntity):
    _attr_has_entity_name = False
    _attr_should_poll = False

    def __init__(self, context, entry_id: str, room: str, kind: str):
        self.context = context
        self.room = room
        self.kind = kind
        self._attr_unique_id = f"{entry_id}:{room}:{kind}"
        self._attr_name = f"RHI Multimedia {room.replace('_',' ').title()} {kind.title()}"
        if kind == "sources":
            self._attr_entity_category = EntityCategory.DIAGNOSTIC

    async def async_added_to_hass(self):
        self.async_on_remove(async_dispatcher_connect(self.hass, EVENT_UPDATE, self._changed))

    def _changed(self, room):
        if room == self.room:
            self.async_write_ha_state()

    @property
    def native_value(self):
        if self.kind == "sources":
            return "inspected" if self.room in self.context["adapter"].source_snapshots else "not_inspected"
        return self.context["engine"].states[self.room].phase

    @property
    def extra_state_attributes(self):
        if self.kind == "sources":
            return {"devices": self.context["adapter"].source_snapshots.get(self.room, {})}
        s = self.context["engine"].states[self.room]
        return {"activity": s.activity, "progress": s.progress, "error": s.error,
                "warnings": list(s.warnings), "devices": sorted(s.devices)}
