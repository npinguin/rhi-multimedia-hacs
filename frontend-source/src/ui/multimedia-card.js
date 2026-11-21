// RHI Multimedia Premium: one-card native Home Assistant dashboard.
// Core owns look/feel; backend owns meaning and all physical writers.
const RHI_MM_UX_VERSION = '__RHI_MM_UX_VERSION__';
const RHI_MM_HERO_ASSETS = Object.freeze({
  multimedia: 'multimedia-overview.svg',
  activities: 'multimedia-activities.svg',
  insights: 'multimedia-insights.svg',
});
function rhiMmHeroAsset(group){
  return `/rhi_multimedia/frontend/assets/heroes/${RHI_MM_HERO_ASSETS[group]}?v=${encodeURIComponent(RHI_MM_UX_VERSION)}`;
}

function rhiMmDeviceArt(device,illustrationLabel,variant='thumbnail'){
  // Consume only a producer-published ref + Foundation-validated package
  // locator. No UI-side product/model catalog, remote hotlink or fake image.
  const kind=device?.role==='display'?'mdi:television':
    ['amplifier','receiver'].includes(device?.role)?'mdi:amplifier':'mdi:play-box-outline';
  const fallback=`<span class="mm-device-art mm-device-art-neutral"><ha-icon icon="${kind}"></ha-icon></span>`;
  const visual=device?.visual,presentation=visual?.presentation;
  const path=['thumbnail','card','detail'].includes(variant)?
    presentation?.variants?.[variant]:null;
  if(device?.foundation_approved!==true||
     device?.product_profile?.identity_evidence!=='exact_native_ha_device_registry'||
     typeof device?.visual_ref!=='string'||visual?.visual_ref!==device.visual_ref||
     !device.visual_ref.startsWith('rhi_multimedia.')||
     visual?.kind!=='illustrative_generated'||
     presentation?.package_id!=='rhi_multimedia'||
     typeof path!=='string'||!/^assets\/devices\/[a-z0-9_-]+\.svg$/.test(path))
    return fallback;
  const alt=rhiUxEscape((device?.name||'')+' · '+illustrationLabel);
  const url=`/rhi_multimedia/frontend/${path}?v=${encodeURIComponent(RHI_MM_UX_VERSION)}`;
  return `<span class="mm-device-art" data-visual-ref="${rhiUxEscape(device.visual_ref)}" data-visual-variant="${variant}">
    <img src="${rhiUxEscape(url)}" alt="${alt}" loading="lazy" decoding="async" width="64" height="64">
  </span>`;
}

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
    take('navigation',['HOME','home','MENU','menu','top_menu','BACK','back','INFO','info','EXIT','exit','UP','up','DPAD_UP','LEFT','left','DPAD_LEFT','ENTER','select','ok','DPAD_CENTER','RIGHT','right','DPAD_RIGHT','DOWN','down','DPAD_DOWN']),
    take('media',['CHANNELUP','CHANNELDOWN','GUIDE','VOLUMEUP','VOLUMEDOWN','VOLUME_UP','VOLUME_DOWN','PLAY','play','MEDIA_PLAY','PAUSE','pause','MEDIA_PAUSE','MEDIA_PLAY_PAUSE','MEDIA_STOP','MUTE','mute']),
    take('numbers',Array.from({length:10},(_,i)=>String(i))),
    take('apps',['NETFLIX','AMAZON','RED','GREEN','BLUE','YELLOW']),
  ];
  const other=keys.filter(k=>!used.has(k));if(other.length)groups.push({name:'more',keys:other});
  return groups.filter(group=>group.keys.length);
}

