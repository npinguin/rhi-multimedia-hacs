// Existing native room status entities own the resident-facing properties.
const RHI_MM_VIEWS = Object.freeze(['overview','rooms','activities','devices','diagnostics']);
const RHI_MM_PHASES = ['idle','starting','active','partial','stopping','interrupted','error'];

function rhiMmRooms(hass) {
  const candidates=Object.entries(hass?.states||{}).filter(([id,state])=>id.startsWith('sensor.')&&
    typeof state?.attributes?.rhi_multimedia_room==='string');
  const counts=new Map();
  for(const [,state] of candidates){const key=state.attributes.rhi_multimedia_room;counts.set(key,(counts.get(key)||0)+1);}
  const rooms=[];const versions=new Set();let unavailable=0;
  for(const [entityId,state] of candidates){
    const a=state.attributes;
    if(!a.rhi_multimedia_room||counts.get(a.rhi_multimedia_room)!==1||
      !RHI_MM_PHASES.includes(state.state)||typeof a.room_name!=='string'||
      typeof a.backend_version!=='string'||!Array.isArray(a.source_roles)||!Array.isArray(a.activities)||
      !a.commands||typeof a.commands!=='object'||
      !['active','playing','attention','foundation_approved'].every(k=>typeof a[k]==='boolean')||
      !['playing','on','idle','off','unknown'].includes(a.native_status)){
      unavailable++;continue;
    }
    // Only presentation names are mapped. No inferred native routing, activity
    // availability or playback from raw vendor entities.
    const {rhi_multimedia_room:roomId,room_name:roomName,source_roles:roles,...props}=a;
    rooms.push({...props,id:roomId,name:roomName,phase:state.state,devices:roles,entityId});
    versions.add(a.backend_version);
  }
  if(!rooms.length||versions.size!==1)return {ready:false,reason:'No available native Multimedia room status. Complete Foundation selection and room configuration, or check diagnostics.'};
  return {ready:true,backendVersion:[...versions][0],rooms,unavailable};
}

function rhiMmCanRun(room, type, activityId = '') {
  if (!room) return false;
  if (type === 'stop_activity') return room.commands?.stop?.enabled === true;
  if (['starting','stopping'].includes(room.phase)) return false;
  if (type === 'start_activity') return !!room.activities.find(a => a.id === activityId && a.available);
  if (type === 'recover_activity') return room.commands?.recover?.enabled === true;
  return false;
}

function rhiMmIntent(room, service, activity = '') {
  if (!rhiMmCanRun(room, service, activity)) return null;
  const data = {room:room.id};
  if (service === 'start_activity') data.activity = activity;
  return {domain:'rhi_multimedia',service,data};
}

function rhiMmDeviceIntent(room, key, action, value) {
  const device=room?.devices?.find(d=>d.key===key);
  const capability=device?.controls?.[action];
  if(!device?.foundation_approved||!capability?.enabled||['starting','stopping'].includes(room.phase))return null;
  if(Array.isArray(capability.options)){if(typeof value!=='string'||!capability.options.includes(value))return null;}
  else if(action==='volume'){if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1)return null;}
  else if(action==='mute'){if(typeof value!=='boolean')return null;}
  else if(value!==undefined&&value!==null)return null;
  return {domain:'rhi_multimedia',service:'control_device',data:{room:room.id,device:key,action,...(value!==undefined&&value!==null?{value}:{})}};
}


// Native HA response belongs to this invocation; no older transport fallback.
async function rhiMmExecute(hass,intent){
  const reply=await hass.callWS({type:'call_service',domain:intent.domain,service:intent.service,
    service_data:intent.data,return_response:true});
  const result=reply?.response;
  if(!result||result.room!==intent.data.room||result.service!==intent.service||
    (intent.service==='start_activity'&&result.activity!==intent.data.activity)||
    (intent.service==='control_device'&&(result.device!==intent.data.device||result.action!==intent.data.action))||
    !['confirmed','submitted','failed','cancelled'].includes(result.result)){
    return {result:'unknown'};
  }
  return result;
}


// Independently installed Core cards own their own reads, writes and history.
// Scope is an explicit set of existing Multimedia room IDs, never widened.
function rhiMmContextSpecs(hass,roomIds){
  if(!Array.isArray(roomIds)||!roomIds.length||roomIds.some(id=>typeof id!=='string'||!id.trim())||new Set(roomIds).size!==roomIds.length)return [];
  const scope={owner:'multimedia',asset_ids:[...roomIds].sort(),embedded:true};
  const services=hass?.services||{};
  const rows=[];
  if(services.rhi_notifications?.get_events)rows.push({id:'events',tag:'rhi-notifications-card',config:{...scope,view:'events',read_only:true}});
  // Finance is deliberately not applicable: no qualified Multimedia meter.
  if(services.rhi_notifications?.get_incidents)rows.push({id:'notifications',tag:'rhi-notifications-card',config:{...scope}});
  if(services.rhi_planning?.get_overview){
    // Core Planning is the sole authoring authority. Do not disable its
    // qualified owner/asset editor merely because it is embedded by Premium.
    // A partial Core installation or resident account remains read-only.
    const canManage=hass?.user?.is_admin===true &&
      !!services.rhi_planning.get_authoring && !!services.rhi_planning.set_target_approval;
    rows.push({id:'planning',tag:'rhi-planning-overview-card',config:{...scope,read_only:!canManage}});
  }
  return rows;
}
async function rhiMmPlanningSummary(hass,scope){
  const reply=await hass.callWS({type:'call_service',domain:'rhi_planning',service:'get_overview',service_data:{owner:scope.owner,asset_ids:scope.asset_ids},return_response:true});
  const data=reply?.response;
  if(!data||typeof data.complete!=='boolean'||!data.summary)return {status:'unknown'};
  const watch=typeof data.status_entity_id==='string'&&data.status_entity_id.startsWith('sensor.')?data.status_entity_id:null;
  const due=data.summary.next_due;
  if(due&&typeof due.title==='string'&&typeof due.at==='string'&&['start','deadline'].includes(due.time_kind)){
    return {status:'due',title:due.title,at:due.at,kind:due.time_kind,overdue:due.overdue===true,watch};
  }
  return {status:data.complete?'empty':'unknown',watch};
}


// The Core Planning timestamp is offset-aware and its site timezone is the
// only canonical display timezone. Never silently reinterpret it as the device
// browser's timezone or invent a start from an owner's deadline.
function rhiMmSiteDateTime(hass,at){
  if(typeof at!=='string'||!/(?:Z|[+-]\d{2}:\d{2})$/.test(at))return '—';
  const zone=hass?.config?.time_zone;
  if(typeof zone!=='string'||!zone.trim())return '—';
  const date=new Date(at);
  if(!Number.isFinite(date.getTime()))return '—';
  try{
    return new Intl.DateTimeFormat(hass?.locale?.language||hass?.language||'en',
      {dateStyle:'medium',timeStyle:'short',timeZone:zone}).format(date);
  }catch{return '—';}
}
