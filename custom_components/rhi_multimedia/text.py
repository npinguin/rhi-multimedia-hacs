"""Native WOL IPv4 destination on the existing logical Multimedia HA Device.

The one canonical Config Entry owns this setting. Editing never sends a packet.
"""
from __future__ import annotations

from homeassistant.components.text import TextEntity, TextMode
from .const import DOMAIN
from .device_preferences import LogicalDeviceSetting, configured_logical_specs


async def async_setup_entry(hass, entry, async_add_entities):
    context = hass.data[DOMAIN]
    engine = context.get("engine")
    if not engine:
        return
    async_add_entities([
        LogicalWakeDestinationText(context, entry.entry_id, asset_id, spec,
                                   "wol_destination", "Wake destination IPv4")
        for asset_id, spec in sorted(configured_logical_specs(hass, engine.rooms).items())
    ])


class LogicalWakeDestinationText(LogicalDeviceSetting, TextEntity):
    _attr_icon = "mdi:ip-network-outline"
    _attr_mode = TextMode.TEXT
    _attr_native_min = 0
    _attr_native_max = 15

    @property
    def native_value(self):
        return self._value()

    async def async_set_value(self, value: str):
        await self._set(value)
