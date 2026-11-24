const RHI_MM_WHOLE_TYPES=['watch_tv','watch_hdmi','watch_source','listen_music','play_game'];
const RHI_MM_WHOLE_STEPS=['source','volume','sound_mode','play','pause','remote_key','delay','wait_until'];
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
  const logicalDevices=JSON.parse(context.logical_devices_json||'[]');
  const proposedRooms=JSON.parse(context.proposed_rooms_json||'{}');
  const proposalExceptions=JSON.parse(context.proposal_exceptions_json||'[]');
  const room=Object.keys(doc.rooms)[0]||'';
  return {doc,areas,floors,areaFloors,sources,logicalDevices,proposedRooms,proposalExceptions,room,device:'',activity:'',tab:'discovery',
    catalogFilter:'all',catalogType:'all',catalogQuery:'',bulkRoom:room,selectedAssets:[],detailAsset:'',dirty:false,error:'',newRoom:'',newRoomArea:'',newArea:Object.keys(areas)[0]||'',newSource:'',
    newActivity:'',newType:'watch_tv',newActivityTarget:'',newActivityInput:'',newActivitySource:''};
}
function rhiMmWholeSlug(name){
  return String(name||'').normalize('NFKD').toLowerCase()
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_')
    .replace(/^_+|_+$/g,'');
}
function rhiMmWholeForPhysical(d,device,mutate){
  const physical=device.physical_id||device.entity;
  for(const room of Object.values(d.doc.rooms||{})){
    for(const current of Object.values(room.devices||{})){
      if((current.physical_id||current.entity)===physical)mutate(current);
    }
  }
}
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
function rhiMmWholeVerifiedMacs(d,device){
  // Native Device Registry MAC evidence is read-only before Review/Save.
  // Command rights remain enforced by the backend and must not follow discovery.
  const matches=d.sources.filter(s=>s.entity===device?.entity&&
    s.concept===device?.foundation_concept&&
    s.candidate===device?.foundation_candidate_id&&
    !s.review_reason&&s.entity_registry_id&&s.config_entry_id&&s.provider);
  return matches.length===1?matches[0].verified_macs||[]:[];
}
function rhiMmWholeCurrent(d){
  const room=d.doc.rooms[d.room];
  if(room){
    if(!Object.prototype.hasOwnProperty.call(room.devices||{},d.device))
      d.device=Object.keys(room.devices||{})[0]||'';
    if(!Object.prototype.hasOwnProperty.call(room.activities||{},d.activity))
      d.activity=Object.keys(room.activities||{})[0]||'';
  }
  return {room,device:room?.devices?.[d.device],activity:room?.activities?.[d.activity]};
}
function rhiMmWholeRender(d,t,escape){
  const e=escape;
  if(!d)return `<p role='alert'>Unable to read the saved Multimedia configuration.</p>`;
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
    ['discovery','Discovered devices','mdi:devices'],
    ['rooms',t('settings_floor_rooms'),'mdi:floor-plan'],
    ['devices',t('devices'),'mdi:television'],
    ['activities',t('activities'),'mdi:play-box-multiple-outline']
  ];
  // The main product tabs already select Discovery vs Settings. Only Settings
  // needs the Rooms/Devices/Activities *object categories* as local navigation.
  // No second competing Discovery tab in the whole-home editor.
  const localSections=d.workspace==='discovery'?[]:
    d.workspace==='settings'?sections.filter(x=>x[0]!=='discovery'):sections;
  const rooms=Object.entries(d.doc.rooms);
  const {room,device,activity}=rhiMmWholeCurrent(d);
  const floorRooms=new Map();
  for(const [id,r] of rooms){
    const floorId=d.areaFloors[r.area_id]||'__unassigned__';
    if(!floorRooms.has(floorId))floorRooms.set(floorId,[]);
    floorRooms.get(floorId).push([id,r]);
  }
  const roomButtons=[...floorRooms].map(([floorId,items])=>
    `<div class='mm-wh-floor-group'><strong>${e(d.floors[floorId]||'Floor not published')} · ${items.length} rooms</strong>
      <div class='mm-wh-list'>${items.map(([id,r])=>entry(id,r.name||id,id===d.room,'select_room')).join('')}</div>
    </div>`).join('');
  const sourceRows=d.sources.map((s,i)=>[String(i),`${s.label} · ${s.logical_type||s.concept} · ${s.provider}${s.approved?'':' · pending command approval'}${s.review_reason?' · needs review: '+s.review_reason:''}${s.available?'':' · unavailable'}`]);
  const deviceRows=Object.entries(room?.devices||{});
  const activityRows=Object.entries(room?.activities||{});
  const roomAreas=Object.entries(room?.room_areas||{});
  const roomAreaChoices=[['','Whole room'],...roomAreas.map(([id,area])=>[id,area.name])];
  const currentDevice=d.device&&room?.devices?.[d.device]?d.device:deviceRows[0]?.[0]||'';
  const currentActivity=d.activity&&room?.activities?.[d.activity]?d.activity:activityRows[0]?.[0]||'';
  const selectedDevice=room?.devices?.[currentDevice];
  const selectedActivity=room?.activities?.[currentActivity];
  const currentWake=selectedDevice?.power_on?.action==='wake_on_lan.send_magic_packet'
    ?selectedDevice.power_on.data||{}:null;
  const verifiedMacs=rhiMmWholeVerifiedMacs(d,selectedDevice);
  const sameNativeCandidates=d.sources.filter(s=>s.entity===selectedDevice?.entity&&
    s.concept===selectedDevice?.foundation_concept);
  const unresolvedDevice=String(selectedDevice?.entity||'').startsWith('REPLACE_WITH_');
  const resolveChoices=d.sources.map((source,index)=>[String(index),source]).filter(([,source])=>
    source.concept===selectedDevice?.foundation_concept&&!source.review_reason&&
    source.entity_registry_id&&source.config_entry_id&&source.candidate&&
    (selectedDevice?.role==='remote'?source.entity.startsWith('remote.'):source.entity.startsWith('media_player.')));
  const currentCandidate=selectedDevice?.foundation_candidate_id||'';
  const bindingCurrent=sameNativeCandidates.some(s=>s.candidate===currentCandidate);
  const nativeBindingChoices=[
    ...(!bindingCurrent&&selectedDevice?[ [currentCandidate,currentCandidate+' · no longer selected in Foundation'] ]:[]),
    ...sameNativeCandidates.map(s=>[s.candidate,s.label+' · '+s.provider])
  ];
  const allDiscovered=(d.logicalDevices||[]).map(asset=>{
    const linkedRoomIds=rooms.filter(([,r])=>Object.values(r.devices||{}).some(x=>
      // The configured logical asset is stable even when Foundation reissues
      // a candidate or HA renames its entity. Never infer a link by label.
      (x.asset_id&&x.asset_id===asset.asset_id)||
      (x.physical_id&&x.physical_id===asset.asset_id)||
      (asset.candidates||[]).some(c=>x.foundation_concept===c.concept&&
        (x.foundation_candidate_id===c.candidate_id||
         x.entity===c.entity_id))
    )).map(([id])=>id);
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
  let content='';
  if(d.tab==='discovery'){
    const currentAsset=discovered.find(x=>x.asset_id===d.detailAsset)||
      (d.logicalDevices||[]).find(x=>x.asset_id===d.detailAsset);
    const assigned=room&&currentAsset?Object.entries(room.devices||{}).find(([,x])=>
      (x.asset_id||x.physical_id)===currentAsset.asset_id||
      (currentAsset.candidates||[]).some(c=>c.entity_id===x.entity&&c.concept===x.foundation_concept)):null;
    const currentBinding=assigned?.[1];
    const connected=d.sources.find(x=>x.entity===currentBinding?.entity&&x.candidate===currentBinding?.foundation_candidate_id);
    const wol=currentBinding?.power_on?.action==='wake_on_lan.send_magic_packet';
    const enabledWol=wol&&currentBinding?.wol_enabled!==false;
    const assets=discovered;
    const repairs=rhiMmWholeRepairable(d);
    const selectedRepair=repairs.find(x=>x.roomId===d.bulkRoom&&x.key===assigned?.[0]);
    const types=[...new Set((d.logicalDevices||[]).map(x=>x.logical_type).filter(Boolean))].sort();
    content=`<div class='mm-wh-grid mm-wh-discovery'><section class='mm-wh-panel'>
      <div class='mm-wh-heading'><div><h4>Device discovery &amp; assignment</h4>
        <p>Found ${allDiscovered.length} supported devices · ${allDiscovered.filter(x=>!x.linkedRoomIds.length).length} unassigned in this draft</p></div>
        <div class='mm-wh-step-actions'>
          <button type='button' data-wh-action='repair_bindings'
            ${repairs.length?'':'disabled'}>Review ${repairs.length} saved device link${repairs.length===1?'':'s'}</button>
          <button type='button' data-wh-action='apply_proposals'
            ${Object.keys(d.proposedRooms||{}).length?'':'disabled'}>Review proposed home setup (${Object.keys(d.proposedRooms||{}).length} rooms)</button>
        </div></div>
        ${repairs.length?'<p class="mm-muted">Review exact native links without replacing rooms or starting devices.</p>':''}
        ${!Object.keys(d.proposedRooms||{}).length?`<p role='status' class='mm-muted'>No unambiguous automatic room proposals. Existing rooms are preserved; create or edit a room in Settings using a real Home Assistant Area. Native source discovery remains available.</p>
          <button type='button' data-nav='settings'>Open Rooms &amp; Devices in Settings</button>`:''}
      <div class='mm-wh-searchfilters'>
        <label>Search ${field('catalog_query',d.catalogQuery)}</label>
        <label>Type ${select('catalog_type',d.catalogType,[['all','All device types'],...types.map(x=>[x,x.replaceAll('_',' ')])])}</label>
        <label>Status ${select('catalog_filter',d.catalogFilter,
          [['all','All supported'],['unassigned','Unassigned'],['in_room','Assigned to selected room'],['shared','Shared across rooms'],['classified','Classified'],['review','Needs review']])}</label>
      </div>
      <small>One logical device per actual endpoint. Native remotes and related entities remain linked, not duplicated. Filters never delete devices.</small>
      <div class='mm-wh-tablewrap'><table class='mm-wh-table'>
        <thead><tr><th>Pick</th><th>Discovered device</th><th>Type</th><th>Status</th><th>Assigned rooms</th><th>Action</th></tr></thead>
        <tbody>${assets.map(asset=>{
          const primary=(asset.candidates||[]).find(x=>x.entity_id.startsWith('media_player.'))||asset.candidates?.[0];
          const availability=primary?.available===true?'Available':'Temporarily unavailable';
          const binding=asset.linkedRooms.length?'Configured':'Not assigned';
          const approval=asset.approved_candidates>0?'Control approved':'Review control permission';
          const reason=(asset.review_reasons||[]).join(', ');
          const chosen=d.selectedAssets.includes(asset.asset_id);
          return `<tr ${d.detailAsset===asset.asset_id?"class='mm-wh-rowactive'":''}>
            <td>${field('catalog_selected:'+asset.asset_id,chosen,'checkbox')}</td>
            <td><button type='button' data-wh-action='catalog_detail' data-wh-id='${e(asset.asset_id)}'>
              <strong>${e(asset.name||asset.model||primary?.entity_id||'Unknown device')}</strong></button>
              <small>${e(asset.model||asset.manufacturer||primary?.provider||'Native device')}</small></td>
            <td>${e((asset.logical_type||'media_player').replaceAll('_',' '))}</td>
            <td><strong>${e(binding)}</strong><small>${e(availability)}</small><small>${e(reason?'Needs review: '+reason:approval)}</small></td>
            <td>${e(asset.linkedRooms.join(', ')||'Not assigned')}</td>
            <td><button type='button' data-wh-action='assign_catalog' data-wh-id='${e(asset.asset_id)}'
              ${rooms.length?'':'disabled'}>${asset.linkedRoomIds.includes(d.bulkRoom)?'Edit':'Assign'}</button></td>
          </tr>`;
        }).join('')}</tbody></table></div>
      ${!assets.length?'<p>No supported candidates have been published yet, or no devices match these filters. Adjust filters or check Foundation discovery.</p>':''}
      <div class='mm-wh-bulk'>
        <strong>${d.selectedAssets.length} selected</strong>
        <label>Assign to room ${select('bulk_room',d.bulkRoom,
          [['','Choose a room'],...rooms.map(([id,r])=>[id,r.name||id])])}</label>
        <button type='button' data-wh-action='bulk_assign'
          ${!d.selectedAssets.length||!rooms.length?'disabled':''}>Assign selected devices</button>
        <button type='button' data-wh-action='bulk_remove'
          ${!d.selectedAssets.length||!rooms.length?'disabled':''}>Unassign selected from room</button>
        <button type='button' data-wh-action='clear_selected'
          ${d.selectedAssets.length?'':'disabled'}>Clear selection</button>
      </div>
      ${(d.proposalExceptions||[]).length?`<details><summary>${d.proposalExceptions.length} routes or locations need review</summary>
        ${d.proposalExceptions.map(x=>`<div>${e(x)}</div>`).join('')}</details>`:''}
    </section><section class='mm-wh-panel mm-wh-detail'>
      <h4>${e(currentAsset?.name||currentAsset?.model||'Select a discovered device')}</h4>
      ${currentAsset?`<p>Type: ${e(currentAsset.logical_type||'Unknown')} ·
        ${e(currentAsset.linkedRooms?.join(', ')||'Unassigned')}</p>
        <label>Room to configure ${select('bulk_room',d.bulkRoom,
          [['','Choose a room'],...rooms.map(([id,r])=>[id,r.name||id])])}</label>
        ${d.doc.rooms[d.bulkRoom]?`<small>HA Area:
          ${e(d.areas[d.doc.rooms[d.bulkRoom].area_id]||'Not assigned')} · Floor:
          ${e(d.floors[d.areaFloors[d.doc.rooms[d.bulkRoom].area_id]]||'Not published')}</small>`:''}
        ${currentBinding?`
          <p role='status' class='mm-muted'>Native control: ${e(currentBinding.control_approved===true?'requested for this exact source':'not yet approved in this draft')} · ${e(connected?.review_reason||(!connected?'current candidate not found; reselect in Devices':'review exact registry identity before Save'))}</p>
          ${currentAsset.linkedRoomIds?.length>1&&['television','display'].includes(currentAsset.logical_type)?`<p class='mm-room-error'>This display is linked to multiple rooms. Verify its physical placement and remove only an incorrect room link; nothing is reassigned automatically.</p>`:''}
          <button type='button' data-wh-action='focus_binding'>Review binding, permission and Wake-on-LAN in Settings</button>
          ${selectedRepair?`<button type='button' data-wh-action='repair_binding'
            data-wh-id='${e(selectedRepair.roomId+':'+selectedRepair.key)}'>
            Review this device link (one-device test)</button>`:''}
          <label>Display name ${field('device_name',currentBinding.name||'')}</label>
          <label>Role ${select('device_role',currentBinding.role||'player',
            [['display','TV / Display'],['receiver','Receiver / Audio zone'],['player','Media player'],['remote','Remote / Hub']])}</label>
          ${Object.keys(d.doc.rooms[d.bulkRoom]?.room_areas||{}).length?`<label>Zone within room
            ${select('device_room_area',currentBinding.room_area||'',
              [['','Whole room'],...Object.entries(d.doc.rooms[d.bulkRoom].room_areas)
                .map(([id,area])=>[id,area.name])])}</label>`:''}
          <label>Power ${select('device_power',currentBinding.power_mode||'native',
            [['native','Native / configured wake'],['passive','Passive · observe only']])}</label>
          <label class='mm-wh-check'>HDMI-CEC ${field('device_cec',currentBinding.hdmi_cec_enabled===true,'checkbox')}</label>
          <label>Wake-on-LAN ${select('device_wol_mode',enabledWol?'directed':'native',
            [['native','Native power-on'],['directed','Use verified native MAC']])}</label>
          <label>Native MAC ${select('device_wol_mac',
            wol?currentBinding.power_on.data.mac:'',[['','Choose exact native MAC'],
              ...rhiMmWholeVerifiedMacs(d,currentBinding).map(m=>[m,m])])}</label>
          ${wol?`<label>Destination IPv4 ${field('device_wol_ip',currentBinding.power_on.data.broadcast_address||'')}</label>
            <label>UDP port ${field('device_wol_port',currentBinding.power_on.data.broadcast_port??9,'number','min="1" max="65535"')}</label>`:''}
          <label>After power-on (ms) ${field('device_delay',currentBinding.post_power_on_delay_ms??0,'number','min="0" max="30000"')}</label>
          <details><summary>Native identity and related entities</summary>
            <p>${e(currentBinding.entity)} · ${e(connected?.provider||'unknown provider')}</p>
            <button type='button' data-more-info='${e(currentBinding.entity)}'>Open native Home Assistant player</button>
            ${(connected?.related_entities||[]).map(x=>`<div><code>${e(x.entity_id)}</code> · ${e(x.availability)}
              <button type='button' data-more-info='${e(x.entity_id)}'>Inspect source</button></div>`).join('')}
          </details>
        `:`<p>Assign this discovered device to the selected room to configure controls. Discovery alone never activates physical commands.</p>
        <button type='button' data-wh-action='assign_catalog' data-wh-id='${e(currentAsset.asset_id)}'
          ${!rooms.length?'disabled':''}>Assign to room</button>`}
      ${currentBinding?`<button type='button' class='danger' data-wh-action='remove_catalog'
        data-wh-id='${e(currentAsset.asset_id)}'>Unassign from this room</button>`:''}
      `:'<p>Pick any device in the table to view exact native sources and configure its role, power and CEC.</p>'}
    </section></div>`;
  }else if(d.tab==='rooms'){
    content=`<div class='mm-wh-grid'><section class='mm-wh-panel'>
      <h4>Home structure <small>Native HA Floor / Area</small></h4>
      ${roomButtons||'<p>No rooms configured yet</p>'}
      <a class='mm-wh-native-link' href='/config/areas/dashboard'>Create, edit or remove floors and Areas in Home Assistant</a>
      <small>HA owns these locations. After changes in HA, reopen Multimedia Settings to load updated locations.</small>
      <h4>Link Multimedia room</h4>
      <label>Name${field('new_room',d.newRoom)}</label>
      <label>Native HA Area${select('new_area',d.newArea,
        [['','Unassigned'],...Object.entries(d.areas)])}</label>
      <button type='button' data-wh-action='add_room'>Add room</button>
    </section><section class='mm-wh-panel'>
      <h4>${e(room?.name||'Choose a room')}</h4>
      ${room?`<label>Room name${field('room_name',room.name)}</label>
        <label>Native Home Assistant Area${select('room_area',room.area_id||'',
          [['','No native area'],...Object.entries(d.areas)])}</label>
        <small>Native HA Area: ${e(d.areas[room.area_id]||'Unassigned')} · Floor: ${e(d.floors[d.areaFloors[room.area_id]]||'Not published')}. Floor and Area creation, rename and removal remain in Home Assistant.</small>
        <details class='mm-wh-room-areas'><summary>Room Areas (optional subdivisions)</summary>
          <small>Group AV setups within one room. Room Areas do not create native HA Areas or controllers.</small>
          ${roomAreas.map(([id,area])=>`<div class='mm-wh-area'>
            <label>Area name ${field('room_area_name:'+id,area.name)}</label>
            <button type='button' data-wh-action='delete_room_area'
              data-wh-id='${e(id)}'>Remove</button></div>`).join('')}
          <label>New Room Area ${field('new_room_area',d.newRoomArea)}</label>
          <button type='button' data-wh-action='add_room_area'>Add Room Area</button>
        </details>
        <p>${Object.keys(room.devices||{}).length} devices · ${Object.keys(room.activities||{}).length} activities</p>
        <button type='button' class='danger' data-wh-action='delete_room'>Remove room</button>`:''}
    </section></div>`;
  }else if(d.tab==='devices'){
    content=`<div class='mm-wh-grid'><section class='mm-wh-panel'>
      <h4>Devices · ${e(room?.name||'No room')}</h4>
      <div class='mm-wh-list'>${deviceRows.map(([id,x])=>entry(id,x.name||id,id===currentDevice,'select_device')).join('')}</div>
      <h4>Assign supported device</h4>
      <label>Foundation supported source${select('new_source',d.newSource,
        [['','Choose a discovered source'],...sourceRows])}</label>
      <button type='button' data-wh-action='add_device' ${d.newSource===''||!room?'disabled':''}>Assign device</button>
      <small>Source binding and explicit control choice are reviewed together in one Multimedia Save; no separate Foundation wizard.</small>
    </section><section class='mm-wh-panel'>
      <h4>${e(selectedDevice?.name||'Select a device')}</h4>
      ${selectedDevice?`<small>${e(selectedDevice.entity||'')} · ${e(selectedDevice.foundation_concept||'')} · ${e(currentDevice)}</small>
        <label>Display name${field('device_name',selectedDevice.name||'')}</label>
        <label class='mm-wh-check'>Enable native Premium controls after Review &amp; Save ${field('device_control_approved',selectedDevice.control_approved===true,'checkbox')}</label>
        <small>Allowed only for this exact currently registered Foundation/native identity; HA permissions and capabilities are rechecked before each command.</small>
        ${unresolvedDevice?`<label>Choose the actual device for this role
          ${select('device_resolve','',[['','Select compatible native device'],...resolveChoices.map(([id,s])=>[id,s.label+' · '+(d.areas[s.area_id]||'Area not assigned')+' · '+s.provider])])}</label>
          <small>The room role and activity references are preserved. No device is started.</small>`:
          `<details><summary>Native device identity</summary><label>Foundation candidate
          ${select('device_candidate',currentCandidate,nativeBindingChoices,sameNativeCandidates.length?'':'disabled')}</label></details>`}
        ${!bindingCurrent?`<p class='mm-room-error'>Native source no longer present in
          Foundation-supported discovery. Review this exact binding.</p>`:
          sameNativeCandidates.every(x=>!x.approved)?
          '<p class="mm-room-error">Discovered source · command approval pending.</p>':''}
        <details><summary>Related native source entities</summary>
          ${(d.sources.find(x=>x.entity===selectedDevice.entity&&
            x.candidate===selectedDevice.foundation_candidate_id)?.related_entities||[])
            .map(x=>`<div><code>${e(x.entity_id)}</code> · ${e(x.provider||x.domain||'native')}
              · ${e(x.availability)}</div>`).join('')}
        </details>
        <label>Role${select('device_role',selectedDevice.role||'player',
          [['display','TV / Display'],['receiver','Receiver / Audio zone'],['player','Media player'],['remote','Remote / Hub']])}</label>
        ${roomAreas.length?`<label>Room Area (optional)${select('device_room_area',selectedDevice.room_area||'',roomAreaChoices)}</label>`:''}
        <label>Power behaviour${select('device_power',selectedDevice.power_mode||'native',
          [['native','Automatic · use configured WoL for Power On'],['passive','Passive (observe only)']])}</label>
        <label class='mm-wh-check'>HDMI-CEC enabled for this device ${field('device_cec',selectedDevice.hdmi_cec_enabled===true,'checkbox')}</label>
        <label>After power-on (ms)${field('device_delay',selectedDevice.post_power_on_delay_ms??0,'number','min="0" max="30000" step="1"')}</label>
        <details class='mm-wh-device-wol' ${currentWake?'open':''}>
          <summary>Wake-on-LAN · optional per device</summary>
          <label>Power-on method${select('device_wol_mode',currentWake&&selectedDevice.wol_enabled!==false?'directed':'native',
            [['native','Use native HA power-on (no WoL override)'],['directed','Wake-on-LAN · MAC + optional LAN IPv4']])}</label>
          <label>MAC address (verified native) ${select('device_wol_mac',
            currentWake?.mac||'',[['','Choose exact native MAC'],...verifiedMacs.map(mac=>[mac,mac])])}</label>
          ${currentWake?`<label>Destination IPv4 (optional)
            ${field('device_wol_ip',currentWake.broadcast_address||'')}</label>
            <label>UDP port ${field('device_wol_port',currentWake.broadcast_port??9,'number','min="1" max="65535" step="1"')}</label>`:''}
          <small>Verified MACs: ${e(verifiedMacs.join(', ')||'none published by native HA')}.
            WOL is used automatically by the ordinary On button and activity startup if
            configured and approved. Test Wake-on-LAN is on the native logical HA Device.
            Save never sends a packet; Off stays native. Actual wake requires HA Wake-on-LAN service
            and fresh readback.</small>
          ${selectedDevice.power_mode==='passive'?
            '<small>Passive mode disables direct power-on. Choose Native power behaviour to use WOL.</small>':''}
        </details>
        <small>HDMI-CEC and Wake-on-LAN are separate options. Shared physical devices keep a single power and CEC policy.</small>
        <button type='button' class='danger' data-wh-action='delete_device'>Remove device</button>`:''}
    </section></div>`;
  }else{
    const cast=selectedActivity?.devices||[];
    const typeOptions=RHI_MM_WHOLE_TYPES.map(x=>[x,x.replaceAll('_',' ')]);
    const targets=deviceRows.filter(([,x])=>['display','amplifier'].includes(x.foundation_concept)&&
      x.entity.startsWith('media_player.'));
    const players=deviceRows.filter(([,x])=>x.entity.startsWith('media_player.')&&
      (d.newType==='listen_music'?d.sources.some(source=>
        source.entity===x.entity&&source.candidate===x.foundation_candidate_id&&
        source.native_can_play===true):x.foundation_concept==='source'));
    const preferredTarget=targets.find(([k])=>k===d.newActivityTarget)?.[0]||
      (d.newType==='listen_music'?'':targets.length===1?targets[0][0]:'');
    const chosenTarget=room?.devices?.[preferredTarget];
    const nativeTarget=d.sources.find(x=>x.entity===chosenTarget?.entity&&
      x.candidate===chosenTarget?.foundation_candidate_id);
    const offeredInputs=nativeTarget?.source_list||[];
    const needsPlayer=['watch_source','play_game'].includes(d.newType);
    const needsRoute=d.newType!=='listen_music'||!!offeredInputs.length;
    const renderSteps=phase=>{
      const steps=Array.isArray(selectedActivity?.[phase])?selectedActivity[phase]:[];
      return `<section class='mm-wh-steps'><h4>${phase==='steps'?'Start actions':'Stop / All Off actions'}</h4>
        ${steps.map((step,i)=>{
          const currentSource=room?.devices?.[step.device];
          const selected=d.sources.find(s=>s.entity===currentSource?.entity&&s.candidate===currentSource?.foundation_candidate_id);
          const options=step.type==='sound_mode'?selected?.sound_mode_list||[]:selected?.source_list||[];
          const original=(step.candidates||[])[0]||'';
          const list=[['','Choose verified native input'],...options.map(x=>[x,x])];
          if(original&&!options.includes(original))list.push([original,original+' · not in current native list']);
          let val='';
          if(['source','sound_mode'].includes(step.type))
            val=`<label>Native ${step.type}${select(`step_value:${phase}:${i}`,original,list)}</label>
              ${!options.length?`<small class='mm-room-error'>No native ${step.type} choices are published. Verify Foundation/provider.</small>`:''}`;
          else if(step.type==='volume')val=`<label>Volume 0–1${field(`step_value:${phase}:${i}`,step.level??.5,'number','min="0" max="1" step="0.01"')}</label>`;
          else if(step.type==='remote_key')val=`<label>Native key${field(`step_value:${phase}:${i}`,step.value||'')}</label>`;
          else if(step.type==='delay')val=`<label>Delay ms${field(`step_value:${phase}:${i}`,step.milliseconds??0,'number','min="0" max="30000" step="1"')}</label>`;
          else if(step.type==='wait_until')val=`<label>Wait for actual HA state${select(`step_state:${phase}:${i}`,step.states?.[0]||'on',
              ['on','off','playing','paused','idle','standby','buffering'].map(x=>[x,x]))}</label>
              <label>Timeout s${field(`step_timeout:${phase}:${i}`,step.timeout??15,'number','min="1" max="300" step="1"')}</label>`;
          return `<div class='mm-wh-step'><strong>${i+1}</strong>
            <label>Device${select(`step_device:${phase}:${i}`,step.device||'',
              cast.map(k=>[k,room?.devices?.[k]?.name||k]))}</label>
            <label>Action${select(`step_type:${phase}:${i}`,step.type,
              RHI_MM_WHOLE_STEPS.map(x=>[x,x.replaceAll('_',' ')]))}</label>
            ${val}
            ${!['wait_until','delay'].includes(step.type)?`<label>Override delay ms${field(`step_override:${phase}:${i}`,step.delay_ms??'','number','min="0" max="30000" step="1"')}</label>`:''}
            <div class='mm-wh-step-actions'>
              <button type='button' data-wh-action='step_up' data-phase='${phase}' data-index='${i}' ${i===0?'disabled':''} aria-label='Move action up'>↑</button>
              <button type='button' data-wh-action='step_down' data-phase='${phase}' data-index='${i}' ${i===steps.length-1?'disabled':''} aria-label='Move action down'>↓</button>
              <button type='button' class='danger' data-wh-action='step_remove' data-phase='${phase}' data-index='${i}' aria-label='Remove action'>×</button>
            </div>
          </div>`;
        }).join('')}
        <button type='button' data-wh-action='step_add' data-phase='${phase}' ${cast.length?'':'disabled'}>Add ${phase==='steps'?'start':'stop'} action</button>
      </section>`;
    };
    content=`<div class='mm-wh-grid'><section class='mm-wh-panel'>
      <h4>Activities · ${e(room?.name||'No room')}</h4>
      <div class='mm-wh-list'>${activityRows.map(([id,x])=>entry(id,x.name||id,id===currentActivity,'select_activity')).join('')}</div>
      <h4>Add activity</h4>
      <label>Name${field('new_activity',d.newActivity)}</label>
      <label>Type${select('new_type',d.newType,typeOptions)}</label>
      ${(needsPlayer||d.newType==='listen_music')&&players.length?
        `<label>Media source ${select('new_activity_source',d.newActivitySource,
           [['','Choose a source'],...players.map(([key,x])=>[key,x.name||key])])}</label>`:''}
      ${targets.length?`<label>TV / receiver for route
        ${select('new_activity_target',preferredTarget,
           [['','Choose destination'],...targets.map(([key,x])=>[key,x.name||key])])}</label>`:''}
      ${needsRoute?`<label>Verified native input
        ${select('new_activity_input',d.newActivityInput,
          [['','Select actual source / HDMI input'],...offeredInputs.map(x=>[x,x])])}</label>
        <small>Only the actual native input list is selectable. HDMI/CEC cables are never guessed.</small>`:''}
      <button type='button' data-wh-action='add_activity'>Create configured activity</button>
    </section><section class='mm-wh-panel'>
      <h4>${e(selectedActivity?.name||'Choose an activity')}</h4>
      ${selectedActivity?`<label>Activity name${field('activity_name',selectedActivity.name||'')}</label>
        <label>Type${select('activity_type',selectedActivity.activity_type||'watch_tv',typeOptions)}</label>
        ${roomAreas.length?`<label>Room Area (optional)${select('activity_room_area',selectedActivity.room_area||'',roomAreaChoices)}</label>`:''}
        <h4>Step 1 — Devices involved</h4>
        <div class='mm-wh-cast'>${deviceRows.map(([key,x])=>`<label class='mm-wh-check'>${field('activity_cast:'+key,cast.includes(key),'checkbox')}${e(x.name||key)}</label>`).join('')}</div>
        <h4>Step 2 — Tune actions and sequence</h4>
        ${renderSteps('steps')}${renderSteps('stop_steps')}
        <button type='button' class='danger' data-wh-action='delete_activity'>Remove activity</button>`:''}
    </section></div>`;
  }
  return `<section class='mm-wh-editor mm-surface' data-mm-flow-editor>
    <header class='mm-wh-header'><div><h2>Configure Multimedia</h2>
      <p>Discover → Rooms → Devices → Activities · one Review and Save</p></div>
      <span class='mm-wh-draft'>${d.dirty?'Unsaved changes':'Current saved configuration'}</span></header>
    ${localSections.length?`<nav class='mm-wh-tabs' aria-label='Multimedia object categories'>
      ${localSections.map(([id,label,icon])=>`<button type='button' data-wh-action='tab'
        data-wh-id='${id}' aria-pressed='${d.tab===id}'>
        <ha-icon icon='${icon}'></ha-icon>${e(label)}</button>`).join('')}
    </nav>`:''}
    ${d.tab!=='rooms'&&rooms.length?`<div class='mm-wh-roomselect'><label>Room
      ${select('room_select',d.room,rooms.map(([id,r])=>[id,r.name||id]))}</label></div>`:''}
    ${d.error?`<p class='mm-room-error' role='alert' style='white-space:pre-wrap'>${e(d.error)}</p>`:''}
    ${d.rawDraft==null&&d.error?`<div class='mm-wh-step-actions'>${[...new Set((d.error.match(/rooms\.[a-z][a-z0-9_]*(?:\.(?:devices|activities)\.[a-z][a-z0-9_]*)?/g)||[]))].filter(path=>d.doc.rooms[path.split('.')[1]]).map(path=>`<button type='button' data-wh-action='focus_issue' data-wh-id='${e(path)}'>Review ${e(path.split('.').slice(1).join(' / '))}</button>`).join('')}</div>`:''}
    ${content}
    <details class='mm-wh-expert' ${d.rawDraft!=null?'open':''}>
      <summary>Advanced preferences and complete configuration</summary>
      <div class='mm-wh-global'>
        <label>Default delay between activity steps (ms)
          ${field('global_delay',d.doc.default_step_delay_ms??0,'number','min="0" max="30000" step="1"')}</label>
        <label class='mm-wh-check'>Enable Multimedia UX
          ${field('global_enable',d.doc.enable_ux!==false,'checkbox')}</label>
      </div>
      <h4>Expert configuration · complete YAML / JSON</h4>
      <p>Use only when needed. Edits remain in this session until native Review/Save.
         The current full configuration is shown; no separate settings file is created.</p>
      <textarea data-wh-raw spellcheck='false' rows='15'
        aria-label='Advanced complete Multimedia configuration'>${e(d.rawDraft??JSON.stringify(d.doc,null,2))}</textarea>
      <button type='button' data-wh-action='review_yaml'>Validate YAML / JSON &amp; Review</button>
      <button type='button' data-wh-action='discard_raw'>Discard advanced edits</button>
      ${d.editableDraft?`<button type='button' data-wh-action='edit_import'>Edit imported configuration in GUI</button>`:''}
      <button type='button' data-wh-action='apply_json'>Apply JSON edits to GUI draft</button>
    </details>
    <footer class='mm-wh-footer'>
      <span>${rooms.length} rooms · ${rooms.reduce((n,[,r])=>n+Object.keys(r.devices||{}).length,0)} devices ·
        ${rooms.reduce((n,[,r])=>n+Object.keys(r.activities||{}).length,0)} activities</span>
      <button type='button' class='mm-wh-save' data-wh-action='review'>Review all changes</button>
      <button type='button' data-mm-option-cancel>Cancel all changes</button>
    </footer>
  </section>`;
}
function rhiMmWholeChange(d,key,value,checked=false){
  const {room,device,activity}=rhiMmWholeCurrent(d);
  const parts=key.split(':');
  const phase=parts[1],index=Number(parts[2]);
  const step=activity?.[phase]?.[index];
  const int=value===''?undefined:Number(value);
  const fail=message=>{d.error=message;return false;};
  if(key==='room_select'){
    if(!d.doc.rooms[value])return fail('Unknown room');
    d.room=value;d.device='';d.activity='';d.error='';return true;
  }
  if(key==='global_enable'){d.doc.enable_ux=checked;d.dirty=true;}
  else if(key==='global_delay'){
    if(!Number.isInteger(int)||int<0||int>30000)return fail('Delay must be 0–30000 ms');
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
      const linked=Object.entries(d.doc.rooms[d.room]?.devices||{}).find(([,x])=>
        (x.asset_id||x.physical_id)===asset?.asset_id||
        asset?.candidates?.some(c=>c.entity_id===x.entity&&c.concept===x.foundation_concept));
      d.device=linked?.[0]||'';
    }
  }
  else if(parts[0]==='catalog_selected'){
    if(!d.logicalDevices.some(x=>x.asset_id===key.slice('catalog_selected:'.length)))
      return fail('Unknown discovered device');
    const assetId=key.slice('catalog_selected:'.length);
    if(checked){if(!d.selectedAssets.includes(assetId))d.selectedAssets.push(assetId);}
    else d.selectedAssets=d.selectedAssets.filter(x=>x!==assetId);
  }
  else if(key==='new_activity')d.newActivity=value;
  else if(key==='new_type'){d.newType=value;d.newActivityInput='';d.newActivitySource='';}
  else if(key==='new_activity_target'){d.newActivityTarget=value;d.newActivityInput='';}
  else if(key==='new_activity_input')d.newActivityInput=value;
  else if(key==='new_activity_source')d.newActivitySource=value;
  else if(key==='default_step_delay_ms'){
    if(!Number.isInteger(int)||int<0||int>30000)return fail('Default delay must be 0–30000 ms');
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
  else if(key==='device_name'&&device){device.name=value;d.dirty=true;}
  else if(key==='device_control_approved'&&device){device.control_approved=checked;d.dirty=true;}
  else if(key==='device_room_area'&&device){
    if(value&&!room?.room_areas?.[value])return fail('Choose a defined Room Area');
    if(value)device.room_area=value;else delete device.room_area;
    d.dirty=true;
  }
  else if(key==='device_resolve'&&device){
    const source=d.sources[Number(value)];
    if(value===''||!String(device.entity).startsWith('REPLACE_WITH_')||!source||
       source.concept!==device.foundation_concept||source.review_reason||
       !source.candidate||!source.entity_registry_id||!source.config_entry_id||
       !(device.role==='remote'?source.entity.startsWith('remote.'):source.entity.startsWith('media_player.')))
      return fail('Choose an exact compatible native device');
    if(Object.values(room.devices).some(x=>x!==device&&x.entity===source.entity))
      return fail('This device is already assigned to the room');
    const linked=Object.values(d.doc.rooms).flatMap(r=>Object.values(r.devices||{}))
      .filter(x=>x!==device&&x.entity===source.entity);
    if(linked.length&&linked.some(x=>x.physical_id!==device.physical_id))
      return fail('This device belongs to an existing physical identity; review its shared assignment');
    const oldEntity=device.entity;
    rhiMmWholeForPhysical(d,device,x=>{
      if(x.entity!==oldEntity)return;
      Object.assign(x,{entity:source.entity,foundation_candidate_id:source.candidate,
        foundation_entity_registry_id:source.entity_registry_id,
        foundation_config_entry_id:source.config_entry_id,
        foundation_device_registry_id:source.native_device_id,
        foundation_provider:source.provider});
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
    device.control_approved=false;d.dirty=true;
  }
  else if(key==='device_role'&&device){device.role=value;d.dirty=true;}
  else if(key==='device_power'&&device){
    if(!['native','passive'].includes(value))return fail('Unknown power behaviour');
    rhiMmWholeForPhysical(d,device,x=>{x.power_mode=value;});d.dirty=true;
  }
  else if(key==='device_cec'&&device){
    rhiMmWholeForPhysical(d,device,x=>{x.hdmi_cec_enabled=checked;});d.dirty=true;
  }
  else if(key==='device_delay'&&device){
    if(!Number.isInteger(int)||int<0||int>30000)return fail('Delay must be 0–30000 ms');
    rhiMmWholeForPhysical(d,device,x=>{x.post_power_on_delay_ms=int;});d.dirty=true;
  }
  else if(key==='device_wol_mode'&&device){
    if(!['native','directed'].includes(value))return fail('Unknown Wake-on-LAN mode');
    if(value==='native'){
      rhiMmWholeForPhysical(d,device,x=>{x.wol_enabled=false;});
    }else{
      if(!device.entity.startsWith('media_player.')&&!device.entity.startsWith('remote.'))
        return fail('WOL requires an authorized native media device');
      if(d.sources.some(x=>x.entity===device.entity&&
          x.candidate===device.foundation_candidate_id&&x.provider==='harmony'))
        return fail('Harmony keeps exclusive control of this device');
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
      rhiMmWholeForPhysical(d,device,x=>{
        x.power_on=JSON.parse(JSON.stringify(action));x.wol_enabled=true;
      });
    }
    d.dirty=true;
  }
  else if(key==='device_wol_mac'&&device){
    const mac=String(value||'').trim().replaceAll('-',':').toLowerCase();
    if(!rhiMmWholeVerifiedMacs(d,device).includes(mac))
      return fail('MAC must match the current native HA Device Registry for this exact source');
    rhiMmWholeForPhysical(d,device,x=>{
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
    rhiMmWholeForPhysical(d,device,x=>{
      if(ip)x.power_on.data.broadcast_address=ip;
      else delete x.power_on.data.broadcast_address;
    });d.dirty=true;
  }
  else if(key==='device_wol_port'&&device){
    if(!Number.isInteger(int)||int<1||int>65535)return fail('UDP port must be 1–65535');
    if(device.power_on?.action!=='wake_on_lan.send_magic_packet')return fail('Enable WOL first');
    rhiMmWholeForPhysical(d,device,x=>{x.power_on.data.broadcast_port=int;});d.dirty=true;
  }
  else if(key==='activity_name'&&activity){activity.name=value;d.dirty=true;}
  else if(key==='activity_room_area'&&activity){
    if(value&&!room?.room_areas?.[value])return fail('Choose a defined Room Area');
    if(value)activity.room_area=value;else delete activity.room_area;
    d.dirty=true;
  }
  else if(key==='activity_type'&&activity){activity.activity_type=value;d.dirty=true;}
  else if(parts[0]==='activity_cast'&&activity&&room?.devices?.[parts[1]]){
    const cast=new Set(activity.devices||[]);
    if(checked)cast.add(parts[1]);else cast.delete(parts[1]);
    if(!cast.size)return fail('At least one device must remain selected');
    activity.devices=[...cast];d.dirty=true;
  }
  else if(step&&parts[0]==='step_device'&&activity?.devices?.includes(value)){step.device=value;d.dirty=true;}
  else if(step&&parts[0]==='step_type'&&RHI_MM_WHOLE_STEPS.includes(value)){
    const device=step.device;const delay_ms=step.delay_ms;
    const defaults={source:{candidates:[]},sound_mode:{candidates:[]},volume:{level:.5},
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
    else if(step.type==='delay'){if(!Number.isInteger(int)||int<0||int>30000)return fail('Delay must be 0–30000 ms');step.milliseconds=int;}
    d.dirty=true;
  }
  else if(step&&parts[0]==='step_state'&&step.type==='wait_until'){step.states=[value];d.dirty=true;}
  else if(step&&parts[0]==='step_timeout'&&step.type==='wait_until'){
    if(!Number.isFinite(int)||int<1||int>300)return fail('Timeout must be 1–300 s');
    step.timeout=int;d.dirty=true;
  }
  else if(step&&parts[0]==='step_override'&&!['delay','wait_until'].includes(step.type)){
    if(value==='')delete step.delay_ms;
    else {if(!Number.isInteger(int)||int<0||int>30000)return fail('Delay must be 0–30000 ms');step.delay_ms=int;}
    d.dirty=true;
  }else return fail('Unsupported editor input');
  d.error='';return true;
}
function rhiMmWholeAction(d,action,id,phase,index){
  const {room,activity}=rhiMmWholeCurrent(d);
  const fail=message=>{d.error=message;return false;};
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
          proposed.default_step_delay_ms<0||proposed.default_step_delay_ms>30000)
        return fail('Invalid advanced configuration');
      d.doc=proposed;d.rawDraft=null;d.room=Object.keys(proposed.rooms)[0]||'';
      d.device='';d.activity='';d.dirty=true;d.error='';return true;
    }catch(_){return fail('Advanced configuration must be valid JSON');}
  }
  if(action==='apply_proposals'){
    const proposed=d.proposedRooms||{};
    if(!Object.keys(proposed).length)return fail('No safe native room suggestions available');
    let changed=0;
    // Suggestions only: never overwrite an already edited user role, room,
    // activity, physical identity or command policy.
    for(const [roomId,suggestion] of Object.entries(proposed)){
      const original=d.doc.rooms[roomId];
      if(!original){
        d.doc.rooms[roomId]=JSON.parse(JSON.stringify(suggestion));
        changed++;continue;
      }
      if(original.area_id!==suggestion.area_id)continue;
      for(const [key,device] of Object.entries(suggestion.devices||{})){
        if(original.devices[key]||Object.values(original.devices).some(x=>x.entity===device.entity))continue;
        original.devices[key]=JSON.parse(JSON.stringify(device));changed++;
      }
      for(const [key,activity] of Object.entries(suggestion.activities||{})){
        if(original.activities[key]||!activity.devices.every(k=>original.devices[k]))continue;
        original.activities[key]=JSON.parse(JSON.stringify(activity));changed++;
      }
    }
    if(!changed)return fail('Existing setup preserved; review the listed source exceptions');
    d.room=Object.keys(d.doc.rooms)[0]||'';d.bulkRoom=d.room;d.device='';d.activity='';
    d.tab='rooms';d.dirty=true;d.error='';return true;
  }
  if(action==='focus_binding'){
    if(!d.bulkRoom||!d.doc.rooms[d.bulkRoom])return fail('Choose the exact room before reviewing source access');
    const asset=(d.logicalDevices||[]).find(x=>x.asset_id===d.detailAsset);
    if(!asset)return fail('Choose the exact discovered device first');
    const matches=Object.entries(d.doc.rooms[d.bulkRoom].devices||{}).filter(([,x])=>
      (x.asset_id||x.physical_id)===asset.asset_id||
      asset.candidates?.some(c=>c.entity_id===x.entity&&c.concept===x.foundation_concept));
    if(matches.length!==1)return fail('Ambiguous or missing room binding. Review the native source and room assignments.');
    d.room=d.bulkRoom;d.device=matches[0][0];d.tab='devices';
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
    d.tab='devices';d.dirty=true;d.error='';return true;
  }
  if(action==='focus_issue'){
    const match=/^rooms\.([a-z][a-z0-9_]*)(?:\.(devices|activities)\.([a-z][a-z0-9_]*))?/.exec(id);
    if(!match||!d.doc.rooms[match[1]])return false;
    d.room=match[1];d.bulkRoom=d.room;d.tab=match[2]||'rooms';d.settingsTab=d.tab;d.workspace='settings';
    if(match[2]==='devices')d.device=match[3];
    if(match[2]==='activities')d.activity=match[3];
    return true;
  }
  if(action==='tab'){if(!['discovery','rooms','devices','activities'].includes(id))return false;d.tab=id;d.error='';return true;}
  if(action==='select_room'){if(!d.doc.rooms[id])return false;d.room=id;d.bulkRoom=id;d.device='';d.activity='';d.error='';return true;}
  if(action==='clear_selected'){d.selectedAssets=[];d.error='';return true;}
  if(action==='catalog_detail'){
    const asset=d.logicalDevices.find(x=>x.asset_id===id);
    if(!asset)return fail('Unknown discovered device');
    d.detailAsset=id;
    if(d.bulkRoom&&d.doc.rooms[d.bulkRoom])d.room=d.bulkRoom;
    const linked=Object.entries(d.doc.rooms[d.room]?.devices||{}).find(([,x])=>
      (x.asset_id||x.physical_id)===id||
      asset.candidates?.some(c=>c.entity_id===x.entity&&c.concept===x.foundation_concept));
    d.device=linked?.[0]||'';d.error='';return true;
  }
  if(action==='remove_catalog'){
    if(!d.bulkRoom||!d.doc.rooms[d.bulkRoom])return fail('Choose a room first');
    const asset=d.logicalDevices.find(x=>x.asset_id===id);
    if(!asset)return fail('Unknown discovered device');
    const targetRoom=d.doc.rooms[d.bulkRoom];
    const linked=Object.entries(targetRoom.devices||{}).find(([,x])=>
      (x.asset_id||x.physical_id)===id||
      asset.candidates?.some(c=>c.entity_id===x.entity&&c.concept===x.foundation_concept));
    if(!linked)return fail('This device is not assigned to this room');
    const [key]=linked;
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
    const before=JSON.parse(JSON.stringify(d.doc.rooms)),selected=d.selectedAssets.slice();
    const previousDirty=d.dirty,previousDevice=d.device;
    let removed=0;
    for(const assetId of selected){
      const asset=d.logicalDevices.find(x=>x.asset_id===assetId);
      if(!asset){d.doc.rooms=before;d.dirty=previousDirty;d.device=previousDevice;
        return fail('Unknown selected device');}
      const exists=Object.values(d.doc.rooms[d.bulkRoom].devices||{}).some(x=>
        (x.asset_id||x.physical_id)===assetId||
        asset.candidates?.some(c=>c.entity_id===x.entity&&c.concept===x.foundation_concept));
      if(!exists)continue;
      if(!rhiMmWholeAction(d,'remove_catalog',assetId)){
        const message=d.error;
        d.doc.rooms=before;d.dirty=previousDirty;d.device=previousDevice;
        return fail('No devices unassigned: '+message);
      }
      removed++;
    }
    d.selectedAssets=[];d.error=removed?'':'Selected devices were not assigned to this room';
    return true;
  }
  if(action==='bulk_assign'){
    if(!d.bulkRoom||!d.doc.rooms[d.bulkRoom])return fail('Choose a room for assignment');
    const before=JSON.parse(JSON.stringify(d.doc.rooms)),selected=d.selectedAssets.slice();
    const oldRoom=d.room,oldDevice=d.device,oldTab=d.tab,oldDirty=d.dirty,oldDetail=d.detailAsset;
    let done=0;
    for(const assetId of selected){
      const asset=d.logicalDevices.find(x=>x.asset_id===assetId);
      if(!asset){d.doc.rooms=before;return fail('Unknown selected logical device');}
      const exists=Object.values(d.doc.rooms[d.bulkRoom].devices||{}).some(x=>
        (x.asset_id||x.physical_id)===assetId||
        asset.candidates?.some(c=>c.entity_id===x.entity&&c.concept===x.foundation_concept));
      if(exists)continue;
      if(!rhiMmWholeAction(d,'assign_catalog',assetId)){
        const message=d.error;
        d.doc.rooms=before;d.room=oldRoom;d.device=oldDevice;d.tab=oldTab;
        d.dirty=oldDirty;d.detailAsset=oldDetail;
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
    const existing=Object.entries(target.devices||{}).find(([,x])=>
      (x.asset_id||x.physical_id)===id||
      asset.candidates?.some(c=>c.entity_id===x.entity&&c.concept===x.foundation_concept));
    if(existing){d.device=existing[0];d.detailAsset=id;d.tab='discovery';d.error='';return true;}
    const candidate=(asset.candidates||[]).find(x=>x.entity_id.startsWith('media_player.'))||
      asset.candidates?.[0];
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
    if(source.review_reason==='ambiguous_candidate_identity')
      return fail('Conflicting Foundation candidates for this native entity. Review the source in Foundation before linking.');
    if(Object.values(room.devices||{}).some(x=>x.entity===source.entity))
      return fail('This native device is already assigned to the room');
    // Preserve the canonical identity of a shared AVR/TV already configured
    // in another room; never make a second physical resource or reservation.
    const existing=Object.values(d.doc.rooms).flatMap(r=>Object.values(r.devices||{}))
      .find(x=>x.entity===source.entity);
    const base=source.concept==='display'?'screen':source.concept==='amplifier'?'amplifier':'source';
    let key=base,n=2;while(Object.prototype.hasOwnProperty.call(room.devices,key))key=base+'_'+n++;
    room.devices[key]={name:source.label,entity:source.entity,
      foundation_concept:source.concept,foundation_candidate_id:source.candidate,
      foundation_entity_registry_id:source.entity_registry_id,
      foundation_config_entry_id:source.config_entry_id,
      foundation_device_registry_id:source.native_device_id,
      foundation_provider:source.provider,
      control_approved:source.available===true&&!source.review_reason,
      physical_id:existing?(existing.physical_id||existing.entity):(source.logical_asset_id||source.entity),
      asset_id:existing?(existing.asset_id||existing.physical_id||existing.entity):
        (source.logical_asset_id||source.entity),
      role:source.concept==='display'?'display':source.concept==='amplifier'?'receiver':
        source.entity.startsWith('remote.')?'remote':'player',
      power_mode:source.entity.startsWith('remote.')?'passive':'native'};
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
