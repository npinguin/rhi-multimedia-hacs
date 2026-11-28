"""Native HA room sensors with real entity lifecycle and unique identities."""
from __future__ import annotations

from homeassistant.components.sensor import SensorEntity
from homeassistant.core import callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect, async_dispatcher_send
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers.entity import DeviceInfo, EntityCategory
from homeassistant.helpers import entity_registry as er

from .const import DOMAIN, EVENT_UPDATE
from .experience import (VERSION, build_room, NativeUpdate, RoomUpdate,
                         queue_native_update, cancel_native_update)
from .foundation import authorized_source, selected_index, SELECTION_CHANGED_EVENT, projection_source_reads
from .source_discovery import logical_source_type, related_source_entities, logical_av_catalog
from .validation import (DEVICE_CATALOG, DEVICE_LABEL, logical_asset_id,
                         live_related_source, native_availability, native_state)


async def async_setup_entry(hass, entry, async_add_entities):
    """Publish both configured AV rooms and read-only discovered logical devices.

    A Foundation structural event may add devices. Native runtime state updates
    only invalidate property values; neither requires a second HA source scan.
    """
    context = hass.data[DOMAIN]
    engine = context.get("engine")
    rooms = engine.rooms if engine else {}
    context.setdefault("hass", hass)
    assets = logical_asset_projection_specs(hass, rooms)
    projected = {
        key: LogicalAssetSensor(context, entry.entry_id, key, value)
        for key, value in sorted(assets.items())
    }
    native_links = {
        key: NativeSourceSensor(context, entry.entry_id, key, value)
        for key, value in sorted(assets.items())
    }
    room_sensors = [RoomSensor(context, entry.entry_id, room, kind)
                    for room in rooms for kind in ("status", "sources")]
    planning = [PlanningTargetsSensor(context, entry.entry_id)] if engine else []
    async_add_entities(room_sensors + list(projected.values()) +
                       list(native_links.values()) + planning)

    # A no-room setup still receives bounded native state readback for its
    # supported, discovered logical AV devices. Configured rooms already
    # subscribe to their owned sources in the existing integration runtime.
    watched_ids: tuple[str, ...] = ()
    primary_ids: set[str] = set()
    cancel_watch = None

    @callback
    def source_changed(event):
        entity = event.data.get("entity_id")
        if entity not in primary_ids:
            # Companion-only links expose availability (and a native notify
            # label), not their unrelated sensor values or attributes.
            before, after = event.data.get("old_state"), event.data.get("new_state")
            if before is not None and after is not None:
                changed = native_availability(before) != native_availability(after)
                if entity.startswith("notify."):
                    changed = changed or getattr(before, "name", None) != getattr(after, "name", None)
                if not changed:
                    return
        queue_native_update(hass, context, entity,
                            context.get("native_projection_rooms", {}).get(entity, ()))

    def refresh_watch():
        nonlocal watched_ids, cancel_watch
        # Configured primary endpoints are already watched by the activity
        # engine. Watch only other bounded native companions here; no scan.
        engine_watched = set()
        if engine:
            adapter = context.get("adapter")
            with projection_source_reads(hass):
                for room in rooms.values():
                    for device in room.get("devices", {}).values():
                        engine_watched.add(device["entity"])
                        remote = adapter.paired_remote(device) if adapter else None
                        if remote:
                            engine_watched.add(remote["entity"])
        # Build the dependency index only on structural changes. Tombstoned
        # discovered assets retain identity, not their obsolete subscriptions.
        dependencies = {}
        primary_ids.clear()
        for asset in projected.values():
            if not asset.source_published:
                continue
            primary_ids.add(asset.device["entity"])
            for entity in {asset.device["entity"], *(link["entity_id"] for link in asset.related_entities)}:
                dependencies.setdefault(entity, set()).update(asset.room_ids)
        context["native_projection_rooms"] = dependencies
        ids = tuple(sorted(set(dependencies) - engine_watched))
        if ids == watched_ids:
            return
        if cancel_watch is not None:
            cancel_watch()
        watched_ids = ids
        cancel_watch = (async_track_state_change_event(hass, ids, source_changed)
                        if ids else None)

    @callback
    def foundation_changed(event):
        if event.data.get("domain_id") != "multimedia":
            return
        current = logical_asset_projection_specs(hass, rooms)
        additions = []
        for asset_id, spec in current.items():
            if asset_id in projected:
                projected[asset_id].update_spec(spec)
                native_links[asset_id].update_spec(spec)
            else:
                entity = LogicalAssetSensor(context, entry.entry_id, asset_id, spec)
                native_link = NativeSourceSensor(context, entry.entry_id, asset_id, spec)
                projected[asset_id] = entity
                native_links[asset_id] = native_link
                additions.extend((entity, native_link))
        if additions:
            async_add_entities(additions)
        # Keep stable native HA entity/device identity when a published
        # candidate disappears. No registry deletion or runtime rebuild.
        for asset_id, entity in projected.items():
            if asset_id not in current:
                entity.mark_unpublished()
                native_links[asset_id].mark_unpublished()
        # Share the single discovery result before the single structural
        # publication; no second Foundation catalog traversal in media_player.
        refresh_players = context.get("refresh_logical_players")
        if refresh_players:
            refresh_players(current)
        refresh_watch()
        async_dispatcher_send(hass, EVENT_UPDATE, RoomUpdate("*"))

    refresh_watch()
    if getattr(hass, "bus", None) is not None:
        entry.async_on_unload(hass.bus.async_listen(
            SELECTION_CHANGED_EVENT, foundation_changed))
    entry.async_on_unload(lambda: cancel_watch() if cancel_watch else None)
    entry.async_on_unload(lambda: cancel_native_update(context))


