"""RHI Multimedia semantic wizard. Foundation alone selects integrations/devices.

Flow scope: room -> selected display -> optional audio -> selected media sources
-> logical activities -> exact physical routes -> atomic review/save.
No JSON entry, duplicate entity selection or guessed hardware connections.
"""
from __future__ import annotations

from copy import deepcopy
import re
import yaml
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.helpers import selector

from .const import CONF_ROOMS, CONF_TITLE, DOMAIN
from .dell_c8621qt import valid_host
from .foundation import selected_native_macs
from .source_discovery import area_choices, av_sources, source_lists, speech_player_eligible, tts_choices
from .validation import native_state, cec_links_for_activity, route_status, validate_action, validate_rooms

NONE = "__none__"
CUSTOM_AREA = "__custom_room__"
UNCHANGED = "__no_source_change__"
REMOVE_ROUTE = "__remove_configured_route__"
DIRECT_ONLY = "__direct_only__"
ACTIVITIES = {
    "watch_tv": "Watch TV (native tuner / TV input)",
    "watch_hdmi": "Present / Meet / HDMI-only (set-top box, cameras, PC): select actual display/audio input; no invented remote",
    "watch_source": "Films / Series / Streaming (screen + optional audio + real player)",
    "listen_music": "Listen to music (audio + optional player; screen not required)",
    "play_game": "Play a game (screen + optional amplifier + console)",
}
ACTIVITY_TRANSLATIONS = {
    "nl": {
        "watch_tv": "TV kijken",
        "watch_hdmi": "Presenteren / Vergaderen / Externe HDMI-bron",
        "watch_source": "Films en series kijken / Streamen",
        "listen_music": "Muziek luisteren",
        "play_game": "Gamen",
    },
    "fr": {
        "watch_tv": "Regarder la télévision",
        "watch_hdmi": "Présenter / Réunion / Source HDMI externe",
        "watch_source": "Films et séries / Streaming",
        "listen_music": "Écouter de la musique",
        "play_game": "Jouer",
    },
}


def _activity_choices(hass) -> dict[str, str]:
    locale = str(getattr(getattr(hass, "config", None), "language", "en")).split("-")[0].split("_")[0].lower()
    return ACTIVITY_TRANSLATIONS.get(locale, ACTIVITIES)


NEXT = {"add_activity": "Add activity", "add_room": "Add room", "review": "Review and save"}


def _slug(label: str) -> str:
    raw = re.sub(r"[^a-z0-9]+", "_", str(label).lower()).strip("_")
    return raw if raw and raw[0].isalpha() else f"room_{raw}" if raw else "room"


def _select_many(options: dict[str, str]):
    return selector.SelectSelector(selector.SelectSelectorConfig(
        options=[selector.SelectOptionDict(value=k, label=v) for k, v in options.items()],
        multiple=True, mode=selector.SelectSelectorMode.DROPDOWN,
    ))


def _sources(flow, concept: str, area_id: str | None = None) -> dict[str, str]:
    available, _ = av_sources(flow.hass)
    entries = [x for x in available if x.concept == concept]
    entries.sort(key=lambda x: (x.area_id != area_id, not x.available, x.entity_id))
    # A source's registered HA area is NOT its consumption room or a verified
    # HDMI route. Show provenance instead of silently implying co-location.
    area_names = area_choices(flow.hass)
    def friendly_label(entity_id: str) -> str:
        # Names are *presentation only*. The exact Foundation-selected entity
        # remains the immutable option value and physical command authority.
        state = native_state(flow.hass, entity_id)
        name = (getattr(state, "attributes", {}) or {}).get("friendly_name")
        return name.strip()[:90] if isinstance(name, str) and name.strip() else entity_id

    # Assignment is a semantic room binding, not the native HA location.
    # Candidate identity remains authoritative across native entity renames.
    lang = str(getattr(getattr(flow.hass, "config", None), "language", "en")).split("-")[0]
    assigned_text, unassigned_text = {
        "nl": ("Toegewezen aan", "Niet toegewezen"),
        "fr": ("Affecté à", "Non affecté"),
    }.get(lang, ("Assigned to", "Unassigned"))
    rooms = dict(flow._rooms)
    if flow._previous_room and flow._room_id:
        rooms[flow._room_id] = flow._previous_room
    def assignment(candidate_id: str) -> str:
        names = sorted({room.get("name") or key for key, room in rooms.items()
                        if any(device.get("foundation_concept") == concept
                               and device.get("foundation_candidate_id") == candidate_id
                               for device in room.get("devices", {}).values())})
        return f" · {assigned_text}: {', '.join(names)}" if names else f" · {unassigned_text}"

    choices = {x.entity_id: f"{friendly_label(x.entity_id)} ({x.provider})"
               + (f" · HA area: {area_names.get(x.area_id, x.area_id)}" if x.area_id
                  else " · HA area unknown")
               + assignment(x.candidate_id)
               + (" · currently unavailable" if not x.available else "")
               for x in entries}
    for device in (flow._previous_room or {}).get("devices", {}).values():
        if device.get("foundation_concept") == concept:
            choices.setdefault(device["entity"], device["entity"] + " · existing link (needs review)")
    return choices


def _area_default(flow, concept: str, area_id: str | None) -> str:
    """Suggest only one unambiguous Foundation-selected endpoint in this HA area."""
    if not area_id:
        return NONE
    available, _ = av_sources(flow.hass)
    matches = [source.entity_id for source in available if source.concept == concept
               and source.area_id == area_id and source.available]
    return matches[0] if len(matches) == 1 else NONE


def _remapped_device(device: dict, entity_id: str) -> dict:
    """Preserve a durable asset when HA renames an approved native entity."""
    updated = deepcopy(device)
    previous_entity = updated["entity"]
    updated["entity"] = entity_id
    for action in ("power_on", "power_off"):
        for container in ("target", "data"):
            fields = updated.get(action, {}).get(container, {})
            if fields.get("entity_id") == previous_entity:
                fields["entity_id"] = entity_id
    return updated


def _source_ref(flow, entity_id: str, concept: str) -> dict:
    matches, _ = av_sources(flow.hass)
    candidate = next((x for x in matches if x.entity_id == entity_id and x.concept == concept), None)
    old = (flow._previous_room or {}).get("devices", {})
    previous = next((dev for dev in old.values()
                     if dev.get("entity") == entity_id and dev.get("foundation_concept") == concept
                     and (candidate is None or dev.get("foundation_candidate_id") == candidate.candidate_id)), None)
    if previous is not None:
        return deepcopy(previous)
    if candidate is None:
        raise ValueError(f"{entity_id}: no longer selected in Foundation/{concept}")
    renamed = [dev for dev in old.values() if dev.get("foundation_concept") == concept
               and dev.get("foundation_candidate_id") == candidate.candidate_id]
    if len(renamed) == 1:
        device = _remapped_device(renamed[0], entity_id)
        identity = (device.get("physical_id", entity_id),
                    device.get("asset_id", device.get("physical_id", entity_id)))
        for other_room in flow._rooms.values():
            for linked in other_room["devices"].values():
                if (linked.get("foundation_concept") == concept
                        and linked.get("foundation_candidate_id") == candidate.candidate_id):
                    candidate_identity = (linked.get("physical_id", linked["entity"]),
                                          linked.get("asset_id", linked.get("physical_id", linked["entity"])))
                    if candidate_identity != identity:
                        raise ValueError("Conflicting historical source identity")
        for room in flow._rooms.values():
            for key, shared in list(room["devices"].items()):
                if (shared.get("foundation_candidate_id") == candidate.candidate_id
                        and shared.get("foundation_concept") == concept):
                    room["devices"][key] = _remapped_device(shared, entity_id)
        return device
    # A shared source must retain its original reservation identity when a
    # second room is added, even if the first room used an older custom ID.
    shared_candidates = [(room, role, dev) for room in flow._rooms.values()
                         for role, dev in room["devices"].items()
                         if dev.get("foundation_concept") == concept
                         and dev.get("foundation_candidate_id") == candidate.candidate_id]
    if shared_candidates:
        identities = {(dev.get("physical_id", dev["entity"]),
                       dev.get("asset_id", dev.get("physical_id", dev["entity"])))
                      for _, _, dev in shared_candidates}
        if len(identities) != 1:
            raise ValueError("Conflicting historical source identity")
        for room, role, dev in shared_candidates:
            room["devices"][role] = _remapped_device(dev, entity_id)
        return _remapped_device(shared_candidates[0][2], entity_id)
    existing = next((dev for room in flow._rooms.values() for dev in room["devices"].values()
                     if dev["entity"] == entity_id), None)
    physical = existing.get("physical_id", entity_id) if existing else f"ha_entity:{entity_id}"
    role = ("remote" if entity_id.startswith("remote.") else "receiver" if concept == "amplifier"
            else "player" if concept == "source" else "display")
    return {"entity": entity_id, "physical_id": physical,
            "asset_id": existing.get("asset_id", physical) if existing else physical,
            "role": role,
            "foundation_concept": concept, "foundation_candidate_id": candidate.candidate_id,
            "power_mode": "passive" if entity_id.startswith("remote.") else "native"}


