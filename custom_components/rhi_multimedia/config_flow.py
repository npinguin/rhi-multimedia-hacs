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

from .const import CONFIG_VERSION, CONF_TITLE, DOMAIN
from .dell_c8621qt import valid_host
from .engine import READY_STATES, execution_in_progress
from .foundation import authorized_source, reviewed_native_source, selected_native_macs, projection_source_reads
from .source_discovery import (area_choices, av_sources, discovered_av_sources,
                               logical_av_catalog, native_asset_key, proposed_room_setup, source_lists, speech_player_eligible,
                               native_source_evidence,
                               tts_choices)
from .validation import (ACTIVITY_BUTTONS, BUTTON_ACTIONS, BUTTON_VALUE_ACTIONS,
                         native_state, native_choices, native_feature_mask, activity_computer_device, cec_links_for_activity, route_status, validate_action,
                         validate_rooms, validate_step_delay, logical_asset_id, wol_data, set_wol_policy,
                         configuration_source, split_device_model, configuration_options,
                         DEVICE_CATALOG, DEVICE_LABEL, DEFAULT_POWER_MODE, MEMBERSHIP_FIELDS,
                         configuration_model, expand_device_model, change_device, change_membership, merge_device_model, reconcile_scoped_device_edits, ASSET_REF,
                         ACTIVITY_TYPES, ACTIVITY_VIDEO_TYPES, ACTIVITY_PLAYER_TYPES,
                         media_roles, device_concept, activity_cast_error, ALLOWED_STEPS,
                         DEFAULT_STEP_DELAY_MS, DEFAULT_HDMI_CEC_ENABLED, DEFAULT_WOL_PORT,
                         MAX_STEP_DELAY_MS, MAX_TIMEOUT_SECONDS, NATIVE_WAIT_STATES,
                         POWER_MODES, DEVICE_ROLES, PC_KEYS)

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
    if previous_entity != entity_id:
        # An old entity-only binding still owns its original reservation.
        updated.setdefault("physical_id", previous_entity)
        updated.setdefault("asset_id", logical_asset_id(device))
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
    # Room selection, native rename and detached Device reuse all refer to
    # the same exact candidate. The previous room preserves local metadata;
    # the owning catalog preserves shared policy and stable asset identity.
    def same_source(device):
        return (device.get("foundation_concept") == concept
                and device.get("foundation_candidate_id") == candidate.candidate_id)

    links = [(room, key, dev) for room in flow._rooms.values()
             for key, dev in room["devices"].items() if same_source(dev)]
    prior_links = [dev for dev in old.values() if same_source(dev)]
    catalog = getattr(flow, "_draft_catalog", {})
    saved = [(asset, dev) for asset, dev in catalog.items() if same_source(dev)]
    records = [dev for _, _, dev in links] + prior_links + [dev for _, dev in saved]
    if records:
        identities = {(dev.get("physical_id", dev["entity"]), logical_asset_id(dev))
                      for dev in records}
        if len(identities) != 1 or len(saved) > 1:
            raise ValueError("Conflicting historical source identity")
        # Never rebuild a shared policy from native discovery or select a
        # different winner on the rename path. Preserve the local room role.
        local = prior_links[0] if len(prior_links) == 1 else links[0][2] if links else None
        owner = local if local is not None else saved[0][1]
        result = _remapped_device({k: v for k, v in owner.items() if k != DEVICE_LABEL}, entity_id)
        if local is None:
            result["role"] = ("remote" if entity_id.startswith("remote.") else
                              {"display": "display", "amplifier": "receiver", "source": "player",
                               "network": "computer"}[concept])
        for room, key, dev in links:
            room["devices"][key] = _remapped_device(dev, entity_id)
        for asset, dev in saved:
            catalog[asset] = _remapped_device(dev, entity_id)
        return result
    existing = next((dev for room in flow._rooms.values() for dev in room["devices"].values()
                     if dev["entity"] == entity_id), None)
    physical = existing.get("physical_id", entity_id) if existing else f"ha_entity:{entity_id}"
    role = ("remote" if entity_id.startswith("remote.") else "receiver" if concept == "amplifier"
            else "player" if concept == "source" else "display")
    return {"entity": entity_id, "physical_id": physical,
            "asset_id": existing.get("asset_id", physical) if existing else physical,
            "role": role,
            "foundation_concept": concept, "foundation_candidate_id": candidate.candidate_id,
            "power_mode": "passive" if entity_id.startswith("remote.") else DEFAULT_POWER_MODE}


def _activity_for_cast(activity, devices, cast, kind):
    """Keep unrelated activity settings; report dependencies that need consent."""
    candidate = deepcopy(activity)
    chosen = set(cast)
    dependent = False
    for phase in ("steps", "stop_steps"):
        if phase in candidate:
            before = candidate[phase]
            candidate[phase] = [step for step in before if step["device"] in chosen]
            dependent |= candidate[phase] != before
    if "button_map" in candidate:
        before = candidate["button_map"]
        candidate["button_map"] = {key: binding for key, binding in before.items()
                                   if binding["device"] in chosen}
        dependent |= candidate["button_map"] != before
    if "macros" in candidate:
        before = candidate["macros"]
        candidate["macros"] = {key: {**macro, "steps": [step for step in macro["steps"]
                                                     if step["device"] in chosen]}
                               for key, macro in before.items()
                               if any(step["device"] in chosen for step in macro["steps"])}
        dependent |= candidate["macros"] != before
    if "cec_links" in candidate:
        before = candidate["cec_links"]
        candidate["cec_links"] = [link for link in before
                                  if link["source"] in chosen and link["target"] in chosen]
        dependent |= candidate["cec_links"] != before
    if "computer_application" in candidate:
        def computers(keys):
            return {key for key in keys if key in devices
                    and device_concept(devices[key]) == "network"}
        if kind != "work_on_pc" or computers(activity["devices"]) != computers(cast):
            candidate.pop("computer_application")
            dependent = True
    candidate["devices"] = list(cast)
    return candidate, dependent


def _route_changes(options, existing, user_input, prefix=""):
    """Check both route fields before changing the existing activity sequence."""
    changes = []
    for field in ("source", "sound_mode"):
        chosen = user_input.get(prefix + field, UNCHANGED)
        if chosen == UNCHANGED:
            continue
        prior = any(step["type"] == field for step in existing)
        if chosen not in options[field + "_list"] and not (chosen == REMOVE_ROUTE and prior):
            raise ValueError("Native route changed")
        changes.append((field, chosen))
    return changes


