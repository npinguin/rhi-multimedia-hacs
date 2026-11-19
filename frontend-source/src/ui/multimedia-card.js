// RHI Multimedia Premium: one-card native Home Assistant dashboard.
// Core owns look/feel; backend owns meaning and all physical writers.
const RHI_MM_UX_VERSION = '__RHI_MM_UX_VERSION__';
const RHI_MM_HERO = `/rhi_multimedia/frontend/assets/heroes/multimedia-overview.svg?v=${encodeURIComponent(RHI_MM_UX_VERSION)}`;
const MM_MODULES = [
  {id:'multimedia',label:'Multimedia',items:[{id:'overview',label:'Overview'},{id:'rooms',label:'Rooms'}]},
  {id:'activities',label:'Activities',items:[{id:'activities',label:'Activities'}]},
  {id:'insights',label:'Insights',items:[{id:'devices',label:'Devices'},{id:'diagnostics',label:'Diagnostics'}]},
];

// Presentation-only grouping: preserve exact native values and unknown vendor keys.
function rhiMmRemoteGroups(options){
  const keys=[...new Set(Array.isArray(options)?options.filter(k=>typeof k==='string'&&k.length):[])];
  const used=new Set();
  const take=(name,wanted)=>{const selected=wanted.flatMap(k=>keys.filter(x=>x===k&&!used.has(x)));
    for(const k of selected)used.add(k);return {name,keys:selected};};
  const groups=[
    take('navigation',['HOME','home','MENU','menu','top_menu','BACK','back','INFO','info','EXIT','exit','UP','up','LEFT','left','ENTER','select','RIGHT','right','DOWN','down']),
    take('media',['CHANNELUP','CHANNELDOWN','GUIDE','VOLUMEUP','VOLUMEDOWN','PLAY','play','PAUSE','pause','MUTE','mute']),
    take('numbers',Array.from({length:10},(_,i)=>String(i))),
    take('apps',['NETFLIX','AMAZON','RED','GREEN','BLUE','YELLOW']),
  ];
  const other=keys.filter(k=>!used.has(k));if(other.length)groups.push({name:'more',keys:other});
  return groups.filter(group=>group.keys.length);
}
class HomeBrainMultimediaCard extends HTMLElement {
  static getStubConfig() { return {type:'custom:homebrain-multimedia-card'}; }
  constructor() {
    super(); this.attachShadow({mode:'open'});
    this.config={}; this._hass=null; this._view=''; this._room='';
    this._lastSignature=''; this._feedback=new Map();
    this._expanded=new Set();this._contextSelections=new Map();this._contextKey='';this._contextCards=[];this._planSummary=null;this._planRequest=0;
    this._onLocation=()=>{this._lastSignature='';this.render();};
    this.shadowRoot.addEventListener('click',event=>this.onClick(event));
    this.shadowRoot.addEventListener('change',event=>this.onControlChange(event));
    this.shadowRoot.addEventListener('toggle',event=>this.onToggle(event),true);
  }
  setConfig(config={}) { this.config={...(config||{})}; this._lastSignature=''; this.render(); }
  connectedCallback() {window.addEventListener('popstate',this._onLocation);window.addEventListener('location-changed',this._onLocation);this.render();}
  disconnectedCallback() {window.removeEventListener('popstate',this._onLocation);window.removeEventListener('location-changed',this._onLocation);}
  set hass(hass) {this._hass=hass;this.render();}
  t(key){return rhiMmText(this._hass,key);}
  getCardSize() {return 12;}
  getGridOptions() {return {columns:12,rows:12,min_rows:5};}
  currentRoute() {
    try {
      const url=new URL(window.location.href);
      return {view:RHI_MM_VIEWS.includes(url.searchParams.get('multimedia_view'))?url.searchParams.get('multimedia_view'):(this.config.default_view||'overview'),
        room:url.searchParams.get('multimedia_room')||''};
    } catch (_) {return {view:this.config.default_view||'overview',room:''};}
  }
  navigate(view,room='') {
    if (!RHI_MM_VIEWS.includes(view)) return;
    const url=new URL(window.location.href);
    url.searchParams.set('multimedia_view',view);
    if(room)url.searchParams.set('multimedia_room',room);else url.searchParams.delete('multimedia_room');
    window.history.pushState(null,'',url.pathname+url.search+url.hash);
    this._lastSignature='';this.render();
  }
  onToggle(event){const el=event.target?.closest?.('details[data-persist]');if(!el)return;const key=el.getAttribute('data-persist');if(el.open)this._expanded.add(key);else this._expanded.delete(key);}
  async onClick(event) {
    const context=event.target?.closest?.('[data-context-tab]');
    if(context){const value=context.getAttribute('data-context-tab');this._contextSelections.set(this._contextScope,value);this._contextKey='';this._lastSignature='';this.render();return;}
    const refresh=event.target?.closest?.('[data-context-refresh]');
    if(refresh){this._planSummary=null;this._planRequest++;this._planPending=false;this._planToken=null;this.render();return;}
    const nav=event.target?.closest?.('[data-nav]');
    if(nav){event.preventDefault();this.navigate(nav.getAttribute('data-nav'),nav.getAttribute('data-room')||'');return;}
    const more=event.target?.closest?.('[data-more-info]');
    if(more){event.preventDefault();const entityId=more.getAttribute('data-more-info');if(entityId)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId},bubbles:true,composed:true}));return;}
    const direct=event.target?.closest?.('[data-device-action]');
    if(direct){if(!direct.disabled){const raw=direct.getAttribute('data-value');await this.executeDevice(direct.getAttribute('data-room'),direct.getAttribute('data-device'),direct.getAttribute('data-device-action'),raw===null?undefined:JSON.parse(raw));}return;}
    const action=event.target?.closest?.('[data-action]');
    if(!action||action.disabled)return;
    const roomId=action.getAttribute('data-room');
    const service=action.getAttribute('data-action');
    const activity=action.getAttribute('data-activity')||'';
    await this.execute(roomId,service,activity);
  }
  async onControlChange(event){
    const input=event.target?.closest?.('[data-device-input]');
    if(!input||input.disabled||input.value==='')return;
    const action=input.getAttribute('data-device-input');
    await this.executeDevice(input.getAttribute('data-room'),input.getAttribute('data-device'),action,action==='volume'?Number(input.value):input.value);
  }
  async executeDevice(roomId,key,action,value){
    const contract=rhiMmRooms(this._hass);
    const room=contract.ready?contract.rooms.find(row=>row.id===roomId):null;
    return this.executeIntent(roomId,rhiMmDeviceIntent(room,key,action,value),contract);
  }
  async execute(roomId,service,activity) {
    const contract=rhiMmRooms(this._hass);
    const room=contract.ready?contract.rooms.find(row=>row.id===roomId):null;
    return this.executeIntent(roomId,rhiMmIntent(room,service,activity),contract);
  }
  async executeIntent(roomId,intent,contract){
    if(!intent){
      this._feedback.set(roomId,{state:'error',message:this.t('action_unavailable')});
      this._lastSignature='';this.render();return;
    }
    const pending={state:'pending',message:this.t('waiting')};
    this._feedback.set(roomId,pending);
    this._lastSignature='';this.render();
    let feedback;
    try{
      const result=await rhiMmExecute(this._hass,intent);
      feedback=result.result==='confirmed'?{state:'ok',message:this.t(intent.data?.action==='harmony_activity'?'harmony_confirmed':'confirmed')}:
        result.result==='submitted'?{state:'attention',message:this.t('submitted')}:
        result.result==='failed'?{state:'error',message:result.error||this.t('failed')}:
        result.result==='cancelled'?{state:'attention',message:this.t('cancelled')}:
        {state:'attention',message:this.t('result_unknown')};
    }catch(e){feedback={state:'error',message:String(e?.message||e)};}
    // Each room owns its latest request. An older completion must not replace
    // the result of a newer action, nor the result in another room.
    if(this._feedback.get(roomId)!==pending)return;
    this._feedback.set(roomId,feedback);this._lastSignature='';this.render();
  }
  render() {
    if(!this.shadowRoot||!this._hass)return;
    const route=this.currentRoute();this._view=route.view;this._room=route.room;
    const contract=rhiMmRooms(this._hass);
    const model=rhiMmPresentation(contract);
    const fingerprint=JSON.stringify([model.ready,model.rooms,model.unavailable,model.backendVersion,route.view,route.room,[...this._feedback],this._hass.user?.id,this._hass.user?.is_admin,this._hass.locale?.language||this._hass.language]);
    // Keep independently mounted Core cards connected when media state changes.
    // Only replace the domain page, not the shared contextual editor.
    if(this._lastSignature!==fingerprint){
      this._lastSignature=fingerprint;
      const shell=rhiUxDomainShell({product:'Home Intelligence',domain:'MULTIMEDIA',modules:MM_MODULES.map(m=>({...m,label:this.t(m.id),items:m.items.map(i=>({...i,label:this.t(i.id),target:i.id}))})),activeModule:MM_MODULES.find(m=>m.items.some(i=>i.id===route.view))?.id||'multimedia',activeItem:route.view});
      const page=this.renderPage(model,route.view,route.room);
      const footer=rhiUxTechnicalFooter({product:'RHI Multimedia',uxVersion:RHI_MM_UX_VERSION,backendVersion:model.ready?model.backendVersion:this.t('not_published'),issue:!model.ready?this.t('backend_unavailable'):((model.summary.attention_rooms||model.unavailable)?this.t('attention'):this.t('ready')),severity:!model.ready?'warning':(model.summary.attention_rooms||model.unavailable)?'warning':''});
      if(!this.shadowRoot.querySelector?.('[data-mm-page]')){
        this.shadowRoot.innerHTML=`<style>${RHI_MM_CORE_CSS}\n${RHI_MM_DOMAIN_CSS}</style><ha-card><div class="mm-shell"><div data-mm-shell>${shell}</div><div data-mm-page>${page}</div><div data-mm-context></div><div data-mm-footer>${footer}</div></div></ha-card>`;
        this._contextKey='';
      }else{
        this.shadowRoot.querySelector('[data-mm-shell]').innerHTML=shell;
        this.shadowRoot.querySelector('[data-mm-page]').innerHTML=page;
        this.shadowRoot.querySelector('[data-mm-footer]').innerHTML=footer;
      }
    }
    // Use the exact same Core scope on Overview and Activities. A room
    // drill-down narrows it; Devices/Diagnostics carry no implicit context.
    const ids=model.ready&&['overview','activities'].includes(route.view)?model.rooms.map(r=>r.id):
      model.ready&&route.view==='rooms'&&model.rooms.length?[model.rooms.find(r=>r.id===route.room)?.id||model.rooms[0].id]:[];
    this.renderContext(ids);
  }
  renderContext(ids){
    const host=this.shadowRoot.querySelector?.('[data-mm-context]');
    if(!host)return;
    const specs=rhiMmContextSpecs(this._hass,ids);
    const scope=JSON.stringify([...ids].sort());
    const selected=this._contextSelections.get(scope)||'';
    const tab=specs.some(s=>s.id===selected)?selected:'';
    const identity=JSON.stringify([scope,this._hass.user?.id,this._hass.user?.is_admin,specs.some(s=>s.id==='planning')]);
    const key=JSON.stringify([identity,tab,specs.map(s=>[s.id,!!customElements.get(s.tag),s.config.read_only]),this._hass.locale?.language||this._hass.language]);
    if(this._contextKey!==key){
      const newScope=this._contextIdentity!==identity;
      this._contextIdentity=identity;
      this._contextScope=scope;this._contextKey=key;this._contextCards=[];
      if(newScope){this._planSummary=null;this._planRequest++;this._planPending=false;this._planToken=null;}
      if(!specs.length){host.replaceChildren();return;}
      const labels=Object.fromEntries(['events','notifications','planning'].map(key=>[key,this.t(key)]));
      host.innerHTML=`<section class="mm-surface mm-context"><h3>${this.t('context')}</h3><div class="mm-context-summary">${specs.map(spec=>`<div class="mm-context-item"><button type="button" data-context-tab="${spec.id}" aria-expanded="${tab===spec.id}">${labels[spec.id]}</button><div data-mm-summary="${spec.id}"></div>${spec.id==='planning'?`<button type="button" class="mm-link" data-context-refresh>${this.t('refresh')}</button>`:''}</div>`).join('')}</div>${tab?`<button type="button" data-context-tab="" class="mm-link">${this.t('collapse')}</button><div data-mm-expanded></div>`:''}</section>`;
      for(const spec of specs){
        if(spec.id!=='planning')this.mountCoreCard(host.querySelector('[data-mm-summary="'+spec.id+'"]'),spec,{compact:true,read_only:true});
      }
      if(tab)this.mountCoreCard(host.querySelector('[data-mm-expanded]'),specs.find(s=>s.id===tab),{});
    }
    for(const card of this._contextCards)card.hass=this._hass;
    const plan=specs.find(s=>s.id==='planning');
    if(plan)this.updatePlanningSummary(host,plan,scope);
  }
  mountCoreCard(host,spec,options){
    if(!host||!spec)return;
    if(!customElements.get(spec.tag)){host.textContent=this.t('shared_unavailable');return;}
    try{
      const card=document.createElement(spec.tag);card.setConfig({type:'custom:'+spec.tag,...spec.config,...options});
      card.hass=this._hass;host.replaceChildren(card);this._contextCards.push(card);
    }catch(e){host.textContent=this.t('shared_unavailable');}
  }
  updatePlanningSummary(host,spec,scope){
    const el=host.querySelector('[data-mm-summary="planning"]');if(!el)return;
    const render=()=>{const p=this._planSummary;el.textContent=!p?this.t('loading'):p.status==='due'?
      p.title+' · '+(p.overdue?this.t('overdue')+' · ':'')+(p.kind==='deadline'?this.t('deadline')+' · ':'')+rhiMmSiteDateTime(this._hass,p.at):
      p.status==='empty'?this.t('no_upcoming'):this.t('plan_unknown');};
    render();
    const token=this._planSummary?.watch?this._hass.states?.[this._planSummary.watch]?.last_updated:null;
    if(this._planPending||(this._planSummary&&this._planToken===token))return;
    this._planPending=true;const request=++this._planRequest;
    rhiMmPlanningSummary(this._hass,spec.config).catch(()=>({status:'unknown'})).then(result=>{
      if(request!==this._planRequest||scope!==this._contextScope)return;
      this._planPending=false;this._planSummary=result;
      this._planToken=result.watch?this._hass.states?.[result.watch]?.last_updated:null;
      this.renderContext(spec.config.asset_ids);
    });
  }
  hero(view){const title=this.t(view==='overview'?'overview_title':view);return `<header class="mm-title"><h2>${rhiUxEscape(title)}</h2>${this._hass.user?.is_admin?`<a href="/config/integrations/integration/rhi_multimedia" class="mm-link" title="${this.t('manage')}">${this.t('settings')} <ha-icon icon="mdi:cog-outline"></ha-icon></a>`:''}</header>`;}
  unavailable(model){return `<section class="mm-callout mm-attention"><ha-icon icon="mdi:connection"></ha-icon><div><b>${this.t('not_ready')}</b><p>${rhiUxEscape(model.reason)}</p><p>${this.t('setup_help')}</p></div></section>`;}
  feedback(roomId){const feedback=this._feedback.get(roomId);return feedback?rhiUxWriteFeedback(feedback):'';}
  renderPage(model,view,roomId) {
    const hero=this.hero(view);if(!model.ready)return rhiUxPageTemplate({hero,content:this.unavailable(model)});
    const status=view==='overview'?rhiUxStatusGrid([
      {icon:'mdi:home-outline',label:this.t('rooms'),value:model.summary.room_count,detail:this.t('configured_rooms')},
      {icon:'mdi:play-circle-outline',label:this.t('active'),value:model.summary.active_rooms,detail:this.t('activity_state')},
      {icon:'mdi:music-circle-outline',label:this.t('playback'),value:model.summary.playing_rooms,detail:this.t('playing_readback')},
      {icon:'mdi:alert-circle-outline',label:this.t('attention'),value:model.summary.attention_rooms,detail:this.t('review_rooms')},
    ]):'';
    const content={
      overview:()=>this.overview(model),rooms:()=>this.rooms(model,roomId),activities:()=>this.activities(model),
      devices:()=>this.devices(model),diagnostics:()=>this.diagnostics(model),
    }[view]||(()=>this.overview(model));
    return rhiUxPageTemplate({hero,status,content:(model.unavailable?`<p role="status" class="mm-room-error">${this.t('partial_rooms')}</p>`:'')+content(),className:'mm-page'});
  }
  overview(model){return `<section class="mm-section"><div class="mm-heading"><div><h2>${this.t('rooms_activities')}</h2><p>${this.t('active_first')}</p></div><button class="mm-link" data-nav="rooms">${this.t('all_rooms')} <ha-icon icon="mdi:chevron-right"></ha-icon></button></div>${model.rooms.length?`<div class="mm-room-grid">${model.rooms.map(room=>this.roomCard(room,true)).join('')}</div>`:rhiUxState({state:'empty',title:this.t('no_rooms'),detail:this.t('create_room')})}</section>`;}
  roomCard(room,quick=false){
    const delegated=room.control_owner==='harmony';
    const buttons=(delegated?[]:room.activities).map(a=>`<button type="button" class="mm-activity ${a.active?'active':''}" aria-pressed="${!!a.active}" data-action="start_activity" data-room="${rhiUxEscape(room.id)}" data-activity="${rhiUxEscape(a.id)}" ${!rhiMmCanRun(room,'start_activity',a.id)?'disabled':''} title="${rhiUxEscape(a.disabled_reason||'')}"><ha-icon icon="${rhiMmActivityIcon(a.id)}"></ha-icon>${rhiUxEscape(a.name)}</button>`).join('');
    const media=room.now_playing?`<div class="mm-nowplaying"><ha-icon icon="mdi:music-note"></ha-icon><span>${rhiUxEscape(rhiMmMediaSubtitle(room,this._hass))}</span></div>`:'';
    const status=room.attention?'warn':room.phase==='active'?'good':room.phase==='idle'?'idle':'neutral';
    return `<article class="mm-room-card"><header class="mm-room-head"><span class="mm-room-glyph"><ha-icon icon="mdi:television-classic"></ha-icon></span><div><small>${this.t('room')}</small><h3>${rhiUxEscape(room.name)}</h3></div><span class="mm-phase mm-phase-${status}">${rhiUxEscape(rhiMmRoomStatus(room,this._hass))}</span></header>
      <div class="mm-room-current"><small>${this.t('activity')}</small><b>${rhiUxEscape(delegated?(room.harmony_activity||this.t('harmony_unavailable')):(room.activity_name||this.t('no_activity')))}</b>${room.progress?`<span>${rhiUxEscape(room.progress)}</span>`:''}</div>${media}
      <div class="mm-controls">${delegated?`<span class="mm-muted">${this.t('harmony_scope')}</span>`:buttons||`<span class="mm-muted">${this.t('no_activities')}</span>`}</div><div class="mm-room-foot">
      ${!delegated&&(room.activities.length||rhiMmCanRun(room,'stop_activity'))?`<button data-action="stop_activity" data-room="${rhiUxEscape(room.id)}" ${!rhiMmCanRun(room,'stop_activity')?'disabled':''}><ha-icon icon="mdi:power"></ha-icon> ${this.t('stop_activity')}</button>`:''}
      ${rhiMmCanRun(room,'recover_activity')?`<button data-action="recover_activity" data-room="${rhiUxEscape(room.id)}"><ha-icon icon="mdi:restore"></ha-icon> ${this.t('recover')}</button>`:''}
      <button class="mm-link" data-nav="rooms" data-room="${rhiUxEscape(room.id)}">${this.t('details')} <ha-icon icon="mdi:chevron-right"></ha-icon></button>
      </div>${quick?this.roomManualControls(room,true):''}${this.feedback(room.id)}${room.error?`<p class="mm-room-error">${rhiUxEscape(room.error)}</p>`:''}</article>`;
  }
  rooms(model,roomId){
    if(!model.rooms.length)return rhiUxState({title:this.t('no_rooms'),detail:this.t('configure_room')});
    const selected=model.rooms.find(r=>r.id===roomId)||model.rooms[0];
    return `<section class="mm-section"><div class="mm-heading"><div><h2>${this.t('room_control')}</h2><p>${this.t('room_ownership')}</p></div></div>
      <div class="mm-room-picker">${model.rooms.map(r=>`<button aria-pressed="${r.id===selected.id}" class="${r.id===selected.id?'active':''}" data-nav="rooms" data-room="${rhiUxEscape(r.id)}">${rhiUxEscape(r.name)}</button>`).join('')}</div>
      <div class="mm-detail-grid"><div>${this.roomCard(selected)}${this.roomManualControls(selected)}${this.roomNowPlaying(selected)}</div><div>${this.roomDeviceDetails(selected)}${this.roomRoutes(selected)}</div></div></section>`;
  }
  roomNowPlaying(room){const media=room.now_playing;return `<article class="mm-surface"><h3>${this.t('now_playing')}</h3>${media?`<div class="mm-media-detail">${media.picture?`<img alt="${this.t('media_artwork')}" src="${rhiUxEscape(media.picture)}">`:''}<div><b>${rhiUxEscape(media.title||this.t('playing'))}</b><p>${rhiUxEscape(media.artist||this.t('artist_unknown'))}</p><small>${rhiUxEscape(media.album||'')}</small></div></div>`:rhiUxState({state:'unavailable',title:this.t('no_playback'),detail:this.t('playback_help')})}${room.audio?`<div class="mm-audio-readback"><ha-icon icon="mdi:volume-high"></ha-icon><span>${rhiUxEscape(room.audio.name)}: ${room.audio.volume_level===null?this.t('volume_unknown'):`${Math.round(room.audio.volume_level*100)}%`}</span></div>`:''}</article>`;}
  roomManualControls(room,quick=false){
    const labels=Object.fromEntries(Object.entries({power_on:'on',power_off:'off',volume_down:'volume_down',volume_up:'volume_up',play:'play',pause:'pause',stop:'stop',previous:'previous',next:'next',source:'input',sound_mode:'sound_mode',volume:'volume',mute:'mute',join_group:'add_player',unjoin_group:'leave_group',harmony_activity:'harmony_activity'}).map(([action,key])=>[action,this.t(key)]));
    const escape=rhiUxEscape;
    const devices=room.devices.filter(d=>Object.keys(d.controls||{}).length&&
      (room.control_owner!=='harmony'||d.key===room.harmony_controller));
    const quickKeys=new Set([room.harmony_controller,room.audio?.device_key,room.now_playing?.device_key,devices.find(d=>d.role==='display')?.key,devices.find(d=>d.role==='player')?.key]);
    if(quick&&!room.activities.length&&devices.length&&!devices.some(d=>quickKeys.has(d.key)))quickKeys.add(devices[0].key);
    if(!devices.length)return '';
    const body=devices.filter(d=>!quick||quickKeys.has(d.key)).map(d=>{
      const c=d.controls, attrs=`data-room="${escape(room.id)}" data-device="${escape(d.key)}"`;
      const disabled=cap=>cap.enabled?'':`disabled title="${escape(cap.reason||this.t('unavailable'))}"`;
      const button=(action,label,value)=>c[action]?`<button type="button" ${attrs} data-device-action="${action}" ${value===undefined?'':`data-value="${escape(JSON.stringify(value))}"`} ${disabled(c[action])}>${escape(label)}</button>`:'';
      const options=(action,current)=>c[action]?`<label>${labels[action]}<select ${attrs} data-device-input="${action}" ${disabled(c[action])}><option value="">${escape(current||this.t('select'))}</option>${c[action].options.map(v=>`<option value="${escape(v)}" ${v===current?'selected':''}>${escape(c[action].option_labels?.[v]||v)}</option>`).join('')}</select></label>`:'';
      const buttons=(quick?['power_on','power_off','play','pause',...(!c.volume?['volume_down','volume_up']:[])]:['power_on','power_off','volume_down','volume_up','previous','play','pause','stop','next']).map(action=>button(action,labels[action])).join('');
      const volume=c.volume&&typeof d.volume_level==='number'?`<label>${this.t('volume')} ${Math.round(d.volume_level*100)}%<input type="range" min="0" max="1" step="0.01" value="${d.volume_level}" ${attrs} data-device-input="volume" ${disabled(c.volume)}></label>`:'';
      const mute=typeof d.is_volume_muted==='boolean'?button('mute',d.is_volume_muted?this.t('unmute'):this.t('mute'),!d.is_volume_muted):'';
      const remote=c.remote_key?(()=>{
        const sections=rhiMmRemoteGroups(c.remote_key.options);
        const key=room.id+':'+d.key+':remote';
        const renderKey=k=>button('remote_key',k==='ENTER'||k==='select'?'OK':k,k);
        const main=sections.find(s=>s.name==='navigation');
        const navigation=main?`<div class="mm-remote-navigation" role="group" aria-label="${this.t('remote_navigation')}">${main.keys.map(k=>`<span class="mm-remote-key mm-remote-key-${escape(['UP','up','DOWN','down','LEFT','left','RIGHT','right'].includes(k)?k.toLowerCase():k==='ENTER'||k==='select'?'ok':'extra')}">${renderKey(k)}</span>`).join('')}</div>`:'';
        const extra=sections.filter(s=>s.name!=='navigation').map(section=>{
          const persist=key+':'+section.name;
          return `<details data-persist="${escape(persist)}" ${this._expanded.has(persist)?'open':''}><summary>${this.t('remote_'+section.name)}</summary><div class="mm-native-buttons">${section.keys.map(renderKey).join('')}</div></details>`;
        }).join('');
        return `<details class="mm-remote" data-persist="${escape(key)}" ${this._expanded.has(key)?'open':''}><summary>${this.t('remote_keys')}</summary>${navigation}${extra}</details>`;
      })():'';
      return `<div class="mm-native-device"><b>${escape(d.name)}</b><small>${escape(d.state)}${d.shared?' · '+this.t('shared_source'):''}${d.group_members?.length>1?' · '+this.t('grouped')+' ('+d.group_members.length+' '+this.t('players')+')':''}</small><div class="mm-native-buttons">${buttons}${mute}</div>${volume}${options('harmony_activity',d.current_activity)}${quick?(room.activities.length?'':options('source',d.source)+options('sound_mode',d.sound_mode)+remote):options('source',d.source)+options('sound_mode',d.sound_mode)+options('join_group',null)+button('unjoin_group',labels.unjoin_group)+remote}${!quick?Object.entries(c).filter(([,cap])=>!cap.enabled&&cap.reason).map(([action,cap])=>`<small>${escape(labels[action]||action)}: ${escape(cap.reason)}</small>`).join(''):''}</div>`;
    }).join('');
    if(!body)return '';
    return quick?`<div class="mm-quick-controls">${body}</div>`:`<article class="mm-surface mm-native-controls"><h3>${this.t('device_controls')}</h3>${body}</article>`;
  }
  roomDeviceDetails(room){return `<article class="mm-surface"><h3>${this.t('connected_devices')}</h3><div class="mm-device-list">${room.devices.map(d=>`<div class="mm-device-row"><span class="mm-role"><ha-icon icon="${d.role==='display'?'mdi:television':d.role==='receiver'?'mdi:audio-video':'mdi:play-box'}"></ha-icon></span><div><b>${rhiUxEscape(d.name)}</b><small>${rhiUxEscape(d.role)} · ${rhiUxEscape(d.source||d.state)}${d.shared?' · '+this.t('shared_source'):''}${d.group_members?.length>1?' · '+this.t('grouped')+' ('+d.group_members.length+' '+this.t('players')+')':''}</small></div><span class="mm-phase ${d.available&&d.foundation_approved?'mm-phase-good':'mm-phase-warn'}">${d.available&&d.foundation_approved?this.t('connected'):this.t('attention')}</span>${d.external_owner?'':`<button title="${this.t('native_device')}" data-more-info="${rhiUxEscape(d.entity_id)}"><ha-icon icon="mdi:open-in-new"></ha-icon></button>`}</div>`).join('')}</div></article>`;}
  roomRoutes(room){const steps=room.activities.flatMap(a=>a.routes.map(r=>({...r,activity:a.name})));return `<article class="mm-surface"><h3>${this.t('routes')}</h3>${steps.length?`<div class="mm-device-list">${steps.map(r=>`<div class="mm-route"><b>${rhiUxEscape(r.activity)}</b><span>${rhiUxEscape(r.type)} · ${rhiUxEscape(r.target||r.selected||this.t('not_published'))}${r.status?` · ${rhiUxEscape(r.status)}`:''}</span></div>`).join('')}</div>`:rhiUxState({state:'empty',title:this.t('no_routes'),detail:this.t('route_help')})}</article>`;}
  activities(model){return `<section class="mm-section"><div class="mm-heading"><div><h2>${this.t('activities')}</h2><p>${this.t('activities_help')}</p></div></div><div class="mm-activities">${model.rooms.map(r=>`<article class="mm-surface"><h3>${rhiUxEscape(r.name)}</h3><div class="mm-controls">${r.activities.map(a=>`<button class="mm-activity ${a.active?'active':''}" data-action="start_activity" data-room="${rhiUxEscape(r.id)}" data-activity="${rhiUxEscape(a.id)}" ${!rhiMmCanRun(r,'start_activity',a.id)?'disabled':''}><ha-icon icon="${rhiMmActivityIcon(a.id)}"></ha-icon>${rhiUxEscape(a.name)}</button>`).join('')}</div><p class="mm-muted">${rhiUxEscape(rhiMmRoomStatus(r,this._hass))} · ${rhiUxEscape(r.activity_name||this.t('no_active_activity'))}</p>${this.feedback(r.id)}</article>`).join('')}</div></section>`;}
  devices(model){const rows=model.rooms.flatMap(r=>r.devices.map(d=>({...d,room:r.name})));return `<section class="mm-section"><div class="mm-heading"><div><h2>${this.t('devices_roles')}</h2><p>${this.t('device_help')}</p></div></div>${rows.length?`<div class="mm-device-table"><div class="mm-table-head"><span>${this.t('device')}</span><span>${this.t('role_room')}</span><span>${this.t('native_state')}</span><span>Foundation</span></div>${rows.map(d=>`<div class="mm-table-row"><span><b>${rhiUxEscape(d.name)}</b></span><span>${rhiUxEscape(d.role)} · ${rhiUxEscape(d.room)}</span><span>${rhiUxEscape(d.state)}</span><span>${d.foundation_approved?this.t('approved'):this.t('review')}</span></div>`).join('')}</div>`:rhiUxState({state:'empty',title:this.t('no_devices'),detail:this.t('no_bound')})}</section>`;}
  diagnostics(model){return `<section class="mm-section"><div class="mm-heading"><div><h2>${this.t('runtime_diagnostics')}</h2><p>${this.t('diag_help')}</p></div></div><div class="mm-diag-grid">${model.rooms.map(r=>`<article class="mm-surface"><h3>${rhiUxEscape(r.name)}</h3><div class="mm-diag-status"><span>${this.t('phase')}</span><b>${rhiUxEscape(r.phase)}</b></div><div class="mm-diag-status"><span>${this.t('approvals')}</span><b>${r.foundation_approved?this.t('valid'):this.t('review')}</b></div><div class="mm-diag-status"><span>${this.t('confirmed_playback')}</span><b>${r.playing?this.t('playing'):this.t('not_confirmed')}</b></div>${r.error?`<p class="mm-room-error">${rhiUxEscape(r.error)}</p>`:''}${r.warnings?.length?`<p class="mm-room-error">${r.warnings.map(rhiUxEscape).join('; ')}</p>`:''}<details data-persist="${rhiUxEscape(r.id)}:technical" ${this._expanded.has(r.id+':technical')?'open':''}><summary>${this.t('technical')}</summary><div class="mm-tech">${r.devices.map(d=>`<p>${rhiUxEscape(d.entity_id)} · ${rhiUxEscape(d.physical_id)}</p>`).join('')}</div></details></article>`).join('')}</div></section>`;}
}

if(!customElements.get('homebrain-multimedia-card'))customElements.define('homebrain-multimedia-card',HomeBrainMultimediaCard);
window.customCards=window.customCards||[];
if(!window.customCards.some(card=>card.type==='homebrain-multimedia-card'))window.customCards.push({type:'homebrain-multimedia-card',name:'Robotix Multimedia',description:'Premium room/activity dashboard using native Multimedia room status.',preview:false});