def configured_asset_projection_specs(hass, rooms: dict, *, include_links=True) -> dict:
    """Exactly one RHI logical device per configured actionable AV asset.

    Native vendor devices retain their identity and control. The existing Dell
    native media_player is already RHI-owned and must not acquire a wrapper.
    """
    registry = er.async_get(hass)
    assets: dict[str, dict] = {}
    catalog = getattr(hass, "data", {}).get(DOMAIN, {}).get(DEVICE_CATALOG)
    if catalog is not None:
        # One canonical record even after removing the last membership.
        memberships = {}
        for room_id, spec in rooms.items():
            for role in spec["devices"].values():
                memberships.setdefault(logical_asset_id(role), []).append((room_id, role))
        rows = []
        for asset_id, saved in catalog.items():
            related = memberships.get(asset_id, [])
            device = {k: v for k, v in saved.items() if k != DEVICE_LABEL}
            if related:
                first = related[0][1]
                device.update({k: first[k] for k in ("name", "role") if k in first})
            if saved.get(DEVICE_LABEL):
                device["name"] = saved[DEVICE_LABEL]
            if saved.get("foundation_concept") == "network":
                device["role"] = "computer"
            rows.append((device, {room_id for room_id, _ in related}))
    else:
        # Historic entry / test input has not yet been normalized.
        rows = [(device, {room_id}) for room_id, spec in rooms.items()
                for device in spec["devices"].values()]
    for device, room_ids in rows:
        entity_id = device["entity"]
        if not (entity_id.startswith("media_player.") or
                (device.get("foundation_concept") == "network" and entity_id.startswith("device_tracker."))):
            continue  # Native remotes remain related source entities, not duplicate HA devices.
        registered = registry.async_get(entity_id)
        if registered is not None and getattr(registered, "platform", None) == DOMAIN:
            continue
        key = logical_asset_id(device)
        native_device_id = getattr(registered, "device_id", None)
        logical_type = logical_source_type(
            device.get("foundation_concept", ""),
            str(getattr(registered, "platform", "") or ""),
            entity_id, configured=True,
        )
        item = assets.setdefault(key, {
            "device": device, "rooms": set(),
            "native_device_id": native_device_id,
            "logical_type": logical_type, "source_entities": (),
        })
        # One stale physical ID must not silently fuse different HA sources.
        if item["device"]["entity"] != entity_id:
            item["conflicted_identity"] = True
        item["rooms"].update(room_ids)
        if include_links and not item["source_entities"]:
            item["source_entities"] = related_source_entities(
                hass, native_device_id, entity_id)
            for endpoint in device.get("computer_io", {}).values():
                if all(link["entity_id"] != endpoint["entity"] for link in item["source_entities"]):
                    item["source_entities"] += ({"entity_id": endpoint["entity"], "domain": endpoint["entity"].split(".")[0],
                                                  "provider": "mqtt", "availability": "unavailable"},)
            companion = device.get("computer_agent")
            if companion and all(link["entity_id"] != companion["entity"] for link in item["source_entities"]):
                item["source_entities"] += ({"entity_id": companion["entity"], "domain": "media_player",
                                              "provider": "hass_agent", "availability": "unavailable"},)
    return assets


