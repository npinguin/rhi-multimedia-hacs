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
  const sources=JSON.parse(context.sources_json||'[]');
  const room=Object.keys(doc.rooms)[0]||'';
  return {doc,areas,sources,room,device:'',activity:'',tab:'rooms',dirty:false,
    error:'',newRoom:'',newRoomArea:'',newArea:Object.keys(areas)[0]||'',newSource:'',
    newActivity:'',newType:'watch_tv'};
}
function rhiMmWholeSlug(name){
  return String(name||'').normalize('NFKD').toLowerCase()
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_')
    .replace(/^_+|_+$/g,'');
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
    ['rooms',t('settings_floor_rooms'),'mdi:floor-plan'],
    ['devices',t('devices'),'mdi:television'],
    ['activities',t('activities'),'mdi:play-box-multiple-outline']
  ];
  const rooms=Object.entries(d.doc.rooms);
  const {room,device,activity}=rhiMmWholeCurrent(d);
  const roomButtons=rooms.map(([id,r])=>entry(id,r.name||id,id===d.room,'select_room')).join('');
  const sourceRows=d.sources.map((s,i)=>[String(i),`${s.label} · ${s.entity} · ${s.provider}${s.available?'':' · unavailable'}`]);
  const deviceRows=Object.entries(room?.devices||{});
  const activityRows=Object.entries(room?.activities||{});
  const roomAreas=Object.entries(room?.room_areas||{});
  const roomAreaChoices=[['','Whole room'],...roomAreas.map(([id,area])=>[id,area.name])];
  const currentDevice=d.device&&room?.devices?.[d.device]?d.device:deviceRows[0]?.[0]||'';
  const currentActivity=d.activity&&room?.activities?.[d.activity]?d.activity:activityRows[0]?.[0]||'';
  const selectedDevice=room?.devices?.[currentDevice];
  const selectedActivity=room?.activities?.[currentActivity];
  const sameNativeCandidates=d.sources.filter(s=>s.entity===selectedDevice?.entity&&
    s.concept===selectedDevice?.foundation_concept);
  const currentCandidate=selectedDevice?.foundation_candidate_id||'';
  const bindingCurrent=sameNativeCandidates.some(s=>s.candidate===currentCandidate);
  const nativeBindingChoices=[
    ...(!bindingCurrent&&selectedDevice?[ [currentCandidate,currentCandidate+' · no longer selected in Foundation'] ]:[]),
    ...sameNativeCandidates.map(s=>[s.candidate,s.label+' · '+s.provider])
  ];
  let content='';
  if(d.tab==='rooms'){
    content=`<div class='mm-wh-grid'><section class='mm-wh-panel'>
      <h4>Rooms <small>HA Floor / Area</small></h4>
      <div class='mm-wh-list'>${roomButtons||'<p>No rooms configured</p>'}</div>
      <h4>Add room</h4>
      <label>Name${field('new_room',d.newRoom)}</label>
      <label>Native HA Area${select('new_area',d.newArea,
        [['','Unassigned'],...Object.entries(d.areas)])}</label>
      <button type='button' data-wh-action='add_room'>Add room</button>
    </section><section class='mm-wh-panel'>
      <h4>${e(room?.name||'Choose a room')}</h4>
      ${room?`<label>Room name${field('room_name',room.name)}</label>
        <label>Native Home Assistant Area${select('room_area',room.area_id||'',
          [['','No native area'],...Object.entries(d.areas)])}</label>
        <small>Floors are owned by HA. Assign this room to an existing HA Area; the floor follows that Area.</small>
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
      <h4>Add approved device</h4>
      <label>Foundation selection${select('new_source',d.newSource,
        [['','Choose a real selected device'],...sourceRows])}</label>
      <button type='button' data-wh-action='add_device' ${d.newSource===''?'disabled':''}>Add device</button>
      <small>Only Foundation-approved native entity + candidate identity is selectable. Selection never sends a command.</small>
    </section><section class='mm-wh-panel'>
      <h4>${e(selectedDevice?.name||'Select a device')}</h4>
      ${selectedDevice?`<small>${e(selectedDevice.entity||'')} · ${e(selectedDevice.foundation_concept||'')} · ${e(currentDevice)}</small>
        <label>Display name${field('device_name',selectedDevice.name||'')}</label>
        <label>Foundation candidate for this exact native entity
          ${select('device_candidate',currentCandidate,nativeBindingChoices,
            sameNativeCandidates.length?'':'disabled')}</label>
        ${!bindingCurrent?`<p class='mm-room-error'>Current Foundation selection is invalid.
          Choose the newly approved candidate for the same native entity.
          A different device must be added separately, never silently substituted.</p>`:''}
        <label>Role${select('device_role',selectedDevice.role||'player',
          [['display','TV / Display'],['receiver','Receiver / Audio zone'],['player','Media player']])}</label>
        ${roomAreas.length?`<label>Room Area (optional)${select('device_room_area',selectedDevice.room_area||'',roomAreaChoices)}</label>`:''}
        <label>Power behaviour${select('device_power',selectedDevice.power_mode||'native',
          [['native','Native HA Power On/Off'],['passive','Passive (observe only)']])}</label>
        <label class='mm-wh-check'>HDMI-CEC verified/enabled ${field('device_cec',selectedDevice.hdmi_cec_enabled===true,'checkbox')}</label>
        <label>After power-on (ms)${field('device_delay',selectedDevice.post_power_on_delay_ms??0,'number','min="0" max="30000" step="1"')}</label>
        <small>Existing WoL, device identity, CEC relationships and advanced native settings remain unchanged. Power commands are verified by the backend.</small>
        <button type='button' class='danger' data-wh-action='delete_device'>Remove device</button>`:''}
    </section></div>`;
  }else{
    const cast=selectedActivity?.devices||[];
    const typeOptions=RHI_MM_WHOLE_TYPES.map(x=>[x,x.replaceAll('_',' ')]);
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
      <button type='button' data-wh-action='add_activity'>Add activity</button>
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
      <p>Floors / Rooms → Devices → Activities · one Review and Save</p></div>
      <span class='mm-wh-draft'>${d.dirty?'Unsaved changes':'Current saved configuration'}</span></header>
    <nav class='mm-wh-tabs' aria-label='Multimedia configuration'>
      ${sections.map(([id,label,icon])=>`<button type='button' data-wh-action='tab'
        data-wh-id='${id}' aria-pressed='${d.tab===id}'>
        <ha-icon icon='${icon}'></ha-icon>${e(label)}</button>`).join('')}
    </nav>
    ${d.tab!=='rooms'&&rooms.length?`<div class='mm-wh-roomselect'><label>Room
      ${select('room_select',d.room,rooms.map(([id,r])=>[id,r.name||id]))}</label></div>`:''}
    ${d.error?`<p class='mm-room-error' role='alert'>${e(d.error)}</p>`:''}
    <div class='mm-wh-global'>
      <label>Default inter-step delay (ms)
        ${field('global_delay',d.doc.default_step_delay_ms??0,'number','min="0" max="30000" step="1"')}</label>
      <label class='mm-wh-check'>Enable Multimedia UX
        ${field('global_enable',d.doc.enable_ux!==false,'checkbox')}</label>
    </div>
    ${content}
    <div class='mm-wh-global'><label>Default delay between activity steps (ms)
      ${field('default_step_delay_ms',d.doc.default_step_delay_ms??0,'number',
        'min="0" max="30000" step="1"')}</label></div>
    <details class='mm-wh-expert'><summary>Advanced complete configuration · all CEC, WoL, macros and vendor fields</summary>
      <p>Use only when needed. Edits remain in this session until native Review/Save.
         The current full configuration is shown; no separate settings file is created.</p>
      <textarea data-wh-raw spellcheck='false' rows='15'
        aria-label='Advanced complete Multimedia configuration'>${e(JSON.stringify(d.doc,null,2))}</textarea>
      <button type='button' data-wh-action='apply_json'>Apply advanced edits to draft</button>
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
  else if(key==='new_activity')d.newActivity=value;
  else if(key==='new_type')d.newType=value;
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
  else if(key==='device_room_area'&&device){
    if(value&&!room?.room_areas?.[value])return fail('Choose a defined Room Area');
    if(value)device.room_area=value;else delete device.room_area;
    d.dirty=true;
  }
  else if(key==='device_candidate'&&device){
    const approved=d.sources.find(s=>s.entity===device.entity&&s.concept===device.foundation_concept
      &&s.candidate===value);
    if(!approved)return fail('This exact native device is not selected in Foundation');
    device.foundation_candidate_id=approved.candidate;d.dirty=true;
  }
  else if(key==='device_role'&&device){device.role=value;d.dirty=true;}
  else if(key==='device_power'&&device){device.power_mode=value;d.dirty=true;}
  else if(key==='device_cec'&&device){device.hdmi_cec_enabled=checked;d.dirty=true;}
  else if(key==='device_delay'&&device){if(!Number.isInteger(int)||int<0||int>30000)return fail('Delay must be 0–30000 ms');device.post_power_on_delay_ms=int;d.dirty=true;}
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
      d.doc=proposed;d.room=Object.keys(proposed.rooms)[0]||'';
      d.device='';d.activity='';d.dirty=true;d.error='';return true;
    }catch(_){return fail('Advanced configuration must be valid JSON');}
  }
  if(action==='tab'){if(!['rooms','devices','activities'].includes(id))return false;d.tab=id;d.error='';return true;}
  if(action==='select_room'){if(!d.doc.rooms[id])return false;d.room=id;d.device='';d.activity='';d.error='';return true;}
  if(action==='select_device'){if(!room?.devices?.[id])return false;d.device=id;d.error='';return true;}
  if(action==='select_activity'){if(!room?.activities?.[id])return false;d.activity=id;d.error='';return true;}
  if(action==='add_room'){
    const key=rhiMmWholeSlug(d.newRoom);
    if(!/^[a-z][a-z0-9_]*$/.test(key)||key.length>80)return fail('Enter a valid room name');
    if(d.doc.rooms[key])return fail('Room already exists');
    if(d.newArea&&!d.areas[d.newArea])return fail('Choose a registered HA Area');
    d.doc.rooms[key]={name:d.newRoom.trim(),area_id:d.newArea||null,devices:{},activities:{}};
    d.room=key;d.device='';d.activity='';d.newRoom='';d.tab='devices';
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
    if(!source||!source.entity||!source.candidate)return fail('Choose a Foundation-approved device');
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
      physical_id:existing?.physical_id||source.entity,
      asset_id:existing?.asset_id||existing?.physical_id||source.entity,
      role:source.concept==='display'?'display':source.concept==='amplifier'?'receiver':'player'};
    d.device=key;d.newSource='';
  }else if(action==='delete_device'){
    if(!room?.devices?.[d.device])return false;
    if(Object.values(room.activities||{}).some(x=>x.devices?.includes(d.device)))
      return fail('Device is used by an activity. Remove it from that activity first.');
    delete room.devices[d.device];d.device='';
  }else if(action==='add_activity'){
    if(!room)return fail('Select a room first');
    const key=rhiMmWholeSlug(d.newActivity);
    if(!/^[a-z][a-z0-9_]*$/.test(key)||key.length>80)return fail('Enter an activity name');
    if(room.activities[key])return fail('Activity already exists');
    if(!Object.keys(room.devices).length)return fail('Add approved devices first');
    room.activities[key]={name:d.newActivity.trim(),activity_type:d.newType,
      devices:[],steps:[],stop_steps:[]};
    d.activity=key;d.newActivity='';
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
