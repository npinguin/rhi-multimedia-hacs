"""RHI Multimedia semantic setup over supported Foundation technical discovery.

Flow: discovered logical AV devices -> optional multiple rooms -> activities
-> exact physical routes -> existing atomic HA Options Flow Review/Save.
Discovery and saved read-only assignments never grant command authority.
No second scanner, state store or guessed hardware connections.
"""
from __future__ import annotations

from copy import deepcopy
import json
import re
import yaml
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.helpers import selector

from .const import CONF_ROOMS, CONF_TITLE, DOMAIN
from .dell_c8621qt import valid_host
from .engine import READY_STATES, execution_in_progress
from .foundation import authorized_source, reviewed_native_source, selected_native_macs, projection_source_reads
from .source_discovery import (area_choices, av_sources, discovered_av_sources,
                               logical_av_catalog, proposed_room_setup, source_lists, speech_player_eligible,
                               native_source_evidence,
                               tts_choices)
from .validation import (ACTIVITY_BUTTONS, BUTTON_ACTIONS, BUTTON_VALUE_ACTIONS,
                         native_state, native_choices, native_feature_mask, cec_links_for_activity, route_status, validate_action,
                         validate_rooms, validate_step_delay)

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
    available, _ = discovered_av_sources(flow.hass)
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
               + f" · {x.logical_type.replace('_', ' ')}"
               + (f" · HA area: {area_names.get(x.area_id, x.area_id)}" if x.area_id
                  else " · HA area unknown")
               + assignment(x.candidate_id)
               + (" · command approval pending" if not x.approved else "")
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
    available, _ = discovered_av_sources(flow.hass)
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
    matches, _ = discovered_av_sources(flow.hass)
    exact = [x for x in matches if x.entity_id == entity_id and x.concept == concept
             and not x.review_reason]
    if len(exact) > 1:
        raise ValueError(f"{entity_id}: ambiguous Foundation/{concept} source; review native identity")
    candidate = exact[0] if exact else None
    old = (flow._previous_room or {}).get("devices", {})
    previous = next((dev for dev in old.values()
                     if dev.get("entity") == entity_id and dev.get("foundation_concept") == concept
                     and (candidate is None or dev.get("foundation_candidate_id") == candidate.candidate_id)), None)
    if previous is not None:
        return deepcopy(previous)
    if candidate is None:
        raise ValueError(f"{entity_id}: not in supported Foundation/{concept} discovery")
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
        self._activity_tuning = False

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
                        self._activity_favorite = user_input.get(
                            "favorite", previous.get("favorite", False))
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
        schema = {vol.Required("activity_name", default=label): str,
                  vol.Optional("favorite", default=previous.get("favorite", False)): bool}
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
        result = {**self._activity_previous, "name": self._activity_name,
                  "activity_type": self._activity_type,
                  "devices": list(self._activity_cast), "steps": list(self._steps)}
        if getattr(self, "_activity_favorite", False):
            result["favorite"] = True
        else:
            result.pop("favorite", None)
        activities[self._activity_key] = result
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
        # The same HA Options Flow owns a new activity from the first native
        # input choice through device order, typed steps and one atomic Save.
        # A missing/older room draft must not become an unrelated edit.
        eligible = (self._room_id in self._rooms
                    and self._activity_key in self._rooms[self._room_id]["activities"])
        options = {**NEXT, **({"tune_activity": "Choose devices, order and action sequence"}
                              if eligible else {})}
        if user_input:
            action = user_input.get("action")
            if action == "add_activity":
                return await self.async_step_activity()
            if action == "add_room":
                return await self.async_step_room()
            if action == "tune_activity" and eligible:
                self._editing_activity = self._activity_key
                self._activity_tuning = True
                return await self.async_step_activity_devices()
            if action != "review":
                return self.async_show_form(step_id="next",
                    errors={"base": "selection_changed"}, data_schema=vol.Schema({
                        vol.Required("action", default="review"): vol.In(options)}))
            return await self.async_step_review()
        return self.async_show_form(step_id="next", data_schema=vol.Schema({
            vol.Required("action", default="review"): vol.In(options)}))

    async def async_step_activity_tune(self, user_input=None):
        """Continue editing one draft activity, still before any HA Options Save."""
        if (not getattr(self, "_activity_tuning", False)
                or self._editing_activity not in self._rooms[self._room_id]["activities"]):
            return await self.async_step_review()
        if user_input:
            action = user_input.get("action")
            if action == "script":
                return await self.async_step_script_step()
            if action == "review":
                return await self.async_step_review()
        activity = self._rooms[self._room_id]["activities"][self._editing_activity]
        return self.async_show_form(step_id="activity_tune",
            data_schema=vol.Schema({
                vol.Required("action", default="script"): vol.In({
                    "script": "Add, edit, move or remove a start/stop action",
                    "review": "Review and save the complete activity"})}),
            description_placeholders={
                "activity": activity.get("name", self._editing_activity),
                "steps": str(len(activity.get("steps", []))),
                "stop_steps": str(len(activity.get("stop_steps", []))),
                "note": "Continue editing actions or review the whole draft; no equipment commands are sent.",
            })

    async def _script_edit_done(self):
        # Native standalone step editing still goes to Review; a newly created
        # activity can accumulate as many safe actions as needed before Save.
        if getattr(self, "_activity_tuning", False):
            return await self.async_step_activity_tune()
        return await self.async_step_review()

    def _review_summary(self):
        lines = []
        for room in self._rooms.values():
            lines.append(f"{room.get('name', 'Room')}:")
            if room.get("harmony_controller"):
                lines.append("  Harmony reserves declared endpoints while active or unverified; confirmed PowerOff permits authorized Premium controls.")
            for key, device in room["devices"].items():
                state = native_state(self.hass, device["entity"])
                intent = " · native control approval requested" if device.get("control_approved") is True else ""
                lines.append(f"  {key}: {device['entity']} ({state.state if state else 'unavailable'}){intent}")
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

    def _resolve_yaml_bindings(self, rooms):
        """Resolve missing candidate IDs from exact native entity/concept only.

        Explicitly supplied and existing identities are never silently repaired.
        An explicit control_approved intent still needs the normal Review/Save
        and the unchanged runtime native authorization gate.
        """
        sources, _ = discovered_av_sources(self.hass)
        errors = []
        for room_id, room in rooms.items():
            if not isinstance(room, dict) or not isinstance(room.get("devices"), dict):
                continue  # Canonical structural validator reports these shapes.
            for key, device in room["devices"].items():
                if not isinstance(device, dict) or device.get("foundation_candidate_id"):
                    continue
                if str(device.get("entity", "")).startswith("REPLACE_WITH_"):
                    continue  # Canonical preflight reports the unresolved site slot.
                if not isinstance(device.get("entity"), str) or not isinstance(device.get("foundation_concept"), str):
                    continue
                path = f"rooms.{room_id}.devices.{key}"
                previous = self._original_rooms.get(room_id, {}).get("devices", {}).get(key, {})
                if previous == device:
                    continue  # Unchanged legacy pending source remains read-only.
                if previous.get("entity") == device.get("entity") and previous.get("foundation_concept") == device.get("foundation_concept") and previous.get("foundation_candidate_id"):
                    # Preserve the previous exact binding; a stale link needs an
                    # explicit repair, never an automatic identity replacement.
                    for field, value in previous.items():
                        if field.startswith("foundation_"):
                            device.setdefault(field, value)
                    if "control_approved" in previous:
                        device.setdefault("control_approved", previous["control_approved"])
                    continue
                matches = [src for src in sources if src.entity_id == device.get("entity")
                           and src.concept == device.get("foundation_concept") and not src.review_reason]
                if len(matches) != 1:
                    errors.append(f"{path}: expected one current Foundation candidate for {device.get('entity')!r} / {device.get('foundation_concept')!r}; found {len(matches)}. Review native discovery.")
                    continue
                src = matches[0]
                device["foundation_candidate_id"] = src.candidate_id
                if device.get("control_approved") is True:
                    for field, value in {"foundation_entity_registry_id": src.entity_registry_id,
                                         "foundation_config_entry_id": src.config_entry_id,
                                         "foundation_device_registry_id": src.device_registry_id,
                                         "foundation_provider": src.provider}.items():
                        if field in device and device[field] != value:
                            errors.append(f"{path}.{field}: supplied native identity does not match current discovery")
                        else:
                            device[field] = value
        if errors:
            raise ValueError("\n".join(errors))

    def _review_configuration(self):
        self._review_detail = ""
        self._review_blocker = None
        if self._rooms:
            validate_rooms(self._rooms)
        current, _ = av_sources(self.hass)
        supported, _ = discovered_av_sources(self.hass)
        selected = {(s.concept, s.entity_id, s.candidate_id) for s in current}
        command_sources = list(current)
        problems = []
        # Reviewed semantic configuration is explicit control intent in the
        # single native Multimedia Options Flow. Verify exact current
        # Foundation/native identity BEFORE accepting this one Save. Discovery
        # alone never activates a device or weakens the runtime command guard.
        for room_id, proposed_room in self._rooms.items():
            previous_devices = self._original_rooms.get(room_id, {}).get("devices", {})
            for device_key, device in proposed_room.get("devices", {}).items():
                if device.get("control_approved") is not True:
                    continue
                # Keep a previously saved, unchanged stale source as an
                # explicitly NON-executable HOLD. Its own runtime authorization
                # remains fail-closed; it must not prevent unrelated room or
                # single-device edits from reaching the same atomic Save.
                approved_source = authorized_source(self.hass, device)
                if approved_source is None:
                    if previous_devices.get(device_key) == device:
                        continue
                    problems.append(f"rooms.{room_id}.devices.{device_key}: reviewed native control binding is no longer valid; select the matching Foundation device")
                    continue
                match = next((source for source in supported
                              if source.concept == device.get("foundation_concept")
                              and source.entity_id == device.get("entity")
                              and source.candidate_id == device.get("foundation_candidate_id")
                              and source.review_reason is None), None)
                if match is None:
                    if previous_devices.get(device_key) == device:
                        continue
                    problems.append(f"rooms.{room_id}.devices.{device_key}: reviewed native control is not in supported discovery; review the current native candidate")
                    continue
                key = (match.concept, match.entity_id, match.candidate_id)
                selected.add(key)
                if not any((source.concept, source.entity_id, source.candidate_id) == key
                           for source in command_sources):
                    command_sources.append(match)
        # Ambiguous technical identity is visible for repair but cannot be
        # saved as a new semantic binding until Foundation resolves it.
        discovered = {(s.concept, s.entity_id, s.candidate_id) for s in supported
                      if s.review_reason != "ambiguous_candidate_identity"}
        for room_id, room in self._rooms.items():
            previous = self._original_rooms.get(room_id, {})
            for key, device in room["devices"].items():
                if ((device.get("foundation_concept"), device.get("entity"),
                     device.get("foundation_candidate_id")) not in discovered
                        and previous.get("devices", {}).get(key) != device):
                    problems.append(f"rooms.{room_id}.devices.{key}: {device.get('entity')} not in Foundation-supported discovery; select the exact current candidate")
                    continue
                tts_id = device.get("speech_tts_registry_id")
                if tts_id and tts_id != previous.get("devices", {}).get(key, {}).get("speech_tts_registry_id"):
                    approved_speech = next((source for source in command_sources
                                            if source.concept == device.get("foundation_concept")
                                            and source.entity_id == device["entity"]
                                            and source.candidate_id == device.get("foundation_candidate_id")), None)
                    if (not speech_player_eligible(
                            self.hass, device, approved_speech) or tts_id not in tts_choices(self.hass)):
                        problems.append(f"rooms.{room_id}.devices.{key}.speech_tts_registry_id: speech requires an exact selected Cast source and native TTS provider")
                # The visual whole-home editor and scoped/global YAML share
                # the exact native MAC + approved source gate. A read-only
                # discovered device is never authorized for Wake-on-LAN.
                wol = device.get("power_on", {})
                prior_wol = previous.get("devices", {}).get(key, {}).get("power_on")
                if (isinstance(wol, dict)
                        and wol.get("action") == "wake_on_lan.send_magic_packet"
                        and wol != prior_wol):
                    approved_wol = next((source for source in command_sources
                                         if source.concept == device.get("foundation_concept")
                                         and source.entity_id == device.get("entity")
                                         and source.candidate_id == device.get("foundation_candidate_id")), None)
                    if (approved_wol is None
                            or approved_wol.provider == "harmony"
                            or not device["entity"].startswith(("media_player.", "remote."))
                            or str(wol.get("data", {}).get("mac", "")).lower()
                            not in selected_native_macs(self.hass, approved_wol)):
                        problems.append(f"rooms.{room_id}.devices.{key}.power_on: Wake-on-LAN MAC must belong to the authorized native device; choose a verified native MAC")
                # A physical AV device has one wake destination across all
                # consuming rooms. Existing unchanged legacy settings remain
                # readable, but newly edited WOL cannot diverge by room.
                if (wol != (prior_wol or {})
                        and (wol.get("action") == "wake_on_lan.send_magic_packet"
                             or (isinstance(prior_wol, dict)
                                 and prior_wol.get("action") == "wake_on_lan.send_magic_packet"))):
                    physical = device.get("physical_id", device["entity"])
                    if any(other.get("power_on", {}) != wol
                           for spec in self._rooms.values()
                           for other in spec["devices"].values()
                           if other.get("physical_id", other["entity"]) == physical):
                        problems.append(f"rooms.{room_id}.devices.{key}.power_on: shared physical device has conflicting Wake-on-LAN settings")
            for activity_id, activity in room["activities"].items():
                prior = previous.get("activities", {}).get(activity_id, {})
                if activity == prior:
                    continue
                for key in activity["devices"]:
                    device = room["devices"][key]
                    if (device.get("control_approved") is False or
                            (device.get("foundation_concept"), device["entity"],
                             device.get("foundation_candidate_id")) not in selected):
                        problems.append(f"rooms.{room_id}.activities.{activity_id}.devices.{key}: changed activity includes revoked source or pending command approval")
                # Expert/global YAML and Assisted must enforce the same actual
                # native input/sound-mode choices. A name-only edit retains
                # existing routes even if their native source is currently
                # offline; a newly introduced route is never guessed.
                for button, binding in activity.get("button_map", {}).items():
                    if binding == prior.get("button_map", {}).get(button):
                        continue
                    device = room["devices"][binding["device"]]
                    action = binding["action"]
                    if action == "remote_key":
                        offered = self._script_native_keys(device)
                    elif action in ("source", "sound_mode"):
                        offered = source_lists(self.hass, device["entity"])[action + "_list"]
                    else:
                        offered = None
                    if (action in BUTTON_VALUE_ACTIONS
                            and (not offered or binding["value"] not in offered)):
                        problems.append(f"rooms.{room_id}.activities.{activity_id}.button_map.{button}: activity button not offered by selected native provider; choose a supported command")
                    if action not in BUTTON_VALUE_ACTIONS and not device["entity"].startswith("media_player."):
                        problems.append(f"rooms.{room_id}.activities.{activity_id}.button_map.{button}: media action requires a native media player")
                script_pairs = [(prior.get(kind, []), activity.get(kind, []))
                                for kind in ("steps", "stop_steps")]
                for macro_id, macro in activity.get("macros", {}).items():
                    previous = prior.get("macros", {}).get(macro_id, {})
                    script_pairs.append((previous.get("steps", []), macro["steps"]))
                for original_steps, proposed_steps in script_pairs:
                    for step in proposed_steps:
                        if step in original_steps:
                            continue
                        device = room["devices"][step["device"]]
                        if step.get("type") == "remote_key":
                            from .adapter import WEBOS_KEYS, REMOTE_KEYSETS
                            source = next((selected_source for selected_source in command_sources
                                           if selected_source.concept == device.get("foundation_concept")
                                           and selected_source.entity_id == device["entity"]
                                           and selected_source.candidate_id == device.get("foundation_candidate_id")), None)
                            integration = getattr(source, "provider", None)
                            offered = (WEBOS_KEYS if integration == "webostv"
                                       and device["entity"].startswith("media_player.") else
                                       REMOTE_KEYSETS.get(integration, ()))
                            if step["value"] not in offered:
                                problems.append(f"rooms.{room_id}.activities.{activity_id}: scripted remote key not supported by selected native provider ({step['device']})")
                            continue
                        if step.get("type") == "mute":
                            from homeassistant.components.media_player import MediaPlayerEntityFeature as Feature
                            state = native_state(self.hass, device["entity"])
                            attrs = state.attributes if state else {}
                            features = native_feature_mask(attrs.get("supported_features")) or 0
                            if not features & Feature.VOLUME_MUTE or type(attrs.get("is_volume_muted")) is not bool:
                                problems.append(f"rooms.{room_id}.activities.{activity_id}: {step['device']} needs native mute capability and readback")
                            continue
                        if step.get("type") not in ("source", "sound_mode"):
                            continue
                        live = source_lists(self.hass, device["entity"])
                        offered = live["source_list" if step["type"] == "source"
                                       else "sound_mode_list"]
                        path = f"rooms.{room_id}.activities.{activity_id}: {step['device']} {step['type']}"
                        if not offered:
                            problems.append(f"{path}: route verification pending; {device['entity']} exposes no native choices now. Bring the device online and validate again; no power command was sent.")
                        elif any(value not in offered for value in step["candidates"]):
                            problems.append(f"{path}: {step['candidates']!r} not offered by {device['entity']}; choose from {offered!r}")
        if problems:
            raise ValueError("\n".join(problems))
        engine = self.hass.data.get(DOMAIN, {}).get("engine")
        # Changing an opaque external controller is a physical ownership
        # handoff, not a name edit. Require hub OFF and no affected Premium task.
        affected = set()

        def execution_fields(obj, presentation_fields=("name",)):
            # Only explicitly presentation-only fields can change without
            # changing an accepted running intent or its physical binding.
            return None if obj is None else {k: v for k, v in obj.items()
                                             if k not in presentation_fields}

        def room_conflict(room_id, state, path, reason):
            before = self._original_rooms.get(room_id, {})
            label = before.get("name", room_id)
            current = getattr(state, "activity", None)
            activity = current or getattr(state, "retiring_activity", None)
            self._review_blocker = {"room": room_id, "expected_activity": current or ""}
            name = before.get("activities", {}).get(activity, {}).get("name", activity)
            context = label + (f" · {name}" if name else "")
            self._review_detail = (
                f"{path}: {context} — {reason}. "
                "Stop the affected Multimedia activity in Overview, then retry Save. "
                "Your changes have not been saved.")
            return "stop_room_before_edit"

        for room_id in sorted(self._rooms.keys() | self._original_rooms.keys()):
            before = self._original_rooms.get(room_id, {})
            after = self._rooms.get(room_id, {})
            old, new = before.get("harmony_controller"), after.get("harmony_controller")
            old_devices = {k: execution_fields(v) for k, v in before.get("devices", {}).items()}
            new_devices = {k: execution_fields(v) for k, v in after.get("devices", {}).items()}
            if not (old or new) or (old == new and old_devices == new_devices):
                continue
            for spec, controller in ((before, old), (after, new)):
                if not controller:
                    continue
                device = spec["devices"].get(controller, {})
                entity = device.get("entity")
                candidate = next((source for source in command_sources if source.entity_id == entity
                                  and source.candidate_id == device.get("foundation_candidate_id")
                                  and source.concept == "source" and source.provider == "harmony"), None)
                state = native_state(self.hass, entity) if entity else None
                if (not candidate or not state or state.state != "off"
                        or state.attributes.get("current_activity") != "PowerOff"
                        or "activity_starting" not in state.attributes or state.attributes["activity_starting"] is not None):
                    self._review_detail = (
                        f"rooms.{room_id}.devices.{controller}: "
                        "Harmony's mapped physical scope is changing. Confirm native PowerOff "
                        "for this hub, then retry Save. No command has been sent.")
                    return "stop_harmony_before_edit"
            for spec in (before, after):
                affected.update(device.get("physical_id", device["entity"]) for device in spec.get("devices", {}).values())
        if engine and affected:
            for room_id, state in engine.states.items():
                scope = engine.rooms[room_id]["devices"]
                overlap = any(device.get("physical_id", device["entity"]) in affected for device in scope.values())
                task = getattr(engine, "_room_tasks", {}).get(room_id)
                if overlap and (state.phase != "idle" or state.devices or (task and not task.done())):
                    return room_conflict(room_id, state, f"rooms.{room_id}",
                                         "a mapped Harmony resource is still reserved")
        if engine:
            for room_id, state in sorted(engine.states.items()):
                if state.phase == "idle" and not state.devices:
                    continue
                before = self._original_rooms.get(room_id, {})
                after = self._rooms.get(room_id, {})
                for key in sorted(state.devices):
                    if execution_fields(before.get("devices", {}).get(key)) != execution_fields(after.get("devices", {}).get(key)):
                        label = before.get("devices", {}).get(key, {}).get("name", key)
                        return room_conflict(room_id, state, f"rooms.{room_id}.devices.{key}",
                                             f"the reserved device {label} has changed")
                for activity in (state.activity, getattr(state, "retiring_activity", None)):
                    if activity and execution_fields(before.get("activities", {}).get(activity), ("name", "favorite")) != execution_fields(after.get("activities", {}).get(activity), ("name", "favorite")):
                        return room_conflict(room_id, state, f"rooms.{room_id}.activities.{activity}",
                                             "the current activity's executable settings have changed")
        return None

    def _blocked_room_json(self, errors):
        return json.dumps(getattr(self, "_review_blocker", None)
                          if (errors or {}).get("base") == "stop_room_before_edit" else None)

    async def async_step_review(self, user_input=None):
        # An existing specialist editor is a section of the same whole-home
        # transaction. Finishing that section returns to the semantic draft;
        # only a subsequent whole-home Save can commit it.
        if user_input is None and getattr(self, "_specialist_section", False):
            self._specialist_section = False
            self._activity_tuning = False
            self._script_phase = "steps"
            return await self._complete_setup_form()
        if (getattr(self, "_complete_setup", False) and user_input
                and user_input.get("return_to_setup") is True):
            self._complete_setup_finish = False
            return await self.async_step_complete_setup()
        if (getattr(self, "_yaml_import", False) and not getattr(self, "_complete_setup", False)
                and user_input and user_input.get("return_to_yaml") is True):
            return await self.async_step_yaml(draft_text=self._yaml_draft_text,
                                              draft_mode=self._yaml_draft_mode)
        errors = {}
        detail = ""
        if user_input:
            if not user_input.get("confirm"):
                errors["base"] = "confirm_save"
            elif hasattr(self, "_entry") and (
                    self._entry.options.get(CONF_ROOMS,
                                            self._entry.data.get(CONF_ROOMS, {}))
                    != self._original_rooms
                    or self._entry.options.get("dell_displays",
                                             self._entry.data.get("dell_displays", {}))
                    != self._original_dell_displays
                    or self._entry.options.get("enable_ux", True)
                    != self._original_enable_ux
                    or self._entry.options.get("default_step_delay_ms", 0)
                    != self._original_step_delay_ms):
                errors["base"] = "selection_changed"
            elif (getattr(self, "_yaml_deleted_rooms", None)
                  and not user_input.get("confirm_remove")):
                errors["base"] = "yaml_confirm_remove"
            elif (hasattr(self, "_entry") and execution_in_progress(
                    self.hass.data.get(DOMAIN, {}).get("engine"))):
                errors["base"] = "configuration_busy"
            else:
                try:
                    reason = self._review_configuration()
                except (ValueError, TypeError, KeyError, AttributeError) as exc:
                    errors["base"] = "selection_changed"
                    detail = _validation_detail(exc)
                else:
                    if reason:
                        errors["base"] = reason
                        detail = self._review_detail
                    else:
                        return await self._finish()
        fields = {vol.Required("confirm", default=False): bool}
        if getattr(self, "_complete_setup", False):
            fields[vol.Optional("return_to_setup", default=False)] = bool
        elif getattr(self, "_yaml_import", False):
            fields[vol.Optional("return_to_yaml", default=False)] = bool
        if getattr(self, "_yaml_deleted_rooms", None):
            fields[vol.Required("confirm_remove", default=False)] = bool
        previous = self._original_rooms
        proposed = self._rooms
        def authority(room):
            return (room.get("harmony_controller"), {
                key: (device.get("entity"), device.get("foundation_candidate_id"),
                      device.get("foundation_concept"), device.get("physical_id"),
                      device.get("control_approved"), device.get("passive"),
                      device.get("power_on"), device.get("power_off"))
                for key, device in room.get("devices", {}).items()
            })
        removed = (set(previous) - set(proposed) or any(
            set(previous[key].get(group, {})) - set(proposed[key].get(group, {}))
            for key in set(previous) & set(proposed) for group in ("devices", "activities")))
        sensitive = bool(removed or getattr(self, "_yaml_deleted_rooms", None)
                         or set(previous) != set(proposed)
                         or any(authority(previous[key]) != authority(proposed[key])
                                for key in set(previous) & set(proposed))
                         or getattr(self, "_original_dell_displays", {}) != getattr(self, "_dell_displays", {}))
        native_preview = self._review_summary()
        change_summary = (self._yaml_diff if getattr(self, "_yaml_import", False)
                          else _yaml_change_summary(previous, proposed))
        preview = change_summary + "\n\n" + native_preview
        return self.async_show_form(step_id="review", errors=errors,
                                    data_schema=vol.Schema(fields),
                                    description_placeholders={"rooms": str(len(self._rooms)),
                                        "activities": str(sum(len(r["activities"]) for r in self._rooms.values())),
                                        "summary": preview, "change_summary": change_summary,
                                        "native_preview": native_preview, "validation_detail": detail,
                                        "blocked_room_json": self._blocked_room_json(errors),
                                        "explicit_confirmation": "true" if sensitive else "false"})


