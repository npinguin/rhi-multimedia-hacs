"""One HA-native activity selection per room; always a real engine command."""
from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from .const import DOMAIN, EVENT_UPDATE


async def async_setup_entry(hass, entry, async_add_entities):
    context = hass.data[DOMAIN]
    async_add_entities([RoomActivitySelect(context, entry.entry_id, room)
                        for room in context["engine"].rooms])


class RoomActivitySelect(SelectEntity):
    _attr_has_entity_name = False
    _attr_should_poll = False

    def __init__(self, context, entry_id: str, room: str):
        self.context = context
        self.room = room
        self._attr_unique_id = f"{entry_id}:{room}:activity"
        self._attr_name = f"RHI Multimedia {room.replace('_',' ').title()} Activity"
        self._attr_options = ["off", *context["engine"].rooms[room]["activities"]]

    async def async_added_to_hass(self):
        self.async_on_remove(async_dispatcher_connect(self.hass, EVENT_UPDATE, self._changed))

    def _changed(self, room):
        if room == self.room:
            self.async_write_ha_state()

    @property
    def current_option(self) -> str:
        return self.context["engine"].states[self.room].activity or "off"

    @property
    def extra_state_attributes(self):
        state = self.context["engine"].states[self.room]
        return {"phase": state.phase, "error": state.error}

    async def async_select_option(self, option: str) -> None:
        if option not in self._attr_options:
            raise ValueError(f"Unknown activity: {option}")
        await self.context["engine"].command(self.room, None if option == "off" else option)
