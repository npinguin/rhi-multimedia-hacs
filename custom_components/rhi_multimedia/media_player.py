"""One optional Dell C8621QT native HA display entity per configured LAN display.

This is a bounded vendor-native adapter only when a real display is explicitly
configured. Foundation still selects this exact HA device before Multimedia
may assign it to a room. No duplicate TV entities or auxiliary writer.
"""
from __future__ import annotations

import asyncio
from datetime import timedelta

from homeassistant.components.media_player import MediaPlayerEntity, MediaPlayerEntityFeature
from homeassistant.components.media_player.const import MediaPlayerState
from homeassistant.core import callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity import DeviceInfo

from .const import EVENT_UPDATE
from .engine import MediaError
from .experience import NativeUpdate
from .validation import asset_bindings, live_related_source, native_choices, native_state

from .const import DOMAIN
from .dell_c8621qt import DellC8621QT, DellProtocolError, valid_host

SCAN_INTERVAL = timedelta(seconds=30)
FEATURES = (MediaPlayerEntityFeature.TURN_ON | MediaPlayerEntityFeature.TURN_OFF
            | MediaPlayerEntityFeature.SELECT_SOURCE)


async def async_setup_entry(hass, entry, async_add_entities) -> None:
    """Expose the existing Dell endpoint and one logical player per native AV player.

    The source HA device remains owned by its vendor integration. RHI's player
    only presents the existing source and delegates writes to ActivityEngine.
    """
    specs = entry.options.get("dell_displays", getattr(entry, "data", {}).get("dell_displays", {}))
    if specs:
        async_add_entities([
            DellC8621QTPlayer(entry.entry_id, key, spec["name"], valid_host(spec["host"]))
            for key, spec in sorted(specs.items())
        ], update_before_add=True)

    if hass is None:
        return  # Pure Dell transport test fixture has no HA registry.
    from .sensor import logical_asset_projection_specs

    context = hass.data[DOMAIN]
    engine = context.get("engine")
    rooms = engine.rooms if engine else {}
    assets = logical_asset_projection_specs(hass, rooms)
    projected = {
        key: LogicalAssetMediaPlayer(context, entry.entry_id, key, value)
        for key, value in sorted(assets.items())
        if value["device"]["entity"].startswith("media_player.")
    }
    if projected:
        async_add_entities(list(projected.values()))

    @callback
    def refresh_logical_players(current):
        # The sensor platform owns the shared discovery projection and its
        # structural watcher. Both native platforms consume the same specs.
        added = []
        for key, spec in current.items():
            if not spec["device"]["entity"].startswith("media_player."):
                continue
            if key in projected:
                projected[key].update_spec(spec)
            else:
                player = LogicalAssetMediaPlayer(context, entry.entry_id, key, spec)
                projected[key] = player
                added.append(player)
        if added:
            async_add_entities(added)
        for key, player in projected.items():
            if (key not in current
                    or not current[key]["device"]["entity"].startswith("media_player.")):
                player.mark_unpublished()

    context["refresh_logical_players"] = refresh_logical_players

    def remove_refresh():
        if context.get("refresh_logical_players") is refresh_logical_players:
            context.pop("refresh_logical_players", None)

    entry.async_on_unload(remove_refresh)


class DellC8621QTPlayer(MediaPlayerEntity):
    _attr_has_entity_name = True
    _attr_should_poll = True
    _attr_supported_features = FEATURES

    def __init__(self, entry_id: str, key: str, name: str, host: str) -> None:
        self.client = DellC8621QT(host)
        self._attr_name = name
        self._attr_unique_id = f"{entry_id}:dell:{key}"
        self._attr_available = False
        self._attr_state = MediaPlayerState.OFF
        self._attr_source_list: list[str] = []
        self._attr_source: str | None = None
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, f"dell:{entry_id}:{key}")},
            manufacturer="Dell", model="C8621QT", name=name,
            configuration_url=f"http://{host}/",
        )

    def _mark_unavailable(self) -> None:
        """Forget stale input capabilities whenever native LAN truth is lost."""
        self._attr_available = False
        self._attr_source_list = []
        self._attr_source = None

    async def async_update(self) -> None:
        try:
            power = await self.client.power_state()
            if power == 1:
                sources = await self.client.source_list()
                source = await self.client.source()
                self._attr_state = MediaPlayerState.ON
                self._attr_source_list = sources
                self._attr_source = source if source in sources else None
            else:
                self._attr_state = MediaPlayerState.STANDBY if power == 2 else MediaPlayerState.OFF
                self._attr_source = None
                self._attr_source_list = []
            self._attr_available = True
        except DellProtocolError:
            self._mark_unavailable()

    async def _confirm_power(self, on: bool) -> None:
        for _ in range(3):
            await asyncio.sleep(0.3)
            await self.async_update()
            expected = MediaPlayerState.ON if on else MediaPlayerState.STANDBY
            if self._attr_available and self._attr_state == expected:
                self.async_write_ha_state()
                return
        self.async_write_ha_state()
        raise HomeAssistantError("Dell power state not confirmed by native LAN readback")

    async def async_turn_on(self) -> None:
        try:
            await self.client.set_power(True)
            await self._confirm_power(True)
        except DellProtocolError as exc:
            self._mark_unavailable()
            self.async_write_ha_state()
            raise HomeAssistantError("Dell network power-on unavailable") from exc

    async def async_turn_off(self) -> None:
        try:
            await self.client.set_power(False)  # Suspend only, never hard-off.
            await self._confirm_power(False)
        except DellProtocolError as exc:
            self._mark_unavailable()
            self.async_write_ha_state()
            raise HomeAssistantError("Dell network standby unavailable") from exc

    async def async_select_source(self, source: str) -> None:
        try:
            await self.client.select_source(source)
            for _ in range(3):
                await asyncio.sleep(0.3)
                await self.async_update()
                if self._attr_available and self._attr_source == source:
                    self.async_write_ha_state()
                    return
            self.async_write_ha_state()
            raise HomeAssistantError("Dell input selection not confirmed by LAN readback")
        except DellProtocolError as exc:
            self._mark_unavailable()
            self.async_write_ha_state()
            raise HomeAssistantError("Dell source selection unavailable") from exc