def logical_asset_projection_specs(hass, rooms: dict) -> dict:
    """Configured devices plus read-only discovered AV assets."""
    registry = er.async_get(hass)
    assets = configured_asset_projection_specs(hass, rooms)
    # Publish logical devices from the read-only supported-domain catalog even
    # before a room is configured. Configured assets always retain their
    # historical IDs; the same native device cannot create another RHI wrapper.
    discovered, _ = logical_av_catalog(hass, rooms)
    configured_sources = {
        device["entity"]: device
        for row in rooms.values() for device in row.get("devices", {}).values()
    }
    catalog = getattr(hass, "data", {}).get(DOMAIN, {}).get(DEVICE_CATALOG) or {}
    for saved in catalog.values():
        configured_sources.setdefault(saved["entity"], {
            **{k: v for k, v in saved.items() if k != DEVICE_LABEL},
            **({"name": saved[DEVICE_LABEL]} if DEVICE_LABEL in saved else {}),
        })
    for asset in discovered:
        candidates = asset.get("candidates") or []
        if not candidates:
            continue
        # Presentation identity is the exact native endpoint, not a semantic
        # concept. The saved binding and command authorization remain untouched.
        configured = [configured_sources[c["entity_id"]] for c in candidates
                      if c["entity_id"] in configured_sources]
        # A configured media_player already owns a stable logical projection.
        # Prefer that projection even when a configured companion remote is
        # listed first or Foundation no longer publishes the saved concept.
        if any(device["entity"].startswith("media_player.") for device in configured):
            continue
        # A standalone configured remote retains its historical logical ID.
        configured = next(iter(configured), None)
        primary = next(
            (c for c in candidates if c["entity_id"].startswith("media_player.")),
            None)
        if primary is None:
            primary = next(
                (c for c in candidates if c["entity_id"].startswith("remote.")),
                None)
        if primary is None:
            continue
        registered = registry.async_get(primary["entity_id"])
        if registered is not None and getattr(registered, "platform", None) == DOMAIN:
            continue
        key = logical_asset_id(configured) if configured else asset["asset_id"]
        if key in assets:
            continue
        projected = configured or {
            "entity": primary["entity_id"],
            "name": asset.get("model") or primary["entity_id"],
            "role": ("remote" if primary["entity_id"].startswith("remote.") else
                     "display" if primary["concept"] == "display" else
                     "receiver" if primary["concept"] == "amplifier" else "player"),
            "foundation_concept": primary["concept"],
            "foundation_candidate_id": primary["candidate_id"],
            "asset_id": key,
            "physical_id": key,
            "source_integration": primary["provider"],
        }
        assets[key] = {
            "device": projected,
            "rooms": set(asset.get("room_ids") or ()),
            "native_device_id": asset.get("native_device_id"),
            "logical_type": asset["logical_type"],
            "source_entities": tuple(asset.get("source_entities") or ()),
            "discovered_only": configured is None,
        }
    return assets


