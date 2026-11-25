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

function rhiMmNativeArtwork(uri){
  // Accept actual HA/local proxy paths or HTTPS artwork, never constructed
  // remote lookup URLs, executable protocols or protocol-relative links.
  return typeof uri==='string'&&(
    /^\/(?!\/)[^\s<>"']+$/.test(uri)||/^https:\/\/[^\s<>"']+$/.test(uri))
    ?uri:'';
}
function rhiMmPlaybackTime(value){
  if(typeof value!=='number'||!Number.isFinite(value)||value<0)return '';
  const seconds=Math.floor(value),hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60);
  return hours?hours+':'+String(minutes).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0'):
    minutes+':'+String(seconds%60).padStart(2,'0');
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
  // A native registry model is a visual fact, not permission to send commands.
  // The backend still grants controls only through an approved Foundation
  // selection; never suppress an exact, catalog-registered illustration just
  // because that selection is under review.
  if(device?.product_profile?.identity_evidence!=='exact_native_ha_device_registry'||
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
  // The pinned Core shell needs a target to make a module button clickable.
  // One screen per module: do not render a redundant second-level Overview.
  {id:'overview',label:'Overview',target:'overview',items:[]},
  {id:'settings',label:'Settings',target:'settings',items:[]},
  {id:'discovery',label:'Discovery',target:'discovery',items:[]},
  {id:'insights',label:'Insights',target:'insights',items:[]},
];

// Presentation-only grouping: preserve exact native values and unknown vendor keys.
function rhiMmRemoteGroups(options){
  const keys=[...new Set(Array.isArray(options)?options.filter(k=>typeof k==='string'&&k.length):[])];
  const used=new Set();
  const take=(name,wanted)=>{const selected=wanted.flatMap(k=>keys.filter(x=>x===k&&!used.has(x)));
    for(const k of selected)used.add(k);return {name,keys:selected};};
  const groups=[
    take('navigation',['HOME','home','MENU','menu','top_menu','BACK','back','INFO','info','EXIT','exit','UP','up','DPAD_UP','LEFT','left','DPAD_LEFT','ENTER','select','ok','DPAD_CENTER','RIGHT','right','DPAD_RIGHT','DOWN','down','DPAD_DOWN']),
    take('media',['CHANNELUP','CHANNELDOWN','CHANNEL_UP','CHANNEL_DOWN','GUIDE','epg','VOLUMEUP','VOLUMEDOWN','VOLUME_UP','VOLUME_DOWN','vol_up','vol_down','PLAY','play','MEDIA_PLAY','PAUSE','pause','MEDIA_PAUSE','MEDIA_PLAY_PAUSE','MEDIA_STOP','stop','MEDIA_NEXT','MEDIA_PREVIOUS','MUTE','mute','VOLUME_MUTE']),
    take('numbers',Array.from({length:10},(_,i)=>String(i))),
    take('apps',['NETFLIX','AMAZON','RED','GREEN','BLUE','YELLOW','PROG_RED','PROG_GREEN','PROG_BLUE','PROG_YELLOW']),
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
const RHI_MM_SAVE_STEPS=new Set(['review','yaml','room_settings','tv_wake','speech_endpoint','harmony_owner','cec_device','cec_activity','button_value','macro_create','quick_edit_activity','script_defaults','dell_display','dell_remove']);
class HomeBrainMultimediaCard extends HTMLElement {
  static getStubConfig() { return {type:'custom:homebrain-multimedia-card'}; }
  constructor() {
    super(); this.attachShadow({mode:'open'});
    this.config={}; this._hass=null; this._view=''; this._room='';
    this._lastSignature=''; this._feedback=new Map();
    this._expanded=new Set();this._remoteSelections=new Map();this._remoteTabs=new Map();
    this._remotePress=null;this._onRemoteBlur=()=>this.cancelRemotePress();
    this._settingsCategory='locations';this._settingsSelections=new Map();
    this._activitySettingsStage='devices';this._wholeHomeFlow=false;this._wholeHome=null;
    this._destinationSelection=null;this._contextSelections=new Map();this._contextKey='';this._contextCards=[];this._planSummary=null;this._planRequest=0;
    this._diagnosticExport=null;this._diagnosticEpoch=0;
    this._optionsStep=null;this._optionsData={};this._optionsBusy=false;this._optionsDirty=false;
    this._optionsError='';this._optionsNotice='';this._optionsEpoch=0;this._optionsRevision=0;this._clipboardRequest=0;this._pendingNavigation=null;
    this._onLocation=()=>{
      this.cancelRemotePress();
      const route=this.currentRoute();
      if((this._optionsStep||this._optionsBusy)&&
         (this._wholeHomeFlow?!['settings','discovery'].includes(route.view):route.view!==this._view||route.room!==this._room||route.floor!==this._floor)&&
         this.hasUnsavedOptions()){
        this._pendingNavigation=route;
        // Browser Back must not silently discard a dirty native HA draft.
        const url=new URL(window.location.href);
        url.searchParams.set('multimedia_view',this._view||'discovery');
        if(this._room)url.searchParams.set('multimedia_room',this._room);
        else url.searchParams.delete('multimedia_room');
        if(this._floor)url.searchParams.set('multimedia_floor',this._floor);
        else url.searchParams.delete('multimedia_floor');
        window.history.replaceState(null,'',url.pathname+url.search+url.hash);
        this._optionRefresh();return;
      }
      if(!['settings','discovery','activities','devices'].includes(route.view)&&
         (this._optionsStep||this._optionsBusy)){
        void this.cancelOptions();
      }else{this._lastSignature='';this.render();}
    };
    this.shadowRoot.addEventListener('click',event=>this.onClick(event));
    // No browser-generated held-key command stream. Providers without an
    // explicitly qualified native repeat contract use discrete presses.
    this.shadowRoot.addEventListener('keydown',event=>{
      if(event.repeat&&['Enter',' '].includes(event.key)&&
         event.target?.closest?.('[data-device-action="remote_key"]'))event.preventDefault();
    });
    this.shadowRoot.addEventListener('pointerdown',event=>this.startRemotePress(event));
    this.shadowRoot.addEventListener('pointerup',event=>this.finishRemotePress(event));
    this.shadowRoot.addEventListener('pointercancel',()=>this.cancelRemotePress());
    this.shadowRoot.addEventListener('pointermove',event=>{
      const press=this._remotePress;
      if(press?.state==='down'&&event.pointerId===press.pointer&&
        Math.hypot(event.clientX-press.x,event.clientY-press.y)>12)this.cancelRemotePress();
    });
    this.shadowRoot.addEventListener('pointerout',event=>{
      const press=this._remotePress;
      if(press?.state==='down'&&event.pointerId===press.pointer&&
        !press.element.contains?.(event.relatedTarget))this.cancelRemotePress();
    });
    this.shadowRoot.addEventListener('contextmenu',event=>{
      if(event.target?.closest?.('[data-native-hold="true"]'))event.preventDefault();
    });
    this.shadowRoot.addEventListener('change',event=>{this.onControlChange(event);this.onOptionValue(event);this.onWholeHomeInput(event);});
    this.shadowRoot.addEventListener('input',event=>{this.onOptionValue(event);this.onWholeHomeInput(event);});
    this.shadowRoot.addEventListener('toggle',event=>this.onToggle(event),true);
  }
  setConfig(config={}) { this.config={...(config||{})}; this._lastSignature=''; this.render(); }
  connectedCallback() {
    window.addEventListener('popstate',this._onLocation);window.addEventListener('location-changed',this._onLocation);
    window.addEventListener('blur',this._onRemoteBlur);
    if(typeof document!=='undefined')document.addEventListener('visibilitychange',this._onRemoteBlur);
    this.render();
  }
  disconnectedCallback() {
    this.cancelRemotePress();
    window.removeEventListener('blur',this._onRemoteBlur);
    if(typeof document!=='undefined')document.removeEventListener('visibilitychange',this._onRemoteBlur);
    window.removeEventListener('popstate',this._onLocation);
    window.removeEventListener('location-changed',this._onLocation);
    if(this._optionsStep||this._optionsBusy)void this.cancelOptions();
  }
  set hass(hass) {
    this._hass=hass;
    if(!hass?.user?.is_admin){this._diagnosticExport=null;++this._diagnosticEpoch;}
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
    this.cancelRemotePress();
    this._destinationSelection=null;
    this._diagnosticExport=null;++this._diagnosticEpoch;
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
    const diagnostic=event.target?.closest?.('[data-mm-diagnostic-export]');
    if(diagnostic){
      event.preventDefault();if(!this._hass?.user?.is_admin)return;
      const roomId=diagnostic.getAttribute('data-mm-diagnostic-export')||'';
      const epoch=++this._diagnosticEpoch;
      this._diagnosticExport={roomId,busy:true};this._optionRefresh();
      try{
        const result=await rhiMmDiagnosticExport(this._hass,roomId);
        if(epoch!==this._diagnosticEpoch||!this._hass?.user?.is_admin||this.currentRoute().view!=='diagnostics')return;
        this._diagnosticExport={roomId,text:JSON.stringify(result,null,2)};
      }catch(_){if(epoch===this._diagnosticEpoch)this._diagnosticExport={roomId,error:true};}
      if(epoch===this._diagnosticEpoch)this._optionRefresh();return;
    }
    const clipboard=event.target?.closest?.('[data-mm-copy],[data-mm-paste]');
    if(clipboard){
      event.preventDefault();
      if(!this._hass?.user?.is_admin||this._optionsBusy)return;
      const request=++this._clipboardRequest;
      const clipboardEpoch=this._optionsEpoch,diagnosticEpoch=this._diagnosticEpoch;
      const userId=this._hass.user.id,step=this._optionsStep;
      const kind=clipboard.getAttribute('data-mm-copy');
      const fieldSelector=kind==='diagnostics'?'[data-mm-diagnostics-text]':'[data-wh-raw],textarea[data-mm-option-field="yaml_text"]';
      const field=this.shadowRoot?.querySelector?.(fieldSelector);
      const beforePaste=field?.value;
      const status=clipboard.parentElement?.querySelector?.('[data-mm-clipboard-status]');
      const fallback=kind==='issues'?clipboard.closest?.('[role="alert"]')?.querySelector?.('[data-mm-copy-fallback]'):null;
      // Clipboard prompts are asynchronous. Do not overwrite a newer draft,
      // refocus a detached editor, or expose fallback text after navigation.
      const current=()=>request===this._clipboardRequest&&this._hass?.user?.is_admin&&
        this._hass.user.id===userId&&!this._optionsBusy&&this._optionsEpoch===clipboardEpoch&&
        this._diagnosticEpoch===diagnosticEpoch&&this._optionsStep===step&&
        clipboard.isConnected!==false&&(kind==='issues'||this.shadowRoot?.querySelector?.(fieldSelector)===field);
      const tell=value=>{if(current()&&status)status.textContent=value;};
      if(kind){
        const value=kind==='issues'?fallback?.value:field?.value;
        if(typeof value!=='string'||!value){tell(this.t('clipboard_empty_copy'));return;}
        try{
          if(!globalThis.navigator?.clipboard?.writeText)throw Error('Clipboard unavailable');
          await globalThis.navigator.clipboard.writeText(value);
          tell(this.t('clipboard_copied'));
        }catch(_){
          if(!current())return;
          if(kind==='issues'){
            if(fallback){fallback.hidden=false;fallback.focus();fallback.select();}
          }else{field?.focus();field?.select();}
          tell(this.t('clipboard_unavailable'));
        }
      }else if(field){
        try{
          if(!globalThis.navigator?.clipboard?.readText)throw Error('Clipboard unavailable');
          const value=await globalThis.navigator.clipboard.readText();
          if(!current()||field.value!==beforePaste)return;
          if(!value){tell(this.t('clipboard_empty'));return;}
          field.value=value;
          if(this._optionsStep?.step_id==='complete_setup'&&this._wholeHome){
            this._wholeHome.rawDraft=value;this._wholeHome.editableDraft='';this._wholeHome.dirty=true;
          }else{this._optionsData.yaml_text=value;this._optionsDirty=true;}
          field.focus();tell(this.t('clipboard_pasted'));
        }catch(_){if(current()){field.focus();tell(this.t('clipboard_manual_paste'));}}
      }
      return;
    }
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
    // A recovery link only selects the exact logical room/device editor.
    // It never changes Foundation binding or performs a native device write.
    const openSettings=event.target?.closest?.('[data-mm-settings-open]');
    if(openSettings){
      event.preventDefault();
      const category=openSettings.getAttribute('data-mm-settings-open');
      if(['locations','devices','activities'].includes(category)){
        if(this.hasUnsavedOptions()){
          this._optionsError=this.t('whole_home_leave_warning');this._optionRefresh();return;
        }
        if(this._optionsStep||this._optionsBusy)await this.cancelOptions();
        const room=openSettings.getAttribute('data-room')||'';
        const key=openSettings.getAttribute('data-device')||'';
        const activity=openSettings.getAttribute('data-activity')||'';
        if(category==='devices'&&room&&key)
          this._settingsSelections.set('devices',room+':'+key);
        if(category==='activities'&&room&&activity)
          this._settingsSelections.set('activities',room+':'+activity);
        this._settingsCategory=category;
        this.navigate('settings',room,
          (rhiMmRooms(this._hass).rooms||[]).find(r=>r.id===room)?.floor_id||'__unassigned__');
      }
      return;
    }
    const leave=event.target?.closest?.('[data-mm-leave-action]');
    if(leave){
      event.preventDefault();
      const choice=leave.getAttribute('data-mm-leave-action');
      if(choice==='keep'){
        this._pendingNavigation=null;this._optionsError='';
        if(this._wholeHomeFlow&&this._optionsStep?.step_id==='review'){
          // Keep editing means returning to the editable draft, not trapping
          // the user in HA's final confirmation screen.
          this._optionsData.return_to_setup=true;this._optionsData.confirm=false;
          await this.submitOptions();
        }else this._optionRefresh();
      }else if(choice==='discard'&&this._pendingNavigation){
        const target=this._pendingNavigation;
        await this.cancelOptions();
        this.navigate(target.view,target.room,target.floor);
      }else if(choice==='review'&&this._pendingNavigation){
        if(this._optionsBusy)return;
        if(this._optionsStep?.step_id==='complete_setup'&&this._wholeHome){
          this._optionsData.yaml_text=this._wholeHome.rawDraft??JSON.stringify(this._wholeHome.doc,null,2);
          await this.submitOptions({save:true});
        }else if(this._optionsStep){
          await this.submitOptions({save:true});
        }
      }
      return;
    }
    const reviewBack=event.target?.closest?.('[data-mm-review-back]');
    if(reviewBack&&this._optionsStep){
      const back=this._wholeHomeFlow?'return_to_setup':'return_to_yaml';
      if(this._wholeHomeFlow||(this._optionsStep.data_schema||[]).some(field=>field.name===back)){
        if(this._optionsStep.step_id!=='review')this._optionsData=rhiMmOptionDefaults(this._optionsStep);
        this._optionsData[back]=true;
        if((this._optionsStep.data_schema||[]).some(field=>field.name==='confirm'))this._optionsData.confirm=false;
        await this.submitOptions();
      }
      return;
    }
    const category=event.target?.closest?.('[data-mm-settings-category]');
    if(category){
      if(this.blockWholeHomeNavigation())return;
      if(this._optionsStep||this._optionsBusy)await this.cancelOptions();
      const chosen=category.getAttribute('data-mm-settings-category');
      if(['locations','devices','activities'].includes(chosen)){
        this._settingsCategory=chosen;this._activitySettingsStage='devices';this._lastSignature='';this.render();
      }
      return;
    }
    const stage=event.target?.closest?.('[data-mm-activity-stage]');
    if(stage){
      if(this.blockWholeHomeNavigation())return;
      const value=stage.getAttribute('data-mm-activity-stage');
      if(['devices','tune'].includes(value)){
        if(this._optionsStep||this._optionsBusy)await this.cancelOptions();
        this._activitySettingsStage=value;this._lastSignature='';this.render();
      }
      return;
    }
    const settingsPick=event.target?.closest?.('[data-mm-settings-pick]');
    if(settingsPick){
      if(this.blockWholeHomeNavigation())return;
      // A selected object must never silently change beneath an open
      // native Options Flow transaction for a different configuration scope.
      // End the old transaction before showing the newly selected object.
      if(this._optionsStep||this._optionsBusy)await this.cancelOptions();
      const picked=settingsPick.getAttribute('data-mm-settings-pick');
      this._settingsSelections.set(this._settingsCategory,picked);
      this._activitySettingsStage='devices';
      // Settings selection and room URL are one object context. Resolve from
      // actual published room IDs, never a label or a guessed key prefix.
      const owner=(rhiMmRooms(this._hass).rooms||[]).find(room=>
        picked===room.id||picked.startsWith(room.id+':'));
      if(owner)this.navigate('settings',owner.id,owner.floor_id||'__unassigned__');
      else{this._lastSignature='';this.render();}
      return;
    }
    const remoteTab=event.target?.closest?.('[data-remote-tab]');
    if(remoteTab){
      this.cancelRemotePress();
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
      this.cancelRemotePress();
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
    if(floor){event.preventDefault();const target={view:'overview',room:'',floor:floor.getAttribute('data-floor')||''};if(this.hasUnsavedOptions()){this._pendingNavigation=target;this._optionRefresh();return;}if(this._optionsStep)await this.cancelOptions();this.navigate(target.view,target.room,target.floor);return;}
    const wholeAction=event.target?.closest?.('[data-wh-action]');
    if(wholeAction&&this._optionsStep?.step_id==='complete_setup'&&this._wholeHome){
      event.preventDefault();
      const action=wholeAction.getAttribute('data-wh-action');
      if(action==='specialist'){
        const name=wholeAction.getAttribute('data-wh-id');
        if(!(this._optionsStep.data_schema||[]).some(field=>field.name==='specialist_action')){
          this._optionsError=this.t('setup_flow_changed');this._optionRefresh();return;
        }
        this._optionsData.yaml_text=this._wholeHome.rawDraft??JSON.stringify(this._wholeHome.doc,null,2);
        await this.submitOptions({specialist:name});
      }else if(action==='review'||action==='review_yaml'){
        this._optionsData.yaml_text=this._wholeHome.rawDraft??JSON.stringify(this._wholeHome.doc,null,2);
        await this.submitOptions({save:action==='review',visual:action==='review_yaml'});
      }else{
        const id=action==='apply_json'
          ?this.shadowRoot?.querySelector?.('[data-wh-raw]')?.value||''
          :wholeAction.getAttribute('data-wh-id')||'';
        const changed=rhiMmWholeAction(this._wholeHome,action,id,
          wholeAction.getAttribute('data-phase')||'',
          Number(wholeAction.getAttribute('data-index')));
        if(['focus_binding','focus_issue','edit_import'].includes(action)&&changed){
          this.navigate('settings',this._wholeHome.room,'');
          if(action==='focus_issue'){
            const route=/\.(steps|stop_steps)\[(\d+)\]\.candidates$/.exec(id);
            const key=route?'step_value:'+route[1]+':'+route[2]:id.endsWith('.entity')?'device_resolve':id.endsWith('.area_id')?'room_area':null;
            if(key)this.shadowRoot?.querySelector?.(`[data-wh-field='${key}']`)?.focus();
          }
          return;
        }
        if(action==='tab'&&['rooms','devices','activities'].includes(id))
          this._wholeHome.settingsTab=id;
        this._optionRefresh();
      }
      return;
    }
    const option=event.target?.closest?.('[data-mm-option-action]');
    if(option){event.preventDefault();if(!option.disabled)await this.openContextualOptions({
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
    const visualOption=event.target?.closest?.('[data-mm-option-visual]');
    if(visualOption){event.preventDefault();await this.submitOptions({visual:true});return;}
    const submitOption=event.target?.closest?.('[data-mm-option-submit]');
    if(submitOption){event.preventDefault();await this.submitOptions({save:RHI_MM_SAVE_STEPS.has(this._optionsStep?.step_id)});return;}
    const cancelOption=event.target?.closest?.('[data-mm-option-cancel]');
    if(cancelOption){event.preventDefault();await this.cancelOptions();return;}
    const nav=event.target?.closest?.('[data-nav]');
    if(nav){
      event.preventDefault();
      const next=nav.getAttribute('data-nav');
      if(!RHI_MM_VIEWS.includes(next))return;
      const requested=nav.getAttribute('data-room')!=null?
        (nav.getAttribute('data-room')||''):this.currentRoute().room;
      const owner=(rhiMmRooms(this._hass).rooms||[]).find(r=>r.id===requested);
      const room=owner?.id||'';
      const floor=owner?(owner.floor_id||'__unassigned__'):undefined;
      if(next==='settings'&&room&&this.currentRoute().view!=='settings'){
        for(const category of ['locations','devices','activities']){
          const selected=this._settingsSelections.get(category);
          if(selected&&selected!==room&&!selected.startsWith(room+':'))
            this._settingsSelections.delete(category);
        }
      }
      // Settings and Discovery are two object views of ONE native Options
      // Flow. Reuse its flow ID, draft, and full editor; never reopen a writer.
      if(this._wholeHomeFlow&&this._optionsStep&&
         ['settings','discovery'].includes(next)&&
         ['complete_setup','review'].includes(this._optionsStep.step_id)){
        if(this._wholeHome){
          if(this._wholeHome.workspace==='settings'&&
             ['rooms','devices','activities'].includes(this._wholeHome.tab))
            this._wholeHome.settingsTab=this._wholeHome.tab;
          this._wholeHome.workspace=next;
          if(next==='discovery')this._wholeHome.tab='discovery';
          if(next==='settings'&&this._wholeHome.tab==='discovery')
            this._wholeHome.tab=this._wholeHome.settingsTab||'rooms';
        }
        this._pendingNavigation=null;this._optionsError='';
        this.navigate(next,room,floor);return;
      }
      if(this._optionsStep||this._optionsBusy){
        if(this._optionsBusy){
          this._optionsError=this.t('whole_home_busy');
          this._optionRefresh();return;
        }
        if(this.hasUnsavedOptions()){
          this._pendingNavigation={view:next,room,floor};
          this._optionRefresh();return;
        }
      }
      if(this._optionsStep||this._optionsBusy)await this.cancelOptions();
      this.navigate(next,room,floor);
      if(next==='discovery'&&this._hass?.user?.is_admin===true)
        await this.openOptions({action:'complete_setup'});
      return;}
    const more=event.target?.closest?.('[data-more-info]');
    if(more){event.preventDefault();const entityId=more.getAttribute('data-more-info');
      if(this.nativeMediaLinkCurrent(more,entityId))
        this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId},bubbles:true,composed:true}));
      return;}
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
      if(input && input.value.trim()&&this.remoteInputCurrent(sendText))
        await this.executeDevice(room,device,'remote_text',input.value,sendText.getAttribute('data-activity')??undefined);
      return;
    }
    const direct=event.target?.closest?.('[data-device-action]');
    if(direct){
      const requested=direct.getAttribute('data-device-action');
      const action=requested==='remote_key'?this.takeRemotePress(direct,event):requested;
      if(action&&!direct.disabled&&(!['remote_key','remote_hold','remote_repeat'].includes(action)||this.remoteInputCurrent(direct))){
        const raw=direct.getAttribute('data-value');
        await this.executeDevice(direct.getAttribute('data-room'),direct.getAttribute('data-device'),action,
          raw===null?undefined:JSON.parse(raw),direct.getAttribute('data-activity')??undefined);
      }
      return;
    }
    const action=event.target?.closest?.('[data-action]');
    if(!action||action.disabled)return;
    const roomId=action.getAttribute('data-room');
    const service=action.getAttribute('data-action');
    const activity=action.getAttribute('data-activity')||'';
    await this.execute(roomId,service,activity);
  }
  startRemotePress(event){
    if(event.isPrimary===false||event.button!==0)return;
    this._remotePress=null;
    const element=event.target?.closest?.('[data-native-hold="true"]');
    if(!element||element.disabled||!this.remoteInputCurrent(element))return;
    this._remotePress={element,pointer:event.pointerId,time:event.timeStamp,x:event.clientX,y:event.clientY,state:'down'};
  }
  cancelRemotePress(){
    if(this._remotePress)this._remotePress.state='cancelled';
  }
  finishRemotePress(event){
    const press=this._remotePress;
    if(!press||press.pointer!==event.pointerId||press.state!=='down')return;
    if(event.target?.closest?.('[data-native-hold="true"]')!==press.element||
       !this.remoteInputCurrent(press.element)||Math.hypot(event.clientX-press.x,event.clientY-press.y)>12){
      this.cancelRemotePress();return;
    }
    press.state=event.timeStamp-press.time>=500?'held':'short';
  }
  takeRemotePress(element,event){
    const press=this._remotePress;
    this._remotePress=null;
    // Keyboard/screen-reader activation stays discrete; the folded native
    // timed actions below provide equivalent accessible hold/repeat.
    if(!press||press.element!==element||event.detail===0)return 'remote_key';
    if(press.state==='cancelled'||press.state==='down')return null;
    return press.state==='held'?'remote_hold':'remote_key';
  }
  remoteInputCurrent(element){
    if(element?.isConnected===false||typeof document!=='undefined'&&document.visibilityState==='hidden')return false;
    const route=this.currentRoute(),roomId=element.getAttribute('data-room');
    if(!['overview','rooms'].includes(route.view)||(route.room&&route.room!==roomId))return false;
    const room=rhiMmRooms(this._hass).rooms?.find(row=>row.id===roomId);
    const device=room?.devices?.find(row=>row.key===element.getAttribute('data-device'));
    return !!device&&device.entity_id===element.getAttribute('data-native-entity')&&
      (room.activity_id||'')===(element.getAttribute('data-activity')||'')&&
      !['starting','stopping'].includes(room.phase);
  }
  async onControlChange(event){
    const floor=event.target?.closest?.('[data-floor-select]');
    if(floor){this.navigate('overview','',floor.value);return;}
    const input=event.target?.closest?.('[data-device-input]');
    if(!input||input.disabled||input.value==='')return;
    const action=input.getAttribute('data-device-input');
    if(['remote_hold','remote_repeat'].includes(action)){
      if(!this.remoteInputCurrent(input))return;
      const value=input.value;input.value='';
      await this.executeDevice(input.getAttribute('data-room'),input.getAttribute('data-device'),action,value,input.getAttribute('data-activity')??undefined);
      return;
    }
    if(action==='seek'){
      const roomId=input.getAttribute('data-room'),activity=input.getAttribute('data-activity')||'';
      const route=this.currentRoute();
      if(!['overview','rooms'].includes(route.view)||(route.room&&route.room!==roomId))return;
      input.blur?.();
      await this.executeDevice(roomId,input.getAttribute('data-device'),action,Number(input.value),activity);
      return;
    }
    await this.executeDevice(input.getAttribute('data-room'),input.getAttribute('data-device'),action,action==='volume'?Number(input.value):input.value);
  }
  onWholeHomeInput(event){
    if(this._optionsStep?.step_id!=='complete_setup'||!this._wholeHome)return;
    const raw=event.target?.closest?.('[data-wh-raw]');
    if(raw){this._wholeHome.rawDraft=raw.value;this._wholeHome.editableDraft='';this._wholeHome.dirty=true;return;}
    const element=event.target?.closest?.('[data-wh-field]');
    if(!element)return;
    if(this._wholeHome.rawDraft!=null){this._wholeHome.error='Validate or discard advanced YAML edits before changing GUI fields.';this._optionRefresh();return;}
    const key=element.getAttribute('data-wh-field');
    const value=element.type==='checkbox'?element.checked:element.value;
    const before=this._wholeHome.error;
    const changed=rhiMmWholeChange(this._wholeHome,key,value,element.checked);
    if(changed&&this._wholeHome.validationDetail)this._wholeHome.validationStale=true;
    // Editing is ephemeral until native Review/Save. Avoid re-rendering
    // while typing so the iPad keyboard and field focus remain stable.
    if(event.type==='change'&&(changed||this._wholeHome.error!==before))
      this._optionRefresh();
  }
  onOptionValue(event){
    const el=event.target?.closest?.('[data-mm-option-field]');
    if(!el||!this._optionsStep||this._optionsBusy)return;
    const key=el.getAttribute('data-mm-option-field');
    if(!key)return;
    const before=JSON.stringify(this._optionsData[key]);
    if(el.hasAttribute('data-mm-option-choice')){
      const wanted=el.getAttribute('data-mm-option-choice');
      const values=new Set(Array.isArray(this._optionsData[key])?this._optionsData[key]:[]);
      if(el.checked)values.add(wanted);else values.delete(wanted);
      this._optionsData[key]=[...values];
    }else if(el.type==='checkbox')this._optionsData[key]=!!el.checked;
    else if(el.type==='number')this._optionsData[key]=el.value===''?'':Number(el.value);
    else this._optionsData[key]=el.value;
    if(before!==JSON.stringify(this._optionsData[key]))this._optionsDirty=true;
  }
  hasUnsavedOptions(){return !!(this._optionsBusy||this._optionsDirty||this._wholeHome?.dirty||this._optionsStep?.step_id==='review');}
  _optionRefresh(){this._optionsRevision++;this._lastSignature='';this.render();}
  settingsFlowFailure(error){
    // Only map owned stable error categories. Raw HA/transport error messages
    // may contain private entity identifiers, addresses or authentication data.
    const reason=error?.message;
    const key=reason==='Multimedia admin permission required'?'setup_permission_required':
      reason==='Native HA configuration API unavailable'?'setup_api_unavailable':
      reason==='Multimedia Options Flow unavailable'?'setup_missing_entry':
      reason==='Unexpected Multimedia Options Flow step'||
      reason==='Invalid configuration response'||
      reason==='Unsupported Multimedia settings action'?'setup_flow_changed':
      'setup_flow_failed';
    return this.t(key);
  }
  blockWholeHomeNavigation(){
    if(this.hasUnsavedOptions()||(this._wholeHomeFlow&&this._optionsStep)){
      this._optionsError=this.t('whole_home_leave_warning');
      this._optionRefresh();return true;
    }
    return false;
  }
  leaveDecision(){
    const pending=this._pendingNavigation;
    if(!pending)return '';
    const esc=rhiUxEscape,tab=this.t(pending.view);
    return `<section class="mm-surface mm-leave-decision" role="alertdialog"
      aria-label="${esc(this.t('whole_home_leave_title'))}">
      <b>${esc(this.t('whole_home_leave_title'))}: ${esc(tab)}</b>
      <p>${esc(this.t('whole_home_leave_warning'))}</p>
      <div class="mm-setup-actions">
        <button type="button" data-mm-leave-action="keep">${esc(this.t('whole_home_keep_editing'))}</button>
        <button type="button" data-mm-leave-action="discard">${esc(this.t('whole_home_discard_open'))}: ${esc(tab)}</button>
        <button type="button" data-mm-leave-action="review" ${this._optionsBusy?'disabled':''}>${esc(this.t('whole_home_review_save'))}</button>
      </div></section>`;
  }
  async openContextualOptions(request){
    const {action,room,activity,device,phase,operation,index,stepType}=request;
    const roomEdits=new Set(['add_room','rename_room','remove_room','edit_room']);
    const activityEdits=new Set(['add_activity','quick_edit_activity','edit_activity','activity_devices','remove_activity','guided_activity']);
    const specialistEdits=new Set(['button_mapping','macro_manage','cec_activity','cec_device','harmony_owner','speech_endpoint','tv_wake','script_step','script_defaults']);
    if(!roomEdits.has(action)&&!activityEdits.has(action)&&!specialistEdits.has(action))
      return this.openOptions(request);
    if(this.hasUnsavedOptions()){this._optionsError=this.t('whole_home_leave_warning');this._optionRefresh();return;}
    // The ordinary and specialist entry points now select a context inside
    // the same home draft. The native HA integration still offers its own
    // independent Options Flow for users who prefer that interface.
    this.navigate('settings',room||this.currentRoute().room||'');
    await this.openOptions({action:'complete_setup',room,activity,device});
    if(this._optionsStep?.step_id!=='complete_setup'||!this._wholeHome)return;
    const d=this._wholeHome;
    if(roomEdits.has(action))d.tab=action==='edit_room'?'devices':'rooms';
    else if(activityEdits.has(action)||activity||['script_step','button_mapping','macro_manage','cec_activity'].includes(action))d.tab='activities';
    else d.tab='rooms';
    d.workspace='settings';d.settingsTab=d.tab;
    rhiMmWholeCurrent(d);
    // Direct removal remains an explicit edit of the draft; final Save
    // presents the destructive confirmation. Never remove an inferred item.
    if(action==='remove_room'&&room===d.room)rhiMmWholeAction(d,'delete_room');
    if(action==='remove_activity'&&room===d.room&&activity===d.activity)rhiMmWholeAction(d,'delete_activity');
    if(action==='script_step'&&room===d.room&&activity===d.activity&&['steps','stop_steps'].includes(phase)){
      const row=d.doc.rooms[room]?.activities?.[activity]?.[phase]?.[index];
      if(['up','down'].includes(operation)&&Number.isInteger(index)&&row&&(!device||row.device===device)&&(!stepType||row.type===stepType))
        rhiMmWholeAction(d,'step_'+operation,'',phase,index);
      // Detailed edit/insert and provider-specific arguments remain the native specialist section.
      if(operation==='edit'&&row&&(!device||row.device===device)&&(!stepType||row.type===stepType)){
        this._optionRefresh();this.shadowRoot.querySelector?.(`[data-wh-field="step_type:${phase}:${index}"]`)?.focus();return;
      }
    }
    this._optionRefresh();
    if(specialistEdits.has(action)&&!['script_defaults','script_step'].includes(action)&&
       (this._optionsStep.data_schema||[]).some(field=>field.name==='specialist_action')){
      this._optionsData.yaml_text=JSON.stringify(d.doc,null,2);
      await this.submitOptions({specialist:action});
    }else if(action==='script_step'&&!['up','down','edit'].includes(operation)&&
       (this._optionsStep.data_schema||[]).some(field=>field.name==='specialist_action')){
      this._optionsData.yaml_text=JSON.stringify(d.doc,null,2);
      await this.submitOptions({specialist:'script_step'});
    }
  }
  async openOptions({action,room='',activity='',scope='',id='',
    phase='',operation='',index=null,device='',stepType=''}) {
    if(!this._hass?.user?.is_admin||this._optionsBusy)return;
    if(this.hasUnsavedOptions()){this._optionsError=this.t('whole_home_leave_warning');this._optionRefresh();return;}
    const oldStep=this._optionsStep;
    const wholeHome=action==='complete_setup';
    const epoch=++this._optionsEpoch;
    this._optionsStep=null;this._optionsData={};this._optionsDirty=false;this._optionsError='';
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
      this._wholeHomeFlow=wholeHome;
      this._optionsStep=step;this._optionsData=rhiMmOptionDefaults(step);
      this._wholeHome=step.step_id==='complete_setup'?rhiMmWholeFromStep(step):null;
      if(this._wholeHome){
        this._wholeHome.workspace=this.currentRoute().view==='discovery'?'discovery':'settings';
        this._wholeHome.tab=this._wholeHome.workspace==='discovery'?'discovery':'rooms';
        this._wholeHome.settingsTab='rooms';
      }
      // Contextual Device Settings reuses the single Options Flow draft.
      if(this._wholeHome&&room&&this._wholeHome.doc.rooms[room]){
        this._wholeHome.room=room;this._wholeHome.tab=activity?'activities':device?'devices':'rooms';
        this._wholeHome.settingsTab=this._wholeHome.tab;
        if(activity&&this._wholeHome.doc.rooms[room].activities?.[activity])this._wholeHome.activity=activity;
        if(device&&this._wholeHome.doc.rooms[room].devices?.[device])
          this._wholeHome.device=device;
      }
    }catch(error){
      if(epoch===this._optionsEpoch){this._wholeHomeFlow=false;this._optionsError=this.settingsFlowFailure(error);}
    }finally{
      if(epoch===this._optionsEpoch){this._optionsBusy=false;this._optionRefresh();}
    }
  }
  async submitOptions({save=false,visual=false,specialist=''}={}){
    const step=this._optionsStep;
    if(!step||this._optionsBusy||!this._hass?.user?.is_admin)return;
    if(!(step.data_schema||[]).every(rhiMmOptionSupported)){
      this._optionsError=this.t('setup_field_unsupported');this._optionRefresh();return;
    }
    const epoch=++this._optionsEpoch;
    this._optionsBusy=true;this._optionsError='';this._optionRefresh();
    try{
      const payload={...this._optionsData};
      if(save&&step.step_id==='review'&&['true','false'].includes(step.description_placeholders?.explicit_confirmation))payload.confirm=true;
      if((step.data_schema||[]).some(field=>field.name==='visual_edit'))payload.visual_edit=visual;
      if((step.data_schema||[]).some(field=>field.name==='specialist_action')){
        payload.specialist_action=specialist;
        payload.specialist_room=specialist?this._wholeHome?.room||'':'';
        payload.specialist_activity=specialist?this._wholeHome?.activity||'':'';
      }
      let response=await rhiMmOptionsAdvance(this._hass,step,payload);
      if(epoch!==this._optionsEpoch)return;
      // A user Save may finish an ordinary edit in one interaction, but
      // never bypass a backend-declared sensitive/unknown confirmation.
      if(save&&step.step_id!=='review'&&response?.type==='form'&&response.step_id==='review'&&
         !response.errors?.base&&response.description_placeholders?.explicit_confirmation==='false'&&
         (response.data_schema||[]).some(field=>field.name==='confirm')&&
         (response.data_schema||[]).every(field=>['confirm','return_to_setup','return_to_yaml'].includes(field.name))){
        this._optionsStep=response;this._optionsData=rhiMmOptionDefaults(response);
        response=await rhiMmOptionsAdvance(this._hass,response,{...this._optionsData,confirm:true});
        if(epoch!==this._optionsEpoch)return;
      }
      if(response?.type==='create_entry'){
        this._optionsStep=null;this._optionsData={};this._optionsDirty=false;this._wholeHomeFlow=false;this._wholeHome=null;
        this._optionsNotice=this.t('setup_saved');
        if(this._settingsCategory==='activities')this._activitySettingsStage='tune';
        if(this._pendingNavigation){
          const destination=this._pendingNavigation;
          this._pendingNavigation=null;
          this.navigate(destination.view,destination.room,destination.floor);
        }
      }else if(response?.type==='form'){
        this._optionsStep=response;
        if(response.step_id!==step.step_id){this._optionsData=rhiMmOptionDefaults(response);this._optionsDirty=true;}
        if(response.step_id==='complete_setup'&&this._wholeHome){
          const reason=this.optionError(response,response.errors?.base)||'';
          const detail=response.description_placeholders?.validation_detail||'';
          this._wholeHome.validationDetail=detail;this._wholeHome.validationStale=false;
          this._wholeHome.error=detail||reason;
          this._wholeHome.editableDraft=response.description_placeholders?.editable_draft_json||'';
          if(this._wholeHome.editableDraft&&this._wholeHome.rawDraft!=null){
            // Backend parsed the exact submitted document, including missing bindings.
            // Keep one semantic draft, not a second raw editor requiring conversion.
            const parsed=JSON.parse(this._wholeHome.editableDraft);
            this._wholeHome.doc=parsed;this._wholeHome.rawDraft=null;this._wholeHome.editableDraft='';
            rhiMmWholeCurrent(this._wholeHome);
          }else if(!response.errors?.base&&(step.step_id!=='complete_setup'||visual)){
            const normalized=rhiMmWholeFromStep(response);
            // Refresh native evidence too: specialist edits may alter the
            // available choices, but the active room and category stay put.
            for(const key of ['doc','areas','floors','areaFloors','sources','logicalDevices','proposedRooms','proposalExceptions'])
              this._wholeHome[key]=normalized[key];
            this._wholeHome.rawDraft=null;this._wholeHome.dirty=true;
            rhiMmWholeCurrent(this._wholeHome);
          }
        }
        else if(response.step_id==='complete_setup'){
          this._wholeHome=rhiMmWholeFromStep(response);
          this._wholeHomeFlow=true;
          this._wholeHome.workspace='settings';
          this._wholeHome.tab=this._wholeHome.localScope?this._wholeHome.tab:'rooms';
          this._wholeHome.settingsTab=this._wholeHome.tab;
          rhiMmWholeCurrent(this._wholeHome);
          this._wholeHome.dirty=true;
          if(response.errors?.base){
            this._wholeHome.validationDetail=response.description_placeholders?.validation_detail||'';
            this._wholeHome.error=this._wholeHome.validationDetail||this.optionError(response,response.errors.base);
          }
        }
      }else{
        // A rejected or expired flow must not silently drop locally edited text.
        // Keep the displayed draft available for copy and explicit cancellation.
        this._optionsError=this.t('setup_flow_failed');
      }
    }catch(error){
      if(epoch===this._optionsEpoch)this._optionsError=this.settingsFlowFailure(error);
    }finally{
      if(epoch===this._optionsEpoch){this._optionsBusy=false;this._optionRefresh();}
    }
  }
  async cancelOptions(){
    const step=this._optionsStep;
    ++this._optionsEpoch;
    this._optionsStep=null;this._optionsData={};this._optionsDirty=false;this._optionsBusy=false;this._wholeHomeFlow=false;
    this._wholeHome=null;this._pendingNavigation=null;
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
    if(step.step_id==='activity_device_order'&&/^device_\d+$/.test(field.name))
      return this.t('startup_position')+' '+(Number(field.name.slice(7))+1);
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
  renderCompleteSetup(step){
    if(!this._wholeHome){
      try{this._wholeHome=rhiMmWholeFromStep(step);}
      catch(_){return `<p class='mm-room-error'>${this.t('setup_flow_failed')}</p>`;}
    }
    return `${this._optionsError?`<p class="mm-room-error" role="alert">${rhiUxEscape(this._optionsError)}</p>`:''}
      ${this.leaveDecision()}${rhiMmWholeRender(this._wholeHome,key=>this.t(key),rhiUxEscape)}`;
  }
  renderOptionsEditor(){
    // HA's actual administrator permission remains authoritative on every
    // render. Never expose an in-flight form after role revocation.
    if(!this._hass?.user?.is_admin)return '';
    const escape=rhiUxEscape,step=this._optionsStep;
    if(step?.step_id==='complete_setup')return this.renderCompleteSetup(step);
    if(!step&&!this._optionsBusy&&!this._optionsError&&!this._optionsNotice)return '';
    const errors=step?.errors||{};
    const detail=step?.description_placeholders?.validation_detail||'';
    const base=detail|| (errors.base?this.optionError(step,errors.base):this._optionsError);
    const label=step?.step_id?
      this._hass?.localize?.(`component.rhi_multimedia.options.step.${step.step_id}.title`,
        step.description_placeholders||{}):null;
    const description=step?.step_id?
      this._hass?.localize?.(`component.rhi_multimedia.options.step.${step.step_id}.description`,
        step.description_placeholders||{}):null;
    const unsupported=!!step&&!(step.data_schema||[]).every(rhiMmOptionSupported);
    const nativeReview=step?.step_id==='review'&&typeof step.description_placeholders?.change_summary==='string';
    const guidance=nativeReview?step.description_placeholders.change_summary:errors.base&&step?.step_id==='yaml'?'Draft not saved. Correct the issue below and try again.':description||step?.description_placeholders?.note;
    const stageTitle=step?.step_id==='activity_devices'?this.t('choose_devices'):
      step?.step_id==='activity_device_order'?this.t('tune_actions'):null;
    return `${this.leaveDecision()}<section class="mm-surface mm-options-editor" aria-live="polite" data-mm-flow-editor>
      ${this._wholeHomeFlow&&step?.step_id!=='review'?`<p class='mm-wh-draft'>${escape(this._wholeHome?.doc?.rooms?.[this._wholeHome?.room]?.name||'Multimedia')} · ${escape(this._wholeHome?.doc?.rooms?.[this._wholeHome?.room]?.activities?.[this._wholeHome?.activity]?.name||'Settings')}</p>`:''}
      <h3>${escape(stageTitle||label||this.t('setup_editor'))}</h3>
      ${this._optionsDirty?`<span class='mm-wh-draft'>Unsaved changes</span>`:''}
      ${guidance?`<p class="mm-options-description">${escape(guidance)}</p>`:''}
      ${nativeReview&&step.description_placeholders?.native_preview?`<details class="mm-selectable"><summary>Native device and route details</summary><p style="white-space:pre-wrap">${escape(step.description_placeholders.native_preview)}</p></details>`:''}
      ${base?`<div role="alert" class="mm-room-error mm-selectable"><p style="white-space:pre-wrap">${escape(base)}</p><button type="button" data-mm-copy="issues">${rhiUxEscape(this.t('copy_issues'))}</button><span data-mm-clipboard-status role="status"></span><textarea readonly hidden data-mm-copy-fallback aria-label="${rhiUxEscape(this.t('copy_issues_manual'))}" rows="6">${escape(base)}</textarea></div>`:''}
      ${this._optionsNotice?`<p role="status">${escape(this._optionsNotice)}</p>`:''}
      ${step?.type==='form'?`<div class="mm-option-fields">
        ${(step.data_schema||[]).filter(field=>!['visual_edit','return_to_yaml'].includes(field.name)&&!(this._wholeHomeFlow&&field.name==='return_to_setup')&&!(nativeReview&&field.name==='confirm'))
          .map(field=>this.optionInput(step,field)).join('')}</div>`:''}
      ${step?.step_id==='yaml'?`<div class="mm-setup-actions"><button type="button" data-mm-copy="yaml">${rhiUxEscape(this.t('copy_yaml'))}</button><button type="button" data-mm-paste="yaml">${rhiUxEscape(this.t('paste_yaml'))}</button><span data-mm-clipboard-status role="status"></span></div>`:''}
      <div class="mm-setup-actions">
        ${step?.step_id==='yaml'&&(step.data_schema||[]).some(field=>field.name==='visual_edit')?`<button type='button' data-mm-option-visual ${this._optionsBusy?'disabled':''}>Edit visually</button>`:''}
        ${step&&(this._wholeHomeFlow&&(step.step_id==='review'||(step.data_schema||[]).some(field=>field.name==='return_to_setup'))||step.step_id==='review'&&(step.data_schema||[]).some(field=>field.name==='return_to_yaml'))?
          `<button type='button' data-mm-review-back>${this.t('whole_home_back')}</button>`:''}
        ${step?`<button type="button" data-mm-option-submit ${this._optionsBusy||unsupported?'disabled':''}>${this._wholeHomeFlow&&step.step_id!=='review'&&RHI_MM_SAVE_STEPS.has(step.step_id)?'Apply to draft':RHI_MM_SAVE_STEPS.has(step.step_id)?this.t('settings_save'):this.t('setup_continue')}</button>`:''}
        ${step?`<button type="button" data-mm-option-cancel>${this._wholeHomeFlow&&step.step_id!=='review'?'Cancel all changes':this.t('setup_cancel')}</button>`:''}
        ${!step&&this._optionsError===this.t('setup_missing_entry')?`<a href="/config/integrations/integration/rhi_multimedia">${this.t('setup_manage')}</a>`:''}
      </div></section>`;
  }
  async executeDevice(roomId,key,action,value,expectedActivity){
    const contract=rhiMmRooms(this._hass);
    const room=contract.ready?contract.rooms.find(row=>row.id===roomId):null;
    return this.executeIntent(roomId,rhiMmDeviceIntent(room,key,action,value,expectedActivity),contract);
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
  roomProjection() {
    // HA sends immutable state objects on WebSocket updates. Reuse only
    // actual timestamped room rows with unchanged object identity/version.
    // Untimestamped or replaced rows, including removals, are projected afresh.
    const rows=rhiMmRoomCandidates(this._hass);
    const previous=this._roomProjection;
    const reusable=previous&&rows.length===previous.rows.length&&
      rows.every(([id,state],i)=>typeof state.last_updated==='string'&&
        previous.rows[i][0]===id&&previous.rows[i][1]===state&&previous.rows[i][2]===state.last_updated);
    if(reusable)return previous;
    const contract=rhiMmRooms(this._hass,rows);
    const model=rhiMmPresentation(contract);
    return this._roomProjection={rows:rows.map(([id,state])=>[id,state,state.last_updated]),contract,model,
      signature:JSON.stringify([model.ready,model.rooms,model.unavailable,model.backendVersion])};
  }
  render() {
    if(!this.shadowRoot||!this._hass)return;
    const route=this.currentRoute();this._view=route.view;this._room=route.room;this._floor=route.floor||'';
    const {contract,model,signature}=this.roomProjection();
    const editing=!!this._optionsStep;
    const activeInput=this.shadowRoot.activeElement;
    if(activeInput?.matches?.('[data-device-input="seek"]')&&['overview','rooms'].includes(route.view)){
      const selected=model.rooms.find(r=>r.id===activeInput.getAttribute('data-room'));
      if(selected&&(!route.room||route.room===selected.id)&&
          (selected.activity_id||'')===(activeInput.getAttribute('data-activity')||'')&&
          selected.now_playing?.device_key===activeInput.getAttribute('data-device')&&
          selected.devices?.find(d=>d.key===selected.now_playing.device_key)?.controls?.seek?.enabled)return;
    }
    if(route.view==='diagnostics'&&this._hass.user?.is_admin&&this._diagnosticExport?.roomId===route.room&&this.shadowRoot.activeElement?.matches?.('[data-mm-diagnostics-text]'))return;
    const fingerprint=JSON.stringify([editing?'editing':signature,
      route.view,route.room,route.floor,[...this._feedback],this._settingsCategory,
      [...this._settingsSelections],[...this._remoteTabs],
      this._optionsRevision,this._activitySettingsStage,this._hass.user?.id,this._hass.user?.is_admin,this._hass.locale?.language||this._hass.language]);
    // Keep independently mounted Core cards connected when media state changes.
    // Only replace the domain page, not the shared contextual editor.
    if(this._lastSignature!==fingerprint){
      this._lastSignature=fingerprint;
      const activeModule=['settings','activities','devices'].includes(route.view)?'settings':
        route.view==='discovery'?'discovery':
        ['insights','diagnostics'].includes(route.view)?'insights':'overview';
      const shell=rhiUxDomainShell({product:'Home Intelligence',domain:'MULTIMEDIA',
        modules:MM_MODULES.map(m=>({...m,label:m.id==='discovery'?'Discovery':this.t(m.id)})),activeModule,activeItem:''});
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
    this.renderContext(ids,contract);
  }
  renderContext(ids,contract=rhiMmRooms(this._hass)){
    const host=this.shadowRoot.querySelector?.('[data-mm-context]');
    if(!host)return;
    const roomRows=contract.rooms||[];
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
      view==='settings'||view==='activities'||view==='discovery'?'activities':'insights';
    const hero=rhiUxPageHero({
      title:this.t(view==='overview'?'overview_title':view),
      description:this.t(view==='discovery'?'hero_settings':'hero_'+view),
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
    // A full-house editing session deserves the available iPad canvas, not
    // the marketing hero and separate read-only Settings cards.
    if(['settings','discovery'].includes(view)&&this._wholeHomeFlow&&this._optionsStep&&
        this._hass?.user?.is_admin===true)
      return `<section class='mm-page-whole-home'>${this.renderOptionsEditor()}</section>`;
    const hero=this.hero(view);
    if(!model.ready){
      // A first-time installer must be able to reach the authoritative
      // Options Flow even before any room sensor exists.
      const firstSetup=view==='settings'&&this._hass?.user?.is_admin?
        this.settings({rooms:[]}):view==='discovery'&&this._hass?.user?.is_admin?
        this.discovery({rooms:[]}):view==='insights'?this.insights({rooms:[]}):
        view==='activities'&&this._hass?.user?.is_admin?
        this.activities({rooms:[]}):'';
      const editor=''; // Editors live exclusively in Settings and its configuration workspaces.
      return rhiUxPageTemplate({hero,content:editor+this.unavailable(model)+firstSetup});
    }
    // Object statuses belong beside the activity/device, not in a duplicate
    // top-level KPI strip occupying the resident's first viewport.
    const status='';
    const content={
      overview:()=>this.overview(model),rooms:()=>this.rooms(model,roomId),activities:()=>this.activities(model),
      settings:()=>this.settings(model),discovery:()=>this.discovery(model),insights:()=>this.insights(model),
      devices:()=>this.devices(model),diagnostics:()=>this.diagnostics(model,roomId),
    }[view]||(()=>this.overview(model));
    // A compact object locator, not another dashboard or repeated status KPI.
    // The object is preserved across operational, configuration and D4 tabs.
    const selectedRoom=model.rooms.find(room=>room.id===roomId);
    const context=selectedRoom&&['settings','discovery','insights','diagnostics','devices','activities'].includes(view)?
      `<nav class="mm-object-context" aria-label="${this.t('room')}">
        <span class="mm-object-context-name"><ha-icon icon="mdi:home-outline"></ha-icon>
          ${rhiUxEscape(selectedRoom.name)}</span>
        <span class="mm-object-context-status">${rhiUxEscape(rhiMmRoomStatus(selectedRoom,this._hass))}</span>
        <button type="button" class="mm-link" data-nav="overview"
          data-room="${rhiUxEscape(selectedRoom.id)}">${this.t('room_control')}</button>
      </nav>`:'';
    const editor=''; // Editors live exclusively in Settings and its configuration workspaces.
    return rhiUxPageTemplate({hero,status,content:context+editor+(model.unavailable?`<p role="status" class="mm-room-error">${this.t('partial_rooms')}</p>`:'')+content(),className:'mm-page'});
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
    // Activity buttons are direct Start/Switch intents, not a separate
    // Start/Stop mini-form. The native engine remains the only physical writer.
    const current=activities.find(a=>a.id===room.activity_id);
    const focus=current||activities.find(a=>!a.available)||activities[0];
    const activityButtons=activities.map(a=>{
      const active=a.id===room.activity_id&&room.phase==='active'&&a.active===true;
      return `<button type='button' class='mm-activity-choice ${active?'active':''}'
        data-action='start_activity' data-room='${escape(room.id)}'
        data-activity='${escape(a.id)}' aria-pressed='${active}'
        ${rhiMmCanRun(room,'start_activity',a.id)?'':'disabled'}
        title='${escape(a.available?'':a.disabled_reason||this.t('unavailable'))}'>
        <ha-icon icon='${rhiMmActivityIcon(a.id)}'></ha-icon>
        <span>${escape(a.name)}${room.room_areas?.[a.room_area]?
          `<small class='mm-activity-room-area'>${escape(room.room_areas[a.room_area])}</small>`:''}</span></button>`;
    }).join('');
    const canStop=room.control_owner!=='harmony'&&rhiMmCanRun(room,'stop_activity');
    const stop=room.control_owner!=='harmony'?`<button type='button'
      class='mm-activity-choice mm-all-off' data-action='stop_activity'
      data-room='${escape(room.id)}' ${canStop?'':'disabled'}
      title='${escape(room.commands?.stop?.reason||'')}'
      aria-label='${this.t('all_off')}'><ha-icon icon='mdi:power'></ha-icon>
      <span>${this.t('all_off')}</span></button>`:'';
    const fix=rhiMmCanRun(room,'recover_activity')?`<button type='button'
      class='mm-activity-repair' data-action='recover_activity' data-room='${escape(room.id)}'>
      <ha-icon icon='mdi:wrench'></ha-icon>${this.t('repair_activity')}</button>`:'';
    const blocked=focus&&!focus.available?focus:null;
    const blockedDevice=blocked?(blocked.device_keys||[]).map(key=>room.devices.find(d=>d.key===key))
      .find(d=>d&&(!d.foundation_approved||!d.available)):null;
    const blockedHelp=blocked?`<p class='mm-room-error'>
      ${escape(blocked.disabled_reason||this.t('unavailable'))}</p>`+
      (blockedDevice&&this._hass?.user?.is_admin===true?
        `<button type='button' class='mm-source-repair' data-mm-settings-open='devices'
          data-room='${escape(room.id)}' data-device='${escape(blockedDevice.key)}'>
          ${this.t('source_repair_action')}</button>`:''):'';
    const focusedDetails=focus?`<details class='mm-activity-plan'
      data-persist='${escape(room.id+':activity:'+focus.id)}'
      ${this._expanded.has(room.id+':activity:'+focus.id)?'open':''}>
      <summary>${this.t('details')} · ${escape(focus.name)}</summary>
      <ol>${(focus.target_state?.targets||[]).map(target=>`<li>
        <strong>${escape(room.devices.find(d=>d.key===target.device_key)?.name||this.t('device_unavailable'))}</strong>
        ${this.t('settings_expected')}: ${escape(Array.isArray(target.expected)?target.expected.join(', '):target.expected??this.t('not_published'))}
        · ${this.t('target_actual')}: ${escape(target.actual??this.t('not_published'))}</li>`).join('')}
      ${(focus.script_steps||[]).map(step=>`<li>
        ${escape(String(step.index))}. ${escape(room.devices.find(d=>d.key===step.device_key)?.name||this.t('device_unavailable'))}
        · ${escape(this.t('script_action_'+step.action))}
        ${step.value!==undefined?' · '+escape(step.value):''}
        ${step.candidates?.length?' · '+escape(step.candidates.join(', ')):''}</li>`).join('')||
        (!focus.target_state?.targets?.length?`<li>${this.t('settings_no_steps')}</li>`:'')}</ol>
      </details>`:'';
    const renderDevice=d=>{
      const key=room.id+':device:'+d.key;
      const needsBinding=d.foundation_approved!==true;
      const unavailable=d.available!==true;
      const advanced=['play','pause','stop','previous','next','remote_key','sound_mode']
        .some(action=>d.controls?.[action]?.enabled===true);
      const nativeAction=this.nativeMediaPlayerAction(d,room);
      const stateLabel=needsBinding?this.t('media_needs_configuration'):
        unavailable?this.t('device_unavailable'):rhiMmStateLabel(this._hass,d.state);
      return `<div class="mm-cockpit-device ${needsBinding?'mm-device-unbound':''}">
        <div class="mm-cockpit-device-heading">
          <span>${rhiMmDeviceArt(d,this.t('illustrative_device_art'))}
            <b title="${escape(d.name)}">${escape(d.name)}</b></span>
          <small class="mm-cockpit-device-state">${escape(stateLabel)}</small>
        </div>
        ${needsBinding?
          `<div class="mm-device-native-fallback">${nativeAction}</div>`:
          this.roomDeviceBasicActions(room,d)}
        <details class="mm-cockpit-device-details" data-persist="${escape(key)}"
          ${this._expanded.has(key)?'open':''}>
          <summary>${this.t('details')}</summary>
          <div class="mm-cockpit-device-body">
            <small>${escape(rhiMmRoleLabel(this._hass,d.role))} ${d.shared?' · '+this.t('shared_source'):''}</small>
            ${!needsBinding?nativeAction:''}
            ${d.foundation_approved&&d.available&&d.media_title?
              `<p class="mm-device-nowplaying">${escape(d.media_title)}
                ${d.media_artist?' · '+escape(d.media_artist):''}
                ${d.source?' · '+escape(d.source):''}</p>`:''}
            ${advanced?this.roomManualControls({...room,activities:[],devices:[d]},true,false,'advanced'):''}
            ${this.productSpecifications(d)}
            ${Object.entries(d.controls||{}).filter(([,cap])=>cap?.enabled===false&&typeof cap.reason==='string')
              .map(([action,cap])=>`<small class="mm-muted">${escape(action)}: ${escape(cap.reason)}</small>`).join('')}
          </div>
        </details>
      </div>`;
    };
    // One optional Room Area groups distinct setups (e.g. Loewe and SIM)
    // without creating another HA Area, room, physical device or controller.
    const roomAreas=Object.entries(room.room_areas||{});
    const groupedDevices=roomAreas.map(([id,label])=>{
      const members=(room.devices||[]).filter(d=>d.room_area===id);
      return members.length?`<section class='mm-device-room-area'>
        <h4>${escape(label)}</h4>
        <div class='mm-device-area-members'>${members.map(renderDevice).join('')}</div>
      </section>`:'';
    }).join('');
    const ungrouped=(room.devices||[]).filter(d=>!room.room_areas?.[d.room_area]);
    const devices=roomAreas.length?
      groupedDevices+ungrouped.map(renderDevice).join(''):
      (room.devices||[]).map(renderDevice).join('');
    const unbound=(room.devices||[]).filter(d=>d.foundation_approved!==true);
    const bindingNotice=unbound.length?`<div class="mm-room-binding-notice" role="status">
      <ha-icon icon="mdi:link-variant-off"></ha-icon>
      <span><strong>${unbound.length} ${this.t('devices')}</strong> ·
        ${this.t('media_needs_configuration')}</span>
      ${this._hass?.user?.is_admin===true?
        `<button type="button" class="mm-source-repair"
          data-mm-option-action="complete_setup">${this.t('source_repair_action')}</button>`:''}
    </div>`:'';
    const remote=this.roomFocusedRemote(room);
    const remoteKey=room.id+':remote';
    return `<section class="mm-section mm-overview">
      <div class="mm-floor-room-select">${selector}
        <div class="mm-floor-room-buttons" role="group" aria-label="${this.t('room')}">${roomButtons}</div>
      </div>
      <div class="mm-cockpit">
        <article class="mm-surface mm-cockpit-activities"><h3>${this.t('activities')}</h3>
          <div class='mm-cockpit-activity-list'>${activityButtons||this.t('no_activities')}${stop}</div>
          <div class='mm-activity-status'><span>${escape(rhiMmRoomStatus(room,this._hass))}
            · ${escape(room.activity_name||this.t('no_activity'))}</span>${fix}</div>
          ${blockedHelp}${focusedDetails}
          ${this.feedback(room.id)}
        </article>
        <div class="mm-cockpit-controls">
          ${this.roomNowPlaying(room)}
          ${remote?`<details class="mm-cockpit-remote-fold" data-persist="${escape(remoteKey)}"
            ${this._expanded.has(remoteKey)?'open':''}>
            <summary>${this.t('remote_keys')} · ${escape(room.name)}</summary>${remote}</details>`:''}
        </div>
        <article class="mm-surface mm-cockpit-devices"><h3>${this.t('devices')}</h3>
          ${bindingNotice}${devices||this.t('no_devices')}</article>
      </div>
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
      <details class="mm-surface" data-persist="${escape(selected.id+':devices')}" ${this._expanded.has(selected.id+':devices')?'open':''}>
        <summary>${this.t('connected_devices')}</summary>
        ${this.roomDeviceDetails(selected)}${this.roomManualControls(selected)}${this.roomRoutes(selected)}
      </details>
      </section>`;
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
    const mapped=shortcutReady?(active?.button_map||[]).filter(button=>button.enabled===true).map(button=>
      `<button type="button" data-mm-shortcut="press_activity_button"
        data-room="${e(room.id)}" data-shortcut-key="${e(button.button)}"
        title="${e(button.button)} · ${e(room.devices.find(d=>d.key===button.device_key)?.name||this.t('unavailable'))}">
        ${e(this.t('activity_button_'+button.button).startsWith('activity_button_')?
          button.button.replaceAll('_',' '):this.t('activity_button_'+button.button))}</button>`).join(''):'';
    const macros=shortcutReady?(active?.macros||[]).filter(macro=>macro.enabled===true).map(macro=>
      `<button type="button" data-mm-shortcut="run_activity_macro"
        data-room="${e(room.id)}" data-shortcut-key="${e(macro.id)}">${e(macro.name)}</button>`).join(''):'';
    const shortcuts=mapped||macros?`<div class="mm-activity-shortcuts">
        <b>${this.t('settings_activity_shortcuts')}</b>
        <div class="mm-native-buttons">${mapped}${macros}</div>
        </div>`:'';
    if(!primary&&!audioPanel&&!shortcuts&&!buttons)return '';
    return `<article class="mm-surface mm-focused-remote" data-remote-room="${e(room.id)}">
      <div class="mm-heading"><h3>${this.t('remote_keys')} · ${e(room.name)}</h3></div>
      ${buttons}${primary}${audioPanel}${shortcuts}${missing}
      </article>`;
  }
  roomNowPlaying(room){
    // The backend owns media_focus and only publishes activity-eligible
    // native playback. This visual never discovers/rebinds an HA player.
    // Keep the central media experience present for HDMI-only and idle rooms.
    const e=rhiUxEscape,reported=room.now_playing||null,focus=room.media_focus||{};
    const player=reported?(room.devices||[]).find(d=>d.key===reported.device_key):null;
    // A stale native playback projection must not outlive its approval or
    // availability. Neither name nor visual can authorize a media source.
    const media=player?.foundation_approved===true&&player?.available===true?reported:null;
    const audio=(room.devices||[]).find(d=>d.key===room.audio?.device_key);
    const readyAudio=audio?.available===true&&audio?.foundation_approved===true;
    const enabled=action=>player?.foundation_approved===true&&
      player?.available===true&&player?.controls?.[action]?.enabled===true;
    const action=(name,icon)=>enabled(name)?`<button type='button' class='mm-media-action'
      data-device-action='${name}' data-room='${e(room.id)}' data-device='${e(player.key)}'
      aria-label='${e(player.name+' · '+this.t(name))}'>
      <ha-icon icon='${icon}'></ha-icon></button>`:'';
    const artwork=media?rhiMmNativeArtwork(media.picture):'';
    const audioKind=!!media&&(String(media.content_type||'').toLowerCase().includes('music')||
      !!media.artist||!!media.album);
    const validTimeline=!!media&&typeof media.position==='number'&&Number.isFinite(media.position)&&
      typeof media.duration==='number'&&Number.isFinite(media.duration)&&
      media.duration>0&&media.position>=0&&media.position<=media.duration;
    const seekable=validTimeline&&enabled('seek')&&Number.isFinite(player.controls.seek.max_seconds)&&media.duration<=player.controls.seek.max_seconds;
    const progress=validTimeline?`<div class='mm-media-progress'>
      ${seekable?`<input type='range' min='0' max='${media.duration}' step='any' value='${media.position}' data-device-input='seek' data-room='${e(room.id)}' data-device='${e(player.key)}' data-activity='${e(room.activity_id||'')}' aria-label='${e(this.t('seek'))}'/>`:`<progress max='${media.duration}' value='${media.position}' aria-label='${this.t('playback_progress')}'></progress>`}
      <span>${rhiMmPlaybackTime(media.position)} / ${rhiMmPlaybackTime(media.duration)}</span>
    </div>`:'';
    const audioVolume=readyAudio&&audio.controls?.volume?.enabled===true&&
      typeof audio.volume_level==='number'&&Number.isFinite(audio.volume_level)?
      `<label class='mm-media-volume'>${e(audio.name)} · ${this.t('volume')}
        ${Math.round(audio.volume_level*100)}%
        <input type='range' min='0' max='1' step='0.01'
          value='${audio.volume_level}' data-room='${e(room.id)}'
          data-device='${e(audio.key)}' data-device-input='volume'
          aria-label='${e(audio.name+' · '+this.t('volume'))}'></label>`:'';
    const muted=readyAudio&&audio.controls?.mute?.enabled===true&&
      typeof audio.is_volume_muted==='boolean'?
      `<button type='button' class='mm-media-action' data-device-action='mute'
        data-room='${e(room.id)}' data-device='${e(audio.key)}'
        data-value='${!audio.is_volume_muted}' aria-label='${e(this.t(audio.is_volume_muted?'unmute':'mute'))}'>
        <ha-icon icon='${audio.is_volume_muted?'mdi:volume-off':'mdi:volume-high'}'></ha-icon>
      </button>`:'';
    const transport=action('previous','mdi:skip-previous')+action('play','mdi:play')+
      action('pause','mdi:pause')+action('stop','mdi:stop')+action('next','mdi:skip-next');
    const devices=room.devices||[];
    const selectedActivity=(room.activities||[]).find(a=>a.id===room.activity_id);
    const cast=new Set(selectedActivity?.device_keys||[]);
    // A disabled optional room source cannot make a healthy active HDMI
    // activity look broken. Without an activity, show room-level setup truth.
    const relevant=cast.size?devices.filter(d=>cast.has(d.key)):devices;
    // Native HA More Info owns browse/play, including provider data and permissions.
    // Offer explicit named players before playback, never infer a media catalog.
    const browsePlayers=relevant.filter(d=>this.nativeBrowseAvailable(room,d));
    const nativePlayer=browsePlayers.length?
      browsePlayers.map(d=>this.nativeMediaPlayerAction(d,room,false,true)).join(''):
      player?this.nativeMediaPlayerAction(player,room,true):'';
    const needsApproval=relevant.some(d=>d.foundation_approved===false);
    const unavailable=relevant.some(d=>d.available===false);
    const runnable=relevant.some(d=>d.foundation_approved===true&&d.available===true&&
      Object.values(d.controls||{}).some(c=>c?.enabled===true));
    const idleState=needsApproval?this.t('media_needs_configuration'):
      unavailable?this.t('diag_device_unavailable'):
      runnable?this.t('media_ready'):this.t('no_playback');
    const blocked=!media&&(needsApproval||unavailable);
    const focusLabel=blocked?idleState:
      focus.device_name||room.activity_name||idleState;
    const sourceLabel=focus.source||media?.source||player?.source||'';
    const hasPlayback=!!media;
    const stateLabel=hasPlayback?rhiMmStateLabel(this._hass,media.state||player?.state):
      blocked?idleState:focus.kind==='source'?this.t('no_playback'):
      room.activity_name?rhiMmRoomStatus(room,this._hass):idleState;
    return `<article class='mm-surface mm-now-playing ${blocked?'mm-now-playing-blocked':''}' aria-label='${this.t('now_playing')}'>
      <div class='mm-media-head'><h3>${this.t('now_playing')}</h3>
        <span class='mm-media-state'>${e(stateLabel)}</span>
      </div>
      <div class='mm-media-stage ${audioKind?'mm-media-stage-audio':'mm-media-stage-video'}'>
        ${artwork?`<img class='mm-media-backdrop' src='${e(artwork)}'
          alt='' aria-hidden='true' loading='lazy' decoding='async'>
          <img class='mm-media-cover' src='${e(artwork)}'
          alt='${e(media?.title||this.t('media_artwork'))}' loading='lazy' decoding='async'>`:
          `<ha-icon icon='${hasPlayback?'mdi:music-circle-outline':
            room.activity_name?'mdi:television-play':'mdi:play-circle-outline'}'></ha-icon>`}
      </div>
      <div class='mm-media-copy'>
        <strong>${e(media?.title||focusLabel)}</strong>
        ${media?.artist?`<span>${e(media.artist)}</span>`:''}
        ${media?.album?`<small>${e(media.album)}</small>`:''}
        ${sourceLabel?`<small>${this.t('input')}: ${e(sourceLabel)}</small>`:''}
        ${!hasPlayback?`<small>${e(room.activity_name?
          this.t('media_no_source_metadata'):this.t('no_playback'))}</small>`:''}
      </div>
      ${progress}
      ${transport?`<div class='mm-media-transport'>${transport}</div>`:''}
      ${audioVolume||muted?`<div class='mm-media-audio'>${audioVolume}${muted}</div>`:''}
      ${nativePlayer?`<div class='mm-media-native'>${nativePlayer}</div>`:''}
    </article>`;
  }

  nativeBrowseAvailable(room,device){
    const state=this._hass?.states?.[device?.entity_id];
    const features=state?.attributes?.supported_features;
    const active=room.activities?.find(a=>a.id===room.activity_id&&a.active);
    // HA Core media player BROWSE_MEDIA and PLAY_MEDIA feature flags.
    return device?.foundation_approved===true&&device.available===true&&!device.external_owner&&
      room.control_owner!=='harmony'&&!['starting','stopping'].includes(room.phase)&&
      (!room.activity_id||!!active?.device_keys?.includes(device.key))&&
      /^media_player\.[a-z0-9_]+$/.test(device.entity_id||'')&&
      !!state&&!['unknown','unavailable','off'].includes(state.state)&&
      Number.isSafeInteger(features)&&features>=0&&
      (features&131072)!==0&&(features&512)!==0;
  }
  nativeMediaLinkCurrent(element,entityId){
    if(element?.isConnected===false||!/^media_player\.[a-z0-9_]+$/.test(entityId||'')||
       !this._hass?.states?.[entityId])return false;
    const roomId=element.getAttribute('data-native-room');
    if(!roomId)return true; // Native settings/discovery links keep native HA ownership.
    const route=this.currentRoute();
    if(!['overview','rooms'].includes(route.view)||(route.room&&route.room!==roomId))return false;
    const room=rhiMmRooms(this._hass).rooms?.find(r=>r.id===roomId);
    const key=element.getAttribute('data-native-device');
    const device=room?.devices?.find(d=>d.key===key);
    if(device?.entity_id!==entityId)return false;
    const activity=element.getAttribute('data-native-activity');
    if(element.getAttribute('data-native-browse')==='true')
      return (room.activity_id||'')===activity&&this.nativeBrowseAvailable(room,device);
    return activity==null||((room.activity_id||'')===activity&&room.now_playing?.device_key===key);
  }

  nativeMediaPlayerAction(device,room=null,playback=false,browse=false){
    // Reuse the actual Home Assistant media-player dialog as Basic does.
    // Never discover a new endpoint from entity names or invent an action.
    const id=device?.entity_id;
    if(typeof id!=='string'||!/^media_player\.[a-z0-9_]+$/.test(id)||
       !this._hass?.states?.[id])return '';
    const e=rhiUxEscape;
    const context=room?` data-native-room="${e(room.id)}" data-native-device="${e(device.key)}"${(playback||browse)?` data-native-activity="${e(room.activity_id||'')}"`:''}${browse?' data-native-browse="true"':''}`:'';
    const label=browse?this.t('native_browse')+' · '+device.name:this.t('native_device');
    return `<button type="button" class="mm-native-media-link" data-more-info="${e(id)}"${context}
      aria-label="${e(device.name+' · '+label)}">
      <ha-icon icon="${browse?'mdi:play-box-multiple-outline':'mdi:open-in-new'}"></ha-icon>${e(label)}</button>`;
  }
  roomDeviceBasicActions(room,device){
    // Direct basic controls use the same native capability-checked gateway.
    // Unknown power, source and volume capabilities remain disabled/absent.
    const e=rhiUxEscape,c=device.controls||{};
    const attrs=`data-room="${e(room.id)}" data-device="${e(device.key)}"`;
    const allowed=action=>device.foundation_approved===true&&c[action]?.enabled===true;
    const button=(action,label,icon,value)=>allowed(action)?`<button type="button" ${attrs}
      data-device-action="${action}" ${value===undefined?'':`data-value="${e(JSON.stringify(value))}"`}
      aria-label="${e(device.name+' · '+label)}">
      <ha-icon icon="${icon}"></ha-icon>${e(label)}</button>`:'';
    const harmony=room.control_owner==='harmony'&&room.harmony_controller===device.key;
    const harmonyOff=harmony&&c.harmony_activity?.options?.includes('PowerOff')?
      button('harmony_activity',this.t('off'),'mdi:power','PowerOff'):'';
    // One obvious HA-like TV power control, not a disappearing pair of icons.
    // Never manufacture a missing native power capability: a blocked button
    // explains the issue and leads admins to the exact device configuration.
    // Any actually offered device power action uses the SAME resident On/Off
    // control. The domain's power gateway chooses verified WoL when configured;
    // the card never exposes a second wake button or bypasses approval.
    const shouldShowPower=!!c.power_on||!!c.power_off||
      !!device.entity_id?.startsWith('media_player.')||
      device.role==='display'||device.concept==='display';
    const off=['off','unknown','unavailable'].includes(device.state);
    const powerAction=off?'power_on':'power_off';
    const powerLabel=this.t(off?'on':'off');
    const powerReady=allowed(powerAction);
    const powerReason=!device.foundation_approved?this.t('power_not_approved'):
      c[powerAction]?.reason||this.t('power_not_supported');
    const normalPower=shouldShowPower?`<div class='mm-device-power-row'>
      <button type='button' class='mm-device-power ${powerReady?'':'blocked'}'
        ${attrs} ${powerReady?`data-device-action='${powerAction}'`:'disabled'}
        aria-label='${e(device.name+' · '+powerLabel)}'
        title='${e(powerReady?device.state:powerReason)}'>
        <ha-icon icon='${off?'mdi:power':'mdi:power-off'}'></ha-icon>
        <span>${powerLabel}</span></button>
      ${!powerReady?`<small class='mm-device-power-reason'>${e(powerReason)}</small>
        ${this._hass?.user?.is_admin===true?`<button type='button' class='mm-source-repair'
          data-mm-settings-open='devices' data-room='${e(room.id)}'
          data-device='${e(device.key)}'>${this.t('source_repair_action')}</button>`:''}`:''}
    </div>`:'';
    const power=harmony?harmonyOff:normalPower;
    const sources=Array.isArray(c.source?.options)?c.source.options:[];
    const source=allowed('source')&&sources.length?`<label class="mm-device-basic-source">
      ${this.t('input')}<select ${attrs} data-device-input="source"
        aria-label="${e(device.name+' · '+this.t('input'))}"
        ${allowed('source')?'':`disabled title="${e(c.source?.reason||this.t('action_unavailable'))}"`}>
        <option value="" ${sources.includes(device.source)?'':'selected'}>${this.t('select')}</option>
        ${sources.map(value=>`<option value="${e(value)}" ${value===device.source?'selected':''}>${e(value)}</option>`).join('')}
      </select></label>`:'';
    const validLevel=typeof device.volume_level==='number'&&
      Number.isFinite(device.volume_level)&&device.volume_level>=0&&device.volume_level<=1;
    const slider=c.volume?.enabled===true?(validLevel?`<label class="mm-device-basic-volume">
      ${this.t('volume')} · ${Math.round(device.volume_level*100)}%
      <input type="range" min="0" max="1" step="0.01" value="${device.volume_level}"
        ${attrs} data-device-input="volume"
        aria-label="${e(device.name+' · '+this.t('volume'))}"
        ${allowed('volume')?'':`disabled title="${e(c.volume?.reason||this.t('action_unavailable'))}"`}>
      </label>`:`<small>${this.t('volume_unknown')}</small>`):'';
    const volumeButtons=(c.volume_down?button('volume_down',this.t('volume_down'),'mdi:volume-minus'):'')+
      (c.volume_up?button('volume_up',this.t('volume_up'),'mdi:volume-plus'):'');
    const mute=allowed('mute')&&typeof device.is_volume_muted==='boolean'?
      button('mute',device.is_volume_muted?this.t('unmute'):this.t('mute'),
        device.is_volume_muted?'mdi:volume-high':'mdi:volume-off',!device.is_volume_muted):'';
    const playback=(c.play?button('play',this.t('play'),'mdi:play'):'')+
      (c.pause?button('pause',this.t('pause'),'mdi:pause'):'');
    const owners=Array.isArray(device.reserved_by_rooms)?
      device.reserved_by_rooms.filter(r=>typeof r.name==='string'&&r.name.trim())
        .map(r=>e(r.name)).join(', '):'';
    if(!owners&&!power&&!source&&!slider&&!volumeButtons&&!mute&&!playback)return '';
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
      const button=(action,label,value)=>c[action]?.enabled===true?`<button type="button" ${attrs} data-device-action="${action}" ${value===undefined?'':`data-value="${escape(JSON.stringify(value))}"`} ${disabled(c[action])}>${escape(label)}</button>`:'';
      const options=(action,current)=>c[action]?.enabled===true&&Array.isArray(c[action].options)&&c[action].options.length?`<label>${labels[action]}<select ${attrs} data-device-input="${action}" ${disabled(c[action])}><option value="">${escape(current||this.t('select'))}</option>${c[action].options.map(v=>`<option value="${escape(v)}" ${v===current?'selected':''}>${escape(c[action].option_labels?.[v]||v)}</option>`).join('')}</select></label>`:'';
      const actions=part==='advanced'?['previous','stop','next']:
        focused?(part==='audio'?['volume_down','volume_up']:['power_on','power_off','previous','play','pause','stop','next',...(part==='all'?['volume_down','volume_up']:[])]):
        quick?['power_on','power_off','play','pause',...(!c.volume?['volume_down','volume_up']:[])]:['power_on','power_off','volume_down','volume_up','previous','play','pause','stop','next'];
      const buttons=actions.map(action=>button(action,labels[action])).join('');
      const volume=part!=='primary'&&part!=='advanced'&&c.volume?.enabled===true&&typeof d.volume_level==='number'?`<label>${this.t('volume')} ${Math.round(d.volume_level*100)}%<input type="range" min="0" max="1" step="0.01" value="${d.volume_level}" ${attrs} data-device-input="volume" ${disabled(c.volume)}></label>`:'';
      const mute=part!=='primary'&&part!=='advanced'&&typeof d.is_volume_muted==='boolean'?button('mute',d.is_volume_muted?this.t('unmute'):this.t('mute'),!d.is_volume_muted):'';
      const remote=part!=='audio'&&c.remote_key?.enabled===true?(()=>{
        const sections=rhiMmRemoteGroups(c.remote_key.options);
        const key=room.id+':'+d.key+':remote';
        const contextAttrs=`data-activity="${escape(room.activity_id||'')}" data-native-entity="${escape(d.entity_id||'')}"`;
        const renderKey=k=>{
          if(c.remote_key?.enabled!==true||!c.remote_key.options?.includes(k))return '';
          const name=k.replace(/^DPAD_/,'').toUpperCase();
          const icons={UP:'mdi:chevron-up',DOWN:'mdi:chevron-down',
            LEFT:'mdi:chevron-left',RIGHT:'mdi:chevron-right',
            ENTER:'mdi:checkbox-blank-circle-outline',SELECT:'mdi:checkbox-blank-circle-outline',
            OK:'mdi:checkbox-blank-circle-outline',CENTER:'mdi:checkbox-blank-circle-outline',
            HOME:'mdi:home-outline',BACK:'mdi:arrow-left',MENU:'mdi:menu',
            GUIDE:'mdi:television-guide',INFO:'mdi:information-outline',
            PLAY:'mdi:play',PAUSE:'mdi:pause',MUTE:'mdi:volume-off'};
          const label=['ENTER','SELECT','OK','CENTER'].includes(name)?'OK':name.replaceAll('_',' ');
          return `<button type="button" class="mm-remote-command" ${attrs} data-device-action="remote_key"
            data-value="${escape(JSON.stringify(k))}" ${contextAttrs}
            ${c.remote_hold?.enabled===true&&c.remote_hold.options?.includes(k)?'data-native-hold="true"':''}
            aria-label="${escape(d.name+' · '+label)}" title="${escape(label+(c.remote_hold?.enabled===true&&c.remote_hold.options?.includes(k)?' · '+this.t('remote_hold_hint'):''))}">
            ${icons[name]?`<ha-icon icon='${icons[name]}'></ha-icon>`:
              `<span>${escape(label)}</span>`}</button>`;
        };
        const main=sections.find(s=>s.name==='navigation');
        const position=k=>{
          const name=(k.startsWith('DPAD_')?k.slice(5):k).toLowerCase();
          return ['up','down','left','right'].includes(name)?name:
            ['enter','select','ok','center'].includes(name)?'ok':'extra';
        };
        const timed=['remote_hold','remote_repeat'].map(action=>{
          const cap=c[action];
          if(cap?.enabled!==true||!Array.isArray(cap.options)||!cap.options.length)return '';
          return `<label>${escape(this.t(action))}<select ${attrs} ${contextAttrs} data-device-input="${action}">
            <option value="">${escape(this.t('select'))}</option>${cap.options.map(k=>`<option value="${escape(k)}">${escape(k)}</option>`).join('')}</select></label>`;
        }).join('');
        const timedPanel=timed?`<details class="mm-remote-timed"><summary>${escape(this.t('remote_timed_actions'))}</summary>${timed}</details>`:'';
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
                  data-device="${escape(d.key)}" ${contextAttrs}>${this.t('remote_text_send')}</button></div>`:
              `<p class="mm-muted">${this.t('remote_text_unavailable')}</p>`):
            `${navigation}${media?`<div class="mm-native-buttons" role="group"
               aria-label="${this.t('remote_media')}">${media.keys.map(renderKey).join('')}</div>`:''}${extras}`;
          return selector+content+(chosen==='buttons'?timedPanel:'');
        }
        return `<details class="mm-remote" data-persist="${escape(key)}" ${this._expanded.has(key)?'open':''}><summary>${this.t('remote_keys')}</summary>${navigation}${extra}${timedPanel}</details>`;
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
  roomDeviceDetails(room){return `<article class="mm-surface"><h3>${this.t('connected_devices')}</h3><div class="mm-device-list">${room.devices.map(d=>`<div class="mm-device-row">${rhiMmDeviceArt(d,this.t('illustrative_device_art'))}<div><b>${rhiUxEscape(d.name)}</b>${d.product_profile?`<small>${this.t('verified_model')}: ${rhiUxEscape(d.product_profile.manufacturer)} ${rhiUxEscape(d.product_profile.model)}</small>`:''}<small>${rhiUxEscape(rhiMmRoleLabel(this._hass,d.role))} · ${rhiUxEscape(d.source||rhiMmStateLabel(this._hass,d.state))}${d.shared?' · '+this.t('shared_source'):''}${d.group_members?.length>1?' · '+this.t('grouped')+' ('+d.group_members.length+' '+this.t('players')+')':''}</small>${d.registered_location?.area_id?`<small>${this.t('native_area')}: ${rhiUxEscape(d.registered_location.area_name||d.registered_location.area_id)}${d.registered_location.area_id!==room.area_id?` · ${this.t('used_in')}: ${rhiUxEscape(room.name)}`:''}</small>`:''}${this.roomAvailableControls(d)}${this.deviceNotificationActions(d)}</div><span class="mm-phase ${d.available&&d.foundation_approved?'mm-phase-good':'mm-phase-warn'}">${d.available&&d.foundation_approved?this.t('connected'):this.t('attention')}</span>${this.nativeMediaPlayerAction(d,room)}</div>`).join('')}</div></article>`;}
  roomRoutes(room){
    const cec=room.activities.flatMap(activity=>(activity.cec_links||[]).map(link=>{
      const source=room.devices.find(d=>d.key===link.source)?.name||link.source;
      const target=room.devices.find(d=>d.key===link.target)?.name||link.target;
      return `<div class="mm-route"><b>${rhiUxEscape(activity.name)} · ${this.t('cec_activity')}</b>
        <span>${rhiUxEscape(source)} → ${rhiUxEscape(target)} · ${this.t('cec_skips')}:
        ${rhiUxEscape(link.skipped.join(', '))}</span></div>`;
    }));
    const steps=room.activities.flatMap(a=>a.routes.map(r=>({...r,activity:a.name})));return `<article class="mm-surface"><h3>${this.t('routes')}</h3>${steps.length||cec.length?`<div class="mm-device-list">${cec.join('')}${steps.map(r=>`<div class="mm-route"><b>${rhiUxEscape(r.activity)}</b><span>${rhiUxEscape(r.type)} · ${rhiUxEscape(r.target||r.selected||this.t('not_published'))}${r.status?` · ${rhiUxEscape(r.status)}`:''}</span></div>`).join('')}</div>`:rhiUxState({state:'empty',title:this.t('no_routes'),detail:this.t('route_help')})}</article>`;}
  discovery(model){
    if(this._optionsStep?.step_id==='complete_setup'&&this._hass?.user?.is_admin===true)
      return this.renderOptionsEditor();
    return `<section class="mm-surface mm-discovery-launch">
      <h3>Discover and assign devices</h3>
      <p>All supported native TVs, audio zones and players, with room-based
         filtering and bulk assignment. Configure WOL, HDMI-CEC, roles and
         native sources in one Review and Save.</p>
      ${this._hass?.user?.is_admin===true?
        '<button type="button" data-mm-option-action="complete_setup">Open device discovery</button>':
        '<p>Ask your Home Assistant administrator to configure devices.</p>'}
    </section>`;
  }
  settings(model){
    if(this._optionsStep?.step_id==='complete_setup'&&this._hass?.user?.is_admin===true)
      return this.renderOptionsEditor();
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
    const rememberedEntry=entries.find(item=>item.id===remembered);
    const contextualEntry=entries.find(item=>item.room.id===this._room);
    // Follow the selected room from Overview/Insights, unless an explicit
    // object choice within that same room is already remembered.
    const selected=(rememberedEntry&&(!this._room||rememberedEntry.room.id===this._room)?
      rememberedEntry:contextualEntry)||entries[0];
    const itemRows=entries.map(item=>`<button type="button" class="mm-settings-item ${selected?.id===item.id?'active':''}"
        data-mm-settings-pick="${esc(item.id)}" aria-pressed="${selected?.id===item.id}">
        <strong>${esc(item.label)}</strong><small>${esc(item.subtitle)}</small></button>`).join('');
    const classes=[
      ['locations',this.t('settings_floor_rooms')],
      ['devices',this.t('devices')],
      ['activities',this.t('activities')],
    ];
    const menu=classes.map(([key,label])=>`<button type="button"
      data-mm-settings-category="${esc(key)}"
      class="mm-settings-nav ${category===key?'active':''}" aria-pressed="${category===key}">
      ${esc(label)}</button>`).join('');
    const scopeButton=selected&&manage?`<button type="button" class="mm-settings-yaml"
      data-mm-option-action="expert_yaml" data-mm-option-room="${esc(selected.room.id)}"
      data-mm-option-scope="${esc(selected.scope)}" data-mm-option-id="${esc(selected.objectId)}">
      <ha-icon icon="mdi:code-tags"></ha-icon>${this.t('settings_yaml')}</button>`:'';
    const selectedActivity=selected?.activity;
    const selectedDevice=selected?.device;
    const stageBar=selectedActivity?`<nav class='mm-activity-wizard-stages'
      aria-label='${this.t('activity_wizard')}'>
      <button type='button' data-mm-activity-stage='devices'
        class='${this._activitySettingsStage==='devices'?'active':''}'
        aria-current='${this._activitySettingsStage==='devices'?'step':'false'}'>
        <b>1</b> ${this.t('choose_devices')}</button>
      <button type='button' data-mm-activity-stage='tune'
        class='${this._activitySettingsStage==='tune'?'active':''}'
        aria-current='${this._activitySettingsStage==='tune'?'step':'false'}'>
        <b>2</b> ${this.t('tune_actions')}</button></nav>`:'';
    const activityDeviceStage=selectedActivity?`<div class='mm-activity-device-stage'>
      <p class='mm-muted'>${this.t('choose_devices_help')}</p>
      ${(selected.room.devices||[]).map(device=>{
        const included=(selectedActivity.device_keys||[]).includes(device.key);
        const ready=device.foundation_approved===true;
        return `<div class='mm-device-choice ${included?'selected':''}'>
          <ha-icon icon='${included?'mdi:check-circle':'mdi:circle-outline'}'></ha-icon>
          <span><b>${esc(device.name)}</b><small>${esc(rhiMmRoleLabel(this._hass,device.role))}
            · ${esc(rhiMmStateLabel(this._hass,device.state))}</small></span>
          ${!ready?`<small class='mm-room-error'>${this.t('diag_not_selected')}</small>`:''}
        </div>`;
      }).join('')}
      ${manage?`<button type='button' class='mm-settings-edit-cast'
        data-mm-option-action='activity_devices' data-mm-option-room='${esc(selected.room.id)}'
        data-mm-option-activity='${esc(selectedActivity.id)}'>
        ${this.t('edit_activity_devices')}</button>`:''}
      <p class='mm-muted'>${this.t('activity_devices_saved_first')}</p>
    </div>`:'';

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
              ${manage&&kind==='steps'&&step.index>1?`<button type='button' class='mm-step-move'
                data-mm-option-action='script_step' data-mm-option-room='${esc(selected.room.id)}'
                data-mm-option-activity='${esc(selectedActivity.id)}' data-mm-option-phase='steps'
                data-mm-option-operation='up' data-mm-option-index='${step.index-1}'
                aria-label='${this.t('move_step_up')}'>
                <ha-icon icon='mdi:arrow-up'></ha-icon></button>`:''}
              ${manage&&kind==='steps'&&step.index<all.length?`<button type='button' class='mm-step-move'
                data-mm-option-action='script_step' data-mm-option-room='${esc(selected.room.id)}'
                data-mm-option-activity='${esc(selectedActivity.id)}' data-mm-option-phase='steps'
                data-mm-option-operation='down' data-mm-option-index='${step.index-1}'
                aria-label='${this.t('move_step_down')}'>
                <ha-icon icon='mdi:arrow-down'></ha-icon></button>`:''}
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
      selectedActivity?this._activitySettingsStage==='devices'?activityDeviceStage:`${script}
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
        ${!selectedDevice.foundation_approved?`<p class="mm-room-error">${esc(this.t('diag_not_selected'))}</p>
          <p class="mm-source-repair-hint">${esc(this.t('source_repair_hint'))}</p>`:'' }
        <p>${this.t('native_state')}: ${esc(rhiMmStateLabel(this._hass,selectedDevice.state))}</p>
        <p>HDMI-CEC: ${selectedDevice.hdmi_cec_enabled?this.t('enabled'):this.t('not_confirmed')}</p>
        <p>${this.t('settings_post_power_delay')}: ${esc(selectedDevice.post_power_on_delay_ms??0)} ms</p>
        ${this.roomAvailableControls(selectedDevice)}</div>
${manage?`<div class="mm-setup-actions"><button type="button" data-mm-option-action="complete_setup"
          data-mm-option-room="${esc(selected.room.id)}" data-mm-option-device="${esc(selected.objectId)}">${selectedDevice.foundation_approved?this.t('settings_device_native_settings'):this.t('source_repair_action')}</button>
          <button type="button" data-mm-option-action="edit_room"
          data-mm-option-room="${esc(selected.room.id)}">${this.t('setup_edit_devices')}</button>
        </div>`:''}`:
      `<div class="mm-settings-facts">
         <p>${this.t('room')}: ${esc(selected.room.name)}</p>
         <p>${this.t('floor_navigation')}: ${esc(selected.room.floor_name||this.t('not_published'))}</p>
         ${!selected.room.floor_name?`<p class='mm-source-repair-hint'>${esc(this.t('floor_missing_help'))}</p>`:''}
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
        ${manage?`<div class='mm-settings-primary-actions'>
          <button type='button' class='mm-settings-configure-all'
            data-mm-option-action='complete_setup'
            ${this._optionsStep||this._optionsBusy?'disabled':''}>
            <ha-icon icon='mdi:home-edit-outline'></ha-icon>${this.t('whole_home_setup')}</button>
          <button type="button" class="mm-settings-yaml mm-global-yaml"
            data-mm-option-action="yaml" ${this._optionsStep||this._optionsBusy?'disabled':''}>
            <ha-icon icon="mdi:code-tags"></ha-icon>${this.t('settings_edit_all_yaml')}</button>
        </div>`:''}</div>
      <div class="mm-settings-layout">
        <nav class="mm-settings-menu" aria-label="${this.t('settings')}">${menu}</nav>
        <div class="mm-settings-main">
          ${this._optionsStep||this._optionsBusy||this._optionsError?
            this.renderOptionsEditor():
            `<div class="mm-settings-heading"><h3>${esc(selected?.label||classes.find(c=>c[0]===category)?.[1]||'')}</h3>
              ${scopeButton}</div>
              ${stageBar}${add}
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
                ${d.product_profile?.identity_evidence==='exact_native_ha_device_registry'
                  ?`<small>${rhiUxEscape(d.product_profile.manufacturer)} · ${rhiUxEscape(d.product_profile.model)}</small>`:''}
              </div>
            </div>
            ${this.nativeMediaPlayerAction(d)}
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
    // A selected room leads its object workspace; the rest of the house
    // remains reachable, with attention first among the other rooms.
    const rooms=[...model.rooms].sort((a,b)=>
      Number(b.id===this._room)-Number(a.id===this._room)||
      Number(b.attention===true)-Number(a.attention===true)||
      String(a.name).localeCompare(String(b.name)));
    const cards=rooms.map(room=>{
      const target=room.target_state;
      const misses=(target?.targets||[]).filter(item=>item.status!=='observed');
      const offline=(room.devices||[]).filter(d=>d.available===false||d.foundation_approved===false);
      const unapproved=offline.filter(d=>d.foundation_approved===false);
      const unavailable=offline.filter(d=>d.foundation_approved===true&&d.available===false);
      const attention=room.attention===true;
      // A provider failure may contain internal keys and entity names.
      // Present a user explanation on D0; keep exact messages folded under
      // diagnostics where they remain useful as genuine source evidence.
      const affected=offline[0]||room.devices?.find(d=>d.key===misses[0]?.device_key);
      const invalidSelection=offline.find(d=>d.foundation_approved===false);
      const message=room.phase==='starting'||room.phase==='stopping'?
        this.t('waiting'):
        unapproved.length?`${unapproved.length} ${this.t('insights_devices_not_approved')}`:
        unavailable.length?`${unavailable.length} ${this.t('insights_devices_offline')}`:
        attention&&misses.length?`${affected?.name||room.name}: ${this.t('insights_target_mismatch')}`:
        attention?this.t('insights_attention'):
        this.t('insights_no_issue');
      const latest=room.last_attempt;
      const manage=this._hass?.user?.is_admin===true;
      const repairAction=invalidSelection&&manage?
        `<button type='button' data-mm-settings-open='devices'
          data-room='${esc(room.id)}' data-device='${esc(invalidSelection.key)}'>
          ${this.t('source_repair_action')}</button>`:'';
      // Source approval, offline native provider and incorrect AV route are
      // distinct faults with distinct exact-owning-object repair destinations.
      const nativeOffline=unavailable[0];
      const offlineAction=nativeOffline&&manage?
        `<button type='button' data-mm-settings-open='devices'
          data-room='${esc(room.id)}' data-device='${esc(nativeOffline.key)}'>
          ${this.t('insights_review_device')}</button>`:'';
      const mismatchActivities=(room.activities||[]).filter(a=>
        (!room.activity_id||a.id===room.activity_id)&&
        (a.routes||[]).some(route=>
          misses.some(item=>item.device_key===route.device_key)&&
          route.status&&!['confirmed','observed'].includes(route.status)));
      // More than one plausible route requires a human selection; do not
      // silently open an arbitrary activity or invent physical input identity.
      const mismatchedActivity=mismatchActivities.length===1?mismatchActivities[0]:null;
      const routeAction=misses.length&&mismatchedActivity&&manage?
        `<button type='button' data-mm-settings-open='activities'
          data-room='${esc(room.id)}' data-activity='${esc(mismatchedActivity.id)}'>
          ${this.t('insights_review_route')}</button>`:'';
      const more=room.id+':insights:details';
      const targeted=misses.map(item=>{
        const name=(room.devices||[]).find(d=>d.key===item.device_key)?.name||item.device_key;
        const expected=Array.isArray(item.expected)?item.expected.join(', '):item.expected;
        return `<div class="mm-insight-target"><b>${esc(name)}</b>
          <span>${this.t('settings_expected')}: ${esc(expected??this.t('not_published'))}</span>
          <span>${this.t('target_actual')}: ${esc(item.actual??this.t('not_published'))}</span></div>`;
      }).join('');
      const group=(rows,label)=>rows.length?`<div class="mm-insight-target">
        <b>${esc(label)} · ${rows.length}</b>
        <span>${esc(rows.map(d=>d.name).join(', '))}</span></div>`:'';
      const devices=group(unapproved,this.t('diag_not_selected'))+
        group(unavailable,this.t('diag_device_unavailable'));
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
        ${invalidSelection?`<p class='mm-source-repair-hint'>${esc(this.t('source_repair_hint'))}</p>`:''}
        ${!invalidSelection&&unavailable.length?`<p class='mm-source-repair-hint'>${esc(this.t('insights_native_offline_help'))}</p>`:''}
        ${!invalidSelection&&!unavailable.length&&misses.length?`<p class='mm-source-repair-hint'>${esc(this.t('insights_route_help'))}</p>`:''}
        <div class="mm-insight-actions">${repairAction}${offlineAction}${routeAction}${fix}
          <button type="button" data-nav="overview" data-room="${esc(room.id)}">
            ${this.t('insights_open_room')}</button>
          <button type="button" data-nav="diagnostics" data-room="${esc(room.id)}">
            ${this.t('diagnostics')}</button></div>
        ${this.feedback(room.id)}
        <details data-persist="${esc(more)}" ${this._expanded.has(more)?'open':''}>
          <summary>${this.t('insights_details')}</summary>
          ${latest?`<div class="mm-diag-status">
            <span>${this.t('last_attempt')}</span>
            <b>${esc(latest.kind||this.t('unknown'))} · ${esc(latest.result||this.t('unknown'))}</b>
            ${this._hass?.user?.is_admin===true&&latest.failed_at?`<small>${this.t('failed_step')}: ${esc(latest.failed_at)}</small>`:''}
          </div>`:''}
          ${room.last_control?`<div class="mm-diag-status">
            <span>${this.t('last_control')}</span>
            <b>${esc(room.last_control.action||this.t('unknown'))} · ${esc(room.last_control.result||this.t('unknown'))}</b></div>`:''}
          ${!open?`<div class="mm-insight-affected">${targeted}</div>`:''}
          ${this._hass?.user?.is_admin===true&&room.error?`<p class="mm-room-error">${esc(room.error)}</p>`:''}
          ${this._hass?.user?.is_admin===true?[...new Set(room.warnings||[])]
            .map(warning=>`<p class="mm-room-error">${esc(warning)}</p>`).join(''):''}
          ${(room.activities||[]).flatMap(a=>(a.routes||[]).map(route=>{
            const d=room.devices?.find(x=>x.key===route.device_key);
            return `<div class="mm-diag-route"><b>${esc(a.name)}</b>
                <span>${esc(d?.name||route.device_key||this.t('unavailable'))}
                · ${esc(route.type||this.t('unknown'))}</span>
                <small>${esc(route.status||this.t('unknown'))}</small></div>`;
          })).join('')}
        </details>
      </article>`;
    }).join('');
    return `<section class="mm-section mm-insights">
      <div class="mm-insights-list">${cards||rhiUxState({
        state:'empty',title:this.t('no_rooms'),detail:this.t('setup_help')})}</div>
    </section>`;
  }

  diagnostics(model,roomId=''){
    // Insights projects real runtime facts only: no synthetic availability,
    // historical averages, latency or counters. Expose route readback and
    // actionable recovery using the existing typed backend command.
    const escape=rhiUxEscape;
    const manage=this._hass?.user?.is_admin===true;
    const visible=roomId?model.rooms.filter(room=>room.id===roomId):model.rooms;
    const cards=visible.map(room=>{
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
      const latest=room.last_attempt;
      const trace=Array.isArray(latest?.trace)?latest.trace.slice(0,64):[];
      const traceRows=trace.map(item=>{
        const device=(room.devices||[]).find(row=>row.key===item.device_key);
        const number=Number.isInteger(item.index)&&item.index>0?String(item.index)+'. ':'';
        const stage=this.t('trace_phase_'+item.phase);
        const outcome=this.t('trace_result_'+item.result);
        const duration=typeof item.elapsed_ms==='number'&&Number.isFinite(item.elapsed_ms)&&item.elapsed_ms>=0?
          ' · '+Math.round(item.elapsed_ms)+' ms':'';
        return `<li><span class='mm-step-trace-action'>${escape(stage)} · ${escape(number)}${escape(device?.name||item.device_key||room.name)}
          · ${escape(String(item.action||this.t('unknown')).replaceAll('_',' '))}</span>
          <span class='mm-step-trace-result ${item.result==='failed'||item.result==='attention'?'mm-room-error':''}'>
            ${escape(outcome)}${duration}</span></li>`;
      }).join('');
      const traceDetail=trace.length?`<details class='mm-step-trace'
        data-persist='${escape(room.id+':diagnostics:trace')}'
        ${this._expanded.has(room.id+':diagnostics:trace')?'open':''}>
        <summary>${this.t('execution_trace')} · ${trace.length}</summary>
        <ol>${traceRows}</ol>
        ${latest.trace_truncated===true?`<p class='mm-muted'>${this.t('trace_truncated')}</p>`:''}
      </details>`:'';
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
        ${manage?traceDetail:''}
        ${room.last_control?`<div class="mm-diag-status"><span>${this.t('last_control')}</span><b>${escape(room.last_control.action)} · ${escape(room.last_control.result)}</b></div>`:''}
        ${manage&&room.error?`<p class="mm-room-error">${escape(room.error)}</p>`:''}
        ${manage&&room.warnings?.length?`<p class="mm-room-error">${[...new Set(room.warnings)].map(escape).join('; ')}</p>`:''}
        ${health?`<section class="mm-diag-explain"><h4>${this.t('diag_devices_attention')}</h4>${health}</section>`:''}
        ${routes.length?`<details class="mm-diag-explain" data-persist="${escape(room.id+':routes')}" ${this._expanded.has(room.id+':routes')?'open':''}>
          <summary>${this.t('routes')} (${routes.length})</summary>
          <div class="mm-diag-routes">${routeRows}</div></details>`:''}
        ${rhiMmCanRun(room,'recover_activity')?`<button type="button" class="mm-link mm-recover" data-room="${escape(room.id)}" data-action="recover_activity"><ha-icon icon="mdi:restore"></ha-icon>${this.t('recover')}</button>`:''}
        ${this.feedback(room.id)}
        ${manage?`<details data-persist="${escape(room.id)}:technical" ${this._expanded.has(room.id+':technical')?'open':''}>
          <summary>${this.t('technical')}</summary>
          <div class="mm-tech">${devices.map(d=>`<p><b>${escape(d.name)}</b>
              <small>${this.t('diag_asset_id')}: ${escape(d.asset_id||d.physical_id||this.t('not_published'))}</small>
              <small>visual_ref: ${escape(d.visual_ref||this.t('not_published'))} · ${escape(d.visual_status||'unknown')}</small>
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
        </details>`:''}
      </article>`;
    }).join('');
    return `<section class="mm-section"><div class="mm-heading"><div><h2>${this.t('runtime_diagnostics')}</h2><p>${this.t('diag_help')}</p></div>
      <button type="button" class="mm-link" data-nav="insights"
        ${roomId?`data-room="${escape(roomId)}"`:''}>${this.t('insights')}</button></div>
      ${manage?`<section class='mm-surface mm-selectable'><h3>Engineering evidence</h3><p>Export the actual Multimedia diagnostic record${roomId?' for this room':' for this installation'}. No native commands are sent.</p><button type='button' data-mm-diagnostic-export='${escape(roomId)}' ${this._diagnosticExport?.busy?'disabled':''}>${this._diagnosticExport?.busy?'Loading…':'Export diagnostics'}</button>
        ${this._diagnosticExport?.roomId===roomId&&this._diagnosticExport?.error?`<p role='alert'>Diagnostics could not be loaded. Use the native Home Assistant integration diagnostics if the API is unavailable.</p>`:''}
        ${this._diagnosticExport?.roomId===roomId&&this._diagnosticExport?.text?`<label>Diagnostic evidence<textarea readonly data-mm-diagnostics-text rows='12'>${escape(this._diagnosticExport.text)}</textarea></label><button type='button' data-mm-copy='diagnostics'>${rhiUxEscape(this.t('copy_diagnostics'))}</button><span data-mm-clipboard-status role='status'></span>`:''}</section>`:''}
      <div class="mm-diag-grid">${cards}</div></section>`;
  }
}

if(!customElements.get('homebrain-multimedia-card'))customElements.define('homebrain-multimedia-card',HomeBrainMultimediaCard);
window.customCards=window.customCards||[];
if(!window.customCards.some(card=>card.type==='homebrain-multimedia-card'))window.customCards.push({type:'homebrain-multimedia-card',name:'Robotix Multimedia',description:'Premium room/activity dashboard using native Multimedia room status.',preview:false});
