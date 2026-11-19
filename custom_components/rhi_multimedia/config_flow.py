"""RHI Multimedia semantic wizard. Foundation alone selects integrations/devices.

Flow scope: room -> selected display -> optional audio -> selected media sources
-> logical activities -> exact physical routes -> atomic review/save.
No JSON entry, duplicate entity selection or guessed hardware connections.
"""
from __future__ import annotations

from copy import deepcopy
import re
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.helpers import selector

from .const import CONF_ROOMS, CONF_TITLE, DOMAIN
from .source_discovery import area_choices, av_sources, source_lists
from .validation import route_status, validate_rooms

NONE = "__none__"
CUSTOM_AREA = "__custom_room__"
UNCHANGED = "__no_source_change__"
REMOVE_ROUTE = "__remove_configured_route__"
DIRECT_ONLY = "__direct_only__"
ACTIVITIES = {
    "watch_tv": "Watch TV (screen + optional amplifier)",
    "watch_source": "Watch a media source (screen + optional amplifier + player)",
    "listen_music": "Listen music (audio + optional player; no screen needed)",
    "play_game": "Play a game (screen + optional amplifier + console)",
}
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
    choices = {x.entity_id: f"{x.entity_id} ({x.provider})"
               + (" · in this room" if area_id and x.area_id == area_id else "")
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
        device = deepcopy(renamed[0])
        old_entity = device["entity"]
        device["entity"] = entity_id
        for action in ("power_on", "power_off"):
            for container in ("data", "target"):
                payload = device.get(action, {}).get(container, {})
                if payload.get("entity_id") == old_entity:
                    payload["entity_id"] = entity_id
        return device
    # A shared source must retain its original reservation identity when a
    # second room is added, even if the first room used an older custom ID.
    existing = next((dev for room in flow._rooms.values() for dev in room["devices"].values()
                     if dev["entity"] == entity_id), None)
    physical = existing.get("physical_id", entity_id) if existing else f"ha_entity:{entity_id}"
    role = ("remote" if entity_id.startswith("remote.") else "receiver" if concept == "amplifier"
            else "player" if concept == "source" else "display")
    return {"entity": entity_id, "physical_id": physical,
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
        choices = dict(ACTIVITIES)
        if not editing:
            choices[DIRECT_ONLY] = "Direct device control only (no activity)"
        if user_input is not None:
            kind = user_input.get("activity_type")
            if kind == DIRECT_ONLY and not editing:
                return await self.async_step_next()
            source = user_input.get("primary_source", NONE)
            if kind not in ACTIVITIES:
                errors["base"] = "invalid_activity"
            elif kind in ("watch_tv", "watch_source", "play_game") and "screen" not in devices:
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
        if default_kind not in ACTIVITIES:
            default_kind = ("listen_music" if previous_cast and "screen" not in previous_cast
                            else "watch_source" if previous_source != NONE else "watch_tv")
        schema = {
            vol.Required("activity_type", default=default_kind): vol.In(choices),
            vol.Required("activity_name", default=label): str,
        }
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
                state = self.hass.states.get(device["entity"])
                lines.append(f"  {key}: {device['entity']} ({state.state if state else 'unavailable'})")
            for activity in room["activities"].values():
                lines.append(f"  {activity.get('name', 'Activity')}:")
                for step in activity.get("steps", []):
                    if step["type"] not in ("source", "sound_mode"):
                        continue
                    device = room["devices"][step["device"]]
                    state = self.hass.states.get(device["entity"])
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
            for activity_id, activity in room["activities"].items():
                if activity == previous.get("activities", {}).get(activity_id):
                    continue
                for key in activity["devices"]:
                    device = room["devices"][key]
                    if (device.get("foundation_concept"), device["entity"],
                            device.get("foundation_candidate_id")) not in selected:
                        raise ValueError("Changed activity includes a revoked source")
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
                state = self.hass.states.get(entity) if entity else None
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
        return self.async_show_form(step_id="review", errors=errors,
                                    data_schema=vol.Schema({vol.Required("confirm", default=False): bool}),
                                    description_placeholders={"rooms": str(len(self._rooms)),
                                        "activities": str(sum(len(r["activities"]) for r in self._rooms.values())),
                                        "summary": self._review_summary()})


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


class MultimediaOptionsFlow(_Wizard, config_entries.OptionsFlow):
    def __init__(self, config_entry):
        self._entry = config_entry
        self._begin(rooms=config_entry.options.get(CONF_ROOMS, config_entry.data.get(CONF_ROOMS, {})),
                    name=config_entry.data.get(CONF_TITLE, "Multimedia"))

    async def async_step_init(self, user_input=None):
        options = {"add_room": "Add room", "edit_room": "Edit room devices and connections",
                   "add_activity": "Add activity", "rename_room": "Rename room / change area",
                   "edit_activity": "Edit activity", "remove_activity": "Remove activity",
                   "remove_room": "Remove room", "review": "Review and save", "frontend": "Dashboard card",
                   "harmony_owner": "Harmony / Premium control ownership"}
        if user_input:
            action = user_input["action"]
            if action == "frontend":
                return await self.async_step_frontend()
            if action == "add_room":
                return await self.async_step_room()
            if action == "review":
                return await self.async_step_review()
            self._option_action = action
            return await self.async_step_existing_room()
        return self.async_show_form(step_id="init", data_schema=vol.Schema({
            vol.Required("action"): vol.In(options)}))

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

    async def async_step_existing_activity(self, user_input=None):
        choices = {key: row.get("name", key) for key, row in self._rooms[self._room_id]["activities"].items()}
        if not choices:
            return await self.async_step_review()
        if user_input:
            key = user_input["activity"]
            if self._option_action == "remove_activity":
                self._rooms[self._room_id]["activities"].pop(key)
                return await self.async_step_review()
            self._editing_activity = key
            return await self.async_step_activity()
        return self.async_show_form(step_id="existing_activity", data_schema=vol.Schema({
            vol.Required("activity"): vol.In(choices)}))

    async def async_step_frontend(self, user_input=None):
        if user_input is not None:
            return self.async_create_entry(title="", data={**self._entry.options, **user_input})
        return self.async_show_form(step_id="frontend", data_schema=vol.Schema({
            vol.Required("enable_ux", default=self._entry.options.get("enable_ux", True)): bool}))

    async def _finish(self):
        return self.async_create_entry(title="", data={**self._entry.options, CONF_ROOMS: self._rooms})
