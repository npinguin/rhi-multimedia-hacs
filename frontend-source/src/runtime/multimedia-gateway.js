// Sole HA integration gateway: the backend's published Experience V1 is authoritative.
const RHI_MM_CONTRACT = 'RHI_MULTIMEDIA_EXPERIENCE_V1';
const RHI_MM_VIEWS = Object.freeze(['overview','rooms','activities','devices','diagnostics']);

function rhiMmContract(hass, configuredEntity = '') {
  const states = hass?.states || {};
  const candidates = configuredEntity
    ? [[configuredEntity, states[configuredEntity]]]
    : Object.entries(states).filter(([id, value]) => id.startsWith('sensor.') &&
        value?.attributes?.contract === RHI_MM_CONTRACT);
  if (!candidates.length || !candidates[0]?.[1]) return Object.freeze({ready:false,reason:'Multimedia has not published its Experience V1 contract. Install the compatible backend, complete Foundation device selection and configure at least one room.'});
  if (candidates.length !== 1) return Object.freeze({ready:false,reason:'Multiple Multimedia experience contracts found. Select the exact contract entity in dashboard card configuration.'});
  const [entityId, entity] = candidates[0];
  const a = entity.attributes || {};
  if (entity.state !== 'ready' || a.contract !== RHI_MM_CONTRACT || a.schema_version !== 1 ||
      !Array.isArray(a.rooms) || !a.summary || typeof a.summary !== 'object') {
    return Object.freeze({ready:false,entityId,reason:'Multimedia Experience V1 is unavailable or incompatible. No actions can be executed.'});
  }
  const required = ['room_count','active_rooms','playing_rooms','attention_rooms'];
  if (!required.every(k => Number.isInteger(a.summary[k]) && a.summary[k] >= 0)) {
    return Object.freeze({ready:false,entityId,reason:'Incomplete backend summary. Multimedia UX will not invent counts.'});
  }
  if (a.rooms.some(r => !r || typeof r.id !== 'string' || typeof r.name !== 'string' ||
      !Array.isArray(r.activities) || !Array.isArray(r.devices) || !r.commands)) {
    return Object.freeze({ready:false,entityId,reason:'Incomplete Multimedia room model; check backend diagnostics.'});
  }
  return {ready:true,entityId,revision:a.revision || 0,backendVersion:String(a.backend_version || 'Unknown'),
    rooms:a.rooms,summary:a.summary};
}

function rhiMmCanRun(room, type, activityId = '') {
  if (!room || !room.foundation_approved || ['starting','stopping'].includes(room.phase)) return false;
  if (type === 'start_activity') return !!room.activities.find(a => a.id === activityId && a.available);
  if (type === 'stop_activity') return room.commands?.stop?.enabled === true;
  if (type === 'recover_activity') return room.commands?.recover?.enabled === true;
  return false;
}

function rhiMmIntent(room, service, activity = '') {
  if (!rhiMmCanRun(room, service, activity)) return null;
  const data = {room:room.id};
  if (service === 'start_activity') data.activity = activity;
  return {domain:'rhi_multimedia',service,data};
}
