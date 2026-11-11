# RHI Multimedia — HACS distribution

This repository is generated from private `npinguin/rhi-multimedia` exact validated main. **Do not edit integration code here.** Release tags are immutable. A prerelease marked TEST is not stable/physical acceptance.

Install using HACS → Custom repositories → `https://github.com/npinguin/rhi-multimedia-hacs` → Integration, then Settings → Devices & Services → Add Integration → RHI Multimedia. Configure actual room/device/activity JSON. No AV Scenes or Harmonium required. Do not use the Wessels source package from the private site repository.

See the included `DISTRIBUTION_SOURCE.json` for source SHA and runtime checksum. Hardware-specific integrations (Denon, LG, Apple TV, HEOS, etc.) remain separate Home Assistant integrations. Native WOL requires Home Assistant Wake-on-LAN. Existing graphical LG remote Lovelace card is only necessary when using the optional site example dashboard.
