"""Multimedia's Foundation publication and selected technical-source consumer.

Foundation alone owns domain/concept integration+device selection. This module
publishes bounded support specifications and reads the *selected* handoff; it
never runs a second HA entity scan or silently chooses integrations for users.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

DOMAIN_ID = "multimedia"
REGISTRY_KEY = "rhi_selected_domain_build_input_registry"
PROVIDER_DOMAIN = "rhi_multimedia"

# These are integration domains, not HA entity domains. They identify supported
# technical sources in Foundation; the selected candidate is still validated
# against its native HA entity before it can be used.
SUPPORTED = {
    "display": ("webostv", "samsungtv", "braviatv", "androidtv", "roku", "panasonic_viera"),
    "amplifier": ("denonavr", "heos", "onkyo", "yamaha", "sonos", "squeezebox", "music_assistant"),
    "source": ("apple_tv", "androidtv_remote", "androidtv", "cast", "kodi", "plex", "heos",
               "harmony", "xbox", "dlna_dmr", "sonos", "music_assistant", "roku", "webostv"),
}
NAMES = {
    "display": ("Screen / TV", "Choose connected displays and TVs; their physical routes are configured in Multimedia."),
    "amplifier": ("Amplifier / audio", "Choose receivers, audio zones or speaker players; this role is optional."),
    "source": ("Media sources", "Choose players, streamers, set-top boxes, consoles and media remotes."),
}


def _spec(concept: str) -> dict[str, Any]:
    integrations = SUPPORTED[concept]
    return {
        "kind": "domain_build_specification", "contract_version": "1.2.0",
        "publisher": PROVIDER_DOMAIN, "domain_id": DOMAIN_ID,
        "builder_id": f"multimedia.{concept}.native_media.v1", "builder_version": "1.0.0",
        "domain_presentation": {
            "display_name": "Multimedia",
            "description": "RHI Multimedia activity orchestration using Home Assistant AV sources.",
            "selection_guidance": "Select integrations/devices for each AV concept; configure rooms, roles and input routes inside Multimedia.",
        },
        "concept": {
            "concept_id": concept, "display_name": NAMES[concept][0],
            "description": NAMES[concept][1],
            "selection_guidance": "In Foundation select the integration and physical devices that expose this concept.",
        },
        "supported_sources": [{"integration_domain": i} for i in integrations],
        "candidate_requirements": {
            "topology": {"candidate_scope": "device", "grouping": "native_av_device",
                         "minimum_groups": 0, "maximum_groups": None},
            "normalized_inputs": [{
                "input_id": "native_av_endpoint", "technical_capabilities": {"any_of": ["state_observation"]},
                "allowed_source_kinds": ["entity"], "required": True,
                "cardinality": "one_or_more_per_group",
                "integration_matches": [
                    {"integration_domain": integration, "raw_capability_id": "native_media_entity",
                     "source_kind": "entity", "all_of": [],
                     "hints": [{"field": "source_identity.unique_id", "operator": "contains", "value": "media"}]}
                    for integration in integrations
                ],
            }],
        },
        "declared_domain_outputs": [],
        "build_policy": {"auto_prepare_when_unambiguous": True,
                         "review_when_multiple_candidates": True,
                         "block_when_required_input_missing": True},
        "safety": {"creates_binding": False, "creates_runtime_truth": False,
                   "creates_public_contract": False, "executes_commands": False},
    }


class MultimediaBuildSpecificationProvider:
    publisher_domain = PROVIDER_DOMAIN
    publication_revision = 1

    def get_build_specifications(self) -> tuple[dict[str, Any], ...]:
        return tuple(_spec(c) for c in ("display", "amplifier", "source"))


def register_with_foundation(hass: Any) -> bool:
    """Register support once; Foundation may be unavailable before installation.

    An absent Foundation is visible to the configuration wizard, never replaced
    by a proprietary discovery implementation or a second device selector.
    """
    from custom_components.rhi_foundation import shared_registry
    marker = "rhi_multimedia_build_provider_unsub"
    if callable(hass.data.get(marker)):
        return True
    unsubscribe = shared_registry.register_domain_build_specification_provider(
        hass, publisher_domain=PROVIDER_DOMAIN,
        provider=MultimediaBuildSpecificationProvider(), publication_revision=1,
    )
    hass.data[marker] = unsubscribe
    return True


@dataclass(frozen=True)
class SelectedSource:
    entity_id: str
    candidate_id: str
    concept: str
    integration: str
    device_registry_id: str | None
    available: bool


class FoundationSelectionError(ValueError):
    pass


def selected_sources(hass: Any) -> tuple[list[SelectedSource], str]:
    """Consume only Foundation's *explicitly selected* contract, not raw catalog.

    Matches are restricted to candidate IDs in the corresponding selected group,
    with stable registry-backed entity identity and native HA media/remote domain.
    No physical action is ever issued by this function.
    """
    registry = hass.data.get(REGISTRY_KEY, {}) or {}
    entry = registry.get(DOMAIN_ID)
    if not isinstance(entry, dict) or entry.get("domain_id") != DOMAIN_ID:
        return [], "Configure Multimedia concepts and devices in RHI Foundation first"
    results: dict[tuple[str, str], SelectedSource] = {}
    if not entry.get("foundation_entry_id"):
        raise FoundationSelectionError("Foundation selection has no owning config entry")
    for item in entry.get("inputs", []):
        if not isinstance(item, dict) or item.get("kind") != "selected_domain_build_input":
            continue
        if item.get("domain_id") != DOMAIN_ID:
            continue
        concept = (item.get("builder_id") or "").split(".")[1:2]
        concept = concept[0] if concept else ""
        if concept not in SUPPORTED:
            continue
        if (item.get("discovery_assessment") or {}).get("required_inputs_complete") is not True:
            continue
        selection = item.get("selection") or {}
        # Foundation may also support integration-wide discovery. Multimedia
        # requires an explicit per-concept device selection so a newly added
        # TV/AVR can never start receiving room commands automatically.
        explicit_devices = set(selection.get("selected_device_ids") or [])
        if selection.get("device_filter_mode") != "specific_devices" or not explicit_devices:
            continue
        evidence = {c.get("candidate_id"): c for c in item.get("candidate_evidence", [])
                    if isinstance(c, dict) and c.get("candidate_id")}
        selected_ids = {cid for group in item.get("candidate_groups", [])
                        if isinstance(group, dict)
                        for cid in group.get("candidate_ids", [])}
        for cid in sorted(selected_ids):
            source = evidence.get(cid)
            if not isinstance(source, dict):
                continue
            ident = source.get("source_identity") or {}
            if ident.get("source_kind") != "entity" or not ident.get("entity_registry_id"):
                continue
            entity_id = ident.get("current_entity_id")
            if not isinstance(entity_id, str) or not entity_id.startswith(("media_player.", "remote.")):
                continue
            integration = str(ident.get("integration_domain") or "")
            if integration not in SUPPORTED[concept]:
                continue
            if ident.get("device_registry_id") not in explicit_devices:
                continue
            # Require the native entity to exist, without looking for additional
            # devices or auto-assigning semantics based on vendor names.
            state = hass.states.get(entity_id)
            if state is None:
                continue
            results[(concept, entity_id)] = SelectedSource(
                entity_id=entity_id, candidate_id=cid, concept=concept,
                integration=integration,
                device_registry_id=ident.get("device_registry_id"),
                available=state.state not in ("unknown", "unavailable"),
            )
    return sorted(results.values(), key=lambda s: (s.concept, s.entity_id)), "Foundation SelectedDomainBuildInput"


def selected_index(hass: Any) -> dict[tuple[str, str], SelectedSource]:
    sources, _ = selected_sources(hass)
    return {(s.concept, s.entity_id): s for s in sources}