def _change_route(steps, key, field, chosen):
    """Edit only the final target; preserve earlier explicit script commands."""
    position = next((i for i in range(len(steps) - 1, -1, -1)
                     if steps[i]["device"] == key and steps[i]["type"] == field), len(steps))
    result = list(steps)
    if position < len(steps):
        result.pop(position)
    if chosen != REMOVE_ROUTE:
        replacement = {"type": field, "device": key, "candidates": [chosen]}
        if position < len(steps) and "delay_ms" in steps[position]:
            replacement["delay_ms"] = steps[position]["delay_ms"]
        result.insert(position, replacement)
    return result


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

    async def _single_room_source(self, concept, field, default_key, next_step, none_label, user_input):
        """Shared native source selector. Default keys only name new links."""
        room = self._rooms[self._room_id]
        choices = _sources(self, concept, room.get("area_id"))
        prior = media_roles((self._previous_room or {}).get("devices", {}), concept)
        previous_key = next(iter(prior)) if len(prior) == 1 else None
        errors = {}
        if user_input is not None:
            chosen = user_input.get(field, NONE)
            if chosen != NONE and chosen not in choices:
                errors["base"] = "not_foundation_selected"
            else:
                if chosen != NONE:
                    device = _source_ref(self, chosen, concept)
                    # Retain the existing local relationship key; activities
                    # are never retargeted silently (room update validates cast).
                    key = previous_key or default_key
                    if key in room["devices"] and room["devices"][key] != device:
                        key = default_key + "_" + _slug(chosen)
                    room["devices"][key] = device
                return await next_step()
        default = prior[previous_key]["entity"] if previous_key else NONE
        if not self._editing_room:
            default = _area_default(self, concept, room.get("area_id"))
        default = default if default in choices else NONE
        return self.async_show_form(step_id=field, errors=errors,
            data_schema=vol.Schema({vol.Required(field, default=default):
                                    vol.In({NONE: none_label, **choices})}))

    async def async_step_display(self, user_input=None):
        return await self._single_room_source(
            "display", "display", "screen", self.async_step_amplifier,
            "No screen (music-only room)", user_input)

    async def async_step_amplifier(self, user_input=None):
        return await self._single_room_source(
            "amplifier", "amplifier", "amplifier", self.async_step_sources,
            "No amplifier (TV/internal speakers)", user_input)

    async def async_step_sources(self, user_input=None):
        choices = _sources(self, "source", self._rooms[self._room_id].get("area_id"))
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
                            if device_concept(v) == "source" and v["entity"] in choices]
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
        source_keys = {k: v["entity"] for k, v in media_roles(devices, "source").items()}
        # Retain explicitly cast legacy remote roles only for existing edits.
        source_keys.update({k: devices[k]["entity"] for k in previous.get("devices", [])
                            if k in devices and device_concept(devices[k]) == "source"
                            and devices[k]["entity"].startswith("remote.")})
        errors = {}
        choices = dict(_activity_choices(self.hass))
        computer_keys = {k: v["entity"] for k, v in devices.items()
                         if v.get("foundation_concept") == "network" and v.get("role") == "computer"}
        display_keys = {k: v["entity"] for k, v in media_roles(devices, "display").items()}
        amplifier_keys = media_roles(devices, "amplifier")
        previous_cast = previous.get("devices", [])
        # Preserve an explicit existing selection; suggest only a unique role.
        def selected_role(keys):
            prior = [key for key in previous_cast if key in keys]
            return prior[0] if len(prior) == 1 else next(iter(keys)) if len(keys) == 1 else NONE
        display = selected_role(display_keys)
        amplifier = selected_role(amplifier_keys)
        from .validation import computer_application_ids
        app_choices = {app: app.replace("_", " ") for key in computer_keys
                       for app in sorted(computer_application_ids(devices[key]))}
        if computer_keys or previous.get("activity_type") == "work_on_pc":
            choices["work_on_pc"] = "Work on PC / SIM Racing"
        if not editing:
            choices[DIRECT_ONLY] = "Direct device control only (no activity)"
        if user_input is not None:
            kind = (self._guided_activity_type if not editing and self._guided_activity_type in ACTIVITIES
                    else user_input.get("activity_type"))
            if kind == DIRECT_ONLY and not editing:
                return await self.async_step_next()
            source = NONE if kind == "watch_hdmi" else user_input.get("primary_source", NONE)
            computer_display = user_input.get("computer_display", NONE)
            application = user_input.get("computer_application", NONE)
            selected_display = user_input.get("display_device", display)
            selected_amplifier = user_input.get("amplifier_device", amplifier)
            if kind == "work_on_pc" and (source not in computer_keys or
                    computer_display not in (NONE, *display_keys) or
                    (application != NONE and application not in computer_application_ids(devices[source]))):
                errors["base"] = "source_required"
            elif kind not in ACTIVITY_TYPES:
                errors["base"] = "invalid_activity"
            elif selected_display not in (NONE, *display_keys) or selected_amplifier not in (NONE, *amplifier_keys):
                errors["base"] = "selection_changed"
            elif kind in ACTIVITY_VIDEO_TYPES and selected_display == NONE:
                errors["base"] = "screen_required"
            elif kind in ACTIVITY_PLAYER_TYPES and source not in source_keys:
                errors["base"] = "source_required"
            elif kind == "listen_music" and not (selected_amplifier != NONE or source in source_keys):
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
                        if kind == "work_on_pc":
                            cast.append(source)
                            if computer_display != NONE:
                                cast.append(computer_display)
                        else:
                            if kind != "listen_music" and selected_display != NONE:
                                cast.append(selected_display)
                            if selected_amplifier != NONE:
                                cast.append(selected_amplifier)
                            if source in source_keys:
                                cast.append(source)
                        # Keep the user's startup order for retained devices.
                        old_cast = previous.get("devices", [])
                        cast = [item for item in old_cast if item in cast] + [
                            item for item in cast if item not in old_cast]
                        candidate, dependent = _activity_for_cast(previous, devices, cast, kind)
                        if dependent and user_input.get("confirm_remove") is not True:
                            errors["base"] = "confirm_source_steps"
                        else:
                            self._activity_key = key
                            self._activity_name = label
                            self._activity_cast = cast
                            self._activity_type = kind
                            self._activity_favorite = user_input.get(
                                "favorite", previous.get("favorite", False))
                            self._activity_previous = candidate
                            # Retained input steps do not by themselves prove
                            # the route of a newly selected physical player.
                            self._activity_route_recheck = bool(previous and
                                (set(old_cast) != set(cast) or
                                 previous.get("activity_type", kind) != kind))
                            self._activity_confirmed_routes = set()
                            if kind == "work_on_pc" and application != NONE:
                                self._activity_previous["computer_application"] = application
                            else:
                                self._activity_previous.pop("computer_application", None)
                            self._steps = deepcopy(self._activity_previous.get("steps", []))
                            self._route_cursor = 0
                            return await self.async_step_route()
        label = previous.get("name", "Watch TV")
        previous_cast = previous.get("devices", [])
        previous_source = next((key for key in previous_cast
                                if key in source_keys or key in computer_keys), NONE)
        default_kind = previous.get("activity_type")
        if not editing and self._guided_activity_type in ACTIVITIES:
            default_kind = self._guided_activity_type
        if default_kind not in choices:
            default_kind = ("listen_music" if previous_cast and not any(k in display_keys for k in previous_cast)
                            else "watch_source" if previous_source != NONE else "watch_tv")
        # The guided flow already captured intent; never ask twice or allow
        # a stale browser to silently change its original selection.
        schema = {vol.Required("activity_name", default=label): str,
                  vol.Optional("favorite", default=previous.get("favorite", False)): bool}
        if editing or self._guided_activity_type not in ACTIVITIES:
            schema[vol.Required("activity_type", default=default_kind)] = vol.In(choices)
        if editing:
            schema[vol.Optional("confirm_remove", default=False)] = bool
        if len(display_keys) > 1:
            schema[vol.Optional("display_device", default=display)] = vol.In({NONE: "No display", **display_keys})
        if len(amplifier_keys) > 1:
            schema[vol.Optional("amplifier_device", default=amplifier)] = vol.In(
                {NONE: "No receiver", **{k: v["entity"] for k, v in amplifier_keys.items()}})
        if source_keys or computer_keys:
            schema[vol.Required("primary_source", default=previous_source)] = vol.In(
                {NONE: "None / built-in TV", **source_keys, **computer_keys})
        if computer_keys and display_keys:
            prior_display = next((key for key in previous_cast if key in display_keys), NONE)
            schema[vol.Optional("computer_display", default=prior_display)] = vol.In(
                {NONE: "No display", **display_keys})
        if app_choices:
            schema[vol.Optional("computer_application", default=previous.get("computer_application", NONE))] = vol.In(
                {NONE: "Default computer readiness", **app_choices})
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
                try:
                    changes = _route_changes(options, existing, user_input)
                except ValueError:
                    return self.async_show_form(step_id="route", errors={"base": "route_changed"},
                                                data_schema=vol.Schema(self._route_fields(options, existing)),
                                                description_placeholders={"device": entity})
                for field, chosen in changes:
                    self._steps = _change_route(self._steps, key, field, chosen)
                    if field == "source" and hasattr(self, "_activity_confirmed_routes"):
                        if chosen == REMOVE_ROUTE:
                            self._activity_confirmed_routes.discard(key)
                        else:
                            self._activity_confirmed_routes.add(key)
                self._route_cursor += 1
                user_input = None
                continue
            return self.async_show_form(step_id="route", data_schema=vol.Schema(self._route_fields(options, existing)),
                                        description_placeholders={"device": entity})
        # An HDMI-only source OR a separately selected video/game player needs
        # a real destination input. Native source readback alone does not prove
        # it is routed to this room. This is a configuration guard only:
        # no command is issued and existing activity IDs are preserved.
        routed_external = self._activity_type in ACTIVITY_PLAYER_TYPES and any(
            devices[key].get("foundation_concept") == "source"
            and devices[key]["entity"].startswith("media_player.")
            for key in self._activity_cast
        )
        if self._activity_type == "work_on_pc":
            for key in self._activity_cast:
                if devices[key].get("foundation_concept") != "display":
                    continue
                if (not any(step["type"] == "source" and step["device"] == key for step in self._steps)
                        or (getattr(self, "_activity_route_recheck", False)
                            and key not in self._activity_confirmed_routes)):
                    self._route_cursor = self._activity_cast.index(key)
                    options = source_lists(self.hass, devices[key]["entity"])
                    return self.async_show_form(step_id="route", errors={"base": "source_route_required"},
                        data_schema=vol.Schema(self._route_fields(options, [])),
                        description_placeholders={"device": devices[key]["entity"]})
        destinations = media_roles(devices, "display").keys() | media_roles(devices, "amplifier").keys()
        if (self._activity_type == "watch_hdmi" or routed_external) and (
                not any(step["type"] == "source" and step["device"] in destinations
                        for step in self._steps)
                or (getattr(self, "_activity_route_recheck", False)
                    and not destinations & self._activity_confirmed_routes)):
            route_idx = next((idx for idx, key in enumerate(self._activity_cast)
                              if key in destinations
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
    def _route_fields(options, existing=(), prefix=""):
        schema = {}
        for field, values in (("source", options["source_list"]), ("sound_mode", options["sound_mode_list"])):
            prior = [step for step in existing if step["type"] == field]
            if values or prior:
                choices = {UNCHANGED: ("Keep configured route" if prior else "No change / already routed"),
                           **{v: v for v in values}}
                if prior:
                    choices[REMOVE_ROUTE] = ("Remove final configured route" if len(prior) > 1
                                             else "Remove configured route")
                schema[vol.Required(prefix + field, default=UNCHANGED)] = vol.In(choices)
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
                for role, endpoint in sorted(device.get("computer_io", {}).items()):
                    lines.append(f"    Computer {role}: {endpoint['entity']} (explicit native binding)")
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
        model = split_device_model(self._rooms, getattr(self, "_draft_catalog", None))
        if hasattr(self, "_original_dell_displays"):
            for key in self._original_dell_displays.keys() - self._dell_displays.keys():
                if self._dell_bound_assets(key, model):
                    raise ValueError(f"Dell {key}: remove the owning Device before deleting the native registration")
        original_catalog = (self._original_catalog if hasattr(self, "_original_catalog")
                            else split_device_model(self._original_rooms)[DEVICE_CATALOG])
        paths, changed_memberships = {}, set()
        for room_id, room in model["rooms"].items():
            for key, membership in room["devices"].items():
                asset = membership[ASSET_REF]
                path = f"rooms.{room_id}.devices.{key}"
                paths.setdefault(asset, path)
                prior = self._original_rooms.get(room_id, {}).get("devices", {}).get(key)
                if (prior is None or logical_asset_id(prior) != asset
                        or prior.get("role") != membership.get("role")):
                    # A new association or role still needs current native
                    # source evidence, even when the Device itself is unchanged.
                    changed_memberships.add(asset)
                    paths[asset] = path
        # Review each owning Device exactly once. Room labels and placement
        # are relationship metadata, not changes to native source authority.
        # Activity and active-reservation validation remain room-scoped below.
        rows = []
        for asset, saved in model[DEVICE_CATALOG].items():
            prior = original_catalog.get(asset) if asset not in changed_memberships else None
            rows.append((paths.get(asset, f"devices.{asset}"),
                         {k: v for k, v in saved.items() if k != DEVICE_LABEL},
                         {k: v for k, v in prior.items() if k != DEVICE_LABEL}
                         if prior is not None else None))
        current, _ = av_sources(self.hass)
        supported, _ = discovered_av_sources(self.hass)
        def binding_key(device):
            return (device.get("foundation_concept"), device.get("entity"),
                    device.get("foundation_candidate_id"))

        # One transient exact lookup, not a new authorization authority.
        command_sources = {}
        for source in current:
            command_sources.setdefault((source.concept, source.entity_id, source.candidate_id), source)
        problems = []
        # Reviewed semantic configuration is explicit control intent in the
        # single native Multimedia Options Flow. Verify exact current
        # Foundation/native identity BEFORE accepting this one Save. Discovery
        # alone never activates a device or weakens the runtime command guard.
        for path, device, prior_device in rows:
            if device.get("control_approved") is not True:
                continue
            # Keep a previously saved, unchanged stale source as an
            # explicitly NON-executable HOLD. Its own runtime authorization
            # remains fail-closed; it must not prevent unrelated room or
            # single-device edits from reaching the same atomic Save.
            approved_source = authorized_source(self.hass, device)
            if approved_source is None:
                if prior_device == device:
                    continue
                problems.append(f"{path}: reviewed native control binding is no longer valid; select the matching Foundation device")
                continue
            match = next((source for source in supported
                          if source.concept == device.get("foundation_concept")
                          and source.entity_id == device.get("entity")
                          and source.candidate_id == device.get("foundation_candidate_id")
                          and source.review_reason is None), None)
            if match is None:
                if prior_device == device:
                    continue
                problems.append(f"{path}: reviewed native control is not in supported discovery; review the current native candidate")
                continue
            key = (match.concept, match.entity_id, match.candidate_id)
            command_sources.setdefault(key, match)
        # Ambiguous technical identity is visible for repair but cannot be
        # saved as a new semantic binding until Foundation resolves it.
        discovered = {(s.concept, s.entity_id, s.candidate_id) for s in supported
                      if s.review_reason != "ambiguous_candidate_identity"}
        for path, device, prior_device in rows:
            if binding_key(device) not in discovered and prior_device != device:
                problems.append(f"{path}: {device.get('entity')} not in Foundation-supported discovery; select the exact current candidate")
                continue
            if device.get("windows_native") and device != prior_device:
                observed = native_state(self.hass, device["entity"])
                address = ((observed.attributes.get("ip") or observed.attributes.get("ip_address")) if observed else None)
                if (device.get("control_approved") is not True or authorized_source(self.hass, device) is None
                        or address != device["windows_native"]["host"]):
                    problems.append(f"{path}.windows_native: review the exact network computer and its native IPv4 address")
            if device.get("computer_agent") and device != prior_device:
                from .foundation import computer_agent_source
                if computer_agent_source(self.hass, device) is None:
                    problems.append(f"{path}.computer_agent: select a current exact HASS.Agent media endpoint")
            if device.get("computer_io") and device != prior_device:
                from .foundation import computer_io_source
                for intent in device["computer_io"]:
                    if computer_io_source(self.hass, device, intent) is None:
                        problems.append(f"{path}.computer_io.{intent}: select an exact current HASS.Agent native endpoint")
            tts_id = device.get("speech_tts_registry_id")
            if tts_id and tts_id != (prior_device or {}).get("speech_tts_registry_id"):
                approved_speech = command_sources.get(binding_key(device))
                if (not speech_player_eligible(
                        self.hass, device, approved_speech) or tts_id not in tts_choices(self.hass)):
                    problems.append(f"{path}.speech_tts_registry_id: speech requires an exact selected Cast source and native TTS provider")
            # The visual whole-home editor and scoped/global YAML share
            # the exact native MAC + approved source gate. A read-only
            # discovered device is never authorized for Wake-on-LAN.
            wol = device.get("power_on", {})
            prior_wol = (prior_device or {}).get("power_on")
            if (isinstance(wol, dict)
                    and wol.get("action") == "wake_on_lan.send_magic_packet"
                    and (wol != prior_wol or (device.get("wol_enabled", True)
                         and (prior_device or {}).get("wol_enabled") is False))):
                approved_wol = command_sources.get(binding_key(device))
                if (device.get("control_approved") is False or approved_wol is None
                        or approved_wol.provider == "harmony"
                        or not device["entity"].startswith(("media_player.", "remote.", "device_tracker."))
                        or str(wol.get("data", {}).get("mac", "")).lower()
                        not in selected_native_macs(self.hass, approved_wol)):
                    problems.append(f"{path}.power_on: Wake-on-LAN MAC must belong to the authorized native device; choose a verified native MAC")
        for room_id, room in self._rooms.items():
            previous = self._original_rooms.get(room_id, {})
            for activity_id, activity in room["activities"].items():
                prior = previous.get("activities", {}).get(activity_id, {})
                if activity == prior:
                    continue
                for key in activity["devices"]:
                    device = room["devices"][key]
                    if (device.get("control_approved") is False or
                            binding_key(device) not in command_sources):
                        problems.append(f"rooms.{room_id}.activities.{activity_id}.devices.{key}: changed activity includes revoked source or pending command approval")
                    if (activity.get("computer_application") and device.get("foundation_concept") == "network"
                            and not device.get("windows_native")):
                        from .foundation import computer_io_source
                        app = activity["computer_application"]
                        if any(computer_io_source(self.hass, device, prefix + app) is None
                               for prefix in ("launch_", "process_")):
                            problems.append(f"rooms.{room_id}.activities.{activity_id}: review exact application launch/process sources")
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
                            source = command_sources.get(binding_key(device))
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
                candidate = command_sources.get(("source", entity, device.get("foundation_candidate_id")))
                if candidate is not None and candidate.provider != "harmony":
                    candidate = None
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
        # One reviewed semantic model for every input surface. Keep accepted
        # Device policy in the same draft even when the next edit removes its
        # last room relationship. Never advance the owner on rejected review.
        self._reviewed_model = model
        if hasattr(self, "_draft_catalog"):
            self._draft_catalog = deepcopy(model[DEVICE_CATALOG])
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
                    dict(self._entry.options) != self._original_entry_options
                    or dict(self._entry.data) != self._original_entry_data):
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
                      device.get("power_on"), device.get("power_off"),
                      device.get("computer_agent"), device.get("computer_io"), device.get("windows_native"))
                for key, device in room.get("devices", {}).items()
            })
        removals = [f"room {key}" for key in sorted(previous.keys() - proposed.keys())]
        for key in sorted(previous.keys() & proposed.keys()):
            for group, scope in (("devices", "device"), ("activities", "activity")):
                removals.extend(f"{scope} {key}/{item}" for item in sorted(
                    previous[key].get(group, {}).keys() - proposed[key].get(group, {}).keys()))
        sensitive = bool(removals or getattr(self, "_yaml_deleted_rooms", None)
                         or set(previous) != set(proposed)
                         or any(authority(previous[key]) != authority(proposed[key])
                                for key in set(previous) & set(proposed))
                         or any(getattr(self, "_dell_displays", {}).get(key) != value
                                for key, value in getattr(self, "_original_dell_displays", {}).items()))
        native_preview = self._review_summary()
        if hasattr(self, "_draft_catalog"):
            old_catalog = self._original_catalog
            # An invalid draft must stay editable with its review error.
            try:
                new_catalog = self._device_model()[DEVICE_CATALOG]
            except (ValueError, TypeError, KeyError, AttributeError):
                new_catalog = self._draft_catalog
            changes = [f"Device {key}: " + ("added" if key not in old_catalog else
                       "removed" if key not in new_catalog else "updated")
                       for key in sorted(old_catalog.keys() | new_catalog.keys())
                       if old_catalog.get(key) != new_catalog.get(key)]
            if changes:
                native_preview = "\n".join(changes) + "\n" + native_preview
            # A detached Device has no room authority tuple. Its native
            # approval or provider/power changes still require explicit review.
            authority_fields = ("entity", "foundation_candidate_id", "foundation_concept",
                                "control_approved", "power_on", "power_off",
                                "computer_agent", "computer_io", "windows_native")
            sensitive = sensitive or bool(old_catalog.keys() - new_catalog.keys()) or any(
                any(old_catalog.get(key, {}).get(field) != device.get(field)
                    for field in authority_fields)
                for key, device in new_catalog.items()
                if key in old_catalog or device.get("control_approved") is True)
        change_summary = _yaml_change_summary(previous, proposed)
        if hasattr(self, "_original_dell_displays"):
            old_dell, new_dell = self._original_dell_displays, self._dell_displays
            for label, keys in (
                    ("Dell display labels changed", sorted(k for k in old_dell.keys() & new_dell.keys()
                                                          if old_dell[k] != new_dell[k])),
                    ("Dell displays added", sorted(new_dell.keys() - old_dell.keys())),
                    ("Dell displays removed", sorted(old_dell.keys() - new_dell.keys()))):
                if keys:
                    change_summary += "\n" + label + ": " + ", ".join(keys)
            if self._yaml_enable_ux is not None and self._yaml_enable_ux != self._original_enable_ux:
                change_summary += f"\nPremium UX enabled: {self._yaml_enable_ux}"
            if self._yaml_step_delay_ms is not None and self._yaml_step_delay_ms != self._original_step_delay_ms:
                change_summary += f"\nDefault inter-step delay: {self._yaml_step_delay_ms} ms"
        # Render the same destructive targets used by the confirmation decision.
        if removals:
            change_summary += "\nExplicit removals: " + ", ".join(removals)
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
    VERSION = CONFIG_VERSION

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
                data={CONF_TITLE: "Multimedia"},
                options=split_device_model({}),
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
        return self.async_create_entry(title=self._name, data={CONF_TITLE: self._name},
                                       options=self._reviewed_model)

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
                         "room_area", "wol_enabled", "control_approved", "computer_agent", "computer_io", "windows_native",
                         "foundation_entity_registry_id", "foundation_config_entry_id",
                         "foundation_device_registry_id", "foundation_provider"}),
    "activity": frozenset({"name", "activity_type", "devices", "steps",
                           "stop_steps", "cec_links", "favorite",
                           "button_map", "macros", "room_area", "computer_application"}),
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
    payload = _yaml_document(document)
    if set(payload) == {"changes"}:
        targets = [(change["room"], change["id"]) for change in payload["changes"]
                   if change["scope"] == "device" and "set" in change]
        result = reconcile_scoped_device_edits(existing, result, targets)
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


