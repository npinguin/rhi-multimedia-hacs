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
from .validation import validate_rooms

NONE = "__none__"
CUSTOM_AREA = "__custom_room__"
UNCHANGED = "__no_source_change__"
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
    return {x.entity_id: f"{x.entity_id} ({x.provider})"
            + (" · in this room" if area_id and x.area_id == area_id else "")
            + (" · currently unavailable" if not x.available else "")
            for x in entries}


def _source_ref(flow, entity_id: str, concept: str) -> dict:
    matches, _ = av_sources(flow.hass)
    candidate = next((x for x in matches if x.entity_id == entity_id and x.concept == concept), None)
    if candidate is None:
        raise ValueError(f"{entity_id}: no longer selected in Foundation/{concept}")
    return {"entity": entity_id, "physical_id": f"ha_entity:{entity_id}",
            "role": "receiver" if concept == "amplifier" else "player" if concept == "source" else "display",
            "foundation_concept": concept, "foundation_candidate_id": candidate.candidate_id,
            "power_mode": "passive" if entity_id.startswith("remote.") else "native"}


class _Wizard:
    def _begin(self, rooms=None, name="Multimedia"):
        self._rooms = deepcopy(rooms or {})
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
                    key = "source_" + _slug(entity)
                    devices[key] = _source_ref(self, entity, "source")
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
                           or new_devices[role]["entity"] != old_devices[role]["entity"]
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
            if not activities:
                return await self.async_step_activity()
            return await self.async_step_next()
        return self.async_show_form(step_id="validate_room_update",
            data_schema=vol.Schema({vol.Required("confirm_remove", default=False): bool}),
            description_placeholders={"affected": ", ".join(affected)})

    async def async_step_activity(self, user_input=None):
        room = self._rooms[self._room_id]
        devices = room["devices"]
        source_keys = {k: v["entity"] for k, v in devices.items() if k.startswith("source_")}
        editing = self._editing_activity
        previous = room["activities"].get(editing, {}) if editing else {}
        errors = {}
        if user_input is not None:
            kind = user_input.get("activity_type")
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
                    key = _slug(label)
                    if key in room["activities"] and key != editing:
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
                        self._steps = []
                        self._route_cursor = 0
                        return await self.async_step_route()
        label = previous.get("name", "Watch TV")
        schema = {
            vol.Required("activity_type", default="watch_tv"): vol.In(ACTIVITIES),
            vol.Required("activity_name", default=label): str,
        }
        if source_keys:
            schema[vol.Required("primary_source", default=NONE)] = vol.In(
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
            if not any(options.values()):
                self._route_cursor += 1
                continue
            if user_input is not None:
                for field, kind in (("source", "source"), ("sound_mode", "sound_mode")):
                    chosen = user_input.get(field, UNCHANGED)
                    offered = options["source_list" if field == "source" else "sound_mode_list"]
                    if chosen != UNCHANGED and chosen in offered:
                        self._steps.append({"type": kind, "device": key, "candidates": [chosen]})
                    elif chosen != UNCHANGED:
                        return self.async_show_form(step_id="route", errors={"base": "route_changed"},
                                                    data_schema=vol.Schema(self._route_fields(options)))
                self._route_cursor += 1
                user_input = None
                continue
            return self.async_show_form(step_id="route", data_schema=vol.Schema(self._route_fields(options)),
                                        description_placeholders={"device": entity})
        activities = self._rooms[self._room_id]["activities"]
        if self._editing_activity and self._editing_activity != self._activity_key:
            activities.pop(self._editing_activity, None)
        self._editing_activity = None
        activities[self._activity_key] = {"name": self._activity_name,
                                         "devices": list(self._activity_cast), "steps": list(self._steps)}
        return await self.async_step_next()

    @staticmethod
    def _route_fields(options):
        schema = {}
        for field, values in (("source", options["source_list"]), ("sound_mode", options["sound_mode_list"])):
            if values:
                schema[vol.Required(field, default=UNCHANGED)] = vol.In(
                    {UNCHANGED: "No change / already routed", **{v: v for v in values}})
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

    async def async_step_review(self, user_input=None):
        errors = {}
        if user_input:
            if not user_input.get("confirm"):
                errors["base"] = "confirm_save"
            else:
                try:
                    if self._rooms:
                        validate_rooms(self._rooms)
                    current, _ = av_sources(self.hass)
                    selected = {(s.concept, s.entity_id, s.candidate_id) for s in current}
                    for room in self._rooms.values():
                        for device in room["devices"].values():
                            assert ((device["foundation_concept"], device["entity"],
                                     device["foundation_candidate_id"]) in selected)
                except (ValueError, TypeError, AssertionError, KeyError):
                    errors["base"] = "selection_changed"
                else:
                    return await self._finish()
        return self.async_show_form(step_id="review", errors=errors,
                                    data_schema=vol.Schema({vol.Required("confirm", default=False): bool}),
                                    description_placeholders={"rooms": str(len(self._rooms)),
                                        "activities": str(sum(len(r["activities"]) for r in self._rooms.values()))})


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
                   "add_activity": "Add activity",
                   "edit_activity": "Edit activity", "remove_activity": "Remove activity",
                   "remove_room": "Remove room", "review": "Review and save"}
        if user_input:
            action = user_input["action"]
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

    async def async_step_existing_activity(self, user_input=None):
        choices = {key: row.get("name", key) for key, row in self._rooms[self._room_id]["activities"].items()}
        if not choices:
            return await self.async_step_activity()
        if user_input:
            key = user_input["activity"]
            if self._option_action == "remove_activity":
                if len(choices) == 1:
                    return self.async_show_form(step_id="existing_activity", errors={"base": "last_activity"},
                                                data_schema=vol.Schema({vol.Required("activity"): vol.In(choices)}))
                self._rooms[self._room_id]["activities"].pop(key)
                return await self.async_step_review()
            self._editing_activity = key
            return await self.async_step_activity()
        return self.async_show_form(step_id="existing_activity", data_schema=vol.Schema({
            vol.Required("activity"): vol.In(choices)}))

    async def _finish(self):
        return self.async_create_entry(title="", data={CONF_ROOMS: self._rooms})
