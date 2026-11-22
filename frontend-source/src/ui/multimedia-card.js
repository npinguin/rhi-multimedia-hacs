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
  {id:'overview',label:'Overview',items:[{id:'overview',label:'Overview'}]},
  {id:'settings',label:'Settings',items:[{id:'settings',label:'Settings'}]},
  {id:'insights',label:'Insights',items:[{id:'insights',label:'Insights'}]},
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
  const raw=field?.selector?.select?.options??field?.options;
  if(!Array.isArray(raw))return [];
  return raw.map(o=>Array.isArray(o)?[o[0],o[1]??o[0]]:
    o&&typeof o==='object'?[o.value,o.label??o.value]:[o,o])
    .filter(([v])=>typeof v==='string');
}
function rhiMmOptionSupported(field){
  if(!field||typeof field.name!=='string')return false;
  // Real HA Options Flow schemas describe selectors WITHOUT a separate type.
  // Accept only the fields we can render faithfully; the backend validates
  // their values and is still the only configuration writer.
  if(field.selector!==undefined){
    const kinds=Object.keys(field.selector||{});
    if(kinds.length!==1)return false;
    return (kinds[0]==='text'&&field.selector.text!==null&&
            typeof field.selector.text==='object'&&field.selector.text.multiple!==true)||
      (kinds[0]==='select'&&rhiMmOptionPairs(field).length>0)||
      (kinds[0]==='boolean'&&typeof field.selector.boolean==='object')||
      (kinds[0]==='number'&&typeof field.selector.number==='object');
  }
  if(['string','boolean','integer','float'].includes(field.type))return true;
  return field.type==='select'&&rhiMmOptionPairs(field).length>0;
}
function rhiMmOptionDefaults(step){
  const values={};
  for(const field of step?.data_schema||[]){
    const suggestion=field?.description?.suggested_value;
    if(suggestion!==undefined&&suggestion!==null)values[field.name]=suggestion;
    else if(Object.prototype.hasOwnProperty.call(field,'default'))values[field.name]=field.default;
    else if(!field.required)continue; // No implicit write to optional native fields.
    else if(field.type==='boolean'||field.selector?.boolean)values[field.name]=false;
    else if(field.type==='string'||field.selector?.text)values[field.name]='';
    else if(field.type==='integer')values[field.name]=Number.isInteger(field.valueMin)?field.valueMin:0;
    else if(field.type==='float'||field.selector?.number)values[field.name]=0;
    else if(field.selector?.select?.multiple)values[field.name]=[];
    else if(field.type==='select'||field.selector?.select)values[field.name]=rhiMmOptionPairs(field)[0]?.[0];
  }
  return values;
}
class HomeBrainMultimediaCard extends HTMLElement {
  static getStubConfig() { return {type:'custom:homebrain-multimedia-card'}; }
  constructor() {
    super(); this.attachShadow({mode:'open'});
    this.config={}; this._hass=null; this._view=''; this._room='';
    this._lastSignature=''; this._feedback=new Map();
    this._expanded=new Set();this._remoteSelections=new Map();this._remoteTabs=new Map();
    this._settingsCategory='locations';this._settingsSelections=new Map();
    this._destinationSelection=null;this._contextSelections=new Map();this._contextKey='';this._contextCards=[];this._planSummary=null;this._planRequest=0;
    this._optionsStep=null;this._optionsData={};this._optionsBusy=false;
    this._optionsError='';this._optionsNotice='';this._optionsEpoch=0;this._optionsRevision=0;
    this._onLocation=()=>{
      if(!['settings','activities','devices'].includes(this.currentRoute().view)&&(this._optionsStep||this._optionsBusy)){
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
    const category=event.target?.closest?.('[data-mm-settings-category]');
    if(category){
      if(this._optionsStep||this._optionsBusy)await this.cancelOptions();
      const chosen=category.getAttribute('data-mm-settings-category');
      if(['locations','devices','activities'].includes(chosen)){
        this._settingsCategory=chosen;this._lastSignature='';this.render();
      }
      return;
    }
    const settingsPick=event.target?.closest?.('[data-mm-settings-pick]');
    if(settingsPick){
      // A selected object must never silently change beneath an open
      // native Options Flow transaction for a different configuration scope.
      // End the old transaction before showing the newly selected object.
      if(this._optionsStep||this._optionsBusy)await this.cancelOptions();
      this._settingsSelections.set(this._settingsCategory,settingsPick.getAttribute('data-mm-settings-pick'));
      this._lastSignature='';this.render();return;
    }
    const remoteTab=event.target?.closest?.('[data-remote-tab]');
    if(remoteTab){
      const room=remoteTab.getAttribute('data-room'),device=remoteTab.getAttribute('data-device');
      const tab=remoteTab.getAttribute('data-remote-tab');
      if(['buttons','numbers','text'].includes(tab)){
        this._remoteTabs.set(room+':'+device,tab);
        this._lastSignature='';this.render();
      }
      return;
    }
    const focus=event.target?.closest?.('[data-remote-focus]');
    if(focus){
      const id=focus.getAttribute('data-room'),key=focus.getAttribute('data-remote-focus');
      const route=this.currentRoute(),room=rhiMmRooms(this._hass).rooms?.find(r=>r.id===id);
      if(['rooms','overview'].includes(route.view)&&room&&(!route.room||route.room===room.id)&&room.devices.some(d=>d.key===key)){
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
      id:option.getAttribute('data-mm-option-id')||'',
      phase:option.getAttribute('data-mm-option-phase')||'',
      operation:option.getAttribute('data-mm-option-operation')||'',
      index:option.hasAttribute('data-mm-option-index')?
        Number(option.getAttribute('data-mm-option-index')):null,
      device:option.getAttribute('data-mm-option-device')||'',
      stepType:option.getAttribute('data-mm-option-type')||''});return;}
    const submitOption=event.target?.closest?.('[data-mm-option-submit]');
    if(submitOption){event.preventDefault();await this.submitOptions();return;}
    const cancelOption=event.target?.closest?.('[data-mm-option-cancel]');
    if(cancelOption){event.preventDefault();await this.cancelOptions();return;}
    const nav=event.target?.closest?.('[data-nav]');
    if(nav){event.preventDefault();if(this._optionsStep||this._optionsBusy)await this.cancelOptions();
      this.navigate(nav.getAttribute('data-nav'),nav.getAttribute('data-room')||'');return;}
    const more=event.target?.closest?.('[data-more-info]');
    if(more){event.preventDefault();const entityId=more.getAttribute('data-more-info');if(entityId)this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId},bubbles:true,composed:true}));return;}
    const shortcut=event.target?.closest?.('[data-mm-shortcut]');
    if(shortcut&&!shortcut.disabled){
      const room=shortcut.getAttribute('data-room');
      const kind=shortcut.getAttribute('data-mm-shortcut');
      const key=shortcut.getAttribute('data-shortcut-key');
      const contract=rhiMmRooms(this._hass);
      const record=contract.ready?contract.rooms.find(entry=>entry.id===room):null;
      await this.executeIntent(room,rhiMmShortcutIntent(record,kind,key),contract);
      return;
    }
    const sendText=event.target?.closest?.('[data-device-text-submit]');
    if(sendText && !sendText.disabled){
      const room=sendText.getAttribute('data-room'),device=sendText.getAttribute('data-device');
      const inputs=this.shadowRoot?.querySelectorAll?.('[data-device-text]')||[];
      const input=[...inputs].find(el=>el.getAttribute('data-room')===room&&
        el.getAttribute('data-device')===device);
      if(input && input.value.trim())await this.executeDevice(room,device,'remote_text',input.value);
      return;
    }
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
    const floor=event.target?.closest?.('[data-floor-select]');
    if(floor){this.navigate('overview','',floor.value);return;}
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
  async openOptions({action,room='',activity='',scope='',id='',
    phase='',operation='',index=null,device='',stepType=''}) {
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
      const step=await rhiMmOptionsBegin(this._hass,{
        action,room,activity,scope,id,phase,operation,index,device,stepType});
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
    const multiple=field.selector?.select?.multiple===true;
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
    if(field.selector?.text?.multiline===true){
      control=`<textarea ${attr} rows="12" spellcheck="false"
        class="mm-option-yaml" aria-label="${label}">${escape(value??'')}</textarea>`;
    }else if(field.type==='select'||field.selector?.select){
      control=`<select ${attr}>${pairs.map(([item,title])=>
        `<option value="${escape(item)}" ${value===item?'selected':''}>${escape(title)}</option>`).join('')}</select>`;
    }else if(field.type==='boolean'||field.selector?.boolean){
      control=`<input type="checkbox" ${attr} ${value===true?'checked':''}/>`;
    }else{
      const numeric=['integer','float'].includes(field.type)||!!field.selector?.number;
      control=`<input type="${numeric?'number':'text'}" ${attr}
        ${field.type==='integer'?'step="1"':numeric?'step="any"':''}
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
    const guidance=description||step?.description_placeholders?.note;
    return `<section class="mm-surface mm-options-editor" aria-live="polite" data-mm-flow-editor>
      <h3>${escape(label||this.t('setup_editor'))}</h3>
      ${guidance?`<p class="mm-options-description">${escape(guidance)}</p>`:''}
      ${base?`<p role="alert" class="mm-room-error">${escape(base)}</p>`:''}
      ${this._optionsNotice?`<p role="status">${escape(this._optionsNotice)}</p>`:''}
      ${step?.type==='form'?`<div class="mm-option-fields">
        ${(step.data_schema||[]).map(field=>this.optionInput(step,field)).join('')}</div>`:''}
      <div class="mm-setup-actions">
        ${step?`<button type="button" data-mm-option-submit ${this._optionsBusy||unsupported?'disabled':''}>${step.step_id==='review'?this.t('settings_save'):this.t('setup_continue')}</button>`:''}
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
      route.view,route.room,route.floor,[...this._feedback],this._settingsCategory,
      [...this._settingsSelections],[...this._remoteTabs],
      this._optionsRevision,this._hass.user?.id,this._hass.user?.is_admin,this._hass.locale?.language||this._hass.language]);
    // Keep independently mounted Core cards connected when media state changes.
    // Only replace the domain page, not the shared contextual editor.
    if(this._lastSignature!==fingerprint){
      this._lastSignature=fingerprint;
      const shell=rhiUxDomainShell({product:'Home Intelligence',domain:'MULTIMEDIA',modules:MM_MODULES.map(m=>({...m,label:this.t(m.id),items:m.items.map(i=>({...i,label:this.t(i.id),target:i.id}))})),activeModule:MM_MODULES.find(m=>m.items.some(i=>i.id===route.view))?.id||'overview',activeItem:route.view});
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
    const filtered=route.floor?model.rooms.filter(r=>route.floor==='__unassigned__'?!r.floor_id:r.floor_id===route.floor):model.rooms;
    const focused=filtered.find(r=>r.id===route.room)||filtered[0];
    const ids=model.ready&&route.view==='overview'?(focused?[focused.id]:[]):
      model.ready&&route.view==='activities'?model.rooms.map(r=>r.id):
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
    const group=view==='overview'||view==='rooms'?'multimedia':
      view==='settings'||view==='activities'?'activities':'insights';
    const hero=rhiUxPageHero({
      title:this.t(view==='overview'?'overview_title':view),
      description:this.t('hero_'+view),
      image:rhiMmHeroAsset(group),
      imageAlt:this.t('hero_art_'+group),
    });
    // Settings owns the single global YAML action; duplicate hero shortcuts
    // make everyday screens taller and obscure the resident's first action.
    return `<div class="mm-hero-frame">${hero}</div>`;
  }
  unavailable(model){return `<section class="mm-callout mm-attention"><ha-icon icon="mdi:connection"></ha-icon><div><b>${this.t('not_ready')}</b><p>${rhiUxEscape(model.reason)}</p><p>${this.t('setup_help')}</p></div></section>`;}
  feedback(roomId){const feedback=this._feedback.get(roomId);return feedback?rhiUxWriteFeedback(feedback):'';}
  renderPage(model,view,roomId) {
    const hero=this.hero(view);
    if(!model.ready){
      // A first-time installer must be able to reach the authoritative
      // Options Flow even before any room sensor exists.
      const firstSetup=view==='settings'&&this._hass?.user?.is_admin?
        this.settings({rooms:[]}):view==='activities'&&this._hass?.user?.is_admin?
        this.activities({rooms:[]}):'';
      const editor=!['activities','devices','settings'].includes(view)?this.renderOptionsEditor():'';
      return rhiUxPageTemplate({hero,content:editor+this.unavailable(model)+firstSetup});
    }
    // Object statuses belong beside the activity/device, not in a duplicate
    // top-level KPI strip occupying the resident's first viewport.
    const status='';
    const content={
      overview:()=>this.overview(model),rooms:()=>this.rooms(model,roomId),activities:()=>this.activities(model),
      settings:()=>this.settings(model),insights:()=>this.insights(model),
      devices:()=>this.devices(model),diagnostics:()=>this.diagnostics(model),
    }[view]||(()=>this.overview(model));
    const editor=!['activities','devices','settings'].includes(view)?this.renderOptionsEditor():'';
    return rhiUxPageTemplate({hero,status,content:editor+(model.unavailable?`<p role="status" class="mm-room-error">${this.t('partial_rooms')}</p>`:'')+content(),className:'mm-page'});
  }
  overview(model){
    // Exact HA floor/area registry values come from the domain backend.
    // A floor filters buttons; selecting a room never sends a command.
    const escape=rhiUxEscape;
    const floors=[...new Map(model.rooms.filter(r=>r.floor_id&&r.floor_name)
      .map(r=>[r.floor_id,r.floor_name])).entries()]
      .sort((a,b)=>a[1].localeCompare(b[1]));
    const hasUnassigned=model.rooms.some(r=>!r.floor_id);
    // Never show the whole house as room buttons when 7+ rooms span floors.
    // Prefer explicit URL selection, then an explicitly selected room, then
    // the most populated native floor. No guessed "Ground Floor" name.
    const validFloor=id=>floors.some(([key])=>key===id)||(id==='__unassigned__'&&hasUnassigned);
    const previous=model.rooms.find(r=>r.id===this._room);
    const firstFloor=[...floors].sort((a,b)=>
      model.rooms.filter(r=>r.floor_id===b[0]).length-
      model.rooms.filter(r=>r.floor_id===a[0]).length||
      a[1].localeCompare(b[1]))[0]?.[0];
    const floor=validFloor(this._floor)?this._floor:
      validFloor(previous?.floor_id)?previous.floor_id:
      previous&&!previous.floor_id?'__unassigned__':
      firstFloor||(hasUnassigned?'__unassigned__':'');
    const visible=floor==='__unassigned__'?model.rooms.filter(r=>!r.floor_id):
      floor?model.rooms.filter(r=>r.floor_id===floor):model.rooms;
    const room=visible.find(r=>r.id===this._room)||visible[0];
    const selector=`<label class="mm-floor-filter">${this.t('floor_navigation')}
      <select data-floor-select aria-label="${this.t('floor_navigation')}">
        ${floors.map(([id,name])=>`<option value="${escape(id)}" ${floor===id?'selected':''}>${escape(name)}</option>`).join('')}
        ${hasUnassigned?`<option value="__unassigned__" ${floor==='__unassigned__'?'selected':''}>${this.t('settings_unassigned')}</option>`:''}
      </select></label>`;
    const roomButtons=visible.map(r=>`<button type="button" data-nav="overview"
      data-room="${escape(r.id)}" class="${room?.id===r.id?'active':''}"
      aria-pressed="${room?.id===r.id}">${escape(r.name)}</button>`).join('');
    if(!room)return `<section class="mm-section mm-overview">
      <div class="mm-floor-room-select">${selector}<div class="mm-floor-room-buttons">${roomButtons}</div></div>
      ${rhiUxState({state:'empty',title:this.t('no_rooms'),detail:this.t('choose_other_floor')})}</section>`;
    const activities=room.control_owner==='harmony'?[]:[...(room.activities||[])]
      .sort((a,b)=>Number(b.active===true)-Number(a.active===true)||
        Number(b.favorite===true)-Number(a.favorite===true));
    const activityButtons=activities.map(a=>{
      const key=room.id+':activity:'+a.id;
      const linked=(a.device_keys||[]).map(deviceKey=>
        room.devices.find(device=>device.key===deviceKey)?.name||this.t('device_unavailable'));
      const targets=(a.target_state?.targets||[]).map(target=>{
        const device=room.devices.find(row=>row.key===target.device_key);
        const expected=Array.isArray(target.expected)?target.expected.join(', '):target.expected;
        return `<li><strong>${escape(device?.name||this.t('device_unavailable'))}</strong>
          <span>${this.t('settings_expected')}: ${escape(expected??this.t('not_published'))}</span>
          <span>${this.t('target_actual')}: ${escape(target.actual??this.t('not_published'))}</span></li>`;
      }).join('');
      const plan=(a.script_steps||[]).map(step=>{
        const name=room.devices.find(row=>row.key===step.device_key)?.name;
        return `<li>${escape(name||this.t('device_unavailable'))} ·
          ${escape(this.t('script_action_'+step.action))}
          ${step.value?` · ${escape(step.value)}`:''}</li>`;
      }).join('');
      const off=room.activity_id===a.id&&room.control_owner!=='harmony'?
        `<button type="button" class="mm-activity-off" data-action="stop_activity"
          data-room="${escape(room.id)}"
          aria-label="${escape(this.t('activity_off')+' · '+a.name)}"
          ${rhiMmCanRun(room,'stop_activity')?'':'disabled'}
          title="${escape(room.commands?.stop?.reason||'')}">
          <ha-icon icon="mdi:power"></ha-icon>${this.t('off')}</button>`:'';
      return `<div class="mm-cockpit-activity">
        <div class="mm-activity-primary">
        <button type="button" class="mm-activity ${a.active?'active':''}"
          data-action="start_activity" data-room="${escape(room.id)}" data-activity="${escape(a.id)}"
          aria-pressed="${a.active===true}" ${rhiMmCanRun(room,'start_activity',a.id)?'':'disabled'}>
          <ha-icon icon="${rhiMmActivityIcon(a.id)}"></ha-icon>
          ${a.favorite===true?`<ha-icon class="mm-favorite-star" icon="mdi:star"
            title="${this.t('favorite')}"></ha-icon>`:''}${escape(a.name)}</button>${off}</div>
        ${!a.available?`<small class="mm-room-error">${escape(a.disabled_reason||this.t('unavailable'))}</small>`:''}
        <details class="mm-activity-plan" data-persist="${escape(key)}"
          ${this._expanded.has(key)?'open':''}>
          <summary>${this.t('details')} · ${linked.length} ${this.t('devices')}</summary>
          ${targets?`<ol>${targets}</ol>`:plan?`<ol>${plan}</ol>`:
            `<p class="mm-muted">${this.t('settings_no_steps')}</p>`}
        </details>
      </div>`;
    }).join('');
    const stop=!activities.some(a=>a.id===room.activity_id)&&rhiMmCanRun(room,'stop_activity')?`<button type="button"
      data-action="stop_activity" data-room="${escape(room.id)}"><ha-icon icon="mdi:stop-circle-outline"></ha-icon>${this.t('stop_activity')}</button>`:'';
    const fix=rhiMmCanRun(room,'recover_activity')?`<button type="button"
      data-action="recover_activity" data-room="${escape(room.id)}"><ha-icon icon="mdi:restore"></ha-icon>${this.t('recover')}</button>`:'';
    const devices=(room.devices||[]).map(d=>{
      const key=room.id+':device:'+d.key;
      const unavailable=!d.available||!d.foundation_approved;
      const advanced=['play','pause','stop','previous','next','remote_key','sound_mode']
        .some(action=>d.controls?.[action]);
      return `<div class="mm-cockpit-device">
        <div class="mm-cockpit-device-heading">
          <span>${rhiMmDeviceArt(d,this.t('illustrative_device_art'))}<b>${escape(d.name)}</b></span>
          <small class="${unavailable?'mm-room-error':''}">${unavailable?
            this.t('device_unavailable'):escape(rhiMmStateLabel(this._hass,d.state))}</small>
        </div>
        ${this.roomDeviceBasicActions(room,d)}
        <details class="mm-cockpit-device-details" data-persist="${escape(key)}"
          ${this._expanded.has(key)?'open':''}>
          <summary>${this.t('details')}</summary>
          <div class="mm-cockpit-device-body">
            <small>${escape(rhiMmRoleLabel(this._hass,d.role))} ${d.shared?' · '+this.t('shared_source'):''}</small>
            ${advanced?this.roomManualControls({...room,activities:[],devices:[d]},true,false,'advanced'):''}
            ${this.productSpecifications(d)}
            ${this._hass?.user?.is_admin?`<button type="button" data-mm-option-action="expert_yaml"
              data-mm-option-scope="device" data-mm-option-room="${escape(room.id)}"
              data-mm-option-id="${escape(d.key)}">${this.t('settings_yaml')}</button>`:''}
          </div>
        </details>
      </div>`;
    }).join('');
    const detail=room.error||room.warnings?.length||room.target_state?.targets?.length||room.last_attempt;
    return `<section class="mm-section mm-overview">
      <div class="mm-floor-room-select">${selector}
        <div class="mm-floor-room-buttons" role="group" aria-label="${this.t('room')}">${roomButtons}</div>
      </div>
      <div class="mm-cockpit">
        <article class="mm-surface mm-cockpit-activities"><h3>${this.t('activities')}</h3>
          <p class="mm-cockpit-current">${escape(room.activity_name||this.t('no_activity'))}
          <small>${escape(rhiMmRoomStatus(room,this._hass))}</small></p>
          <div class="mm-cockpit-activity-list">${activityButtons||this.t('no_activities')}</div>
          <div class="mm-room-foot">${stop}${fix}</div>
          ${this.feedback(room.id)}
        </article>
        <div class="mm-cockpit-controls">${this.roomFocusedRemote(room)}
          ${room.now_playing?.title?`<small>${escape(rhiMmMediaSubtitle(room,this._hass))}</small>`:''}
        </div>
        <article class="mm-surface mm-cockpit-devices"><h3>${this.t('devices')}</h3>
          ${devices||this.t('no_devices')}</article>
      </div>
      ${detail?`<details class="mm-surface mm-cockpit-diagnostics" data-persist="${escape(room.id+':diagnostics')}"
        ${this._expanded.has(room.id+':diagnostics')?'open':''}>
        <summary>${this.t('details')} · ${this.t('diagnostics')}</summary>
        ${room.error?`<p class="mm-room-error">${escape(room.error)}</p>`:''}
        ${(room.warnings||[]).map(msg=>`<p class="mm-room-error">${escape(msg)}</p>`).join('')}
        ${(room.target_state?.targets||[]).map(target=>`<div class="mm-diag-status">
          <span>${escape(room.devices.find(d=>d.key===target.device_key)?.name||target.device_key)} · ${escape(target.type)}</span>
          <small>${this.t('target_expected')}: ${escape(Array.isArray(target.expected)?target.expected.join(', '):target.expected)} ·
            ${this.t('target_actual')}: ${escape(target.actual??this.t('not_published'))}</small></div>`).join('')}
        ${room.last_attempt?`<p class="mm-muted">${this.t('last_attempt')}: ${escape(room.last_attempt.kind)} · ${escape(room.last_attempt.result)}</p>`:''}
      </details>`:''}
    </section>`;
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
    const navigation=devices.filter(d=>d.controls.remote_key?.enabled||d.controls.remote_text?.enabled);
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
    const shortcutReady=room.phase==='active'&&room.control_owner!=='harmony';
    const mapped=shortcutReady?(active?.button_map||[]).map(button=>
      `<button type="button" data-mm-shortcut="press_activity_button"
        data-room="${e(room.id)}" data-shortcut-key="${e(button.button)}"
        ${button.enabled===true?'':'disabled'}
        title="${e(button.button)} · ${e(room.devices.find(d=>d.key===button.device_key)?.name||this.t('unavailable'))}">
        ${e(this.t('activity_button_'+button.button).startsWith('activity_button_')?
          button.button.replaceAll('_',' '):this.t('activity_button_'+button.button))}</button>`).join(''):'';
    const macros=shortcutReady?(active?.macros||[]).map(macro=>
      `<button type="button" data-mm-shortcut="run_activity_macro"
        data-room="${e(room.id)}" data-shortcut-key="${e(macro.id)}"
        ${macro.enabled===true?'':'disabled'}>${e(macro.name)}</button>`).join(''):'';
    const shortcuts=mapped||macros?`<div class="mm-activity-shortcuts">
        <b>${this.t('settings_activity_shortcuts')}</b>
        <div class="mm-native-buttons">${mapped}${macros}</div>
        </div>`:'';
    return `<article class="mm-surface mm-focused-remote" data-remote-room="${e(room.id)}">
      <div class="mm-heading"><h3>${this.t('remote_keys')} · ${e(room.name)}</h3></div>
      ${buttons}${primary}${audioPanel}${shortcuts}${missing}
      </article>`;
  }
  roomNowPlaying(room){const media=room.now_playing;return `<article class="mm-surface"><h3>${this.t('now_playing')}</h3>${media?`<div class="mm-media-detail">${media.picture?`<img alt="${this.t('media_artwork')}" src="${rhiUxEscape(media.picture)}">`:''}<div><b>${rhiUxEscape(media.title||this.t('playing'))}</b><p>${rhiUxEscape(media.artist||this.t('artist_unknown'))}</p><small>${rhiUxEscape(media.album||'')}</small></div></div>`:rhiUxState({state:'unavailable',title:this.t('no_playback'),detail:this.t('playback_help')})}${room.audio?`<div class="mm-audio-readback"><ha-icon icon="mdi:volume-high"></ha-icon><span>${rhiUxEscape(room.audio.name)}: ${room.audio.volume_level===null?this.t('volume_unknown'):`${Math.round(room.audio.volume_level*100)}%`}</span></div>`:''}</article>`;}

  roomDeviceBasicActions(room,device){
    // Direct basic controls use the same native capability-checked gateway.
    // Unknown power, source and volume capabilities remain disabled/absent.
    const e=rhiUxEscape,c=device.controls||{};
    const attrs=`data-room="${e(room.id)}" data-device="${e(device.key)}"`;
    const allowed=action=>device.foundation_approved===true&&c[action]?.enabled===true;
    const button=(action,label,icon,value)=>`<button type="button" ${attrs}
      data-device-action="${action}" ${value===undefined?'':`data-value="${e(JSON.stringify(value))}"`}
      aria-label="${e(device.name+' · '+label)}"
      ${allowed(action)?'':`disabled title="${e(c[action]?.reason||this.t('action_unavailable'))}"`}>
      <ha-icon icon="${icon}"></ha-icon>${e(label)}</button>`;
    const harmony=room.control_owner==='harmony'&&room.harmony_controller===device.key;
    const harmonyOff=harmony&&c.harmony_activity?.options?.includes('PowerOff')?
      button('harmony_activity',this.t('off'),'mdi:power','PowerOff'):'';
    const power=harmony?harmonyOff:
      button('power_on',this.t('on'),'mdi:power-on')+
      button('power_off',this.t('off'),'mdi:power-off');
    const sources=Array.isArray(c.source?.options)?c.source.options:[];
    const source=sources.length?`<label class="mm-device-basic-source">
      ${this.t('input')}<select ${attrs} data-device-input="source"
        aria-label="${e(device.name+' · '+this.t('input'))}"
        ${allowed('source')?'':`disabled title="${e(c.source?.reason||this.t('action_unavailable'))}"`}>
        <option value="" ${sources.includes(device.source)?'':'selected'}>${this.t('select')}</option>
        ${sources.map(value=>`<option value="${e(value)}" ${value===device.source?'selected':''}>${e(value)}</option>`).join('')}
      </select></label>`:'';
    const validLevel=typeof device.volume_level==='number'&&
      Number.isFinite(device.volume_level)&&device.volume_level>=0&&device.volume_level<=1;
    const slider=c.volume?(validLevel?`<label class="mm-device-basic-volume">
      ${this.t('volume')} · ${Math.round(device.volume_level*100)}%
      <input type="range" min="0" max="1" step="0.01" value="${device.volume_level}"
        ${attrs} data-device-input="volume"
        aria-label="${e(device.name+' · '+this.t('volume'))}"
        ${allowed('volume')?'':`disabled title="${e(c.volume?.reason||this.t('action_unavailable'))}"`}>
      </label>`:`<small>${this.t('volume_unknown')}</small>`):'';
    const volumeButtons=(c.volume_down?button('volume_down',this.t('volume_down'),'mdi:volume-minus'):'')+
      (c.volume_up?button('volume_up',this.t('volume_up'),'mdi:volume-plus'):'');
    const mute=c.mute&&typeof device.is_volume_muted==='boolean'?
      button('mute',device.is_volume_muted?this.t('unmute'):this.t('mute'),
        device.is_volume_muted?'mdi:volume-high':'mdi:volume-off',!device.is_volume_muted):'';
    const playback=(c.play?button('play',this.t('play'),'mdi:play'):'')+
      (c.pause?button('pause',this.t('pause'),'mdi:pause'):'');
    const owners=Array.isArray(device.reserved_by_rooms)?
      device.reserved_by_rooms.filter(r=>typeof r.name==='string'&&r.name.trim())
        .map(r=>e(r.name)).join(', '):'';
    return `<div class="mm-device-basic" role="group"
      aria-label="${e(device.name+' · '+this.t('device_basic_actions'))}">
      ${owners?`<small class="mm-device-reservation">${this.t('reserved_by')}: ${owners}</small>`:''}
      ${power?`<div class="mm-device-basic-buttons">${power}</div>`:''}
      ${source}
      ${slider||volumeButtons||mute?`<div class="mm-device-basic-audio">
        ${slider}<div class="mm-device-basic-buttons">${volumeButtons}${mute}</div>
      </div>`:''}
      ${playback?`<div class="mm-device-basic-buttons">${playback}</div>`:''}
    </div>`;
  }
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
      const actions=part==='advanced'?['previous','stop','next']:
        focused?(part==='audio'?['volume_down','volume_up']:['power_on','power_off','previous','play','pause','stop','next',...(part==='all'?['volume_down','volume_up']:[])]):
        quick?['power_on','power_off','play','pause',...(!c.volume?['volume_down','volume_up']:[])]:['power_on','power_off','volume_down','volume_up','previous','play','pause','stop','next'];
      const buttons=actions.map(action=>button(action,labels[action])).join('');
      const volume=part!=='primary'&&part!=='advanced'&&c.volume&&typeof d.volume_level==='number'?`<label>${this.t('volume')} ${Math.round(d.volume_level*100)}%<input type="range" min="0" max="1" step="0.01" value="${d.volume_level}" ${attrs} data-device-input="volume" ${disabled(c.volume)}></label>`:'';
      const mute=part!=='primary'&&part!=='advanced'&&typeof d.is_volume_muted==='boolean'?button('mute',d.is_volume_muted?this.t('unmute'):this.t('mute'),!d.is_volume_muted):'';
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
          const tabKey=room.id+':'+d.key;
          const chosen=this._remoteTabs.get(tabKey)||'buttons';
          const numbers=sections.find(section=>section.name==='numbers');
          const media=sections.find(section=>section.name==='media');
          const extras=sections.filter(section=>!['navigation','media','numbers'].includes(section.name))
            .map(section=>{
              const persist=key+':'+section.name;
              return `<details data-persist="${escape(persist)}" ${this._expanded.has(persist)?'open':''}>
                <summary>${this.t('remote_'+section.name)}</summary>
                <div class="mm-native-buttons">${section.keys.map(renderKey).join('')}</div></details>`;
            }).join('');
          const tabs=[['buttons',this.t('remote_buttons')],['numbers',this.t('remote_numbers')],
                      ['text',this.t('remote_text')]];
          const selector=`<div class="mm-remote-tabs" role="group" aria-label="${this.t('remote_keys')}">
            ${tabs.map(([id,label])=>`<button type="button" data-remote-tab="${id}" data-room="${escape(room.id)}"
              data-device="${escape(d.key)}" aria-pressed="${chosen===id}">${escape(label)}</button>`).join('')}
          </div>`;
          const content=chosen==='numbers'?
            (numbers?.keys.length?`<div class="mm-remote-numbers" role="group" aria-label="${this.t('remote_numbers')}">
              ${numbers.keys.map(renderKey).join('')}</div>`:
              `<p class="mm-muted">${this.t('remote_not_supported')}</p>`):
            chosen==='text'?(c.remote_text?.enabled?
              `<div class="mm-remote-text-input"><label>${this.t('remote_text')}
                <input type="text" maxlength="256" data-device-text data-room="${escape(room.id)}"
                  data-device="${escape(d.key)}" autocomplete="off"
                  placeholder="${this.t('remote_text_placeholder')}"></label>
                <button type="button" data-device-text-submit data-room="${escape(room.id)}"
                  data-device="${escape(d.key)}">${this.t('remote_text_send')}</button></div>`:
              `<p class="mm-muted">${this.t('remote_text_unavailable')}</p>`):
            `${navigation}${media?`<div class="mm-native-buttons" role="group"
               aria-label="${this.t('remote_media')}">${media.keys.map(renderKey).join('')}</div>`:''}${extras}`;
          return selector+content;
        }
        return `<details class="mm-remote" data-persist="${escape(key)}" ${this._expanded.has(key)?'open':''}><summary>${this.t('remote_keys')}</summary>${navigation}${extra}</details>`;
      })():'';
      return `<div class="mm-native-device"><b>${escape(d.name)}</b><small>${escape(rhiMmStateLabel(this._hass,d.state))}${d.shared?' · '+this.t('shared_source'):''}${d.group_members?.length>1?' · '+this.t('grouped')+' ('+d.group_members.length+' '+this.t('players')+')':''}</small><div class="mm-native-buttons">${buttons}${mute}</div>${volume}${part==='audio'||part==='advanced'?'':options('harmony_activity',d.current_activity)}${focused?(part==='audio'?'':remote):quick?(part==='advanced'?options('sound_mode',d.sound_mode)+remote:room.activities.length?'':options('source',d.source)+options('sound_mode',d.sound_mode)+remote):options('source',d.source)+options('sound_mode',d.sound_mode)+options('join_group',null)+button('unjoin_group',labels.unjoin_group)+remote}${!quick?Object.entries(c).filter(([,cap])=>!cap.enabled&&cap.reason).map(([action,cap])=>`<small>${escape(labels[action]||action)}: ${escape(cap.reason)}</small>`).join(''):''}</div>`;
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
  settings(model){
    const esc=rhiUxEscape,manage=this._hass?.user?.is_admin===true;
    const category=this._settingsCategory;
    const groups={
      locations:model.rooms.map(room=>({
        id:room.id,room,label:room.name,
        subtitle:[room.floor_name,room.area_name].filter(Boolean).join(' · '),
        scope:'room',objectId:''})),
      devices:model.rooms.flatMap(room=>(room.devices||[]).map(device=>({
        id:room.id+':'+device.key,room,device,
        label:device.name,subtitle:room.name+' · '+rhiMmRoleLabel(this._hass,device.role),
        scope:'device',objectId:device.key}))),
      activities:model.rooms.flatMap(room=>(room.activities||[]).map(activity=>({
        id:room.id+':'+activity.id,room,activity,
        label:activity.name,subtitle:room.name,
        scope:'activity',objectId:activity.id}))),
    };
    const entries=groups[category]||[];
    const remembered=this._settingsSelections.get(category);
    const selected=entries.find(item=>item.id===remembered)||entries[0];
    const itemRows=entries.map(item=>`<button type="button" class="mm-settings-item ${selected?.id===item.id?'active':''}"
        data-mm-settings-pick="${esc(item.id)}" aria-pressed="${selected?.id===item.id}">
        <strong>${esc(item.label)}</strong><small>${esc(item.subtitle)}</small></button>`).join('');
    const classes=[
      ['profiles',this.t('settings_profiles'),true],
      ['locations',this.t('settings_floor_rooms'),false],
      ['devices',this.t('devices'),false],
      ['activities',this.t('activities'),false],
    ];
    const menu=classes.map(([key,label,disabled])=>`<button type="button"
      data-mm-settings-category="${esc(key)}" ${disabled?'disabled':''}
      class="mm-settings-nav ${category===key?'active':''}" aria-pressed="${category===key}">
      ${esc(label)}${disabled?`<small>${this.t('settings_later')}</small>`:''}</button>`).join('');
    const scopeButton=selected&&manage?`<button type="button" class="mm-settings-yaml"
      data-mm-option-action="expert_yaml" data-mm-option-room="${esc(selected.room.id)}"
      data-mm-option-scope="${esc(selected.scope)}" data-mm-option-id="${esc(selected.objectId)}">
      <ha-icon icon="mdi:code-tags"></ha-icon>${this.t('settings_yaml')}</button>`:'';
    const selectedActivity=selected?.activity;
    const selectedDevice=selected?.device;
    const script=selectedActivity?`<div class="mm-script-devices">
      ${(selectedActivity.device_keys||[]).map(key=>{
        const device=selected.room.devices.find(d=>d.key===key);
        const all=selectedActivity.script_steps||[];
        const steps=all.filter(step=>step.device_key===key);
        const stop=(selectedActivity.stop_script_steps||[]).filter(step=>step.device_key===key);
        const goals=(selectedActivity.target_state?.targets||[]).filter(target=>target.device_key===key);
        const power=selectedActivity.power_plan?.find(item=>item.device_key===key);
        const ready=power?.action==='cec_wake'?this.t('settings_cec_wake'):
          power?.action==='ensure_ready'?this.t('settings_ensure_ready'):this.t('not_published');
        const quickType=device?.controls?.remote_key?.options?.length?'remote_key':
          device?.controls?.source?.options?.length?'source':'delay';
        const renderSteps=(rows,kind)=>rows.map(step=>{
          const detail=step.action==='volume'&&typeof step.level==='number'?
            Math.round(step.level*100)+'%':
            step.action==='delay'&&typeof step.milliseconds==='number'?
            step.milliseconds+' ms':
            step.action==='wait_until'?
            (Array.isArray(step.states)?step.states.join(', '):'')+
              (typeof step.timeout==='number'?' · '+this.t('settings_wait_timeout')+
                ' '+step.timeout+' s':''):
            step.value??step.candidates?.join(', ')??step.level??'';
          // The engine only applies inter-step delay between two ordinary
          // commands, not after the last command or beside explicit waits.
          const next=kind==='steps'?all[step.index]:null;
          const pause=kind==='steps'&&next&&!['delay','wait_until'].includes(step.action)&&
            !['delay','wait_until'].includes(next.action);
          const delay=pause?`${step.delay_ms!==undefined?this.t('settings_delay_override'):
            this.t('settings_delay_inherited')} · ${esc(step.delay_ms??selected.room.default_step_delay_ms??0)} ms`:'';
          const actionName=this.t('script_action_'+step.action);
          return `<li class="mm-script-step"><span>${esc(step.index)}. ${esc(actionName)}
            ${detail!==''?`<b>${esc(detail)}</b>`:''}</span>
            <div class="mm-step-actions">${delay?`<small>${delay}</small>`:''}
              ${manage?`<button type="button" class="mm-step-edit" data-mm-option-action="script_step"
                data-mm-option-room="${esc(selected.room.id)}"
                data-mm-option-activity="${esc(selectedActivity.id)}"
                data-mm-option-phase="${esc(kind)}" data-mm-option-operation="edit"
                data-mm-option-index="${esc(step.index-1)}"
                data-mm-option-device="${esc(key)}" data-mm-option-type="${esc(step.action)}">
                  ${this.t('settings_edit_step')}</button>`:''}</div></li>`;
        }).join('');
        return `<section class="mm-script-device">
          <div class="mm-script-device-head"><strong>${esc(device?.name||key)}</strong>
          <small>${this.t('settings_expected')}: ${esc(goals.length?goals.map(g=>g.type+' · '+(Array.isArray(g.expected)?g.expected.join(', '):g.expected)).join('; '):this.t('not_published'))}</small></div>
          <div class="mm-script-automatic"><ha-icon icon="mdi:power"></ha-icon>
            <span>${this.t('settings_automatic_start')}: ${ready}${power?.post_power_on_delay_ms>0?
   ' · '+this.t('settings_post_power_delay')+': '+power.post_power_on_delay_ms+' ms':''}</span></div>
          <ol class="mm-script-steps">${renderSteps(steps,'steps')||
            `<li>${this.t('settings_no_steps')}</li>`}</ol>
          ${manage?`<button type="button" class="mm-step-add" data-mm-option-action="script_step"
            data-mm-option-room="${esc(selected.room.id)}"
            data-mm-option-activity="${esc(selectedActivity.id)}"
            data-mm-option-phase="steps" data-mm-option-operation="add"
            data-mm-option-index="0" data-mm-option-device="${esc(key)}"
            data-mm-option-type="${esc(quickType)}">
            <ha-icon icon="mdi:plus"></ha-icon>${this.t('settings_add_step')}</button>`:''}
          <details class="mm-script-stop"><summary>${this.t('settings_stop_actions')}</summary>
            <ol class="mm-script-steps">${renderSteps(stop,'stop_steps')}
              <li class="mm-script-automatic">${this.t('settings_automatic_stop')}</li>
            </ol>
            ${manage?`<button type="button" class="mm-step-add" data-mm-option-action="script_step"
              data-mm-option-room="${esc(selected.room.id)}"
              data-mm-option-activity="${esc(selectedActivity.id)}"
              data-mm-option-phase="stop_steps" data-mm-option-operation="add"
              data-mm-option-index="0">
              <ha-icon icon="mdi:plus"></ha-icon>${this.t('settings_add_stop_step')}</button>`:''}
          </details>
          </section>`;
      }).join('')}</div>`:'';
    const details=!selected?`<p class="mm-muted">${this.t('settings_empty')}</p>`:
      selectedActivity?`${script}
        <section class="mm-activity-configured-actions">
          <h4>${this.t('settings_activity_shortcuts')}</h4>
          ${(selectedActivity.button_map||[]).length?
            (selectedActivity.button_map||[]).map(b=>`<p>
              <b>${esc(b.button.replaceAll('_',' '))}</b> →
              ${esc(selected.room.devices.find(d=>d.key===b.device_key)?.name||b.device_key)}
              · ${esc(b.action)} ${b.value?esc(b.value):''}
              ${b.enabled?'':`<small class="mm-room-error">${this.t('action_unavailable')}</small>`}
            </p>`).join(''):`<p class="mm-muted">${this.t('settings_no_mapping')}</p>`}
          ${(selectedActivity.macros||[]).length?
            selectedActivity.macros.map(m=>`<div class="mm-macro-entry"><b>${esc(m.name)}</b> ·
              ${m.steps} ${this.t('settings_step_count')}
              ${m.enabled?'':`<small class="mm-room-error">${this.t('action_unavailable')}</small>`}
              <details class="mm-script-stop">
                <summary>${this.t('settings_edit_steps')} · ${esc(m.name)}</summary>
                <ol class="mm-script-steps">${(m.script_steps||[]).map(step=>{
                  const device=selected.room.devices.find(d=>d.key===step.device_key);
                  const value=step.value??step.candidates?.join(', ')??step.level??
                    step.milliseconds??step.states?.join(', ')??'';
                  const next=m.script_steps?.[step.index];
                  const between=next&&!['delay','wait_until'].includes(step.action)&&
                    !['delay','wait_until'].includes(next.action);
                  const timing=step.action==='delay'?`${step.milliseconds} ms`:
                    step.action==='wait_until'?`${step.timeout} s timeout`:
                    between?`${step.delay_ms??selected.room.default_step_delay_ms??0} ms`:'';

                  return `<li class="mm-script-step">${esc(step.index)}.
                    ${esc(device?.name||step.device_key)} →
                    ${esc(this.t('script_action_'+step.action))}
                    ${value!==''?`<b>${esc(value)}</b>`:''}
                    ${timing?`<small>${esc(timing)}</small>`:''}</li>`;
                }).join('')}</ol>
              </details>
            </div>`).join(''):`<p class="mm-muted">${this.t('settings_no_macro')}</p>`}
          ${manage?`<div class="mm-setup-actions">
            <button type="button" data-mm-option-action="button_mapping"
              data-mm-option-room="${esc(selected.room.id)}"
              data-mm-option-activity="${esc(selectedActivity.id)}">${this.t('settings_button_mapping')}</button>
            <button type="button" data-mm-option-action="macro_manage"
              data-mm-option-room="${esc(selected.room.id)}"
              data-mm-option-activity="${esc(selectedActivity.id)}">${this.t('settings_macro_shortcuts')}</button>
          </div>`:''}
        </section>
        ${manage?`<div class="mm-setup-actions">
          <button type="button" data-mm-option-action="script_step"
            data-mm-option-room="${esc(selected.room.id)}"
            data-mm-option-activity="${esc(selectedActivity.id)}">${this.t('settings_edit_steps')}</button>
          <button type="button" data-mm-option-action="quick_edit_activity"
            data-mm-option-room="${esc(selected.room.id)}"
            data-mm-option-activity="${esc(selectedActivity.id)}">${this.t('setup_edit_activity')}</button>
          <button type="button" data-mm-option-action="edit_activity"
            data-mm-option-room="${esc(selected.room.id)}"
            data-mm-option-activity="${esc(selectedActivity.id)}">${this.t('settings_edit_activity_devices')}</button>
          <button type="button" data-mm-option-action="remove_activity"
            data-mm-option-room="${esc(selected.room.id)}"
            data-mm-option-activity="${esc(selectedActivity.id)}">${this.t('settings_remove_activity')}</button>
          <button type="button" data-mm-option-action="cec_activity"
            data-mm-option-room="${esc(selected.room.id)}"
            data-mm-option-activity="${esc(selectedActivity.id)}">${this.t('setup_cec_activity')}</button>
        </div>`:''}`:
      selectedDevice?`<div class="mm-settings-facts">
        <p>${this.t('native_state')}: ${esc(rhiMmStateLabel(this._hass,selectedDevice.state))}</p>
        <p>HDMI-CEC: ${selectedDevice.hdmi_cec_enabled?this.t('enabled'):this.t('not_confirmed')}</p>
        <p>${this.t('settings_post_power_delay')}: ${esc(selectedDevice.post_power_on_delay_ms??0)} ms</p>
        ${this.roomAvailableControls(selectedDevice)}</div>
${manage?`<div class="mm-setup-actions"><button type="button" data-mm-option-action="cec_device"
          data-mm-option-room="${esc(selected.room.id)}">${this.t('setup_cec_devices')}</button>
          <button type="button" data-mm-option-action="edit_room"
          data-mm-option-room="${esc(selected.room.id)}">${this.t('setup_edit_devices')}</button>
        </div>`:''}`:
      `<div class="mm-settings-facts">
         <p>${this.t('room')}: ${esc(selected.room.name)}</p>
         <p>${this.t('floor_navigation')}: ${esc(selected.room.floor_name||this.t('not_published'))}</p>
         <p>${this.t('setup_devices')}: ${selected.room.devices.length}</p>
       </div>${manage?`<div class="mm-setup-actions">
         <button type="button" data-mm-option-action="rename_room"
           data-mm-option-room="${esc(selected.room.id)}">${this.t('setup_edit_location')}</button>
         <button type="button" data-mm-option-action="edit_room"
           data-mm-option-room="${esc(selected.room.id)}">${this.t('setup_edit_devices')}</button>
         <button type="button" data-mm-option-action="remove_room"
           data-mm-option-room="${esc(selected.room.id)}">${this.t('settings_remove_room')}</button>
       </div>`:''}`;
    const add=!manage?'':category==='activities'?`<div class="mm-setup-actions">
      <button type="button" data-mm-option-action="add_activity"
        ${selected?`data-mm-option-room="${esc(selected.room.id)}"`:''}>${this.t('setup_add_activity')}</button>
      <button type="button" data-mm-option-action="script_defaults">${this.t('settings_default_delay')}</button>
      ${selected?`<span class="mm-muted">${esc(selected.room.default_step_delay_ms??0)} ms</span>`:''}
      </div>`:category==='locations'?`<button type="button" data-mm-option-action="add_room">${this.t('setup_add_room')}</button>`:'';
    return `<section class="mm-section mm-settings">
      <div class="mm-heading"><h2>${this.t('settings')}</h2>
        ${manage?`<button type="button" class="mm-settings-yaml mm-global-yaml"
          data-mm-option-action="yaml"><ha-icon icon="mdi:code-tags"></ha-icon>${this.t('settings_edit_all_yaml')}</button>`:''}</div>
      <div class="mm-settings-layout">
        <nav class="mm-settings-menu" aria-label="${this.t('settings')}">${menu}</nav>
        <div class="mm-settings-main">
          ${this._optionsStep||this._optionsBusy||this._optionsError?
            this.renderOptionsEditor():
            `<div class="mm-settings-heading"><h3>${esc(selected?.label||classes.find(c=>c[0]===category)?.[1]||'')}</h3>
              ${scopeButton}</div>
              ${add}
              <div class="mm-settings-choices">${itemRows}</div>
              ${details}
              ${this._optionsNotice?this.renderOptionsEditor():''}`}
        </div>
      </div>
    </section>`;
  }

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

  insights(model){
    // Resident task order: problem -> affected device/route -> permitted fix.
    // No summary counters or invented event history; evidence belongs to the
    // existing native activity/target projection.
    const esc=rhiUxEscape;
    const rooms=[...model.rooms].sort((a,b)=>Number(b.attention===true)-Number(a.attention===true)||
      String(a.name).localeCompare(String(b.name)));
    const cards=rooms.map(room=>{
      const target=room.target_state;
      const misses=(target?.targets||[]).filter(item=>item.status!=='observed');
      const offline=(room.devices||[]).filter(d=>d.available===false||d.foundation_approved===false);
      const attention=room.attention===true;
      // A provider failure may contain internal keys and entity names.
      // Present a user explanation on D0; keep exact messages folded under
      // diagnostics where they remain useful as genuine source evidence.
      const affected=offline[0]||room.devices?.find(d=>d.key===misses[0]?.device_key);
      const message=room.phase==='starting'||room.phase==='stopping'?
        this.t('waiting'):
        offline.length?`${affected?.name||room.name}: ${this.t('insights_unavailable')}`:
        attention&&misses.length?`${affected?.name||room.name}: ${this.t('insights_target_mismatch')}`:
        attention?this.t('insights_attention'):
        this.t('insights_no_issue');
      const latest=room.last_attempt;
      const more=room.id+':insights:details';
      const tech=room.id+':insights:technical';
      const targeted=misses.map(item=>{
        const name=(room.devices||[]).find(d=>d.key===item.device_key)?.name||item.device_key;
        const expected=Array.isArray(item.expected)?item.expected.join(', '):item.expected;
        return `<div class="mm-insight-target"><b>${esc(name)}</b>
          <span>${this.t('settings_expected')}: ${esc(expected??this.t('not_published'))}</span>
          <span>${this.t('target_actual')}: ${esc(item.actual??this.t('not_published'))}</span></div>`;
      }).join('');
      const devices=offline.map(d=>`<div class="mm-insight-target"><b>${esc(d.name)}</b>
        <span>${esc(d.foundation_approved===false?this.t('diag_not_selected'):this.t('diag_device_unavailable'))}</span>
      </div>`).join('');
      const fix=rhiMmCanRun(room,'recover_activity')?`<button type="button"
          class="mm-insight-fix" data-action="recover_activity" data-room="${esc(room.id)}">
          <ha-icon icon="mdi:restore"></ha-icon>${this.t('recover')}</button>`:'';
      const state=attention?this.t('insights_attention'):rhiMmRoomStatus(room,this._hass);
      const open=attention||offline.length>0;
      return `<article class="mm-surface mm-insight ${attention?'mm-insight-attention':''}">
        <div class="mm-insight-head">
          <div><h3>${esc(room.name)}</h3>
            <small>${esc(room.activity_name||this.t('no_activity'))}</small></div>
          <span class="mm-insight-state">${esc(state)}</span>
        </div>
        <p class="mm-insight-summary ${attention?'mm-room-error':''}">${esc(message)}</p>
        ${open?`<div class="mm-insight-affected">${devices}${targeted}</div>`:''}
        <div class="mm-insight-actions">${fix}
          <button type="button" data-nav="overview" data-room="${esc(room.id)}">
            ${this.t('insights_open_room')}</button></div>
        ${this.feedback(room.id)}
        <details data-persist="${esc(more)}" ${this._expanded.has(more)?'open':''}>
          <summary>${this.t('insights_details')}</summary>
          ${latest?`<div class="mm-diag-status">
            <span>${this.t('last_attempt')}</span>
            <b>${esc(latest.kind||this.t('unknown'))} · ${esc(latest.result||this.t('unknown'))}</b>
            ${latest.failed_at?`<small>${this.t('failed_step')}: ${esc(latest.failed_at)}</small>`:''}
          </div>`:''}
          ${room.last_control?`<div class="mm-diag-status">
            <span>${this.t('last_control')}</span>
            <b>${esc(room.last_control.action||this.t('unknown'))} · ${esc(room.last_control.result||this.t('unknown'))}</b></div>`:''}
          ${!open?`<div class="mm-insight-affected">${targeted}</div>`:''}
          ${room.error?`<p class="mm-room-error">${esc(room.error)}</p>`:''}
          ${(room.warnings||[]).map(warning=>`<p class="mm-room-error">${esc(warning)}</p>`).join('')}
          ${(room.activities||[]).flatMap(a=>(a.routes||[]).map(route=>{
            const d=room.devices?.find(x=>x.key===route.device_key);
            return `<div class="mm-diag-route"><b>${esc(a.name)}</b>
                <span>${esc(d?.name||route.device_key||this.t('unavailable'))}
                · ${esc(route.type||this.t('unknown'))}</span>
                <small>${esc(route.status||this.t('unknown'))}</small></div>`;
          })).join('')}
          <details data-persist="${esc(tech)}" ${this._expanded.has(tech)?'open':''}>
            <summary>${this.t('technical')}</summary>
            <div class="mm-tech">${(room.devices||[]).map(d=>`<p><b>${esc(d.name)}</b>
              <small>${this.t('diag_source')}: ${esc(d.entity_id||this.t('not_published'))}</small>
              <small>${this.t('readback_quality')}: ${esc(this.t('readback_'+(d.native_readback_quality||'unapproved')))}</small>
              ${Object.entries(d.controls||{}).filter(([,c])=>!c.enabled&&c.reason).map(([action,c])=>
                `<small>${esc(action)}: ${esc(c.reason)}</small>`).join('')}</p>`).join('')}</div>
          </details>
        </details>
      </article>`;
    }).join('');
    return `<section class="mm-section mm-insights"><div class="mm-heading">
        <div><h2>${this.t('insights')}</h2>
          <p>${this.t('insights_explainer')}</p></div></div>
      <div class="mm-insights-list">${cards||rhiUxState({
        state:'empty',title:this.t('no_rooms'),detail:this.t('setup_help')})}</div>
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