class MultimediaConfigFlow(_Wizard, config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 2

    async def async_step_user(self, user_input=None):
        if not hasattr(self, "_rooms"):
            self._begin()
        # Expose the domain's three technical concepts to Foundation, even on
        # fresh installs where no Multimedia config entry exists yet.
        from .foundation import register_with_foundation
        register_with_foundation(self.hass)
        # New installations always start with one empty semantic Config Entry.
        # The native Options Flow then shows complete supported discovery and
        # a disposable room/activity proposal. Do not force the old room wizard
        # merely because Foundation already approved a few native devices.
        if user_input and user_input.get("confirm") is True:
            await self.async_set_unique_id("rhi_multimedia_household")
            self._abort_if_unique_id_configured()
            return self.async_create_entry(
                title="Multimedia",
                data={CONF_TITLE: "Multimedia", CONF_ROOMS: {}},
            )
        if user_input and CONF_TITLE in user_input:
            # Preserve a resumed legacy named wizard, not the default path.
            self._name = str(user_input.get(CONF_TITLE) or "Multimedia").strip()
            return await self.async_step_room()
        return self.async_show_form(step_id="user", data_schema=vol.Schema({
            vol.Required("confirm", default=False): bool}))

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
                       "devices", "activities", "room_areas"}),
    "device": frozenset({"entity", "physical_id", "asset_id", "role", "name",
                         "foundation_concept", "foundation_candidate_id",
                         "hdmi_cec_enabled", "post_power_on_delay_ms", "power_mode", "power_on",
                         "power_off", "timeout", "on_states", "speech_tts_registry_id",
                         "room_area", "wol_enabled", "control_approved",
                         "foundation_entity_registry_id", "foundation_config_entry_id",
                         "foundation_device_registry_id", "foundation_provider"}),
    "activity": frozenset({"name", "activity_type", "devices", "steps",
                           "stop_steps", "cec_links", "favorite",
                           "button_map", "macros", "room_area"}),
}


