const RHI_MM_PC_KEYS=['UP','DOWN','LEFT','RIGHT','ENTER','ESC','TAB','SPACE','HOME','END','PAGEUP','PAGEDOWN','BACKSPACE','DELETE',...Array.from({length:10},(_,i)=>String(i)),...Array.from({length:12},(_,i)=>'F'+(i+1))];
const RHI_MM_WHOLE_TYPES=['watch_tv','watch_hdmi','watch_source','listen_music','play_game','work_on_pc'];
const RHI_MM_WHOLE_STEPS=['source','volume','mute','sound_mode','play','pause','remote_key','delay','wait_until'];
function rhiMmWholeFromStep(step){
  const yaml=(step?.data_schema||[]).find(x=>x.name==='yaml_text');
  const raw=yaml?.description?.suggested_value??yaml?.default;
  const doc=JSON.parse(raw);
  if(!doc||typeof doc!=='object'||Array.isArray(doc)||!doc.rooms||typeof doc.rooms!=='object')
    throw Error('Invalid native whole-home configuration');
  const context=step.description_placeholders||{};
  const areas=JSON.parse(context.areas_json||'{}');
  const floors=JSON.parse(context.floors_json||'{}');
  const areaFloors=JSON.parse(context.area_floors_json||'{}');
  const sources=JSON.parse(context.sources_json||'[]');
  const computerIO=JSON.parse(context.computer_io_json||'[]');
  const captureCandidates=JSON.parse(context.capture_candidates_json||'{}');
  const logicalDevices=JSON.parse(context.logical_devices_json||'[]');
  const proposedRooms=JSON.parse(context.proposed_rooms_json||'{}');
  const proposalExceptions=JSON.parse(context.proposal_exceptions_json||'[]');
  const localScope=JSON.parse(context.expert_scope_json||'null');
  const deviceCatalog=context.device_catalog_json!==undefined?JSON.parse(context.device_catalog_json):null;
  const deviceContract=JSON.parse(context.device_contract_json||'null');
  const room=localScope?.[1]||Object.keys(doc.rooms)[0]||'';
  const tab=localScope?({room:'rooms',device:'devices',activity:'activities'})[localScope[0]]:'discovery';
  const draft={doc,areas,floors,areaFloors,sources,computerIO,captureCandidates,logicalDevices,proposedRooms,proposalExceptions,localScope,room,deviceCatalog,deviceContract,deviceDetail:'',roomDeviceEditor:false,
    device:localScope?.[0]==='device'?localScope[2]:'',activity:localScope?.[0]==='activity'?localScope[2]:'',tab,
    catalogFilter:'all',catalogType:'all',catalogQuery:'',bulkRoom:room,selectedAssets:[],detailAsset:'',dirty:false,error:'',newRoom:'',newRoomArea:'',newArea:Object.keys(areas)[0]||'',newSource:'',
    newPcApplication:'',newActivity:'',newType:'watch_tv',newActivityTarget:'',newActivityInput:'',newActivitySource:'',captureDevices:[],captureVolume:false,captureMute:false};
  rhiMmWholeInstall(draft,doc,deviceCatalog);
  return draft;
}

