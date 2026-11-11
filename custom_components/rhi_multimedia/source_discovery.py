"""Presentation-only projection of Foundation-selected technical sources.

No device/entity discovery is performed by Multimedia. Area names and source_list
readback are existing HA metadata of *already selected* physical sources.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .foundation import selected_sources


@dataclass(frozen=True)
class AVSource:
    entity_id: str
    candidate_id: str
    concept: str
    provider: str
    area_id: str | None
    device_registry_id: str | None
    available: bool


def area_choices(hass: Any) -> dict[str, str]:
    from homeassistant.helpers import area_registry as ar

    areas = ar.async_get(hass)
    return {a.id: a.name for a in sorted(areas.async_list_areas(), key=lambda a: a.name.casefold())}


def av_sources(hass: Any) -> tuple[list[AVSource], str]:
    from homeassistant.helpers import entity_registry as er
    from homeassistant.helpers import device_registry as dr

    selected, origin = selected_sources(hass)
    entity_registry = er.async_get(hass)
    device_registry = dr.async_get(hass)
    items = []
    for s in selected:
        entry = entity_registry.async_get(s.entity_id)
        if entry is None or entry.disabled_by or not entry.config_entry_id:
            continue
        device = device_registry.async_get(entry.device_id) if entry.device_id else None
        area_id = entry.area_id or (device.area_id if device else None)
        items.append(AVSource(s.entity_id, s.candidate_id, s.concept,
                              s.integration, area_id, s.device_registry_id, s.available))
    return sorted(items, key=lambda x: (x.concept, x.entity_id)), origin


def source_lists(hass: Any, entity_id: str) -> dict[str, list[str]]:
    state = hass.states.get(entity_id)
    attrs = getattr(state, "attributes", {}) if state else {}
    return {key: [v for v in attrs.get(key, []) if isinstance(v, str) and v]
            for key in ("source_list", "sound_mode_list")}