class _StrictYamlLoader(yaml.SafeLoader):
    """Never silently apply duplicate YAML mapping keys to real AV equipment."""

    def construct_mapping(self, node, deep=False):
        result = {}
        for key_node, value_node in node.value:
            key = self.construct_object(key_node, deep=deep)
            if not isinstance(key, str) or key in result:
                mark = key_node.start_mark
                reason = f"duplicate YAML key {key!r}" if isinstance(key, str) else "YAML mapping key must be a string"
                raise ValueError(f"{reason} at line {mark.line + 1}, column {mark.column + 1}")
            result[key] = self.construct_object(value_node, deep=deep)
        return result


def _yaml_document(document: str) -> dict:
    """Strict, bounded admin YAML input; not Home Assistant configuration.yaml."""
    if not isinstance(document, str) or not 0 < len(document.encode("utf-8")) <= MAX_CONFIG_YAML_BYTES:
        raise ValueError("YAML must be nonempty and at most 128 kB")
    try:
        payload = yaml.load(document, Loader=_StrictYamlLoader)
    except yaml.YAMLError as exc:
        mark = getattr(exc, "problem_mark", None)
        location = f" at line {mark.line + 1}, column {mark.column + 1}" if mark else ""
        raise ValueError("YAML syntax error or unsupported YAML tag" + location) from exc
    except RecursionError as exc:
        raise ValueError("YAML nesting exceeds supported depth") from exc
    if not isinstance(payload, dict):
        raise ValueError("YAML must be a mapping")
    return payload


def _validation_detail(exc) -> str:
    # Deduplicate and preserve bounded complete error evidence for copying.
    # Do not silently truncate the set of room/route issues at 40 lines.
    detail = "\n".join(dict.fromkeys(
        "".join(ch for ch in line if ch.isprintable())[:500]
        for line in str(exc).splitlines()))
    return detail if len(detail) <= 32768 else detail[:32768] + "\nAdditional details exceed the export limit."


def _validate_home(rooms: dict, resolve_bindings=None) -> None:
    """Collect independent room errors through the canonical validator."""
    if not isinstance(rooms, dict) or not rooms:
        validate_rooms(rooms)
        return
    issues = []
    if resolve_bindings is not None:
        # CEC and other canonical invariants require exact candidate IDs.
        # Resolve them on the disposable prospective model BEFORE validation,
        # never write them to the saved Config Entry at this stage.
        try:
            resolve_bindings(rooms)
        except ValueError as exc:
            issues.extend(str(exc).splitlines())
    for key, room in rooms.items():
        try:
            validate_rooms({key: room})
        except (ValueError, TypeError, KeyError, AttributeError, OverflowError) as exc:
            issues.append(f"rooms.{key}: {exc}")
        # Explicit unfilled template values are not real source choices. Report
        # every independent slot at once, even where another room is invalid.
        if not isinstance(room, dict):
            continue
        if str(room.get("area_id", "")).startswith("REPLACE_WITH_"):
            issues.append(f"rooms.{key}.area_id: select the actual Home Assistant Area")
        devices = room.get("devices")
        if isinstance(devices, dict):
            for role, device in devices.items():
                if not isinstance(device, dict):
                    continue
                if str(device.get("entity", "")).startswith("REPLACE_WITH_"):
                    issues.append(f"rooms.{key}.devices.{role}.entity: choose the actual native HA entity")
                if str(device.get("foundation_candidate_id", "")).startswith("REPLACE_WITH_"):
                    issues.append(f"rooms.{key}.devices.{role}.foundation_candidate_id: resolve the exact native Foundation candidate")
        activities = room.get("activities")
        if isinstance(activities, dict):
            for activity_id, activity in activities.items():
                if not isinstance(activity, dict):
                    continue
                for phase in ("steps", "stop_steps"):
                    steps = activity.get(phase, [])
                    if not isinstance(steps, list):
                        continue
                    for index, step in enumerate(steps):
                        if not isinstance(step, dict):
                            continue
                        candidates = step.get("candidates", [])
                        if isinstance(candidates, list) and any(
                                str(value).startswith("REPLACE_WITH_") for value in candidates):
                            issues.append(f"rooms.{key}.activities.{activity_id}.{phase}[{index}].candidates: select a verified native input for {step.get('device')}")
    if issues:
        raise ValueError("\n".join(issues))
    validate_rooms(rooms)


def _yaml_plan(document: str, existing: dict, mode: str, *, resolve_bindings=None) -> tuple[dict, list[str]]:
    """Prepare independent room/device/activity changes without another config store.

    Each change replaces only named fields of one semantic object. Lists, such
    as routes, are replaced as whole validated fields, never index-merged.
    Review/Save remains the only writer and validates the entire resulting
    configuration against live Foundation selection and command reservations.
    """
    result, removals = _yaml_candidate(document, existing, mode)
    _validate_home(result, resolve_bindings)
    return result, removals