// One transient semantic draft. The existing room widgets see a lightweight
// relationship view, not a second record or a synchronization mechanism.
// The only owning fields in a room are the server-defined membership fields.
const rhiMmOwn=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
function rhiMmMembershipFields(d){return d.deviceContract?.membership_fields||['role','name','room_area'];}
function rhiMmAssetId(device){return device.asset_ref||device.asset_id||device.physical_id||device.entity;}
function rhiMmWholeLocalFields(d,device){
  return Object.fromEntries(rhiMmMembershipFields(d).filter(k=>rhiMmOwn(device,k)).map(k=>[k,device[k]]));
}
function rhiMmWholeSharedFields(d,device){
  return Object.fromEntries(Object.entries(device).filter(([k])=>k!=='asset_ref'&&k!=='device_label'&&!rhiMmMembershipFields(d).includes(k)));
}
function rhiMmWholeSame(a,b){
  if(a===b)return true;
  if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
  const keys=Object.keys(a);
  return keys.length===Object.keys(b).length&&keys.every(k=>rhiMmOwn(b,k)&&rhiMmWholeSame(a[k],b[k]));
}
function rhiMmWholeLink(d,asset,membership){
  const owner=d.deviceCatalog[asset],local=rhiMmWholeLocalFields(d,membership);
  if(!owner)throw Error('Missing configured Device reference');
  const isLocal=key=>rhiMmMembershipFields(d).includes(key);
  const visible=key=>key!=='device_label'&&key!=='asset_ref';
  return new Proxy(local,{
    get(target,key){return key==='asset_ref'?asset:isLocal(key)?target[key]:visible(key)?owner[key]:undefined;},
    set(target,key,value){
      if(!visible(key)||key==='__proto__'||key==='constructor'||key==='prototype')return false;
      (isLocal(key)?target:owner)[key]=value;return true;
    },
    deleteProperty(target,key){return visible(key)&&delete (isLocal(key)?target:owner)[key];},
    ownKeys(target){return [...new Set([...Object.keys(target),...Object.keys(owner).filter(visible)])];},
    has(target,key){return key==='asset_ref'||visible(key)&&rhiMmOwn(isLocal(key)?target:owner,key);},
    getOwnPropertyDescriptor(target,key){
      const obj=isLocal(key)?target:owner;
      return visible(key)&&rhiMmOwn(obj,key)?{configurable:true,enumerable:true,writable:true,value:obj[key]}:undefined;
    }
  });
}
function rhiMmWholeInstall(d,document,retained=null){
  // Exact scoped expert documents intentionally keep their old local view.
  // Invalid expanded imports stay repairable, without picking a winner.
  const copy=JSON.parse(JSON.stringify(document));
  const canonical=rhiMmOwn(copy,'device_catalog');
  if(d.localScope&&!canonical){d.doc=copy;d.deviceCatalog=null;d.canonicalWire=false;return;}
  const catalog=Object.assign(Object.create(null),canonical?copy.device_catalog:retained||{});
  const roomRows=Object.values(copy.rooms||{});
  const seen=Object.create(null);
  if(!canonical){
    for(const room of roomRows)for(const device of Object.values(room.devices||{})){
      const asset=rhiMmAssetId(device),shared=rhiMmWholeSharedFields(d,device);
      if(!asset||rhiMmOwn(seen,asset)&&!rhiMmWholeSame(seen[asset],shared)){
        d.doc=copy;d.deviceCatalog=null;d.canonicalWire=false;return;
      }
      seen[asset]=shared;
      const label=catalog[asset]?.device_label||device.name;
      catalog[asset]={...shared,...(label?{device_label:label}:{})};
    }
  }
  // Validate reference shape before replacing the existing editable view.
  for(const room of roomRows)for(const device of Object.values(room.devices||{})){
    const asset=rhiMmAssetId(device);
    if(!asset||!rhiMmOwn(catalog,asset)||!catalog[asset]||typeof catalog[asset]!=='object')
      throw Error('Invalid native Device reference');
  }
  d.deviceCatalog=catalog;d.canonicalWire=!!d.deviceContract&&!d.localScope;
  delete copy.device_catalog;
  for(const room of roomRows)for(const [key,device] of Object.entries(room.devices||{}))
    room.devices[key]=rhiMmWholeLink(d,rhiMmAssetId(device),device);
  d.doc=copy;
}
function rhiMmWholeDocument(d,canonical=d.canonicalWire){
  if(!canonical||!d.deviceCatalog)return d.doc;
  const rooms=Object.fromEntries(Object.entries(d.doc.rooms).map(([roomId,room])=>[roomId,{
    ...room,devices:Object.fromEntries(Object.entries(room.devices||{}).map(([key,device])=>[key,{
      asset_ref:rhiMmAssetId(device),...rhiMmWholeLocalFields(d,device)}]))}]));
  return {...d.doc,rooms,device_catalog:d.deviceCatalog};
}
function rhiMmWholeWireText(d){return d.rawDraft??JSON.stringify(rhiMmWholeDocument(d),null,2);}
function rhiMmWholeSnapshot(d){return JSON.parse(JSON.stringify(rhiMmWholeDocument(d,!!d.deviceCatalog)));}
function rhiMmPcApplicationIds(device){
  if(device?.windows_native)return [...(device.windows_native.applications||[])];
  const io=device?.computer_io||{};
  return Object.keys(io).filter(k=>/^launch_[a-z][a-z0-9_]{0,39}$/.test(k)&&io['process_'+k.slice(7)]).map(k=>k.slice(7)).sort();
}
function rhiMmWholeSlug(name){
  return String(name||'').normalize('NFKD').toLowerCase()
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_')
    .replace(/^_+|_+$/g,'');
}
function rhiMmWholeEditDevice(device,mutate){mutate(device);}
// Deliberate re-approval of a currently registered exact source; no new
// scanner, store, writer or physical command outside the native Options Flow.
function rhiMmWholeRepairable(d){
  const rows=[];
  for(const [roomId,room] of Object.entries(d.doc.rooms||{})){
    for(const [key,device] of Object.entries(room.devices||{})){
      if(device.control_approved===false)continue;
      const candidates=d.sources.filter(src=>src.entity===device.entity&&
        src.concept===device.foundation_concept&&!src.review_reason&&
        src.entity_registry_id&&src.config_entry_id&&src.provider&&src.candidate);
      if(candidates.length!==1)continue;
      const src=candidates[0];
      if((device.foundation_entity_registry_id&&device.foundation_entity_registry_id!==src.entity_registry_id)||
         (device.foundation_config_entry_id&&device.foundation_config_entry_id!==src.config_entry_id)||
         (device.foundation_device_registry_id!=null&&device.foundation_device_registry_id!==src.native_device_id)||
         (device.foundation_provider&&device.foundation_provider!==src.provider))continue;
      const metadata={foundation_candidate_id:src.candidate,
        foundation_entity_registry_id:src.entity_registry_id,
        foundation_config_entry_id:src.config_entry_id,
        foundation_device_registry_id:src.native_device_id??null,
        foundation_provider:src.provider,control_approved:true};
      if(Object.entries(metadata).some(([name,value])=>device[name]!==value))
        rows.push({roomId,key,metadata});
    }
  }
  return rows;
}
// Presentation matching is not command authorization. Preserve the saved
// endpoint/asset identity independently of a changed Foundation concept.
function rhiMmWholeSharedRole(d,role){
  const local=rhiMmWholeLocalFields(d,role);
  if(!d.deviceCatalog){
    // Legacy conflict repair remains local; do not silently pick one of
    // several incompatible room records.
    const rows=Object.values(d.doc.rooms).flatMap(r=>Object.values(r.devices||{})).filter(x=>x.entity===role.entity);
    if(rows.length&&!rows.every(x=>rhiMmWholeSame(rhiMmWholeSharedFields(d,x),rhiMmWholeSharedFields(d,rows[0]))))return null;
    return rows.length?{...JSON.parse(JSON.stringify(rhiMmWholeSharedFields(d,rows[0]))),...local}:JSON.parse(JSON.stringify(role));
  }
  const existing=Object.entries(d.deviceCatalog).filter(([,x])=>x.entity===role.entity);
  if(existing.length>1)return null;
  const asset=existing[0]?.[0]||rhiMmAssetId(role);
  if(!asset)return null;
  if(existing.length&&existing[0][1].foundation_concept!==role.foundation_concept)return null;
  if(!existing.length&&rhiMmOwn(d.deviceCatalog,asset))return null;
  if(!existing.length)d.deviceCatalog[asset]={...rhiMmWholeSharedFields(d,role),...(role.name?{device_label:role.name}:{})};
  return rhiMmWholeLink(d,asset,local);
}
function rhiMmWholeAssetMatches(asset,device){
  if(!asset||!device)return false;
  return !!((device.asset_id&&device.asset_id===asset.asset_id)||
    (device.physical_id&&device.physical_id===asset.asset_id)||
    (asset.candidates||[]).some(c=>c.entity_id===device.entity||
      (device.foundation_entity_registry_id&&
       device.foundation_entity_registry_id===c.entity_registry_id)));
}
function rhiMmWholeAssetBindings(room,asset){
  return Object.entries(room?.devices||{}).filter(([,device])=>rhiMmWholeAssetMatches(asset,device));
}
function rhiMmWholeVerifiedMacs(d,device){
  // Native Device Registry MAC evidence is read-only before Review/Save.
  // Command rights remain enforced by the backend and must not follow discovery.
  const matches=d.sources.filter(s=>s.entity===device?.entity&&
    s.concept===device?.foundation_concept&&
    s.candidate===device?.foundation_candidate_id&&
    !s.review_reason&&s.entity_registry_id&&s.config_entry_id&&s.provider);
  return matches.length===1?matches[0].verified_macs||[]:[];
}
function rhiMmWholeProposeCapture(d,room){
  // Only configured, backend-observed eligible endpoints. Never guess which
  // of several active devices of a role belongs to this activity.
  const roles=d.newType==='work_on_pc'?['network','display','amplifier']:
    d.newType==='listen_music'?['amplifier','source']:
    ['watch_source','play_game'].includes(d.newType)?['display','amplifier','source']:['display','amplifier'];
  const keys=d.captureCandidates?.[d.room]||[];
  return roles.flatMap(role=>{
    const matches=keys.filter(key=>room?.devices?.[key]?.foundation_concept===role);
    return matches.length===1?matches:[];
  });
}
function rhiMmWholeCurrent(d){
  if(d.localScope){
    const [scope,room,id]=d.localScope;
    d.room=room;d.tab=({room:'rooms',device:'devices',activity:'activities'})[scope];
    if(scope==='device')d.device=id;
    if(scope==='activity')d.activity=id;
  }
  const room=d.doc.rooms[d.room];
  if(d.captureRoom!==d.room||d.captureType!==d.newType){
    d.captureRoom=d.room;d.captureType=d.newType;
    d.captureDevices=rhiMmWholeProposeCapture(d,room);
  }
  if(room){
    if(!Object.prototype.hasOwnProperty.call(room.devices||{},d.device))
      d.device=Object.keys(room.devices||{})[0]||'';
    if(!Object.prototype.hasOwnProperty.call(room.activities||{},d.activity))
      d.activity=Object.keys(room.activities||{})[0]||'';
  }
  const ownerMode=d.tab==='devices'&&!d.localScope&&d.deviceContract&&d.deviceCatalog&&!d.roomDeviceEditor;
  if(ownerMode&&!d.deviceCatalog[d.deviceDetail])d.deviceDetail=Object.keys(d.deviceCatalog)[0]||'';
  return {room,device:ownerMode?d.deviceCatalog[d.deviceDetail]:room?.devices?.[d.device],activity:room?.activities?.[d.activity],ownerMode};
}
function rhiMmWholeText(d){
  if(d.rawDraft!=null)return d.rawDraft;
  if(!d.localScope)return rhiMmWholeWireText(d);
  const [scope,roomId,id]=d.localScope;
  const {room,device,activity}=rhiMmWholeCurrent(d);
  const object={...(scope==='room'?room:scope==='device'?device:activity)};
  if(scope==='room'){delete object.devices;delete object.activities;}
  return JSON.stringify({scope,room:roomId,id,object},null,2);
}
// Translate only known editor feedback. Unknown native/backend evidence
// stays verbatim and copyable; never translate entity IDs or route values.
function rhiMmWholeLocalMessage(message,t){
  const raw=String(message||'');
  const entries=Object.entries(RHI_MM_TEXT.en).filter(([key])=>key.startsWith('wh_msg_'));
  const exact=entries.find(([,english])=>english===raw);
  if(exact)return t(exact[0]);
  const prefix=entries.find(([,english])=>english.endsWith(': ')&&raw.startsWith(english));
  return prefix?t(prefix[0])+rhiMmWholeLocalMessage(raw.slice(prefix[1].length),t):raw;
}
function rhiMmWholeIssueAsset(d,path){
  // Asset IDs can include provider delimiters and dots. Match exact catalog
  // keys, longest first, rather than parsing them as room slugs.
  return Object.keys(d.deviceCatalog||{}).sort((a,b)=>b.length-a.length)
    .find(id=>path==='devices.'+id||path.startsWith('devices.'+id+'.'));
}
function rhiMmWholeIssues(d){
  const detail=d.validationDetail||'';
  const groups=new Map(),general=[];
  for(const line of [...new Set(detail.split('\n').filter(Boolean))]){
    const match=/^(rooms\.([a-z][a-z0-9_]*)(?:\.(devices|activities)\.([a-z][a-z0-9_]*))?(?:\.[a-z_]+(?:\[\d+\])?)*):\s*(.*)$/.exec(line);
    if(!match||!d.doc.rooms[match[2]]){
      const split=line.indexOf(': ');
      const path=split<0?'':line.slice(0,split);
      const asset=rhiMmWholeIssueAsset(d,path);
      if(asset){
        const owner=d.deviceCatalog[asset],groupKey='device:'+asset;
        const group=groups.get(groupKey)||{name:owner.device_label||owner.entity,items:[]};
        group.items.push({path,object:owner.device_label||owner.entity,message:line.slice(split+2),kind:'device'});
        groups.set(groupKey,group);continue;
      }
      general.push(line);continue;
    }
    const [,path,roomId,kind,key,reason]=match;
    const room=d.doc.rooms[roomId];
    const object=kind?room[kind]?.[key]:room;
    // Field-specific messages are the repair actions; retain exact technical
    // details separately. Avoid repeating the same room-level validation error.
    let message=reason;
    if(path.endsWith('.entity'))message='Choose the existing Home Assistant device.';
    else if(path.endsWith('.area_id'))message='Choose the room in Home Assistant.';
    else if(path.endsWith('.foundation_candidate_id'))message='Link the exact discovered device.';
    else if(path.endsWith('.candidates')&&kind==='activities')message='Choose a verified native input for this activity.';
    const group=groups.get(roomId)||{name:room.name||roomId,items:[]};
    group.items.push({path,object:object?.name||key||room.name||roomId,message,kind});
    groups.set(roomId,group);
  }
  for(const group of groups.values()){
    group.items=group.items.filter(item=>item.kind||!group.items.some(other=>
      other.kind&&item.message.includes('/'+other.path.split('.')[3]+':')&&
      other.path.endsWith('.entity')&&item.message.includes('requires native media_player or remote entity')));
  }
  return {groups:[...groups.values()],general};
}
function rhiMmWholeCaptureRequest(d,update=false){
  const {room,activity}=rhiMmWholeCurrent(d);
  const devices=(d.captureDevices||[]).filter(key=>room?.devices?.[key]);
  if(d.localScope||!room||!devices.length||d.rawDraft!=null)return null;
  if(update&&(!activity||devices.some(key=>!activity.devices.includes(key))))return null;
  if(!update&&!d.newActivity.trim())return null;
  return {room:d.room,activity:update?d.activity:'',name:update?(activity.name||d.activity):d.newActivity,
    activity_type:update?(activity.activity_type||'watch_tv'):d.newType,
    devices,include_volume:d.captureVolume===true,include_mute:d.captureMute===true};
}
function rhiMmWholeRender(d,t,escape,remediation=''){
  const e=escape;
  const count=(n,kind)=>n+' '+e(t('wh_count_'+(n===1?kind:kind==='activity'?'activities':kind+'s')));
  if(!d)return `<p role='alert'>${e(t('wh_unreadable'))}</p>`;
  const local=!!d.localScope;
  const specialist=(id,label)=>local?'':`<button type='button' data-wh-action='specialist' data-wh-id='${id}'>${escape(label)}</button>`;
  const deviceAction=(action,label,asset='')=>local||!d.deviceContract?.actions?.includes(action)?'':
    `<button type='button' data-wh-action='device_option' data-wh-id='${e(action)}' data-wh-asset='${e(asset)}'>${e(label)}</button>`;
  const deviceFirst=!local&&d.deviceCatalog!=null&&!!d.deviceContract;
  const entry=(id,label,active,action)=>`<button type='button' data-wh-action='${action}'
    data-wh-id='${e(id)}' aria-pressed='${active}'>${e(label)}</button>`;
  const field=(key,value,kind='text',extra='')=>{
    const props=`data-wh-field='${e(key)}' ${extra}`;
    return kind==='checkbox'?`<input type='checkbox' ${props} ${value===true?'checked':''}>`:
      `<input type='${kind}' ${props} value='${e(value??'')}'/>`;
  };
  const select=(key,value,items,extra='')=>`<select data-wh-field='${e(key)}' ${extra}>`+
    items.map(([id,label])=>`<option value='${e(id)}' ${value===id?'selected':''}>${e(label)}</option>`).join('')+
    '</select>';
  const sections=[
    ['discovery',t('wh_discovered'),'mdi:devices'],
    ['rooms',t('settings_floor_rooms'),'mdi:floor-plan'],
    ['devices',t('devices'),'mdi:television'],
    ['activities',t('activities'),'mdi:play-box-multiple-outline']
  ];
  // The main product tabs already select Discovery vs Settings. Only Settings
  // needs the Rooms/Devices/Activities *object categories* as local navigation.
  // No second competing Discovery tab in the whole-home editor.
  const localSections=local||d.workspace==='discovery'?[]:
    d.workspace==='settings'?sections.filter(x=>x[0]!=='discovery'):sections;
  const rooms=Object.entries(d.doc.rooms);
  const {room,device,activity,ownerMode}=rhiMmWholeCurrent(d);
  const floorRooms=new Map();
  for(const [id,r] of rooms){
    const floorId=d.areaFloors[r.area_id]||'__unassigned__';
    if(!floorRooms.has(floorId))floorRooms.set(floorId,[]);
    floorRooms.get(floorId).push([id,r]);
  }
  const roomButtons=[...floorRooms].map(([floorId,items])=>
    `<div class='mm-wh-floor-group'><strong>${e(d.floors[floorId]||t('wh_floor_missing'))} · ${count(items.length,'room')}</strong>
      <div class='mm-wh-list'>${items.map(([id,r])=>entry(id,r.name||id,id===d.room,'select_room')).join('')}</div>
    </div>`).join('');
  const associatedTrackers=new Set(d.sources.filter(s=>s.concept!=='network'&&s.provider!=='hass_agent').flatMap(s=>(s.network_observations||[]).map(x=>x.candidate_id)));
  const configuredOwners=d.deviceCatalog?Object.values(d.deviceCatalog):Object.values(d.doc.rooms||{}).flatMap(r=>Object.values(r.devices||{}));
  const boundCompanions=new Set(configuredOwners.map(x=>x.computer_agent?.entity).filter(Boolean));
  const sourceRows=d.sources.map((s,i)=>[String(i),`${s.label} · ${s.logical_type||s.concept} · ${s.provider}${s.approved?'':' · '+ t('wh_pending_approval')}${s.review_reason?' · '+t('wh_needs_review')+': '+s.review_reason:''}${s.available?'':' · '+t('unavailable')}`]).filter(([index])=>!boundCompanions.has(d.sources[Number(index)].entity)&&(d.sources[Number(index)].concept!=='network'||!associatedTrackers.has(d.sources[Number(index)].candidate)));
  const deviceRows=Object.entries(room?.devices||{});
  const activityRows=Object.entries(room?.activities||{});
  const roomAreas=Object.entries(room?.room_areas||{});
  const roomAreaChoices=[['',t('wh_whole_room')],...roomAreas.map(([id,area])=>[id,area.name])];
  const currentDevice=d.device&&room?.devices?.[d.device]?d.device:deviceRows[0]?.[0]||'';
  const currentActivity=d.activity&&room?.activities?.[d.activity]?d.activity:activityRows[0]?.[0]||'';
  const selectedDevice=ownerMode?device:room?.devices?.[currentDevice];
  const selectedActivity=room?.activities?.[currentActivity];
  const currentWake=selectedDevice?.power_on?.action==='wake_on_lan.send_magic_packet'
    ?selectedDevice.power_on.data||{}:null;
  const verifiedMacs=rhiMmWholeVerifiedMacs(d,selectedDevice);
  const agentChoices=d.sources.filter(s=>s.provider==='hass_agent'&&s.concept==='source'&&s.entity.startsWith('media_player.')&&!s.review_reason&&s.candidate&&s.entity_registry_id&&s.config_entry_id&&s.native_device_id);
  const agentCurrent=selectedDevice?.computer_agent?.foundation_candidate_id||'';
  const sameNativeCandidates=d.sources.filter(s=>s.entity===selectedDevice?.entity&&
    s.concept===selectedDevice?.foundation_concept);
  const unresolvedDevice=!!selectedDevice&&(String(selectedDevice.entity||'').startsWith('REPLACE_WITH_')||!sameNativeCandidates.length);
  const resolveChoices=d.sources.map((source,index)=>[String(index),source]).filter(([,source])=>
    source.concept===selectedDevice?.foundation_concept&&!source.review_reason&&
    source.entity_registry_id&&source.config_entry_id&&source.candidate&&
    (selectedDevice?.foundation_concept==='network'?source.entity.startsWith('device_tracker.'):selectedDevice?.entity?.startsWith('remote.')?source.entity.startsWith('remote.'):source.entity.startsWith('media_player.')));
  const currentCandidate=selectedDevice?.foundation_candidate_id||'';
  const bindingCurrent=sameNativeCandidates.some(s=>s.candidate===currentCandidate&&
    (!selectedDevice?.foundation_entity_registry_id||selectedDevice.foundation_entity_registry_id===s.entity_registry_id)&&
    (!selectedDevice?.foundation_config_entry_id||selectedDevice.foundation_config_entry_id===s.config_entry_id)&&
    (!selectedDevice?.foundation_device_registry_id||selectedDevice.foundation_device_registry_id===s.native_device_id)&&
    (!selectedDevice?.foundation_provider||selectedDevice.foundation_provider===s.provider)&&!s.review_reason);
  const nativeBindingChoices=[
    ...(!bindingCurrent&&selectedDevice?[[currentCandidate,(currentCandidate||selectedDevice.entity||t('wh_compatible_native'))+' · '+t('wh_no_longer_selected')]]:[]),
    ...sameNativeCandidates.map(s=>[s.candidate,s.label+' · '+s.provider])
  ];
  const allDiscovered=(d.logicalDevices||[]).map(asset=>{
    const linkedRoomIds=rooms.filter(([,r])=>rhiMmWholeAssetBindings(r,asset).length).map(([id])=>id);
    const linkedRooms=linkedRoomIds.map(id=>d.doc.rooms[id]?.name||id);
    return {...asset,linkedRoomIds,linkedRooms};
  });
  const discovered=allDiscovered.filter(asset=>{
    if(d.catalogType!=='all'&&asset.logical_type!==d.catalogType)return false;
    if(d.catalogFilter==='unassigned'&&asset.linkedRooms.length)return false;
    if(d.catalogFilter==='in_room'&&!asset.linkedRoomIds.includes(d.bulkRoom))return false;
    if(d.catalogFilter==='shared'&&asset.linkedRoomIds.length<2)return false;
    if(d.catalogFilter==='classified'&&asset.classification_status!=='classified')return false;
    if(d.catalogFilter==='review'&&!asset.needs_review)return false;
    const q=(d.catalogQuery||'').trim().toLowerCase();
    return !q||[asset.name,asset.logical_type,asset.model,
      ...(asset.candidates||[]).map(x=>x.entity_id),
      ...(asset.source_entities||[]).map(x=>x.entity_id)].join(' ').toLowerCase().includes(q);
  });
  const deviceSettings=()=>`        <label class='mm-wh-check'>${e(t('wh_enable_controls'))} ${field('device_control_approved',selectedDevice.control_approved===true,'checkbox')}</label>
        <small>${e(t('wh_exact_permissions'))}</small>
        ${unresolvedDevice?`<label>${e(t('device'))}
          ${select('device_resolve','',[['',selectedDevice.entity||t('wh_compatible_native')],...resolveChoices.map(([id,s])=>[id,s.label+' · '+(d.areas[s.area_id]||t('wh_area_not_assigned'))+' · '+s.provider])],"aria-invalid='true' style='border-color:var(--error-color,#db4437)'")}</label>
          <small>${e(t('wh_preserve_role'))}</small>
          ${!resolveChoices.length?`<p class='mm-muted'>${e(t('wh_no_compatible'))}</p>`:''}`:
          `<label>${e(t('device'))}
          ${select('device_candidate',currentCandidate,nativeBindingChoices,(sameNativeCandidates.length?'':'disabled')+(!bindingCurrent?" aria-invalid='true' style='border-color:var(--error-color,#db4437)'":''))}</label>`}
        ${unresolvedDevice?`<p class='mm-room-error'>${e(t('wh_link_missing'))}</p>`:
          !bindingCurrent?`<p class='mm-room-error'>${e(t('wh_link_review'))}</p>`:
          sameNativeCandidates.every(x=>!x.approved)?
          `<p class="mm-room-error">${e(t('wh_approval_pending'))}</p>`:
          sameNativeCandidates.every(x=>!x.available)?`<p class="mm-muted">${e(t('wh_linked_offline'))}</p>`:''}
        <details><summary>${e(t('wh_native_identity'))}</summary><p class='mm-selectable'>${e(selectedDevice.entity||'')} · ${e(ownerMode?d.deviceDetail:currentDevice)}</p>
          ${(d.sources.find(x=>x.entity===selectedDevice.entity&&
            x.candidate===selectedDevice.foundation_candidate_id)?.related_entities||[])
            .map(x=>`<div><code>${e(x.entity_id)}</code> · ${e(x.provider||x.domain||'native')}
              · ${e(x.availability)}</div>`).join('')}
        </details>
        <label>${e(t('wh_power_behaviour'))}${select('device_power',selectedDevice.power_mode||'native',
          [['native',t('wh_auto_wol')],['passive',t('wh_passive_observe')]])}</label>
        ${selectedDevice.foundation_concept==='network'?`<p class='mm-muted'>${e(t('wh_network_readiness'))}</p>`:`<label class='mm-wh-check'>${e(t('wh_cec_enabled'))} ${field('device_cec',selectedDevice.hdmi_cec_enabled===true,'checkbox')}</label>`}
        ${(d.sources.find(s=>s.entity===selectedDevice.entity&&s.candidate===selectedDevice.foundation_candidate_id)?.network_observations||[]).map(observation=>`<small>${e(observation.entity_id)} · ${e(observation.state)}</small>`).join('')}
        ${selectedDevice.foundation_concept==='network'?`<label class='mm-wh-check'>${e(t('wh_windows_native'))} ${field('device_windows_enable',!!selectedDevice.windows_native,'checkbox')}</label>
          ${selectedDevice.windows_native?`<details open><summary>${e(t('wh_windows_native'))}</summary>
          <small>${e(t('wh_windows_help'))}</small>
          <label>${e(t('wh_network_address'))}${select('device_windows:host',selectedDevice.windows_native.host||'',[
            ['',t('wh_choose_source')],...Array.from(new Set([...(d.sources.find(s=>s.entity===selectedDevice.entity&&s.candidate===selectedDevice.foundation_candidate_id)?.network_ipv4_choices||[]),...(selectedDevice.windows_native.host?[selectedDevice.windows_native.host]:[])])).map(ip=>[ip,ip])])}</label>
          ${['computer_name','endpoint','credential_ref','ca_file'].map(k=>`<label>${e(t('wh_windows_'+k))}${field('device_windows:'+k,selectedDevice.windows_native[k]||'')}</label>`).join('')}
          <label>${e(t('wh_windows_apps'))}${field('device_windows:applications',(selectedDevice.windows_native.applications||[]).join(','))}</label>
          <small>${e(t('wh_windows_secret_help'))}</small></details>`:''}` : ''}
        ${selectedDevice.foundation_concept==='network'&&!selectedDevice.windows_native?`<label>${e(t('wh_computer_agent'))}${select('device_computer_agent',agentCurrent,[['',t('wh_no_agent')],...(!agentChoices.some(s=>s.candidate===agentCurrent)&&agentCurrent?[[agentCurrent,selectedDevice.computer_agent.entity+' · '+t('wh_no_longer_selected')]]:[]),...agentChoices.map(s=>[s.candidate,s.label+' · '+s.entity])])}</label><small>${e(t('wh_agent_help'))}</small>`:''}
        ${selectedDevice.foundation_concept==='network'&&!selectedDevice.windows_native?['shutdown','restart','launch','session','process',...Array.from(new Set([...Object.keys(selectedDevice.computer_io||{}).filter(k=>/^(launch|process)_[a-z][a-z0-9_]{0,39}$/.test(k)).map(k=>k.slice(k.indexOf('_')+1)),...(/^[a-z][a-z0-9_]{0,39}$/.test(d.newPcApplication)?[d.newPcApplication]:[])])).sort().flatMap(id=>['launch_'+id,'process_'+id])].map(role=>{
          const current=selectedDevice.computer_io?.[role];
          const sensorRole=['session','process'].includes(role)||role.startsWith('process_');
          const choices=(d.computerIO||[]).filter(s=>sensorRole?s.entity.startsWith('sensor.'):s.entity.startsWith('button.')||s.entity.startsWith('switch.'));
          const label=/^(launch|process)_/.test(role)?t('wh_pc_'+role.split('_')[0])+' · '+role.slice(role.indexOf('_')+1):t('wh_pc_'+role);
          return `<label>${e(label)}${select('device_computer_io:'+role,current?.foundation_candidate_id||'',[['',t('wh_no_agent')],...(!choices.some(s=>s.candidate===current?.foundation_candidate_id)&&current?[[current.foundation_candidate_id,current.entity+' · '+t('wh_no_longer_selected')]]:[]),...choices.map(s=>[s.candidate,s.label+' · '+s.entity])])}</label>`;
        }).join('')+`<details><summary>${e(t('wh_pc_keys'))}</summary><small>${e(t('wh_pc_keys_help'))}</small>${(d.deviceContract?.pc_keys||RHI_MM_PC_KEYS).map(key=>{
          const role='key_'+key.toLowerCase(),current=selectedDevice.computer_io?.[role];
          const choices=(d.computerIO||[]).filter(s=>s.entity.startsWith('button.'));
          return `<label>${e(key)}${select('device_computer_io:'+role,current?.foundation_candidate_id||'',[['',t('wh_no_agent')],...(!choices.some(s=>s.candidate===current?.foundation_candidate_id)&&current?[[current.foundation_candidate_id,current.entity+' · '+t('wh_no_longer_selected')]]:[]),...choices.map(s=>[s.candidate,s.label+' · '+s.entity])])}</label>`;
        }).join('')}</details><label>${e(t('wh_pc_application_id'))}${field('new_pc_application',d.newPcApplication||'')}</label><small>${e(t('wh_pc_application_help'))}</small><small>${e(t('wh_pc_io_help'))}</small>`:''}
        <label>${e(t('wh_after_power'))}${field('device_delay',selectedDevice.post_power_on_delay_ms??0,'number','min="0" max="30000" step="1"')}</label>
        <details class='mm-wh-device-wol' ${currentWake?'open':''}>
          <summary>${e(t('wh_wol_optional'))}</summary>
          <label>${e(t('wh_power_method'))}${select('device_wol_mode',currentWake&&selectedDevice.wol_enabled!==false?'directed':'native',
            [['native',t('wh_native_no_wol')],['directed',t('wh_wol_lan')]])}</label>
          <label>${e(t('wh_mac_verified'))} ${select('device_wol_mac',
            currentWake?.mac||'',[['',t('wh_choose_mac')],...verifiedMacs.map(mac=>[mac,mac])])}</label>
          ${currentWake?`<label>${e(t('wh_ipv4_optional'))}
            ${field('device_wol_ip',currentWake.broadcast_address||'')}</label>
            ${(d.sources.find(s=>s.entity===selectedDevice.entity&&s.candidate===selectedDevice.foundation_candidate_id)?.network_ipv4_choices||[]).map(ip=>`<small>${e(t('wh_network_address'))}: ${e(ip)}</small>`).join('')}
            <label>${e(t('wh_port'))} ${field('device_wol_port',currentWake.broadcast_port??9,'number','min="1" max="65535" step="1"')}</label>`:''}
          ${currentWake&&!local?`<button type='button' data-wh-action='clear_wol'>${e(t('wh_clear_wol'))}</button>`:''}
          <small>${e(t('wh_verified_macs'))}: ${e(verifiedMacs.join(', ')||t('wh_no_mac'))}.
            ${e(t('wh_wol_help'))}</small>
          ${selectedDevice.power_mode==='passive'?
            `<small>${e(t('wh_passive_wol'))}</small>`:''}
        </details>
        <small>${e(t('wh_separate_cec_wol'))}</small>
`;
  let content='';
  if(d.tab==='discovery'){
    const currentAsset=discovered.find(x=>x.asset_id===d.detailAsset)||
      (d.logicalDevices||[]).find(x=>x.asset_id===d.detailAsset);
    const bindings=rhiMmWholeAssetBindings(room,currentAsset);
    const assigned=bindings.length===1?bindings[0]:null;
    const currentBinding=assigned?.[1];
    const connected=d.sources.find(x=>x.entity===currentBinding?.entity&&x.candidate===currentBinding?.foundation_candidate_id);
    const wol=currentBinding?.power_on?.action==='wake_on_lan.send_magic_packet';
    const enabledWol=wol&&currentBinding?.wol_enabled!==false;
    const assets=discovered;
    const repairs=rhiMmWholeRepairable(d);
    const selectedRepair=repairs.find(x=>x.roomId===d.bulkRoom&&x.key===assigned?.[0]);
    const types=[...new Set((d.logicalDevices||[]).map(x=>x.logical_type).filter(Boolean))].sort();
    content=`<div class='mm-wh-grid mm-wh-discovery'><section class='mm-wh-panel'>
      <div class='mm-wh-heading'><div><h4>${e(t('wh_discovery_heading'))}</h4>
        <p>${e(t('wh_found'))} ${allDiscovered.length} ${e(t('wh_supported_devices'))} · ${allDiscovered.filter(x=>!x.linkedRoomIds.length).length} ${e(t('wh_unassigned_draft'))}</p></div>
        <div class='mm-wh-step-actions'>
          ${deviceFirst?deviceAction('device_add',t('wh_add_device_native')):''}
          ${specialist('dell_add',t('wh_add_display'))}
          <button type='button' data-wh-action='repair_bindings'
            ${repairs.length?'':'disabled'}>${e(t('review'))} ${repairs.length} ${e(t(repairs.length===1?'wh_saved_link':'wh_saved_links'))}</button>
          <button type='button' data-wh-action='apply_proposals'
            ${Object.keys(d.proposedRooms||{}).length?'':'disabled'}>${e(t('wh_review_setup'))} (${count(Object.keys(d.proposedRooms||{}).length,'room')})</button>
        </div></div>
        ${repairs.length?`<p class="mm-muted">${e(t('wh_review_links'))}</p>`:''}
        ${!Object.keys(d.proposedRooms||{}).length?`<p role='status' class='mm-muted'>${e(t('wh_no_proposals'))}</p>
          <button type='button' data-nav='settings'>${e(t('wh_open_settings'))}</button>`:''}
      <div class='mm-wh-searchfilters'>
        <label>${e(t('wh_search'))} ${field('catalog_query',d.catalogQuery)}</label>
        <label>${e(t('wh_type'))} ${select('catalog_type',d.catalogType,[['all',t('wh_all_types')],...types.map(x=>[x,x.replaceAll('_',' ')])])}</label>
        <label>${e(t('wh_status'))} ${select('catalog_filter',d.catalogFilter,
          [['all',t('wh_all_supported')],['unassigned',t('wh_unassigned')],['in_room',t('wh_assigned_room')],['shared',t('wh_shared_rooms')],['classified',t('wh_classified')],['review',t('wh_needs_review')]])}</label>
      </div>
      <small>${e(t('wh_one_device'))}</small>
      <div class='mm-wh-tablewrap'><table class='mm-wh-table'>
        <thead><tr><th>${e(t('wh_pick'))}</th><th>${e(t('wh_discovered_device'))}</th><th>${e(t('wh_type'))}</th><th>${e(t('wh_status'))}</th><th>${e(t('wh_assigned_rooms'))}</th><th>${e(t('wh_action'))}</th></tr></thead>
        <tbody>${assets.map(asset=>{
          const primary=(asset.candidates||[]).find(x=>x.entity_id.startsWith('media_player.'))||asset.candidates?.[0];
          const availability=primary?.available===true?t('wh_available'):t('wh_temporarily_unavailable');
          const binding=asset.linkedRooms.length?t('wh_configured'):t('wh_not_assigned');
          const approval=asset.approved_candidates>0?t('wh_approved'):t('wh_review_permission');
          const reason=(asset.review_reasons||[]).join(', ');
          const chosen=d.selectedAssets.includes(asset.asset_id);
          return `<tr ${d.detailAsset===asset.asset_id?"class='mm-wh-rowactive'":''}>
            <td>${field('catalog_selected:'+asset.asset_id,chosen,'checkbox')}</td>
            <td><button type='button' data-wh-action='catalog_detail' data-wh-id='${e(asset.asset_id)}'>
              <strong>${e(asset.name||asset.model||primary?.entity_id||t('wh_unknown_device'))}</strong></button>
              <small>${e(asset.model||asset.manufacturer||primary?.provider||t('wh_native_device'))}</small></td>
            <td>${e((asset.logical_type||'media_player').replaceAll('_',' '))}</td>
            <td><strong>${e(binding)}</strong><small>${e(availability)}</small><small>${e(reason?t('wh_needs_review')+': '+reason:approval)}</small></td>
            <td>${e(asset.linkedRooms.join(', ')||t('wh_not_assigned'))}</td>
            <td><button type='button' data-wh-action='assign_catalog' data-wh-id='${e(asset.asset_id)}'
              ${rooms.length?'':'disabled'}>${asset.linkedRoomIds.includes(d.bulkRoom)?t('settings_edit_step'):t('wh_assign')}</button></td>
          </tr>`;
        }).join('')}</tbody></table></div>
      ${!assets.length?`<p>${e(t('wh_no_candidates'))}</p>`:''}
      <div class='mm-wh-bulk'>
        <strong>${d.selectedAssets.length} ${e(t('wh_selected'))}</strong>
        <label>${e(t('wh_assign_room'))} ${select('bulk_room',d.bulkRoom,
          [['',t('wh_choose_room')],...rooms.map(([id,r])=>[id,r.name||id])])}</label>
        <button type='button' data-wh-action='bulk_assign'
          ${!d.selectedAssets.length||!rooms.length?'disabled':''}>${e(t('wh_assign_selected'))}</button>
        <button type='button' data-wh-action='bulk_remove'
          ${!d.selectedAssets.length||!rooms.length?'disabled':''}>${e(t('wh_unassign_selected'))}</button>
        <button type='button' data-wh-action='clear_selected'
          ${d.selectedAssets.length?'':'disabled'}>${e(t('wh_clear_selection'))}</button>
      </div>
      ${(d.proposalExceptions||[]).length?`<details><summary>${d.proposalExceptions.length} ${e(t('wh_routes_review'))}</summary>
        ${d.proposalExceptions.map(x=>`<div>${e(x)}</div>`).join('')}</details>`:''}
    </section><section class='mm-wh-panel mm-wh-detail'>
      <h4>${e(currentAsset?.name||currentAsset?.model||t('wh_select_discovered'))}</h4>
      ${currentAsset?`<p>${e(t('wh_type'))}: ${e(currentAsset.logical_type||'Unknown')} ·
        ${e(currentAsset.linkedRooms?.join(', ')||t('wh_unassigned'))}</p>
        <label>${e(t('wh_room_configure'))} ${select('bulk_room',d.bulkRoom,
          [['',t('wh_choose_room')],...rooms.map(([id,r])=>[id,r.name||id])])}</label>
        ${d.doc.rooms[d.bulkRoom]?`<small>${e(t('wh_native_ha_area'))}:
          ${e(d.areas[d.doc.rooms[d.bulkRoom].area_id]||t('wh_not_assigned'))} · ${e(t('wh_floor'))}:
          ${e(d.floors[d.areaFloors[d.doc.rooms[d.bulkRoom].area_id]]||t('not_published'))}</small>`:''}
        ${bindings.length>1?`<p class='mm-room-error' role='alert'>${e(t('wh_ambiguous_binding'))}</p>`:currentBinding?`
          <p role='status' class='mm-muted'>${e(t('wh_native_control'))}: ${e(currentBinding.control_approved===true?t('wh_exact_source'):t('wh_not_yet_approved'))} · ${e(connected?.review_reason||(!connected?t('wh_candidate_missing'):t('wh_registry_review')))}</p>
          ${currentAsset.linkedRoomIds?.length>1&&['television','display'].includes(currentAsset.logical_type)?`<p class='mm-room-error'>${e(t('wh_display_multiple'))}</p>`:''}
          <button type='button' data-wh-action='focus_binding'>${e(t('wh_review_binding'))}</button>
          ${selectedRepair?`<button type='button' data-wh-action='repair_binding'
            data-wh-id='${e(selectedRepair.roomId+':'+selectedRepair.key)}'>
            ${e(t('wh_review_one_link'))}</button>`:''}
          <label>${e(t('wh_display_name'))} ${field('device_name',currentBinding.name||'')}</label>
          <label>${e(t('wh_role'))} ${select('device_role',currentBinding.role||'player',
            [['display',t('wh_tv_display')],['receiver',t('wh_receiver_zone')],['player',t('role_player')],['remote',t('wh_remote_hub')]])}</label>
          ${Object.keys(d.doc.rooms[d.bulkRoom]?.room_areas||{}).length?`<label>${e(t('wh_zone'))}
            ${select('device_room_area',currentBinding.room_area||'',
              [['',t('wh_whole_room')],...Object.entries(d.doc.rooms[d.bulkRoom].room_areas)
                .map(([id,area])=>[id,area.name])])}</label>`:''}
          ${deviceFirst?`<button type='button' data-wh-action='focus_binding'>${e(t('wh_edit_owner'))}</button>`:`<label>${e(t('wh_power'))} ${select('device_power',currentBinding.power_mode||'native',
            [['native',t('wh_native_wake')],['passive',t('wh_passive')]])}</label>
          <label class='mm-wh-check'>HDMI-CEC ${field('device_cec',currentBinding.hdmi_cec_enabled===true,'checkbox')}</label>
          <label>Wake-on-LAN ${select('device_wol_mode',enabledWol?'directed':'native',
            [['native',t('wh_native_power')],['directed',t('wh_verified_mac')]])}</label>
          <label>${e(t('wh_native_mac'))} ${select('device_wol_mac',
            wol?currentBinding.power_on.data.mac:'',[['',t('wh_choose_mac')],
              ...rhiMmWholeVerifiedMacs(d,currentBinding).map(m=>[m,m])])}</label>
          ${wol?`<label>${e(t('wh_ipv4'))} ${field('device_wol_ip',currentBinding.power_on.data.broadcast_address||'')}</label>
            <label>${e(t('wh_port'))} ${field('device_wol_port',currentBinding.power_on.data.broadcast_port??9,'number','min="1" max="65535"')}</label>`:''}
        <label>${e(t('wh_after_power'))} ${field('device_delay',currentBinding.post_power_on_delay_ms??0,'number','min="0" max="30000"')}</label>`}
          <details><summary>${e(t('wh_native_identity'))}</summary>
            <p>${e(currentBinding.entity)} · ${e(connected?.provider||t('wh_unknown_provider'))}</p>
            <button type='button' data-more-info='${e(currentBinding.entity)}'>${e(t('wh_open_native'))}</button>
            ${(connected?.related_entities||[]).map(x=>`<div><code>${e(x.entity_id)}</code> · ${e(x.availability)}
              <button type='button' data-more-info='${e(x.entity_id)}'>${e(t('wh_inspect_source'))}</button></div>`).join('')}
          </details>
        `:`<p>${e(t('wh_assign_to_configure'))}</p>
        <button type='button' data-wh-action='assign_catalog' data-wh-id='${e(currentAsset.asset_id)}'
          ${!rooms.length?'disabled':''}>${e(t('wh_assign_room'))}</button>`}
      ${currentBinding?`<button type='button' class='danger' data-wh-action='remove_catalog'
        data-wh-id='${e(currentAsset.asset_id)}'>${e(t('wh_unassign_room'))}</button>`:''}
      `:`<p>${e(t('wh_pick_detail'))}</p>`}
    </section></div>`;
  }else if(d.tab==='rooms'){
    content=`<div class='mm-wh-grid'><section class='mm-wh-panel' ${local?"style='display:none'":''}>
      <h4>${e(t('wh_home_structure'))} <small>${e(t('wh_ha_floor_area'))}</small></h4>
      ${roomButtons||`<p>${e(t('wh_no_rooms'))}</p>`}
      <a class='mm-wh-native-link' href='/config/areas/dashboard'>${e(t('wh_manage_areas'))}</a>
      <small>${e(t('wh_ha_locations'))}</small>
      <h4>${e(t('wh_link_room'))}</h4>
      <label>${e(t('wh_name'))}${field('new_room',d.newRoom)}</label>
      <label>${e(t('wh_native_ha_area'))}${select('new_area',d.newArea,
        [['',t('wh_unassigned')],...Object.entries(d.areas)])}</label>
      <button type='button' data-wh-action='add_room'>${e(t('setup_add_room'))}</button>
    </section><section class='mm-wh-panel'>
      <h4>${e(room?.name||t('wh_choose_room'))}</h4>
      ${room?`<label>${e(t('wh_room_name'))}${field('room_name',room.name)}</label>
        <label>${e(t('wh_native_home_area'))}${select('room_area',room.area_id||'',
          [['',t('wh_no_native_area')],...Object.entries(d.areas),...(room.area_id&&!d.areas[room.area_id]?[[room.area_id,room.area_id+' · '+t('wh_not_in_list')]]:[])],room.area_id&&!d.areas[room.area_id]?"aria-invalid='true' style='border-color:var(--error-color,#db4437)'":'')}</label>
        ${room.area_id&&!d.areas[room.area_id]?`<small class='mm-room-error'>${e(rhiMmWholeLocalMessage('Choose the room in Home Assistant.',t))}</small>`:''}
        <small>${e(t('wh_native_ha_area'))}: ${e(d.areas[room.area_id]||t('wh_unassigned'))} · ${e(t('wh_floor'))}: ${e(d.floors[d.areaFloors[room.area_id]]||t('not_published'))}. ${e(t('wh_ha_owns_locations'))}</small>
        <details class='mm-wh-room-areas'><summary>${e(t('wh_subdivisions'))}</summary>
          <small>${e(t('wh_subdivision_help'))}</small>
          ${roomAreas.map(([id,area])=>`<div class='mm-wh-area'>
            <label>${e(t('wh_area_name'))} ${field('room_area_name:'+id,area.name)}</label>
            <button type='button' data-wh-action='delete_room_area'
              data-wh-id='${e(id)}'>${e(t('wh_remove'))}</button></div>`).join('')}
          <label>${e(t('wh_new_room_area'))} ${field('new_room_area',d.newRoomArea)}</label>
          <button type='button' data-wh-action='add_room_area'>${e(t('wh_add_room_area'))}</button>
        </details>
        <details><summary>${e(t('wh_advanced_room'))}</summary>${specialist('harmony_owner',t('setup_harmony_owner'))}${specialist('speech_endpoint',t('wh_announcements'))}${deviceFirst?'':specialist('cec_device',t('wh_cec_policy'))+specialist('tv_wake',t('wh_wake_settings'))}</details>
        <p>${count(Object.keys(room.devices||{}).length,'device')} · ${count(Object.keys(room.activities||{}).length,'activity')}</p>
        ${deviceFirst?`<h4>${e(t('devices'))}</h4>
          ${deviceRows.map(([id,row])=>`<div class='mm-wh-step-actions'><span>${e(row.name||id)}</span>
            <button type='button' data-wh-action='edit_membership' data-wh-id='${e(JSON.stringify([d.room,id]))}'>${e(t('wh_room_device_details'))}</button></div>`).join('')}
          <button type='button' data-wh-action='room_memberships'>${e(t('wh_assign_device'))}</button>`:''}
        ${local?'':`<button type='button' class='danger' data-wh-action='delete_room'>${e(t('settings_remove_room'))}</button>`}`:''}
    </section></div>`;
  }else if(d.tab==='devices'&&deviceFirst&&!d.roomDeviceEditor){
    const catalog=Object.entries(d.deviceCatalog);
    const picked=catalog.find(([id])=>id===d.deviceDetail)||catalog[0];
    if(picked)d.deviceDetail=picked[0];
    const [assetId,saved]=picked||['',null];
    const memberships=saved?rooms.flatMap(([roomId,row])=>Object.entries(row.devices||{})
      .filter(([,dev])=>rhiMmAssetId(dev)===assetId)
      .map(([key,dev])=>({roomId,key,label:row.name||roomId,name:dev.name||key}))):[];
    const native=saved?d.sources.find(s=>s.entity===saved.entity&&s.candidate===saved.foundation_candidate_id):null;
    content=`<div class='mm-wh-grid'><section class='mm-wh-panel'>
      <h4>${e(t('devices'))} · ${catalog.length}</h4>
      <div class='mm-wh-step-actions'>${deviceAction('device_add',t('wh_add_device_native'))}
        ${specialist('dell_add',t('wh_add_display'))}</div>
      <div class='mm-wh-list'>${catalog.map(([id,row])=>entry(id,row.device_label||row.entity,id===assetId,'select_asset')).join('')}</div>
      ${!catalog.length?`<p>${e(t('wh_device_catalog_empty'))}</p>`:''}
      ${Object.keys(d.doc.dell_displays||{}).length?`<h4>${e(t('wh_dell_registrations'))}</h4>
        <p>${Object.values(d.doc.dell_displays).map(x=>e(x.name)).join(', ')}</p>
        ${specialist('dell_edit',t('wh_rename_display'))}${specialist('dell_remove',t('wh_remove_display'))}`:''}
      </section><section class='mm-wh-panel'>
      <h4>${e(saved?.device_label||saved?.entity||t('wh_select_device'))}</h4>
      ${saved?`<p>${e(saved.foundation_concept||'')} · ${e(native?.available?t('wh_available'):t('wh_temporarily_unavailable'))}</p>
        <p class='mm-selectable'>${e(saved.entity)}</p>
        <label>${e(t('wh_display_name'))}${field('device_name',saved.device_label||saved.entity)}</label>
        ${deviceSettings()}
        <div class='mm-wh-step-actions'>${deviceAction('device_assign',t('wh_assign_room'),assetId)}</div>
        <h4>${e(t('rooms'))}</h4>
        ${memberships.length?memberships.map(link=>`<div class='mm-wh-step-actions'><span>${e(link.label)} · ${e(link.name)}</span>
          <button type='button' data-wh-action='edit_membership' data-wh-id='${e(JSON.stringify([link.roomId,link.key]))}'>${e(t('wh_room_device_details'))}</button></div>`).join(''):`<p>${e(t('wh_not_assigned'))}</p>`}
        <div class='mm-wh-step-actions'>${memberships.length?deviceAction('device_unassign',t('wh_unassign_room'),assetId):deviceAction('device_remove',t('wh_remove_device'),assetId)}
          ${deviceAction('device_edit',t('expert_local_text'),assetId)}</div>
        ${saved.foundation_concept==='network'?`<small>${e(t('wh_network_readiness'))}</small>`:''}
      `:''}</section></div>`;
  }else if(d.tab==='devices'){
    content=`<div class='mm-wh-grid'><section class='mm-wh-panel' ${local?"style='display:none'":''}>
      ${deviceFirst?`<button type='button' data-wh-action='device_catalog'>${e(t('devices'))}</button>`:''}
      <h4>${e(t('devices'))} · ${e(room?.name||t('wh_no_room'))}</h4>
      ${specialist('dell_add',t('wh_add_display'))}
      <div class='mm-wh-list'>${deviceRows.map(([id,x])=>entry(id,x.name||id,id===currentDevice,'select_device')).join('')}</div>
      <h4>${e(t('wh_assign_supported'))}</h4>
      <label>${e(t('wh_foundation_source'))}${select('new_source',d.newSource,
        [['',t('wh_choose_discovered_source')],...sourceRows])}</label>
      <button type='button' data-wh-action='add_device' ${d.newSource===''||!room?'disabled':''}>${e(t('wh_assign_device'))}</button>
      <small>${e(t('wh_single_save'))}</small>
    </section><section class='mm-wh-panel'>
      <h4>${e(selectedDevice?.name||t('wh_select_device'))}</h4>
      ${selectedDevice?`<small>${e(selectedDevice.name||currentDevice)} · ${e(selectedDevice.foundation_concept||'')}</small>
        <label>${e(t('wh_display_name'))}${field('device_name',selectedDevice.name||'')}</label>
        ${deviceFirst? `<p class='mm-muted'>${e(t('wh_relationship_help'))}</p>
          <button type='button' data-wh-action='open_owner'>${e(t('wh_edit_owner'))}</button>` : deviceSettings()}
        <label>${e(t('wh_role'))}${select('device_role',selectedDevice.role||'player',
          selectedDevice.foundation_concept==='network'?[['computer',t('wh_computer')]]:[['display',t('wh_tv_display')],['receiver',t('wh_receiver_zone')],['player',t('role_player')],['remote',t('wh_remote_hub')]])}</label>
        ${roomAreas.length?`<label>${e(t('wh_room_area_optional'))}${select('device_room_area',selectedDevice.room_area||'',roomAreaChoices)}</label>`:''}
        ${local?'':`<button type='button' class='danger' data-wh-action='delete_device'>${e(t(deviceFirst?'wh_unassign_room':'wh_remove_device'))}</button>`}`:''}
    </section></div>`;
  }else{
    const cast=selectedActivity?.devices||[];
    const typeOptions=(d.deviceContract?.activity_types||RHI_MM_WHOLE_TYPES).map(x=>[x,t(({"watch_tv":"wh_watch_tv","watch_hdmi":"wh_watch_hdmi","watch_source":"wh_watch_source","listen_music":"wh_listen_music","play_game":"wh_play_game","work_on_pc":"wh_work_on_pc"})[x])]);
    const targets=deviceRows.filter(([,x])=>['display','amplifier'].includes(x.foundation_concept)&&
      x.entity.startsWith('media_player.'));
    const computerActivity=d.newType==='work_on_pc';
    const computers=deviceRows.filter(([,x])=>x.foundation_concept==='network'&&x.role==='computer');
    const routeTargets=computerActivity?targets.filter(([,x])=>x.foundation_concept==='display'):targets;
    const players=computerActivity?computers:deviceRows.filter(([,x])=>x.entity.startsWith('media_player.')&&
      (d.newType==='listen_music'?d.sources.some(source=>
        source.entity===x.entity&&source.candidate===x.foundation_candidate_id&&
        source.native_can_play===true):x.foundation_concept==='source'));
    const preferredTarget=routeTargets.find(([k])=>k===d.newActivityTarget)?.[0]||
      (computerActivity||d.newType==='listen_music'?'':targets.length===1?targets[0][0]:'');
    const chosenTarget=room?.devices?.[preferredTarget];
    const nativeTarget=d.sources.find(x=>x.entity===chosenTarget?.entity&&
      x.candidate===chosenTarget?.foundation_candidate_id);
    const offeredInputs=nativeTarget?.source_list||[];
    const needsPlayer=['watch_source','play_game','work_on_pc'].includes(d.newType);
    const needsRoute=computerActivity?!!chosenTarget:d.newType!=='listen_music'||!!offeredInputs.length;
    const renderSteps=phase=>{
      const steps=Array.isArray(selectedActivity?.[phase])?selectedActivity[phase]:[];
      return `<section class='mm-wh-steps'><h4>${phase==='steps'?t('wh_start_actions'):t('wh_stop_actions')}</h4>
        ${steps.map((step,i)=>{
          const currentSource=room?.devices?.[step.device];
          const selected=d.sources.find(s=>s.entity===currentSource?.entity&&s.candidate===currentSource?.foundation_candidate_id);
          const options=step.type==='sound_mode'?selected?.sound_mode_list||[]:selected?.source_list||[];
          const original=(step.candidates||[])[0]||'';
          const list=[['',t('wh_choose_input')],...options.map(x=>[x,x])];
          if(original&&!options.includes(original))list.push([original,original+' · '+ t('wh_not_in_list')]);
          let val='';
          if(['source','sound_mode'].includes(step.type))
            val=`<label>${e(t('script_action_'+step.type))}${select(`step_value:${phase}:${i}`,original,list,(!original||!options.includes(original))?"aria-invalid='true' style='border-color:var(--error-color,#db4437)'":'')}</label>
              ${!options.length?`<small class='mm-room-error'>${e(t('action_unavailable'))} · ${e(t('wh_input_help'))}</small>`:!original||!options.includes(original)?`<small class='mm-room-error'>${e(rhiMmWholeLocalMessage('Choose a verified native input for this activity.',t))}</small>`:''}`;
          else if(step.type==='volume')val=`<label>${e(t('wh_volume_scale'))}${field(`step_value:${phase}:${i}`,step.level??.5,'number','min="0" max="1" step="0.01"')}</label>`;
          else if(step.type==='mute')val=`<label>${e(t('script_action_mute'))}${select(`step_value:${phase}:${i}`,String(step.value===true),[['true',t('mute')],['false',t('unmute')]])}</label>`;
          else if(step.type==='remote_key')val=`<label>${e(t('wh_native_key'))}${field(`step_value:${phase}:${i}`,step.value||'')}</label>`;
          else if(step.type==='delay')val=`<label>${e(t('wh_delay'))}${field(`step_value:${phase}:${i}`,step.milliseconds??0,'number','min="0" max="30000" step="1"')}</label>`;
          else if(step.type==='wait_until')val=`<label>${e(t('wh_wait_state'))}${select(`step_state:${phase}:${i}`,step.states?.[0]||'on',
              (room?.devices?.[step.device]?.foundation_concept==='network'?['home','not_home']:['on','off','playing','paused','idle','standby','buffering']).map(x=>[x,x]))}</label>
              <label>${e(t('wh_timeout'))}${field(`step_timeout:${phase}:${i}`,step.timeout??15,'number','min="1" max="300" step="1"')}</label>`;
          return `<div class='mm-wh-step'><strong>${i+1}</strong>
            <label>${e(t('device'))}${select(`step_device:${phase}:${i}`,step.device||'',
              cast.map(k=>[k,room?.devices?.[k]?.name||k]))}</label>
            <label>${e(t('wh_action'))}${select(`step_type:${phase}:${i}`,step.type,
              (d.deviceContract?.step_types||RHI_MM_WHOLE_STEPS).map(x=>[x,t('script_action_'+x)]))}</label>
            ${val}
            ${!['wait_until','delay'].includes(step.type)?`<label>${e(t('wh_override_delay'))}${field(`step_override:${phase}:${i}`,step.delay_ms??'','number','min="0" max="30000" step="1"')}</label>`:''}
            <div class='mm-wh-step-actions'>
              <button type='button' data-wh-action='step_up' data-phase='${phase}' data-index='${i}' ${i===0?'disabled':''} aria-label='${e(t('move_step_up'))}'>↑</button>
              <button type='button' data-wh-action='step_down' data-phase='${phase}' data-index='${i}' ${i===steps.length-1?'disabled':''} aria-label='${e(t('move_step_down'))}'>↓</button>
              <button type='button' class='danger' data-wh-action='step_remove' data-phase='${phase}' data-index='${i}' aria-label='${e(t('wh_remove_action'))}'>×</button>
            </div>
          </div>`;
        }).join('')}
        <button type='button' data-wh-action='step_add' data-phase='${phase}' ${cast.length?'':'disabled'}>${e(t(phase==='steps'?'wh_add_start':'wh_add_stop'))}</button>
      </section>`;
    };
    content=`<div class='mm-wh-grid'><section class='mm-wh-panel' ${local?"style='display:none'":''}>
      <h4>${e(t('activities'))} · ${e(room?.name||t('wh_no_room'))}</h4>
      <div class='mm-wh-list'>${activityRows.map(([id,x])=>entry(id,x.name||id,id===currentActivity,'select_activity')).join('')}</div>
      <h4>${e(t('setup_add_activity'))}</h4>
      <label>${e(t('wh_name'))}${field('new_activity',d.newActivity)}</label>
      <label>${e(t('wh_type'))}${select('new_type',d.newType,typeOptions)}</label>
      ${(needsPlayer||d.newType==='listen_music')&&(players.length||computerActivity)?
        `<label>${e(t(computerActivity?'wh_computer':'role_source'))} ${select('new_activity_source',d.newActivitySource,
           [['',t('wh_choose_source')],...players.map(([key,x])=>[key,x.name||key])])}</label>`:''}
      ${routeTargets.length?`<label>${e(t(computerActivity?'wh_optional_display':'wh_route_target'))}
        ${select('new_activity_target',preferredTarget,
           [['',t(computerActivity?'wh_no_display':'wh_destination')],...routeTargets.map(([key,x])=>[key,x.name||key])])}</label>`:''}
      ${computerActivity?`<small>${e(t('wh_network_readiness'))}</small>`:''}
      ${needsRoute?`<label>${e(t('wh_verified_input'))}
        ${select('new_activity_input',d.newActivityInput,
          [['',t('wh_actual_input')],...offeredInputs.map(x=>[x,x])])}</label>
        <small>${e(t('wh_input_help'))}</small>`:''}
      <button type='button' data-wh-action='add_activity'>${e(t('wh_create_activity'))}</button>
      ${!local&&deviceRows.length?`<section class='mm-wh-steps'>
        <h4>${e(t('capture_title'))}</h4><p class='mm-muted'>${e(t('capture_help'))}</p>
        <button type='button' data-wh-action='capture_refresh' ${d.rawDraft!=null?'disabled':''}>${e(t('capture_refresh'))}</button>
        <div class='mm-wh-cast'>${deviceRows.filter(([,x])=>x.entity?.startsWith('media_player.')||(x.foundation_concept==='network'&&x.role==='computer')).map(([key,x])=>`<label class='mm-wh-check'>${field('capture_device:'+key,(d.captureDevices||[]).includes(key),'checkbox')}${e(x.name||key)}</label>`).join('')}</div>
        <label class='mm-wh-check'>${field('capture_volume',d.captureVolume===true,'checkbox')}${e(t('capture_volume'))}</label>
        <label class='mm-wh-check'>${field('capture_mute',d.captureMute===true,'checkbox')}${e(t('capture_mute'))}</label>
        <button type='button' data-wh-action='capture_new' ${rhiMmWholeCaptureRequest(d)?'':'disabled'}>${e(t('capture_create'))}</button>
        ${selectedActivity?`<button type='button' data-wh-action='capture_update' ${rhiMmWholeCaptureRequest(d,true)?'':'disabled'}>${e(t('capture_update'))} · ${e(selectedActivity.name||d.activity)}</button>`:''}
        <small>${e(t('capture_review'))}</small></section>`:''}
    </section><section class='mm-wh-panel'>
      <h4>${e(selectedActivity?.name||t('wh_choose_activity'))}</h4>
      ${selectedActivity?`<label>${e(t('wh_activity_name'))}${field('activity_name',selectedActivity.name||'')}</label>
        <label>${e(t('wh_type'))}${select('activity_type',selectedActivity.activity_type||'watch_tv',typeOptions)}</label>
        <label class='mm-wh-check'>${field('activity_favorite',selectedActivity.favorite===true,'checkbox')}${e(t('favorite'))}</label>
        ${selectedActivity.activity_type==='work_on_pc'?`<label>${e(t('wh_pc_application'))}${select('activity_computer_application',selectedActivity.computer_application||'',[['',t('wh_pc_default')],...rhiMmPcApplicationIds(deviceRows.find(([k,x])=>cast.includes(k)&&x.foundation_concept==='network'&&x.role==='computer')?.[1]).map(id=>[id,id])])}</label>`:''}
        ${roomAreas.length?`<label>${e(t('wh_room_area_optional'))}${select('activity_room_area',selectedActivity.room_area||'',roomAreaChoices)}</label>`:''}
        <h4>${e(t('wh_step_devices'))}</h4>
        ${deviceFirst?`<ol class='mm-wh-cast-order'>${cast.map(key=>`<li>${e(room.devices[key]?.name||key)}</li>`).join('')}</ol>
          ${specialist('activity_devices',t('wh_edit_cast_order'))}`:`<div class='mm-wh-cast'>${deviceRows.map(([key,x])=>`<label class='mm-wh-check'>${field('activity_cast:'+key,cast.includes(key),'checkbox')}${e(x.name||key)}</label>`).join('')}</div>`}
        <h4>${e(t('wh_step_actions'))}</h4>
        ${renderSteps('steps')}${renderSteps('stop_steps')}
        <details><summary>${e(t('wh_advanced_activity'))}</summary>${specialist('cec_activity',t('wh_cec_relationships'))}${specialist('button_mapping',t('wh_remote_mapping'))}${specialist('macro_manage',t('wh_shortcuts'))}${specialist('script_step',t('wh_action_editor'))}</details>
        ${local?'':`<button type='button' class='danger' data-wh-action='delete_activity'>${e(t('settings_remove_activity'))}</button>`}`:''}
    </section></div>`;
  }
  return `<section class='mm-wh-editor mm-surface' data-mm-flow-editor>
    <header class='mm-wh-header'><div><h2>${e(t('setup_editor'))}</h2>
      <p>${local?e(t('expert_selected')):[t('rooms'),t('devices'),t('activities')].map(e).join(' · ')}</p></div>
      <div class='mm-wh-step-actions'>
        ${deviceFirst&&!d.dirty&&d.rawDraft==null?`<button type='button' data-wh-action='open_expert'>${e(t('wh_expert_yaml'))}</button>`:''}
        <span class='mm-wh-draft'>${e(t(d.dirty?'whole_home_leave_title':'expert_saved'))}</span></div></header>
    ${localSections.length?`<nav class='mm-wh-tabs' aria-label='${e(t('wh_categories'))}'>
      ${localSections.map(([id,label,icon])=>`<button type='button' data-wh-action='tab'
        data-wh-id='${id}' aria-pressed='${d.tab===id}'>
        <ha-icon icon='${icon}'></ha-icon>${e(label)}</button>`).join('')}
    </nav>`:''}
    ${!local&&d.tab!=='rooms'&&(!deviceFirst||d.tab!=='devices'||d.roomDeviceEditor)&&rooms.length?`<div class='mm-wh-roomselect'><label>${e(t('wh_room'))}
      ${select('room_select',d.room,rooms.map(([id,r])=>[id,r.name||id]))}</label></div>`:''}
    ${d.validationDetail?(()=>{const issues=rhiMmWholeIssues(d);return `<section class='mm-room-error mm-selectable' role='alert'>
      <strong>${e(t(d.validationStale?'expert_validation_stale':'expert_attention'))}</strong>
      <p>${e(t(d.validationStale?'expert_recheck':'expert_correct'))}</p>
      ${issues.groups.map(group=>`<details><summary>${e(group.name)} · ${group.items.length}</summary>${group.items.map(item=>`<div class='mm-wh-step-actions'><span><b>${e(item.object)}</b> · ${e(rhiMmWholeLocalMessage(item.message,t))}</span>${d.rawDraft==null?`<button type='button' data-wh-action='focus_issue' data-wh-id='${e(item.path)}'>${e(t('expert_fix'))}</button>`:''}</div>`).join('')}</details>`).join('')}
      ${issues.general.map(line=>`<p>${e(line)}</p>`).join('')}
      ${remediation}
      <button type='button' data-mm-copy='issues'>${e(t('copy_issues'))}</button><span data-mm-clipboard-status role='status'></span><textarea readonly hidden data-mm-copy-fallback aria-label='${e(t('copy_issues_manual'))}' rows='6'>${e(d.validationDetail)}</textarea>
      <details><summary>${e(t('expert_details'))}</summary><p style='white-space:pre-wrap'>${e(d.validationDetail)}</p></details>
    </section>`;})():''}
    ${d.error&&d.error!==d.validationDetail?`<div class='mm-room-error mm-selectable' role='alert'><p style='white-space:pre-wrap'>${e(rhiMmWholeLocalMessage(d.error,t))}</p>${!d.validationDetail?`<button type='button' data-mm-copy='issues'>${e(t('copy_issues'))}</button><span data-mm-clipboard-status role='status'></span><textarea readonly hidden data-mm-copy-fallback aria-label='${e(t('copy_issues_manual'))}' rows='6'>${e(d.error)}</textarea>`:''}</div>`:''}
    ${d.rawDraft==null&&d.error&&!d.validationDetail?`<div class='mm-wh-step-actions'>${[...new Set((d.error.match(/rooms\.[a-z][a-z0-9_]*(?:\.(?:devices|activities)\.[a-z][a-z0-9_]*)?/g)||[]))].filter(path=>d.doc.rooms[path.split('.')[1]]).map(path=>`<button type='button' data-wh-action='focus_issue' data-wh-id='${e(path)}'>${e(t('review'))} ${e(path.split('.').slice(1).join(' / '))}</button>`).join('')}</div>`:''}
    ${d.rawDraft==null?content:''}
    <details class='mm-wh-expert' ${d.rawDraft!=null?'open':''}>
      <summary>${e(t(local?'expert_local_text':'expert_global_text'))}</summary>
      <div class='mm-wh-global' ${local?"style='display:none'":''}>
        <label>${e(t('wh_global_delay'))}
          ${field('global_delay',d.doc.default_step_delay_ms??0,'number','min="0" max="30000" step="1"')}</label>
        <label class='mm-wh-check'>${e(t('wh_enable_ux'))}
          ${field('global_enable',d.doc.enable_ux!==false,'checkbox')}</label>
      </div>
      ${!local&&d.rawDraft==null?`<details><summary>${e(t('wh_dell_registrations'))}</summary><small>${e(t('wh_dell_help'))}</small><p>${Object.values(d.doc.dell_displays||{}).map(x=>e(x.name)).join(', ')||t('wh_no_displays')}</p>${Object.keys(d.doc.dell_displays||{}).length?specialist('dell_edit',t('wh_rename_display'))+specialist('dell_remove',t('wh_remove_display')):''}</details>`:''}
      <h4>${e(t('expert_heading'))}</h4>
      <p>${e(t(local?'expert_local_help':'expert_global_help'))}</p>
      <textarea data-wh-raw spellcheck='false' rows='15'
        aria-label='${e(t(local?'expert_local_text':'expert_global_text'))}'>${e(rhiMmWholeText(d))}</textarea>
      <div class='mm-setup-actions'><button type='button' data-mm-copy='yaml'>${e(t('copy_yaml'))}</button><button type='button' data-mm-paste='yaml'>${e(t('paste_yaml'))}</button><span data-mm-clipboard-status role='status'></span></div>
      <button type='button' data-wh-action='review_yaml'>${e(t('expert_visual'))}</button>
      ${d.rawDraft!=null?`<button type='button' data-wh-action='discard_raw'>${e(t('expert_undo'))}</button>`:''}
    </details>
    <footer class='mm-wh-footer'>
      <span>${count(rooms.length,'room')} · ${count(deviceFirst?Object.keys(d.deviceCatalog).length:rooms.reduce((n,[,r])=>n+Object.keys(r.devices||{}).length,0),'device')} ·
        ${count(rooms.reduce((n,[,r])=>n+Object.keys(r.activities||{}).length,0),'activity')}</span>
      <button type='button' class='mm-wh-save' data-wh-action='review'>${e(t('whole_home_review_save'))}</button>
      <button type='button' data-mm-option-cancel>${e(t('setup_cancel'))}</button>
    </footer>
  </section>`;
}
function rhiMmWholeChange(d,key,value,checked=false){
  const {room,device,activity,ownerMode}=rhiMmWholeCurrent(d);
  if(d.localScope){
    const scope=d.localScope[0];
    const allowed=scope==='room'?key.startsWith('room_')&&key!=='room_select'||key==='new_room_area':
      scope==='device'?key.startsWith('device_'):
      key.startsWith('activity_')||key.startsWith('step_');
    if(!allowed){d.error='Only the selected object can change.';return false;}
  }
  const parts=key.split(':');
  const phase=parts[1],index=Number(parts[2]);
  const step=activity?.[phase]?.[index];
  const int=value===''?undefined:Number(value);
  const fail=message=>{d.error=message;return false;};
  if(key==='room_select'){
    if(!d.doc.rooms[value])return fail('Unknown room');
    d.room=value;d.device='';d.activity='';d.captureRoom=undefined;d.error='';return true;
  }
  if(key==='global_enable'){d.doc.enable_ux=checked;d.dirty=true;}
  else if(key==='global_delay'){
    if(!Number.isInteger(int)||int<0||int>(d.deviceContract?.max_step_delay_ms??30000))return fail('Delay must be 0–30000 ms');
    d.doc.default_step_delay_ms=int;d.dirty=true;
  }
  else if(key==='new_room')d.newRoom=value;
  else if(key==='new_room_area')d.newRoomArea=value;
  else if(key==='new_area')d.newArea=value;
  else if(key==='new_source')d.newSource=value;
  else if(key==='catalog_filter'){d.catalogFilter=value;d.selectedAssets=[];}
  else if(key==='catalog_type'){d.catalogType=value;d.selectedAssets=[];}
  else if(key==='catalog_query')d.catalogQuery=value;
  else if(key==='bulk_room'){
    if(value&&!d.doc.rooms[value])return fail('Choose a configured room');
    d.bulkRoom=value;d.room=value||d.room;d.selectedAssets=[];
    if(d.detailAsset){
      const asset=d.logicalDevices.find(x=>x.asset_id===d.detailAsset);
      const linked=rhiMmWholeAssetBindings(d.doc.rooms[d.room],asset);
      d.device=linked.length===1?linked[0][0]:'';
    }
  }
  else if(parts[0]==='catalog_selected'){
    if(!d.logicalDevices.some(x=>x.asset_id===key.slice('catalog_selected:'.length)))
      return fail('Unknown discovered device');
    const assetId=key.slice('catalog_selected:'.length);
    if(checked){if(!d.selectedAssets.includes(assetId))d.selectedAssets.push(assetId);}
    else d.selectedAssets=d.selectedAssets.filter(x=>x!==assetId);
  }
  else if(parts[0]==='capture_device'){
    if(!room?.devices?.[parts[1]])return fail('Choose an existing room device');
    d.captureDevices=d.captureDevices||[];
    if(checked&&!d.captureDevices.includes(parts[1]))d.captureDevices.push(parts[1]);
    else if(!checked)d.captureDevices=d.captureDevices.filter(key=>key!==parts[1]);
  }
  else if(key==='capture_volume')d.captureVolume=checked;
  else if(key==='capture_mute')d.captureMute=checked;
  else if(key==='new_pc_application')d.newPcApplication=rhiMmWholeSlug(value).slice(0,40);
  else if(key==='new_activity')d.newActivity=value;
  else if(key==='new_type'){d.newType=value;d.newActivityInput='';d.newActivitySource='';d.newActivityTarget='';d.captureType=undefined;}
  else if(key==='new_activity_target'){d.newActivityTarget=value;d.newActivityInput='';}
  else if(key==='new_activity_input')d.newActivityInput=value;
  else if(key==='new_activity_source')d.newActivitySource=value;
  else if(key==='default_step_delay_ms'){
    if(!Number.isInteger(int)||int<0||int>(d.deviceContract?.max_step_delay_ms??30000))return fail('Default delay must be 0–30000 ms');
    d.doc.default_step_delay_ms=int;d.dirty=true;
  }
  else if(key==='room_name'&&room){room.name=value;d.dirty=true;}
  else if(parts[0]==='room_area_name'&&room?.room_areas?.[parts[1]]){
    if(!value.trim()||value.trim().length>80)return fail('Room Area name must be 1–80 characters');
    room.room_areas[parts[1]].name=value;d.dirty=true;
  }
  else if(key==='room_area'&&room){
    if(value&&!Object.prototype.hasOwnProperty.call(d.areas,value))return fail('Area is not registered in HA');
    room.area_id=value||null;d.dirty=true;
  }
  else if(key==='device_name'&&device){
    if(ownerMode){if(!value.trim()||value.trim().length>80)return fail('Device name must be 1–80 characters');device.device_label=value.trim();}
    else device.name=value;
    d.dirty=true;
  }
  else if(key==='device_control_approved'&&device){device.control_approved=checked;d.dirty=true;}
  else if(key==='device_room_area'&&device&&!ownerMode){
    if(value&&!room?.room_areas?.[value])return fail('Choose a defined Room Area');
    if(value)device.room_area=value;else delete device.room_area;
    d.dirty=true;
  }
  else if(key==='device_resolve'&&device){
    const source=d.sources[Number(value)];
    const placeholder=String(device.entity).startsWith('REPLACE_WITH_');
    const known=d.sources.some(s=>s.entity===device.entity&&s.concept===device.foundation_concept);
    if(value===''||(!placeholder&&known)||!source||
       source.concept!==device.foundation_concept||source.review_reason||
       !source.candidate||!source.entity_registry_id||!source.config_entry_id||
       !(device.foundation_concept==='network'?source.entity.startsWith('device_tracker.'):device.entity.startsWith('remote.')?source.entity.startsWith('remote.'):source.entity.startsWith('media_player.')))
      return fail('Choose an exact compatible native device');
    if(!ownerMode&&Object.values(room?.devices||{}).some(x=>x!==device&&x.entity===source.entity))
      return fail('This device is already assigned to the room');
    const linked=(ownerMode?Object.values(d.deviceCatalog):Object.values(d.doc.rooms).flatMap(r=>Object.values(r.devices||{})))
      .filter(x=>x!==device&&rhiMmAssetId(x)!==rhiMmAssetId(device)&&x.entity===source.entity);
    if(linked.length&&linked.some(x=>x.physical_id!==device.physical_id))
      return fail('This device belongs to an existing physical identity; review its shared assignment');
    const oldEntity=device.entity;
    const asset=rhiMmAssetId(device);
    rhiMmWholeEditDevice(device,x=>{
      if(x.entity!==oldEntity)return;
      if(d.canonicalWire&&oldEntity!==source.entity){
        if(!x.asset_id)x.asset_id=asset;
        if(!x.physical_id)x.physical_id=oldEntity;
      }
      Object.assign(x,{entity:source.entity,foundation_candidate_id:source.candidate,
        foundation_entity_registry_id:source.entity_registry_id,
        foundation_config_entry_id:source.config_entry_id,
        foundation_device_registry_id:source.native_device_id,
        foundation_provider:source.provider});
      if(!placeholder)x.control_approved=false;
      if(x.foundation_concept==='network'){delete x.computer_agent;delete x.computer_io;delete x.windows_native;}
    });
    d.dirty=true;
  }
  else if(key==='device_candidate'&&device){
    const approved=d.sources.find(s=>s.entity===device.entity&&s.concept===device.foundation_concept
      &&s.candidate===value);
    if(!approved)return fail('This exact native device is not selected in Foundation');
    device.foundation_candidate_id=approved.candidate;
    device.foundation_entity_registry_id=approved.entity_registry_id;
    device.foundation_config_entry_id=approved.config_entry_id;
    device.foundation_device_registry_id=approved.native_device_id;
    device.foundation_provider=approved.provider;
    device.control_approved=false;if(device.foundation_concept==='network'){delete device.computer_agent;delete device.computer_io;delete device.windows_native;}d.dirty=true;
  }
  else if(key==='device_windows_enable'&&device){
    if(device.foundation_concept!=='network')return fail('Choose a network computer');
    if(checked&&(device.computer_agent||Object.keys(device.computer_io||{}).length))
      return fail('Remove the existing HASS.Agent bindings before selecting Windows management');
    const addresses=d.sources.find(s=>s.entity===device.entity&&s.candidate===device.foundation_candidate_id)?.network_ipv4_choices||[];
    rhiMmWholeEditDevice(device,x=>{
      if(!checked)delete x.windows_native;
      else if(!x.windows_native)x.windows_native={host:addresses.length===1?addresses[0]:'',computer_name:'',endpoint:'RhiMultimedia',credential_ref:'',ca_file:'',applications:[]};
    });d.dirty=true;
  }
  else if(key.startsWith('device_windows:')&&device){
    const name=key.split(':')[1];
    if(!device.windows_native||!['host','computer_name','endpoint','credential_ref','ca_file','applications'].includes(name))
      return fail('Choose an exact Windows management setting');
    const target=name==='applications'?value.split(',').map(x=>x.trim()).filter(Boolean):value.trim();
    rhiMmWholeEditDevice(device,x=>{x.windows_native[name]=target;});d.dirty=true;
  }
  else if(key==='device_computer_agent'&&device){
    if(device.foundation_concept!=='network'||device.windows_native)return fail('Choose a network computer without native Windows management');
    const source=d.sources.find(s=>s.candidate===value&&s.concept==='source'&&s.provider==='hass_agent'&&!s.review_reason&&s.entity.startsWith('media_player.')&&s.entity_registry_id&&s.config_entry_id&&s.native_device_id);
    if(value&&!source)return fail('Choose a current exact HASS.Agent media endpoint');
    if(source&&Object.values(d.doc.rooms).some(r=>Object.values(r.devices||{}).some(x=>x.entity===source.entity||(x.computer_agent?.entity===source.entity&&(x.physical_id||x.entity)!==(device.physical_id||device.entity)))))return fail('This agent belongs to another configured device');
    rhiMmWholeEditDevice(device,x=>{if(!source)delete x.computer_agent;else x.computer_agent={entity:source.entity,foundation_concept:'source',foundation_candidate_id:source.candidate,foundation_entity_registry_id:source.entity_registry_id,foundation_config_entry_id:source.config_entry_id,foundation_device_registry_id:source.native_device_id,foundation_provider:source.provider,control_approved:true};});d.dirty=true;
  }
  else if(key.startsWith('device_computer_io:')&&device){
    const role=key.split(':')[1];
    if(device.foundation_concept!=='network'||device.windows_native||(!['shutdown','restart','launch','session','process'].includes(role)&&!/^(launch|process)_[a-z][a-z0-9_]{0,39}$/.test(role)&&!(d.deviceContract?.pc_keys||RHI_MM_PC_KEYS).some(key=>'key_'+key.toLowerCase()===role)))return fail('Choose an exact computer endpoint');
    const source=(d.computerIO||[]).find(s=>s.candidate===value);
    if(value&&(!source||!((['session','process'].includes(role)||role.startsWith('process_'))?source.entity.startsWith('sensor.'):role.startsWith('key_')?source.entity.startsWith('button.'):source.entity.startsWith('button.')||source.entity.startsWith('switch.'))))return fail('Choose a compatible HASS.Agent endpoint');
    if(source&&Object.entries(device.computer_io||{}).some(([k,x])=>k!==role&&(x.foundation_device_registry_id!==source.native_device_id||x.entity===source.entity)))return fail('Choose distinct endpoints on the same native HASS.Agent device');
    if(source&&Object.values(d.doc.rooms||{}).some(r=>Object.values(r.devices||{}).some(x=>(x.physical_id||x.entity)!==(device.physical_id||device.entity)&&Object.values(x.computer_io||{}).some(b=>b.foundation_device_registry_id===source.native_device_id))))return fail('This HASS.Agent device is assigned to another computer');
    rhiMmWholeEditDevice(device,x=>{x.computer_io=x.computer_io||{};if(!source)delete x.computer_io[role];else x.computer_io[role]={entity:source.entity,foundation_concept:'computer_io',foundation_candidate_id:source.candidate,foundation_entity_registry_id:source.entity_registry_id,foundation_config_entry_id:source.config_entry_id,foundation_device_registry_id:source.native_device_id,foundation_provider:'mqtt',control_approved:true};if(!Object.keys(x.computer_io).length)delete x.computer_io;});d.dirty=true;
  }
  else if(key==='device_role'&&device&&!ownerMode){device.role=value;d.dirty=true;}
  else if(key==='device_power'&&device){
    if(!['native','passive'].includes(value))return fail('Unknown power behaviour');
    rhiMmWholeEditDevice(device,x=>{x.power_mode=value;});d.dirty=true;
  }
  else if(key==='device_cec'&&device){
    rhiMmWholeEditDevice(device,x=>{x.hdmi_cec_enabled=checked;});d.dirty=true;
  }
  else if(key==='device_delay'&&device){
    if(!Number.isInteger(int)||int<0||int>(d.deviceContract?.max_step_delay_ms??30000))return fail('Delay must be 0–30000 ms');
    rhiMmWholeEditDevice(device,x=>{x.post_power_on_delay_ms=int;});d.dirty=true;
  }
  else if(key==='device_wol_mode'&&device){
    if(!['native','directed'].includes(value))return fail('Unknown Wake-on-LAN mode');
    if(value==='native'){
      rhiMmWholeEditDevice(device,x=>{x.wol_enabled=false;});
    }else{
      if(!device.entity.startsWith('media_player.')&&!device.entity.startsWith('remote.')&&
         !(device.foundation_concept==='network'&&device.entity.startsWith('device_tracker.')))
        return fail('WOL requires an authorized native media device');
      if(d.sources.some(x=>x.entity===device.entity&&
          x.candidate===device.foundation_candidate_id&&x.provider==='harmony'))
        return fail('Harmony hub power is only available through native activity control');
      const macs=rhiMmWholeVerifiedMacs(d,device);
      if(!macs.length)return fail('No verified native MAC published for this exact source. Check its HA Device Registry and current Foundation binding.');
      const existing=device.power_on?.action==='wake_on_lan.send_magic_packet'
        ?device.power_on.data:{};
      if(!macs.includes(existing?.mac)&&macs.length!==1)
        return fail('Choose an exact verified native MAC before enabling WOL');
      const mac=macs.includes(existing?.mac)?existing.mac:macs[0];
      const action={action:'wake_on_lan.send_magic_packet',
        data:{mac,broadcast_port:existing?.broadcast_port??9,
          ...(existing?.broadcast_address?{broadcast_address:existing.broadcast_address}:{})}};
      rhiMmWholeEditDevice(device,x=>{
        x.power_on=JSON.parse(JSON.stringify(action));x.wol_enabled=true;
      });
    }
    d.dirty=true;
  }
  else if(key==='device_wol_mac'&&device){
    const mac=String(value||'').trim().replaceAll('-',':').toLowerCase();
    if(!rhiMmWholeVerifiedMacs(d,device).includes(mac))
      return fail('MAC must match the current native HA Device Registry for this exact source');
    rhiMmWholeEditDevice(device,x=>{
      if(x.power_on?.action!=='wake_on_lan.send_magic_packet')
        x.power_on={action:'wake_on_lan.send_magic_packet',data:{mac,broadcast_port:9}};
      else x.power_on.data.mac=mac;
      x.wol_enabled=true;
    });d.dirty=true;
  }
  else if(key==='device_wol_ip'&&device){
    const ip=String(value||'').trim();
    const parts=ip.split('.');
    if(ip&&!(parts.length===4&&parts.every(p=>/^(?:0|[1-9][0-9]{0,2})$/.test(p)&&Number(p)<=255)&&ip!=='0.0.0.0'))
      return fail('Enter a valid IPv4 destination or leave empty for default broadcast');
    if(device.power_on?.action!=='wake_on_lan.send_magic_packet')return fail('Enable WOL first');
    rhiMmWholeEditDevice(device,x=>{
      if(ip)x.power_on.data.broadcast_address=ip;
      else delete x.power_on.data.broadcast_address;
    });d.dirty=true;
  }
  else if(key==='device_wol_port'&&device){
    if(!Number.isInteger(int)||int<1||int>65535)return fail('UDP port must be 1–65535');
    if(device.power_on?.action!=='wake_on_lan.send_magic_packet')return fail('Enable WOL first');
    rhiMmWholeEditDevice(device,x=>{x.power_on.data.broadcast_port=int;});d.dirty=true;
  }
  else if(key==='activity_name'&&activity){activity.name=value;d.dirty=true;}
  else if(key==='activity_favorite'&&activity){if(checked)activity.favorite=true;else delete activity.favorite;d.dirty=true;}
  else if(key==='activity_room_area'&&activity){
    if(value&&!room?.room_areas?.[value])return fail('Choose a defined Room Area');
    if(value)activity.room_area=value;else delete activity.room_area;
    d.dirty=true;
  }
  else if(key==='activity_type'&&activity){activity.activity_type=value;if(value!=='work_on_pc')delete activity.computer_application;d.dirty=true;}
  else if(key==='activity_computer_application'&&activity){
    const pc=Object.entries(room.devices||{}).find(([k,x])=>activity.devices.includes(k)&&x.foundation_concept==='network'&&x.role==='computer')?.[1];
    if(activity.activity_type!=='work_on_pc'||(value&&!rhiMmPcApplicationIds(pc).includes(value)))return fail('Choose a complete application pair on the selected PC');
    if(value)activity.computer_application=value;else delete activity.computer_application;d.dirty=true;
  }
  else if(parts[0]==='activity_cast'&&activity&&room?.devices?.[parts[1]]){
    const cast=new Set(activity.devices||[]);
    if(checked)cast.add(parts[1]);else cast.delete(parts[1]);
    if(!cast.size)return fail('At least one device must remain selected');
    activity.devices=[...cast];d.dirty=true;
  }
  else if(step&&parts[0]==='step_device'&&activity?.devices?.includes(value)){step.device=value;d.dirty=true;}
  else if(step&&parts[0]==='step_type'&&(d.deviceContract?.step_types||RHI_MM_WHOLE_STEPS).includes(value)){
    const device=step.device;const delay_ms=step.delay_ms;
    const defaults={source:{candidates:[]},sound_mode:{candidates:[]},volume:{level:.5},mute:{value:false},
      remote_key:{value:''},delay:{milliseconds:0},wait_until:{states:['on'],timeout:15}};
    Object.assign(step,{});
    for(const k of Object.keys(step))delete step[k];
    Object.assign(step,{type:value,device,...(defaults[value]||{})});
    if(delay_ms!==undefined&&!['delay','wait_until'].includes(value))step.delay_ms=delay_ms;
    d.dirty=true;
  }
  else if(step&&parts[0]==='step_value'){
    if(['source','sound_mode'].includes(step.type))step.candidates=value?[value]:[];
    else if(step.type==='remote_key')step.value=value;
    else if(step.type==='volume'){if(!Number.isFinite(int)||int<0||int>1)return fail('Volume must be 0–1');step.level=int;}
    else if(step.type==='mute'){if(!['true','false'].includes(value))return false;step.value=value==='true';}
    else if(step.type==='delay'){if(!Number.isInteger(int)||int<0||int>(d.deviceContract?.max_step_delay_ms??30000))return fail('Delay must be 0–30000 ms');step.milliseconds=int;}
    d.dirty=true;
  }
  else if(step&&parts[0]==='step_state'&&step.type==='wait_until'){step.states=[value];d.dirty=true;}
  else if(step&&parts[0]==='step_timeout'&&step.type==='wait_until'){
    if(!Number.isFinite(int)||int<1||int>300)return fail('Timeout must be 1–300 s');
    step.timeout=int;d.dirty=true;
  }
  else if(step&&parts[0]==='step_override'&&!['delay','wait_until'].includes(step.type)){
    if(value==='')delete step.delay_ms;
    else {if(!Number.isInteger(int)||int<0||int>(d.deviceContract?.max_step_delay_ms??30000))return fail('Delay must be 0–30000 ms');step.delay_ms=int;}
    d.dirty=true;
  }else return fail('Unsupported editor input');
  d.error='';return true;
}
function rhiMmWholeAction(d,action,id,phase,index){
  const {room,activity}=rhiMmWholeCurrent(d);
  const fail=message=>{d.error=message;return false;};
  if(d.localScope){
    const scope=d.localScope[0];
    const allowed=action==='discard_raw'||action==='focus_issue'||
      (scope==='room'&&['add_room_area','delete_room_area'].includes(action))||
      (scope==='activity'&&['step_add','step_remove','step_up','step_down'].includes(action));
    if(!allowed)return fail('Only the selected object can change.');
    if(action==='focus_issue'){
      const [,roomId,group,objectId]=String(id).split('.');
      if(roomId!==d.localScope[1]||(scope==='room'?(group==='devices'||group==='activities'):
         group!==(scope==='device'?'devices':'activities')||objectId!==d.localScope[2]))
        return fail('This issue is outside the selected object. Open its own Settings.');
    }
  }
  if(action==='discard_raw'){d.rawDraft=null;d.editableDraft='';d.error='';return true;}
  if(action==='edit_import'){
    const diagnostic=d.error;
    if(!d.editableDraft)return fail('No renderable imported configuration. Correct YAML syntax or structure first.');
    if(!rhiMmWholeAction(d,'apply_json',d.editableDraft))return false;
    d.editableDraft='';d.error=diagnostic;d.tab='rooms';d.settingsTab='rooms';d.workspace='settings';
    return true;
  }
  if(d.rawDraft!=null&&action!=='apply_json')return fail('Validate or discard advanced YAML edits before changing GUI configuration.');
  if(action==='apply_json'){
    try{
      const proposed=JSON.parse(id);
      if(!proposed||typeof proposed!=='object'||Array.isArray(proposed)||
          !proposed.rooms||typeof proposed.rooms!=='object'||Array.isArray(proposed.rooms)||
          !proposed.dell_displays||typeof proposed.dell_displays!=='object'||
          typeof proposed.enable_ux!=='boolean'||
          !Number.isInteger(proposed.default_step_delay_ms)||
          proposed.default_step_delay_ms<0||proposed.default_step_delay_ms>(d.deviceContract?.max_step_delay_ms??30000))
        return fail('Invalid advanced configuration');
      rhiMmWholeInstall(d,proposed,d.deviceCatalog);d.rawDraft=null;d.room=Object.keys(proposed.rooms)[0]||'';
      d.device='';d.activity='';d.dirty=true;d.error='';return true;
    }catch(_){return fail('Advanced configuration must be valid JSON');}
  }
  if(action==='apply_proposals'){
    const proposed=d.proposedRooms||{};
    if(!Object.keys(proposed).length)return fail('No safe native room suggestions available');
    let changed=0;
    // Suggestions only: never overwrite an already edited user role, room,
    // activity, physical identity or command policy. Resolve physical policy
    // against the current unsaved draft rather than the older proposal.
    for(const [roomId,suggestion] of Object.entries(proposed)){
      const existing=d.doc.rooms[roomId];
      if(existing&&existing.area_id!==suggestion.area_id)continue;
      const original=existing||{...JSON.parse(JSON.stringify(suggestion)),devices:{},activities:{}};
      for(const [key,device] of Object.entries(suggestion.devices||{})){
        if(original.devices[key]||Object.values(original.devices).some(x=>x.entity===device.entity))continue;
        const role=rhiMmWholeSharedRole(d,device);
        if(!role)continue;
        original.devices[key]=role;changed++;
      }
      for(const [key,activity] of Object.entries(suggestion.activities||{})){
        if(original.activities[key]||!activity.devices.every(k=>original.devices[k]&&
            original.devices[k].control_approved!==false))continue;
        original.activities[key]=JSON.parse(JSON.stringify(activity));changed++;
      }
      if(!existing&&Object.keys(original.devices).length){d.doc.rooms[roomId]=original;changed++;}
    }
    if(!changed)return fail('Existing setup preserved; review the listed source exceptions');
    d.room=Object.keys(d.doc.rooms)[0]||'';d.bulkRoom=d.room;d.device='';d.activity='';
    d.tab='rooms';d.dirty=true;d.error='';return true;
  }
  if(action==='focus_binding'){
    if(!d.bulkRoom||!d.doc.rooms[d.bulkRoom])return fail('Choose the exact room before reviewing source access');
    const asset=(d.logicalDevices||[]).find(x=>x.asset_id===d.detailAsset);
    if(!asset)return fail('Choose the exact discovered device first');
    const matches=rhiMmWholeAssetBindings(d.doc.rooms[d.bulkRoom],asset);
    if(matches.length!==1)return fail('Ambiguous or missing room binding. Review the native source and room assignments.');
    d.room=d.bulkRoom;d.device=matches[0][0];d.tab='devices';
    const owner=rhiMmAssetId(matches[0][1]);
    d.roomDeviceEditor=!d.deviceContract||!d.deviceCatalog?.[owner];
    if(!d.roomDeviceEditor)d.deviceDetail=owner;
    d.settingsTab='devices';d.workspace='settings';d.error='';return true;
  }
  if(action==='repair_bindings'||action==='repair_binding'){
    const repairs=rhiMmWholeRepairable(d);
    const selected=action==='repair_binding'
      ?repairs.filter(row=>row.roomId+':'+row.key===id):repairs;
    if(!selected.length)return fail('No exact current native link can be safely reviewed. Inspect device/provider in Discovery.');
    for(const row of selected)
      Object.assign(d.doc.rooms[row.roomId].devices[row.key],row.metadata);
    d.room=selected[0].roomId;d.bulkRoom=d.room;d.device=selected[0].key;
    d.tab='devices';const asset=rhiMmAssetId(d.doc.rooms[d.room].devices[d.device]);
    d.roomDeviceEditor=!d.deviceContract||!d.deviceCatalog?.[asset];
    if(!d.roomDeviceEditor)d.deviceDetail=asset;
    d.dirty=true;d.error='';return true;
  }
  if(action==='focus_issue'){
    const asset=rhiMmWholeIssueAsset(d,id);
    if(asset&&!d.localScope&&d.deviceContract){
      d.tab='devices';d.settingsTab='devices';d.workspace='settings';
      d.deviceDetail=asset;d.roomDeviceEditor=false;return true;
    }
    const match=/^rooms\.([a-z][a-z0-9_]*)(?:\.(devices|activities)\.([a-z][a-z0-9_]*))?/.exec(id);
    if(!match||!d.doc.rooms[match[1]])return false;
    d.room=match[1];d.bulkRoom=d.room;d.tab=match[2]||'rooms';d.settingsTab=d.tab;d.workspace='settings';
    if(match[2]==='devices'){
      d.device=match[3];const linked=d.doc.rooms[d.room]?.devices?.[d.device];
      const asset=linked&&rhiMmAssetId(linked);
      const localField=/\.(name|role|room_area)$/.test(id);
      d.roomDeviceEditor=localField||!d.deviceContract||!d.deviceCatalog?.[asset];
      if(!d.roomDeviceEditor)d.deviceDetail=asset;
    }
    if(match[2]==='activities')d.activity=match[3];
    return true;
  }
  if(action==='select_asset'){
    if(!d.deviceCatalog?.[id]&&!Object.values(d.doc.rooms||{}).some(room=>
      Object.values(room.devices||{}).some(dev=>(dev.asset_id||dev.physical_id||dev.entity)===id)))return fail('Unknown configured device');
    d.deviceDetail=id;d.error='';return true;
  }
  if(action==='room_memberships'){
    if(!room)return fail('Choose a room first');
    d.tab='devices';d.settingsTab='devices';d.roomDeviceEditor=true;d.error='';return true;
  }
  if(action==='device_catalog'||action==='open_owner'){
    if(action==='open_owner'){
      const asset=room?.devices?.[d.device]&&rhiMmAssetId(room.devices[d.device]);
      if(!asset||!d.deviceCatalog?.[asset])return fail('Unknown configured device');
      d.deviceDetail=asset;
    }
    d.roomDeviceEditor=false;d.tab='devices';d.settingsTab='devices';d.error='';return true;
  }
  if(action==='clear_wol'){
    const {device}=rhiMmWholeCurrent(d);
    if(device?.power_on?.action!=='wake_on_lan.send_magic_packet')return fail('No Wake-on-LAN override');
    delete device.power_on;delete device.wol_enabled;d.dirty=true;d.error='';return true;
  }
  if(action==='edit_membership'){
    try{
      const [roomId,key]=JSON.parse(id);
      if(!d.doc.rooms[roomId]?.devices?.[key])return fail('Unknown room relationship');
      d.room=roomId;d.device=key;d.roomDeviceEditor=true;d.tab='devices';d.settingsTab='devices';d.error='';return true;
    }catch(_){return fail('Unknown room relationship');}
  }
  if(action==='tab'){if(!['discovery','rooms','devices','activities'].includes(id))return false;d.tab=id;d.roomDeviceEditor=false;d.error='';return true;}
  if(action==='select_room'){if(!d.doc.rooms[id])return false;d.room=id;d.bulkRoom=id;d.device='';d.activity='';d.error='';return true;}
  if(action==='clear_selected'){d.selectedAssets=[];d.error='';return true;}
  if(action==='catalog_detail'){
    const asset=d.logicalDevices.find(x=>x.asset_id===id);
    if(!asset)return fail('Unknown discovered device');
    d.detailAsset=id;
    if(d.bulkRoom&&d.doc.rooms[d.bulkRoom])d.room=d.bulkRoom;
    const linked=rhiMmWholeAssetBindings(d.doc.rooms[d.room],asset);
    d.device=linked.length===1?linked[0][0]:'';d.error='';return true;
  }
  if(action==='remove_catalog'){
    if(!d.bulkRoom||!d.doc.rooms[d.bulkRoom])return fail('Choose a room first');
    const asset=d.logicalDevices.find(x=>x.asset_id===id);
    if(!asset)return fail('Unknown discovered device');
    const targetRoom=d.doc.rooms[d.bulkRoom];
    const linked=rhiMmWholeAssetBindings(targetRoom,asset);
    if(!linked.length)return fail('This device is not assigned to this room');
    if(linked.length!==1)return fail('Ambiguous or missing room binding. Review the native source and room assignments.');
    const [key]=linked[0];
    if(Object.values(targetRoom.activities||{}).some(a=>(a.devices||[]).includes(key)||
      [...(a.steps||[]),...(a.stop_steps||[])].some(step=>step.device===key)||
      Object.values(a.button_map||{}).some(b=>b.device===key)||
      Object.values(a.macros||{}).some(m=>(m.steps||[]).some(step=>step.device===key))))
      return fail('This device is used in an activity. Remove or update the activity first');
    delete targetRoom.devices[key];
    d.device='';d.dirty=true;d.error='';return true;
  }
  if(action==='bulk_remove'){
    if(!d.bulkRoom||!d.doc.rooms[d.bulkRoom])return fail('Choose a room first');
    const before=rhiMmWholeSnapshot(d),selected=d.selectedAssets.slice();
    const previousDirty=d.dirty,previousDevice=d.device;
    let removed=0;
    for(const assetId of selected){
      const asset=d.logicalDevices.find(x=>x.asset_id===assetId);
      if(!asset){rhiMmWholeInstall(d,before);d.dirty=previousDirty;d.device=previousDevice;
        return fail('Unknown selected device');}
      const exists=rhiMmWholeAssetBindings(d.doc.rooms[d.bulkRoom],asset).length;
      if(!exists)continue;
      if(!rhiMmWholeAction(d,'remove_catalog',assetId)){
        const message=d.error;
        rhiMmWholeInstall(d,before);d.dirty=previousDirty;d.device=previousDevice;
        return fail('No devices unassigned: '+message);
      }
      removed++;
    }
    d.selectedAssets=[];d.error=removed?'':'Selected devices were not assigned to this room';
    return true;
  }
  if(action==='bulk_assign'){
    if(!d.bulkRoom||!d.doc.rooms[d.bulkRoom])return fail('Choose a room for assignment');
    const before=rhiMmWholeSnapshot(d),selected=d.selectedAssets.slice();
    const previous={room:d.room,device:d.device,tab:d.tab,dirty:d.dirty,detailAsset:d.detailAsset,newSource:d.newSource};
    const restore=()=>{rhiMmWholeInstall(d,before);Object.assign(d,previous);};
    let done=0;
    for(const assetId of selected){
      const asset=d.logicalDevices.find(x=>x.asset_id===assetId);
      if(!asset){restore();return fail('Unknown selected logical device');}
      const exists=rhiMmWholeAssetBindings(d.doc.rooms[d.bulkRoom],asset).length;
      if(exists>1){restore();return fail('Ambiguous or missing room binding. Review the native source and room assignments.');}
      if(exists)continue;
      if(!rhiMmWholeAction(d,'assign_catalog',assetId)){
        const message=d.error;
        restore();
        return fail('No devices assigned: '+message);
      }
      done++;
    }
    d.tab='discovery';d.room=d.bulkRoom;d.selectedAssets=[];
    d.detailAsset=selected[0]||d.detailAsset;
    d.device='';d.error=done?'': 'All selected devices are already assigned to this room';
    return true;
  }
  if(action==='assign_catalog'){
    if(d.bulkRoom&&d.doc.rooms[d.bulkRoom])d.room=d.bulkRoom;
    const target=d.doc.rooms[d.room];
    if(!target){d.tab='rooms';return fail('Create a room before assigning a source');}
    const asset=(d.logicalDevices||[]).find(x=>x.asset_id===id);
    if(!asset)return fail('Unknown logical device');
    const existing=rhiMmWholeAssetBindings(target,asset);
    if(existing.length>1)return fail('Ambiguous or missing room binding. Review the native source and room assignments.');
    if(existing.length===1){d.device=existing[0][0];d.detailAsset=id;d.tab='discovery';d.error='';return true;}
    const owner=d.deviceCatalog?.[id];
    const media=(asset.candidates||[]).filter(x=>x.entity_id.startsWith('media_player.'));
    const candidate=owner?(asset.candidates||[]).find(x=>x.entity_id===owner.entity&&
      x.concept===owner.foundation_concept&&x.candidate_id===owner.foundation_candidate_id):
      media.find(x=>x.provider==='androidtv_remote')&&new Set(media.map(x=>x.concept)).size>1?null:
      media[0]||asset.candidates?.[0];
    if(!candidate)return fail('Choose the exact display or source in Devices before assigning this device');
    const index=d.sources.findIndex(s=>s.entity===candidate?.entity_id&&
      s.candidate===candidate?.candidate_id&&s.concept===candidate?.concept);
    if(index<0)return fail('Foundation source identity changed; reopen configuration');
    d.newSource=String(index);
    const assigned=rhiMmWholeAction(d,'add_device');
    if(assigned){d.detailAsset=id;d.tab='discovery';}
    return assigned;
  }
  if(action==='select_device'){if(!room?.devices?.[id])return false;d.device=id;d.error='';return true;}
  if(action==='select_activity'){if(!room?.activities?.[id])return false;d.activity=id;d.error='';return true;}
  if(action==='add_room'){
    const key=rhiMmWholeSlug(d.newRoom);
    if(!/^[a-z][a-z0-9_]*$/.test(key)||key.length>80)return fail('Enter a valid room name');
    if(d.doc.rooms[key])return fail('Room already exists');
    if(d.newArea&&!d.areas[d.newArea])return fail('Choose a registered HA Area');
    d.doc.rooms[key]={name:d.newRoom.trim(),area_id:d.newArea||null,devices:{},activities:{}};
    d.room=key;d.bulkRoom=key;d.device='';d.activity='';d.newRoom='';d.tab='discovery';
  }else if(action==='add_room_area'){
    if(!room)return fail('Choose a room first');
    const name=d.newRoomArea.trim(),key=rhiMmWholeSlug(name);
    if(!name||name.length>80||!/^[a-z][a-z0-9_]*$/.test(key))
      return fail('Enter a valid Room Area name');
    room.room_areas||={};
    if(room.room_areas[key]||
        Object.values(room.room_areas).some(x=>x.name.trim().toLowerCase()===name.toLowerCase()))
      return fail('Room Area already exists');
    room.room_areas[key]={name};d.newRoomArea='';
  }else if(action==='delete_room_area'){
    if(!room?.room_areas?.[id])return fail('Unknown Room Area');
    if(Object.values(room.devices||{}).some(x=>x.room_area===id)||
        Object.values(room.activities||{}).some(x=>x.room_area===id))
      return fail('Unassign the Room Area from devices and activities first');
    delete room.room_areas[id];
    if(!Object.keys(room.room_areas).length)delete room.room_areas;
  }else if(action==='delete_room'){
    if(!room)return false;
    delete d.doc.rooms[d.room];d.room=Object.keys(d.doc.rooms)[0]||'';d.device='';d.activity='';
  }else if(action==='add_device'){
    if(!room)return fail('Select a room first');
    const source=d.sources[Number(d.newSource)];
    if(!source||!source.entity||!source.candidate)return fail('Choose a Foundation-supported source');
    if((d.deviceCatalog?Object.values(d.deviceCatalog):Object.values(d.doc.rooms||{}).flatMap(r=>Object.values(r.devices||{})))
      .some(x=>x.computer_agent?.entity===source.entity))return fail('This media endpoint is already linked to a computer');
    if(source.concept==='network'&&d.sources.some(s=>s.concept!=='network'&&s.provider!=='hass_agent'&&
       (s.network_observations||[]).some(x=>x.candidate_id===source.candidate)))
      return fail('Choose the existing AV device; this tracker supplies its network information');
    if(source.review_reason==='ambiguous_candidate_identity')
      return fail('Conflicting Foundation candidates for this native entity. Review the source in Foundation before linking.');
    if(Object.values(room.devices||{}).some(x=>x.entity===source.entity))
      return fail('This native device is already assigned to the room');
    // The shared role helper retains existing physical resource policy.
    const base=source.concept==='network'?'computer':source.concept==='display'?'screen':source.concept==='amplifier'?'amplifier':'source';
    let key=base,n=2;while(Object.prototype.hasOwnProperty.call(room.devices,key))key=base+'_'+n++;
    const role=rhiMmWholeSharedRole(d,{name:source.label,entity:source.entity,
      foundation_concept:source.concept,foundation_candidate_id:source.candidate,
      foundation_entity_registry_id:source.entity_registry_id,
      foundation_config_entry_id:source.config_entry_id,
      foundation_device_registry_id:source.native_device_id,
      foundation_provider:source.provider,
      control_approved:source.concept!=='network'&&source.available===true&&!source.review_reason,
      physical_id:source.logical_asset_id||source.entity,
      asset_id:source.logical_asset_id||source.entity,
      role:source.concept==='network'?'computer':source.concept==='display'?'display':source.concept==='amplifier'?'receiver':
        source.entity.startsWith('remote.')?'remote':'player',
      ...(source.concept==='network'?{on_states:['home']}:{}),
      power_mode:source.entity.startsWith('remote.')?'passive':'native'});
    if(!role)return fail('Choose the existing speech-capable source for this shared device');
    room.devices[key]=role;
    d.device=key;d.newSource='';
  }else if(action==='delete_device'){
    if(!room?.devices?.[d.device])return false;
    if(Object.values(room.activities||{}).some(x=>x.devices?.includes(d.device)))
      return fail('Device is used by an activity. Remove it from that activity first.');
    delete room.devices[d.device];d.device='';
  }else if(action==='add_activity'){
    if(!room)return fail('Choose a room first');
    const key=rhiMmWholeSlug(d.newActivity);
    if(!/^[a-z][a-z0-9_]*$/.test(key)||key.length>80)return fail('Enter an activity name');
    if(room.activities[key])return fail('Activity already exists');
    if(d.newType==='work_on_pc'){
      const pc=room.devices[d.newActivitySource];
      if(!pc||pc.foundation_concept!=='network'||pc.role!=='computer')
        return fail('Choose a configured computer in this room');
      const target=d.newActivityTarget;
      const screen=room.devices[target];
      const choice=d.newActivityInput;
      if(target){
        if(!screen||screen.foundation_concept!=='display'||!screen.entity.startsWith('media_player.'))
          return fail('Choose a configured native display');
        const native=d.sources.find(x=>x.entity===screen.entity&&x.candidate===screen.foundation_candidate_id);
        if(!choice||!(native?.source_list||[]).includes(choice))
          return fail('Choose an input that the selected native TV or receiver actually offers');
      }else if(choice)return fail('Choose a configured native display');
      room.activities[key]={name:d.newActivity.trim(),activity_type:'work_on_pc',
        devices:[d.newActivitySource,...(target?[target]:[])],
        steps:target?[{type:'source',device:target,candidates:[choice]}]:[],stop_steps:[]};
      d.activity=key;d.newActivity='';d.newActivityInput='';d.newActivitySource='';
      d.newActivityTarget='';d.tab='activities';d.dirty=true;d.error='';return true;
    }
    const entries=Object.entries(room.devices||{});
    const targets=entries.filter(([,x])=>['display','amplifier'].includes(x.foundation_concept)&&
      x.entity.startsWith('media_player.'));
    const playable=entries.filter(([,x])=>x.entity.startsWith('media_player.')&&
      d.sources.some(source=>source.entity===x.entity&&
        source.candidate===x.foundation_candidate_id&&source.native_can_play===true));
    const target=room.devices[d.newActivityTarget]?
      d.newActivityTarget:(d.newType==='listen_music'?'':targets.length===1?targets[0][0]:'');
    const selected=room.devices[target];
    const source=room.devices[d.newActivitySource];
    const kind=d.newType;
    const video=kind!=='listen_music';
    if(video&&!entries.some(([,x])=>x.foundation_concept==='display'&&
      x.entity.startsWith('media_player.')))
      return fail('Video activities require a native screen in this room');
    if(video&&(!selected||selected.foundation_concept==='source'))
      return fail('Select a configured TV or receiver for this activity');
    if(['watch_source','play_game'].includes(kind)&&
      (!source||source.foundation_concept!=='source'||!source.entity.startsWith('media_player.')))
      return fail('Choose one native player or console source from this room');
    const native=d.sources.find(x=>x.entity===selected?.entity&&
      x.candidate===selected?.foundation_candidate_id);
    const offered=native?.source_list||[];
    const choice=d.newActivityInput;
    if((video||choice)&&(!choice||!offered.includes(choice)))
      return fail('Choose an input that the selected native TV or receiver actually offers');
    if(kind==='listen_music'&&(!source||!playable.some(([key])=>key===d.newActivitySource)))
      return fail('Choose a native media player with real Play support for music');
    const cast=[];
    if(target)cast.push(target);
    // Optional receiver co-location is only a role suggestion, not proof of
    // physical audio routing or a second source. Users may edit the cast.
    if(video&&targets.length===2){
      const audio=targets.find(([k,x])=>x.foundation_concept==='amplifier'&&k!==target);
      if(audio)cast.push(audio[0]);
    }
    if(source&&!cast.includes(d.newActivitySource))cast.push(d.newActivitySource);
    if(!cast.length)return fail('Choose a native device for the activity');
    const steps=choice?[{type:'source',device:target,candidates:[choice]}]:[];
    if(kind==='listen_music')steps.push({type:'play',device:d.newActivitySource});
    room.activities[key]={name:d.newActivity.trim(),activity_type:kind,
      devices:cast,steps,stop_steps:[]};
    d.activity=key;d.newActivity='';d.newActivityInput='';d.newActivitySource='';
    d.newActivityTarget='';d.tab='activities';
  }else if(action==='delete_activity'){
    if(!room?.activities?.[d.activity])return false;
    delete room.activities[d.activity];d.activity='';
  }else if(['step_add','step_remove','step_up','step_down'].includes(action)){
    const steps=activity?.[phase];
    if(!Array.isArray(steps)||!['steps','stop_steps'].includes(phase))return false;
    const i=Number(index);
    if(action==='step_add'){
      if(!activity.devices?.length)return fail('Choose activity devices first');
      steps.push({type:'delay',device:activity.devices[0],milliseconds:0});
    }else if(action==='step_remove'){if(i<0||i>=steps.length)return false;steps.splice(i,1);}
    else if(action==='step_up'){if(i<1||i>=steps.length)return false;[steps[i-1],steps[i]]=[steps[i],steps[i-1]];}
    else if(action==='step_down'){if(i<0||i>=steps.length-1)return false;[steps[i+1],steps[i]]=[steps[i],steps[i+1]];}
  }else return false;
  d.dirty=true;d.error='';return true;
}
