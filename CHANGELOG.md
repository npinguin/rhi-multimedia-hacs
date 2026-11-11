## 0.1.1 — engineering candidate: Foundation-first guided Multimedia setup

- Publish Screen, Amplifier and Media Source technical concepts to RHI Foundation. Foundation alone selects integrations and devices.
- Consume only Foundation SelectedDomainBuildInput, with stable candidate provenance; remove native-registry rediscovery fallback.
- Replace JSON configuration with a HA wizard for rooms, physical roles, optional audio, sources and exact input routes.
- Support an empty first-time entry while Foundation selection is commissioned; no commands, sensors or fake runtime.
- Reject unapproved/stale bindings at runtime; preserve original P0 engine and all existing action tests.
- v0.1.1 is not approved for stable release; target-HA integration tests still required.

# Changelog

## 0.1.0 — first HACS TEST candidate

- Migrated P0 Salon activity orchestration to RHI Multimedia, retaining exact device state/source/volume readback, shared physical resource protection and recovery.
- Native Home Assistant config-entry flow, reloadable options and status/source sensors and activity select per room.
- Source mappings explicitly configured and validated; no HDMI guessing and no new physical source devices.
- Reuse existing original TV/AV integrations and graphical LG cards through the Wessels example dashboard (not included in public HACS runtime).
- Distinguish CI-qualified TEST from target-install and stable acceptance. No stable approval.
