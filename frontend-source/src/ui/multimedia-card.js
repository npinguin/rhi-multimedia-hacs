// RHI Multimedia Premium: one-card native Home Assistant dashboard.
// Core owns look/feel; backend owns meaning and all physical writers.
const RHI_MM_UX_VERSION = '__RHI_MM_UX_VERSION__';
const RHI_MM_HERO = `/rhi_multimedia/frontend/assets/heroes/multimedia-overview.svg?v=${encodeURIComponent(RHI_MM_UX_VERSION)}`;
const MM_MODULES = [
  {id:'multimedia',label:'Multimedia',items:[{id:'overview',label:'Overview'},{id:'rooms',label:'Rooms'}]},
  {id:'activities',label:'Activities',items:[{id:'activities',label:'Activities'}]},
  {id:'insights',label:'Insights',items:[{id:'devices',label:'Devices'},{id:'diagnostics',label:'Diagnostics'}]},
];
const MM_VIEW_META = {
  overview:['Multimedia Overview','Control your entertainment by room. See what is active, playing and needs attention.'],
  rooms:['Rooms','Choose a room and control its configured activities and media.'],
  activities:['Activities','Every available activity, grouped by its configured room.'],
  devices:['Devices','Screens, audio zones and sources linked by Multimedia after Foundation selection.'],
  diagnostics:['Diagnostics','Live execution, source binding and backend publication health.'],
};

