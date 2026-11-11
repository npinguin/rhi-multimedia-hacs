# RHI Multimedia — generated HACS distribution

This public repository is **generated** from validated private `npinguin/rhi-multimedia` source. Do not manually edit integration code here. Release tags are immutable. A release marked **TEST** is not stable or physical acceptance.

## Setup

1. Add this repository to HACS as an **Integration**: `https://github.com/npinguin/rhi-multimedia-hacs`. Install the selected TEST version and restart Home Assistant.
2. A compatible **RHI Foundation** integration is required. In **Foundation → Configure → Multimedia**, select supported **integrations and specific devices** separately for the **Screen/TV**, **Amplifier/Audio** and **Media Sources** technical concepts.
3. In **Multimedia → Configure**, link an HA room to its screen, optional amplifier and selected sources; define TV/source/music/game activities and choose the actual HA inputs. Changes are reviewed and saved atomically.

**No JSON or manual entity ID typing.** Multimedia does not discover devices independently of Foundation or claim their native device identities. Existing vendor HA integrations still provide TV, receiver, streamer, game and speaker control. No AV Scenes/Harmonium installation is required.

The `DISTRIBUTION_SOURCE.json` identifies the exact private source SHA and runtime checksum. The graphical LG remote card is separate and is needed only for the optional site dashboard; native WOL is required only for configured WOL commands. See GitHub release notes for real-home test acceptance and rollback guidance.
