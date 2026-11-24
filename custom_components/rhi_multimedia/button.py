"""Native, owner-guarded activity actions for the existing HA Scheduler.

One button represents one already configured semantic activity. It delegates
all physical actions, Foundation selection, arbitration and readback to the
single Multimedia engine. HA's last-pressed timestamp is not physical success.
"""
from __future__ import annotations

from homeassistant.components.button import ButtonEntity
from homeassistant.core import callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from .const import DOMAIN, EVENT_UPDATE
from .experience import NativeUpdate, RoomUpdate, build_room, queue_native_update
from .foundation import selected_index
from .device_preferences import (
    LogicalDeviceSetting, configured_logical_specs, async_test_asset_wol,
    asset_current_value, verified_asset_macs,
)


async def async_setup_entry(hass, entry, async_add_entities):
    context = hass.data[DOMAIN]
    async_add_entities([
        ActivityButton(context, entry.entry_id, room, activity)
        for room, spec in context["engine"].rooms.items()
        for activity in spec["activities"]
    ] + [
        LogicalWakeTestButton(context, entry.entry_id, asset_id, spec)
        for asset_id, spec in sorted(configured_logical_specs(hass, context["engine"].rooms).items())
    ])


class ActivityButton(ButtonEntity):
    _attr_has_entity_name = False
    _attr_should_poll = False
    _attr_icon = "mdi:play-circle-outline"

    def __init__(self, context, entry_id: str, room: str, activity: str):
        self.context = context
        self.room = room
        self.activity = activity
        self._attr_unique_id = f"{entry_id}:{room}:activity:{activity}"
        spec = context["engine"].rooms[room]
        title = spec["activities"][activity].get("name") or activity.replace("_", " ").title()
        self._attr_name = f"RHI Multimedia {spec.get('name') or room.replace('_', ' ').title()} · {title}"

    async def async_added_to_hass(self):
        self.async_on_remove(async_dispatcher_connect(self.hass, EVENT_UPDATE, self._changed))
        # Planning may have been registered before this button. Scope and
        # bundle registration refreshes rather than broadcasting every button.
        queue_native_update(self.hass, self.context, None, {self.room})

    @callback
    def _changed(self, update):
        if isinstance(update, NativeUpdate) and self.room not in update.rooms:
            return
        self._native_update = update if isinstance(update, (NativeUpdate, RoomUpdate)) else None
        try:
            self.async_write_ha_state()
        finally:
            self._native_update = None

    @property
    def available(self):
        update = getattr(self, "_native_update", None)
        experience = (update.room_model(self.context, self.hass, self.room) if update else
                      build_room(self.context, self.hass, selected_index(self.hass), self.room))
        target = next((a for a in experience["activities"] if a["id"] == self.activity), None)
        return bool(target and target["available"] and
                    experience["control_owner"] == "multimedia" and
                    experience["phase"] not in ("starting", "stopping"))

    async def async_press(self):
        if not self.available:
            raise HomeAssistantError("Multimedia activity is not currently authorized or available")
        engine = self.context["engine"]
        adapter = self.context["adapter"]
        # HA sets each service call's Context on the entity immediately before
        # async_press. Carry it through to each Foundation-selected source, so
        # direct presses keep native HA per-entity user permissions.
        result = await adapter.with_context(getattr(self, "_context", None),
                                            engine.command(self.room, self.activity))
        if result["phase"] != "active":
            raise HomeAssistantError("Multimedia activity was not confirmed by native readback")

    @property
    def extra_state_attributes(self):
        return {"rhi_multimedia_room": self.room, "activity_id": self.activity,
                "readback_entity": "RHI Multimedia room status"}


class LogicalWakeTestButton(LogicalDeviceSetting, ButtonEntity):
    """Explicit single-packet test via the existing exact-source HA adapter.

    Native HA state after submission is evidence only, not proof of power-on.
    """
    _attr_icon = "mdi:power-cycle"

    def __init__(self, context, entry_id, asset_id, spec):
        super().__init__(context, entry_id, asset_id, spec,
                         "wol_enabled", "Test Wake-on-LAN")
        # Keep entity ID stable and unique independently of the config toggle.
        self._attr_unique_id = f"{entry_id}:asset:{asset_id}:wol_test"

    @property
    def available(self):
        engine = self.context.get("engine")
        return bool(engine and
                    asset_current_value(engine.rooms, self.asset_id, "wol_enabled") is True and
                    verified_asset_macs(self.hass, self.context, self.asset_id))

    @property
    def extra_state_attributes(self):
        last = self.context.get("wol_tests", {}).get(self.asset_id, {})
        return {
            "result": last.get("result", "not_tested"),
            "submitted_at": last.get("at"),
            "native_before": last.get("native_before"),
            "native_after_submit": last.get("native_after_submit"),
            "native_readback_quality": last.get("native_readback_quality"),
            "observation_window_seconds": last.get("observation_window_seconds"),
            "note": "Native readback is not independent physical wake confirmation",
        }

    async def async_press(self):
        if not self.available:
            raise HomeAssistantError(
                "Wake-on-LAN not enabled or native MAC/authorization missing; review Multimedia Settings")
        result = await async_test_asset_wol(
            self.hass, self.context, self.asset_id,
            command_context=getattr(self, "_context", None))
        self.async_write_ha_state()
        return result
