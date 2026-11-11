# Changelog

## 0.1.0 — first HACS TEST candidate

- Migrated P0 Salon activity orchestration to RHI Multimedia, retaining exact device state/source/volume readback, shared physical resource protection and recovery.
- Native Home Assistant config-entry flow, reloadable options and status/source sensors and activity select per room.
- Source mappings explicitly configured and validated; no HDMI guessing and no new physical source devices.
- Reuse existing original TV/AV integrations and graphical LG cards through the Wessels example dashboard (not included in public HACS runtime).
- Distinguish CI-qualified TEST from target-install and stable acceptance. No stable approval.