class _Wizard:
    def _begin(self, rooms=None, name="Multimedia"):
        self._rooms = deepcopy(rooms or {})
        self._original_rooms = deepcopy(self._rooms)
        self._name = name
        self._room_id = None
        self._activity_key = None
        self._activity_cast = []
        self._steps = []
        self._route_cursor = 0
        self._editing_activity = None
        self._editing_room = False
        self._previous_room = None
        self._guided_activity_type = None

    async def async_step_room(self, user_input=None):
        areas = area_choices(self.hass)
        errors = {}
        if user_input is not None:
            area_id = user_input.get("area", CUSTOM_AREA)
            room_name = areas.get(area_id, user_input.get("room_name", "")).strip()
            key = _slug(room_name)
            if not room_name:
                errors["base"] = "room_required"
            elif key in self._rooms:
                errors["base"] = "room_exists"
            else:
                self._room_id = key
                self._rooms[key] = {"name": room_name, "area_id": area_id if area_id in areas else None,
                                    "devices": {}, "activities": {}}
                return await self.async_step_display()
        schema = {vol.Optional("room_name", default=""): str}
        if areas:
            schema[vol.Required("area", default=next(iter(areas)))] = vol.In(
                {**areas, CUSTOM_AREA: "Custom room (give it a name)"})
        else:
            schema = {vol.Required("room_name"): str}
        return self.async_show_form(step_id="room", data_schema=vol.Schema(schema), errors=errors)

    async def async_step_display(self, user_input=None):
        choices = _sources(self, "display", self._rooms[self._room_id]["area_id"])
        errors = {}
        if user_input is not None:
            chosen = user_input.get("display", NONE)
            if chosen != NONE and chosen not in choices:
                errors["base"] = "not_foundation_selected"
            else:
                if chosen != NONE:
                    self._rooms[self._room_id]["devices"]["screen"] = _source_ref(self, chosen, "display")
                return await self.async_step_amplifier()
        default = (self._previous_room or {}).get("devices", {}).get("screen", {}).get("entity", NONE)
        if not self._editing_room:
            default = _area_default(self, "display", self._rooms[self._room_id]["area_id"])
        default = default if default in choices else NONE
        return self.async_show_form(step_id="display", errors=errors,
            data_schema=vol.Schema({vol.Required("display", default=default):
                                    vol.In({NONE: "No screen (music-only room)", **choices})}))

    async def async_step_amplifier(self, user_input=None):
        choices = _sources(self, "amplifier", self._rooms[self._room_id]["area_id"])
        errors = {}
        if user_input is not None:
            chosen = user_input.get("amplifier", NONE)
            if chosen != NONE and chosen not in choices:
                errors["base"] = "not_foundation_selected"
            else:
                if chosen != NONE:
                    self._rooms[self._room_id]["devices"]["amplifier"] = _source_ref(self, chosen, "amplifier")
                return await self.async_step_sources()
        default = (self._previous_room or {}).get("devices", {}).get("amplifier", {}).get("entity", NONE)
        if not self._editing_room:
            default = _area_default(self, "amplifier", self._rooms[self._room_id]["area_id"])
        default = default if default in choices else NONE
        return self.async_show_form(step_id="amplifier", errors=errors,
            data_schema=vol.Schema({vol.Required("amplifier", default=default):
                                    vol.In({NONE: "No amplifier (TV/internal speakers)", **choices})}))

    async def async_step_sources(self, user_input=None):
        choices = _sources(self, "source", self._rooms[self._room_id]["area_id"])
        errors = {}
        if user_input is not None:
            selected = user_input.get("sources") or []
            if len(set(selected)) != len(selected) or any(s not in choices for s in selected):
                errors["base"] = "not_foundation_selected"
            else:
                devices = self._rooms[self._room_id]["devices"]
                for entity in selected:
                    device = _source_ref(self, entity, "source")
                    key = next((role for role, prior in (self._previous_room or {}).get("devices", {}).items()
                                if prior.get("foundation_concept") == "source"
                                and prior.get("foundation_candidate_id") == device.get("foundation_candidate_id")
                                and prior.get("foundation_candidate_id")), "source_" + _slug(entity))
                    devices[key] = device
                if not devices:
                    errors["base"] = "room_requires_av_endpoint"
                elif self._editing_room:
                    return await self.async_step_validate_room_update()
                else:
                    return await self.async_step_activity()
        previous_sources = [v["entity"] for k, v in (self._previous_room or {}).get("devices", {}).items()
                            if k.startswith("source_") and v["entity"] in choices]
        schema = {vol.Optional("sources", default=previous_sources): _select_many(choices)} if choices else {}
        return self.async_show_form(step_id="sources", errors=errors,
                                    data_schema=vol.Schema(schema),
                                    description_placeholders={"count": str(len(choices))})

    async def async_step_validate_room_update(self, user_input=None):
        """Prevent silent activity re-targeting after a room's device set changes."""
        previous = self._previous_room or {}
        new_devices = self._rooms[self._room_id]["devices"]
        old_devices = previous.get("devices", {})
        activities = self._rooms[self._room_id]["activities"]
        affected = [key for key, activity in activities.items()
                    if any(role not in new_devices or role not in old_devices
                           or new_devices[role].get("foundation_candidate_id") != old_devices[role].get("foundation_candidate_id")
                           or new_devices[role].get("foundation_concept") != old_devices[role].get("foundation_concept")
                           or (not new_devices[role].get("foundation_candidate_id")
                               and new_devices[role]["entity"] != old_devices[role]["entity"])
                           for role in activity.get("devices", []))]
        if not affected:
            self._editing_room = False
            self._previous_room = None
            return await self.async_step_next()
        if user_input is not None:
            if not user_input.get("confirm_remove"):
                return self.async_show_form(step_id="validate_room_update",
                    errors={"base": "confirm_remove_incompatible"},
                    data_schema=vol.Schema({vol.Required("confirm_remove", default=False): bool}),
                    description_placeholders={"affected": ", ".join(affected)})
            for key in affected:
                activities.pop(key, None)
            self._editing_room = False
            self._previous_room = None
            return await self.async_step_next()
        return self.async_show_form(step_id="validate_room_update",
            data_schema=vol.Schema({vol.Required("confirm_remove", default=False): bool}),
            description_placeholders={"affected": ", ".join(affected)})

    async def async_step_activity(self, user_input=None):
        room = self._rooms[self._room_id]
        devices = room["devices"]
        editing = self._editing_activity
        previous = room["activities"].get(editing, {}) if editing else {}
        # Remote endpoints are controls, not new playback sources. Keep an
        # existing legacy cast editable without silently changing its intent.
        source_keys = {k: v["entity"] for k, v in devices.items() if k.startswith("source_")
                       and (v["entity"].startswith("media_player.") or k in previous.get("devices", []))}
        errors = {}
        choices = dict(_activity_choices(self.hass))
        if not editing:
            choices[DIRECT_ONLY] = "Direct device control only (no activity)"
        if user_input is not None:
            kind = (self._guided_activity_type if not editing and self._guided_activity_type in ACTIVITIES
                    else user_input.get("activity_type"))
            if kind == DIRECT_ONLY and not editing:
                return await self.async_step_next()
            source = NONE if kind == "watch_hdmi" else user_input.get("primary_source", NONE)
            if kind not in ACTIVITIES:
                errors["base"] = "invalid_activity"
            elif kind in ("watch_tv", "watch_hdmi", "watch_source", "play_game") and "screen" not in devices:
                errors["base"] = "screen_required"
            elif kind in ("watch_source", "play_game") and source not in source_keys:
                errors["base"] = "source_required"
            elif kind == "listen_music" and not ("amplifier" in devices or source in source_keys):
                errors["base"] = "audio_required"
            else:
                label = str(user_input.get("activity_name") or "").strip()
                if not label:
                    errors["base"] = "activity_required"
                else:
                    proposed_key = _slug(label)
                    key = editing or proposed_key
                    if proposed_key in room["activities"] and proposed_key != editing:
                        errors["base"] = "activity_exists"
                    else:
                        cast = []
                        if kind != "listen_music" and "screen" in devices:
                            cast.append("screen")
                        if "amplifier" in devices:
                            cast.append("amplifier")
                        if source in source_keys:
                            cast.append(source)
                        self._activity_key = key
                        self._activity_name = label
                        self._activity_cast = cast
                        self._activity_type = kind
                        # A label-only edit must preserve routes and custom steps,
                        # including when an endpoint is temporarily unavailable.
                        # A changed cast needs explicit new routing.
                        same_cast = previous.get("devices") == cast
                        self._activity_previous = deepcopy(previous) if same_cast else {}
                        self._steps = deepcopy(self._activity_previous.get("steps", []))
                        self._route_cursor = 0
                        return await self.async_step_route()
        label = previous.get("name", "Watch TV")
        previous_cast = previous.get("devices", [])
        previous_source = next((key for key in previous_cast if key in source_keys), NONE)
        default_kind = previous.get("activity_type")
        if not editing and self._guided_activity_type in ACTIVITIES:
            default_kind = self._guided_activity_type
        if default_kind not in ACTIVITIES:
            default_kind = ("listen_music" if previous_cast and "screen" not in previous_cast
                            else "watch_source" if previous_source != NONE else "watch_tv")
        # The guided flow already captured intent; never ask twice or allow
        # a stale browser to silently change its original selection.
        schema = {vol.Required("activity_name", default=label): str}
        if editing or self._guided_activity_type not in ACTIVITIES:
            schema[vol.Required("activity_type", default=default_kind)] = vol.In(choices)
        if source_keys:
            schema[vol.Required("primary_source", default=previous_source)] = vol.In(
                {NONE: "None / built-in TV", **source_keys})
        return self.async_show_form(step_id="activity", errors=errors,
                                    data_schema=vol.Schema(schema),
                                    description_placeholders={"room": room["name"]})

    async def async_step_route(self, user_input=None):
        devices = self._rooms[self._room_id]["devices"]
        while self._route_cursor < len(self._activity_cast):
            key = self._activity_cast[self._route_cursor]
            entity = devices[key]["entity"]
            options = source_lists(self.hass, entity)
            existing = [step for step in self._steps if step["device"] == key]
            if not any(options.values()) and not any(step["type"] in ("source", "sound_mode") for step in existing):
                self._route_cursor += 1
                continue
            if user_input is not None:
                changes = []
                for field in ("source", "sound_mode"):
                    chosen = user_input.get(field, UNCHANGED)
                    offered = options["source_list" if field == "source" else "sound_mode_list"]
                    if chosen == UNCHANGED:
                        continue
                    prior = [step for step in existing if step["type"] == field]
                    if chosen in offered or (chosen == REMOVE_ROUTE and prior):
                        changes.append((field, chosen))
                    else:
                        return self.async_show_form(step_id="route", errors={"base": "route_changed"},
                                                    data_schema=vol.Schema(self._route_fields(options, existing)),
                                                    description_placeholders={"device": entity})
                # Validate the whole form before applying any route change.
                for field, chosen in changes:
                    matching = [idx for idx, step in enumerate(self._steps)
                                if step["device"] == key and step["type"] == field]
                    position = matching[0] if matching else len(self._steps)
                    self._steps = [step for step in self._steps
                                   if not (step["device"] == key and step["type"] == field)]
                    if chosen != REMOVE_ROUTE:
                        self._steps.insert(position, {"type": field, "device": key, "candidates": [chosen]})
                self._route_cursor += 1
                user_input = None
                continue
            return self.async_show_form(step_id="route", data_schema=vol.Schema(self._route_fields(options, existing)),
                                        description_placeholders={"device": entity})
        # An HDMI-only source OR a separately selected video/game player needs
        # a real destination input. Native source readback alone does not prove
        # it is routed to this room. This is a configuration guard only:
        # no command is issued and existing activity IDs are preserved.
        routed_external = self._activity_type in ("watch_source", "play_game") and any(
            devices[key].get("foundation_concept") == "source"
            and devices[key]["entity"].startswith("media_player.")
            for key in self._activity_cast
        )
        if (self._activity_type == "watch_hdmi" or routed_external) and not any(
                step["type"] == "source" and step["device"] in ("screen", "amplifier")
                for step in self._steps):
            route_idx = next((idx for idx, key in enumerate(self._activity_cast)
                              if key in ("screen", "amplifier")
                              and source_lists(self.hass, devices[key]["entity"])["source_list"]), None)
            self._route_cursor = route_idx if route_idx is not None else 0
            if route_idx is None:
                return self.async_show_form(step_id="route",
                    errors={"base": "source_route_required"}, data_schema=vol.Schema({}),
                    description_placeholders={"device": "No currently available native TV/receiver inputs"})
            key = self._activity_cast[route_idx]
            options = source_lists(self.hass, devices[key]["entity"])
            existing = [step for step in self._steps if step["device"] == key]
            return self.async_show_form(step_id="route", errors={"base": "source_route_required"},
                data_schema=vol.Schema(self._route_fields(options, existing)),
                description_placeholders={"device": devices[key]["entity"]})
        activities = self._rooms[self._room_id]["activities"]
        self._editing_activity = None
        activities[self._activity_key] = {**self._activity_previous, "name": self._activity_name,
                                         "activity_type": self._activity_type,
                                         "devices": list(self._activity_cast), "steps": list(self._steps)}
        return await self.async_step_next()

    @staticmethod
    def _route_fields(options, existing=()):
        schema = {}
        for field, values in (("source", options["source_list"]), ("sound_mode", options["sound_mode_list"])):
            prior = [step for step in existing if step["type"] == field]
            if values or prior:
                choices = {UNCHANGED: ("Keep configured route" if prior else "No change / already routed"),
                           **{v: v for v in values}}
                if prior:
                    choices[REMOVE_ROUTE] = "Remove configured route"
                schema[vol.Required(field, default=UNCHANGED)] = vol.In(choices)
        return schema

    async def async_step_next(self, user_input=None):
        if user_input:
            action = user_input["action"]
            if action == "add_activity":
                return await self.async_step_activity()
            if action == "add_room":
                return await self.async_step_room()
            return await self.async_step_review()
        return self.async_show_form(step_id="next", data_schema=vol.Schema({
            vol.Required("action", default="review"): vol.In(NEXT)}))

    def _review_summary(self):
        lines = []
        for room in self._rooms.values():
            lines.append(f"{room.get('name', 'Room')}:")
            if room.get("harmony_controller"):
                lines.append("  Harmony owns every declared endpoint; Premium activities retained but disabled.")
            for key, device in room["devices"].items():
                state = native_state(self.hass, device["entity"])
                lines.append(f"  {key}: {device['entity']} ({state.state if state else 'unavailable'})")
            for activity in room["activities"].values():
                lines.append(f"  {activity.get('name', 'Activity')}:")
                for step in activity.get("steps", []):
                    if step["type"] not in ("source", "sound_mode"):
                        continue
                    device = room["devices"][step["device"]]
                    state = native_state(self.hass, device["entity"])
                    preview = route_status(step, state.state if state else "unavailable",
                                           state.attributes if state else {})
                    lines.append(f"    {step['device']} · {' / '.join(step['candidates'])}: {preview['status']}")
        return "\n".join(lines) or "No rooms"

    def _review_configuration(self):
        if self._rooms:
            validate_rooms(self._rooms)
        current, _ = av_sources(self.hass)
        selected = {(s.concept, s.entity_id, s.candidate_id) for s in current}
        for room_id, room in self._rooms.items():
            previous = self._original_rooms.get(room_id, {})
            for key, device in room["devices"].items():
                if ((device.get("foundation_concept"), device.get("entity"),
                     device.get("foundation_candidate_id")) not in selected
                        and previous.get("devices", {}).get(key) != device):
                    raise ValueError("New or changed device not selected")
                tts_id = device.get("speech_tts_registry_id")
                if tts_id and tts_id != previous.get("devices", {}).get(key, {}).get("speech_tts_registry_id"):
                    approved_speech = next((source for source in current
                                            if source.concept == device.get("foundation_concept")
                                            and source.entity_id == device["entity"]
                                            and source.candidate_id == device.get("foundation_candidate_id")), None)
                    if (room.get("harmony_controller") or not speech_player_eligible(
                            self.hass, device, approved_speech) or tts_id not in tts_choices(self.hass)):
                        raise ValueError("Speech requires an exact selected Cast source and native TTS provider")
                # YAML cannot bypass the same native MAC/selected-LG guard
                # that the dedicated TV Wake Options Flow already enforces.
                wol = device.get("power_on", {})
                prior_wol = previous.get("devices", {}).get(key, {}).get("power_on")
                if (isinstance(wol, dict)
                        and wol.get("action") == "wake_on_lan.send_magic_packet"
                        and wol != prior_wol):
                    approved_wol = next((source for source in current
                                         if source.concept == "display"
                                         and source.provider == "webostv"
                                         and source.entity_id == device.get("entity")
                                         and source.candidate_id == device.get("foundation_candidate_id")), None)
                    if (approved_wol is None or
                            str(wol.get("data", {}).get("mac", "")).lower()
                            not in selected_native_macs(self.hass, approved_wol)):
                        raise ValueError("Wake-on-LAN MAC must belong to the selected native LG device")
            for activity_id, activity in room["activities"].items():
                prior = previous.get("activities", {}).get(activity_id, {})
                if activity == prior:
                    continue
                for key in activity["devices"]:
                    device = room["devices"][key]
                    if (device.get("foundation_concept"), device["entity"],
                            device.get("foundation_candidate_id")) not in selected:
                        raise ValueError("Changed activity includes a revoked source")
                # Expert/global YAML and Assisted must enforce the same actual
                # native input/sound-mode choices. A name-only edit retains
                # existing routes even if their native source is currently
                # offline; a newly introduced route is never guessed.
                for kind in ("steps", "stop_steps"):
                    original_steps = prior.get(kind, [])
                    for step in activity.get(kind, []):
                        if step in original_steps or step.get("type") not in ("source", "sound_mode"):
                            continue
                        device = room["devices"][step["device"]]
                        live = source_lists(self.hass, device["entity"])
                        offered = live["source_list" if step["type"] == "source"
                                       else "sound_mode_list"]
                        if not offered or any(value not in offered
                                              for value in step["candidates"]):
                            raise ValueError("Changed route is not offered by the selected native HA device")
        engine = self.hass.data.get(DOMAIN, {}).get("engine")
        # Changing an opaque external controller is a physical ownership
        # handoff, not a name edit. Require hub OFF and no affected Premium task.
        affected = set()
        for room_id in self._rooms.keys() | self._original_rooms.keys():
            before = self._original_rooms.get(room_id, {})
            after = self._rooms.get(room_id, {})
            old, new = before.get("harmony_controller"), after.get("harmony_controller")
            if not (old or new) or (old == new and before.get("devices") == after.get("devices")):
                continue
            for spec, controller in ((before, old), (after, new)):
                if not controller:
                    continue
                device = spec["devices"].get(controller, {})
                entity = device.get("entity")
                candidate = next((source for source in current if source.entity_id == entity
                                  and source.candidate_id == device.get("foundation_candidate_id")
                                  and source.concept == "source" and source.provider == "harmony"), None)
                state = native_state(self.hass, entity) if entity else None
                if (not candidate or not state or state.state != "off"
                        or state.attributes.get("current_activity") != "PowerOff"
                        or "activity_starting" not in state.attributes or state.attributes["activity_starting"] is not None):
                    return "stop_harmony_before_edit"
            for spec in (before, after):
                affected.update(device.get("physical_id", device["entity"]) for device in spec.get("devices", {}).values())
        if engine and affected:
            for room_id, state in engine.states.items():
                scope = engine.rooms[room_id]["devices"]
                overlap = any(device.get("physical_id", device["entity"]) in affected for device in scope.values())
                task = getattr(engine, "_room_tasks", {}).get(room_id)
                if overlap and (state.phase != "idle" or state.devices or (task and not task.done())):
                    return "stop_room_before_edit"
        if engine:
            for room_id, state in engine.states.items():
                if state.phase == "idle" and not state.devices:
                    continue
                before = self._original_rooms.get(room_id, {})
                after = self._rooms.get(room_id, {})
                if any(before.get("devices", {}).get(key) != after.get("devices", {}).get(key)
                       for key in state.devices):
                    return "stop_room_before_edit"
                for activity in (state.activity, getattr(state, "retiring_activity", None)):
                    if activity and before.get("activities", {}).get(activity) != after.get("activities", {}).get(activity):
                        return "stop_room_before_edit"
        return None

    async def async_step_review(self, user_input=None):
        errors = {}
        if user_input:
            if not user_input.get("confirm"):
                errors["base"] = "confirm_save"
            elif getattr(self, "_yaml_import", False) and (
                    self._entry.options.get(CONF_ROOMS,
                                            self._entry.data.get(CONF_ROOMS, {}))
                    != self._original_rooms
                    or self._entry.options.get("dell_displays",
                                             self._entry.data.get("dell_displays", {}))
                    != self._original_dell_displays
                    or self._entry.options.get("enable_ux", True)
                    != self._original_enable_ux):
                errors["base"] = "selection_changed"
            elif (getattr(self, "_yaml_deleted_rooms", None)
                  and not user_input.get("confirm_remove")):
                errors["base"] = "yaml_confirm_remove"
            else:
                try:
                    reason = self._review_configuration()
                except (ValueError, TypeError, KeyError):
                    errors["base"] = "selection_changed"
                else:
                    if reason:
                        errors["base"] = reason
                    else:
                        return await self._finish()
        fields = {vol.Required("confirm", default=False): bool}
        if getattr(self, "_yaml_deleted_rooms", None):
            fields[vol.Required("confirm_remove", default=False)] = bool
        preview = self._review_summary()
        if getattr(self, "_yaml_import", False):
            preview = self._yaml_diff + "\n\n" + preview
        return self.async_show_form(step_id="review", errors=errors,
                                    data_schema=vol.Schema(fields),
                                    description_placeholders={"rooms": str(len(self._rooms)),
                                        "activities": str(sum(len(r["activities"]) for r in self._rooms.values())),
                                        "summary": preview})


