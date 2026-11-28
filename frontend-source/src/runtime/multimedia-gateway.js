// Existing native room status entities own the resident-facing properties.
const RHI_MM_VIEWS = Object.freeze(['overview','settings','discovery','insights','rooms','activities','devices','diagnostics']);
const RHI_MM_PHASES = ['idle','starting','active','partial','stopping','interrupted','error'];

function rhiMmRoomCandidates(hass) {
  return Object.entries(hass?.states||{}).filter(([id,state])=>id.startsWith('sensor.')&&
    typeof state?.attributes?.rhi_multimedia_room==='string');
}
function rhiMmRooms(hass,candidates=rhiMmRoomCandidates(hass)) {
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
  else if (service === 'stop_activity' || service === 'recover_activity') data.expected_activity = room.activity_id || '';
  return {domain:'rhi_multimedia',service,data};
}

function rhiMmShortcutIntent(room, action, key){
  // Native backend publishes the only active activity's mapped controls.
  // No guessed player, device or macro owner in the browser.
  if(!room||room.phase!=='active'||room.control_owner==='harmony'||
     typeof key!=='string'||!key)return null;
  const active=room.activities?.find(a=>a.id===room.activity_id&&a.active===true);
  if(!active)return null;
  if(action==='press_activity_button'){
    if(!Array.isArray(active.button_map)||
       !active.button_map.some(button=>button.button===key&&button.enabled===true))return null;
    return {domain:'rhi_multimedia',service:action,data:{room:room.id,button:key,expected_activity:room.activity_id}};
  }
  if(action==='run_activity_macro'){
    if(!Array.isArray(active.macros)||
       !active.macros.some(macro=>macro.id===key&&macro.enabled===true))return null;
    return {domain:'rhi_multimedia',service:action,data:{room:room.id,macro:key,expected_activity:room.activity_id}};
  }
  return null;
}

function rhiMmDeviceIntent(room, key, action, value, expectedActivity) {
  const device=room?.devices?.find(d=>d.key===key);
  const capability=device?.controls?.[action];
  if(!device?.foundation_approved||!capability?.enabled||['starting','stopping'].includes(room.phase))return null;
  const computerKey=action==='remote_key'&&device.concept==='network';
  const activityBound=['seek','remote_key','remote_text','remote_hold','remote_repeat','computer_launch'].includes(action);
  if(activityBound&&expectedActivity!==undefined&&(expectedActivity||null)!==(room.activity_id||null))return null;
  if(Array.isArray(capability.options)){if(typeof value!=='string'||!capability.options.includes(value))return null;}
  else if(action==='volume'){if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1)return null;}
  else if(action==='seek'){
    if(typeof value!=='number'||!Number.isFinite(value)||!Number.isFinite(capability.max_seconds)||value<0||value>capability.max_seconds)return null;
    if(room.now_playing?.device_key!==key||!Number.isFinite(room.now_playing?.duration)||value>room.now_playing.duration)return null;
  }
  else if(action==='mute'){if(typeof value!=='boolean')return null;}
  else if(action==='remote_text'){
    if(typeof value!=='string'||value.length<1||value.length>256||/[\x00-\x1f\x7f]/.test(value))return null;
  }else if(value!==undefined&&value!==null)return null;
  return {domain:'rhi_multimedia',service:'control_device',data:{room:room.id,device:key,action,...(value!==undefined&&value!==null?{value}:{}),...(action==='computer_launch'||computerKey?{expected_activity:room.activity_id||''}:activityBound&&room.phase==='active'&&room.activity_id?{expected_activity:room.activity_id}:{})}};
}


