"""Native, owner-guarded activity actions for the existing HA Scheduler.

One button represents one already configured semantic activity. It delegates
all physical actions, Foundation selection, arbitration and readback to the
single Multimedia engine. HA's last-pressed timestamp is not physical success.
"""
from __future__ import annotations

from homeassistant.components.button import ButtonEntity
from homeassistant.core import callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.dispatcher import async_dispatcher_connect, async_dispatcher_send

from .const import DOMAIN, EVENT_UPDATE
from .experience import build_room
from .foundation import selected_index


async def async_setup_entry(hass, entry, async_add_entities):
    context = hass.data[DOMAIN]
    async_add_entities([
        ActivityButton(context, entry.entry_id, room, activity)
        for room, spec in context["engine"].rooms.items()
        for activity in spec["activities"]
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
        # Publisher may have been registered before the button entity.
        async_dispatcher_send(self.hass, EVENT_UPDATE, self.room)

    @callback
    def _changed(self, room):
        # A shared source can change eligibility in more than one room.
        self.async_write_ha_state()

    @property
    def available(self):
        experience = build_room(self.context, self.hass, selected_index(self.hass), self.room)
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
