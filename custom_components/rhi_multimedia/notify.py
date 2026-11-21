"""Opt-in native speech NotifyEntity; Core owns all routing and consent."""
from __future__ import annotations

from homeassistant.components.notify import NotifyEntity
from homeassistant.core import callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers import entity_registry as er

from .const import DOMAIN, EVENT_UPDATE
from .engine import MediaError
from .experience import logical_asset_id


async def async_setup_entry(hass, entry, async_add_entities):
    context = hass.data[DOMAIN]
    bindings = {}
    for room, spec in context["engine"].rooms.items():
        for key, device in spec["devices"].items():
            if device.get("speech_tts_registry_id"):
                bindings.setdefault(logical_asset_id(device), []).append((room, key))
    async_add_entities([
        SpeechNotify(context, entry.entry_id, asset, tuple(sorted(roles)))
        for asset, roles in sorted(bindings.items())
    ])


class SpeechNotify(NotifyEntity):
    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_name = "Speech notifications"

    def __init__(self, context, entry_id: str, asset: str, bindings):
        self.context = context
        self.bindings = bindings
        room, role = bindings[0]
        device = context["engine"].rooms[room]["devices"][role]
        self.tts_registry_id = device["speech_tts_registry_id"]
        self._attr_unique_id = f"{entry_id}:asset:{asset}:speech"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, f"asset:{entry_id}:{asset}")})

    async def async_added_to_hass(self):
        await super().async_added_to_hass()
        self.async_on_remove(async_dispatcher_connect(self.hass, EVENT_UPDATE, self._changed))
        target = er.async_get(self.hass).async_get(self.tts_registry_id)
        if target is not None and target.domain == "tts":
            self.async_on_remove(async_track_state_change_event(
                self.hass, [target.entity_id], self._changed))

    @callback
    def _changed(self, *_args):
        self.async_write_ha_state()

    @property
    def available(self):
        return self.context["engine"].speech_room(self.bindings) is not None

    async def async_send_message(self, message: str, title: str | None = None) -> None:
        payload = f"{title} · {message}" if title else message
        try:
            await self.context["adapter"].with_context(
                self._context, self.context["engine"].speak(self.bindings, payload))
        except MediaError as exc:
            raise HomeAssistantError(str(exc)) from None