class HomeBrainMultimediaCard extends HTMLElement {
  static getStubConfig() { return {type:'custom:homebrain-multimedia-card'}; }
  constructor() {
    super(); this.attachShadow({mode:'open'});
    this.config={}; this._hass=null; this._view=''; this._room='';
    this._lastSignature=''; this._pending=null; this._feedback=null;
    this._expanded=new Set(); this._timer=null;
    this._onLocation=()=>{this._lastSignature='';this.render();};
    this.shadowRoot.addEventListener('click',event=>this.onClick(event));
    this.shadowRoot.addEventListener('toggle',event=>this.onToggle(event),true);
  }
  setConfig(config={}) { this.config={...(config||{})}; this._lastSignature=''; this.render(); }
  connectedCallback() {window.addEventListener('popstate',this._onLocation);window.addEventListener('location-changed',this._onLocation);this.render();}
  disconnectedCallback() {window.removeEventListener('popstate',this._onLocation);window.removeEventListener('location-changed',this._onLocation);if(this._timer)clearTimeout(this._timer);}
  set hass(hass) {this._hass=hass;this.render();}
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
    const nav=event.target?.closest?.('[data-nav]');
    if(nav){event.preventDefault();this.navigate(nav.getAttribute('data-nav'),nav.getAttribute('data-room')||'');return;}
    const more=event.target?.closest?.('[data-more-info]');
    if(more){event.preventDefault();const entityId=more.getAttribute('data-more-info');if(entityId)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId},bubbles:true,composed:true}));return;}
    const action=event.target?.closest?.('[data-action]');
    if(!action||action.disabled)return;
    const roomId=action.getAttribute('data-room');
    const service=action.getAttribute('data-action');
    const activity=action.getAttribute('data-activity')||'';
    await this.execute(roomId,service,activity);
  }
  async execute(roomId,service,activity) {
    const contract=rhiMmContract(this._hass,this.config.experience_entity);
    const room=contract.ready?contract.rooms.find(row=>row.id===roomId):null;
    const intent=rhiMmIntent(room,service,activity);
    if(!intent){this._feedback={state:'error',message:'Action unavailable: check Multimedia activity, Foundation selection and source status.'};this._lastSignature='';this.render();return;}
    this._pending={room:roomId,activity,service,sinceRevision:contract.revision};
    this._feedback={state:'pending',message:'Command submitted. Waiting for Multimedia backend readback…'};
    this._lastSignature='';this.render();
    try {
      await this._hass.callService(intent.domain,intent.service,intent.data);
    } catch(e) {
      this._pending=null;
      this._feedback={state:'error',message:String(e?.message||e)};
      this._lastSignature='';this.render();return;
    }
    if(this._timer)clearTimeout(this._timer);
    this._timer=setTimeout(()=>{
      if(this._pending){this._pending=null;this._feedback={state:'attention',message:'No confirmed backend result yet. Check room diagnostics and physical devices.'};this._lastSignature='';this.render();}
    },30000);
    this._lastSignature='';this.render();
  }
  reconcile(model) {
    if(!this._pending||!model.ready)return;
    const p=this._pending;const room=model.rooms.find(r=>r.id===p.room);if(!room)return;
    if (model.revision<=p.sinceRevision) return; // Older 'active' is not proof of THIS command.
    const complete=(p.service==='stop_activity'&&room.phase==='idle') ||
      (p.service!=='stop_activity'&&room.phase==='active'&&room.activity_id===(p.activity||room.activity_id));
    if(complete){this._pending=null;this._feedback={state:'ok',message:`${room.name}: backend confirmed ${rhiMmRoomStatus(room).toLowerCase()}.`};if(this._timer)clearTimeout(this._timer);return;}
    if(['error','partial','interrupted'].includes(room.phase)){
      this._pending=null;this._feedback={state:'error',message:`${room.name}: ${room.error||room.progress||rhiMmRoomStatus(room)}`};if(this._timer)clearTimeout(this._timer);
    }
  }
  render() {
    if(!this.shadowRoot||!this._hass)return;
    const route=this.currentRoute();this._view=route.view;this._room=route.room;
    const contract=rhiMmContract(this._hass,this.config.experience_entity);
    const model=rhiMmPresentation(contract);
    this.reconcile(model);
    const fingerprint=JSON.stringify([model.ready,model.revision,model.backendVersion,route.view,route.room,this._pending,this._feedback]);
    if(this._lastSignature===fingerprint)return;
    this._lastSignature=fingerprint;
    const page=this.renderPage(model,route.view,route.room);
    this.shadowRoot.innerHTML=`<style>${RHI_MM_CORE_CSS}\n${RHI_MM_DOMAIN_CSS}</style><ha-card><div class="mm-shell">
      ${rhiUxDomainShell({product:'Home Intelligence',domain:'MULTIMEDIA',modules:MM_MODULES.map(m=>({...m,items:m.items.map(i=>({...i,target:i.id}))})),activeModule:MM_MODULES.find(m=>m.items.some(i=>i.id===route.view))?.id||'multimedia',activeItem:route.view})}
      ${page}
      ${rhiUxTechnicalFooter({product:'RHI Multimedia',uxVersion:RHI_MM_UX_VERSION,backendVersion:model.ready?model.backendVersion:'Not published',issue:!model.ready?'Backend unavailable':(model.summary.attention_rooms?'Attention':'Ready'),severity:!model.ready?'warning':model.summary.attention_rooms?'warning':''})}
    </div></ha-card>`;
  }
  hero(view){const [title,description]=MM_VIEW_META[view]||MM_VIEW_META.overview;return rhiUxPageHero({title,description,image:RHI_MM_HERO});}
  unavailable(model){return `<section class="mm-callout mm-attention"><ha-icon icon="mdi:connection"></ha-icon><div><b>Multimedia backend not ready</b><p>${rhiUxEscape(model.reason)}</p><p>Complete Foundation's Multimedia device selection, configure your room in Multimedia, then refresh this dashboard.</p></div></section>`;}
  feedback(){return this._feedback?rhiUxWriteFeedback({state:this._feedback.state,message:this._feedback.message}):'';}
  renderPage(model,view,roomId) {
    const hero=this.hero(view);if(!model.ready)return rhiUxPageTemplate({hero,content:this.unavailable(model)});
    const status=view==='overview'?rhiUxStatusGrid([
      {icon:'mdi:home-outline',label:'Rooms',value:model.summary.room_count,detail:'Configured rooms'},
      {icon:'mdi:play-circle-outline',label:'Active',value:model.summary.active_rooms,detail:'Backend activity state'},
      {icon:'mdi:music-circle-outline',label:'Playback',value:model.summary.playing_rooms,detail:'Native playing readback'},
      {icon:'mdi:alert-circle-outline',label:'Attention',value:model.summary.attention_rooms,detail:'Rooms requiring review'},
    ]):'';
    const actions=view==='overview'?rhiUxQuickActionBar({label:'Quick actions',actions:[
      {label:'Rooms',icon:'mdi:home-outline',target:'rooms',primary:true},
      {label:'Activities',icon:'mdi:play-circle-outline',target:'activities'},
      {label:'Devices',icon:'mdi:audio-video',target:'devices'},
      {label:'Diagnostics',icon:'mdi:stethoscope',target:'diagnostics'},
    ]}):'';
    const content={
      overview:()=>this.overview(model),rooms:()=>this.rooms(model,roomId),activities:()=>this.activities(model),
      devices:()=>this.devices(model),diagnostics:()=>this.diagnostics(model),
    }[view]||(()=>this.overview(model));
    return rhiUxPageTemplate({hero,status,actions,content:this.feedback()+content(),className:'mm-page'});
  }
  overview(model){return `<section class="mm-section"><div class="mm-heading"><div><h2>Rooms & activities</h2><p>Active rooms first. Switch activities without choosing individual HDMI devices.</p></div><button class="mm-link" data-nav="rooms">All rooms <ha-icon icon="mdi:chevron-right"></ha-icon></button></div>${model.rooms.length?`<div class="mm-room-grid">${model.rooms.map(room=>this.roomCard(room)).join('')}</div>`:rhiUxState({state:'empty',title:'No rooms configured',detail:'Create a Multimedia room after Foundation technical selection.'})}</section>`;}
  roomCard(room){
    const buttons=room.activities.map(a=>`<button type="button" class="mm-activity ${a.active?'active':''}" data-action="start_activity" data-room="${rhiUxEscape(room.id)}" data-activity="${rhiUxEscape(a.id)}" ${!rhiMmCanRun(room,'start_activity',a.id)?'disabled':''} title="${rhiUxEscape(a.disabled_reason||'')}"><ha-icon icon="${rhiMmActivityIcon(a.id)}"></ha-icon>${rhiUxEscape(a.name)}</button>`).join('');
    const media=room.now_playing?`<div class="mm-nowplaying"><ha-icon icon="mdi:music-note"></ha-icon><span>${rhiUxEscape(rhiMmMediaSubtitle(room))}</span></div>`:'';
    const status=room.attention?'warn':room.phase==='active'?'good':room.phase==='idle'?'idle':'neutral';
    return `<article class="mm-room-card"><header class="mm-room-head"><span class="mm-room-glyph"><ha-icon icon="mdi:television-classic"></ha-icon></span><div><small>ROOM</small><h3>${rhiUxEscape(room.name)}</h3></div><span class="mm-phase mm-phase-${status}">${rhiUxEscape(rhiMmRoomStatus(room))}</span></header>
      <div class="mm-room-current"><small>ACTIVITY</small><b>${rhiUxEscape(room.activity_name||'No activity')}</b>${room.progress?`<span>${rhiUxEscape(room.progress)}</span>`:''}</div>${media}
      <div class="mm-controls">${buttons||'<span class="mm-muted">No activities configured</span>'}</div><div class="mm-room-foot">
      <button data-action="stop_activity" data-room="${rhiUxEscape(room.id)}" ${!rhiMmCanRun(room,'stop_activity')?'disabled':''}><ha-icon icon="mdi:power"></ha-icon> Off</button>
      ${rhiMmCanRun(room,'recover_activity')?`<button data-action="recover_activity" data-room="${rhiUxEscape(room.id)}"><ha-icon icon="mdi:restore"></ha-icon> Recover</button>`:''}
      <button class="mm-link" data-nav="rooms" data-room="${rhiUxEscape(room.id)}">Details <ha-icon icon="mdi:chevron-right"></ha-icon></button>
      </div>${room.error?`<p class="mm-room-error">${rhiUxEscape(room.error)}</p>`:''}</article>`;
  }
  rooms(model,roomId){
    if(!model.rooms.length)return rhiUxState({title:'No rooms',detail:'Configure a room in the Multimedia integration.'});
    const selected=model.rooms.find(r=>r.id===roomId)||model.rooms[0];
    return `<section class="mm-section"><div class="mm-heading"><div><h2>Room control</h2><p>Rooms are configured in Multimedia; source devices remain owned by their HA integrations.</p></div></div>
      <div class="mm-room-picker">${model.rooms.map(r=>`<button class="${r.id===selected.id?'active':''}" data-nav="rooms" data-room="${rhiUxEscape(r.id)}">${rhiUxEscape(r.name)}</button>`).join('')}</div>
      <div class="mm-detail-grid"><div>${this.roomCard(selected)}${this.roomNowPlaying(selected)}</div><div>${this.roomDeviceDetails(selected)}${this.roomRoutes(selected)}</div></div></section>`;
  }
  roomNowPlaying(room){const media=room.now_playing;return `<article class="mm-surface"><h3>Now playing</h3>${media?`<div class="mm-media-detail">${media.picture?`<img alt="Media artwork" src="${rhiUxEscape(media.picture)}">`:''}<div><b>${rhiUxEscape(media.title||'Playing')}</b><p>${rhiUxEscape(media.artist||'Artist not published')}</p><small>${rhiUxEscape(media.album||'')}</small></div></div>`:rhiUxState({state:'unavailable',title:'No confirmed playback',detail:'Playback is shown only when a configured source reports playing.'})}${room.audio?`<div class="mm-audio-readback"><ha-icon icon="mdi:volume-high"></ha-icon><span>${rhiUxEscape(room.audio.name)}: ${room.audio.volume_level===null?'Volume not published':`${Math.round(room.audio.volume_level*100)}%`}</span></div>`:''}</article>`;}
  roomDeviceDetails(room){return `<article class="mm-surface"><h3>Connected devices</h3><div class="mm-device-list">${room.devices.map(d=>`<div class="mm-device-row"><span class="mm-role"><ha-icon icon="${d.role==='display'?'mdi:television':d.role==='receiver'?'mdi:audio-video':'mdi:play-box'}"></ha-icon></span><div><b>${rhiUxEscape(d.name)}</b><small>${rhiUxEscape(d.role)} · ${rhiUxEscape(d.source||d.state)}</small></div><span class="mm-phase ${d.available&&d.foundation_approved?'mm-phase-good':'mm-phase-warn'}">${d.available&&d.foundation_approved?'Connected':'Attention'}</span><button title="Open native device" data-more-info="${rhiUxEscape(d.entity_id)}"><ha-icon icon="mdi:open-in-new"></ha-icon></button></div>`).join('')}</div></article>`;}
  roomRoutes(room){const steps=room.activities.flatMap(a=>a.routes.map(r=>({...r,activity:a.name})));return `<article class="mm-surface"><h3>Input routes</h3>${steps.length?`<div class="mm-device-list">${steps.map(r=>`<div class="mm-route"><b>${rhiUxEscape(r.activity)}</b><span>${rhiUxEscape(r.type)} · ${rhiUxEscape(r.selected||'Not published')}</span></div>`).join('')}</div>`:rhiUxState({state:'empty',title:'No explicit routes',detail:'Select the available physical inputs in Multimedia configuration.'})}</article>`;}
  activities(model){return `<section class="mm-section"><div class="mm-heading"><div><h2>Activities</h2><p>Only configured activities and backend-approved source paths are actionable.</p></div></div><div class="mm-activities">${model.rooms.map(r=>`<article class="mm-surface"><h3>${rhiUxEscape(r.name)}</h3><div class="mm-controls">${r.activities.map(a=>`<button class="mm-activity ${a.active?'active':''}" data-action="start_activity" data-room="${rhiUxEscape(r.id)}" data-activity="${rhiUxEscape(a.id)}" ${!rhiMmCanRun(r,'start_activity',a.id)?'disabled':''}><ha-icon icon="${rhiMmActivityIcon(a.id)}"></ha-icon>${rhiUxEscape(a.name)}</button>`).join('')}</div><p class="mm-muted">${rhiUxEscape(rhiMmRoomStatus(r))} · ${rhiUxEscape(r.activity_name||'No active activity')}</p></article>`).join('')}</div></section>`;}
  devices(model){const rows=model.rooms.flatMap(r=>r.devices.map(d=>({...d,room:r.name})));return `<section class="mm-section"><div class="mm-heading"><div><h2>Devices & roles</h2><p>Selected in Foundation, then assigned to rooms and activities by Multimedia.</p></div></div>${rows.length?`<div class="mm-device-table"><div class="mm-table-head"><span>Device</span><span>Role / room</span><span>Native state</span><span>Foundation</span></div>${rows.map(d=>`<div class="mm-table-row"><span><b>${rhiUxEscape(d.name)}</b></span><span>${rhiUxEscape(d.role)} · ${rhiUxEscape(d.room)}</span><span>${rhiUxEscape(d.state)}</span><span>${d.foundation_approved?'Approved':'Review'}</span></div>`).join('')}</div>`:rhiUxState({state:'empty',title:'No devices',detail:'No devices are bound in Multimedia.'})}</section>`;}
  diagnostics(model){return `<section class="mm-section"><div class="mm-heading"><div><h2>Runtime diagnostics</h2><p>Backend-owned phase, readback and Foundation binding results.</p></div></div><div class="mm-diag-grid">${model.rooms.map(r=>`<article class="mm-surface"><h3>${rhiUxEscape(r.name)}</h3><div class="mm-diag-status"><span>Execution phase</span><b>${rhiUxEscape(r.phase)}</b></div><div class="mm-diag-status"><span>Foundation source approvals</span><b>${r.foundation_approved?'Valid':'Review'}</b></div><div class="mm-diag-status"><span>Confirmed playback</span><b>${r.playing?'Playing':'Not confirmed'}</b></div>${r.error?`<p class="mm-room-error">${rhiUxEscape(r.error)}</p>`:''}${r.warnings?.length?`<p class="mm-room-error">${r.warnings.map(rhiUxEscape).join('; ')}</p>`:''}<details data-persist="${rhiUxEscape(r.id)}:technical" ${this._expanded.has(r.id+':technical')?'open':''}><summary>Technical source identities</summary><div class="mm-tech">${r.devices.map(d=>`<p>${rhiUxEscape(d.entity_id)} · ${rhiUxEscape(d.physical_id)}</p>`).join('')}</div></details></article>`).join('')}</div></section>`;}
}

if(!customElements.get('homebrain-multimedia-card'))customElements.define('homebrain-multimedia-card',HomeBrainMultimediaCard);
window.customCards=window.customCards||[];
if(!window.customCards.some(card=>card.type==='homebrain-multimedia-card'))window.customCards.push({type:'homebrain-multimedia-card',name:'Robotix Multimedia',description:'Premium room/activity dashboard backed by RHI Multimedia Experience V1.',preview:false});