// A transient view of server-returned HA Options Flow schema. The HA backend
// alone validates and saves; unknown field types cannot be submitted.
function rhiMmOptionPairs(field){
  const raw=field?.type==='selector'?field.selector?.select?.options:field?.options;
  if(!Array.isArray(raw))return [];
  return raw.map(o=>Array.isArray(o)?[o[0],o[1]??o[0]]:
    o&&typeof o==='object'?[o.value,o.label??o.value]:[o,o])
    .filter(([v])=>typeof v==='string');
}
function rhiMmOptionSupported(field){
  if(!field||typeof field.name!=='string')return false;
  if(['string','boolean','integer','float'].includes(field.type))return true;
  if(field.type==='select')return rhiMmOptionPairs(field).length>0;
  return field.type==='selector'&&(
    (!!field.selector?.select&&rhiMmOptionPairs(field).length>0)||
    !!field.selector?.text);
}
function rhiMmOptionDefaults(step){
  const values={};
  for(const field of step?.data_schema||[]){
    const suggestion=field?.description?.suggested_value;
    if(suggestion!==undefined&&suggestion!==null)values[field.name]=suggestion;
    else if(Object.prototype.hasOwnProperty.call(field,'default'))values[field.name]=field.default;
    else if(!field.required)continue; // No implicit write to optional native fields.
    else if(field.type==='boolean')values[field.name]=false;
    else if(field.type==='string')values[field.name]='';
    else if(field.type==='integer')values[field.name]=Number.isInteger(field.valueMin)?field.valueMin:0;
    else if(field.type==='float')values[field.name]=0;
    else if(field.type==='select')values[field.name]=rhiMmOptionPairs(field)[0]?.[0];
    else if(field.type==='selector'&&field.selector?.select?.multiple)values[field.name]=[];
    else if(field.type==='selector'&&field.selector?.select)values[field.name]=rhiMmOptionPairs(field)[0]?.[0];
  }
  return values;
}
class HomeBrainMultimediaCard extends HTMLElement {
  static getStubConfig() { return {type:'custom:homebrain-multimedia-card'}; }
  constructor() {
    super(); this.attachShadow({mode:'open'});
    this.config={}; this._hass=null; this._view=''; this._room='';
    this._lastSignature=''; this._feedback=new Map();
    this._expanded=new Set();this._remoteSelections=new Map();this._destinationSelection=null;this._contextSelections=new Map();this._contextKey='';this._contextCards=[];this._planSummary=null;this._planRequest=0;
    this._optionsStep=null;this._optionsData={};this._optionsBusy=false;
    this._optionsError='';this._optionsNotice='';this._optionsEpoch=0;this._optionsRevision=0;
    this._onLocation=()=>{
      if(!['activities','devices'].includes(this.currentRoute().view)&&(this._optionsStep||this._optionsBusy)){
        void this.cancelOptions();
      }else{this._lastSignature='';this.render();}
    };
    this.shadowRoot.addEventListener('click',event=>this.onClick(event));
    this.shadowRoot.addEventListener('change',event=>{this.onControlChange(event);this.onOptionValue(event);});
    this.shadowRoot.addEventListener('input',event=>this.onOptionValue(event));
    this.shadowRoot.addEventListener('toggle',event=>this.onToggle(event),true);
  }
  setConfig(config={}) { this.config={...(config||{})}; this._lastSignature=''; this.render(); }
  connectedCallback() {window.addEventListener('popstate',this._onLocation);window.addEventListener('location-changed',this._onLocation);this.render();}
  disconnectedCallback() {
    window.removeEventListener('popstate',this._onLocation);
    window.removeEventListener('location-changed',this._onLocation);
    if(this._optionsStep||this._optionsBusy)void this.cancelOptions();
  }
  set hass(hass) {
    this._hass=hass;
    if(!hass?.user?.is_admin&&(this._optionsStep||this._optionsBusy)){
      void this.cancelOptions();
    }else this.render();
  }
  t(key){return rhiMmText(this._hass,key);}
  getCardSize() {return 12;}
  getGridOptions() {return {columns:12,rows:12,min_rows:5};}
  currentRoute() {
    try {
      const url=new URL(window.location.href);
      return {view:RHI_MM_VIEWS.includes(url.searchParams.get('multimedia_view'))?url.searchParams.get('multimedia_view'):(this.config.default_view||'overview'),
        room:url.searchParams.get('multimedia_room')||'',
        floor:url.searchParams.get('multimedia_floor')||''};
    } catch (_) {return {view:this.config.default_view||'overview',room:'',floor:''};}
  }
  navigate(view,room='',floor) {
    if (!RHI_MM_VIEWS.includes(view)) return;
    this._destinationSelection=null;
    const url=new URL(window.location.href);
    url.searchParams.set('multimedia_view',view);
    if(room)url.searchParams.set('multimedia_room',room);else url.searchParams.delete('multimedia_room');
    if (floor !== undefined) {
      if(floor)url.searchParams.set('multimedia_floor',floor);
      else url.searchParams.delete('multimedia_floor');
    }
    window.history.pushState(null,'',url.pathname+url.search+url.hash);
    this._lastSignature='';this.render();
  }
  onToggle(event){const el=event.target?.closest?.('details[data-persist]');if(!el)return;const key=el.getAttribute('data-persist');if(el.open)this._expanded.add(key);else this._expanded.delete(key);}
  async onClick(event) {
    const context=event.target?.closest?.('[data-context-tab]');
    if(context){const value=context.getAttribute('data-context-tab');this._contextSelections.set(this._contextScope,value);this._contextKey='';this._lastSignature='';this.render();return;}
    const refresh=event.target?.closest?.('[data-context-refresh]');
    if(refresh){this._planSummary=null;this._planRequest++;this._planPending=false;this._planToken=null;this.render();return;}
    const destination=event.target?.closest?.('[data-notification-destination]');
    if(destination){
      const endpoint=destination.getAttribute('data-notification-destination');
      this._destinationSelection=endpoint||null;
      this._contextKey='';this.render();
      return;
    }
    const focus=event.target?.closest?.('[data-remote-focus]');
    if(focus){
      const id=focus.getAttribute('data-room'),key=focus.getAttribute('data-remote-focus');
      const route=this.currentRoute(),room=rhiMmRooms(this._hass).rooms?.find(r=>r.id===id);
      if(route.view==='rooms'&&room&&(!route.room||route.room===room.id)&&room.devices.some(d=>d.key===key)){
        const active=room.activities.find(a=>a.id===room.activity_id&&a.active);
        this._remoteSelections.set(room.id+':'+(active?.id||'manual'),key);
        this._lastSignature='';this.render();
      }
      return;
    }
    const floor=event.target?.closest?.('[data-floor]');
    if(floor){event.preventDefault();this.navigate('overview','',floor.getAttribute('data-floor')||'');return;}
    const option=event.target?.closest?.('[data-mm-option-action]');
    if(option){event.preventDefault();if(!option.disabled)await this.openOptions({
      action:option.getAttribute('data-mm-option-action'),
      room:option.getAttribute('data-mm-option-room')||'',
      activity:option.getAttribute('data-mm-option-activity')||'',
      scope:option.getAttribute('data-mm-option-scope')||'',
      id:option.getAttribute('data-mm-option-id')||''});return;}
    const submitOption=event.target?.closest?.('[data-mm-option-submit]');
    if(submitOption){event.preventDefault();await this.submitOptions();return;}
    const cancelOption=event.target?.closest?.('[data-mm-option-cancel]');
    if(cancelOption){event.preventDefault();await this.cancelOptions();return;}
    const nav=event.target?.closest?.('[data-nav]');
    if(nav){event.preventDefault();if(this._optionsStep||this._optionsBusy)await this.cancelOptions();
      this.navigate(nav.getAttribute('data-nav'),nav.getAttribute('data-room')||'');return;}
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
  onOptionValue(event){
    const el=event.target?.closest?.('[data-mm-option-field]');
    if(!el||!this._optionsStep||this._optionsBusy)return;
    const key=el.getAttribute('data-mm-option-field');
    if(!key)return;
    if(el.hasAttribute('data-mm-option-choice')){
      const wanted=el.getAttribute('data-mm-option-choice');
      const values=new Set(Array.isArray(this._optionsData[key])?this._optionsData[key]:[]);
      if(el.checked)values.add(wanted);else values.delete(wanted);
      this._optionsData[key]=[...values];
    }else if(el.type==='checkbox')this._optionsData[key]=!!el.checked;
    else if(el.type==='number')this._optionsData[key]=el.value===''?'':Number(el.value);
    else this._optionsData[key]=el.value;
  }
  _optionRefresh(){this._optionsRevision++;this._lastSignature='';this.render();}
  async openOptions({action,room='',activity='',scope='',id=''}) {
    if(!this._hass?.user?.is_admin||this._optionsBusy)return;
    const oldStep=this._optionsStep;
    const epoch=++this._optionsEpoch;
    this._optionsStep=null;this._optionsData={};this._optionsError='';
    this._optionsNotice='';this._optionsBusy=true;this._optionRefresh();
    try{
      if(oldStep)await rhiMmOptionsCancel(this._hass,oldStep);
      if(epoch!==this._optionsEpoch)return;
      // Reuse HA's installed integration translations. Fail safely to generic
      // field labels on old/offline frontend clients.
      if(typeof this._hass.loadBackendTranslation==='function'){
        try{await this._hass.loadBackendTranslation('options','rhi_multimedia');}catch(_){}
      }
      if(epoch!==this._optionsEpoch)return;
      const step=await rhiMmOptionsBegin(this._hass,{action,room,activity,scope,id});
      if(epoch!==this._optionsEpoch){
        await rhiMmOptionsCancel(this._hass,step);
        return;
      }
      if(step?.type!=='form'){
        await rhiMmOptionsCancel(this._hass,step);
        throw new Error('Invalid configuration response');
      }
      this._optionsStep=step;this._optionsData=rhiMmOptionDefaults(step);
    }catch(_){
      if(epoch===this._optionsEpoch)this._optionsError=this.t('setup_flow_failed');
    }finally{
      if(epoch===this._optionsEpoch){this._optionsBusy=false;this._optionRefresh();}
    }
  }
  async submitOptions(){
    const step=this._optionsStep;
    if(!step||this._optionsBusy||!this._hass?.user?.is_admin)return;
    if(!(step.data_schema||[]).every(rhiMmOptionSupported)){
      this._optionsError=this.t('setup_field_unsupported');this._optionRefresh();return;
    }
    const epoch=++this._optionsEpoch;
    this._optionsBusy=true;this._optionsError='';this._optionRefresh();
    try{
      const response=await rhiMmOptionsAdvance(this._hass,step,{...this._optionsData});
      if(epoch!==this._optionsEpoch)return;
      if(response?.type==='create_entry'){
        this._optionsStep=null;this._optionsData={};
        this._optionsNotice=this.t('setup_saved');
      }else if(response?.type==='form'){
        this._optionsStep=response;
        if(response.step_id!==step.step_id)this._optionsData=rhiMmOptionDefaults(response);
      }else{
        this._optionsStep=null;this._optionsData={};
        this._optionsError=this.t('setup_flow_failed');
      }
    }catch(_){
      if(epoch===this._optionsEpoch)this._optionsError=this.t('setup_flow_failed');
    }finally{
      if(epoch===this._optionsEpoch){this._optionsBusy=false;this._optionRefresh();}
    }
  }
  async cancelOptions(){
    const step=this._optionsStep;
    ++this._optionsEpoch;
    this._optionsStep=null;this._optionsData={};this._optionsBusy=false;
    this._optionsError='';this._optionsNotice='';this._optionRefresh();
    if(step){try{await rhiMmOptionsCancel(this._hass,step);}catch(_){}}
  }
  optionError(step,code){
    if(!code)return '';
    return this._hass?.localize?.(`component.rhi_multimedia.options.error.${code}`,
      step?.description_placeholders||{})||String(code).replaceAll('_',' ');
  }
  optionLabel(step,field){
    const key=`component.rhi_multimedia.options.step.${step.step_id}.data.${field.name}`;
    const localized=this._hass?.localize?.(key,step.description_placeholders||{});
    if(localized)return localized;
    if(field.name.startsWith('route_'))return this.t('routes')+': '+field.name.slice(6).replaceAll('_',' ');
    return field.name.replaceAll('_',' ');
  }
  optionInput(step,field){
    const escape=rhiUxEscape;
    const key=field.name,value=this._optionsData[key],disabled=this._optionsBusy?'disabled':'';
    const label=escape(this.optionLabel(step,field));
    const attr=`data-mm-option-field="${escape(key)}" ${disabled}`;
    const pairs=rhiMmOptionPairs(field);
    const multiple=field.type==='selector'&&field.selector?.select?.multiple===true;
    const error=step.errors?.[key]?escape(this.optionError(step,step.errors[key])):'';
    if(!rhiMmOptionSupported(field))return `<p class="mm-room-error">${label}: ${this.t('setup_field_unsupported')}</p>`;
    let control;
    if(multiple){
      const selected=new Set(Array.isArray(value)?value:[]);
      control=`<fieldset class="mm-option-multiple"><legend>${label}</legend>
        ${pairs.map(([item,title])=>`<label><input type="checkbox" ${attr}
          data-mm-option-choice="${escape(item)}" ${selected.has(item)?'checked':''}/>
          ${escape(title)}</label>`).join('')}</fieldset>`;
      return `<div class="mm-option-field">${control}${error?`<small class="mm-room-error">${error}</small>`:''}</div>`;
    }
    if(field.type==='selector'&&field.selector?.text){
      control=`<textarea ${attr} rows="12" spellcheck="false"
        class="mm-option-yaml" aria-label="${label}">${escape(value??'')}</textarea>`;
    }else if(field.type==='select'||field.type==='selector'){
      control=`<select ${attr}>${pairs.map(([item,title])=>
        `<option value="${escape(item)}" ${value===item?'selected':''}>${escape(title)}</option>`).join('')}</select>`;
    }else if(field.type==='boolean'){
      control=`<input type="checkbox" ${attr} ${value===true?'checked':''}/>`;
    }else{
      control=`<input type="${['integer','float'].includes(field.type)?'number':'text'}" ${attr}
        ${field.type==='integer'?'step="1"':field.type==='float'?'step="any"':''}
        value="${escape(value??'')}"/>`;
    }
    return `<label class="mm-option-field">${label}${control}${error?`<small class="mm-room-error">${error}</small>`:''}</label>`;
  }
  renderOptionsEditor(){
    // HA's actual administrator permission remains authoritative on every
    // render. Never expose an in-flight form after role revocation.
    if(!this._hass?.user?.is_admin)return '';
    const escape=rhiUxEscape,step=this._optionsStep;
    if(!step&&!this._optionsBusy&&!this._optionsError&&!this._optionsNotice)return '';
    const errors=step?.errors||{};
    const base=errors.base?this.optionError(step,errors.base):this._optionsError;
    const label=step?.step_id?
      this._hass?.localize?.(`component.rhi_multimedia.options.step.${step.step_id}.title`,
        step.description_placeholders||{}):null;
    const description=step?.step_id?
      this._hass?.localize?.(`component.rhi_multimedia.options.step.${step.step_id}.description`,
        step.description_placeholders||{}):null;
    const unsupported=!!step&&!(step.data_schema||[]).every(rhiMmOptionSupported);
    return `<section class="mm-surface mm-options-editor" aria-live="polite" data-mm-flow-editor>
      <h3>${escape(label||this.t('setup_editor'))}</h3>
      ${description?`<p class="mm-options-description">${escape(description)}</p>`:''}
      ${step?.description_placeholders?.note?`<p class="mm-options-description">${escape(step.description_placeholders.note)}</p>`:''}
      ${base?`<p role="alert" class="mm-room-error">${escape(base)}</p>`:''}
      ${this._optionsNotice?`<p role="status">${escape(this._optionsNotice)}</p>`:''}
      ${step?.type==='form'?`<div class="mm-option-fields">
        ${(step.data_schema||[]).map(field=>this.optionInput(step,field)).join('')}</div>`:''}
      <div class="mm-setup-actions">
        ${step?`<button type="button" data-mm-option-submit ${this._optionsBusy||unsupported?'disabled':''}>${this.t('setup_continue')}</button>`:''}
        ${step?`<button type="button" data-mm-option-cancel>${this.t('setup_cancel')}</button>`:''}
        <a href="/config/integrations/integration/rhi_multimedia">${this.t('setup_manage')}</a>
      </div></section>`;
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
    const route=this.currentRoute();this._view=route.view;this._room=route.room;this._floor=route.floor||'';
    const contract=rhiMmRooms(this._hass);
    const model=rhiMmPresentation(contract);
    const editing=!!this._optionsStep;
    const fingerprint=JSON.stringify([editing?'editing':model.ready,editing?null:model.rooms,
      editing?null:model.unavailable,editing?null:model.backendVersion,
      route.view,route.room,route.floor,[...this._feedback],
      this._optionsRevision,this._hass.user?.id,this._hass.user?.is_admin,this._hass.locale?.language||this._hass.language]);
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
      model.ready&&route.view==='rooms'&&model.rooms.length?(route.room?model.rooms.filter(r=>r.id===route.room).map(r=>r.id):[model.rooms[0].id]):[];
    this.renderContext(ids);
  }
  renderContext(ids){
    const host=this.shadowRoot.querySelector?.('[data-mm-context]');
    if(!host)return;
    const roomRows=rhiMmRooms(this._hass).rooms||[];
    const current=this.currentRoute();
    const scopedRows=current.view==='devices'?roomRows:roomRows.filter(r=>ids.includes(r.id));
    const allowedDestinations=scopedRows.flatMap(r=>r.devices)
      .filter(d=>d.foundation_approved)
      .flatMap(d=>d.notification_destinations||[]);
    const destination=allowedDestinations.find(d=>d.endpoint_id===this._destinationSelection);
    if(this._destinationSelection&&!destination)this._destinationSelection=null;
    if(destination&&this._hass.user?.is_admin&&this._hass.services?.rhi_notifications?.get_rules){
      const key=JSON.stringify(['destination',destination.endpoint_id,this._hass.user.id,this._hass.locale?.language||this._hass.language]);
      if(this._contextKey!==key){
        this._contextKey=key;this._contextIdentity=key;this._contextCards=[];
        host.innerHTML=`<section class="mm-surface mm-context"><h3>${this.t('notifications')} · ${rhiUxEscape(destination.name)}</h3>
          <button type="button" class="mm-link" data-notification-destination="">${this.t('collapse')}</button>
          <div data-mm-destination></div></section>`;
        this.mountCoreCard(host.querySelector('[data-mm-destination]'),{
          tag:'rhi-notifications-card',config:{destination_endpoint_id:destination.endpoint_id,embedded:true}},{});
      }
      for(const card of this._contextCards)card.hass=this._hass;
      return;
    }
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
  hero(view){
    const group=view==='overview'||view==='rooms'?'multimedia':view==='activities'?'activities':'insights';
    const hero=rhiUxPageHero({
      title:this.t(view==='overview'?'overview_title':view),
      description:this.t('hero_'+view),
      image:rhiMmHeroAsset(group),
      imageAlt:this.t('hero_art_'+group),
    });
    const manage=this._hass.user?.is_admin?
      `<div class="mm-hero-actions">
        <button type="button" class="mm-hero-settings" data-mm-option-action="yaml"
          title="${rhiUxEscape(this.t('setup_expert_yaml_all'))}">${rhiUxEscape(this.t('setup_expert_yaml_all'))}
          <ha-icon icon="mdi:code-tags"></ha-icon></button>
        <a href="/config/integrations/integration/rhi_multimedia" class="mm-hero-settings"
          title="${rhiUxEscape(this.t('manage'))}">${rhiUxEscape(this.t('settings'))}
          <ha-icon icon="mdi:cog-outline"></ha-icon></a></div>`:'';
    return `<div class="mm-hero-frame">${hero}${manage}</div>`;
  }
  unavailable(model){return `<section class="mm-callout mm-attention"><ha-icon icon="mdi:connection"></ha-icon><div><b>${this.t('not_ready')}</b><p>${rhiUxEscape(model.reason)}</p><p>${this.t('setup_help')}</p></div></section>`;}
  feedback(roomId){const feedback=this._feedback.get(roomId);return feedback?rhiUxWriteFeedback(feedback):'';}
  renderPage(model,view,roomId) {
    const hero=this.hero(view);
    if(!model.ready){
      // A first-time installer must be able to reach the authoritative
      // Options Flow even before any room sensor exists.
      const firstSetup=view==='activities'&&this._hass?.user?.is_admin?
        this.activities({rooms:[]}):'';
      const editor=!['activities','devices'].includes(view)?this.renderOptionsEditor():'';
      return rhiUxPageTemplate({hero,content:editor+this.unavailable(model)+firstSetup});
    }
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
    const editor=!['activities','devices'].includes(view)?this.renderOptionsEditor():'';
    return rhiUxPageTemplate({hero,status,content:editor+(model.unavailable?`<p role="status" class="mm-room-error">${this.t('partial_rooms')}</p>`:'')+content(),className:'mm-page'});
  }
  overview(model){
    // Floors are published by the Multimedia backend from HA registries, not
    // guessed from room names or frontend entity scans. Missing means unassigned.
    const floors=[...new Map(model.rooms.filter(r=>r.floor_id&&r.floor_name)
      .map(r=>[r.floor_id,r.floor_name])).entries()]
      .sort((a,b)=>a[1].localeCompare(b[1]));
    const selected=floors.some(([id])=>id===this._floor)?this._floor:'';
    const visible=selected?model.rooms.filter(r=>r.floor_id===selected):model.rooms;
    const buttons=floors.length?
      `<nav class="mm-floor-nav" aria-label="${rhiUxEscape(this.t('floor_navigation'))}">
      <button type="button" data-floor="" aria-pressed="${!selected}" class="${!selected?'active':''}">${rhiUxEscape(this.t('all_floors'))}</button>
      ${floors.map(([id,name])=>`<button type="button" data-floor="${rhiUxEscape(id)}" aria-pressed="${selected===id}" class="${selected===id?'active':''}"><ha-icon icon="mdi:layers-outline"></ha-icon>${rhiUxEscape(name)}</button>`).join('')}</nav>`:'';
    return `<section class="mm-section mm-overview"><div class="mm-heading">
      <div><h2>${this.t('rooms_activities')}</h2><p>${this.t('compact_room_help')}</p></div>
      <button class="mm-link" data-nav="rooms">${this.t('all_rooms')} <ha-icon icon="mdi:chevron-right"></ha-icon></button>
      </div>${buttons}${model.rooms.length?`<div class="mm-room-stack">${visible.length?
        visible.map(room=>this.roomCard(room,true)).join(''):
        rhiUxState({state:'empty',title:this.t('no_floor_rooms'),detail:this.t('choose_other_floor')})}</div>`:
        rhiUxState({state:'empty',title:this.t('no_rooms'),detail:this.t('create_room')})}</section>`;
  }

  compactRoomCard(room){
    const escape=rhiUxEscape;
    const delegated=room.control_owner==='harmony';
    const devices=room.devices||[];
    const online=devices.filter(d=>d.available&&d.foundation_approved).length;
    const total=devices.length;
    const degraded=online<total;
    const status=room.attention||degraded?'warn':room.phase==='active'?'good':room.phase==='idle'?'idle':'neutral';
    const key='room:'+room.id;
    const current=delegated?(room.harmony_activity||this.t('harmony_unavailable')):
      (room.activity_name||this.t('no_activity'));
    const location=[room.floor_name,room.area_name].filter(Boolean).join(' · ');
    const warning=room.attention?this.t('room_attention_detail'):
      degraded?this.t('device_unavailable'):'';
    const recommendation=room.attention&&room.recommended_action?
      this.t('recommend_'+room.recommended_action):'';
    const actions=(delegated?[]:room.activities).map(a=>`<button type="button" class="mm-activity ${a.active?'active':''}"
      data-action="start_activity" data-room="${escape(room.id)}" data-activity="${escape(a.id)}"
      aria-pressed="${!!a.active}" ${!rhiMmCanRun(room,'start_activity',a.id)?'disabled':''}
      title="${escape(a.disabled_reason||'')}"><ha-icon icon="${rhiMmActivityIcon(a.id)}"></ha-icon>${escape(a.name)}</button>`).join('');
    const devicePreview=devices.map(d=>`<span class="mm-compact-device ${d.available&&d.foundation_approved?'':'mm-compact-device-warn'}"
        title="${escape(d.name+': '+rhiMmStateLabel(this._hass,d.state))}"><ha-icon icon="${d.role==='display'?'mdi:television':d.role==='receiver'?'mdi:audio-video':'mdi:play-circle-outline'}"></ha-icon>${escape(d.name)} <small>${escape(rhiMmStateLabel(this._hass,d.state))}</small></span>`).join('');
    const foot=`<div class="mm-room-foot">
       ${!delegated&&(room.activities.length||rhiMmCanRun(room,'stop_activity'))?
         `<button data-action="stop_activity" data-room="${escape(room.id)}" ${!rhiMmCanRun(room,'stop_activity')?'disabled':''}><ha-icon icon="mdi:stop-circle-outline"></ha-icon>${this.t('stop_activity')}</button>`:''}
       ${rhiMmCanRun(room,'recover_activity')?
         `<button data-action="recover_activity" data-room="${escape(room.id)}"><ha-icon icon="mdi:restore"></ha-icon>${this.t('recover')}</button>`:''}
       <button class="mm-link" data-nav="rooms" data-room="${escape(room.id)}">${this.t('details')} <ha-icon icon="mdi:chevron-right"></ha-icon></button></div>`;
    const media=room.now_playing?.title?`<div class="mm-nowplaying"><ha-icon icon="mdi:music-note"></ha-icon>
      <span>${escape(rhiMmMediaSubtitle(room,this._hass))}</span></div>`:'';
    const controls=delegated?`<p class="mm-muted">${this.t('harmony_scope')}</p>`:
      `<div class="mm-controls">${actions||`<span class="mm-muted">${this.t('no_activities')}</span>`}</div>`;
    return `<details data-persist="${escape(key)}" class="mm-compact-room ${room.attention?'mm-room-needs-attention':''}" ${this._expanded.has(key)?'open':''}>
      <summary class="mm-compact-summary">
        ${rhiMmDeviceArt(devices.find(d=>d.role==='display')||devices.find(d=>d.role==='receiver')||devices[0],this.t('illustrative_device_art'),'card')}
        <span class="mm-compact-identity"><b>${escape(room.name)}</b>
          <small>${escape(location||this.t('room'))}</small>
          <span class="mm-compact-current">${escape(current)}</span>
          ${warning?`<span class="mm-compact-warning" role="status">${escape(warning)}</span>`:''}
          ${recommendation?`<small class="mm-compact-recommendation">${escape(recommendation)}</small>`:''}</span>
        <span class="mm-phase mm-phase-${status}">${escape(!room.attention&&degraded?this.t('device_unavailable'):rhiMmRoomStatus(room,this._hass))}</span>
        <span class="mm-compact-count">${online}/${total} <ha-icon icon="mdi:devices"></ha-icon></span>
        <ha-icon class="mm-expand-icon" icon="mdi:chevron-down"></ha-icon>
      </summary>
      <div class="mm-compact-expanded">
        ${media}${controls}
        <div class="mm-compact-devices">${devicePreview}</div>
        ${foot}${this.feedback(room.id)}
        ${(room.error||room.warnings?.length)?`<details class="mm-compact-error"><summary>${escape(this.t('error_detail'))}</summary>
          <p class="mm-room-error">${escape([room.error,...(room.warnings||[])].filter(Boolean).join(' · '))}</p></details>`:''}
      </div>
    </details>
    <button class="mm-link mm-room-operate" type="button" data-nav="rooms" data-room="${escape(room.id)}">${this.t('room_control')} · ${escape(room.name)} <ha-icon icon="mdi:chevron-right"></ha-icon></button>`;
  }

  roomCard(room,quick=false){
    if(quick)return this.compactRoomCard(room);
    const delegated=room.control_owner==='harmony';
    const buttons=(delegated?[]:room.activities).map(a=>`<button type="button" class="mm-activity ${a.active?'active':''}" aria-pressed="${!!a.active}" data-action="start_activity" data-room="${rhiUxEscape(room.id)}" data-activity="${rhiUxEscape(a.id)}" ${!rhiMmCanRun(room,'start_activity',a.id)?'disabled':''} title="${rhiUxEscape(a.disabled_reason||'')}"><ha-icon icon="${rhiMmActivityIcon(a.id)}"></ha-icon>${rhiUxEscape(a.name)}</button>`).join('');
    const media=room.now_playing?`<div class="mm-nowplaying"><ha-icon icon="mdi:music-note"></ha-icon><span>${rhiUxEscape(rhiMmMediaSubtitle(room,this._hass))}</span></div>`:'';
    const status=room.attention?'warn':room.phase==='active'?'good':room.phase==='idle'?'idle':'neutral';
    return `<article class="mm-room-card"><header class="mm-room-head"><span class="mm-room-glyph"><ha-icon icon="mdi:television-classic"></ha-icon></span><div><small>${this.t('room')}</small><h3>${rhiUxEscape(room.name)}</h3></div><span class="mm-phase mm-phase-${status}">${rhiUxEscape(rhiMmRoomStatus(room,this._hass))}</span></header>
      <div class="mm-room-current"><small>${this.t('activity')}</small><b>${rhiUxEscape(delegated?(room.harmony_activity||this.t('harmony_unavailable')):(room.activity_name||this.t('no_activity')))}</b>${room.progress?`<span>${rhiUxEscape(rhiMmRoomStatus(room,this._hass))}</span>`:''}</div>${media}
      <div class="mm-controls">${delegated?`<span class="mm-muted">${this.t('harmony_scope')}</span>`:buttons||`<span class="mm-muted">${this.t('no_activities')}</span>`}</div><div class="mm-room-foot">
      ${!delegated&&(room.activities.length||rhiMmCanRun(room,'stop_activity'))?`<button data-action="stop_activity" data-room="${rhiUxEscape(room.id)}" ${!rhiMmCanRun(room,'stop_activity')?'disabled':''}><ha-icon icon="mdi:power"></ha-icon> ${this.t('stop_activity')}</button>`:''}
      ${rhiMmCanRun(room,'recover_activity')?`<button data-action="recover_activity" data-room="${rhiUxEscape(room.id)}"><ha-icon icon="mdi:restore"></ha-icon> ${this.t('recover')}</button>`:''}
      <button class="mm-link" data-nav="rooms" data-room="${rhiUxEscape(room.id)}">${this.t('details')} <ha-icon icon="mdi:chevron-right"></ha-icon></button>
      </div>${quick?this.roomManualControls(room,true):''}${this.feedback(room.id)}${room.attention?`<p class="mm-room-error">${this.t('room_attention_detail')}</p>`:''}${(room.error||room.warnings?.length)?`<details><summary>${this.t('error_detail')}</summary>${rhiUxEscape([room.error,...(room.warnings||[])].filter(Boolean).join(' · '))}</details>`:''}</article>`;
  }
  rooms(model,roomId){
    if(!model.rooms.length)return rhiUxState({title:this.t('no_rooms'),detail:this.t('configure_room')});
    const selected=roomId?model.rooms.find(r=>r.id===roomId):model.rooms[0];
    const escape=rhiUxEscape;
    const picker=`<div class="mm-room-picker" role="group" aria-label="${this.t('room')}">${model.rooms.map(r=>`<button type="button" aria-pressed="${r.id===selected?.id}" class="${r.id===selected?.id?'active':''}" data-nav="rooms" data-room="${escape(r.id)}">${escape(r.name)}<small>${escape(rhiMmRoomStatus(r,this._hass))}</small></button>`).join('')}</div>`;
    if(!selected)return `<section class="mm-section">${picker}${rhiUxState({state:'unavailable',title:this.t('unavailable'),detail:this.t('configure_room')})}</section>`;
    return `<section class="mm-section"><div class="mm-heading"><div><h2>${this.t('room_control')}</h2></div></div>
      ${picker}
      <div class="mm-room-location">${escape([selected.floor_name,selected.area_name].filter(Boolean).join(' · '))}</div>
      ${this.roomCard(selected)}
      ${this.roomFocusedRemote(selected)}
      ${this.roomNowPlaying(selected)}
      ${this.roomContextConfiguration(selected)}
      <details class="mm-surface" data-persist="${escape(selected.id+':devices')}" ${this._expanded.has(selected.id+':devices')?'open':''}>
        <summary>${this.t('connected_devices')}</summary>
        ${this.roomDeviceDetails(selected)}${this.roomManualControls(selected)}${this.roomRoutes(selected)}
      </details>
      </section>`;
  }
  roomContextConfiguration(room){
    if(!this._hass?.user?.is_admin)return '';
    const e=rhiUxEscape,attr=`data-mm-option-room="${e(room.id)}"`;
    const active=room.activities.find(a=>a.id===room.activity_id);
    return `<details class="mm-surface mm-context-settings" data-persist="${e(room.id+':settings')}" ${this._expanded.has(room.id+':settings')?'open':''}>
      <summary>${this.t('settings')} · ${e(room.name)}</summary>
      <div class="mm-setup-actions">
        <button type="button" ${attr} data-mm-option-action="edit_room">${this.t('setup_edit_devices')}</button>
        <button type="button" ${attr} data-mm-option-action="add_activity">${this.t('setup_add_activity')}</button>
        ${active?`<button type="button" ${attr} data-mm-option-action="quick_edit_activity" data-mm-option-activity="${e(active.id)}">${this.t('setup_edit_activity')}</button>`:''}
        <button type="button" ${attr} data-mm-option-action="rename_room">${this.t('setup_edit_location')}</button>
        <button type="button" ${attr} data-mm-option-action="cec_device">${this.t('setup_cec_devices')}</button>
        <button type="button" ${attr} data-mm-option-action="tv_wake">${this.t('setup_tv_wake')}</button>
        <button type="button" ${attr} data-mm-option-action="harmony_owner">${this.t('setup_harmony_owner')}</button>
        <button type="button" ${attr} data-mm-option-action="speech_endpoint">${this.t('setup_speech_endpoint')}</button>
        ${active?`<button type="button" ${attr} data-mm-option-action="edit_activity" data-mm-option-activity="${e(active.id)}">${this.t('setup_edit_cast')}</button>
          <button type="button" ${attr} data-mm-option-action="cec_activity" data-mm-option-activity="${e(active.id)}">${this.t('setup_cec_activity')}</button>`:''}
        <button type="button" ${attr} data-mm-option-action="expert_yaml" data-mm-option-scope="room">${this.t('setup_expert_yaml')}</button>
        ${active?`<button type="button" ${attr} data-mm-option-action="expert_yaml" data-mm-option-scope="activity" data-mm-option-id="${e(active.id)}">${e(active.name)} · ${this.t('setup_expert_yaml')}</button>`:''}
        ${room.devices.map(d=>`<button type="button" ${attr} data-mm-option-action="expert_yaml" data-mm-option-scope="device" data-mm-option-id="${e(d.key)}">${e(d.name)} · ${this.t('setup_expert_yaml')}</button>`).join('')}
      </div></details>`;
  }
  roomFocusedRemote(room){
    // Presentation only: choose within the published activity cast. Multiple
    // equally applicable endpoints require explicit resident selection.
    const active=room.activities.find(a=>a.id===room.activity_id&&a.active);
    const cast=active?new Set(active.device_keys||[]):null;
    const devices=room.devices.filter(d=>d.foundation_approved&&
      Object.keys(d.controls||{}).length&&
      (room.control_owner==='harmony'?d.key===room.harmony_controller:
        !d.external_owner&&(!cast||cast.has(d.key))));
    const navigation=devices.filter(d=>d.controls.remote_key?.enabled);
    const players=navigation.filter(d=>d.role==='player');
    const candidates=players.length?players:navigation.length?navigation:
      devices.filter(d=>Object.entries(d.controls).some(([action,cap])=>cap.enabled&&['play','pause','previous','next','harmony_activity','power_on','power_off'].includes(action)));
    const selectionKey=room.id+':'+(active?.id||'manual');
    const requested=this._remoteSelections.get(selectionKey);
    const target=candidates.find(d=>d.key===requested)||(candidates.length===1?candidates[0]:null);
    const audio=devices.filter(d=>d.controls.volume?.enabled||d.controls.volume_up?.enabled||d.controls.volume_down?.enabled||d.controls.mute?.enabled);
    const receivers=audio.filter(d=>d.role==='receiver');
    const audioChoices=receivers.length?receivers:audio;
    const audioTarget=audioChoices.length===1?audioChoices[0]:null;
    const e=rhiUxEscape;
    const buttons=candidates.length>1?`<div class="mm-room-picker" role="group" aria-label="${this.t('remote_keys')}">${candidates.map(d=>`<button type="button" data-remote-focus="${e(d.key)}" data-room="${e(room.id)}" aria-pressed="${target?.key===d.key}">${e(d.name)}</button>`).join('')}</div>`:'';
    const primary=target?this.roomManualControls({...room,devices:[target]},true,true,
      audioTarget&&audioTarget.key!==target.key?'primary':'all'):'';
    const audioPanel=audioTarget&&audioTarget.key!==target?.key?
      this.roomManualControls({...room,devices:[audioTarget]},true,true,'audio'):'';
    const missing=!primary&&!audioPanel?rhiUxState({state:'unavailable',title:this.t('device_controls'),detail:this.t('select')}):'';
    return `<article class="mm-surface mm-focused-remote" data-remote-room="${e(room.id)}">
      <div class="mm-heading"><h3>${this.t('remote_keys')} · ${e(room.name)}</h3></div>
      ${buttons}${primary}${audioPanel}${missing}
      </article>`;
  }
  roomNowPlaying(room){const media=room.now_playing;return `<article class="mm-surface"><h3>${this.t('now_playing')}</h3>${media?`<div class="mm-media-detail">${media.picture?`<img alt="${this.t('media_artwork')}" src="${rhiUxEscape(media.picture)}">`:''}<div><b>${rhiUxEscape(media.title||this.t('playing'))}</b><p>${rhiUxEscape(media.artist||this.t('artist_unknown'))}</p><small>${rhiUxEscape(media.album||'')}</small></div></div>`:rhiUxState({state:'unavailable',title:this.t('no_playback'),detail:this.t('playback_help')})}${room.audio?`<div class="mm-audio-readback"><ha-icon icon="mdi:volume-high"></ha-icon><span>${rhiUxEscape(room.audio.name)}: ${room.audio.volume_level===null?this.t('volume_unknown'):`${Math.round(room.audio.volume_level*100)}%`}</span></div>`:''}</article>`;}
  roomManualControls(room,quick=false,focused=false,part='all'){
    const labels=Object.fromEntries(Object.entries({power_on:'on',power_off:'off',volume_down:'volume_down',volume_up:'volume_up',play:'play',pause:'pause',stop:'stop',previous:'previous',next:'next',source:'input',sound_mode:'sound_mode',volume:'volume',mute:'mute',join_group:'add_player',unjoin_group:'leave_group',harmony_activity:'harmony_activity'}).map(([action,key])=>[action,this.t(key)]));
    const escape=rhiUxEscape;
    const devices=room.devices.filter(d=>Object.keys(d.controls||{}).length&&
      (room.control_owner!=='harmony'||d.key===room.harmony_controller));
    const quickKeys=new Set([room.harmony_controller,room.audio?.device_key,room.now_playing?.device_key,devices.find(d=>d.role==='display')?.key,devices.find(d=>d.role==='player')?.key]);
    if(quick&&!room.activities.length&&devices.length&&!devices.some(d=>quickKeys.has(d.key)))quickKeys.add(devices[0].key);
    if(!devices.length)return '';
    const body=devices.filter(d=>focused||!quick||quickKeys.has(d.key)).map(d=>{
      const c=d.controls, attrs=`data-room="${escape(room.id)}" data-device="${escape(d.key)}"`;
      const disabled=cap=>cap.enabled?'':`disabled title="${escape(cap.reason||this.t('unavailable'))}"`;
      const button=(action,label,value)=>c[action]?`<button type="button" ${attrs} data-device-action="${action}" ${value===undefined?'':`data-value="${escape(JSON.stringify(value))}"`} ${disabled(c[action])}>${escape(label)}</button>`:'';
      const options=(action,current)=>c[action]?`<label>${labels[action]}<select ${attrs} data-device-input="${action}" ${disabled(c[action])}><option value="">${escape(current||this.t('select'))}</option>${c[action].options.map(v=>`<option value="${escape(v)}" ${v===current?'selected':''}>${escape(c[action].option_labels?.[v]||v)}</option>`).join('')}</select></label>`:'';
      const actions=focused?(part==='audio'?['volume_down','volume_up']:['power_on','power_off','previous','play','pause','stop','next',...(part==='all'?['volume_down','volume_up']:[])]):
        quick?['power_on','power_off','play','pause',...(!c.volume?['volume_down','volume_up']:[])]:['power_on','power_off','volume_down','volume_up','previous','play','pause','stop','next'];
      const buttons=actions.map(action=>button(action,labels[action])).join('');
      const volume=part!=='primary'&&c.volume&&typeof d.volume_level==='number'?`<label>${this.t('volume')} ${Math.round(d.volume_level*100)}%<input type="range" min="0" max="1" step="0.01" value="${d.volume_level}" ${attrs} data-device-input="volume" ${disabled(c.volume)}></label>`:'';
      const mute=part!=='primary'&&typeof d.is_volume_muted==='boolean'?button('mute',d.is_volume_muted?this.t('unmute'):this.t('mute'),!d.is_volume_muted):'';
      const remote=part!=='audio'&&c.remote_key?(()=>{
        const sections=rhiMmRemoteGroups(c.remote_key.options);
        const key=room.id+':'+d.key+':remote';
        const renderKey=k=>button('remote_key',
            k==='ENTER'||k==='select'||k==='ok'||k==='DPAD_CENTER'?'OK':k.startsWith('DPAD_')?k.slice(5):k,k);
        const main=sections.find(s=>s.name==='navigation');
        const position=k=>{
          const name=(k.startsWith('DPAD_')?k.slice(5):k).toLowerCase();
          return ['up','down','left','right'].includes(name)?name:
            ['enter','select','ok','center'].includes(name)?'ok':'extra';
        };
        const navigation=main?`<div class="mm-remote-navigation" role="group" aria-label="${this.t('remote_navigation')}">${main.keys.map(k=>`<span class="mm-remote-key mm-remote-key-${escape(position(k))}">${renderKey(k)}</span>`).join('')}</div>`:'';
        const extra=sections.filter(s=>s.name!=='navigation').map(section=>{
          const persist=key+':'+section.name;
          return `<details data-persist="${escape(persist)}" ${this._expanded.has(persist)?'open':''}><summary>${this.t('remote_'+section.name)}</summary><div class="mm-native-buttons">${section.keys.map(renderKey).join('')}</div></details>`;
        }).join('');
        if(focused){
          const direct=sections.find(section=>section.name==='media');
          const advanced=sections.filter(section=>section.name!=='navigation'&&section.name!=='media').map(section=>{
            const persist=key+':'+section.name;
            return `<details data-persist="${escape(persist)}" ${this._expanded.has(persist)?'open':''}><summary>${this.t('remote_'+section.name)}</summary><div class="mm-native-buttons">${section.keys.map(renderKey).join('')}</div></details>`;
          }).join('');
          return `${navigation}${direct?`<div class="mm-native-buttons" role="group" aria-label="${this.t('remote_media')}">${direct.keys.map(renderKey).join('')}</div>`:''}${advanced}`;
        }
        return `<details class="mm-remote" data-persist="${escape(key)}" ${this._expanded.has(key)?'open':''}><summary>${this.t('remote_keys')}</summary>${navigation}${extra}</details>`;
      })():'';
      return `<div class="mm-native-device"><b>${escape(d.name)}</b><small>${escape(rhiMmStateLabel(this._hass,d.state))}${d.shared?' · '+this.t('shared_source'):''}${d.group_members?.length>1?' · '+this.t('grouped')+' ('+d.group_members.length+' '+this.t('players')+')':''}</small><div class="mm-native-buttons">${buttons}${mute}</div>${volume}${part==='audio'?'':options('harmony_activity',d.current_activity)}${focused?(part==='audio'?'':remote):quick?(room.activities.length?'':options('source',d.source)+options('sound_mode',d.sound_mode)+remote):options('source',d.source)+options('sound_mode',d.sound_mode)+options('join_group',null)+button('unjoin_group',labels.unjoin_group)+remote}${!quick?Object.entries(c).filter(([,cap])=>!cap.enabled&&cap.reason).map(([action,cap])=>`<small>${escape(labels[action]||action)}: ${escape(cap.reason)}</small>`).join(''):''}</div>`;
    }).join('');
    if(!body)return '';
    return quick?`<div class="mm-quick-controls">${body}</div>`:
      `<details class="mm-surface mm-native-fold" data-persist="${escape(room.id+':controls')}"
        ${this._expanded.has(room.id+':controls')?'open':''}>
        <summary>${this.t('device_controls')}</summary>
        <div class="mm-native-controls">${body}</div>
      </details>`;
  }
  productSpecifications(device){
    if(device.foundation_approved!==true||device.product_profile?.identity_evidence!=='exact_native_ha_device_registry')return '';
    const specs=device.product_profile.characteristics||{};
    const keys=['screen_inches','panel','resolution','amplified_channels','subwoofer_outputs','hdmi_inputs','hdmi_outputs','touch_points'];
    const rows=keys.filter(k=>typeof specs[k]==='string'||Number.isFinite(specs[k]));
    if(!rows.length)return '';
    return `<div class="mm-product-specs"><small><b>${this.t('product_specs')}</b></small>${rows.map(k=>`<small>${this.t('spec_'+k)}: ${rhiUxEscape(typeof specs[k]==='number'?new Intl.NumberFormat(this._hass?.locale?.language||'en').format(specs[k]):specs[k])}</small>`).join('')}</div>`;
  }
  roomAvailableControls(device){
    const labels={power_on:'on',power_off:'off',source:'input',volume:'volume',volume_up:'volume_up',volume_down:'volume_down',mute:'mute',play:'play',pause:'pause',stop:'stop',next:'next',previous:'previous',remote_key:'remote_keys',sound_mode:'sound_mode',join_group:'add_player',unjoin_group:'leave_group',harmony_activity:'harmony_activity'};
    const capabilities=Object.entries(device.controls||{}).filter(([key,value])=>device.foundation_approved&&value?.enabled&&labels[key]).map(([key])=>this.t(labels[key]));
    return capabilities.length?`<small>${this.t('available_room_controls')}: ${rhiUxEscape(capabilities.join(' · '))}</small>`:'';
  }
  deviceNotificationActions(device){
    if(!this._hass?.user?.is_admin||!this._hass?.services?.rhi_notifications?.get_rules||
       !device.foundation_approved)return '';
    return (device.notification_destinations||[]).filter(d=>typeof d.endpoint_id==='string'&&d.endpoint_id.startsWith('ha_notify:'))
      .map(d=>`<button class="mm-link" type="button" data-notification-destination="${rhiUxEscape(d.endpoint_id)}">${this.t('notifications')} · ${rhiUxEscape(d.name)}${d.available?'':' · '+this.t('unavailable')}</button>`).join('');
  }
  roomDeviceDetails(room){return `<article class="mm-surface"><h3>${this.t('connected_devices')}</h3><div class="mm-device-list">${room.devices.map(d=>`<div class="mm-device-row">${rhiMmDeviceArt(d,this.t('illustrative_device_art'))}<div><b>${rhiUxEscape(d.name)}</b>${d.product_profile?`<small>${this.t('verified_model')}: ${rhiUxEscape(d.product_profile.manufacturer)} ${rhiUxEscape(d.product_profile.model)}</small>`:''}<small>${rhiUxEscape(rhiMmRoleLabel(this._hass,d.role))} · ${rhiUxEscape(d.source||rhiMmStateLabel(this._hass,d.state))}${d.shared?' · '+this.t('shared_source'):''}${d.group_members?.length>1?' · '+this.t('grouped')+' ('+d.group_members.length+' '+this.t('players')+')':''}</small>${d.registered_location?.area_id?`<small>${this.t('native_area')}: ${rhiUxEscape(d.registered_location.area_name||d.registered_location.area_id)}${d.registered_location.area_id!==room.area_id?` · ${this.t('used_in')}: ${rhiUxEscape(room.name)}`:''}</small>`:''}${this.roomAvailableControls(d)}${this.deviceNotificationActions(d)}</div><span class="mm-phase ${d.available&&d.foundation_approved?'mm-phase-good':'mm-phase-warn'}">${d.available&&d.foundation_approved?this.t('connected'):this.t('attention')}</span>${d.external_owner?'':`<button title="${this.t('native_device')}" data-more-info="${rhiUxEscape(d.entity_id)}"><ha-icon icon="mdi:open-in-new"></ha-icon></button>`}</div>`).join('')}</div></article>`;}
  roomRoutes(room){
    const cec=room.activities.flatMap(activity=>(activity.cec_links||[]).map(link=>{
      const source=room.devices.find(d=>d.key===link.source)?.name||link.source;
      const target=room.devices.find(d=>d.key===link.target)?.name||link.target;
      return `<div class="mm-route"><b>${rhiUxEscape(activity.name)} · ${this.t('cec_activity')}</b>
        <span>${rhiUxEscape(source)} → ${rhiUxEscape(target)} · ${this.t('cec_skips')}:
        ${rhiUxEscape(link.skipped.join(', '))}</span></div>`;
    }));
    const steps=room.activities.flatMap(a=>a.routes.map(r=>({...r,activity:a.name})));return `<article class="mm-surface"><h3>${this.t('routes')}</h3>${steps.length||cec.length?`<div class="mm-device-list">${cec.join('')}${steps.map(r=>`<div class="mm-route"><b>${rhiUxEscape(r.activity)}</b><span>${rhiUxEscape(r.type)} · ${rhiUxEscape(r.target||r.selected||this.t('not_published'))}${r.status?` · ${rhiUxEscape(r.status)}`:''}</span></div>`).join('')}</div>`:rhiUxState({state:'empty',title:this.t('no_routes'),detail:this.t('route_help')})}</article>`;}
  activities(model){
    // This is a configuration map, never a second activity executor. The
    // native Multimedia Options Flow remains the sole atomic config writer.
    const manage=this._hass.user?.is_admin;
    const cards=model.rooms.map(room=>{
      const devices=room.devices||[];
      const activities=room.activities||[];
      const location=[room.floor_name,room.area_name].filter(Boolean).join(' · ');
      const deviceSummary=`${devices.length} ${this.t('setup_devices').toLowerCase()}`;
      const items=activities.map(activity=>{
        const cast=(activity.device_keys||[]).map(key=>devices.find(d=>d.key===key)?.name||key);
        const routes=(activity.routes||[]).map(route=>{
          const device=devices.find(d=>d.key===route.device_key);
          return `${device?.name||route.device_key}: ${route.selected||this.t('not_published')}${route.status&&route.status!=='confirmed'?' ('+route.status+')':''}`;
        });
        const images=(activity.device_keys||[]).map(key=>devices.find(d=>d.key===key))
          .filter(Boolean).slice(0,4).map(device=>rhiMmDeviceArt(device,this.t('illustrative_device_art'))).join('');
        return `<div class="mm-setup-activity">
            <div class="mm-activity-identity"><div><b>${rhiUxEscape(activity.name)}</b>
            <small>${rhiUxEscape(cast.join(' · ')||this.t('setup_devices'))}</small></div>
            ${images?`<div class="mm-activity-visuals">${images}</div>`:''}</div>
            ${activity.device_keys?.length&&!activity.device_keys.some(key=>devices.find(d=>d.key===key)?.role==='player')?
              `<small>${this.t('setup_native_route_only')}</small>`:''}
            ${routes.length?`<small>${rhiUxEscape(routes.join(' · '))}</small>`:''}
            ${activity.cec_links?.length?`<small>${this.t('cec_activity')}:
              ${rhiUxEscape(activity.cec_links.map(link=>link.source+' → '+link.target+' ('+link.skipped.join(', ')+')').join(' · '))}</small>`:''}
            ${!activity.available?`<small class="mm-setup-review">${rhiUxEscape(activity.disabled_reason||this.t('review'))}</small>`:''}
            ${manage?`<div class="mm-setup-actions">
              <button type="button" data-mm-option-action="quick_edit_activity" data-mm-option-room="${rhiUxEscape(room.id)}"
                data-mm-option-activity="${rhiUxEscape(activity.id)}">${this.t('setup_edit_activity')}</button>
              <details class="mm-setup-advanced"><summary>${this.t('setup_more_actions')}</summary>
                <button type="button" data-mm-option-action="edit_activity" data-mm-option-room="${rhiUxEscape(room.id)}"
                  data-mm-option-activity="${rhiUxEscape(activity.id)}">${this.t('setup_edit_cast')}</button>
                <button type="button" data-mm-option-action="cec_activity" data-mm-option-room="${rhiUxEscape(room.id)}"
                  data-mm-option-activity="${rhiUxEscape(activity.id)}">${this.t('setup_cec_activity')}</button>
                <button type="button" data-mm-option-action="expert_yaml" data-mm-option-scope="activity"
                  data-mm-option-room="${rhiUxEscape(room.id)}" data-mm-option-id="${rhiUxEscape(activity.id)}">${this.t('setup_expert_yaml')}</button>
                <button type="button" data-mm-option-action="remove_activity" data-mm-option-room="${rhiUxEscape(room.id)}"
                  data-mm-option-activity="${rhiUxEscape(activity.id)}">${this.t('setup_remove_activity')}</button>
              </details></div>`:''}
          </div>`;
      }).join('');
      return `<article class="mm-setup-room"><div class="mm-setup-head">
          <div><h3>${rhiUxEscape(room.name)}</h3>
            <small class="mm-setup-caption">${rhiUxEscape(location||deviceSummary)}</small></div>
          <span class="mm-phase mm-phase-${room.attention?'warn':'idle'}">${rhiUxEscape(rhiMmRoomStatus(room,this._hass))}</span>
        </div><div class="mm-setup-activities">${items||
          `<span class="mm-muted">${this.t('no_activities')}</span>`}</div>
        <details class="mm-setup-devices"><summary>${rhiUxEscape(deviceSummary)}</summary>
          <div class="mm-setup-device-list">${devices.map(d=>`<span class="mm-setup-device ${!d.available||!d.foundation_approved?'mm-setup-device-warn':''}">
            ${rhiMmDeviceArt(d,this.t('illustrative_device_art'))}
            <b>${rhiUxEscape(rhiMmRoleLabel(this._hass,d.role))}</b> ${rhiUxEscape(d.name)} <small>${rhiUxEscape(rhiMmStateLabel(this._hass,d.state))}</small>
            ${manage?`<button type="button" data-mm-option-action="expert_yaml"
              data-mm-option-scope="device" data-mm-option-room="${rhiUxEscape(room.id)}"
              data-mm-option-id="${rhiUxEscape(d.key)}">${this.t('setup_expert_yaml')}</button>`:''}</span>`).join('')}</div>
        </details>
        <div class="mm-setup-actions">
          ${manage?`<button type="button" data-mm-option-action="add_activity" data-mm-option-room="${rhiUxEscape(room.id)}">${this.t('setup_add_activity')}</button>
            <button type="button" data-mm-option-action="rename_room" data-mm-option-room="${rhiUxEscape(room.id)}">${this.t('setup_edit_location')}</button>
            <button type="button" data-mm-option-action="edit_room" data-mm-option-room="${rhiUxEscape(room.id)}">${this.t('setup_edit_devices')}</button>
            <details class="mm-setup-advanced"><summary>${this.t('setup_more_actions')}</summary>
              <button type="button" data-mm-option-action="cec_device" data-mm-option-room="${rhiUxEscape(room.id)}">${this.t('setup_cec_devices')}</button>
              <button type="button" data-mm-option-action="expert_yaml" data-mm-option-scope="room"
                data-mm-option-room="${rhiUxEscape(room.id)}">${this.t('setup_expert_yaml')}</button>
              <button type="button" data-mm-option-action="remove_room" data-mm-option-room="${rhiUxEscape(room.id)}">${this.t('setup_remove_room')}</button>
            </details>`:''}
          <button class="mm-link" type="button" data-nav="rooms" data-room="${rhiUxEscape(room.id)}">${this.t('setup_room_details')} <ha-icon icon="mdi:chevron-right"></ha-icon></button>
          ${manage?`<a href="/config/integrations/integration/rhi_multimedia">${this.t('setup_manage')} <ha-icon icon="mdi:cog-outline"></ha-icon></a>`:''}
        </div></article>`;
    }).join('');
    return `<section class="mm-section"><div class="mm-heading"><div><h2>${this.t('setup_rooms')}</h2>
      <p>${this.t('setup_help_short')}</p></div>
      ${manage?`<div class="mm-setup-actions"><button type="button" class="mm-link" data-mm-option-action="guided_activity">${this.t('setup_guided_activity')}</button>
        <button type="button" class="mm-link" data-mm-option-action="add_room">${this.t('setup_add_room')}</button></div>`:''}</div>
      ${this.renderOptionsEditor()}
      ${model.rooms.length?`<div class="mm-setup-grid">${cards}</div>`:
        rhiUxState({state:'empty',title:this.t('no_rooms'),detail:this.t('create_room')})}
      </section>`;
  }
  devices(model){
    // One visual asset row may serve several rooms. Expert edits must always
    // target an exact room + role key, never an ambiguous inferred source.
    const manage=this._hass?.user?.is_admin===true;
    const byAsset=new Map();
    for(const room of model.rooms)for(const device of room.devices){
      const id=(device.owner_domain||'rhi_multimedia')+':'+(device.asset_id||device.physical_id||device.entity_id);
      const existing=byAsset.get(id);
      const binding={room:room.id,key:device.key,location:room.name};
      if(existing){
        existing.rooms.add(room.name);existing.roles.add(device.role);
        existing.bindings.push(binding);
      }else byAsset.set(id,{...device,rooms:new Set([room.name]),
        roles:new Set([device.role]),bindings:[binding]});
    }
    const rows=[...byAsset.values()].map(device=>({...device,
      room:[...device.rooms].join(', '),role_label:[...device.roles].map(role=>rhiMmRoleLabel(this._hass,role)).join(', ') }));
    return `<section class="mm-section"><div class="mm-heading">
      <div><h2>${this.t('devices_roles')}</h2><p>${this.t('device_help')}</p></div>
      ${manage?`<div class="mm-setup-actions"><button type="button" class="mm-link" data-mm-option-action="add_room">${this.t('setup_add_room')}</button>
        ${model.rooms.length?`<button type="button" class="mm-link" data-mm-option-action="edit_room">${this.t('setup_edit_devices')}</button>`:''}</div>`:''}</div>
      ${manage?this.renderOptionsEditor():''}
      ${rows.length?`<div class="mm-device-table"><div class="mm-table-head">
        <span>${this.t('device')}</span><span>${this.t('role_room')}</span>
        <span>${this.t('native_state')}</span><span>Foundation</span></div>
        ${rows.map(d=>`<div class="mm-table-row">
          <div class="mm-table-asset">
            <div class="mm-device-identity">
              ${rhiMmDeviceArt(d,this.t('illustrative_device_art'))}
              <div><b>${rhiUxEscape(d.name)}</b>
                ${d.foundation_approved&&d.product_profile?.identity_evidence==='exact_native_ha_device_registry'
                  ?`<small>${rhiUxEscape(d.product_profile.manufacturer)} · ${rhiUxEscape(d.product_profile.model)}</small>`:''}
              </div>
            </div>
            ${(d.visual_ref&&d.visual?.presentation?.variants?.detail)||this.productSpecifications(d)?`
              <details class="mm-device-detail">
                <summary>${this.t('product_details')}</summary>
                <div class="mm-device-detail-content">
                  ${rhiMmDeviceArt(d,this.t('illustrative_device_art'),'detail')}
                  <div><strong>${rhiUxEscape(d.product_profile?.manufacturer||'')}
                    ${rhiUxEscape(d.product_profile?.model||'')}</strong>
                  ${d.visual_ref&&d.visual?.presentation?.variants?.detail?`<small>${this.t('illustrative_device_art')}</small>`:''}${this.productSpecifications(d)}</div>
                </div>
              </details>`:''}
            ${manage?`<details class="mm-setup-advanced">
              <summary>${this.t('setup_expert_yaml')}</summary>
              ${d.bindings.map(b=>`<button type="button" data-mm-option-action="expert_yaml"
                data-mm-option-scope="device" data-mm-option-room="${rhiUxEscape(b.room)}"
                data-mm-option-id="${rhiUxEscape(b.key)}">
                ${rhiUxEscape(b.location)} · ${rhiUxEscape(b.key)}</button>`).join('')}
              </details>`:''}${this.deviceNotificationActions(d)}</div>
          <span>${rhiUxEscape(d.role_label)} · ${rhiUxEscape(d.room)}</span>
          <span>${rhiUxEscape(rhiMmStateLabel(this._hass,d.state))}</span>
          <span>${d.foundation_approved?this.t('approved'):this.t('review')}</span>
        </div>`).join('')}</div>`:
        rhiUxState({state:'empty',title:this.t('no_devices'),detail:this.t('no_bound')})}
      </section>`;
  }
  diagnostics(model){
    // Insights projects real runtime facts only: no synthetic availability,
    // historical averages, latency or counters. Expose route readback and
    // actionable recovery using the existing typed backend command.
    const escape=rhiUxEscape;
    const cards=model.rooms.map(room=>{
      const devices=room.devices||[];
      const offline=devices.filter(d=>!d.available||!d.foundation_approved);
      const routes=(room.activities||[]).flatMap(activity=>
        (activity.routes||[]).map(route=>({activity:activity.name,route})));
      const routeRows=routes.map(({activity,route})=>{
        const device=devices.find(d=>d.key===route.device_key);
        const state=route.status||'unknown';
        const unclear=state!=='confirmed';
        return `<div class="mm-diag-route ${unclear?'mm-diag-route-review':''}">
          <b>${escape(activity)}</b><span>${escape(device?.name||route.device_key||this.t('unavailable'))} · ${escape(route.type)}:
          ${escape(route.target||route.selected||this.t('not_published'))}</span>
          <small>${escape(state)}${route.actual!=null?' · '+this.t('diag_actual')+': '+escape(route.actual):''}</small>
        </div>`;
      }).join('');
      const health=offline.map(d=>`<div class="mm-diag-route mm-diag-route-review">
        <b>${escape(d.name)}</b><span>${d.foundation_approved?this.t('diag_device_unavailable'):this.t('diag_not_selected')}</span>
        <small>${escape(d.state)}</small></div>`).join('');
      return `<article class="mm-surface">
        <h3>${escape(room.name)}</h3>
        <div class="mm-diag-status"><span>${this.t('phase')}</span><b>${escape(rhiMmRoomStatus(room,this._hass))}</b></div>
        <div class="mm-diag-status"><span>${this.t('approvals')}</span><b>${room.foundation_approved?this.t('valid'):this.t('review')}</b></div>
        <div class="mm-diag-status"><span>${this.t('confirmed_playback')}</span><b>${room.playing?this.t('playing'):this.t('not_confirmed')}</b></div>
        ${room.target_state?.targets?.length?`<details class="mm-diag-explain" data-persist="${escape(room.id+':target')}" ${this._expanded.has(room.id+':target')?'open':''}>
          <summary>${this.t('target_state')} · ${escape(room.target_state.status)}</summary>
          <div class="mm-diag-routes">${room.target_state.targets.map(t=>{
            const device=devices.find(d=>d.key===t.device_key);
            return `<div class="mm-diag-route ${t.status!=='observed'?'mm-diag-route-review':''}">
              <b>${escape(device?.name||t.device_key)}</b>
              <span>${escape(t.type)} · ${this.t('target_expected')}: ${escape(Array.isArray(t.expected)?t.expected.join(', '):t.expected)}</span>
              <small>${this.t('target_actual')}: ${escape(t.actual??this.t('not_published'))}
                · ${this.t(t.status==='observed'?'target_observed':'target_attention')}</small>
            </div>`;
          }).join('')}</div></details>`:''}
        ${room.last_attempt?`<div class="mm-diag-status"><span>${this.t('last_attempt')}</span><b>${escape(room.last_attempt.kind)} · ${escape(room.last_attempt.result)}</b></div>`:''}
        ${room.last_control?`<div class="mm-diag-status"><span>${this.t('last_control')}</span><b>${escape(room.last_control.action)} · ${escape(room.last_control.result)}</b></div>`:''}
        ${room.error?`<p class="mm-room-error">${escape(room.error)}</p>`:''}
        ${room.warnings?.length?`<p class="mm-room-error">${room.warnings.map(escape).join('; ')}</p>`:''}
        ${health?`<section class="mm-diag-explain"><h4>${this.t('diag_devices_attention')}</h4>${health}</section>`:''}
        ${routes.length?`<details class="mm-diag-explain" data-persist="${escape(room.id+':routes')}" ${this._expanded.has(room.id+':routes')?'open':''}>
          <summary>${this.t('routes')} (${routes.length})</summary>
          <div class="mm-diag-routes">${routeRows}</div></details>`:''}
        ${rhiMmCanRun(room,'recover_activity')?`<button type="button" class="mm-link mm-recover" data-room="${escape(room.id)}" data-action="recover_activity"><ha-icon icon="mdi:restore"></ha-icon>${this.t('recover')}</button>`:''}
        ${this.feedback(room.id)}
        <details data-persist="${escape(room.id)}:technical" ${this._expanded.has(room.id+':technical')?'open':''}>
          <summary>${this.t('technical')}</summary>
          <div class="mm-tech">${devices.map(d=>`<p><b>${escape(d.name)}</b>
              <small>${this.t('diag_asset_id')}: ${escape(d.asset_id||d.physical_id||this.t('not_published'))}</small>
              <small>visual_ref: ${escape(d.visual_ref||this.t('not_published'))}</small>
              <small>${this.t('cec_device')}: ${d.hdmi_cec_enabled?this.t('enabled'):this.t('not_confirmed')}</small>
              ${d.product_profile?`<small>${this.t('verified_model')}: ${escape(d.product_profile.profile_id)} · ${escape(d.product_profile.identity_evidence)}</small>`:''}
              <small>${this.t('diag_source')}: ${escape(d.entity_id)} · ${escape(d.native_device_id||this.t('not_published'))}</small>
              <small>${this.t('diag_provider')}: ${escape(d.source_integration||this.t('not_published'))}</small>
              <small>${this.t('native_features')}: ${escape(d.native_supported_features??this.t('not_published'))}</small>
              <small>${this.t('native_readback_at')}: ${escape(d.native_readback_at||this.t('not_published'))}</small>
              <small>${this.t('readback_quality')}: ${escape(this.t('readback_'+(d.native_readback_quality||'unapproved')))}</small>
              ${Object.entries(d.controls||{}).map(([action,cap])=>`<small>${escape(action)}:
                ${cap.enabled?this.t('diag_command_allowed'):this.t('diag_command_blocked')}
                ${cap.reason?' · '+escape(cap.reason):''}</small>`).join('')}</p>`).join('')}</div>
        </details>
      </article>`;
    }).join('');
    return `<section class="mm-section"><div class="mm-heading"><div><h2>${this.t('runtime_diagnostics')}</h2><p>${this.t('diag_help')}</p></div></div>
      <div class="mm-diag-grid">${cards}</div></section>`;
  }
}

if(!customElements.get('homebrain-multimedia-card'))customElements.define('homebrain-multimedia-card',HomeBrainMultimediaCard);
window.customCards=window.customCards||[];
if(!window.customCards.some(card=>card.type==='homebrain-multimedia-card'))window.customCards.push({type:'homebrain-multimedia-card',name:'Robotix Multimedia',description:'Premium room/activity dashboard using native Multimedia room status.',preview:false});