# One action registry: label, owning context, handler, available in visual draft.
OPTION_TASKS = {
    "device_add": ("Devices · add a native device", "global", "device_add", True),
    "device_settings": ("Devices · edit settings", "device", "device_select", True),
    "device_edit": ("Devices · Expert YAML", "device", "device_select", True),
    "device_remove": ("Devices · remove an unassigned device", "device", "device_select", True),
    "device_assign": ("Devices · assign to a room", "device", "device_select", True),
    "device_unassign": ("Devices · unassign from a room", "device", "device_select", True),
    "add_room": ("Rooms · add a location and select devices", "global", "room", False),
    "edit_room": ("Rooms · edit a location's devices", "room", "display", False),
    "rename_room": ("Rooms · edit name or Home Assistant area", "room", "room_settings", False),
    "remove_room": ("Rooms · remove a location", "room", "review", False),
    "guided_activity": ("Activities · create TV, movie, music or presentation", "global", "guided_activity", False),
    "add_activity": ("Activities · add a custom activity", "room", "activity", False),
    "edit_activity": ("Activities · edit a full activity", "activity", "activity", False),
    "activity_devices": ("Activities · choose devices and startup order", "activity", "activity_devices", True),
    "quick_edit_activity": ("Activities · quick edit name and real HDMI input", "activity", "quick_edit_activity", False),
    "remove_activity": ("Activities · remove an activity", "activity", "review", False),
    "harmony_owner": ("Advanced · Harmony / Premium command ownership", "room", "harmony_owner", True),
    "tv_wake": ("Advanced · Device Wake-on-LAN", "room", "tv_wake", True),
    "speech_endpoint": ("Notifications · Native speech for idle speakers", "room", "speech_endpoint", True),
    "cec_device": ("Advanced · HDMI-CEC device settings", "room", "cec_device", True),
    "cec_activity": ("Advanced · HDMI-CEC activity relationship", "activity", "cec_activity", True),
    "dell_add": ("Devices · add a Dell C8621QT LAN display", "global", "dell_display", True),
    "dell_edit": ("Devices · edit Dell display", "dell", "existing_dell", True),
    "dell_remove": ("Devices · remove unassigned Dell display", "dell", "existing_dell", True),
    "frontend": ("Dashboard · enable or disable card", "global", "frontend", False),
    "expert_yaml": ("Advanced · edit one exact object via Expert YAML", "global", "expert_target", False),
    "script_defaults": ("Activities · standard wait between commands", "global", "script_defaults", False),
    "script_step": ("Activities · edit the ordered script steps", "activity", "script_step", True),
    "button_mapping": ("Activities · assign button to selected device", "activity", "button_mapping", True),
    "macro_manage": ("Activities · manage named one-touch shortcuts", "activity", "macro_manage", True),
    "review": ("Review and save existing pending configuration", "global", "review", False),
}
OPTION_SPECIALISTS = tuple(key for key, task in OPTION_TASKS.items() if task[3])
OPTION_DEVICE_ACTIONS = tuple(key for key, task in OPTION_TASKS.items()
                              if task[1] in ("device", "dell") or key in ("device_add", "dell_add"))