class LogicalAssetSensor(SensorEntity):
    """Read-only native status; no physical writer or inferred control success."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _unrecorded_attributes = frozenset({"source_entity_id", "native_device_id",
                                       "source_integration", "rooms", "foundation_candidate_id",
                                       "source_entities", "normalized_properties"})

    def __init__(self, context, entry_id: str, asset_id: str, spec: dict):
        self.context = context
        self.asset_id = asset_id
        self.update_spec(spec)
        self._attr_unique_id = f"{entry_id}:asset:{asset_id}:status"
        self._attr_name = "Status"
        state = native_state(context.get("hass") or context["adapter"].hass,
                             self.device["entity"])
        attrs = getattr(state, "attributes", {}) if state else {}
        name = attrs.get("friendly_name") or self.device.get("name")
        if not isinstance(name, str) or not name.strip():
            name = self.device["entity"].rsplit(".", 1)[-1].replace("_", " ").title()
        label = self.logical_type.replace("_", " ").title()
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, f"asset:{entry_id}:{asset_id}")},
            manufacturer="Robotix", model=f"Logical {label}", name=name,
        )

    def update_spec(self, spec: dict) -> None:
        self.source_published = True
        self.native_device_id = spec.get("native_device_id")
        self.device = spec["device"]
        self.room_ids = tuple(sorted(spec["rooms"]))
        self.logical_type = spec.get("logical_type", "media_player")
        self.related_entities = tuple(spec.get("source_entities") or ())
        self.conflicted_identity = bool(spec.get("conflicted_identity"))
        self.discovered_only = bool(spec.get("discovered_only"))

    def mark_unpublished(self) -> None:
        """Tombstone the read-only view without changing its HA identity."""
        self.source_published = False

    async def async_added_to_hass(self):
        self.async_on_remove(async_dispatcher_connect(self.hass, EVENT_UPDATE, self._changed))

    @callback
    def _changed(self, update):
        if update == "*" or (isinstance(update, NativeUpdate) and self.source_published
                and update.affects(self.device["entity"], self.related_entities)):
            # HA reads several properties during one synchronous state write.
            # Resolve the same binding once, never retain across publications.
            self._write_evidence = self._evidence()
            try:
                self.async_write_ha_state()
            finally:
                self._write_evidence = None

    def _evidence(self):
        current = getattr(self, "_write_evidence", None)
        if current is not None:
            return current
        source = authorized_source(self.hass, self.device)
        state = native_state(self.hass, self.device["entity"])
        return source, state

    @staticmethod
    def _fresh_native(state) -> bool:
        return bool(state is not None and state.state not in ("unknown", "unavailable")
                    and not (getattr(state, "attributes", {}) or {}).get("restored"))

    @property
    def available(self):
        _source, state = self._evidence()
        # A restored HA state is a stale observation, not confirmed playback.
        return bool(self.source_published and not self.conflicted_identity
                    and self._fresh_native(state))

    @property
    def native_value(self):
        _source, state = self._evidence()
        return state.state if self.source_published and not self.conflicted_identity and (
            self._fresh_native(state)) else None

    def _native_restored(self, entity_id: str) -> bool:
        """Diagnostic-only restored marker; never usable as native readback."""
        raw = self.hass.states.get(entity_id)
        return bool((getattr(raw, "attributes", {}) or {}).get("restored"))

    def _related_native_entity(self, link: dict) -> dict:
        return live_related_source(self.hass, link, self.source_published)

    @property
    def extra_state_attributes(self):
        source, state = self._evidence()
        attrs = getattr(state, "attributes", {}) if state else {}
        properties = {}
        if self.source_published and not self.conflicted_identity and self._fresh_native(state):
            properties["network_connectivity" if self.device.get("foundation_concept") == "network"
                       else "playback_state"] = state.state
            for name in ("source", "sound_mode", "media_title", "media_artist",
                         "media_content_type"):
                value = attrs.get(name)
                if isinstance(value, str) and value.strip():
                    properties[name] = value
            volume = attrs.get("volume_level")
            if type(volume) in (float, int) and 0 <= volume <= 1:
                properties["volume_percent"] = round(volume * 100, 1)
            if type(attrs.get("is_volume_muted")) is bool:
                properties["muted"] = attrs["is_volume_muted"]
            for name in ("media_position", "media_duration"):
                value = attrs.get(name)
                if type(value) in (int, float) and 0 <= value <= 86400:
                    properties[name + "_seconds"] = float(value)
        return {
            "owner_domain": DOMAIN, "asset_id": self.asset_id,
            "rooms": list(self.room_ids),
            "logical_type": self.logical_type,
            "role": self.device.get("role"),
            "concept": self.device.get("foundation_concept"),
            "foundation_approved": bool(source) and self.source_published
                                   and not self.conflicted_identity,
            "foundation_candidate_id": self.device.get("foundation_candidate_id"),
            "source_entity_id": self.device["entity"],
            "source_entities": [
                self._related_native_entity(link) for link in self.related_entities
            ],
            "normalized_properties": properties,
            "source_integration": (getattr(source, "integration", None) if source
                                   else self.device.get("source_integration")),
            "native_device_id": (getattr(source, "device_registry_id", None) if source
                                 else self.native_device_id),
            "discovery_status": ("published" if self.source_published else "source_unpublished"),
            "discovered_only": self.discovered_only,
            "command_authorization": ("source_unpublished" if not self.source_published
                                      else "no_room_context" if source and not self.room_ids and not self.discovered_only
                                      else "approved" if source and not self.conflicted_identity
                                      else "pending_or_revoked"),
            "readback": ("source_unpublished" if not self.source_published
                         else "conflicting_physical_identity" if self.conflicted_identity
                         else "native_state_restored" if self._native_restored(
                             self.device["entity"])
                         else ("network_connectivity" if self.device.get("foundation_concept") == "network"
                               else "native_ha_state") if self._fresh_native(state)
                         else "native_state_unavailable"),
        }


class NativeSourceSensor(SensorEntity):
    """Diagnostic source identity on the logical HA device, never a clone.

    Source and companion entities remain registered to their native vendor
    HA device. This one diagnostic projection survives provider outages so the
    owner can locate and repair the exact source without identity loss.
    """

    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _unrecorded_attributes = frozenset({"native_device_id", "related_source_entities"})

    def __init__(self, context, entry_id: str, asset_id: str, spec: dict):
        self.context = context
        self.asset_id = asset_id
        self.update_spec(spec)
        self._attr_unique_id = f"{entry_id}:asset:{asset_id}:native_source"
        self._attr_name = "Native source"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, f"asset:{entry_id}:{asset_id}")},
            manufacturer="Robotix",
            model="Logical " + spec.get("logical_type", "media_player").replace("_", " ").title(),
            name=spec["device"].get("name") or spec["device"]["entity"].rsplit(".", 1)[-1],
        )

    def update_spec(self, spec):
        self.source_published = True
        self.source_entity_id = spec["device"]["entity"]
        self.native_device_id = spec.get("native_device_id")
        self.related_entities = tuple(spec.get("source_entities") or ())
        self.room_ids = tuple(sorted(spec.get("rooms") or ()))

    def mark_unpublished(self):
        self.source_published = False

    async def async_added_to_hass(self):
        self.async_on_remove(async_dispatcher_connect(self.hass, EVENT_UPDATE, self._changed))

    @callback
    def _changed(self, update):
        # Identity remains structural, but exact related availability is
        # live readback. Other media/room updates cannot affect this link.
        if update == "*" or (isinstance(update, NativeUpdate) and self.source_published
                and update.affects(self.source_entity_id, self.related_entities)):
            self.async_write_ha_state()

    @property
    def native_value(self):
        return self.source_entity_id if self.source_published else None

    @property
    def extra_state_attributes(self):
        return {
            "source_entity_id": self.source_entity_id,
            "native_device_id": self.native_device_id,
            "rooms": list(self.room_ids),
            "related_source_entities": [
                {"entity_id": x["entity_id"], "provider": x.get("provider"),
                 "availability": live_related_source(self.hass, x, self.source_published)["availability"]}
                for x in self.related_entities
            ],
            "source_published": self.source_published,
        }


class RoomSensor(SensorEntity):
    _attr_has_entity_name = False
    _attr_should_poll = False
    # High-frequency, live presentation properties must not bloat Recorder.
    # Keep the original execution phase, activity, reservation, warnings and
    # Core event observation recorded for history and incident lifecycle.
    _unrecorded_attributes = frozenset({"source_roles", "now_playing", "audio", "activities", "commands",
                                        "last_attempt", "last_control", "target_state"})

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
    def _changed(self, update):
        # Commands/reservations keep their existing cross-room invalidation.
        # Native telemetry only affects explicitly associated rooms.
        if isinstance(update, NativeUpdate):
            if self.kind != "status" or self.room not in update.rooms:
                return
        elif self.kind != "status" and update != self.room:
            return
        self._native_update = update if isinstance(update, (NativeUpdate, RoomUpdate)) else None
        try:
            self.async_write_ha_state()
        finally:
            self._native_update = None

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
        update = getattr(self, "_native_update", None)
        properties = (update.room_model(self.context, self.hass, self.room) if update else
                      build_room(self.context, self.hass, selected_index(self.hass), self.room))
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
    def _changed(self, update):
        if isinstance(update, NativeUpdate) and not update.rooms:
            return
        self._native_update = update if isinstance(update, (NativeUpdate, RoomUpdate)) else None
        try:
            self.async_write_ha_state()
        finally:
            self._native_update = None

    @property
    def native_value(self):
        return "source_mapped"

    @property
    def extra_state_attributes(self):
        registry = er.async_get(self.hass)
        update = getattr(self, "_native_update", None)
        rooms = self.context["engine"].rooms
        previous = getattr(self, "_published_rows", {})
        scoped = isinstance(update, NativeUpdate) and set(previous) == set(rooms)
        selected = None if update else selected_index(self.hass)
        by_room = {}
        for room_id in rooms:
            if scoped and room_id not in update.rooms:
                by_room[room_id] = previous[room_id]
                continue
            experience = (update.room_model(self.context, self.hass, room_id) if update else
                          build_room(self.context, self.hass, selected, room_id))
            rows = []
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
            by_room[room_id] = rows
        # Derived publication only; no scheduling or authorization cache.
        self._published_rows = by_room
        return {"rhi_planning_targets": [row for rows in by_room.values() for row in rows]}