class LogicalAssetMediaPlayer(MediaPlayerEntity):
    """Source-backed HA logical control surface, not another physical writer.

    The registered native media_player and related remote remain on the vendor
    HA Device. All permitted commands reuse the existing engine resource lock,
    Foundation approval, HA user policy and native readback path.
    """

    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_name = "Media Player"

    _ACTION_FEATURES = (
        ("power_on", MediaPlayerEntityFeature.TURN_ON),
        ("power_off", MediaPlayerEntityFeature.TURN_OFF),
        ("source", MediaPlayerEntityFeature.SELECT_SOURCE),
        ("sound_mode", MediaPlayerEntityFeature.SELECT_SOUND_MODE),
        ("volume", MediaPlayerEntityFeature.VOLUME_SET),
        ("mute", MediaPlayerEntityFeature.VOLUME_MUTE),
        ("volume_up", MediaPlayerEntityFeature.VOLUME_STEP),
        ("play", MediaPlayerEntityFeature.PLAY),
        ("pause", MediaPlayerEntityFeature.PAUSE),
        ("stop", MediaPlayerEntityFeature.STOP),
        ("next", MediaPlayerEntityFeature.NEXT_TRACK),
        ("previous", MediaPlayerEntityFeature.PREVIOUS_TRACK),
        ("seek", MediaPlayerEntityFeature.SEEK),
    )

    def __init__(self, context, entry_id: str, asset_id: str, spec: dict) -> None:
        self.context = context
        self.asset_id = asset_id
        self.source_published = True
        self.update_spec(spec)
        self._attr_unique_id = f"{entry_id}:asset:{asset_id}:media_player"
        label = self.logical_type.replace("_", " ").title()
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, f"asset:{entry_id}:{asset_id}")},
            manufacturer="Robotix", model=f"Logical {label}",
            name=self.device.get("name") or self.device["entity"].rsplit(".", 1)[-1],
        )

    def update_spec(self, spec: dict) -> None:
        self.source_published = True
        self.device = spec["device"]
        self.logical_type = spec.get("logical_type", "media_player")
        self.room_ids = tuple(sorted(spec.get("rooms") or ()))
        self.related_entities = tuple(spec.get("source_entities") or ())
        self.native_device_id = spec.get("native_device_id")
        self.conflicted_identity = bool(spec.get("conflicted_identity"))
        self.discovered_only = bool(spec.get("discovered_only"))

    def mark_unpublished(self) -> None:
        self.source_published = False

    async def async_added_to_hass(self) -> None:
        from homeassistant.helpers.dispatcher import async_dispatcher_connect
        self.async_on_remove(async_dispatcher_connect(self.hass, EVENT_UPDATE, self._changed))

    @callback
    def _changed(self, update) -> None:
        if isinstance(update, NativeUpdate):
            if not self.source_published or not update.affects(
                    self.device["entity"], self.related_entities):
                return
        # Keep native attributes and capability reads consistent throughout
        # the synchronous HA write; never reuse these in a physical command.
        from .foundation import projection_source_reads
        with projection_source_reads(self.hass):
            self._write_options = self._options()
            try:
                self.async_write_ha_state()
            finally:
                self._write_options = None

    def _native(self):
        if not self.source_published or self.conflicted_identity:
            return None
        state = native_state(self.hass, self.device["entity"])
        if state is None or state.state in ("unknown", "unavailable"):
            return None
        if (getattr(state, "attributes", {}) or {}).get("restored"):
            return None
        return state

    def _attributes(self) -> dict:
        native = self._native()
        return native.attributes if native else {}

    def _binding(self):
        engine = self.context.get("engine")
        if not engine or not self.source_published or self.conflicted_identity:
            return None
        bindings = [
            (room, role, device)
            for room, role, device in asset_bindings(engine.rooms, self.asset_id)
            if device["entity"] == self.device["entity"]
        ]
        if len(bindings) == 1:
            return bindings[0]
        # A shared endpoint is operated only in its actual currently owning
        # room. An idle shared device has no implicit room or guessed route.
        active = [(room, role, device) for room, role, device in bindings
                  if role in engine.states[room].devices
                  and engine.states[room].phase == "active"]
        return active[0] if len(active) == 1 else None

    def _options(self) -> dict:
        cached = getattr(self, "_write_options", None)
        if cached is not None:
            return cached
        binding = self._binding()
        adapter = self.context.get("adapter")
        if binding is None or adapter is None:
            return {}
        _, _, device = binding
        try:
            from .foundation import authorized_source
            approved = authorized_source(self.hass, device)
            return adapter.control_options(device, approved)
        except (MediaError, ValueError, KeyError):
            return {}

    @property
    def available(self) -> bool:
        # An actually approved WoL route may be usable while the TV's native
        # provider is asleep. Do not synthesize a physical ON/OFF observation.
        return self._native() is not None or bool(
            self._options().get("power_on", {}).get("enabled"))

    @property
    def state(self):
        native = self._native()
        if native is None:
            return None
        try:
            return MediaPlayerState(native.state)
        except ValueError:
            return None

    @property
    def supported_features(self):
        options = self._options()
        features = MediaPlayerEntityFeature(0)
        for action, flag in self._ACTION_FEATURES:
            if options.get(action, {}).get("enabled"):
                features |= flag
        return features

    @property
    def source(self):
        return self._attributes().get("source")

    @property
    def source_list(self):
        return native_choices(self._attributes().get("source_list"))

    @property
    def sound_mode(self):
        return self._attributes().get("sound_mode")

    @property
    def sound_mode_list(self):
        return native_choices(self._attributes().get("sound_mode_list"))

    @property
    def volume_level(self):
        value = self._attributes().get("volume_level")
        return value if type(value) in (int, float) and 0 <= value <= 1 else None

    @property
    def is_volume_muted(self):
        value = self._attributes().get("is_volume_muted")
        return value if type(value) is bool else None

    @property
    def media_title(self):
        return self._attributes().get("media_title")

    @property
    def media_artist(self):
        return self._attributes().get("media_artist")

    @property
    def media_album_name(self):
        return self._attributes().get("media_album_name")

    @property
    def media_content_type(self):
        return self._attributes().get("media_content_type")

    @property
    def media_duration(self):
        return self._attributes().get("media_duration")

    @property
    def media_position(self):
        return self._attributes().get("media_position")

    @property
    def entity_picture(self):
        return self._attributes().get("entity_picture")

    @property
    def extra_state_attributes(self):
        adapter = self.context.get("adapter")
        quality = adapter.native_readback_quality(self.device) if adapter else "not_configured"
        return {
            "owner_domain": DOMAIN,
            "asset_id": self.asset_id,
            "logical_type": self.logical_type,
            "source_entity_id": self.device["entity"],
            "native_device_id": self.native_device_id,
            "rooms": list(self.room_ids),
            "related_source_entities": [
                {"entity_id": x["entity_id"], "provider": x.get("provider"),
                 "availability": live_related_source(self.hass, x, self.source_published)["availability"]}
                for x in self.related_entities
            ],
            "source_readback": "native_ha_state" if self._native() else "unavailable_or_restored",
            "command_authorization": "approved" if self._options() else "pending_or_room_required",
            "readback_quality": quality,
            "power_mode": self.device.get("power_mode", "native"),
            "hdmi_cec_enabled": self.device.get("hdmi_cec_enabled", False),
            "wake_on_lan_configured": self.device.get("power_on", {}).get("action")
                                      == "wake_on_lan.send_magic_packet",
        }

    async def _execute(self, action: str, value=None) -> None:
        binding = self._binding()
        if binding is None:
            raise HomeAssistantError(
                "Choose a configured Multimedia room before controlling this shared or unassigned device")
        engine = self.context["engine"]
        adapter = self.context["adapter"]
        room, role, _ = binding
        try:
            await adapter.with_context(
                getattr(self, "_context", None),
                engine.control(room, role, action, value))
        except MediaError as exc:
            raise HomeAssistantError(str(exc)) from exc

    async def async_turn_on(self):
        await self._execute("power_on")

    async def async_turn_off(self):
        await self._execute("power_off")

    async def async_select_source(self, source):
        await self._execute("source", source)

    async def async_select_sound_mode(self, sound_mode):
        await self._execute("sound_mode", sound_mode)

    async def async_set_volume_level(self, volume):
        await self._execute("volume", volume)

    async def async_mute_volume(self, mute):
        await self._execute("mute", mute)

    async def async_volume_up(self):
        await self._execute("volume_up")

    async def async_volume_down(self):
        await self._execute("volume_down")

    async def async_media_play(self):
        await self._execute("play")

    async def async_media_pause(self):
        await self._execute("pause")

    async def async_media_play_pause(self):
        await self._execute("pause" if self.state == MediaPlayerState.PLAYING else "play")

    async def async_media_stop(self):
        await self._execute("stop")

    async def async_media_next_track(self):
        await self._execute("next")

    async def async_media_previous_track(self):
        await self._execute("previous")

    async def async_media_seek(self, position):
        await self._execute("seek", position)
