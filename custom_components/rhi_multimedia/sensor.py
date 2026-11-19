"""Native HA room sensors with real entity lifecycle and unique identities."""
from __future__ import annotations

from homeassistant.components.sensor import SensorEntity
from homeassistant.core import callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers import entity_registry as er

from .const import DOMAIN, EVENT_UPDATE
from .experience import VERSION, build_room
from .foundation import selected_index


async def async_setup_entry(hass, entry, async_add_entities):
    context = hass.data[DOMAIN]
    rooms = context["engine"].rooms
    async_add_entities([RoomSensor(context, entry.entry_id, room, kind)
                        for room in rooms for kind in ("status", "sources")]
                       + [PlanningTargetsSensor(context, entry.entry_id)])


class RoomSensor(SensorEntity):
    _attr_has_entity_name = False
    _attr_should_poll = False
    # High-frequency, live presentation properties must not bloat Recorder.
    # Keep the original execution phase, activity, reservation, warnings and
    # Core event observation recorded for history and incident lifecycle.
    _unrecorded_attributes = frozenset({"source_roles", "now_playing", "audio", "activities", "commands"})

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

    @callback
    def _changed(self, room):
        # Other rooms can acquire/release a shared endpoint or group. Refresh
        # room status on every domain invalidation; inspect remains room-local.
        if self.kind == "status" or room == self.room:
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
        room = self.context["engine"].rooms[self.room]
        origin = {"schema_major": 1, "owner": "multimedia", "asset_id": self.room,
                  "event_id": "activity_attention", "title": f"{room.get('name', self.room)}: activity needs attention",
                  "qualified": True, "protected": False, "kind": "incident"}
        properties = build_room(self.context, self.hass, selected_index(self.hass), self.room)
        # Preserve existing native activity/status/source-role identities and
        # historical attributes. The state is the execution phase; direct
        # room properties replace the retired household snapshot.
        return {**{k: v for k, v in properties.items() if k not in ("id", "name", "phase", "devices", "attention_event")},
                "rhi_multimedia_room": self.room, "room_name": properties["name"],
                "backend_version": VERSION, "source_roles": properties["devices"],
                "activity": s.activity, "devices": sorted(s.devices),
                "rhi_notification_origin": origin,
                "rhi_notification_observation": properties["attention_event"]}



class PlanningTargetsSensor(SensorEntity):
    """Exact owner-owned native activity actions for Core Planning, no scheduler."""

    _attr_has_entity_name = False
    _attr_should_poll = False
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _unrecorded_attributes = frozenset({"rhi_planning_targets"})

    def __init__(self, context, entry_id: str):
        self.context = context
        self.entry_id = entry_id
        self._attr_unique_id = f"{entry_id}:planning_targets"
        self._attr_name = "RHI Multimedia Planning Targets"

    async def async_added_to_hass(self):
        self.async_on_remove(async_dispatcher_connect(self.hass, EVENT_UPDATE, self._changed))

    @callback
    def _changed(self, room):
        self.async_write_ha_state()

    @property
    def native_value(self):
        return "source_mapped"

    @property
    def extra_state_attributes(self):
        registry = er.async_get(self.hass)
        selected = selected_index(self.hass)
        rows = []
        for room_id, room in self.context["engine"].rooms.items():
            experience = build_room(self.context, self.hass, selected, room_id)
            for activity in experience["activities"]:
                unique_id = f"{self.entry_id}:{room_id}:activity:{activity['id']}"
                entity_id = registry.async_get_entity_id("button", DOMAIN, unique_id)
                if entity_id is None:
                    continue
                rows.append({"schema_major": 1, "owner": "multimedia",
                             "entity_id": entity_id, "asset_id": room_id,
                             "actions": ["press"],
                             "qualified": bool(activity["available"] and
                                               experience["control_owner"] == "multimedia" and
                                               experience["phase"] not in ("starting", "stopping"))})
        return {"rhi_planning_targets": rows}
