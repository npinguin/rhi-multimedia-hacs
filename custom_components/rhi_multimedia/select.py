"""One HA-native activity selection per room; always a real engine command."""
from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.core import callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from .const import DOMAIN, EVENT_UPDATE
from .device_preferences import LogicalDeviceSetting, configured_logical_specs, POWER_MODES, ROLES


async def async_setup_entry(hass, entry, async_add_entities):
    context = hass.data[DOMAIN]
    engine = context.get("engine")
    if not engine:
        return
    entities = [RoomActivitySelect(context, entry.entry_id, room) for room in engine.rooms]
    for asset_id, spec in sorted(configured_logical_specs(hass, engine.rooms).items()):
        entities.append(LogicalSettingSelect(context, entry.entry_id, asset_id, spec,
                                             "power_mode", "Power mode", sorted(POWER_MODES)))
        if sum(1 for room in engine.rooms.values() for device in room.get("devices", {}).values()
               if device.get("asset_id", device.get("physical_id", device["entity"])) == asset_id) == 1:
            entities.append(LogicalSettingSelect(context, entry.entry_id, asset_id, spec,
                                                 "role", "Role", sorted(ROLES)))
    async_add_entities(entities)


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

    @callback
    def _changed(self, room):
        if room == self.room:
            self.async_write_ha_state()

    @property
    def available(self) -> bool:
        return not self.context["engine"].rooms[self.room].get("harmony_controller")

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
        await self.context["adapter"].with_context(getattr(self, "_context", None),
            self.context["engine"].command(self.room, None if option == "off" else option))


class LogicalSettingSelect(LogicalDeviceSetting, SelectEntity):
    def __init__(self, context, entry_id, asset_id, spec, prop, label, options):
        super().__init__(context, entry_id, asset_id, spec, prop, label)
        self._attr_options = options

    @property
    def current_option(self):
        return self._value()

    async def async_select_option(self, option: str):
        if option not in self._attr_options:
            raise ValueError("Unsupported Multimedia device option")
        await self._set(option)
