"""Editable, admin-guarded source policies on existing Multimedia logical HA devices."""
from __future__ import annotations

from homeassistant.components.switch import SwitchEntity
from .const import DOMAIN
from .device_preferences import LogicalDeviceSetting, configured_logical_specs


async def async_setup_entry(hass, entry, async_add_entities):
    context = hass.data[DOMAIN]
    engine = context.get("engine")
    if not engine:
        return
    assets = configured_logical_specs(hass, engine.rooms)
    entities = []
    for asset_id, spec in sorted(assets.items()):
        entities.append(LogicalPolicySwitch(context, entry.entry_id, asset_id, spec,
                                            "hdmi_cec_enabled", "HDMI-CEC"))
        entities.append(LogicalPolicySwitch(context, entry.entry_id, asset_id, spec,
                                            "wol_enabled", "Wake-on-LAN"))
    async_add_entities(entities)


class LogicalPolicySwitch(LogicalDeviceSetting, SwitchEntity):
    @property
    def is_on(self):
        return self._value() is True

    async def async_turn_on(self, **kwargs):
        await self._set(True)

    async def async_turn_off(self, **kwargs):
        await self._set(False)
