"""RHI cross-domain diagnostics envelope without MACs, tokens or untrusted source details."""
from __future__ import annotations

import json
from pathlib import Path
from .const import DOMAIN


async def async_get_config_entry_diagnostics(hass, entry):
    context = hass.data.get(DOMAIN, {})
    engine = context.get("engine")
    manifest = json.loads((Path(__file__).parent / "manifest.json").read_text())
    return {
        "identity": {"domain": DOMAIN, "version": manifest["version"],
                     "config_entry_id": entry.entry_id},
        "health": {"loaded": engine is not None,
                   "rooms": len(engine.rooms) if engine else 0},
        "configuration": {"room_ids": sorted(engine.rooms) if engine else [],
                          "configured_activities": {key: sorted(v["activities"])
                                                    for key, v in engine.rooms.items()} if engine else {}},
        "build_handoff": {"foundation": "optional; no runtime source reinterpretation"},
        "execution": {room: engine.snapshot(room) for room in engine.rooms} if engine else {},
        "publication": {"platforms": ["sensor", "select"], "physical_devices_duplicated": False},
    }
