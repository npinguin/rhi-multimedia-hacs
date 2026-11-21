"""One optional Dell C8621QT native HA display entity per configured LAN display.

This is a bounded vendor-native adapter only when a real display is explicitly
configured. Foundation still selects this exact HA device before Multimedia
may assign it to a room. No duplicate TV entities or auxiliary writer.
"""
from __future__ import annotations

import asyncio
from datetime import timedelta

from homeassistant.components.media_player import MediaPlayerEntity, MediaPlayerEntityFeature
from homeassistant.components.media_player.const import MediaPlayerState
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity import DeviceInfo

from .const import DOMAIN
from .dell_c8621qt import DellC8621QT, DellProtocolError, valid_host

SCAN_INTERVAL = timedelta(seconds=30)
FEATURES = (MediaPlayerEntityFeature.TURN_ON | MediaPlayerEntityFeature.TURN_OFF
            | MediaPlayerEntityFeature.SELECT_SOURCE)


async def async_setup_entry(hass, entry, async_add_entities) -> None:
    """Create only explicitly configured displays; never discover the LAN."""
    specs = entry.options.get("dell_displays", getattr(entry, "data", {}).get("dell_displays", {}))
    if specs:
        async_add_entities([
            DellC8621QTPlayer(entry.entry_id, key, spec["name"], valid_host(spec["host"]))
            for key, spec in sorted(specs.items())
        ], update_before_add=True)


class DellC8621QTPlayer(MediaPlayerEntity):
    _attr_has_entity_name = True
    _attr_should_poll = True
    _attr_supported_features = FEATURES

    def __init__(self, entry_id: str, key: str, name: str, host: str) -> None:
        self.client = DellC8621QT(host)
        self._attr_name = name
        self._attr_unique_id = f"{entry_id}:dell:{key}"
        self._attr_available = False
        self._attr_state = MediaPlayerState.OFF
        self._attr_source_list: list[str] = []
        self._attr_source: str | None = None
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, f"dell:{entry_id}:{key}")},
            manufacturer="Dell", model="C8621QT", name=name,
            configuration_url=f"http://{host}/",
        )

    def _mark_unavailable(self) -> None:
        """Forget stale input capabilities whenever native LAN truth is lost."""
        self._attr_available = False
        self._attr_source_list = []
        self._attr_source = None

    async def async_update(self) -> None:
        try:
            power = await self.client.power_state()
            if power == 1:
                sources = await self.client.source_list()
                source = await self.client.source()
                self._attr_state = MediaPlayerState.ON
                self._attr_source_list = sources
                self._attr_source = source if source in sources else None
            else:
                self._attr_state = MediaPlayerState.STANDBY if power == 2 else MediaPlayerState.OFF
                self._attr_source = None
                self._attr_source_list = []
            self._attr_available = True
        except DellProtocolError:
            self._mark_unavailable()

    async def _confirm_power(self, on: bool) -> None:
        for _ in range(3):
            await asyncio.sleep(0.3)
            await self.async_update()
            expected = MediaPlayerState.ON if on else MediaPlayerState.STANDBY
            if self._attr_available and self._attr_state == expected:
                self.async_write_ha_state()
                return
        self.async_write_ha_state()
        raise HomeAssistantError("Dell power state not confirmed by native LAN readback")

    async def async_turn_on(self) -> None:
        try:
            await self.client.set_power(True)
            await self._confirm_power(True)
        except DellProtocolError as exc:
            self._mark_unavailable()
            self.async_write_ha_state()
            raise HomeAssistantError("Dell network power-on unavailable") from exc

    async def async_turn_off(self) -> None:
        try:
            await self.client.set_power(False)  # Suspend only, never hard-off.
            await self._confirm_power(False)
        except DellProtocolError as exc:
            self._mark_unavailable()
            self.async_write_ha_state()
            raise HomeAssistantError("Dell network standby unavailable") from exc

    async def async_select_source(self, source: str) -> None:
        try:
            await self.client.select_source(source)
            for _ in range(3):
                await asyncio.sleep(0.3)
                await self.async_update()
                if self._attr_available and self._attr_source == source:
                    self.async_write_ha_state()
                    return
            self.async_write_ha_state()
            raise HomeAssistantError("Dell input selection not confirmed by LAN readback")
        except DellProtocolError as exc:
            self._mark_unavailable()
            self.async_write_ha_state()
            raise HomeAssistantError("Dell source selection unavailable") from exc
