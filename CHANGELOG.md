## 0.1.4 — confirmed Active semantics for Premium UX (TEST)

- Active room count now means backend-confirmed `active` or `partial` execution, never a failed or interrupted requested activity.
- Failed activity retains safe stop/recover affordances when Foundation source approval permits.
- Active room attention reflects unavailable native devices; prevents optimistic overview stats.
- All v0.1.3 Experience V1 semantics preserved. No stable or physical HA acceptance.

## 0.1.3 — Premium UX public experience contract (TEST)

- Native `sensor.rhi_multimedia_experience` publishes versioned Multimedia Experience V1 across configured rooms, activities, logical device roles, Foundation binding health, native AV playback/volume/source readback, availability, route labels and executable stop/recover readiness.
- Source state changes and activity transitions refresh the contract; failed/partial/restarted statuses never count as confirmed execution.
- No frontend-only physical source discovery, synthetic device state or optimistic command outcome.
- Supports independent HACS Multimedia UX Dashboard. No target HA field acceptance or stable approval.

## 0.1.2 — HACS TEST: canonical Robotix branding parity

- Added the seven exact Robotix PNG assets already shipped by Foundation, Mobility and Energy. No new logo or generated imagery.
- HACS mirror now includes the four standard root `brand/` images as well as the canonical runtime icons and logos.
- Source package, distribution staging, checksums and public HACS Validate explicitly reject missing or changed logos.
- Retains v0.1.1 Foundation-first Multimedia wizard; hardware functionality not changed or field qualified.
- Immutable earlier v0.1.0 and v0.1.1 HACS prereleases remain unchanged.

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
