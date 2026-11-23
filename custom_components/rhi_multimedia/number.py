"""Validated native Home Assistant timing property for a logical Multimedia device."""
from __future__ import annotations

from homeassistant.components.number import NumberEntity
from .const import DOMAIN
from .device_preferences import LogicalDeviceSetting, configured_logical_specs


async def async_setup_entry(hass, entry, async_add_entities):
    context = hass.data[DOMAIN]
    engine = context.get("engine")
    if not engine:
        return
    assets = configured_logical_specs(hass, engine.rooms)
    async_add_entities([
        LogicalDelayNumber(context, entry.entry_id, asset_id, spec,
                           "post_power_on_delay_ms", "Power-on delay")
        for asset_id, spec in sorted(assets.items())
    ] + [
        LogicalWakePortNumber(context, entry.entry_id, asset_id, spec,
                              "wol_port", "Wake UDP port")
        for asset_id, spec in sorted(assets.items())
    ])


class LogicalDelayNumber(LogicalDeviceSetting, NumberEntity):
    _attr_native_min_value = 0
    _attr_native_max_value = 30000
    _attr_native_step = 100
    _attr_native_unit_of_measurement = "ms"

    @property
    def native_value(self):
        return self._value()

    async def async_set_native_value(self, value):
        if type(value) not in (int, float) or not float(value).is_integer():
            raise ValueError("Power-on delay must be integer milliseconds")
        await self._set(int(value))


class LogicalWakePortNumber(LogicalDeviceSetting, NumberEntity):
    """Native WOL UDP destination port; no packet is sent by changing it."""

    _attr_native_min_value = 1
    _attr_native_max_value = 65535
    _attr_native_step = 1
    _attr_icon = "mdi:numeric"

    @property
    def native_value(self):
        return self._value()

    async def async_set_native_value(self, value):
        if type(value) not in (int, float) or not float(value).is_integer():
            raise ValueError("Wake UDP port must be an integer")
        await self._set(int(value))