class MultimediaConfigFlow(_Wizard, config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 2

    async def async_step_user(self, user_input=None):
        if not hasattr(self, "_rooms"):
            self._begin()
        # Expose the domain's three technical concepts to Foundation, even on
        # fresh installs where no Multimedia config entry exists yet.
        from .foundation import register_with_foundation
        register_with_foundation(self.hass)
        selected, _ = av_sources(self.hass)
        if not selected:
            if user_input and user_input.get("confirm"):
                await self.async_set_unique_id("rhi_multimedia_household")
                self._abort_if_unique_id_configured()
                return self.async_create_entry(title="Multimedia", data={CONF_TITLE: "Multimedia", CONF_ROOMS: {}})
            return self.async_show_form(step_id="user", data_schema=vol.Schema({
                vol.Required("confirm", default=False): bool}))
        if user_input:
            self._name = str(user_input.get(CONF_TITLE) or "Multimedia").strip()
            return await self.async_step_room()
        return self.async_show_form(step_id="user", data_schema=vol.Schema({
            vol.Required(CONF_TITLE, default="Multimedia"): str}))

    async def _finish(self):
        await self.async_set_unique_id("rhi_multimedia_household")
        self._abort_if_unique_id_configured()
        return self.async_create_entry(title=self._name, data={CONF_TITLE: self._name, CONF_ROOMS: self._rooms})

    @staticmethod
    def async_get_options_flow(config_entry):
        return MultimediaOptionsFlow(config_entry)


MAX_CONFIG_YAML_BYTES = 128_000

# Config surfaces may update known domain fields, never smuggle arbitrary
# settings into the persisted model where validate_rooms may ignore them.
# A new supported semantic field must be deliberately added alongside its
# owning domain validation and HA/browser acceptance.
YAML_SCOPED_FIELDS = {
    "room": frozenset({"name", "area_id", "floor_id", "harmony_controller",
                       "devices", "activities"}),
    "device": frozenset({"entity", "physical_id", "asset_id", "role", "name",
                         "foundation_concept", "foundation_candidate_id",
                         "hdmi_cec_enabled", "power_mode", "power_on",
                         "power_off", "timeout", "on_states", "speech_tts_registry_id"}),
    "activity": frozenset({"name", "activity_type", "devices", "steps",
                           "stop_steps", "cec_links"}),
}


class _StrictYamlLoader(yaml.SafeLoader):
    """Never silently apply duplicate YAML mapping keys to real AV equipment."""

    def construct_mapping(self, node, deep=False):
        result = {}
        for key_node, value_node in node.value:
            key = self.construct_object(key_node, deep=deep)
            if not isinstance(key, str) or key in result:
                raise ValueError("YAML keys must be unique strings")
            result[key] = self.construct_object(value_node, deep=deep)
        return result


def _yaml_document(document: str) -> dict:
    """Strict, bounded admin YAML input; not Home Assistant configuration.yaml."""
    if not isinstance(document, str) or not 0 < len(document.encode("utf-8")) <= MAX_CONFIG_YAML_BYTES:
        raise ValueError("YAML must be nonempty and at most 128 kB")
    try:
        payload = yaml.load(document, Loader=_StrictYamlLoader)
    except (yaml.YAMLError, ValueError, RecursionError) as exc:
        raise ValueError("Malformed or duplicated YAML configuration") from exc
    if not isinstance(payload, dict):
        raise ValueError("YAML must be a mapping")
    return payload


def _yaml_plan(document: str, existing: dict, mode: str) -> tuple[dict, list[str]]:
    """Prepare independent room/device/activity changes without another config store.

    Each change replaces only named fields of one semantic object. Lists, such
    as routes, are replaced as whole validated fields, never index-merged.
    Review/Save remains the only writer and validates the entire resulting
    configuration against live Foundation selection and command reservations.
    """
    if mode not in ("merge", "replace"):
        raise ValueError("Unknown YAML import mode")
    payload = _yaml_document(document)
    if set(payload) == {"rooms"}:
        incoming = payload["rooms"]
        if not isinstance(incoming, dict) or not incoming:
            raise ValueError("YAML must contain at least one complete room")
        validate_rooms(incoming)
        return (deepcopy(incoming) if mode == "replace" else
                {**deepcopy(existing), **deepcopy(incoming)}), []
    if set(payload) != {"changes"} or mode != "merge":
        raise ValueError("Scoped changes require changes: and merge mode")
    changes = payload["changes"]
    if not isinstance(changes, list) or not 0 < len(changes) <= 100:
        raise ValueError("Expected 1 to 100 scoped changes")
    result = deepcopy(existing)
    seen: set[tuple[str, str, str]] = set()
    removals: list[str] = []
    for change in changes:
        if not isinstance(change, dict):
            raise ValueError("Each change must be a mapping")
        scope, room_id, object_id = change.get("scope"), change.get("room"), change.get("id")
        if (scope not in ("room", "device", "activity")
                or not isinstance(room_id, str)
                or not re.fullmatch(r"[a-z][a-z0-9_]*", room_id)
                or (scope == "room" and object_id is not None)
                or (scope != "room" and (not isinstance(object_id, str)
                                         or not re.fullmatch(r"[a-z][a-z0-9_]*", object_id)))):
            raise ValueError("Invalid scoped room, device or activity identity")
        removing = change.get("remove") is True
        expected = ({"scope", "room", "remove"} if scope == "room" else
                    {"scope", "room", "id", "remove"}) if removing else (
                    {"scope", "room", "set"} if scope == "room" else
                    {"scope", "room", "id", "set"})
        if (set(change) != expected or (not removing and
                (not isinstance(change["set"], dict) or not change["set"]))):
            raise ValueError("A change must contain exactly set: or remove: true")
        target = (scope, room_id, object_id or "")
        if target in seen:
            raise ValueError("Duplicate changes to the same object")
        seen.add(target)
        if scope == "room":
            container, key = result, room_id
        else:
            if room_id not in result or not isinstance(result[room_id], dict):
                raise ValueError("Unknown room for scoped device/activity")
            group = "devices" if scope == "device" else "activities"
            container, key = result[room_id].get(group), object_id
            if not isinstance(container, dict):
                raise ValueError("Room has no valid object group")
        if removing:
            if key not in container:
                raise ValueError("Cannot remove an unknown object")
            del container[key]
            removals.append(f"{scope} {room_id}" + (f"/{object_id}" if object_id else ""))
        else:
            update = deepcopy(change["set"])
            if set(update) - YAML_SCOPED_FIELDS[scope]:
                raise ValueError("Unknown or unsupported YAML field for this scope")
            if scope == "room" and key in container and ({"devices", "activities"} & set(update)):
                raise ValueError("Edit devices/activities independently, not through a room overwrite")
            original = container.get(key, {})
            if not isinstance(original, dict):
                raise ValueError("Cannot edit an invalid object")
            container[key] = {**original, **update}
    validate_rooms(result)
    return result, removals


def _yaml_change_summary(previous: dict, proposed: dict) -> str:
    """Stable, bounded administrator preview, including activity ID changes."""
    added = sorted(set(proposed) - set(previous))
    removed = sorted(set(previous) - set(proposed))
    changed = sorted(key for key in set(proposed) & set(previous)
                     if proposed[key] != previous[key])
    lines = [
        "New rooms: " + (", ".join(added) or "none"),
        "Changed rooms: " + (", ".join(changed) or "none"),
        "Removed rooms: " + (", ".join(removed) or "none"),
    ]
    for key in changed:
        before = previous[key].get("activities", {})
        after = proposed[key].get("activities", {})
        additions = sorted(set(after) - set(before))
        removals = sorted(set(before) - set(after))
        edits = sorted(activity for activity in set(before) & set(after)
                       if before[activity] != after[activity])
        if additions or removals or edits:
            lines.append(f"{key} activities: +{','.join(additions) or '-'} "
                         f"~{','.join(edits) or '-'} -{','.join(removals) or '-'}")
    return "\n".join(lines)[:3500]


class MultimediaOptionsFlow(_Wizard, config_entries.OptionsFlow):
    def __init__(self, config_entry):
        self._entry = config_entry
        self._begin(rooms=config_entry.options.get(CONF_ROOMS, config_entry.data.get(CONF_ROOMS, {})),
                    name=config_entry.data.get(CONF_TITLE, "Multimedia"))
        self._dell_displays = deepcopy(config_entry.options.get("dell_displays",
                                                               config_entry.data.get("dell_displays", {})))
        self._original_dell_displays = deepcopy(self._dell_displays)
        self._original_enable_ux = config_entry.options.get("enable_ux", True)
        self._yaml_enable_ux = None
        self._dell_key = None

    async def async_step_init(self, user_input=None):
        options = {"assisted": "Assisted — configure rooms, devices and activities",
                   "yaml": "YAML — update one room/device/activity or import (advanced)",
                   "expert_yaml": "Expert YAML — edit one selected object",
                   "add_room": "Add room", "edit_room": "Edit room devices and connections",
                   "guided_activity": "Create an activity: start with what you want to do",
                   "add_activity": "Add activity", "rename_room": "Rename room / change area",
                   "edit_activity": "Edit activity", "quick_edit_activity": "Quick edit activity name and inputs",
                   "remove_activity": "Remove activity",
                   "remove_room": "Remove room", "review": "Review and save", "frontend": "Dashboard card",
                   "harmony_owner": "Harmony / Premium control ownership",
                   "tv_wake": "TV Wake-on-LAN destination",
                   "speech_endpoint": "Speaker speech notifications",
                   "cec_device": "HDMI-CEC setting per selected device",
                   "cec_activity": "HDMI-CEC relationship and activity actions",
                   "dell_add": "Add Dell C8621QT LAN display",
                   "dell_edit": "Rename Dell C8621QT display",
                   "dell_remove": "Remove unassigned Dell C8621QT display"}
        if user_input:
            action = user_input["action"]
            if action == "assisted":
                return await self.async_step_assisted()
            if action == "yaml":
                return await self.async_step_yaml()
            if action == "expert_yaml":
                return await self.async_step_expert_target()
            if action == "frontend":
                return await self.async_step_frontend()
            if action == "add_room":
                return await self.async_step_room()
            if action == "guided_activity":
                return await self.async_step_guided_activity()
            if action == "dell_add":
                self._dell_key = None
                return await self.async_step_dell_display()
            if action in ("dell_edit", "dell_remove"):
                self._option_action = action
                return await self.async_step_existing_dell()
            if action == "review":
                return await self.async_step_review()
            self._option_action = action
            return await self.async_step_existing_room()
        # The HA-facing choice has exactly two methods. Existing direct
        # action IDs remain accepted for the resident card's admin shortcuts,
        # but are not an overwhelming 19-choice entry menu.
        methods = {key: options[key] for key in ("assisted", "yaml")}
        return self.async_show_form(step_id="init", data_schema=vol.Schema({
            vol.Required("action"): vol.In(methods)}))

    async def async_step_assisted(self, user_input=None):
        """One friendly entry for the existing, fully functional HA wizard."""
        tasks = {
            "add_room": "Rooms · add a location and select devices",
            "edit_room": "Rooms · edit a location's devices",
            "rename_room": "Rooms · edit name or Home Assistant area",
            "remove_room": "Rooms · remove a location",
            "guided_activity": "Activities · create TV, movie, music or presentation",
            "add_activity": "Activities · add a custom activity",
            "edit_activity": "Activities · edit a full activity",
            "quick_edit_activity": "Activities · quick edit name and real HDMI input",
            "remove_activity": "Activities · remove an activity",
            "harmony_owner": "Advanced · Harmony / Premium command ownership",
            "tv_wake": "Advanced · TV Wake-on-LAN",
            "speech_endpoint": "Notifications · Native speech for idle speakers",
            "cec_device": "Advanced · HDMI-CEC device settings",
            "cec_activity": "Advanced · HDMI-CEC activity relationship",
            "dell_add": "Advanced · add an approved Dell C8621QT",
            "dell_edit": "Advanced · edit Dell display",
            "dell_remove": "Advanced · remove unassigned Dell display",
            "frontend": "Dashboard · enable or disable card",
            "expert_yaml": "Advanced · edit one exact object via Expert YAML",
            "review": "Review and save existing pending configuration",
        }
        if user_input is not None:
            task = user_input.get("task")
            if task in tasks:
                # Exactly the same internal routes as the pre-existing
                # Options Flow and the card's direct admin actions.
                return await self.async_step_init({"action": task})
        return self.async_show_form(step_id="assisted", data_schema=vol.Schema({
            vol.Required("task"): vol.In(tasks)}))

    async def async_step_expert_target(self, user_input=None):
        """Resolve one existing semantic object before providing YAML to the UX.

        No identifiers supplied by the frontend are accepted without checking
        the current Config Entry snapshot. HA Options Flow remains the only
        settings writer; this step does not select physical sources.
        """
        errors = {}
        if user_input is not None:
            scope, room_id, object_id = (user_input.get("scope"),
                                         user_input.get("room"),
                                         user_input.get("id") or "")
            room = self._original_rooms.get(room_id) if isinstance(room_id, str) else None
            selected = room if isinstance(room, dict) else {}
            collection = (selected.get("devices", {}) if scope == "device" else
                          selected.get("activities", {}) if scope == "activity" else {})
            if (scope not in ("room", "device", "activity")
                    or not isinstance(room, dict)
                    or not isinstance(object_id, str)
                    or not isinstance(collection, dict)
                    or (scope == "room" and object_id)
                    or (scope != "room" and object_id not in collection)):
                errors["base"] = "selection_changed"
            else:
                self._yaml_focus = (scope, room_id, object_id)
                return await self.async_step_yaml()
        return self.async_show_form(step_id="expert_target", errors=errors,
            data_schema=vol.Schema({
                vol.Required("scope"): vol.In({
                    "room": "Room settings",
                    "device": "One selected device role",
                    "activity": "One activity"}),
                vol.Required("room"): vol.In({
                    key: row.get("name", key) for key, row in self._original_rooms.items()}),
                vol.Optional("id", default=""): str}),
            description_placeholders={"note":
                "Select one existing room, device role or activity. "
                "Only that object can change; technical source selection stays in Foundation."})

    async def async_step_yaml(self, user_input=None):
        """Advanced admin YAML import; never writes before normal Review/Save."""
        errors = {}
        focus = getattr(self, "_yaml_focus", None)
        if user_input is not None:
            try:
                document = user_input.get("yaml_text")
                if focus is not None:
                    # The UX Expert action can never patch unrelated rooms,
                    # roles or activities, even if an admin edits the YAML root.
                    payload = _yaml_document(document)
                    changes = payload.get("changes") if set(payload) == {"changes"} else None
                    if (not isinstance(changes, list) or len(changes) != 1
                            or not isinstance(changes[0], dict)
                            or (changes[0].get("scope"), changes[0].get("room"),
                                changes[0].get("id") or "") != focus
                            or "set" not in changes[0] or "remove" in changes[0]):
                        raise ValueError("Expert YAML must update its selected object only")
                mode = user_input.get("mode", "merge")
                payload = _yaml_document(document)
                # Whole Multimedia includes rooms and existing Dell display
                # registrations / card preference; no new physical inventory
                # or extra configuration authority. Scoped objects are unchanged.
                if focus is None and payload and set(payload) <= {
                        "rooms", "dell_displays", "enable_ux"}:
                    room_document = yaml.safe_dump({"rooms": payload["rooms"]}) if "rooms" in payload else None
                    if room_document is not None:
                        proposed, explicit_removals = _yaml_plan(
                            room_document, self._original_rooms, mode)
                    else:
                        if mode != "merge":
                            raise ValueError("Replace needs a complete rooms mapping")
                        proposed, explicit_removals = deepcopy(self._original_rooms), []
                    configured_dell = payload.get("dell_displays", self._original_dell_displays)
                    if (not isinstance(configured_dell, dict)
                            or set(configured_dell) != set(self._original_dell_displays)):
                        raise ValueError("Use the dedicated guarded Dell wizard for add/remove")
                    dell = {}
                    for key, details in configured_dell.items():
                        previous_dell = self._original_dell_displays[key]
                        if (not isinstance(details, dict)
                                or set(details) != {"name", "host"}
                                or details["host"] != previous_dell["host"]
                                or not isinstance(details["name"], str)
                                or not 0 < len(details["name"].strip()) <= 80):
                            raise ValueError("Dell host/registration cannot be rebound from YAML")
                        dell[key] = {"name": details["name"].strip(),
                                     "host": details["host"]}
                    ux_option = payload.get("enable_ux", self._original_enable_ux)
                    if type(ux_option) is not bool:
                        raise ValueError("Invalid frontend preference")
                else:
                    proposed, explicit_removals = _yaml_plan(
                        document, self._original_rooms, mode)
                    dell = deepcopy(self._original_dell_displays)
                    ux_option = self._original_enable_ux
                previous, previous_dell, previous_ux = (
                    self._rooms, self._dell_displays, self._yaml_enable_ux)
                self._rooms = deepcopy(proposed)
                self._dell_displays = deepcopy(dell)
                self._yaml_enable_ux = ux_option
                try:
                    reason = self._review_configuration()
                except (ValueError, KeyError, TypeError, RecursionError):
                    self._rooms, self._dell_displays, self._yaml_enable_ux = (
                        previous, previous_dell, previous_ux)
                    errors["base"] = "selection_changed"
                else:
                    if reason:
                        self._rooms, self._dell_displays, self._yaml_enable_ux = (
                            previous, previous_dell, previous_ux)
                        errors["base"] = reason
                    else:
                        self._yaml_import = True
                        self._yaml_deleted_rooms = sorted(
                            set(self._original_rooms) - set(proposed)) + explicit_removals
                        self._yaml_diff = _yaml_change_summary(self._original_rooms, proposed)
                        if dell != self._original_dell_displays:
                            self._yaml_diff += "\nDell display labels changed: " + ", ".join(
                                sorted(k for k in dell if dell[k] != self._original_dell_displays[k]))
                        if ux_option != self._original_enable_ux:
                            self._yaml_diff += f"\nPremium UX enabled: {ux_option}"
                        if explicit_removals:
                            self._yaml_diff += "\nExplicit removals: " + ", ".join(explicit_removals)
                        return await self.async_step_review()
            except (ValueError, TypeError, OverflowError, RecursionError):
                errors["base"] = "yaml_invalid"
        if focus is not None:
            scope, room_id, object_id = focus
            room = self._original_rooms.get(room_id, {})
            obj = (room if scope == "room" else
                   room.get("devices" if scope == "device" else "activities", {}).get(object_id, {}))
            fields = {key: deepcopy(value) for key, value in obj.items()
                      if key in YAML_SCOPED_FIELDS[scope]
                      and not (scope == "room" and key in ("devices", "activities"))}
            # Build a complete object-scoped patch on the server. Frontend
            # never parses configuration YAML or guesses any HA source IDs.
            patch = {"scope": scope, "room": room_id, "set": fields}
            if scope != "room":
                patch["id"] = object_id
            current = yaml.safe_dump({"changes": [patch]}, sort_keys=False,
                                     allow_unicode=True, default_flow_style=False)
            schema = vol.Schema({vol.Required("yaml_text", default=current):
                selector.TextSelector(selector.TextSelectorConfig(multiline=True))})
            note = ("Expert editor for the selected object only. Other rooms, "
                    "devices and activities cannot be changed here. "
                    "Preview before the same guarded HA Options Flow Save.")
        else:
            current = yaml.safe_dump({
                "rooms": self._rooms,
                "dell_displays": self._original_dell_displays,
                "enable_ux": self._original_enable_ux,
            }, sort_keys=False, allow_unicode=True, default_flow_style=False)
            schema = vol.Schema({
                vol.Required("mode", default="merge"): vol.In({
                    "merge": "Apply scoped changes or merge complete rooms (preserve others)",
                    "replace": "Replace all rooms (full rooms export only; destructive)"}),
                vol.Required("yaml_text", default=current):
                    selector.TextSelector(selector.TextSelectorConfig(multiline=True))})
            note = ("Live HA Options Flow: use changes: for independent room/device/activity edits, "
                    "or rooms: for complete room import/export. Review before Save; "
                    "Foundation alone selects physical sources. No configuration.yaml/.storage writes.")
        return self.async_show_form(step_id="yaml", errors=errors,
                                    data_schema=schema,
                                    description_placeholders={"note": note})

    async def async_step_guided_activity(self, user_input=None):
        """Activity-first setup using only existing HA Options Flow writes."""
        if user_input is not None:
            intent = user_input.get("activity_type")
            if intent in ACTIVITIES:
                self._guided_activity_type = intent
                return await self.async_step_guided_room()
        return self.async_show_form(step_id="guided_activity",
            data_schema=vol.Schema({
                vol.Required("activity_type", default="watch_tv"): vol.In(_activity_choices(self.hass))
            }))

    async def async_step_guided_room(self, user_input=None):
        """Select room second; configure real assets if none exists yet."""
        rooms = {key: row.get("name", key) for key, row in self._rooms.items()}
        if not rooms:
            return await self.async_step_room()
        if user_input is not None:
            room = user_input.get("room")
            if room in rooms:
                self._room_id = room
                return await self.async_step_activity()
        return self.async_show_form(step_id="guided_room",
            data_schema=vol.Schema({vol.Required("room"): vol.In(rooms)}))

    async def async_step_existing_dell(self, user_input=None):
        """No removal while selected in an existing room; no silent rebinding."""
        if not self._dell_displays:
            return await self.async_step_init()
        errors = {}
        if user_input is not None:
            key = user_input.get("display")
            if key not in self._dell_displays:
                errors["base"] = "selection_changed"
            else:
                self._dell_key = key
                if self._option_action == "dell_edit":
                    return await self.async_step_dell_display()
                return await self.async_step_dell_remove()
        return self.async_show_form(step_id="existing_dell", errors=errors,
            data_schema=vol.Schema({vol.Required("display"): vol.In({
                key: spec["name"] for key, spec in self._dell_displays.items()})}))

    async def async_step_dell_display(self, user_input=None):
        """Configure a real local LAN IP; no HTTP scraping or speculative WOL."""
        prior = self._dell_displays.get(self._dell_key, {})
        errors = {}
        if user_input is not None:
            label = str(user_input.get("name", "")).strip()
            try:
                host = valid_host(user_input.get("host", ""))
            except ValueError:
                errors["base"] = "dell_invalid_host"
            else:
                key = self._dell_key or _slug(label)
                if not label or len(label) > 80:
                    errors["base"] = "room_required"
                elif key in self._dell_displays and key != self._dell_key:
                    errors["base"] = "room_exists"
                elif any(other["host"] == host for existing, other in self._dell_displays.items()
                         if existing != self._dell_key):
                    errors["base"] = "dell_duplicate_host"
                elif self._dell_key and host != prior["host"]:
                    # IP replacement could silently reassign an existing HA device
                    # to unrelated physical hardware. First unbind, then re-add.
                    errors["base"] = "dell_host_immutable"
                else:
                    self._dell_displays[key] = {"name": label, "host": host}
                    return await self.async_step_review()
        return self.async_show_form(step_id="dell_display", errors=errors,
            data_schema=vol.Schema({
                vol.Required("name", default=prior.get("name", "")): str,
                vol.Required("host", default=prior.get("host", "")): str,
            }), description_placeholders={"model": "Dell C8621QT", "port": "4661"})

    async def async_step_dell_remove(self, user_input=None):
        """Never remove a selected native display before its room is unbound."""
        from homeassistant.helpers import entity_registry as er
        key = self._dell_key
        entity_id = er.async_get(self.hass).async_get_entity_id(
            "media_player", DOMAIN, f"{self._entry.entry_id}:dell:{key}")
        assigned = entity_id and any(
            device.get("entity") == entity_id for room in self._rooms.values()
            for device in room.get("devices", {}).values())
        if assigned:
            return self.async_show_form(step_id="dell_remove",
                errors={"base": "stop_room_before_edit"}, data_schema=vol.Schema({}))
        if user_input and user_input.get("confirm"):
            self._dell_displays.pop(key)
            return await self.async_step_review()
        return self.async_show_form(step_id="dell_remove",
            data_schema=vol.Schema({vol.Required("confirm", default=False): bool}),
            description_placeholders={"display": self._dell_displays[key]["name"]})

    async def async_step_existing_room(self, user_input=None):
        choices = {key: row.get("name", key) for key, row in self._rooms.items()}
        if not choices:
            return await self.async_step_room()
        if user_input:
            self._room_id = user_input["room"]
            if self._option_action == "remove_room":
                self._rooms.pop(self._room_id)
                return await self.async_step_review()
            if self._option_action == "rename_room":
                return await self.async_step_room_settings()
            if self._option_action == "harmony_owner":
                return await self.async_step_harmony_owner()
            if self._option_action == "tv_wake":
                return await self.async_step_tv_wake()
            if self._option_action == "speech_endpoint":
                return await self.async_step_speech_endpoint()
            if self._option_action == "cec_device":
                return await self.async_step_cec_device()
            if self._option_action == "edit_room":
                self._editing_room = True
                self._previous_room = deepcopy(self._rooms[self._room_id])
                self._rooms[self._room_id]["devices"] = {}
                return await self.async_step_display()
            if self._option_action == "add_activity":
                return await self.async_step_activity()
            return await self.async_step_existing_activity()
        return self.async_show_form(step_id="existing_room", data_schema=vol.Schema({
            vol.Required("room"): vol.In(choices)}))

    async def async_step_tv_wake(self, user_input=None):
        """Bind directed WOL only to a Foundation-selected LG screen and native MAC."""
        screen = self._rooms[self._room_id]["devices"].get("screen")
        selected, _ = av_sources(self.hass)
        approved = next((source for source in selected
                         if screen and source.concept == "display" and source.provider == "webostv"
                         and source.entity_id == screen["entity"]
                         and source.candidate_id == screen.get("foundation_candidate_id")), None)
        macs = sorted(selected_native_macs(self.hass, approved))
        if not macs:
            return self.async_show_form(step_id="tv_wake",
                errors={"base": "wake_unavailable"}, data_schema=vol.Schema({}))
        current = screen.get("power_on", {})
        wol = current if current.get("action") == "wake_on_lan.send_magic_packet" else {}
        prior = wol.get("data", {})
        errors = {}
        if user_input is not None:
            mode = user_input.get("mode")
            if mode == "keep":
                return await self.async_step_review()
            if mode == "clear":
                if wol:
                    screen.pop("power_on", None)
                return await self.async_step_review()
            if mode == "directed":
                action = {"action": "wake_on_lan.send_magic_packet", "data": {
                    "mac": str(user_input.get("mac", "")).lower(),
                    "broadcast_address": user_input.get("broadcast_address", ""),
                    "broadcast_port": user_input.get("broadcast_port", 9)}}
                try:
                    validate_action(action, screen["entity"], True)
                    if action["data"]["mac"] not in macs:
                        raise ValueError("MAC not on selected HA device")
                except (TypeError, ValueError):
                    errors["base"] = "wake_invalid_target"
                else:
                    screen["power_on"] = action
                    return await self.async_step_review()
            else:
                errors["base"] = "wake_invalid_target"
        default_mac = str(prior.get("mac", "")).lower()
        return self.async_show_form(step_id="tv_wake", errors=errors,
            data_schema=vol.Schema({
                vol.Required("mode", default="keep"): vol.In({
                    "keep": "Keep existing power-on action",
                    "directed": "Use directed Wake-on-LAN destination",
                    "clear": "Clear existing WOL override"}),
                vol.Required("mac", default=default_mac if default_mac in macs else macs[0]):
                    vol.In({mac: mac for mac in macs}),
                vol.Optional("broadcast_address", default=prior.get("broadcast_address", "")): str,
                vol.Optional("broadcast_port", default=prior.get("broadcast_port", 9)): int,
            }), description_placeholders={"screen": screen["entity"]})

    async def async_step_speech_endpoint(self, user_input=None):
        """Explicit opt-in, one native destination per asset, same Options Flow."""
        room = self._rooms[self._room_id]
        sources, _ = av_sources(self.hass)
        selected = {(s.concept, s.entity_id): s for s in sources}
        players = {key: device for key, device in room["devices"].items()
                   if device.get("speech_tts_registry_id") or (
                       not room.get("harmony_controller") and speech_player_eligible(
                           self.hass, device, selected.get((device.get("foundation_concept"), device["entity"]))))}
        choices = tts_choices(self.hass)
        errors = {}
        if user_input is not None and user_input.get("player") in players:
            device = players[user_input["player"]]
            target = user_input.get("tts", NONE)
            source = selected.get((device.get("foundation_concept"), device["entity"]))
            if (not user_input.get("confirm") or
                    target != NONE and (target not in choices or room.get("harmony_controller")
                                        or not speech_player_eligible(self.hass, device, source))):
                errors["base"] = "speech_invalid"
            else:
                physical = device.get("physical_id", device["entity"])
                for spec in self._rooms.values():
                    for linked in spec["devices"].values():
                        if linked.get("physical_id", linked["entity"]) == physical:
                            if target == NONE:
                                linked.pop("speech_tts_registry_id", None)
                            else:
                                linked["speech_tts_registry_id"] = target
                return await self.async_step_review()
        elif user_input is not None:
            errors["base"] = "speech_invalid"
        if not players:
            return self.async_show_form(step_id="speech_endpoint",
                errors={"base": "speech_unavailable"}, data_schema=vol.Schema({}))
        return self.async_show_form(step_id="speech_endpoint", errors=errors,
            data_schema=vol.Schema({
                vol.Required("player"): vol.In({key: device.get("name", device["entity"])
                                                for key, device in players.items()}),
                vol.Required("tts", default=NONE): vol.In({NONE: "Disable speech", **choices}),
                vol.Required("confirm", default=False): bool,
            }))

    async def async_step_harmony_owner(self, user_input=None):
        room = self._rooms[self._room_id]
        sources, _ = av_sources(self.hass)
        approved = {(source.entity_id, source.candidate_id) for source in sources
                    if source.provider == "harmony" and source.concept == "source"
                    and source.entity_id.startswith("remote.")}
        options = {NONE: "Premium owns the room"}
        for key, device in room["devices"].items():
            if (device["entity"], device.get("foundation_candidate_id")) in approved:
                options[key] = "Harmony owns the room: " + device["entity"]
        prior = room.get("harmony_controller", NONE)
        if prior != NONE and prior not in options:
            options[prior] = "Existing Harmony controller (selection needs review)"
        errors = {}
        if user_input is not None:
            chosen = user_input.get("controller")
            if chosen not in options or not user_input.get("confirm"):
                errors["base"] = "confirm_harmony_scope"
            else:
                if chosen == NONE:
                    room.pop("harmony_controller", None)
                else:
                    room["harmony_controller"] = chosen
                return await self.async_step_review()
        return self.async_show_form(step_id="harmony_owner", errors=errors,
            data_schema=vol.Schema({vol.Required("controller", default=prior): vol.In(options),
                                    vol.Required("confirm", default=False): bool}))

    async def async_step_room_settings(self, user_input=None):
        room = self._rooms[self._room_id]
        areas = area_choices(self.hass)
        errors = {}
        if user_input is not None:
            name = str(user_input.get("room_name", "")).strip()
            area = user_input.get("area", CUSTOM_AREA)
            if not name or (area != CUSTOM_AREA and area not in areas):
                errors["base"] = "room_required"
            else:
                room.update(name=name, area_id=area if area in areas else None)
                return await self.async_step_review()
        return self.async_show_form(step_id="room_settings", errors=errors,
            data_schema=vol.Schema({vol.Required("room_name", default=room.get("name", self._room_id)): str,
              vol.Required("area", default=room.get("area_id") if room.get("area_id") in areas else CUSTOM_AREA):
                  vol.In({**areas, CUSTOM_AREA: "No Home Assistant area"})}))

    async def async_step_cec_device(self, user_input=None):
        """Configure an explicitly checked native HDMI-CEC setting, never scan."""
        room = self._rooms[self._room_id]
        choices = {key: f"{dev['entity']} · {dev.get('role', key)}"
                   for key, dev in room["devices"].items()
                   if dev["entity"].startswith("media_player.")
                   and dev.get("foundation_candidate_id")}
        if not choices:
            return await self.async_step_review()
        errors = {}
        if user_input is not None:
            key = user_input.get("device")
            enabled = user_input.get("enabled")
            if key not in choices or type(enabled) is not bool:
                errors["base"] = "cec_invalid"
            else:
                physical = room["devices"][key].get("physical_id", room["devices"][key]["entity"])
                proposal = deepcopy(self._rooms)
                for spec in proposal.values():
                    for dev in spec["devices"].values():
                        if dev.get("physical_id", dev["entity"]) == physical:
                            dev["hdmi_cec_enabled"] = enabled
                try:
                    validate_rooms(proposal)
                except ValueError:
                    errors["base"] = "cec_in_use"
                else:
                    self._rooms = proposal
                    return await self.async_step_review()
        chosen = (user_input or {}).get("device", next(iter(choices)))
        return self.async_show_form(step_id="cec_device", errors=errors,
            data_schema=vol.Schema({
                vol.Required("device", default=chosen if chosen in choices else next(iter(choices))): vol.In(choices),
                vol.Required("enabled", default=room["devices"][chosen].get("hdmi_cec_enabled", False)
                             if chosen in choices else False): bool,
            }),
            description_placeholders={"room": room.get("name", self._room_id)})

    async def async_step_cec_activity(self, user_input=None):
        """Declare a tested HDMI edge, with exact omissions and target-state policy.

        Uses existing Options Flow atomic review/save. No writes to hardware.
        Disabling a link never edits or removes a physical/source route step.
        """
        room = self._rooms[self._room_id]
        activity = room["activities"][self._editing_activity]
        cast = set(activity["devices"])
        choices = {key: f"{room['devices'][key]['entity']} ({room['devices'][key].get('role', key)})"
                   for key in activity["devices"]
                   if key in room["devices"] and room["devices"][key].get("hdmi_cec_enabled") is True}
        sources = {key: title for key, title in choices.items()
                   if room["devices"][key].get("foundation_concept") in ("source", "amplifier")}
        targets = {key: title for key, title in choices.items()
                   if room["devices"][key].get("foundation_concept") in ("display", "amplifier")
                   and any(step.get("device") == key and step.get("type") == "source"
                           for step in activity.get("steps", []))}
        existing = {link["target"]: link for link in activity.get("cec_links", [])}
        if not sources or not targets:
            return self.async_show_form(step_id="cec_activity", errors={"base": "cec_needs_endpoints"},
                data_schema=vol.Schema({}),
                description_placeholders={"activity": activity.get("name", self._editing_activity)})
        errors = {}
        if user_input is not None:
            target = user_input.get("target")
            source = user_input.get("source")
            if target not in targets or source not in sources or source == target:
                errors["base"] = "cec_invalid"
            else:
                change = {
                    "source": source, "target": target,
                    "verified_link": user_input.get("verified_link"),
                    "skip_power_on": user_input.get("skip_power_on"),
                    "skip_power_off": user_input.get("skip_power_off"),
                    "skip_source": user_input.get("skip_source"),
                }
                updated = deepcopy(activity)
                updated["cec_links"] = [link for link in updated.get("cec_links", [])
                                         if link["target"] != target]
                if user_input.get("remove_link") is not True:
                    updated["cec_links"].append(change)
                try:
                    cec_links_for_activity(room, updated)
                    proposal = deepcopy(self._rooms)
                    proposal[self._room_id]["activities"][self._editing_activity] = updated
                    validate_rooms(proposal)
                except ValueError:
                    errors["base"] = "cec_invalid"
                else:
                    self._rooms = proposal
                    return await self.async_step_review()
        default_target = (user_input or {}).get("target", next(iter(targets)))
        old = existing.get(default_target, {})
        default_source = old.get("source") if old.get("source") in sources else next(iter(sources))
        return self.async_show_form(step_id="cec_activity", errors=errors,
            data_schema=vol.Schema({
                vol.Required("target", default=default_target if default_target in targets else next(iter(targets))): vol.In(targets),
                vol.Required("source", default=default_source): vol.In(sources),
                vol.Required("verified_link", default=old.get("verified_link", False)): bool,
                vol.Required("skip_power_on", default=old.get("skip_power_on", False)): bool,
                vol.Required("skip_power_off", default=old.get("skip_power_off", False)): bool,
                vol.Required("skip_source", default=old.get("skip_source", False)): bool,
                vol.Required("remove_link", default=False): bool,
            }),
            description_placeholders={"activity": activity.get("name", self._editing_activity)})

    async def async_step_existing_activity(self, user_input=None):
        choices = {key: row.get("name", key) for key, row in self._rooms[self._room_id]["activities"].items()}
        if not choices:
            return await self.async_step_review()
        if user_input:
            key = user_input["activity"]
            if self._option_action == "remove_activity":
                self._rooms[self._room_id]["activities"].pop(key)
                return await self.async_step_review()
            if self._option_action == "quick_edit_activity":
                self._editing_activity = key
                return await self.async_step_quick_edit_activity()
            if self._option_action == "cec_activity":
                self._editing_activity = key
                return await self.async_step_cec_activity()
            self._editing_activity = key
            return await self.async_step_activity()
        return self.async_show_form(step_id="existing_activity", data_schema=vol.Schema({
            vol.Required("activity"): vol.In(choices)}))

    def _quick_edit_source_roles(self):
        """Selected room players only; leave complex legacy multi-source casts to full edit."""
        activity = self._rooms[self._room_id]["activities"][self._editing_activity]
        devices = self._rooms[self._room_id]["devices"]
        roles = {key: device["entity"] for key, device in devices.items()
                 if device.get("foundation_concept") == "source"
                 and device["entity"].startswith("media_player.")}
        current = [key for key in activity["devices"] if key in roles]
        if len(current) > 1 or any(key.startswith("source_") and key not in roles
                                    for key in activity["devices"]):
            return {}
        return roles

    def _quick_edit_route_fields(self):
        """Read live HA input options; preserve configured routes when temporarily offline."""
        activity = self._rooms[self._room_id]["activities"][self._editing_activity]
        devices = self._rooms[self._room_id]["devices"]
        fields = {}
        for key in activity["devices"]:
            options = source_lists(self.hass, devices[key]["entity"])
            for field, list_field in (("source", "source_list"), ("sound_mode", "sound_mode_list")):
                existing = [step for step in activity.get("steps", [])
                            if step["device"] == key and step["type"] == field]
                offered = options[list_field]
                if not offered and not existing:
                    continue
                name = f"route_{key}_{field}"
                choices = {UNCHANGED: "Keep current input / no change",
                           **{value: value for value in offered}}
                if existing:
                    choices[REMOVE_ROUTE] = "Remove this configured route"
                fields[vol.Required(name, default=UNCHANGED)] = vol.In(choices)
        return fields

    async def async_step_quick_edit_activity(self, user_input=None):
        """Atomic name/source-cast/route edit, never a second store or physical writer.

        Retained cast steps survive. Removing a source's custom steps is explicit,
        and an added/changed player requires confirmed native destination input.
        """
        activity = self._rooms[self._room_id]["activities"][self._editing_activity]
        devices = self._rooms[self._room_id]["devices"]
        sources = self._quick_edit_source_roles()
        current_source = next((key for key in activity["devices"] if key in sources), NONE)
        errors = {}
        if user_input is not None:
            name = str(user_input.get("activity_name", "")).strip()
            new_source = user_input.get("primary_source", current_source)
            if not name:
                errors["base"] = "activity_required"
            elif new_source != current_source and new_source not in (NONE, *sources):
                errors["base"] = "source_required"
            else:
                changes = []
                for key in activity["devices"]:
                    options = source_lists(self.hass, devices[key]["entity"])
                    for field, list_field in (("source", "source_list"), ("sound_mode", "sound_mode_list")):
                        chosen = user_input.get(f"route_{key}_{field}", UNCHANGED)
                        if chosen == UNCHANGED:
                            continue
                        existing = any(step["device"] == key and step["type"] == field
                                       for step in activity.get("steps", []))
                        if chosen not in options[list_field] and not (
                                chosen == REMOVE_ROUTE and existing):
                            errors["base"] = "route_changed"
                            break
                        changes.append((key, field, chosen))
                    if errors:
                        break
                changing_source = new_source != current_source
                if not errors and changing_source:
                    destination_keys = [key for key in activity["devices"] if key not in sources
                                        and source_lists(self.hass, devices[key]["entity"])["source_list"]]
                    if destination_keys and not any(key in destination_keys and field == "source"
                                                    and chosen != REMOVE_ROUTE
                                                    for key, field, chosen in changes):
                        errors["base"] = "source_route_required"
                    removed = {current_source} if current_source != NONE else set()
                    destructive = any(step["device"] in removed for typ in ("steps", "stop_steps")
                                      for step in activity.get(typ, []))
                    if not errors and destructive and not user_input.get("confirm_source_steps"):
                        errors["base"] = "confirm_source_steps"
                if not errors:
                    candidate = deepcopy(activity)
                    candidate["name"] = name
                    if changing_source:
                        # Keep semantic activity type coherent with the edited cast.
                        # A player-based watch_source becoming HDMI-only must no
                        # longer default to the player-required wizard on next edit.
                        if candidate.get("activity_type") in ("watch_tv", "watch_hdmi", "watch_source"):
                            candidate["activity_type"] = "watch_source" if new_source != NONE else "watch_hdmi"
                        removed = {current_source} if current_source != NONE else set()
                        candidate["devices"] = [key for key in candidate["devices"] if key not in removed]
                        if new_source != NONE and new_source not in candidate["devices"]:
                            candidate["devices"].append(new_source)
                        for typ in ("steps", "stop_steps"):
                            if typ in candidate:
                                candidate[typ] = [step for step in candidate[typ]
                                                  if step["device"] not in removed]
                    for key, field, chosen in changes:
                        steps = candidate.setdefault("steps", [])
                        position = next((i for i, step in enumerate(steps)
                                         if step["device"] == key and step["type"] == field), len(steps))
                        candidate["steps"] = [step for step in steps
                                              if not (step["device"] == key and step["type"] == field)]
                        if chosen != REMOVE_ROUTE:
                            candidate["steps"].insert(position, {
                                "type": field, "device": key, "candidates": [chosen]})
                    self._rooms[self._room_id]["activities"][self._editing_activity] = candidate
                    self._editing_activity = None
                    return await self.async_step_review()
        fields = {vol.Required("activity_name", default=activity.get("name", self._editing_activity)): str}
        if sources:
            fields[vol.Required("primary_source", default=current_source)] = vol.In({
                NONE: "HDMI route only / no native player", **sources})
            fields[vol.Optional("confirm_source_steps", default=False)] = bool
        fields.update(self._quick_edit_route_fields())
        return self.async_show_form(step_id="quick_edit_activity", errors=errors,
            data_schema=vol.Schema(fields), description_placeholders={
                "room": self._rooms[self._room_id]["name"],
                "activity": activity.get("name", self._editing_activity),
                "devices": ", ".join(devices[key]["entity"] for key in activity["devices"]),
            })

    async def async_step_frontend(self, user_input=None):
        if user_input is not None:
            return self.async_create_entry(title="", data={**self._entry.options, **user_input})
        return self.async_show_form(step_id="frontend", data_schema=vol.Schema({
            vol.Required("enable_ux", default=self._entry.options.get("enable_ux", True)): bool}))

    async def _finish(self):
        options = {**self._entry.options, CONF_ROOMS: self._rooms,
                   "dell_displays": self._dell_displays}
        if self._yaml_enable_ux is not None:
            options["enable_ux"] = self._yaml_enable_ux
        return self.async_create_entry(title="", data=options)