def _yaml_candidate(document: str, existing: dict, mode: str) -> tuple[dict, list[str]]:
    """Construct an unsaved candidate using the same structural scope rules.

    This deliberately does not certify semantics. Only _yaml_plan validates
    the full home; repair may display the rejected candidate without saving.
    """
    if mode not in ("merge", "replace"):
        raise ValueError("Unknown YAML import mode")
    payload = _yaml_document(document)
    if set(payload) == {"rooms"}:
        incoming = payload["rooms"]
        if not isinstance(incoming, dict) or not incoming:
            raise ValueError("YAML must contain at least one complete room")
        result = (deepcopy(incoming) if mode == "replace" else
                  {**deepcopy(existing), **deepcopy(incoming)})
        return result, []
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
        for group in ("devices", "activities"):
            before = previous[key].get(group, {})
            after = proposed[key].get(group, {})
            additions = sorted(set(after) - set(before))
            removals = sorted(set(before) - set(after))
            edits = sorted(item for item in set(before) & set(after) if before[item] != after[item])
            if additions or removals or edits:
                lines.append(f"{key} {group}: +{','.join(additions) or '-'} "
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
        self._original_step_delay_ms = validate_step_delay(config_entry.options.get("default_step_delay_ms", 0))
        self._yaml_step_delay_ms = None
        self._dell_key = None

    async def async_step_init(self, user_input=None):
        options = {"complete_setup": "Complete home setup — one Review and Save",
                   "assisted": "Assisted — configure rooms, devices and activities",
                   "yaml": "YAML — update one room/device/activity or import (advanced)",
                   "expert_yaml": "Expert YAML — edit one selected object",
                   "add_room": "Add room", "edit_room": "Edit room devices and connections",
                   "guided_activity": "Create an activity: start with what you want to do",
                   "add_activity": "Add activity", "rename_room": "Rename room / change area",
                   "edit_activity": "Edit activity", "activity_devices": "Choose approved activity devices and startup order", "quick_edit_activity": "Quick edit activity name and inputs",
                   "remove_activity": "Remove activity",
                   "remove_room": "Remove room", "review": "Review and save", "frontend": "Dashboard card",
                   "harmony_owner": "Harmony / Premium control ownership",
                   "tv_wake": "Device Wake-on-LAN (MAC / IP)",
                   "speech_endpoint": "Speaker speech notifications",
                   "cec_device": "HDMI-CEC setting per selected device",
                   "cec_activity": "HDMI-CEC relationship and activity actions",
                   "script_defaults": "Activity scripts — default delay between actions",
                   "script_step": "Activity scripts — add, edit or reorder a step",
                   "button_mapping": "Activity buttons — assign exact device and native command",
                   "macro_manage": "One-touch shortcuts — create, edit or remove",
                   "dell_add": "Add Dell C8621QT LAN display",
                   "dell_edit": "Rename Dell C8621QT display",
                   "dell_remove": "Remove unassigned Dell C8621QT display"}
        if user_input:
            action = user_input["action"]
            if action == "complete_setup":
                return await self.async_step_complete_setup()
            if action == "assisted":
                return await self.async_step_assisted()
            if action == "yaml":
                self._global_yaml = True
                return await self.async_step_yaml()
            if action == "expert_yaml":
                return await self.async_step_expert_target()
            if action == "frontend":
                return await self.async_step_frontend()
            if action == "script_defaults":
                return await self.async_step_script_defaults()
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
        # One supported visual setup route, plus Expert YAML. Keep the old
        # direct action IDs/Assisted handlers for backward compatibility but
        # stop advertising obsolete wizard alternatives to new admins.
        # Offer only three top-level routes in native HA. Assisted is the
        # existing explicit advanced gateway for contextual card actions;
        # hiding it from HA's actual form schema rejects those actions before
        # async_step_init can dispatch. Keep it available, not the default.
        methods = {key: options[key] for key in ("complete_setup", "yaml", "assisted")}
        return self.async_show_form(step_id="init", data_schema=vol.Schema({
            vol.Required("action"): vol.In(methods)}))

    def _capture_activity(self, text, request):
        """Build an unsaved activity from exact live native observations.

        No physical services, no separate configuration writer. The regular
        Review/Save still validates all binding, route and ownership changes.
        """
        from homeassistant.components.media_player import MediaPlayerEntityFeature as Feature

        if getattr(self, "_yaml_focus", None) is not None:
            raise ValueError("Open the full Activities editor to capture current settings")
        doc = _yaml_document(text)
        if set(doc) != {"rooms", "dell_displays", "enable_ux", "default_step_delay_ms"}:
            raise ValueError("Capture requires the complete editable configuration")
        required = {"room", "activity", "name", "activity_type", "devices", "include_volume"}
        if (not isinstance(request, dict) or not required <= set(request)
                or set(request) - required - {"include_mute"}):
            raise ValueError("Choose a room, activity and devices to capture")
        room_id, activity_id = request["room"], request["activity"]
        cast = request["devices"]
        name, kind = request["name"], request["activity_type"]
        if (not isinstance(room_id, str) or room_id not in doc["rooms"]
                or not isinstance(activity_id, str) or not isinstance(name, str)
                or not 0 < len(name.strip()) <= 80 or kind not in ACTIVITIES
                or type(request["include_volume"]) is not bool
                or type(request.get("include_mute", False)) is not bool
                or not isinstance(cast, list) or not cast
                or any(not isinstance(key, str) for key in cast)
                or len(cast) != len(set(cast))):
            raise ValueError("Select valid activity settings and at least one device")
        room = doc["rooms"][room_id]
        devices, activities = room["devices"], room["activities"]
        if any(key not in devices for key in cast):
            raise ValueError("Choose devices already configured in the selected room")
        prior = activities.get(activity_id) if activity_id else None
        if activity_id and (prior is None or any(key not in prior["devices"] for key in cast)):
            raise ValueError("Choose devices in the existing activity's cast")
        key = activity_id or _slug(name)
        if not activity_id and key in activities:
            raise ValueError("An activity with this name already exists")
        steps, physical = [], set()
        for device_key in cast:
            device = devices[device_key]
            path = f"rooms.{room_id}.devices.{device_key}"
            source = authorized_source(self.hass, device)
            if source is None or device.get("control_approved") is False:
                raise ValueError(f"{path}: Review the exact native device binding before capture")
            identity = device.get("physical_id", device["entity"])
            if identity in physical:
                raise ValueError(f"{path}: Select the physical endpoint only once")
            physical.add(identity)
            state = native_state(self.hass, device["entity"])
            if state is None or state.state not in device.get("on_states", READY_STATES):
                raise ValueError(f"{path}: Bring this device to the desired operating state before capture")
            if not device["entity"].startswith("media_player."):
                raise ValueError(f"{path}: Capture needs native media-player readback, not blind remote keys")
            attrs = state.attributes or {}
            features = native_feature_mask(attrs.get("supported_features")) or 0
            # Players may publish an application/content list as source.
            # Never turn the current Apple TV app or media into an automatic
            # launch; only capture durable display and receiver routing.
            for prop, flag in (("source", Feature.SELECT_SOURCE),
                               ("sound_mode", Feature.SELECT_SOUND_MODE)):
                if device.get("foundation_concept") not in ("display", "amplifier"):
                    continue
                if not (features & flag):
                    continue
                value = attrs.get(prop)
                if not isinstance(value, str) or value not in native_choices(attrs.get(prop + "_list")):
                    raise ValueError(f"{path}: Current {prop} is not an exact offered native option")
                steps.append({"type": prop, "device": device_key, "candidates": [value]})
            if request["include_volume"] and features & Feature.VOLUME_SET:
                level = attrs.get("volume_level")
                if type(level) not in (int, float) or not 0 <= level <= 1:
                    raise ValueError(f"{path}: Current volume is not available")
                steps.append({"type": "volume", "device": device_key, "level": level})
            if request.get("include_mute", False) and features & Feature.VOLUME_MUTE:
                muted = attrs.get("is_volume_muted")
                if type(muted) is not bool:
                    raise ValueError(f"{path}: Current mute is not available")
                steps.append({"type": "mute", "device": device_key, "value": muted})
        full_cast = prior["devices"] if prior is not None else cast
        concepts = {devices[item].get("foundation_concept") for item in full_cast}
        if kind != "listen_music" and "display" not in concepts:
            raise ValueError("Video activities need a configured display")
        if kind in ("watch_source", "play_game") and "source" not in concepts:
            raise ValueError("Choose a configured native source for this activity")
        if prior is None and kind != "listen_music" and not any(step["type"] == "source" for step in steps):
            raise ValueError("Capture a verified TV or receiver input for this video activity")
        if prior is None:
            proposed = {"name": name.strip(), "activity_type": kind,
                        "devices": list(cast), "steps": steps, "stop_steps": []}
        else:
            proposed = deepcopy(prior)
            # Update the final target in its existing position and keep all
            # explicit waits, timings, unrelated commands, mappings and stop steps.
            sequence = proposed.setdefault("steps", [])
            for step in steps:
                index = next((i for i in range(len(sequence) - 1, -1, -1)
                              if (sequence[i]["device"], sequence[i]["type"]) ==
                              (step["device"], step["type"])), None)
                if index is None:
                    sequence.append(step)
                else:
                    if "delay_ms" in sequence[index]:
                        step["delay_ms"] = sequence[index]["delay_ms"]
                    sequence[index] = step
        activities[key] = proposed
        validate_rooms(doc["rooms"])
        return json.dumps(doc, ensure_ascii=False, allow_nan=False, indent=2), key

    async def async_step_complete_setup(self, user_input=None):
        """Full semantic iPad editor backed solely by existing YAML/Review/Save.

        The frontend edits a JSON document (strict YAML subset) in this ONE
        native HA Options Flow. Existing YAML validation, Foundation approval,
        concurrency, ownership and final atomic Config Entry Save are reused.
        No intermediate task router, secondary store or physical commands.
        """
        self._complete_setup = True  # Preserve Review → Back to same draft.
        if user_input is not None:
            proposed = user_input.get("yaml_text")
            if not isinstance(proposed, str):
                return await self.async_step_complete_setup()
            if user_input.get("capture_request"):
                try:
                    request = json.loads(user_input["capture_request"])
                    text, captured = self._capture_activity(proposed, request)
                except (ValueError, TypeError, KeyError, AttributeError, RecursionError) as exc:
                    return await self._complete_setup_form(text=proposed,
                        errors={"base": "selection_changed"}, validation_detail=_validation_detail(exc))
                result = await self._complete_setup_form(text=text)
                result["description_placeholders"]["captured_activity"] = captured
                return result
            specialist = user_input.get("specialist_action", "")
            if specialist and getattr(self, "_yaml_focus", None) is not None:
                return await self._complete_setup_form(errors={"base": "selection_changed"},
                    validation_detail="Expert YAML must update its selected object only")
            mode = "replace"
            if getattr(self, "_yaml_focus", None) is not None:
                try:
                    if set(_yaml_document(proposed)) == {"changes"}:
                        mode = "merge"
                except ValueError:
                    pass
            result = await self.async_step_yaml({"mode": mode,
                                                 "yaml_text": proposed,
                                                 "visual_edit": bool(specialist) or user_input.get("visual_edit", False)})
            if (specialist and result.get("step_id") == "complete_setup"
                    and not result.get("errors")):
                room_id = user_input.get("specialist_room", "")
                activity_id = user_input.get("specialist_activity", "")
                return await self._open_specialist_section(specialist, room_id, activity_id)
            if result.get("type") == "form" and result.get("step_id") == "yaml":
                # Keep the full iPad editor and unsaved draft when validation
                # rejects data, rather than falling back to the legacy forms.
                return await self._complete_setup_form(
                    text=proposed, errors=result.get("errors") or {},
                    validation_detail=(result.get("description_placeholders") or {}).get(
                        "validation_detail", ""))
            return result
        return await self._complete_setup_form()

    def _specialist_form(self, *, fields, **kwargs):
        if getattr(self, "_specialist_section", False):
            fields = {**fields, vol.Optional("return_to_setup", default=False): bool}
        return self.async_show_form(data_schema=vol.Schema(fields), **kwargs)

    async def _open_specialist_section(self, action, room_id, activity_id):
        """Reuse the native specialist steps inside this existing Options Flow."""
        room_actions = {"harmony_owner", "speech_endpoint", "tv_wake", "cec_device"}
        activity_actions = {"button_mapping", "macro_manage", "cec_activity", "script_step"}
        dell_actions = {"dell_add", "dell_edit", "dell_remove"}
        room = self._rooms.get(room_id)
        if (action not in room_actions | activity_actions | dell_actions
                or (action in room_actions | activity_actions and room is None)
                or (action in activity_actions and activity_id not in room["activities"])
                or (action in {"dell_edit", "dell_remove"} and not self._dell_displays)):
            return await self._complete_setup_form(errors={"base": "selection_changed"},
                validation_detail="Choose an existing room, activity or display for this setting.")
        self._specialist_section = True
        self._activity_tuning = False
        self._script_phase = "steps"
        self._option_action = action
        if action in dell_actions:
            return await self.async_step_init({"action": action})
        self._room_id = room_id
        if action in activity_actions:
            self._editing_activity = activity_id
            return await self.async_step_existing_activity({"activity": activity_id})
        return await self.async_step_existing_room({"room": room_id})

    def _expert_object_document(self, payload):
        """Expand selected-object text into the existing complete draft guard.

        Scope and sibling context come from the original Config Entry, not
        from browser-provided unrelated data. Unlike a native merge patch,
        this object is a replacement of the selected object's editable fields.
        """
        scope, room_id, object_id = self._yaml_focus
        if (set(payload) != {"scope", "room", "id", "object"}
                or (payload["scope"], payload["room"], payload["id"]) != self._yaml_focus
                or not isinstance(payload["object"], dict)):
            raise ValueError("Expert YAML must update its selected object only")
        obj = deepcopy(payload["object"])
        doc = {"rooms": deepcopy(self._original_rooms),
               "dell_displays": deepcopy(self._original_dell_displays),
               "enable_ux": self._original_enable_ux,
               "default_step_delay_ms": self._original_step_delay_ms}
        room = doc["rooms"][room_id]
        if scope == "room":
            if {"devices", "activities"} & set(obj):
                raise ValueError("Edit devices/activities independently, not through a room overwrite")
            doc["rooms"][room_id] = {**obj, "devices": room["devices"],
                                     "activities": room["activities"]}
        else:
            room["devices" if scope == "device" else "activities"][object_id] = obj
        self._expert_scope_rooms(doc)
        return doc

    def _expert_scope_rooms(self, payload):
        """Complete visual context is not wider write authority."""
        scope, room_id, object_id = self._yaml_focus
        expected = {"rooms": deepcopy(self._original_rooms),
                    "dell_displays": self._original_dell_displays,
                    "enable_ux": self._original_enable_ux,
                    "default_step_delay_ms": self._original_step_delay_ms}
        if set(payload) != set(expected):
            raise ValueError("Expert visual repair requires its complete draft")
        proposed = payload.get("rooms")
        if not isinstance(proposed, dict):
            raise ValueError("Expert visual repair requires rooms")
        group = "devices" if scope == "device" else "activities"
        baseline = expected["rooms"][room_id]
        current = proposed.get(room_id)
        if not isinstance(current, dict):
            raise ValueError("Expert YAML must update its selected object only")
        if scope == "room":
            before, after = baseline, current
            permitted = YAML_SCOPED_FIELDS[scope] - {"devices", "activities"}
        else:
            before = baseline[group][object_id]
            after = current.get(group, {}).get(object_id) if isinstance(current.get(group), dict) else None
            permitted = YAML_SCOPED_FIELDS[scope]
        if not isinstance(after, dict):
            raise ValueError("Expert YAML must update its selected object only")
        changed = {key for key in before.keys() | after.keys()
                   if key not in before or key not in after or before[key] != after[key]}
        if changed - permitted:
            raise ValueError("Expert YAML must update its selected object only")
        if scope == "room":
            expected["rooms"][room_id] = deepcopy(after)
        else:
            baseline[group][object_id] = deepcopy(after)
        if payload != expected:
            raise ValueError("Expert YAML must update its selected object only")
        return deepcopy(proposed)

    def _editable_home_draft(self, text, mode="replace"):
        """Transport a renderable rejected YAML as an unsaved editor draft.

        This is not semantic validation or an alternative writer. The same
        native preflight and Review/Save must still succeed after repair.
        """
        try:
            payload = _yaml_document(text)
            focus = getattr(self, "_yaml_focus", None)
            if focus is not None and getattr(self, "_complete_setup", False) and "object" in payload:
                payload = self._expert_object_document(payload)
            if set(payload) == {"changes"}:
                if focus is not None:
                    self._check_expert_patch(payload, focus)
                rooms, _ = _yaml_candidate(text, self._original_rooms, mode)
            elif focus is not None:
                if not getattr(self, "_complete_setup", False):
                    return ""
                rooms = self._expert_scope_rooms(payload)
            else:
                if set(payload) - {"rooms", "dell_displays", "enable_ux", "default_step_delay_ms"}:
                    return ""
                rooms = payload.get("rooms")
                if not isinstance(rooms, dict) or not rooms:
                    return ""
                if mode == "merge":
                    rooms = {**deepcopy(self._original_rooms), **rooms}
                elif mode != "replace":
                    return ""
            for room_id, room in rooms.items():
                if not re.fullmatch(r"[a-z][a-z0-9_]*", room_id) or not isinstance(room, dict):
                    return ""
                if any(not isinstance(room.get(group), dict) for group in ("devices", "activities")):
                    return ""
                if any(not isinstance(device, dict) or not isinstance(device.get("entity"), str)
                       for device in room["devices"].values()):
                    return ""
                if any(not isinstance(activity, dict) or not isinstance(activity.get("devices"), list)
                       or any(not isinstance(step, dict) or not isinstance(step.get("type"), str)
                              for phase in ("steps", "stop_steps")
                              for step in activity.get(phase, []))
                       or any(not isinstance(activity.get(phase, []), list)
                              for phase in ("steps", "stop_steps"))
                       for activity in room["activities"].values()):
                    return ""
            try:
                self._resolve_yaml_bindings(rooms)
            except ValueError:
                pass  # Keep all unresolved slots; the original diagnostic remains.
            doc = {"rooms": rooms,
                   "dell_displays": payload.get("dell_displays", self._original_dell_displays),
                   "enable_ux": payload.get("enable_ux", self._original_enable_ux),
                   "default_step_delay_ms": payload.get("default_step_delay_ms", self._original_step_delay_ms)}
            if (not isinstance(doc["dell_displays"], dict)
                    or type(doc["enable_ux"]) is not bool):
                return ""
            validate_step_delay(doc["default_step_delay_ms"])
            if focus is not None:
                self._expert_scope_rooms(doc)
            return json.dumps(doc, ensure_ascii=False, allow_nan=False)
        except (ValueError, TypeError, AttributeError, KeyError, RecursionError, OverflowError):
            return ""

    async def _complete_setup_form(self, text=None, errors=None, validation_detail=""):
        # This is a synchronous read-only form projection, not Review/Save.
        # All sections share the same exact handoff during this one request.
        with projection_source_reads(self.hass):
            return self._complete_setup_projection(text, errors, validation_detail)

    def _complete_setup_projection(self, text, errors, validation_detail):
        areas = area_choices(self.hass)
        # Floor/Area ownership remains native HA. The editor renders a live
        # read-only topology and links to HA's own Floor/Area manager for CRUD.
        floors, area_floors = {}, {}
        try:
            from homeassistant.helpers import area_registry as ar, floor_registry as fr
            floors = {f.floor_id: f.name for f in fr.async_get(self.hass).async_list_floors()}
            area_floors = {a.id: getattr(a, "floor_id", None)
                           for a in ar.async_get(self.hass).async_list_areas()}
        except (ImportError, AttributeError, RuntimeError):
            pass  # Optional fixture/old HA: never fabricate a physical floor.
        discovery = discovered_av_sources(self.hass)
        discovered, discovery_origin = discovery
        catalog = logical_av_catalog(self.hass, self._rooms, discovered=discovery)
        logical_devices, _ = catalog
        proposals = proposed_room_setup(self.hass, self._rooms, discovered=discovery, catalog=catalog)
        asset_by_candidate = {
            (row["concept"], row["candidate_id"], row["entity_id"]): asset["asset_id"]
            for asset in logical_devices for row in asset["candidates"]
        }
        from .foundation import discovered_sources
        native_sources, _ = discovered_sources(self.hass)
        # Native MAC evidence is read-only and can be shown before command
        # consent; it authorizes no WoL packet without reviewed Save.
        approved_macs = {
            (source.concept, source.candidate_id, source.entity_id):
                sorted(selected_native_macs(self.hass, source))
            for source in native_sources
        }
        reviewed_keys = {
            (device.get("foundation_concept"), device.get("entity"),
             device.get("foundation_candidate_id"))
            for room in self._original_rooms.values()
            for device in room.get("devices", {}).values()
            if authorized_source(self.hass, device) is not None
        }
        sources = []
        for src in discovered:
            if src.concept not in ("display", "amplifier", "source"):
                continue
            state = native_state(self.hass, src.entity_id)
            attrs = getattr(state, "attributes", {}) or {} if state else {}
            from homeassistant.components.media_player import MediaPlayerEntityFeature
            native_features = native_feature_mask(attrs.get("supported_features")) or 0
            can_play = bool(native_features & MediaPlayerEntityFeature.PLAY)
            evidence = native_source_evidence(self.hass, src)
            sources.append({
                **evidence,
                "entity": src.entity_id,
                "candidate": src.candidate_id,
                "concept": src.concept,
                "provider": src.provider,
                "available": src.available,
                "approved": (src.approved or (src.concept, src.entity_id,
                                               src.candidate_id) in reviewed_keys),
                "verified_macs": approved_macs.get(
                    (src.concept, src.candidate_id, src.entity_id), []),
                "review_reason": src.review_reason,
                "logical_type": src.logical_type,
                "logical_asset_id": asset_by_candidate.get(
                    (src.concept, src.candidate_id, src.entity_id)),
                "native_device_id": src.device_registry_id,
                "entity_registry_id": src.entity_registry_id,
                "config_entry_id": src.config_entry_id,
                "manufacturer": src.manufacturer,
                "model": src.model,
                "related_entities": list(src.related_entities),
                "area_id": src.area_id,
                "native_can_play": can_play,
            })
        if text is None:
            text = json.dumps({
                "rooms": self._rooms,
                "dell_displays": self._dell_displays,
                "enable_ux": (self._yaml_enable_ux if self._yaml_enable_ux is not None
                              else self._original_enable_ux),
                "default_step_delay_ms": (self._yaml_step_delay_ms
                                          if self._yaml_step_delay_ms is not None
                                          else self._original_step_delay_ms),
            }, ensure_ascii=False, indent=2)
        return self.async_show_form(
            step_id="complete_setup",
            errors=errors or {},
            data_schema=vol.Schema({
                vol.Required("yaml_text", default=text):
                    selector.TextSelector(selector.TextSelectorConfig(multiline=True)),
                vol.Optional("visual_edit", default=False): bool,
                **({vol.Optional("capture_request", default=""): str,
                    vol.Optional("specialist_action", default=""): vol.In(["", "harmony_owner", "speech_endpoint", "tv_wake", "cec_device", "button_mapping", "macro_manage", "cec_activity", "script_step", "dell_add", "dell_edit", "dell_remove"]),
                    vol.Optional("specialist_room", default=""): str,
                    vol.Optional("specialist_activity", default=""): str}
                   if getattr(self, "_yaml_focus", None) is None else {}),
            }),
            description_placeholders={
                "areas_json": json.dumps(areas, ensure_ascii=False),
                "floors_json": json.dumps(floors, ensure_ascii=False),
                "area_floors_json": json.dumps(area_floors, ensure_ascii=False),
                "sources_json": json.dumps(sources, ensure_ascii=False),
                "logical_devices_json": json.dumps(logical_devices, ensure_ascii=False),
                "proposed_rooms_json": json.dumps(proposals["rooms"], ensure_ascii=False),
                "proposal_exceptions_json": json.dumps(proposals["exceptions"], ensure_ascii=False),
                "validation_detail": validation_detail if errors else "",
                "blocked_room_json": self._blocked_room_json(errors),
                "expert_scope_json": json.dumps(getattr(self, "_yaml_focus", None)),
                "editable_draft_json": self._editable_home_draft(text) if errors and text else "",
                "discovery_origin": discovery_origin,
                "note": "Supported-domain discovery defaults to Select All when Foundation "
                        "publishes it. Classify and assign without prior Foundation wizard. "
                        "Read-only pending candidates may be saved but Premium physical "
                        "commands remain blocked until exact authorization. "
                        "One draft and native Review/Save; Cancel discards all.",
            })

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
            "activity_devices": "Activities · choose devices and startup order",
            "quick_edit_activity": "Activities · quick edit name and real HDMI input",
            "remove_activity": "Activities · remove an activity",
            "harmony_owner": "Advanced · Harmony / Premium command ownership",
            "tv_wake": "Advanced · Device Wake-on-LAN",
            "speech_endpoint": "Notifications · Native speech for idle speakers",
            "cec_device": "Advanced · HDMI-CEC device settings",
            "cec_activity": "Advanced · HDMI-CEC activity relationship",
            "dell_add": "Advanced · add an approved Dell C8621QT",
            "dell_edit": "Advanced · edit Dell display",
            "dell_remove": "Advanced · remove unassigned Dell display",
            "frontend": "Dashboard · enable or disable card",
            "expert_yaml": "Advanced · edit one exact object via Expert YAML",
            "script_defaults": "Activities · standard wait between commands",
            "script_step": "Activities · edit the ordered script steps",
            "button_mapping": "Activities · assign button to selected device",
            "macro_manage": "Activities · manage named one-touch shortcuts",
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

    @staticmethod
    def _check_expert_patch(payload, focus):
        changes = payload.get("changes") if set(payload) == {"changes"} else None
        if (not isinstance(changes, list) or len(changes) != 1
                or not isinstance(changes[0], dict)
                or (changes[0].get("scope"), changes[0].get("room"),
                    changes[0].get("id") or "") != focus
                or "set" not in changes[0] or "remove" in changes[0]):
            raise ValueError("Expert YAML must update its selected object only")

    async def async_step_yaml(self, user_input=None, *, draft_text=None, draft_mode="merge"):
        """Advanced admin YAML import; never writes before normal Review/Save."""
        errors = {}
        rejection_detail = ""
        focus = getattr(self, "_yaml_focus", None)
        # An invalid input or missing Foundation source must not erase the
        # administrator's unsaved YAML. Keep the same draft in this Options
        # Flow form after validation errors; never persist it until Review/Save.
        attempted_text = user_input.get("yaml_text") if isinstance(user_input, dict) else draft_text
        attempted_mode = user_input.get("mode", "merge") if isinstance(user_input, dict) else draft_mode
        if user_input is not None:
            try:
                document = user_input.get("yaml_text")
                payload = _yaml_document(document)
                mode = user_input.get("mode", "merge")
                if focus is not None and getattr(self, "_complete_setup", False) and "object" in payload:
                    payload = self._expert_object_document(payload)
                local_visual = focus is not None and getattr(self, "_complete_setup", False) and set(payload) != {"changes"}
                if focus is not None and not local_visual:
                    self._check_expert_patch(payload, focus)
                # Whole Multimedia includes rooms and existing Dell display
                # registrations / card preference; no new physical inventory
                # or extra configuration authority. Scoped objects are unchanged.
                if local_visual:
                    proposed = self._expert_scope_rooms(payload)
                    _validate_home(proposed, self._resolve_yaml_bindings)
                    self._expert_scope_rooms({**payload, "rooms": proposed})
                    explicit_removals = []
                    dell = deepcopy(self._original_dell_displays)
                    ux_option = self._original_enable_ux
                    step_delay_ms = self._original_step_delay_ms
                elif focus is None and payload and set(payload) <= {
                        "rooms", "dell_displays", "enable_ux", "default_step_delay_ms"}:
                    room_document = yaml.safe_dump({"rooms": payload["rooms"]}) if "rooms" in payload else None
                    if room_document is not None:
                        proposed, explicit_removals = _yaml_plan(
                            room_document, self._original_rooms, mode,
                            resolve_bindings=self._resolve_yaml_bindings)
                    else:
                        if mode != "merge":
                            raise ValueError("Replace needs a complete rooms mapping")
                        proposed, explicit_removals = deepcopy(self._original_rooms), []
                    # Only the existing guarded Dell wizard can change the
                    # set of registered hosts. A visual draft may round-trip
                    # those staged registrations, never invent/rebind a host.
                    allowed_dell = self._dell_displays if getattr(self, "_complete_setup", False) else self._original_dell_displays
                    configured_dell = payload.get("dell_displays", allowed_dell)
                    if (not isinstance(configured_dell, dict)
                            or set(configured_dell) != set(allowed_dell)):
                        raise ValueError("Use the dedicated guarded Dell wizard for add/remove")
                    dell = {}
                    for key, details in configured_dell.items():
                        previous_dell = allowed_dell[key]
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
                    step_delay_ms = validate_step_delay(
                        payload.get("default_step_delay_ms", self._original_step_delay_ms))
                else:
                    proposed, explicit_removals = _yaml_plan(
                        document, self._original_rooms, mode,
                        resolve_bindings=self._resolve_yaml_bindings)
                    dell = deepcopy(self._original_dell_displays)
                    ux_option = self._original_enable_ux
                    step_delay_ms = self._original_step_delay_ms
                previous, previous_dell, previous_ux, previous_delay = (
                    self._rooms, self._dell_displays, self._yaml_enable_ux,
                    self._yaml_step_delay_ms)
                self._rooms = deepcopy(proposed)
                self._dell_displays = deepcopy(dell)
                self._yaml_enable_ux = ux_option
                self._yaml_step_delay_ms = step_delay_ms
                try:
                    reason = self._review_configuration()
                except (ValueError, KeyError, TypeError, RecursionError, AttributeError) as exc:
                    self._rooms, self._dell_displays, self._yaml_enable_ux, self._yaml_step_delay_ms = (
                        previous, previous_dell, previous_ux, previous_delay)
                    errors["base"] = "selection_changed"
                    rejection_detail = _validation_detail(exc)
                else:
                    if reason:
                        self._rooms, self._dell_displays, self._yaml_enable_ux, self._yaml_step_delay_ms = (
                            previous, previous_dell, previous_ux, previous_delay)
                        errors["base"] = reason
                        rejection_detail = self._review_detail or ("The proposed settings failed native " + str(reason))
                    else:
                        self._yaml_import = True
                        self._yaml_draft_text = document
                        self._yaml_draft_mode = mode
                        self._yaml_deleted_rooms = sorted(
                            set(self._original_rooms) - set(proposed)) + explicit_removals
                        self._yaml_diff = _yaml_change_summary(self._original_rooms, proposed)
                        if dell != self._original_dell_displays:
                            added_dell = sorted(set(dell) - set(self._original_dell_displays))
                            removed_dell = sorted(set(self._original_dell_displays) - set(dell))
                            renamed_dell = sorted(k for k in set(dell) & set(self._original_dell_displays)
                                                  if dell[k] != self._original_dell_displays[k])
                            self._yaml_diff += "\nDell display labels changed: " + ", ".join(renamed_dell)
                            if added_dell:
                                self._yaml_diff += "\nDell displays added: " + ", ".join(added_dell)
                            if removed_dell:
                                self._yaml_diff += "\nDell displays removed: " + ", ".join(removed_dell)
                                self._yaml_deleted_rooms.extend("display " + k for k in removed_dell)
                        if ux_option != self._original_enable_ux:
                            self._yaml_diff += f"\nPremium UX enabled: {ux_option}"
                        if step_delay_ms != self._original_step_delay_ms:
                            self._yaml_diff += f"\nDefault inter-step delay: {step_delay_ms} ms"
                        if explicit_removals:
                            self._yaml_diff += "\nExplicit removals: " + ", ".join(explicit_removals)
                        if (user_input.get("visual_edit") is True
                                and (focus is not None or getattr(self, "_global_yaml", False) or getattr(self, "_complete_setup", False))):
                            self._complete_setup = True
                            return await self._complete_setup_form()
                        return await self.async_step_review()
            except (ValueError, TypeError, OverflowError, RecursionError, AttributeError, KeyError) as exc:
                errors["base"] = "yaml_invalid"
                rejection_detail = _validation_detail(exc)
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
            if (errors or draft_text is not None) and isinstance(attempted_text, str) and len(attempted_text.encode("utf-8")) <= MAX_CONFIG_YAML_BYTES:
                current = attempted_text
            schema = vol.Schema({vol.Required("yaml_text", default=current):
                selector.TextSelector(selector.TextSelectorConfig(multiline=True)),
                vol.Optional("visual_edit", default=False): bool})
            note = ("Expert editor for the selected object only. Other rooms, "
                    "devices and activities cannot be changed here. "
                    "Preview before the same guarded HA Options Flow Save.")
        else:
            current = yaml.safe_dump({
                "rooms": self._rooms,
                "dell_displays": self._original_dell_displays,
                "enable_ux": self._original_enable_ux,
                "default_step_delay_ms": self._original_step_delay_ms,
            }, sort_keys=False, allow_unicode=True, default_flow_style=False)
            if (errors or draft_text is not None) and isinstance(attempted_text, str) and len(attempted_text.encode("utf-8")) <= MAX_CONFIG_YAML_BYTES:
                current = attempted_text
            mode_default = attempted_mode if attempted_mode in ("merge", "replace") else "merge"
            schema = vol.Schema({
                vol.Required("mode", default=mode_default): vol.In({
                    "merge": "Apply scoped changes or merge complete rooms (preserve others)",
                    "replace": "Replace all rooms (full rooms export only; destructive)"}),
                vol.Required("yaml_text", default=current):
                    selector.TextSelector(selector.TextSelectorConfig(multiline=True)),
                **({vol.Optional("visual_edit", default=False): bool}
                   if getattr(self, "_global_yaml", False) else {})})
            note = ("Live HA Options Flow: use changes: for independent room/device/activity edits, "
                    "or rooms: for complete room import/export. Review before Save; "
                    "Foundation alone selects physical sources. No configuration.yaml/.storage writes.")
        if errors:
            note += "\n\nDraft NOT saved."
            # Both entry points reuse the visual workspace. The local scope
            # guard remains authoritative, including after visual repair.
            if ((focus is not None or getattr(self, "_global_yaml", False))
                    and not getattr(self, "_complete_setup", False)
                    and isinstance(attempted_text, str)):
                editable = self._editable_home_draft(attempted_text, attempted_mode)
                if editable:
                    self._complete_setup = True
                    return await self._complete_setup_form(
                        text=editable, errors=errors,
                        validation_detail=rejection_detail)
        return self.async_show_form(step_id="yaml", errors=errors,
                                    data_schema=schema,
                                    description_placeholders={"note": note,
                                                              "validation_detail": rejection_detail if errors else "",
                                                              "blocked_room_json": self._blocked_room_json(errors)})

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
        if getattr(self, "_specialist_section", False) and user_input and user_input.get("return_to_setup") is True:
            return await self.async_step_review()
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
        return self._specialist_form(step_id="existing_dell", errors=errors,
            fields={vol.Required("display"): vol.In({
                key: spec["name"] for key, spec in self._dell_displays.items()})})

    async def async_step_dell_display(self, user_input=None):
        """Configure a real local LAN IP; no HTTP scraping or speculative WOL."""
        if getattr(self, "_specialist_section", False) and user_input and user_input.get("return_to_setup") is True:
            return await self.async_step_review()
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
        return self._specialist_form(step_id="dell_display", errors=errors,
            fields={
                vol.Required("name", default=prior.get("name", "")): str,
                vol.Required("host", default=prior.get("host", "")): str,
            }, description_placeholders={"model": "Dell C8621QT", "port": "4661"})

    async def async_step_dell_remove(self, user_input=None):
        """Never remove a selected native display before its room is unbound."""
        if getattr(self, "_specialist_section", False) and user_input and user_input.get("return_to_setup") is True:
            return await self.async_step_review()
        from homeassistant.helpers import entity_registry as er
        key = self._dell_key
        entity_id = er.async_get(self.hass).async_get_entity_id(
            "media_player", DOMAIN, f"{self._entry.entry_id}:dell:{key}")
        assigned = entity_id and any(
            device.get("entity") == entity_id for room in self._rooms.values()
            for device in room.get("devices", {}).values())
        if assigned:
            return self._specialist_form(step_id="dell_remove",
                errors={"base": "stop_room_before_edit"}, fields={})
        if user_input and user_input.get("confirm"):
            self._dell_displays.pop(key)
            return await self.async_step_review()
        return self._specialist_form(step_id="dell_remove",
            fields={vol.Required("confirm", default=False): bool},
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
        """Optional per-device WOL, bound to one exact Foundation-approved native MAC.

        The existing action ID is retained for old flows. No physical command
        is sent during editing. Shared physical sources receive one power policy.
        """
        if getattr(self, "_specialist_section", False) and user_input and user_input.get("return_to_setup") is True:
            return await self.async_step_review()
        room = self._rooms[self._room_id]
        selected, _ = av_sources(self.hass)
        approvals = {
            (source.concept, source.entity_id, source.candidate_id): source
            for source in selected
        }
        choices = {}
        macs_by_key = {}
        for key, device in room["devices"].items():
            if not device["entity"].startswith(("media_player.", "remote.")):
                continue
            approved = approvals.get((
                device.get("foundation_concept"), device["entity"],
                device.get("foundation_candidate_id")))
            # Harmony owns its activity and power commands. Existing stale
            # overrides remain removable, but may never be newly authorized.
            if approved is not None and approved.provider == "harmony":
                approved = None
            macs = sorted(selected_native_macs(self.hass, approved)) if approved else []
            # A previously configured WOL override must remain removable,
            # even after Foundation revokes its approval or native MAC evidence.
            existing = device.get("power_on", {})
            if macs or existing.get("action") == "wake_on_lan.send_magic_packet":
                choices[key] = f"{device.get('name') or key} · {device['entity']}"
                macs_by_key[key] = macs
        if not choices:
            return self._specialist_form(
                step_id="tv_wake", errors={"base": "wake_unavailable"},
                fields={})
        chosen = (user_input or {}).get("device") or next(iter(choices))
        errors = {}
        if chosen not in choices:
            errors["base"] = "wake_invalid_target"
            chosen = next(iter(choices))
        device = room["devices"][chosen]
        configured = device.get("power_on", {})
        wol = configured if configured.get("action") == "wake_on_lan.send_magic_packet" else {}
        prior = wol.get("data", {})
        macs = macs_by_key[chosen]
        if user_input is not None and not errors:
            mode = user_input.get("mode")
            if mode == "keep":
                return await self.async_step_review()
            if mode in ("clear", "directed"):
                proposed = deepcopy(self._rooms)
                physical = device.get("physical_id", device["entity"])
                action = None
                if mode == "directed":
                    data = {
                        "mac": str(user_input.get("mac", "")).strip().replace("-", ":").lower(),
                        "broadcast_port": user_input.get("broadcast_port", 9),
                    }
                    ip = str(user_input.get("broadcast_address") or "").strip()
                    if ip:
                        data["broadcast_address"] = ip
                    action = {"action": "wake_on_lan.send_magic_packet", "data": data}
                    try:
                        validate_action(action, device["entity"], True)
                        if data["mac"] not in macs:
                            raise ValueError("MAC is not registered on the selected native device")
                    except (ValueError, TypeError):
                        errors["base"] = "wake_invalid_target"
                if not errors:
                    for spec in proposed.values():
                        for target in spec["devices"].values():
                            if target.get("physical_id", target["entity"]) == physical:
                                if mode == "directed":
                                    target["power_on"] = deepcopy(action)
                                elif target.get("power_on", {}).get("action") == "wake_on_lan.send_magic_packet":
                                    target.pop("power_on", None)
                    try:
                        validate_rooms(proposed)
                    except ValueError:
                        errors["base"] = "wake_invalid_target"
                    else:
                        self._rooms = proposed
                        return await self.async_step_review()
            else:
                errors["base"] = "wake_invalid_target"
        current_mac = str(prior.get("mac", "")).lower()
        suggested = current_mac if current_mac else (macs[0] if macs else "")
        return self._specialist_form(
            step_id="tv_wake", errors=errors,
            fields={
                vol.Required("device", default=chosen): vol.In(choices),
                vol.Required("mode", default="keep"): vol.In({
                    "keep": "Keep this device's current power action",
                    "directed": "Use Wake-on-LAN (MAC / optional LAN IP)",
                    "clear": "Remove this device's WOL override",
                }),
                vol.Required("mac", default=suggested): str,
                vol.Optional("broadcast_address", default=prior.get("broadcast_address", "")): str,
                vol.Optional("broadcast_port", default=prior.get("broadcast_port", 9)): int,
            },
            description_placeholders={"screen": device["entity"], "device": device["entity"]})

    async def async_step_speech_endpoint(self, user_input=None):
        """Explicit opt-in, one native destination per asset, same Options Flow."""
        if getattr(self, "_specialist_section", False) and user_input and user_input.get("return_to_setup") is True:
            return await self.async_step_review()
        room = self._rooms[self._room_id]
        sources, _ = av_sources(self.hass)
        selected = {(s.concept, s.entity_id): s for s in sources}
        players = {key: device for key, device in room["devices"].items()
                   if device.get("speech_tts_registry_id") or (
                       speech_player_eligible(
                           self.hass, device, selected.get((device.get("foundation_concept"), device["entity"]))))}
        choices = tts_choices(self.hass)
        errors = {}
        if user_input is not None and user_input.get("player") in players:
            device = players[user_input["player"]]
            target = user_input.get("tts", NONE)
            source = selected.get((device.get("foundation_concept"), device["entity"]))
            if (not user_input.get("confirm") or
                    target != NONE and (target not in choices
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
            return self._specialist_form(step_id="speech_endpoint",
                errors={"base": "speech_unavailable"}, fields={})
        return self._specialist_form(step_id="speech_endpoint", errors=errors,
            fields={
                vol.Required("player"): vol.In({key: device.get("name", device["entity"])
                                                for key, device in players.items()}),
                vol.Required("tts", default=NONE): vol.In({NONE: "Disable speech", **choices}),
                vol.Required("confirm", default=False): bool,
            })

    async def async_step_harmony_owner(self, user_input=None):
        if getattr(self, "_specialist_section", False) and user_input and user_input.get("return_to_setup") is True:
            return await self.async_step_review()
        room = self._rooms[self._room_id]
        sources, _ = av_sources(self.hass)
        approved = {(source.entity_id, source.candidate_id) for source in sources
                    if source.provider == "harmony" and source.concept == "source"
                    and source.entity_id.startswith("remote.")}
        options = {NONE: "No mapped Harmony controller"}
        for key, device in room["devices"].items():
            if (device["entity"], device.get("foundation_candidate_id")) in approved:
                options[key] = "Harmony declared resource scope: " + device["entity"]
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
        return self._specialist_form(step_id="harmony_owner", errors=errors,
            fields={vol.Required("controller", default=prior): vol.In(options),
                                    vol.Required("confirm", default=False): bool})

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
        """Configure native Power On settle timing and verified HDMI-CEC per device.

        Keep one existing Options Flow writer, one physical-source policy and
        the established shared-asset validation/review lifecycle.
        """
        if getattr(self, "_specialist_section", False) and user_input and user_input.get("return_to_setup") is True:
            return await self.async_step_review()
        room = self._rooms[self._room_id]
        choices = {key: f"{dev['entity']} · {dev.get('role', key)}"
                   for key, dev in room["devices"].items()
                   if dev["entity"].startswith("media_player.")
                   and dev.get("foundation_candidate_id")}
        if not choices:
            return await self.async_step_review()
        errors = {}
        if user_input is not None:
            key, enabled = user_input.get("device"), user_input.get("enabled")
            if key not in choices or type(enabled) is not bool:
                errors["base"] = "cec_invalid"
            else:
                try:
                    settle_ms = validate_step_delay(user_input.get(
                        "post_power_on_delay_ms",
                        room["devices"][key].get("post_power_on_delay_ms", 0)))
                except ValueError:
                    errors["base"] = "cec_invalid"
                else:
                    physical = room["devices"][key].get("physical_id", room["devices"][key]["entity"])
                    proposal = deepcopy(self._rooms)
                    for spec in proposal.values():
                        for dev in spec["devices"].values():
                            if dev.get("physical_id", dev["entity"]) == physical:
                                dev["hdmi_cec_enabled"] = enabled
                                dev["post_power_on_delay_ms"] = settle_ms
                    try:
                        validate_rooms(proposal)
                    except ValueError:
                        errors["base"] = "cec_in_use"
                    else:
                        self._rooms = proposal
                        return await self.async_step_review()
        chosen = (user_input or {}).get("device", next(iter(choices)))
        return self._specialist_form(step_id="cec_device", errors=errors,
            fields={
                vol.Required("device", default=chosen if chosen in choices else next(iter(choices))): vol.In(choices),
                vol.Required("enabled", default=room["devices"][chosen].get("hdmi_cec_enabled", False)
                             if chosen in choices else False): bool,
                vol.Required("post_power_on_delay_ms",
                             default=room["devices"][chosen].get("post_power_on_delay_ms", 0)
                             if chosen in choices else 0):
                    selector.NumberSelector(selector.NumberSelectorConfig(
                        min=0, max=30000, step=1, mode=selector.NumberSelectorMode.BOX)),
            },
            description_placeholders={"room": room.get("name", self._room_id)})

    async def async_step_cec_activity(self, user_input=None):
        """Declare a tested HDMI edge, with exact omissions and target-state policy.

        Uses existing Options Flow atomic review/save. No writes to hardware.
        Disabling a link never edits or removes a physical/source route step.
        """
        if getattr(self, "_specialist_section", False) and user_input and user_input.get("return_to_setup") is True:
            return await self.async_step_review()
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
            return self._specialist_form(step_id="cec_activity", errors={"base": "cec_needs_endpoints"},
                fields={},
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
        return self._specialist_form(step_id="cec_activity", errors=errors,
            fields={
                vol.Required("target", default=default_target if default_target in targets else next(iter(targets))): vol.In(targets),
                vol.Required("source", default=default_source): vol.In(sources),
                vol.Required("verified_link", default=old.get("verified_link", False)): bool,
                vol.Required("skip_power_on", default=old.get("skip_power_on", False)): bool,
                vol.Required("skip_power_off", default=old.get("skip_power_off", False)): bool,
                vol.Required("skip_source", default=old.get("skip_source", False)): bool,
                vol.Required("remove_link", default=False): bool,
            },
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
            if self._option_action == "activity_devices":
                self._editing_activity = key
                return await self.async_step_activity_devices()
            if self._option_action == "quick_edit_activity":
                self._editing_activity = key
                return await self.async_step_quick_edit_activity()
            if self._option_action == "script_step":
                self._editing_activity = key
                return await self.async_step_script_step()
            if self._option_action == "button_mapping":
                self._editing_activity = key
                return await self.async_step_button_mapping()
            if self._option_action == "macro_manage":
                self._editing_activity = key
                return await self.async_step_macro_manage()
            if self._option_action == "cec_activity":
                self._editing_activity = key
                return await self.async_step_cec_activity()
            self._editing_activity = key
            return await self.async_step_activity()
        return self.async_show_form(step_id="existing_activity", data_schema=vol.Schema({
            vol.Required("activity"): vol.In(choices)}))


    async def async_step_activity_devices(self, user_input=None):
        """Harmony-style step 1: one exact approved set of existing room devices.

        This is the existing HA Options Flow draft, not a second config store.
        No device is created, selected by label, actuated or written before Review.
        Removing old actions is destructive and requires explicit confirmation.
        """
        room = self._rooms[self._room_id]
        activity = room["activities"][self._editing_activity]
        current = list(activity["devices"])
        devices = room["devices"]
        sources, _ = av_sources(self.hass)
        approved = {(src.concept, src.entity_id, src.candidate_id) for src in sources}
        choices = {key: f"{dev.get('name', key)} · {dev['entity']}"
                   for key, dev in devices.items()
                   if (dev.get("foundation_concept"), dev["entity"],
                       dev.get("foundation_candidate_id")) in approved}
        errors = {}
        if user_input is not None:
            selected = user_input.get("devices")
            if (not isinstance(selected, list) or not selected or
                    len(selected) != len(set(selected)) or
                    any(key not in choices for key in selected)):
                errors["base"] = "not_foundation_selected"
            else:
                chosen = set(selected)
                kind = activity.get("activity_type", "watch_tv")
                if (kind in ("watch_tv", "watch_hdmi", "watch_source", "play_game")
                        and "screen" not in chosen):
                    errors["base"] = "screen_required"
                elif (kind in ("watch_source", "play_game") and not any(
                        devices[key].get("foundation_concept") == "source" for key in chosen)):
                    errors["base"] = "source_required"
                elif (kind == "listen_music" and not any(
                        devices[key].get("foundation_concept") in ("amplifier", "source")
                        for key in chosen)):
                    errors["base"] = "audio_required"
                else:
                    removed = set(current) - chosen
                    dependent = (any(step["device"] in removed
                                     for phase in ("steps", "stop_steps")
                                     for step in activity.get(phase, []))
                                 or any(v["device"] in removed
                                        for v in activity.get("button_map", {}).values())
                                 or any(step["device"] in removed
                                        for macro in activity.get("macros", {}).values()
                                        for step in macro.get("steps", []))
                                 or any(link["source"] in removed or link["target"] in removed
                                        for link in activity.get("cec_links", [])))
                    if dependent and user_input.get("confirm_remove") is not True:
                        errors["base"] = "confirm_source_steps"
                    else:
                        candidate = deepcopy(activity)
                        candidate["steps"] = [s for s in candidate.get("steps", [])
                                              if s["device"] in chosen]
                        candidate["stop_steps"] = [s for s in candidate.get("stop_steps", [])
                                                   if s["device"] in chosen]
                        candidate["button_map"] = {name: mapping for name, mapping
                                                   in candidate.get("button_map", {}).items()
                                                   if mapping["device"] in chosen}
                        candidate["macros"] = {name: {**macro, "steps": [s for s in macro["steps"]
                                                   if s["device"] in chosen]}
                                               for name, macro in candidate.get("macros", {}).items()
                                               if any(s["device"] in chosen for s in macro["steps"])}
                        candidate["cec_links"] = [link for link in candidate.get("cec_links", [])
                                                  if link["source"] in chosen and link["target"] in chosen]
                        self._pending_activity = candidate
                        self._pending_cast = [key for key in current if key in chosen]
                        self._pending_cast.extend(key for key in devices
                                                  if key in chosen and key not in current)
                        return await self.async_step_activity_device_order()
        return self.async_show_form(step_id="activity_devices", errors=errors,
            data_schema=vol.Schema({
                vol.Required("devices", default=[k for k in current if k in choices]):
                    _select_many(choices or {"none": "No Foundation-approved devices"}),
                vol.Optional("confirm_remove", default=False): bool,
            }), description_placeholders={"room": room.get("name", self._room_id),
                "activity": activity.get("name", self._editing_activity)})

    async def async_step_activity_device_order(self, user_input=None):
        """Harmony-style step 2: deterministic startup order, CEC still guarded.

        All mutations are in the pending Options Flow transaction and require
        the existing atomic Review/Save. Individual script steps remain editable
        through the same Options Flow once the activity cast has been reviewed.
        """
        ordered = list(self._pending_cast)
        choices = {key: self._rooms[self._room_id]["devices"][key].get("name", key)
                   for key in ordered}
        errors = {}
        if user_input is not None:
            requested = [user_input.get(f"device_{index}") for index in range(len(ordered))]
            if len(requested) != len(ordered) or set(requested) != set(ordered):
                errors["base"] = "selection_changed"
            else:
                pending = deepcopy(self._pending_activity)
                pending["devices"] = requested
                self._rooms[self._room_id]["activities"][self._editing_activity] = pending
                return await (self.async_step_activity_tune()
                              if getattr(self, "_activity_tuning", False)
                              else self.async_step_review())
        return self.async_show_form(step_id="activity_device_order", errors=errors,
            data_schema=vol.Schema({
                vol.Required(f"device_{index}", default=key): vol.In(choices)
                for index, key in enumerate(ordered)
            }), description_placeholders={
                "activity": self._pending_activity.get("name", self._editing_activity),
                "note": "Select the actual power-on sequence; verified CEC links still impose safe dependencies.",
            })

    async def async_step_button_mapping(self, user_input=None):
        """Configure one semantic activity button using the HA Options Flow."""
        if getattr(self, "_specialist_section", False) and user_input and user_input.get("return_to_setup") is True:
            return await self.async_step_review()
        activity = self._rooms[self._room_id]["activities"][self._editing_activity]
        cast = activity["devices"]
        devices = self._rooms[self._room_id]["devices"]
        mapping = activity.get("button_map", {})
        errors = {}
        if user_input is not None:
            button, operation = user_input.get("button"), user_input.get("operation")
            if button not in ACTIVITY_BUTTONS or operation not in ("assign", "remove"):
                errors["base"] = "selection_changed"
            elif operation == "remove":
                if button in mapping:
                    activity["button_map"].pop(button)
                return await self.async_step_review()
            elif (user_input.get("device") not in cast
                  or user_input.get("action") not in BUTTON_ACTIONS):
                errors["base"] = "selection_changed"
            else:
                binding = {"device": user_input["device"], "action": user_input["action"]}
                if binding["action"] in BUTTON_VALUE_ACTIONS:
                    self._button_pending = (button, binding)
                    return await self.async_step_button_value()
                activity.setdefault("button_map", {})[button] = binding
                return await self.async_step_review()
        return self._specialist_form(step_id="button_mapping", errors=errors,
            fields={
                vol.Required("button", default=next(iter(sorted(mapping)), "home")):
                    vol.In({button: button for button in sorted(ACTIVITY_BUTTONS)}),
                vol.Required("operation", default="assign"):
                    vol.In({"assign": "Assign/update", "remove": "Remove assignment"}),
                vol.Required("device", default=cast[0]):
                    vol.In({key: devices[key].get("name", key) for key in cast}),
                vol.Required("action", default="remote_key"):
                    vol.In({action: action.replace("_", " ").title()
                            for action in sorted(BUTTON_ACTIONS)}),
            })

    async def async_step_button_value(self, user_input=None):
        """Only offer native commands/inputs of the exact selected provider."""
        if getattr(self, "_specialist_section", False) and user_input and user_input.get("return_to_setup") is True:
            return await self.async_step_review()
        button, binding = self._button_pending
        device = self._rooms[self._room_id]["devices"][binding["device"]]
        action = binding["action"]
        offered = (self._script_native_keys(device) if action == "remote_key"
                   else source_lists(self.hass, device["entity"])[action + "_list"])
        if not offered:
            return self._specialist_form(step_id="button_value",
                errors={"base": "selection_changed"}, fields={})
        errors = {}
        if user_input is not None:
            value = user_input.get("value")
            if value not in offered:
                errors["base"] = "selection_changed"
            else:
                activity = self._rooms[self._room_id]["activities"][self._editing_activity]
                activity.setdefault("button_map", {})[button] = {**binding, "value": value}
                return await self.async_step_review()
        return self._specialist_form(step_id="button_value", errors=errors,
            fields={
                vol.Required("value", default=offered[0]):
                    vol.In({key: key for key in offered})})


    def _script_steps(self, activity, phase):
        """Reuse one ordered-step editor for start/stop and named macros."""
        if phase in ("steps", "stop_steps"):
            return activity.setdefault(phase, [])
        if isinstance(phase, str) and phase.startswith("macro:"):
            macro = activity.get("macros", {}).get(phase[6:])
            if isinstance(macro, dict):
                return macro["steps"]
        raise ValueError("Unknown script phase")

    async def async_step_macro_manage(self, user_input=None):
        if getattr(self, "_specialist_section", False) and user_input and user_input.get("return_to_setup") is True:
            return await self.async_step_review()
        activity = self._rooms[self._room_id]["activities"][self._editing_activity]
        macros = activity.get("macros", {})
        cast = activity["devices"]
        devices = self._rooms[self._room_id]["devices"]
        errors = {}
        if user_input is not None:
            operation, macro_id = user_input.get("operation"), user_input.get("macro")
            if operation == "create" and user_input.get("device") in cast:
                self._macro_create_device = user_input["device"]
                return await self.async_step_macro_create()
            if operation in ("edit", "remove") and macro_id in macros:
                if operation == "remove":
                    activity["macros"].pop(macro_id)
                    return await self.async_step_review()
                self._script_phase = "macro:" + macro_id
                return await self.async_step_script_step()
            errors["base"] = "selection_changed"
        return self._specialist_form(step_id="macro_manage", errors=errors,
            fields={
                vol.Required("operation", default="create"):
                    vol.In({"create": "New named shortcut",
                            "edit": "Edit ordered shortcut steps",
                            "remove": "Remove shortcut"}),
                vol.Required("macro", default=next(iter(macros), "__new__")):
                    vol.In({"__new__": "New", **{
                        key: macro["name"] for key, macro in macros.items()}}),
                vol.Required("device", default=cast[0]):
                    vol.In({key: devices[key].get("name", key) for key in cast}),
            })

    async def async_step_macro_create(self, user_input=None):
        if getattr(self, "_specialist_section", False) and user_input and user_input.get("return_to_setup") is True:
            return await self.async_step_review()
        activity = self._rooms[self._room_id]["activities"][self._editing_activity]
        macros = activity.get("macros", {})
        device_key = self._macro_create_device
        device = self._rooms[self._room_id]["devices"][device_key]
        keys = self._script_native_keys(device)
        routes = source_lists(self.hass, device["entity"])["source_list"]
        if not keys and not routes:
            return self._specialist_form(step_id="macro_create",
                errors={"base": "selection_changed"}, fields={})
        choices = {"remote_key:" + key: "Remote · " + key for key in keys}
        choices.update({"source:" + source: "Input · " + source for source in routes})
        errors = {}
        if user_input is not None:
            name = str(user_input.get("name", "")).strip()
            macro_id = _slug(name)
            command = user_input.get("first_action")
            if (not 0 < len(name) <= 80 or command not in choices or
                    macro_id in macros or len(macros) >= 24):
                errors["base"] = "selection_changed"
            else:
                kind, value = command.split(":", 1)
                step = ({"device": device_key, "type": "remote_key", "value": value}
                        if kind == "remote_key" else
                        {"device": device_key, "type": "source", "candidates": [value]})
                activity.setdefault("macros", {})[macro_id] = {"name": name, "steps": [step]}
                return await self.async_step_review()
        return self._specialist_form(step_id="macro_create", errors=errors,
            fields={
                vol.Required("name"): str,
                vol.Required("first_action"): vol.In(choices),
            })

    async def async_step_script_step(self, user_input=None):
        """One script editor over the existing Options Flow, not a new writer."""
        if getattr(self, "_specialist_section", False) and user_input and user_input.get("return_to_setup") is True:
            return await self.async_step_review()
        activity = self._rooms[self._room_id]["activities"][self._editing_activity]
        errors = {}
        phases = {"steps": "Start / switch steps", "stop_steps": "Stop steps",
                  **{"macro:" + key: "Shortcut · " + macro["name"]
                     for key, macro in activity.get("macros", {}).items()}}
        selected_phase = (self._script_phase if getattr(self, "_script_phase", None) in phases
                          else "steps")
        if user_input is not None:
            phase = user_input.get("phase")
            operation = user_input.get("operation")
            if phase not in phases or operation not in (
                    "add", "insert", "edit", "remove", "up", "down"):
                errors["base"] = "selection_changed"
            else:
                steps = self._script_steps(activity, phase)
                try:
                    index = int(user_input.get("index", 0))
                except (TypeError, ValueError):
                    index = -1
                if operation == "add":
                    index = len(steps)
                if operation == "insert" and index == len(steps):
                    operation = "add"
                if (index < 0 or index >= len(steps)
                        and operation not in ("add", "insert")):
                    errors["base"] = "selection_changed"
                elif operation == "remove":
                    if phase.startswith("macro:") and len(steps) == 1:
                        errors["base"] = "selection_changed"
                    else:
                        steps.pop(index)
                        return await self._script_edit_done()
                elif operation in ("up", "down"):
                    other = index + (-1 if operation == "up" else 1)
                    if not 0 <= other < len(steps):
                        errors["base"] = "selection_changed"
                    else:
                        steps[index], steps[other] = steps[other], steps[index]
                        return await self._script_edit_done()
                else:
                    self._script_phase = phase
                    self._script_operation = operation
                    self._script_index = index
                    return await self.async_step_script_detail()
        # Do not allow a user to select step 20 while editing a 3-step script.
        current_steps = self._script_steps(activity, selected_phase)
        indices = {str(i): f"{i + 1} · {step.get('device')} / {step.get('type')}"
                   for i, step in enumerate(current_steps)}
        if not indices:
            indices = {"0": "New first step"}
        return self._specialist_form(step_id="script_step", errors=errors,
            fields={
                vol.Required("phase", default=selected_phase): vol.In(phases),
                vol.Required("operation", default="add"): vol.In({
                    "add": "Append step", "insert": "Insert before step",
                    "edit": "Edit step", "remove": "Remove step",
                    "up": "Move step up", "down": "Move step down"}),
                vol.Required("index", default="0"): vol.In({
                    str(i): f"Step {i + 1}" for i in range(len(current_steps) or 1)})
            })

    async def async_step_script_detail(self, user_input=None):
        if getattr(self, "_specialist_section", False) and user_input and user_input.get("return_to_setup") is True:
            return await self.async_step_review()
        activity = self._rooms[self._room_id]["activities"][self._editing_activity]
        original = (self._script_steps(activity, self._script_phase)[self._script_index]
                    if self._script_operation == "edit" else {})
        cast = activity["devices"]
        devices = self._rooms[self._room_id]["devices"]
        errors = {}
        if user_input is not None:
            device, action = user_input.get("device"), user_input.get("type")
            if device not in cast or action not in (
                    "remote_key", "source", "sound_mode", "volume", "mute", "play",
                    "pause", "delay", "wait_until"):
                errors["base"] = "selection_changed"
            else:
                self._script_device = device
                self._script_type = action
                return await self.async_step_script_arguments()
        return self._specialist_form(step_id="script_detail", errors=errors,
            fields={
                vol.Required("device", default=original.get("device", cast[0])):
                    vol.In({key: devices[key].get("name", key) for key in cast}),
                vol.Required("type", default=original.get("type", "remote_key")):
                    vol.In({"remote_key": "Native remote command", "source": "Input / HDMI",
                            "sound_mode": "Sound mode", "volume": "Volume", "mute": "Mute / Unmute",
                            "play": "Play", "pause": "Pause", "delay": "Sleep / Delay",
                            "wait_until": "Wait until native device state"})
            })

    def _script_native_keys(self, device):
        """Provider key vocabulary, not an unchecked user service payload."""
        from .adapter import REMOTE_KEYSETS, WEBOS_KEYS
        source = authorized_source(self.hass, device)
        if source is None:
            return []
        provider = source.integration
        if provider == "webostv" and device["entity"].startswith("media_player."):
            return list(WEBOS_KEYS)
        if provider in REMOTE_KEYSETS:
            return list(REMOTE_KEYSETS[provider])
        return []

    async def async_step_script_arguments(self, user_input=None):
        if getattr(self, "_specialist_section", False) and user_input and user_input.get("return_to_setup") is True:
            return await self.async_step_review()
        activity = self._rooms[self._room_id]["activities"][self._editing_activity]
        device = self._rooms[self._room_id]["devices"][self._script_device]
        kind = self._script_type
        original = (self._script_steps(activity, self._script_phase)[self._script_index]
                    if self._script_operation == "edit" else {})
        args = {}
        default_policy = "override" if "delay_ms" in original else "inherit"
        errors = {}
        if kind == "remote_key":
            keys = self._script_native_keys(device)
            if not keys:
                return self._specialist_form(step_id="script_arguments", errors={"base": "selection_changed"},
                                            fields={})
            args[vol.Required("value", default=original.get("value", keys[0]))] = vol.In({
                key: key for key in keys})
        elif kind in ("source", "sound_mode"):
            offered = source_lists(self.hass, device["entity"])[kind + "_list"]
            if not offered:
                return self._specialist_form(step_id="script_arguments", errors={"base": "route_changed"},
                                            fields={})
            selected = original.get("candidates", [offered[0]])[0]
            if selected not in offered:
                selected = offered[0]
            args[vol.Required("value", default=selected)] = vol.In({
                value: value for value in offered})
        elif kind == "volume":
            args[vol.Required("value", default=original.get("level", .5))] = (
                selector.NumberSelector(selector.NumberSelectorConfig(
                    min=0, max=1, step=.01, mode=selector.NumberSelectorMode.BOX)))
        elif kind == "mute":
            args[vol.Required("value", default=original.get("value", False))] = bool
        elif kind == "delay":
            args[vol.Required("milliseconds", default=original.get("milliseconds", 1000))] = (
                selector.NumberSelector(selector.NumberSelectorConfig(
                    min=0, max=30000, step=1, mode=selector.NumberSelectorMode.BOX)))
        elif kind == "wait_until":
            states = ("on", "off", "idle", "playing", "paused", "standby", "buffering")
            initial = original.get("states", ["on"])[0]
            args[vol.Required("state", default=initial)] = vol.In({
                state: state for state in states})
            args[vol.Required("timeout", default=original.get("timeout", 15))] = (
                selector.NumberSelector(selector.NumberSelectorConfig(
                    min=1, max=300, step=1, mode=selector.NumberSelectorMode.BOX)))
        if kind not in ("delay", "wait_until"):
            args[vol.Required("delay_policy", default=default_policy)] = vol.In({
                "inherit": "Use standard delay", "override": "Override after this step"})
            args[vol.Required("delay_ms", default=original.get("delay_ms", self._original_step_delay_ms))] = (
                selector.NumberSelector(selector.NumberSelectorConfig(
                    min=0, max=30000, step=1, mode=selector.NumberSelectorMode.BOX)))
        if user_input is not None:
            try:
                step = {"device": self._script_device, "type": kind}
                if kind == "remote_key":
                    if user_input.get("value") not in self._script_native_keys(device):
                        raise ValueError("Unknown native remote command")
                    step["value"] = user_input["value"]
                elif kind in ("source", "sound_mode"):
                    value = user_input.get("value")
                    if value not in source_lists(self.hass, device["entity"])[kind + "_list"]:
                        raise ValueError("Native route changed")
                    step["candidates"] = [value]
                elif kind == "volume":
                    value = user_input.get("value")
                    if type(value) not in (int, float) or not 0 <= value <= 1:
                        raise ValueError("Invalid volume")
                    step["level"] = value
                elif kind == "mute":
                    value = user_input.get("value")
                    if type(value) is not bool:
                        raise ValueError("Mute needs a boolean")
                    step["value"] = value
                elif kind == "delay":
                    step["milliseconds"] = validate_step_delay(user_input.get("milliseconds"))
                elif kind == "wait_until":
                    state = user_input.get("state")
                    timeout = user_input.get("timeout")
                    if state not in ("on", "off", "idle", "playing", "paused", "standby", "buffering") or (
                            type(timeout) not in (int, float) or not 0 < timeout <= 300):
                        raise ValueError("Invalid wait target")
                    step.update(states=[state], timeout=timeout)
                if kind not in ("delay", "wait_until"):
                    policy = user_input.get("delay_policy")
                    if policy == "override":
                        step["delay_ms"] = validate_step_delay(user_input.get("delay_ms"))
                    elif policy != "inherit":
                        raise ValueError("Invalid delay policy")
            except (ValueError, TypeError, KeyError):
                errors["base"] = "selection_changed"
            else:
                steps = self._script_steps(activity, self._script_phase)
                if self._script_operation == "edit":
                    steps[self._script_index] = step
                else:
                    steps.insert(self._script_index, step)
                return await self._script_edit_done()
        return self._specialist_form(step_id="script_arguments", errors=errors,
                                    fields=args)

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
                    if user_input.get("favorite", activity.get("favorite", False)) is True:
                        candidate["favorite"] = True
                    else:
                        candidate.pop("favorite", None)
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
        fields = {vol.Required("activity_name", default=activity.get("name", self._editing_activity)): str,
                  vol.Optional("favorite", default=activity.get("favorite", False)): bool}
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

    async def async_step_script_defaults(self, user_input=None):
        """One household default; individual script steps may override it."""
        errors = {}
        if user_input is not None:
            try:
                self._yaml_step_delay_ms = validate_step_delay(
                    user_input.get("default_step_delay_ms"))
            except ValueError:
                errors["base"] = "yaml_invalid"
            else:
                return await self.async_step_review()
        return self.async_show_form(step_id="script_defaults", errors=errors,
            data_schema=vol.Schema({
                vol.Required("default_step_delay_ms",
                             default=self._original_step_delay_ms):
                    selector.NumberSelector(selector.NumberSelectorConfig(
                        min=0, max=30000, step=1, mode=selector.NumberSelectorMode.BOX))
            }))

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
        if self._yaml_step_delay_ms is not None:
            options["default_step_delay_ms"] = self._yaml_step_delay_ms
        return self.async_create_entry(title="", data=options)
