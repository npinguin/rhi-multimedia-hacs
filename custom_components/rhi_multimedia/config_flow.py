"""Transactional HA configuration and options for rooms, cast, sources and activities."""
from __future__ import annotations

import json

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.helpers import selector

from .const import CONF_ROOMS, CONF_TITLE, DOMAIN
from .validation import validate_rooms


# A single editable JSON document is intentional for this first candidate: every
# device/activity reference is validated as one atomic transaction, not a partial
# sequence of forms that can leave dangling references or fire commands.
def _field(default: str = ""):
    return selector.TextSelector(selector.TextSelectorConfig(multiline=True))


def _parse(raw: str) -> dict:
    try:
        rooms = json.loads(raw)
    except (ValueError, TypeError) as exc:
        raise ValueError("Configuration must be valid JSON") from exc
    return validate_rooms(rooms)


class MultimediaConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        errors = {}
        if user_input is not None:
            try:
                rooms = _parse(user_input[CONF_ROOMS])
                await self.async_set_unique_id("rhi_multimedia_household")
                self._abort_if_unique_id_configured()
            except ValueError:
                errors["base"] = "invalid_configuration"
            else:
                return self.async_create_entry(title=user_input[CONF_TITLE],
                                               data={CONF_TITLE: user_input[CONF_TITLE], CONF_ROOMS: rooms})
        schema = vol.Schema({
            vol.Required(CONF_TITLE, default="Multimedia"): str,
            vol.Required(CONF_ROOMS): _field(),
        })
        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)

    @staticmethod
    def async_get_options_flow(config_entry):
        return MultimediaOptionsFlow(config_entry)


class MultimediaOptionsFlow(config_entries.OptionsFlow):
    def __init__(self, config_entry):
        self._source_entry = config_entry

    async def async_step_init(self, user_input=None):
        errors = {}
        if user_input is not None:
            try:
                rooms = _parse(user_input[CONF_ROOMS])
            except ValueError:
                errors["base"] = "invalid_configuration"
            else:
                return self.async_create_entry(title="", data={CONF_ROOMS: rooms})
        current = self._source_entry.options.get(CONF_ROOMS,
                                                 self._source_entry.data.get(CONF_ROOMS, {}))
        return self.async_show_form(step_id="init", errors=errors,
                                    data_schema=vol.Schema({
                                        vol.Required(CONF_ROOMS, default=json.dumps(current, indent=2)):
                                            _field()
                                    }))