// Native HA response belongs to this invocation; no older transport fallback.
async function rhiMmExecute(hass,intent){
  const reply=await hass.callWS({type:'call_service',domain:intent.domain,service:intent.service,
    service_data:intent.data,return_response:true});
  const result=reply?.response;
  if(!result||result.room!==intent.data.room||result.service!==intent.service||
    (intent.service==='start_activity'&&result.activity!==intent.data.activity)||
    (intent.service==='control_device'&&(result.device!==intent.data.device||result.action!==intent.data.action))||
    (intent.service==='press_activity_button'&&result.button!==intent.data.button)||
    (intent.service==='run_activity_macro'&&result.macro!==intent.data.macro)||
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

// Official Home Assistant Options Flow is the only configuration transaction
// authority. No local store or device discovery: this is a thin typed route to
// the existing integration wizard (the same backend as Configure).
const RHI_MM_OPTION_ACTIONS=Object.freeze(new Set([
  'complete_setup','dell_add','device_add','device_settings','device_edit','device_assign','device_unassign','device_remove',
  'add_room','rename_room','edit_room','remove_room',
  'guided_activity','add_activity','quick_edit_activity','edit_activity','activity_devices','remove_activity',
  'cec_device','cec_activity','tv_wake','harmony_owner','speech_endpoint','expert_yaml','yaml','script_defaults','script_step','button_mapping','macro_manage'
]));
async function rhiMmEntry(hass){
  if(hass?.user?.is_admin!==true)throw new Error('Multimedia admin permission required');
  if(typeof hass.callWS!=='function'||typeof hass.callApi!=='function')
    throw new Error('Native HA configuration API unavailable');
  const entries=await hass.callWS({type:'config_entries/get',domain:'rhi_multimedia'});
  const matched=Array.isArray(entries)?entries.filter(e=>
    e?.domain==='rhi_multimedia'&&e.supports_options===true&&
    typeof e.entry_id==='string'&&e.entry_id):[];
  if(matched.length!==1)throw new Error('Multimedia Options Flow unavailable');
  return matched[0].entry_id;
}
async function rhiMmDiagnosticExport(hass,roomId=''){
  const entryId=await rhiMmEntry(hass);
  const response=await hass.callApi('GET','diagnostics/config_entry/'+encodeURIComponent(entryId));
  const data=response?.data;
  if(!data||data.identity?.domain!=='rhi_multimedia'||data.identity.config_entry_id!==entryId)
    throw new Error('Invalid Multimedia diagnostics response');
  // Only Multimedia's own privacy-safe diagnostic payload, never HA's
  // surrounding system information, other integrations or issue registry.
  if(!roomId)return data;
  if(!data.configuration?.room_ids?.includes(roomId))throw new Error('Unknown Multimedia diagnostics room');
  const scoped={identity:data.identity,ux:data.ux,build_handoff:data.build_handoff,
    publication:data.publication,configuration:{room_ids:[roomId]},scope:roomId};
  const onlyRoom=source=>source&&Object.prototype.hasOwnProperty.call(source,roomId)?{[roomId]:source[roomId]}:{};
  for(const key of ['execution','target_readback','source_readback','last_controls','last_attempts','attention_events'])
    scoped[key]=onlyRoom(data[key]);
  for(const key of ['harmony_ownership','configured_activities','activity_routes'])
    scoped.configuration[key]=onlyRoom(data.configuration[key]);
  const linked=new Set(Object.values(scoped.source_readback[roomId]||{}).map(d=>d.entity));
  scoped.discovery={origin:data.discovery?.origin,supported_candidates:(data.discovery?.supported_candidates||[]).filter(d=>linked.has(d.entity))};
  return scoped;
}
async function rhiMmOptionsBegin(hass,{action,room='',activity='',scope='',id='',
  phase='',operation='',index=null,device='',stepType='',asset=''}){
  if(hass?.user?.is_admin!==true)
    throw new Error('Multimedia admin permission required');
  if(typeof hass.callWS!=='function'||typeof hass.callApi!=='function')
    throw new Error('Native HA configuration API unavailable');
  if(!RHI_MM_OPTION_ACTIONS.has(action))
    throw new Error('Unsupported Multimedia settings action');
  const entryId=await rhiMmEntry(hass);
  let step=await hass.callApi('POST','config/config_entries/options/flow',
    {handler:entryId});
  const advance=async(expected,data)=>{
    if(step?.type!=='form'||step.step_id!==expected||typeof step.flow_id!=='string')
      throw new Error('Unexpected Multimedia Options Flow step');
    step=await hass.callApi('POST',`config/config_entries/options/flow/${encodeURIComponent(step.flow_id)}`,data);
  };
  // Server evaluates every step and may return the same form with errors.
  // In that case expose the exact server form, never skip its validation.
  try{
    // HA validates the current form's schema. Route contextual card actions
    // through the existing Assisted selector while retaining two entry choices.
    if(action==='complete_setup')await advance('init',{action:'complete_setup'});
    else if(action==='yaml')await advance('init',{action:'yaml'});
    else{
      await advance('init',{action:'assisted'});
      await advance('assisted',{task:action});
    }
    if(action==='expert_yaml'){
      if(!['room','device','activity'].includes(scope)||typeof room!=='string'||!room||
         (scope==='room'&&id)||(scope!=='room'&&(!id||typeof id!=='string')))
        throw new Error('Expert YAML requires a specific configured object');
      await advance('expert_target',{scope,room,id});
    }
    if(asset&&step?.step_id==='device_select')await advance('device_select',{device:asset});
    if(room&&step?.step_id==='existing_room')await advance('existing_room',{room});
    if(activity&&step?.step_id==='existing_activity')await advance('existing_activity',{activity});
    // Direct per-device Add / Edit still uses the official HA Options Flow.
    // Never infer an action or write from the browser. If the backend form
    // has changed, stop at the form instead of guessing an alternative path.
    if(action==='script_step'&&step?.step_id==='script_step'&&
       ['steps','stop_steps'].includes(phase)&&
       ['add','edit','remove','up','down'].includes(operation)&&
       Number.isInteger(index)&&index>=0){
      await advance('script_step',{phase,operation,index:String(index)});
      if(step?.step_id==='script_detail'&&device&&stepType){
        if(!['remote_key','source','sound_mode','volume','play','pause','delay','wait_until'].includes(stepType))
          throw new Error('Unsupported Multimedia script step type');
        // For an edit the backend must still describe the expected exact
        // object; stale indices should not become edits to another device.
        if(operation==='edit'){
          const offered=step.data_schema||[];
          const serverDevice=offered.find(f=>f.name==='device')?.default;
          const serverType=offered.find(f=>f.name==='type')?.default;
          if(serverDevice!==device||serverType!==stepType)return step;
        }
        await advance('script_detail',{device,type:stepType});
      }
    }
  }catch(err){
    // A started server flow must be removed after a transport/shape failure.
    if(typeof step?.flow_id==='string'){
      try{await hass.callApi('DELETE',`config/config_entries/options/flow/${encodeURIComponent(step.flow_id)}`);}catch(_){}
    }
    throw err;
  }
  return step;
}
async function rhiMmOptionsAdvance(hass,step,data){
  if(hass?.user?.is_admin!==true||step?.type!=='form'||
     typeof step.flow_id!=='string'||typeof hass.callApi!=='function')
    throw new Error('Multimedia configuration cannot be submitted');
  return hass.callApi('POST',`config/config_entries/options/flow/${encodeURIComponent(step.flow_id)}`,data);
}
async function rhiMmOptionsCancel(hass,step){
  if(!step?.flow_id||typeof hass?.callApi!=='function')return;
  await hass.callApi('DELETE',`config/config_entries/options/flow/${encodeURIComponent(step.flow_id)}`);
}