class MultimediaOptionsFlow(_Wizard, config_entries.OptionsFlow):
    def __init__(self, config_entry):
        self._entry = config_entry
        self._original_entry_options = deepcopy(dict(config_entry.options))
        self._original_entry_data = deepcopy(dict(config_entry.data))
        model = configuration_model(configuration_source(config_entry))
        self._original_catalog = model[DEVICE_CATALOG]
        self._draft_catalog = deepcopy(self._original_catalog)
        self._begin(rooms=expand_device_model(model, validate=False),
                    name=config_entry.data.get(CONF_TITLE, "Multimedia"))
        self._dell_displays = deepcopy(config_entry.options.get("dell_displays",
                                                               config_entry.data.get("dell_displays", {})))
        self._original_dell_displays = deepcopy(self._dell_displays)
        self._original_enable_ux = config_entry.options.get("enable_ux", True)
        self._yaml_enable_ux = None
        self._original_step_delay_ms = validate_step_delay(config_entry.options.get("default_step_delay_ms", DEFAULT_STEP_DELAY_MS))
        self._yaml_step_delay_ms = None
        self._dell_key = None

    async def async_step_init(self, user_input=None):
        methods = {
            "devices": "Devices — add, configure or assign",
            "assisted": "Rooms, activities and advanced settings",
            "complete_setup": "Complete home setup",
            "yaml": "Expert YAML — import or edit configuration",
        }
        if user_input:
            action = user_input.get("action")
            if action not in methods and action not in OPTION_TASKS:
                return self.async_show_form(step_id="init", errors={"base": "selection_changed"},
                    data_schema=vol.Schema({vol.Required("action"): vol.In(methods)}))
            if action == "complete_setup":
                return await self.async_step_complete_setup()
            if action == "devices":
                return await self.async_step_devices()
            if action == "assisted":
                return await self.async_step_assisted()
            if action == "yaml":
                self._global_yaml = True
                return await self.async_step_yaml()
            return await self._open_task(action)
        # One supported visual setup route, plus Expert YAML. Keep the old
        # direct action IDs/Assisted handlers for backward compatibility but
        # stop advertising obsolete wizard alternatives to new admins.
        # Device-first native entry and Expert YAML; contextual clients still
        # use the existing Assisted gateway, backed by the same task registry.
        return self.async_show_form(step_id="init", data_schema=vol.Schema({
            vol.Required("action"): vol.In(methods)}))

    def _capture_state(self, device, path, definition=None, key=None):
        """Current authorized native observations only; no commands or new discovery."""
        if authorized_source(self.hass, device) is None or device.get("control_approved") is False:
            raise ValueError(f"{path}: Review the exact native device binding before capture")
        state = native_state(self.hass, device["entity"])
        if state is None or state.state not in device.get("on_states", READY_STATES):
            raise ValueError(f"{path}: Bring this device to the desired operating state before capture")
        if device.get("foundation_concept") == "network":
            if device.get("role") != "computer" or state.state != "home":
                raise ValueError(f"{path}: Capture needs current computer connectivity")
            effective = activity_computer_device(device, definition or {}, key)
            if effective.get("windows_native") or effective.get("computer_agent") or any(role in (effective.get("computer_io") or {}) for role in ("session", "process")):
                adapter = self.hass.data.get(DOMAIN, {}).get("adapter")
                if adapter is None or not adapter.computer_ready(effective):
                    raise ValueError(f"{path}: Confirm current configured computer readiness before capture")
        elif not device["entity"].startswith("media_player."):
            raise ValueError(f"{path}: Capture needs native media-player readback, not blind remote keys")
        return state

    @staticmethod
    def _capture_document(text):
        """Accept the canonical draft or the existing legacy capture document."""
        doc = _yaml_document(text)
        fields = {"rooms", "dell_displays", "enable_ux", "default_step_delay_ms"}
        if set(doc) not in (fields, fields | {DEVICE_CATALOG}):
            raise ValueError("Capture requires the complete editable configuration")
        if DEVICE_CATALOG in doc:
            return {**doc, "rooms": expand_device_model(doc)}
        return doc

    def _capture_candidates(self, text):
        """Read-only proposal from the same draft and native eligibility as capture."""
        try:
            rooms = self._capture_document(text)["rooms"]
            candidates = {}
            for room_id, room in rooms.items():
                rows = []
                for key, device in room.get("devices", {}).items():
                    try:
                        self._capture_state(device, key)
                    except (ValueError, KeyError, TypeError, AttributeError):
                        continue
                    rows.append(key)
                candidates[room_id] = rows
            return candidates
        except (ValueError, KeyError, TypeError, AttributeError, RecursionError):
            return {}

    def _capture_activity(self, text, request):
        """Build an unsaved activity from exact live native observations.

        No physical services, no separate configuration writer. The regular
        Review/Save still validates all binding, route and ownership changes.
        """
        from homeassistant.components.media_player import MediaPlayerEntityFeature as Feature

        if getattr(self, "_yaml_focus", None) is not None:
            raise ValueError("Open the full Activities editor to capture current settings")
        doc = self._capture_document(text)
        required = {"room", "activity", "name", "activity_type", "devices", "include_volume"}
        if (not isinstance(request, dict) or not required <= set(request)
                or set(request) - required - {"include_mute"}):
            raise ValueError("Choose a room, activity and devices to capture")
        room_id, activity_id = request["room"], request["activity"]
        cast = request["devices"]
        name, kind = request["name"], request["activity_type"]
        if (not isinstance(room_id, str) or room_id not in doc["rooms"]
                or not isinstance(activity_id, str) or not isinstance(name, str)
                or not 0 < len(name.strip()) <= 80 or kind not in ACTIVITY_TYPES
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
            state = self._capture_state(device, path, prior, device_key)
            identity = device.get("physical_id", device["entity"])
            if identity in physical:
                raise ValueError(f"{path}: Select the physical endpoint only once")
            physical.add(identity)
            if device.get("foundation_concept") == "network":
                if kind != "work_on_pc":
                    raise ValueError(f"{path}: Choose a computer activity to capture this device")
                continue
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
        if kind == "work_on_pc":
            computers = [item for item in full_cast if devices[item].get("foundation_concept") == "network"]
            if len(computers) != 1:
                raise ValueError("Choose exactly one configured computer")
            for item in cast:
                if devices[item].get("foundation_concept") == "display" and not any(
                        step["device"] == item and step["type"] == "source" for step in steps):
                    raise ValueError("Capture a verified computer display input")
        if kind in ACTIVITY_VIDEO_TYPES and "display" not in concepts:
            raise ValueError("Video activities need a configured display")
        if kind in ACTIVITY_PLAYER_TYPES and "source" not in concepts:
            raise ValueError("Choose a configured native source for this activity")
        if prior is None and kind in ACTIVITY_VIDEO_TYPES and not any(step["type"] == "source" for step in steps):
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
        if DEVICE_CATALOG in doc:
            doc.update(split_device_model(doc["rooms"], doc[DEVICE_CATALOG]))
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
                    if (isinstance(request, dict) and set(request) == {"refresh"}
                            and request["refresh"] is True):
                        if getattr(self, "_yaml_focus", None) is not None:
                            raise ValueError("Open the full Activities editor to capture current settings")
                        self._capture_document(proposed)
                        return await self._complete_setup_form(text=proposed)
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
                return await self._open_specialist_section(
                    specialist, room_id, activity_id, user_input.get("specialist_device", ""))
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

    async def _open_task(self, action, room_id=None, activity_id=None, asset_id=None):
        """Resolve the same task and context for native and embedded editors."""
        _, scope, step, _ = OPTION_TASKS[action]
        self._option_action = action
        if action == "dell_add":
            self._dell_key = None
        if scope in ("room", "activity"):
            if room_id is None:
                return await self.async_step_existing_room()
            self._room_id = room_id
            if scope == "activity":
                return await self.async_step_existing_activity(
                    {"activity": activity_id} if activity_id is not None else None)
            return await self.async_step_existing_room({"room": room_id})
        if scope == "device" and asset_id:
            return await self.async_step_device_select({"device": asset_id})
        return await getattr(self, f"async_step_{step}")()

    async def _open_specialist_section(self, action, room_id, activity_id, asset_id=""):
        """Reuse the native specialist steps inside this existing Options Flow."""
        task = OPTION_TASKS.get(action)
        scope = task[1] if task else None
        room = self._rooms.get(room_id)
        if (action not in OPTION_SPECIALISTS
                or (scope in ("room", "activity") and room is None)
                or (scope == "activity" and activity_id not in room["activities"])
                or (scope == "dell" and not self._dell_displays)
                or (scope == "device" and asset_id and asset_id not in self._device_model()[DEVICE_CATALOG])):
            return await self._complete_setup_form(errors={"base": "selection_changed"},
                validation_detail="Choose an existing room, activity or display for this setting.")
        self._specialist_section = True
        self._activity_tuning = False
        self._script_phase = "steps"
        return await self._open_task(action, room_id, activity_id, asset_id)

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
            # A rendered legacy draft can include the deterministic projection
            # of the selected Device's policy into its other room relations.
            # No unrelated fields or local membership edits are permitted.
            if scope == "device":
                expected["rooms"] = reconcile_scoped_device_edits(
                    self._original_rooms, expected["rooms"], [(room_id, object_id)])
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
            if focus is None and DEVICE_CATALOG in payload:
                # A structurally renderable but semantically rejected
                # canonical import remains the user's exact unsaved draft.
                if set(payload) - {"rooms", DEVICE_CATALOG, "dell_displays", "enable_ux", "default_step_delay_ms"}:
                    return ""
                if mode == "merge":
                    base = self._device_model()
                    payload = {**payload, DEVICE_CATALOG: {**base[DEVICE_CATALOG], **payload[DEVICE_CATALOG]},
                               "rooms": {**base["rooms"], **payload["rooms"]}}
                elif mode != "replace":
                    return ""
                rooms = expand_device_model(payload, validate=False)
            elif set(payload) == {"changes"}:
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
            if DEVICE_CATALOG not in payload:
                try:
                    self._resolve_yaml_bindings(rooms)
                except ValueError:
                    pass  # Keep all unresolved slots; the original diagnostic remains.
            doc = {**({DEVICE_CATALOG: payload[DEVICE_CATALOG], "rooms": payload["rooms"]}
                       if DEVICE_CATALOG in payload else {"rooms": rooms}),
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
        try:
            configured_devices = self._device_model()[DEVICE_CATALOG]
        except (ValueError, TypeError, KeyError, AttributeError):
            configured_devices = self._draft_catalog
        catalog = logical_av_catalog(self.hass, self._rooms, discovered=discovery,
                                     configured_devices=configured_devices)
        logical_devices, _ = catalog
        proposals = proposed_room_setup(self.hass, self._rooms, discovered=discovery,
                                        catalog=catalog, configured_devices=configured_devices)
        asset_by_candidate = {
            (row["concept"], row["candidate_id"], row["entity_id"]): asset["asset_id"]
            for asset in logical_devices for row in asset["candidates"]
        }
        from .foundation import discovered_sources
        from .source_discovery import network_address_choices
        native_sources, _ = discovered_sources(self.hass)
        from homeassistant.helpers import entity_registry as er
        registry = er.async_get(self.hass)
        computer_io = []
        for src in native_sources:
            if src.concept != "computer_io" or src.review_reason:
                continue
            record = registry.async_get(src.entity_id)
            if record is None or not record.id or not record.config_entry_id or not src.device_registry_id:
                continue
            computer_io.append({"entity": src.entity_id, "label": getattr(record, "name", None) or getattr(record, "original_name", None) or src.entity_id,
                                "candidate": src.candidate_id, "entity_registry_id": record.id,
                                "config_entry_id": record.config_entry_id, "native_device_id": src.device_registry_id})
        # Native MAC evidence is read-only and can be shown before command
        # consent; it authorizes no WoL packet without reviewed Save.
        approved_macs = {
            (source.concept, source.candidate_id, source.entity_id):
                sorted(selected_native_macs(self.hass, source))
            for source in native_sources
        }
        # Reuse the same owner-aware candidate projection; do not recompute
        # approval by traversing the original room copies.
        approved_keys = {
            (candidate["concept"], candidate["entity_id"], candidate["candidate_id"]): candidate["approved"]
            for asset in logical_devices for candidate in asset["candidates"]
        }
        sources = []
        for src in discovered:
            if src.concept not in ("display", "amplifier", "source", "network"):
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
                "approved": approved_keys.get((src.concept, src.entity_id, src.candidate_id), src.approved),
                "verified_macs": approved_macs.get(
                    (src.concept, src.candidate_id, src.entity_id), []),
                "network_ipv4_choices": network_address_choices(self.hass, src),
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
                **(self._device_model() if getattr(self, "_yaml_focus", None) is None
                   else {"rooms": self._rooms}),
                "dell_displays": self._dell_displays,
                "enable_ux": (self._yaml_enable_ux if self._yaml_enable_ux is not None
                              else self._original_enable_ux),
                "default_step_delay_ms": (self._yaml_step_delay_ms
                                          if self._yaml_step_delay_ms is not None
                                          else self._original_step_delay_ms),
            }, ensure_ascii=False, indent=2)
        try:
            canonical_transport = DEVICE_CATALOG in _yaml_document(text)
        except (ValueError, TypeError, AttributeError, KeyError):
            canonical_transport = False
        return self.async_show_form(
            step_id="complete_setup",
            errors=errors or {},
            data_schema=vol.Schema({
                vol.Required("yaml_text", default=text):
                    selector.TextSelector(selector.TextSelectorConfig(multiline=True)),
                vol.Optional("visual_edit", default=False): bool,
                **({vol.Optional("capture_request", default=""): str,
                    vol.Optional("specialist_action", default=""): vol.In(("", *OPTION_SPECIALISTS)),
                    vol.Optional("specialist_room", default=""): str,
                    vol.Optional("specialist_activity", default=""): str,
                    vol.Optional("specialist_device", default=""): str}
                   if getattr(self, "_yaml_focus", None) is None else {}),
            }),
            description_placeholders={
                "areas_json": json.dumps(areas, ensure_ascii=False),
                "floors_json": json.dumps(floors, ensure_ascii=False),
                "area_floors_json": json.dumps(area_floors, ensure_ascii=False),
                "sources_json": json.dumps(sources, ensure_ascii=False),
                "capture_candidates_json": json.dumps(self._capture_candidates(text)),
                "computer_io_json": json.dumps(computer_io, ensure_ascii=False),
                "logical_devices_json": json.dumps(logical_devices, ensure_ascii=False),
                # Only legacy expanded transport needs a retained catalog
                # hint. Canonical documents already contain the single owner.
                **({} if canonical_transport else {
                    "device_catalog_json": json.dumps(configured_devices, ensure_ascii=False)}),
                "device_contract_json": json.dumps({
                    "actions": [key for key in OPTION_DEVICE_ACTIONS if key.startswith("device_")],
                    "membership_fields": sorted(MEMBERSHIP_FIELDS),
                    "activity_types": sorted(ACTIVITY_TYPES),
                    "step_types": sorted(ALLOWED_STEPS),
                    "power_modes": sorted(POWER_MODES),
                    "roles": sorted(DEVICE_ROLES),
                    "max_step_delay_ms": MAX_STEP_DELAY_MS,
                    "pc_keys": list(PC_KEYS),
                }),
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

    async def async_step_devices(self, user_input=None):
        """Short native HA Device menu, derived from the same action registry."""
        errors = {}
        if user_input is not None:
            task = user_input.get("task")
            if task in OPTION_DEVICE_ACTIONS:
                return await self.async_step_init({"action": task})
            errors["base"] = "selection_changed"
        return self.async_show_form(step_id="devices", errors=errors, data_schema=vol.Schema({
            vol.Required("task"): vol.In({key: OPTION_TASKS[key][0] for key in OPTION_DEVICE_ACTIONS})}))

    async def async_step_assisted(self, user_input=None):
        """Compatibility and advanced native routes from the same action registry."""
        if user_input is not None:
            task = user_input.get("task")
            if task in OPTION_TASKS:
                # Exactly the same internal routes as the pre-existing
                # Options Flow and the card's direct admin actions.
                return await self.async_step_init({"action": task})
        return self.async_show_form(step_id="assisted", data_schema=vol.Schema({
            vol.Required("task"): vol.In({key: task[0] for key, task in OPTION_TASKS.items()})}))

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

    def _review_visual_rebind(self, asset, prior, proposed):
        """Exact repair of a previously saved Device, never a generic rebind."""
        # Freeze the historical asset and reservation when an entity-only
        # legacy link gets repaired. A new physical identity is not inferred.
        if (("asset_id" in prior and proposed.get("asset_id") != prior["asset_id"])
                or ("physical_id" in prior and proposed.get("physical_id") != prior["physical_id"])
                or (proposed.get("physical_id") or proposed["entity"]) !=
                   (prior.get("physical_id") or prior["entity"])
                or proposed.get("foundation_concept") != prior.get("foundation_concept")):
            raise ValueError("Native repair cannot change Device or reservation identity")
        if proposed.get("entity") != prior["entity"] and not prior["entity"].startswith("REPLACE_WITH_"):
            if proposed.get("control_approved") is not False:
                raise ValueError("Review command approval separately after replacing a native entity")
            if prior.get("foundation_concept") == "network" and any(
                    proposed.get(key) for key in ("computer_agent", "computer_io", "windows_native")):
                raise ValueError("Review computer provider bindings after replacing its native entity")
        # Exact current native evidence is required even for read-only repair.
        if reviewed_native_source(self.hass, {**proposed, "control_approved": True}) is None:
            raise ValueError("Select one exact current Foundation candidate and native registry identity")

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
                # Native canonical YAML owns exactly the same Device and
                # Room objects as Options Flow; legacy expanded input remains
                # a compatibility boundary, never an independent writer.
                catalog_candidate = None
                if local_visual:
                    proposed = self._expert_scope_rooms(payload)
                    if focus[0] == "device":
                        proposed = reconcile_scoped_device_edits(
                            self._original_rooms, proposed, [(focus[1], focus[2])])
                    _validate_home(proposed, self._resolve_yaml_bindings)
                    self._expert_scope_rooms({**payload, "rooms": proposed})
                    explicit_removals = []
                    dell = deepcopy(self._original_dell_displays)
                    ux_option = self._original_enable_ux
                    step_delay_ms = self._original_step_delay_ms
                elif focus is None and payload and set(payload) <= {
                        "rooms", DEVICE_CATALOG, "dell_displays", "enable_ux", "default_step_delay_ms"}:
                    room_document = yaml.safe_dump({"rooms": payload["rooms"]}) if "rooms" in payload and DEVICE_CATALOG not in payload else None
                    if DEVICE_CATALOG in payload:
                        if "rooms" not in payload:
                            raise ValueError("Canonical import requires device_catalog and rooms")
                        incoming = payload[DEVICE_CATALOG]
                        if not isinstance(incoming, dict):
                            raise ValueError("Canonical device_catalog must be a mapping")
                        allowed = (YAML_SCOPED_FIELDS["device"] - MEMBERSHIP_FIELDS) | {DEVICE_LABEL}
                        for asset, device in incoming.items():
                            prior = self._original_catalog.get(asset, {})
                            if (not isinstance(device, dict)
                                    or set(device) - (allowed | set(prior))):
                                raise ValueError(f"devices.{asset}: unknown device configuration field")
                        visual = getattr(self, "_complete_setup", False)
                        # A native specialist may already have explicitly removed or
                        # added an object in this same draft. Do not resurrect it.
                        base_model = (self._device_model() if visual else
                                      split_device_model(self._original_rooms, self._original_catalog))
                        candidate = merge_device_model(base_model,
                            {DEVICE_CATALOG: incoming, "rooms": payload["rooms"]}, mode,
                            review_rebind=self._review_visual_rebind if visual else None)
                        proposed = expand_device_model(candidate)
                        catalog_candidate = candidate[DEVICE_CATALOG]
                        explicit_removals = []
                    elif (getattr(self, "_complete_setup", False) and mode == "replace"
                          and payload.get("rooms") == {} and room_document is not None):
                        # The visual workspace also configures standalone devices.
                        # Existing room removals still require explicit confirmation.
                        proposed, explicit_removals = {}, []
                    elif room_document is not None:
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
                    visual = getattr(self, "_complete_setup", False)
                    ux_option = payload.get("enable_ux",
                        self._yaml_enable_ux if visual and self._yaml_enable_ux is not None else self._original_enable_ux)
                    if type(ux_option) is not bool:
                        raise ValueError("Invalid frontend preference")
                    step_delay_ms = validate_step_delay(
                        payload.get("default_step_delay_ms",
                            self._yaml_step_delay_ms if visual and self._yaml_step_delay_ms is not None
                            else self._original_step_delay_ms))
                else:
                    proposed, explicit_removals = _yaml_plan(
                        document, self._original_rooms, mode,
                        resolve_bindings=self._resolve_yaml_bindings)
                    dell = deepcopy(self._original_dell_displays)
                    ux_option = self._original_enable_ux
                    step_delay_ms = self._original_step_delay_ms
                previous, previous_dell, previous_ux, previous_delay, previous_catalog = (
                    self._rooms, self._dell_displays, self._yaml_enable_ux,
                    self._yaml_step_delay_ms, self._draft_catalog)
                if catalog_candidate is not None:
                    self._draft_catalog = deepcopy(catalog_candidate)
                self._rooms = deepcopy(proposed)
                self._dell_displays = deepcopy(dell)
                self._yaml_enable_ux = ux_option
                self._yaml_step_delay_ms = step_delay_ms
                try:
                    reason = self._review_configuration()
                except (ValueError, KeyError, TypeError, RecursionError, AttributeError) as exc:
                    self._rooms, self._dell_displays, self._yaml_enable_ux, self._yaml_step_delay_ms, self._draft_catalog = (
                        previous, previous_dell, previous_ux, previous_delay, previous_catalog)
                    errors["base"] = "selection_changed"
                    rejection_detail = _validation_detail(exc)
                else:
                    if reason:
                        self._rooms, self._dell_displays, self._yaml_enable_ux, self._yaml_step_delay_ms, self._draft_catalog = (
                            previous, previous_dell, previous_ux, previous_delay, previous_catalog)
                        errors["base"] = reason
                        rejection_detail = self._review_detail or ("The proposed settings failed native " + str(reason))
                    else:
                        self._yaml_import = True
                        self._yaml_draft_text = document
                        self._yaml_draft_mode = mode
                        self._yaml_deleted_rooms = sorted(
                            set(self._original_rooms) - set(proposed)) + explicit_removals
                        self._yaml_deleted_rooms.extend("display " + key for key in
                                                       self._original_dell_displays.keys() - dell.keys())
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
                **self._device_model(),
                "dell_displays": self._original_dell_displays,
                "enable_ux": self._original_enable_ux,
                "default_step_delay_ms": self._original_step_delay_ms,
            }, sort_keys=False, allow_unicode=True, default_flow_style=False)
            if (errors or draft_text is not None) and isinstance(attempted_text, str) and len(attempted_text.encode("utf-8")) <= MAX_CONFIG_YAML_BYTES:
                current = attempted_text
            mode_default = attempted_mode if attempted_mode in ("merge", "replace") else "merge"
            schema = vol.Schema({
                vol.Required("mode", default=mode_default): vol.In({
                    "merge": "Merge devices and rooms, or apply scoped changes (preserve others)",
                    "replace": "Replace room relationships (preserve devices; destructive)"}),
                vol.Required("yaml_text", default=current):
                    selector.TextSelector(selector.TextSelectorConfig(multiline=True)),
                **({vol.Optional("visual_edit", default=False): bool}
                   if getattr(self, "_global_yaml", False) else {})})
            note = ("Live HA Options Flow: device_catalog and rooms are the canonical export, including "
                    "unassigned devices. Legacy expanded rooms and scoped changes remain supported. "
                    "Review before Save; Foundation alone selects physical sources. "
                    "No configuration.yaml/.storage writes.")
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

    def _device_model(self):
        return split_device_model(self._rooms, self._draft_catalog)

    def _stage_model(self, model):
        self._rooms = expand_device_model(model)
        self._draft_catalog = model[DEVICE_CATALOG]

    def _stage_device(self, asset, replacement):
        self._stage_model(change_device(self._device_model(), asset, replacement))

    def _update_device(self, asset, update):
        model = self._device_model()
        replacement = deepcopy(model[DEVICE_CATALOG][asset])
        update(replacement)
        self._stage_model(change_device(model, asset, replacement))

    async def async_step_device_add(self, user_input=None):
        """Select one exact existing native endpoint, independent of rooms."""
        if user_input and user_input.get("return_to_setup") is True and getattr(self, "_specialist_section", False):
            return await self.async_step_review()
        model = self._device_model()
        saved_entities = {d["entity"] for d in model[DEVICE_CATALOG].values()}
        saved_entities.update(d["computer_agent"]["entity"] for d in model[DEVICE_CATALOG].values()
                              if d.get("computer_agent"))
        sources, _ = discovered_av_sources(self.hass)
        existing_groups = {native_asset_key(source) for source in sources
                           if source.entity_id in saved_entities}
        primary_groups = {native_asset_key(source) for source in sources
                          if source.entity_id.startswith("media_player.") and not source.review_reason}
        choices = {}
        for source in sources:
            if (source.review_reason or source.entity_id in saved_entities
                    or native_asset_key(source) in existing_groups
                    or source.concept not in ("display", "amplifier", "source", "network")
                    or (source.entity_id.startswith("remote.") and native_asset_key(source) in primary_groups)):
                continue
            token = json.dumps([source.concept, source.candidate_id, source.entity_id])
            choices[token] = source
        errors = {}
        detail = ""
        if user_input is not None:
            source = choices.get(user_input.get("source"))
            label = str(user_input.get("name", "")).strip()
            approval = user_input.get("control_approved", False)
            try:
                if source is None or not label or len(label) > 80 or type(approval) is not bool:
                    raise ValueError("Select one exact native source and a device name")
                # Use the same logical discovery identity for native AV devices;
                # network trackers are only included on explicit selection.
                asset = native_asset_key(source)
                if asset in model[DEVICE_CATALOG]:
                    raise ValueError("This logical device is already configured")
                device = {"entity": source.entity_id, "asset_id": asset, "physical_id": asset,
                          DEVICE_LABEL: label, "foundation_concept": source.concept,
                          "foundation_candidate_id": source.candidate_id,
                          "foundation_entity_registry_id": source.entity_registry_id,
                          "foundation_config_entry_id": source.config_entry_id,
                          "foundation_device_registry_id": source.device_registry_id,
                          "foundation_provider": source.provider, "control_approved": approval}
                if source.concept == "network":
                    device["on_states"] = ["home"]
                elif source.entity_id.startswith("remote."):
                    device["power_mode"] = "passive"
                self._stage_device(asset, device)
            except (ValueError, TypeError, KeyError) as exc:
                errors["base"] = "selection_changed"
                detail = _validation_detail(exc)
            else:
                return await self.async_step_review()
        return self._specialist_form(step_id="device_add", errors=errors,
            fields={vol.Required("name", default=""): str,
                vol.Required("source"): vol.In({token: f"{s.label or s.entity_id} · {s.concept} · {s.entity_id}"
                                                for token, s in choices.items()}),
                vol.Optional("control_approved", default=False): bool},
            description_placeholders={"validation_detail": detail})

    async def async_step_device_select(self, user_input=None):
        model = self._device_model()
        catalog = model[DEVICE_CATALOG]
        choices = {}
        for key, row in catalog.items():
            linked = [room.get("name", room_id) for room_id, room in model["rooms"].items()
                      if any(link[ASSET_REF] == key for link in room["devices"].values())]
            choices[key] = f"{row.get(DEVICE_LABEL, row['entity'])} · {', '.join(linked) or 'No room'}"
        if user_input and user_input.get("return_to_setup") is True and getattr(self, "_specialist_section", False):
            return await self.async_step_review()
        if user_input is not None and user_input.get("device") in choices:
            self._device_key = user_input["device"]
            return await getattr(self, "async_step_" + self._option_action)()
        return self._specialist_form(step_id="device_select", fields={
            vol.Required("device"): vol.In(choices)},
            errors={"base": "selection_changed"} if user_input is not None else {})

    async def async_step_device_settings(self, user_input=None):
        """Ordinary typed settings on the owning record; preserve expert fields."""
        if user_input and user_input.get("return_to_setup") is True and getattr(self, "_specialist_section", False):
            return await self.async_step_review()
        prior = self._device_model()[DEVICE_CATALOG][self._device_key]
        is_network = prior.get("foundation_concept") == "network"
        media = prior["entity"].startswith("media_player.")
        default_approval = (prior["control_approved"] if "control_approved" in prior
                            else authorized_source(self.hass, prior) is not None)
        errors, detail = {}, ""
        fields = {
            vol.Required("name", default=prior.get(DEVICE_LABEL, prior["entity"])): str,
            vol.Required("control_approved", default=default_approval): bool,
            vol.Required("power_mode", default=prior.get("power_mode", DEFAULT_POWER_MODE)):
                vol.In({mode: mode.title() for mode in sorted(POWER_MODES)}),
            vol.Required("post_power_on_delay_ms", default=prior.get("post_power_on_delay_ms", DEFAULT_STEP_DELAY_MS)):
                selector.NumberSelector(selector.NumberSelectorConfig(
                    min=0, max=MAX_STEP_DELAY_MS, step=1, mode=selector.NumberSelectorMode.BOX)),
        }
        if media and not is_network:
            fields[vol.Required("hdmi_cec_enabled", default=prior.get(
                "hdmi_cec_enabled", DEFAULT_HDMI_CEC_ENABLED))] = bool
        # One native evidence source, no guessed MACs or addresses. Keep the
        # existing WoL data when disabling; no packet is sent during Save.
        candidates, _ = discovered_av_sources(self.hass)
        matches = [src for src in candidates if src.entity_id == prior["entity"]
                   and src.concept == prior.get("foundation_concept")
                   and src.candidate_id == prior.get("foundation_candidate_id")
                   and not src.review_reason and src.provider != "harmony"]
        macs = sorted(selected_native_macs(self.hass, matches[0])) if len(matches) == 1 else []
        wol = wol_data(prior)
        if macs or wol is not None:
            current_mac = (wol or {}).get("mac", "")
            fields.update({
                vol.Optional("wol_enabled", default=bool(wol) and prior.get("wol_enabled", True)): bool,
                vol.Optional("wol_mac", default=current_mac): vol.In({"": "No MAC", **{mac: mac for mac in macs},
                    **({current_mac: current_mac + " (review required)"} if current_mac and current_mac not in macs else {})}),
                vol.Optional("wol_destination", default=(wol or {}).get("broadcast_address", "")): str,
                vol.Optional("wol_port", default=(wol or {}).get("broadcast_port", DEFAULT_WOL_PORT)): int,
                **({vol.Optional("wol_clear", default=False): bool} if wol is not None else {}),
            })
        if user_input is not None:
            try:
                name = str(user_input.get("name", "")).strip()
                approved = user_input.get("control_approved")
                mode = user_input.get("power_mode")
                delay = validate_step_delay(user_input.get("post_power_on_delay_ms"))
                if not name or len(name) > 80 or type(approved) is not bool or mode not in POWER_MODES:
                    raise ValueError("Choose a name and valid device policy")
                device = {**prior, DEVICE_LABEL: name}
                # Preserve field absence on no-op, including implicit
                # Foundation-selected authority on historic records.
                for key, value, default in (
                        ("control_approved", approved, default_approval),
                        ("power_mode", mode, DEFAULT_POWER_MODE),
                        ("post_power_on_delay_ms", delay, DEFAULT_STEP_DELAY_MS)):
                    if key in prior or value != default:
                        device[key] = value
                if media and not is_network:
                    enabled = user_input.get("hdmi_cec_enabled")
                    if type(enabled) is not bool:
                        raise ValueError("Select a valid CEC setting")
                    if "hdmi_cec_enabled" in prior or enabled != DEFAULT_HDMI_CEC_ENABLED:
                        device["hdmi_cec_enabled"] = enabled
                clear = user_input.get("wol_clear", False)
                if type(clear) is not bool or (clear and wol is None):
                    raise ValueError("Choose an existing Wake-on-LAN override to clear")
                if clear:
                    set_wol_policy(device, clear=True)
                elif macs or wol is not None:
                    enabled = user_input.get("wol_enabled", bool(wol) and prior.get("wol_enabled", True))
                    mac = user_input.get("wol_mac", (wol or {}).get("mac", ""))
                    destination = user_input.get("wol_destination", (wol or {}).get("broadcast_address", "")).strip()
                    port = user_input.get("wol_port", (wol or {}).get("broadcast_port", DEFAULT_WOL_PORT))
                    if type(enabled) is not bool:
                        raise ValueError("Choose a valid Wake-on-LAN setting")
                    if enabled or mac:
                        data = {"mac": mac, "broadcast_port": port}
                        if destination:
                            data["broadcast_address"] = destination
                        # A selector's default port does not change an old
                        # override that implicitly used the default port.
                        if wol is not None and data == {**wol, "broadcast_port": wol.get("broadcast_port", DEFAULT_WOL_PORT)}:
                            data = wol
                        changed = data != wol
                        was_enabled = prior.get("wol_enabled", bool(wol))
                        if changed or enabled != was_enabled:
                            set_wol_policy(device, data=data, enabled=enabled, verified_macs=macs)
                    elif wol is not None:
                        set_wol_policy(device, enabled=False)
                self._stage_device(self._device_key, device)
            except (ValueError, TypeError, KeyError, AttributeError) as exc:
                errors["base"] = "selection_changed"
                detail = _validation_detail(exc)
            else:
                return await self.async_step_review()
        return self._specialist_form(step_id="device_settings", errors=errors,
            fields=fields, description_placeholders={"validation_detail": detail})

    async def async_step_device_edit(self, user_input=None):
        """Edit one canonical record, never a room membership or native identity."""
        if user_input and user_input.get("return_to_setup") is True and getattr(self, "_specialist_section", False):
            return await self.async_step_review()
        prior = self._device_model()[DEVICE_CATALOG][self._device_key]
        errors, detail = {}, ""
        text = json.dumps(prior, ensure_ascii=False, indent=2)
        if user_input is not None:
            text = user_input.get("yaml_text", "")
            try:
                device = _yaml_document(text)
                allowed = (YAML_SCOPED_FIELDS["device"] - MEMBERSHIP_FIELDS) | {DEVICE_LABEL}
                if set(device) - (allowed | set(prior)):
                    raise ValueError("Unknown device configuration field")
                self._stage_device(self._device_key, device)
            except (ValueError, TypeError, KeyError, AttributeError) as exc:
                errors["base"] = "selection_changed"
                detail = _validation_detail(exc)
            else:
                return await self.async_step_review()
        return self._specialist_form(step_id="device_edit", errors=errors,
            fields={vol.Required("yaml_text", default=text):
                selector.TextSelector(selector.TextSelectorConfig(multiline=True))},
            description_placeholders={"validation_detail": detail})

    async def async_step_device_assign(self, user_input=None):
        if user_input and user_input.get("return_to_setup") is True and getattr(self, "_specialist_section", False):
            return await self.async_step_review()
        model = self._device_model()
        device = model[DEVICE_CATALOG][self._device_key]
        rooms = model["rooms"]
        available = {key: row.get("name", key) for key, row in rooms.items()
                     if all(link[ASSET_REF] != self._device_key for link in row["devices"].values())}
        areas = area_choices(self.hass)
        errors, detail = {}, ""
        if user_input is not None:
            try:
                room_id = user_input.get("room")
                if room_id == CUSTOM_AREA:
                    area = user_input.get("area", NONE)
                    name = str(user_input.get("room_name", "")).strip() or areas.get(area, "")
                    room_id = _slug(name)
                    if not name or len(name) > 80 or room_id in rooms or area not in (NONE, *areas):
                        raise ValueError("Choose a unique room name and optional native area")
                    rooms[room_id] = {"name": name, "area_id": area if area in areas else None,
                                      "devices": {}, "activities": {}}
                elif room_id not in available:
                    raise ValueError("Choose a room to which the device is not yet assigned")
                role = ("remote" if device["entity"].startswith("remote.") else
                        {"display": "display", "amplifier": "receiver", "source": "player",
                         "network": "computer"}.get(device.get("foundation_concept")))
                if role is None:
                    raise ValueError("Review the exact device concept before assignment")
                label = device.get(DEVICE_LABEL) or device["entity"]
                key = _slug(label)
                if key in rooms[room_id]["devices"]:
                    key = _slug(self._device_key)
                if key in rooms[room_id]["devices"]:
                    raise ValueError("Room membership identity conflicts; choose another device name")
                self._stage_model(change_membership(model, room_id, key,
                    {ASSET_REF: self._device_key, "role": role, "name": label}))
            except (ValueError, TypeError, KeyError) as exc:
                errors["base"] = "selection_changed"
                detail = _validation_detail(exc)
            else:
                return await self.async_step_review()
        return self._specialist_form(step_id="device_assign", errors=errors,
            fields={
                vol.Required("room"): vol.In({**available, CUSTOM_AREA: "Create a room"}),
                vol.Optional("room_name", default=""): str,
                vol.Optional("area", default=NONE): vol.In({NONE: "No native area", **areas}),
            }, description_placeholders={"validation_detail": detail})

    async def async_step_device_unassign(self, user_input=None):
        if user_input and user_input.get("return_to_setup") is True and getattr(self, "_specialist_section", False):
            return await self.async_step_review()
        model = self._device_model()
        choices = {json.dumps([room_id, key]): f"{room.get('name', room_id)} · {link.get('name', key)}"
                   for room_id, room in model["rooms"].items()
                   for key, link in room["devices"].items() if link[ASSET_REF] == self._device_key}
        errors, detail = {}, ""
        if user_input is not None:
            try:
                token = user_input.get("membership")
                if token not in choices or user_input.get("confirm_remove") is not True:
                    raise ValueError("Select and confirm an existing room relationship")
                room_id, key = json.loads(token)
                self._stage_model(change_membership(model, room_id, key, None))
            except (ValueError, TypeError, KeyError) as exc:
                errors["base"] = "selection_changed"
                detail = _validation_detail(exc)
            else:
                return await self.async_step_review()
        return self._specialist_form(step_id="device_unassign", errors=errors,
            fields={vol.Required("membership"): vol.In(choices),
                vol.Required("confirm_remove", default=False): bool},
            description_placeholders={"validation_detail": detail})

    async def async_step_device_remove(self, user_input=None):
        if user_input and user_input.get("return_to_setup") is True and getattr(self, "_specialist_section", False):
            return await self.async_step_review()
        errors, detail = {}, ""
        if user_input is not None:
            try:
                if user_input.get("confirm_remove") is not True:
                    raise ValueError("Confirm removal of the unassigned device")
                self._stage_device(self._device_key, None)
            except (ValueError, KeyError) as exc:
                errors["base"] = "selection_changed"
                detail = _validation_detail(exc)
            else:
                return await self.async_step_review()
        return self._specialist_form(step_id="device_remove", errors=errors,
            fields={vol.Required("confirm_remove", default=False): bool},
            description_placeholders={"validation_detail": detail})

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

    def _dell_bound_assets(self, key, model):
        """Exact current native registration identity, including renamed links."""
        from homeassistant.helpers import entity_registry as er
        registry = er.async_get(self.hass)
        entity = registry.async_get_entity_id(
            "media_player", DOMAIN, f"{self._entry.entry_id}:dell:{key}")
        get_record = getattr(registry, "async_get", None)
        record = get_record(entity) if entity and callable(get_record) else None
        registry_id = getattr(record, "id", None)
        device_id = getattr(record, "device_id", None)
        return {asset for asset, device in model[DEVICE_CATALOG].items()
                if ((entity and device["entity"] == entity)
                    or (registry_id and device.get("foundation_entity_registry_id") == registry_id)
                    or (device_id and device.get("foundation_device_registry_id") == device_id)
                    or (not entity and device.get("foundation_provider") == DOMAIN))}

    async def async_step_dell_remove(self, user_input=None):
        """Never remove a selected native display before its room is unbound."""
        if getattr(self, "_specialist_section", False) and user_input and user_input.get("return_to_setup") is True:
            return await self.async_step_review()
        key = self._dell_key
        model = self._device_model()
        bound = self._dell_bound_assets(key, model)
        if any(link[ASSET_REF] in bound for room in model["rooms"].values()
               for link in room["devices"].values()):
            return self._specialist_form(step_id="dell_remove",
                errors={"base": "stop_room_before_edit"}, fields={})
        if bound:
            return self._specialist_form(step_id="dell_remove",
                errors={"base": "selection_changed"}, fields={})
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
            if self._room_id not in choices:
                return self.async_show_form(step_id="existing_room", errors={"base": "selection_changed"},
                    data_schema=vol.Schema({vol.Required("room"): vol.In(choices)}))
            _, scope, step, _ = OPTION_TASKS[self._option_action]
            if scope == "activity":
                return await self.async_step_existing_activity()
            if self._option_action == "remove_room":
                self._rooms.pop(self._room_id)
            elif self._option_action == "edit_room":
                self._editing_room = True
                self._previous_room = deepcopy(self._rooms[self._room_id])
                previous_devices = self._previous_room["devices"]
                if any(len(media_roles(previous_devices, concept)) > 1
                       for concept in ("display", "amplifier")):
                    # The old single-display wizard cannot safely replace
                    # multi-display rooms. Retain the draft in the full editor.
                    return await self.async_step_complete_setup()
                self._rooms[self._room_id]["devices"] = {
                    key: deepcopy(device) for key, device in previous_devices.items()
                    if device_concept(device) not in ("display", "amplifier", "source")}
            return await getattr(self, f"async_step_{step}")()
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
            if not device["entity"].startswith(("media_player.", "remote.", "device_tracker.")):
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
            if macs or wol_data(device) is not None:
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
        prior = wol_data(device) or {}
        macs = macs_by_key[chosen]
        if user_input is not None and not errors:
            mode = user_input.get("mode")
            if mode == "keep":
                return await self.async_step_review()
            if mode in ("clear", "directed"):
                try:
                    def change(target):
                        if mode == "clear":
                            set_wol_policy(target, clear=True)
                        else:
                            data = {
                                "mac": str(user_input.get("mac", "")).strip().replace("-", ":").lower(),
                                "broadcast_port": user_input.get("broadcast_port", DEFAULT_WOL_PORT),
                            }
                            ip = str(user_input.get("broadcast_address") or "").strip()
                            if ip:
                                data["broadcast_address"] = ip
                            if data["mac"] not in macs:
                                raise ValueError("MAC is not registered on the selected native device")
                            set_wol_policy(target, data=data, verified_macs=macs)
                    self._update_device(logical_asset_id(device), change)
                except (ValueError, TypeError):
                    errors["base"] = "wake_invalid_target"
                else:
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
                vol.Optional("broadcast_port", default=prior.get("broadcast_port", DEFAULT_WOL_PORT)): int,
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
                def change(linked):
                    if target == NONE:
                        linked.pop("speech_tts_registry_id", None)
                    else:
                        linked["speech_tts_registry_id"] = target
                try:
                    self._update_device(logical_asset_id(device), change)
                except ValueError:
                    errors["base"] = "speech_invalid"
                else:
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
                        room["devices"][key].get("post_power_on_delay_ms", DEFAULT_STEP_DELAY_MS)))
                except ValueError:
                    errors["base"] = "cec_invalid"
                else:
                    try:
                        self._update_device(logical_asset_id(room["devices"][key]),
                            lambda dev: dev.update(hdmi_cec_enabled=enabled,
                                                   post_power_on_delay_ms=settle_ms))
                    except ValueError:
                        errors["base"] = "cec_in_use"
                    else:
                        return await self.async_step_review()
        chosen = (user_input or {}).get("device", next(iter(choices)))
        return self._specialist_form(step_id="cec_device", errors=errors,
            fields={
                vol.Required("device", default=chosen if chosen in choices else next(iter(choices))): vol.In(choices),
                vol.Required("enabled", default=room["devices"][chosen].get("hdmi_cec_enabled", DEFAULT_HDMI_CEC_ENABLED)
                             if chosen in choices else False): bool,
                vol.Required("post_power_on_delay_ms",
                             default=room["devices"][chosen].get("post_power_on_delay_ms", DEFAULT_STEP_DELAY_MS)
                             if chosen in choices else 0):
                    selector.NumberSelector(selector.NumberSelectorConfig(
                        min=0, max=MAX_STEP_DELAY_MS, step=1, mode=selector.NumberSelectorMode.BOX)),
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
            if key not in choices:
                return self.async_show_form(step_id="existing_activity", errors={"base": "selection_changed"},
                    data_schema=vol.Schema({vol.Required("activity"): vol.In(choices)}))
            _, scope, step, _ = OPTION_TASKS[self._option_action]
            if scope != "activity":
                raise ValueError("Activity context does not match the requested task")
            if self._option_action == "remove_activity":
                self._rooms[self._room_id]["activities"].pop(key)
            else:
                self._editing_activity = key
            return await getattr(self, f"async_step_{step}")()
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
        choices = {key: f"{dev.get('name', key)} · {dev['entity']}"
                   for key, dev in devices.items()
                   if authorized_source(self.hass, dev) is not None}
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
                cast_error = activity_cast_error(kind, devices, chosen)
                if cast_error:
                    errors["base"] = cast_error
                else:
                    ordered = [key for key in current if key in chosen]
                    ordered.extend(key for key in devices if key in chosen and key not in current)
                    candidate, dependent = _activity_for_cast(activity, devices, ordered, kind)
                    if dependent and user_input.get("confirm_remove") is not True:
                        errors["base"] = "confirm_source_steps"
                    else:
                        self._pending_activity = candidate
                        self._pending_cast = ordered
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
            if device not in cast or action not in ALLOWED_STEPS:
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
                    min=0, max=MAX_STEP_DELAY_MS, step=1, mode=selector.NumberSelectorMode.BOX)))
        elif kind == "wait_until":
            states = sorted(NATIVE_WAIT_STATES)
            initial = original.get("states", ["on"])[0]
            args[vol.Required("state", default=initial)] = vol.In({
                state: state for state in states})
            args[vol.Required("timeout", default=original.get("timeout", 15))] = (
                selector.NumberSelector(selector.NumberSelectorConfig(
                    min=1, max=MAX_TIMEOUT_SECONDS, step=1, mode=selector.NumberSelectorMode.BOX)))
        if kind not in ("delay", "wait_until"):
            args[vol.Required("delay_policy", default=default_policy)] = vol.In({
                "inherit": "Use standard delay", "override": "Override after this step"})
            args[vol.Required("delay_ms", default=original.get("delay_ms", self._original_step_delay_ms))] = (
                selector.NumberSelector(selector.NumberSelectorConfig(
                    min=0, max=MAX_STEP_DELAY_MS, step=1, mode=selector.NumberSelectorMode.BOX)))
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
                    if state not in NATIVE_WAIT_STATES or (
                            type(timeout) not in (int, float) or not 0 < timeout <= MAX_TIMEOUT_SECONDS):
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
        roles = {key: device["entity"] for key, device in media_roles(devices, "source").items()}
        current = [key for key in activity["devices"] if key in roles]
        if len(current) > 1 or any(device_concept(devices[key]) == "source" and key not in roles
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
            existing = [step for step in activity.get("steps", []) if step["device"] == key]
            fields.update(self._route_fields(options, existing, f"route_{key}_"))
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
                try:
                    for key in activity["devices"]:
                        options = source_lists(self.hass, devices[key]["entity"])
                        existing = [step for step in activity.get("steps", []) if step["device"] == key]
                        changes.extend((key, field, chosen) for field, chosen in
                                       _route_changes(options, existing, user_input, f"route_{key}_"))
                except ValueError:
                    errors["base"] = "route_changed"
                changing_source = new_source != current_source
                candidate = deepcopy(activity)
                if not errors and changing_source:
                    destination_keys = [key for key in activity["devices"]
                                        if device_concept(devices[key]) in ("display", "amplifier")
                                        and source_lists(self.hass, devices[key]["entity"])["source_list"]]
                    if destination_keys and not any(key in destination_keys and field == "source"
                                                    and chosen != REMOVE_ROUTE
                                                    for key, field, chosen in changes):
                        errors["base"] = "source_route_required"
                    cast = [key for key in activity["devices"] if key != current_source]
                    if new_source != NONE and new_source not in cast:
                        cast.append(new_source)
                    candidate, destructive = _activity_for_cast(
                        activity, devices, cast, activity.get("activity_type"))
                    if not errors and any(key not in cast for key, _, _ in changes):
                        errors["base"] = "route_changed"
                    if not errors and destructive and not user_input.get("confirm_source_steps"):
                        errors["base"] = "confirm_source_steps"
                if not errors:
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
                    for key, field, chosen in changes:
                        candidate["steps"] = _change_route(candidate.get("steps", []), key, field, chosen)
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
                        min=0, max=MAX_STEP_DELAY_MS, step=1, mode=selector.NumberSelectorMode.BOX))
            }))

    async def async_step_frontend(self, user_input=None):
        errors = {}
        if user_input is not None:
            if (set(user_input) != {"enable_ux"} or type(user_input["enable_ux"]) is not bool
                    or dict(self._entry.options) != self._original_entry_options
                    or dict(self._entry.data) != self._original_entry_data):
                errors["base"] = "selection_changed"
            else:
                # UX visibility is a presentation-only preference, not a
                # generic arbitrary Options writer. Retain the existing
                # runtime and all canonical configuration.
                return self.async_create_entry(title="", data={
                    **self._entry.options, "enable_ux": user_input["enable_ux"]})
        return self.async_show_form(step_id="frontend", errors=errors, data_schema=vol.Schema({
            vol.Required("enable_ux", default=self._entry.options.get("enable_ux", True)): bool}))

    async def _finish(self):
        options = configuration_options(self._original_entry_options, self._reviewed_model)
        options["dell_displays"] = self._dell_displays
        if self._yaml_enable_ux is not None:
            options["enable_ux"] = self._yaml_enable_ux
        if self._yaml_step_delay_ms is not None:
            options["default_step_delay_ms"] = self._yaml_step_delay_ms
        return self.async_create_entry(title="", data=options)
