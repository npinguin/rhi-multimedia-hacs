/* Robotix Home Intelligence Multimedia UX v0.1.12; canonical RHI UX Core 1.6.4 */
(()=>{
'use strict';
const RHI_MM_CORE_CSS=":host,.rhi-ux-root{\n  --rhi-color-primary:#1467F5;\n  --rhi-color-primary-soft:#EAF3FF;\n  --rhi-color-text:#0F172A;\n  --rhi-color-muted:#64748B;\n  --rhi-color-muted-soft:#758399;\n  --rhi-color-line:#DCE5EF;\n  --rhi-color-line-soft:#EAF0F6;\n  --rhi-color-surface:#FFFFFF;\n  --rhi-color-surface-soft:#F8FAFC;\n  --rhi-color-ok:#22C55E;\n  --rhi-color-attention:#F59E0B;\n  --rhi-color-error:#B42318;\n  --rhi-color-unknown:#94A3B8;\n\n  --rhi-font-family:var(--ha-font-family-body,Roboto,Noto,sans-serif);\n  --rhi-font-family-mono:var(--ha-font-family-code,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);\n  --rhi-font-display:clamp(29px,2.55vw,42px);\n  --rhi-font-section:clamp(18px,1.4vw,22px);\n  --rhi-font-card:15px;\n  --rhi-font-body:12.5px;\n  --rhi-font-small:11px;\n  --rhi-font-label:10.5px;\n  --rhi-font-value:13px;\n  --rhi-font-diagnostic:10px;\n  --rhi-weight-regular:400;\n  --rhi-weight-medium:500;\n  --rhi-weight-strong:600;\n  --rhi-line-height-tight:1.15;\n  --rhi-line-height-body:1.42;\n\n  --rhi-space-1:4px;\n  --rhi-space-2:7px;\n  --rhi-space-3:10px;\n  --rhi-space-4:14px;\n  --rhi-space-5:18px;\n  --rhi-space-6:24px;\n  --rhi-radius-sm:9px;\n  --rhi-radius-md:12px;\n  --rhi-radius-lg:16px;\n  --rhi-radius-xl:20px;\n  --rhi-shadow-sm:0 4px 14px rgba(21,61,115,.025);\n  --rhi-shadow-md:0 7px 20px rgba(15,35,80,.035);\n  --rhi-page-max:1640px;\n  --rhi-page-pad-x:24px;\n  --rhi-page-pad-y:14px;\n  --rhi-control-h:38px;\n  --rhi-icon-action:18px;\n  --rhi-icon-status:24px;\n  --rhi-break-phone:430px;\n  --rhi-break-tablet:760px;\n  --rhi-break-desktop:1024px;\n  --rhi-domain-accent:var(--rhi-color-primary);\n\n  color:var(--rhi-color-text);\n  font-family:var(--rhi-font-family);\n  font-size:var(--rhi-font-body);\n  font-weight:var(--rhi-weight-regular);\n  line-height:var(--rhi-line-height-body);\n}\n\n.rhiUxDomainShell{\n  --rhi-nav-active-bg:var(--rhi-color-primary-soft);\n  --rhi-nav-active-border:#CFDEF1;\n  --rhi-nav-active-text:#0F4CA4;\n  position:relative;display:grid;grid-template-columns:minmax(0,1fr) clamp(190px,23%,280px);\n  width:100%;margin:0 0 12px;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-xl);\n  background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(249,251,254,.91));box-shadow:var(--rhi-shadow-md);overflow:hidden;\n}\n.rhiUxProductArea{min-width:0;overflow:hidden}\n.rhiUxDomainShellTop{min-height:68px;display:grid;grid-template-columns:minmax(168px,.52fr) minmax(0,1.48fr);align-items:center;gap:14px;padding:10px 22px 9px}\n.rhiUxDomainIdentity{display:grid;align-content:center;gap:2px;min-width:0;min-height:48px;padding:2px 0 0 4px}\n.rhiUxDomainIdentity span{font-size:13px;line-height:1.15;font-weight:var(--rhi-weight-regular);color:#58708F;white-space:nowrap}\n.rhiUxDomainIdentity strong{font-size:21px;line-height:1.03;letter-spacing:.045em;font-weight:var(--rhi-weight-strong);color:#0B467F;white-space:nowrap}\n.rhiUxModuleTabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;min-width:0}\n.rhiUxModuleTab,.rhiUxDomainTab{appearance:none;border:0;background:transparent;font:inherit;color:#53647D;cursor:pointer;white-space:nowrap}\n.rhiUxModuleTab{min-height:40px;border-radius:12px;padding:8px;font-size:12px;font-weight:var(--rhi-weight-medium)}\n.rhiUxModuleTab.active{background:var(--rhi-nav-active-bg);color:var(--rhi-nav-active-text);box-shadow:inset 0 0 0 1px var(--rhi-nav-active-border),0 6px 16px rgba(15,23,42,.035)}\n.rhiUxDomainShellBottom{padding:5px 22px 7px;border-top:1px solid var(--rhi-color-line-soft);background:rgba(255,255,255,.52);min-height:46px;box-sizing:border-box}\n.rhiUxDomainTabs{display:flex;align-items:center;gap:10px;min-height:34px;overflow-x:auto;scrollbar-width:none}\n.rhiUxDomainTabs::-webkit-scrollbar{display:none}\n.rhiUxDomainTab{flex:0 0 auto;min-height:34px;border-radius:11px;padding:7px 12px;font-size:11.5px;font-weight:var(--rhi-weight-medium);color:#5F6D80}\n.rhiUxDomainTab.active{background:var(--rhi-nav-active-bg);color:var(--rhi-nav-active-text);box-shadow:inset 0 0 0 1px var(--rhi-nav-active-border)}\n.rhiUxCompanyBrand{min-width:0;border-left:1px solid var(--rhi-color-line-soft);display:grid;place-items:center;padding:10px 16px;background:linear-gradient(180deg,rgba(252,254,255,.78),rgba(247,250,253,.58))}\n.rhiUxCompanyLogo{display:block;width:min(100%,250px);max-height:116px;line-height:0;overflow:hidden}\n.rhiUxCompanyLogo svg{display:block;width:100%;height:auto;max-height:116px;object-fit:contain;object-position:center}\n\n/* Canonical page stack: visual order is invariant across domains. */\n.rhiUxPageStack{display:flex;flex-direction:column}\n.rhiUxPageStack>.rhiUxPageHero{order:1}\n.rhiUxPageStack>.rhiUxStatusGrid{order:2}\n.rhiUxPageStack>.rhiUxQuickActionBar{order:3}\n\n/* Canonical page hero: image is one background layer, never a split side panel. */\n.rhiUxPageHero{\n  position:relative;display:block;height:146px;min-height:146px;overflow:hidden;\n  border:0;border-radius:var(--rhi-radius-lg);background:#fff;box-shadow:none;margin:0;\n}\n.rhiUxPageHeroCopy{\n  position:relative;z-index:4;width:min(48%,650px);max-width:none;padding:20px 18px 18px 22px;box-sizing:border-box;\n}\n.rhiUxPageHeroCopy>small{display:none}\n.rhiUxPageHeroCopy h1,.rhiUxPageHeroCopy h2{\n  margin:4px 0 8px;font-size:var(--rhi-font-display);line-height:1.02;letter-spacing:-.038em;\n  color:#0B1739;font-weight:var(--rhi-weight-strong);\n}\n.rhiUxPageHeroCopy p{\n  margin:0;max-width:520px;font-size:clamp(12.5px,1.05vw,15px);line-height:var(--rhi-line-height-body);\n  color:#536781;font-weight:var(--rhi-weight-regular);\n}\n.rhiUxPageHeroArt{position:absolute;z-index:1;inset:0 0 0 28%;display:block;overflow:hidden;pointer-events:none}\n.rhiUxPageHeroArt:before{\n  content:\"\";display:block;position:absolute;z-index:2;inset:0;\n  background:linear-gradient(90deg,#fff 0%,rgba(255,255,255,.95) 8%,rgba(255,255,255,.62) 19%,rgba(255,255,255,.10) 38%,rgba(255,255,255,0) 57%);\n}\n.rhiUxPageHeroArt img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 52%;transform:none}\n\n/* One canonical page status layer. */\n.rhiUxStatusGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:7px 0 0;padding:0;border:0;background:transparent;box-shadow:none}\n.rhiUxStatusItem{\n  min-width:0;min-height:68px;display:grid;grid-template-columns:44px minmax(0,1fr);gap:10px;align-items:center;\n  padding:10px 12px;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-md);background:#fff;box-shadow:var(--rhi-shadow-md);\n}\n.rhiUxStatusIcon{width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:#F0F5FC;color:#355D96;font-size:18px}\n.rhiUxStatusIcon ha-icon{--mdc-icon-size:var(--rhi-icon-status)}\n.rhiUxStatusCopy{min-width:0;display:block}\n.rhiUxStatusCopy small{display:block;margin:0 0 2px;color:#476487;font-size:var(--rhi-font-label);font-weight:var(--rhi-weight-medium);line-height:1.2}\n.rhiUxStatusCopy b{display:block;margin:0 0 2px;color:var(--rhi-color-text);font-size:clamp(14px,1.12vw,17px);font-weight:var(--rhi-weight-strong);line-height:1.12;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.rhiUxStatusCopy em{display:block;margin-top:2px;color:var(--rhi-color-muted);font-size:var(--rhi-font-small);font-style:normal;font-weight:var(--rhi-weight-regular);line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n\n/* Canonical page-level quick actions. */\n.rhiUxQuickActionBar,.rhiEnergyQuickActions,.rhi-top-actions{\n  min-height:48px;padding:5px 8px;margin:7px 0 0;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-md);\n  background:#fff;box-shadow:var(--rhi-shadow-sm);display:flex;align-items:center;gap:7px;flex-wrap:wrap;\n}\n.rhiUxQuickActionBar>small,.rhiEnergyQuickActions>small,.rhi-top-actions-title{\n  font-size:var(--rhi-font-label);letter-spacing:.10em;text-transform:uppercase;color:#476487;\n  font-weight:var(--rhi-weight-medium);margin-right:2px;white-space:nowrap;\n}\n.rhiUxQuickActions{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:0}\n.rhiUxQuickAction,.rhiUxQuickActionBar button,.rhiEnergyQuickActions .hiAction,.rhi-top-action{\n  height:36px;min-height:36px;border:1px solid #D6E0EB;border-radius:9px;background:#fff;color:#125DB7;\n  box-shadow:none;font:inherit;font-size:11.5px;font-weight:var(--rhi-weight-medium);padding:0 12px;\n  display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;white-space:nowrap;\n}\n.rhiUxQuickAction.primary,.rhiUxQuickActionBar button:first-of-type,.rhiEnergyQuickActions .hiAction:first-of-type,.rhi-top-action.primary{\n  background:var(--rhi-color-primary);border-color:var(--rhi-color-primary);color:#fff;\n}\n.rhiUxQuickAction:disabled,.rhiEnergyQuickActions .hiAction:disabled,.rhi-top-action:disabled{opacity:.46}\n\n/* Canonical body grammar. */\n.rhiUxDomainBody{font-family:var(--rhi-font-family);color:var(--rhi-color-text);font-size:var(--rhi-font-body);line-height:var(--rhi-line-height-body)}\n.rhiUxDomainBody button,.rhiUxDomainBody select,.rhiUxDomainBody input,.rhiUxDomainBody textarea{font-family:inherit}\n.rhiUxPanel,.rhiUxDomainBody .panel,.rhiUxDomainBody .info,.rhiUxDomainBody .summary,.rhiUxDomainBody .ov-panel{\n  border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-lg);background:var(--rhi-color-surface);box-shadow:var(--rhi-shadow-sm);\n}\n.rhiUxPanel{padding:14px 16px}\n.rhiUxDomainBody .panel h2,.rhiUxDomainBody .info h2,.rhiUxDomainBody .summary h2,.rhiUxDomainBody .ov-panel h2{\n  font-size:var(--rhi-font-section);font-weight:var(--rhi-weight-strong);line-height:var(--rhi-line-height-tight);letter-spacing:-.02em;color:var(--rhi-color-text);\n}\n.rhiUxDomainBody .panel h3,.rhiUxDomainBody .info h3,.rhiUxDomainBody .summary h3,.rhiUxDomainBody .ov-panel h3{\n  font-size:var(--rhi-font-card);font-weight:var(--rhi-weight-strong);line-height:1.2;color:var(--rhi-color-text);\n}\n.rhiUxDomainBody .panel p,.rhiUxDomainBody .info p,.rhiUxDomainBody .summary p,.rhiUxDomainBody .ov-panel p{\n  font-size:var(--rhi-font-body);font-weight:var(--rhi-weight-regular);line-height:var(--rhi-line-height-body);color:var(--rhi-color-muted);\n}\n.rhiUxDataList{display:grid;gap:6px}\n.rhiUxDataRow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:9px 10px;border:1px solid var(--rhi-color-line-soft);border-radius:var(--rhi-radius-sm);background:var(--rhi-color-surface-soft)}\n.rhiUxState{display:grid;gap:4px;padding:14px 16px;border:1px dashed var(--rhi-color-line);border-radius:var(--rhi-radius-md);background:var(--rhi-color-surface-soft);color:var(--rhi-color-muted)}\n.rhiUxState b{color:var(--rhi-color-text);font-size:13px}\n.rhiUxState[data-state=\"attention\"]{border-color:#F6D48C;background:#FFFBEB}\n.rhiUxState[data-state=\"error\"]{border-color:#F1B8B4;background:#FFF7F7}\n.rhiUxConclusion{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;margin:8px 0 0;padding:10px 12px;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-md);background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(247,250,252,.96))}\n.rhiUxConclusion small{font-size:var(--rhi-font-label);letter-spacing:.1em;text-transform:uppercase;color:var(--rhi-color-muted)}\n.rhiUxConclusion h2{font-size:var(--rhi-font-card);line-height:1.2;margin:1px 0 2px}\n.rhiUxConclusion p{font-size:var(--rhi-font-small);line-height:1.3;margin:0;color:var(--rhi-color-muted)}\n.rhiUxTechnicalFooter{display:flex;justify-content:center;flex-wrap:wrap;gap:4px 9px;margin:6px 0 0;padding:3px 2px 0;border-top:1px solid rgba(148,163,184,.20);color:#94A3B8;font-size:9px;line-height:1.2}\n.rhiUxTechnicalFooter span+span:before{content:\"·\";margin-right:9px;color:#CBD5E1}\n.rhiUxTechnicalFooter [data-severity=\"warning\"]{color:#B7791F;font-weight:var(--rhi-weight-strong)}\n.rhiUxTechnicalFooter [data-severity=\"error\"]{color:var(--rhi-color-error);font-weight:var(--rhi-weight-strong)}\n\n@media(max-width:1180px){\n  :host,.rhi-ux-root{--rhi-page-pad-x:18px}\n  .rhiUxPageHero{height:140px;min-height:140px}\n  .rhiUxPageHeroCopy{width:51%;padding:18px 14px 16px 18px}\n  .rhiUxPageHeroArt{inset:0 0 0 30%}\n  .rhiUxStatusItem{grid-template-columns:40px minmax(0,1fr);padding:9px 10px;min-height:66px}\n  .rhiUxStatusIcon{width:37px;height:37px}\n}\n@media(max-width:760px){\n  :host,.rhi-ux-root{--rhi-page-pad-x:10px;--rhi-page-pad-y:9px;--rhi-font-body:12px;--rhi-font-small:10.75px}\n  .rhiUxDomainShell{grid-template-columns:1fr}.rhiUxCompanyBrand{display:none}.rhiUxDomainShellTop{grid-template-columns:1fr;padding:10px 12px}.rhiUxDomainIdentity{min-height:auto}.rhiUxDomainShellBottom{padding:7px 12px 9px}\n  .rhiUxPageHero{height:128px;min-height:128px;border-radius:14px}\n  .rhiUxPageHeroCopy{width:59%;padding:18px 9px 16px 13px}\n  .rhiUxPageHeroCopy h1,.rhiUxPageHeroCopy h2{font-size:27px;letter-spacing:-.032em}\n  .rhiUxPageHeroCopy p{font-size:11px;line-height:1.32;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}\n  .rhiUxPageHeroArt{inset:0 0 0 34%}\n  .rhiUxStatusGrid{grid-template-columns:repeat(2,minmax(0,1fr))}\n  .rhiUxStatusItem{min-height:74px;grid-template-columns:34px minmax(0,1fr);gap:7px;padding:8px}\n  .rhiUxStatusIcon{width:32px;height:32px;border-radius:9px}.rhiUxStatusIcon ha-icon{--mdc-icon-size:20px}\n  .rhiUxQuickActionBar,.rhiEnergyQuickActions,.rhi-top-actions{overflow-x:auto;flex-wrap:nowrap}\n  .rhiUxQuickActionBar>small,.rhiEnergyQuickActions>small,.rhi-top-actions-title,.rhiUxQuickAction,.rhiUxQuickActionBar button,.rhiEnergyQuickActions .hiAction,.rhi-top-action{flex:0 0 auto}\n  .rhiUxConclusion{grid-template-columns:1fr}\n}\n@media(max-width:430px){\n  :host,.rhi-ux-root{--rhi-page-pad-x:8px;--rhi-page-pad-y:8px}\n  .rhiUxPageHero{height:118px;min-height:118px}\n  .rhiUxPageHeroCopy{width:64%;padding:16px 8px 14px 11px}\n  .rhiUxPageHeroCopy h1,.rhiUxPageHeroCopy h2{font-size:24px}\n  .rhiUxPageHeroCopy p{font-size:10.5px;-webkit-line-clamp:2}\n  .rhiUxPageHeroArt{inset:0 0 0 38%}\n  .rhiUxStatusGrid{grid-template-columns:1fr 1fr}\n}\n\n/* Optional body/section-scoped view and filter controls. */\n.rhiUxContextBar{\n  min-height:42px;padding:4px 7px;margin:0 0 8px;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-md);\n  background:#fff;box-shadow:var(--rhi-shadow-sm);display:flex;align-items:center;gap:7px;flex-wrap:wrap;\n}\n.rhiUxContextBar>small{\n  font-size:var(--rhi-font-label);letter-spacing:.10em;text-transform:uppercase;color:#476487;font-weight:var(--rhi-weight-medium);white-space:nowrap;\n}\n.rhiUxContextControls{display:flex;align-items:center;gap:6px;flex-wrap:wrap}\n.rhiUxContextControl{\n  min-height:32px;border:1px solid #D6E0EB;border-radius:9px;background:#fff;color:#355D96;font:inherit;font-size:11.5px;font-weight:var(--rhi-weight-medium);padding:0 11px;cursor:pointer;white-space:nowrap;\n}\n.rhiUxContextControl.active,.rhiUxContextControl[aria-pressed=\"true\"]{background:var(--rhi-color-primary-soft);border-color:#CFDEF1;color:#0F4CA4}\n.rhiUxContextControl:disabled{opacity:.46}\n@media(max-width:760px){.rhiUxContextBar{overflow-x:auto;flex-wrap:nowrap}.rhiUxContextBar>small,.rhiUxContextControls,.rhiUxContextControl{flex:0 0 auto}}\n\n/* Canonical cross-domain appearance picker. Domains own catalogs and persistence. */\n.rhiUxVisualPickerBackdrop{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.44);display:grid;place-items:center;padding:20px}\n.rhiUxVisualPickerPanel{width:min(920px,94vw);max-height:min(82vh,760px);overflow:hidden;background:#fff;border:1px solid var(--rhi-color-line);border-radius:20px;box-shadow:0 30px 80px rgba(15,23,42,.24);padding:16px;box-sizing:border-box;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto auto;gap:10px}\n.rhiUxVisualPickerHead{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;min-height:0}\n.rhiUxVisualPickerHead small{font-size:var(--rhi-font-label);font-weight:800;letter-spacing:.12em;color:#64748b}.rhiUxVisualPickerHead h3{margin:2px 0 0;font-size:20px}.rhiUxVisualPickerHead p{margin:3px 0 0;font-size:11px;color:#64748b}\n.rhiUxVisualPickerFilters{display:flex;gap:6px;flex-wrap:wrap;margin:0;min-height:0}\n.rhiUxVisualPickerFilters button{border:1px solid #dbe3ee;background:#fff;border-radius:999px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer}.rhiUxVisualPickerFilters button.selected{border-color:#93c5fd;background:#eff6ff;color:#1d4ed8}\n.rhiUxVisualChoiceGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:142px;gap:8px;margin:0;overflow-y:auto;overscroll-behavior:contain;padding:2px 3px 4px 1px;align-content:start}\n.rhiUxVisualChoice{height:142px;min-height:142px;max-height:142px;display:grid;grid-template-rows:86px minmax(0,1fr);gap:6px;align-items:stretch;text-align:left;border:1px solid #e2e8f0;background:#fff;border-radius:12px;padding:8px;cursor:pointer;overflow:hidden}.rhiUxVisualChoice:hover{border-color:#93c5fd;background:#f8fbff}.rhiUxVisualChoice.selected{border-color:#2563eb;box-shadow:0 0 0 2px rgba(37,99,235,.12);background:#f8fbff}\n.rhiUxVisualChoiceImage{width:100%;height:86px;min-width:0;min-height:86px;max-width:none;max-height:86px;display:grid;place-items:center;overflow:hidden}.rhiUxVisualChoiceImage img{display:block;width:100%;height:100%;min-width:0;min-height:0;max-width:100%;max-height:100%;object-fit:contain;object-position:center}\n.rhiUxVisualChoiceCopy{min-width:0;align-self:end}.rhiUxVisualChoiceCopy small,.rhiUxVisualChoiceCopy b,.rhiUxVisualChoiceCopy em{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rhiUxVisualChoiceCopy small{font-size:var(--rhi-font-label);color:#64748b;text-transform:uppercase}.rhiUxVisualChoiceCopy b{font-size:12px;margin-top:1px}.rhiUxVisualChoiceCopy em{font-size:var(--rhi-font-small);color:#64748b;font-style:normal;margin-top:1px}\n.rhiUxVisualPickerRefine{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:8px;margin:0}.rhiUxVisualPickerRefine label span{display:block;font-size:var(--rhi-font-label);color:#64748b;margin-bottom:3px}.rhiUxVisualPickerRefine select{width:100%;height:34px;border:1px solid #dbe3ee;border-radius:8px;background:#fff;padding:0 8px}\n.rhiUxVisualPickerFooter{display:flex;align-items:center;gap:8px;margin:0;padding-top:9px;border-top:1px solid #edf1f6}.rhiUxVisualPickerSpacer{flex:1}.rhiUxVisualPickerFooter button{height:34px;border:1px solid #dbe3ee;border-radius:9px;background:#fff;padding:0 12px;font-size:var(--rhi-font-small);font-weight:700}.rhiUxVisualPickerFooter button.primary{background:#0b65ea;color:#fff;border-color:#0b65ea}.rhiUxVisualPickerFooter button:disabled{opacity:.45}\n@media(max-width:900px){.rhiUxVisualChoiceGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}\n@media(max-width:560px){.rhiUxVisualPickerBackdrop{padding:8px}.rhiUxVisualPickerPanel{width:96vw;max-height:88vh;padding:12px}.rhiUxVisualChoiceGrid{grid-template-columns:1fr;grid-auto-rows:116px}.rhiUxVisualChoice{height:116px;min-height:116px;max-height:116px;grid-template-columns:94px minmax(0,1fr);grid-template-rows:1fr}.rhiUxVisualChoiceImage{width:94px;height:86px;min-width:94px;max-width:94px}.rhiUxVisualChoiceCopy{align-self:center}.rhiUxVisualPickerRefine{grid-template-columns:1fr 1fr}.rhiUxVisualPickerFooter{flex-wrap:wrap}}\n\n\n/* Canonical page and asset composition primitives. */\n.rhiUxPage{display:block;width:100%;max-width:var(--rhi-page-max);margin:0 auto;padding:var(--rhi-page-pad-y) var(--rhi-page-pad-x);box-sizing:border-box}\n.rhiUxPageContent{display:grid;gap:var(--rhi-space-3);margin-top:var(--rhi-space-3)}\n.rhiUxAssetCardShell{display:grid;gap:var(--rhi-space-3);min-width:0;padding:12px;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-lg);background:var(--rhi-color-surface);box-shadow:var(--rhi-shadow-sm)}\n.rhiUxAssetCardIdentity,.rhiUxAssetCardFacts,.rhiUxAssetCardRelationships,.rhiUxAssetCardActions,.rhiUxAssetCardDetails,.rhiUxAssetCardFeedback{min-width:0}\n.rhiUxAssetCardRelationships{display:grid;gap:var(--rhi-space-2)}\n.rhiUxAssetCardActions{display:flex;align-items:center;gap:var(--rhi-space-2);flex-wrap:wrap}\n.rhiUxAssetCardDetails:empty,.rhiUxAssetCardFeedback:empty{display:none}\n.rhiUxAssetIdentity{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center;min-width:0}\n.rhiUxAssetVisual{width:72px;height:58px;display:grid;place-items:center;overflow:hidden}\n.rhiUxAssetVisual img{display:block;width:100%;height:100%;object-fit:contain}\n.rhiUxAssetIdentityCopy{min-width:0}.rhiUxAssetIdentityCopy small{display:block;color:var(--rhi-color-muted);font-size:var(--rhi-font-label);text-transform:uppercase;letter-spacing:.08em}\n.rhiUxAssetIdentityCopy h2{margin:2px 0;font-size:var(--rhi-font-section);line-height:1.12}.rhiUxAssetIdentityCopy p{margin:0;color:var(--rhi-color-muted);font-size:var(--rhi-font-body)}\n.rhiUxAssetFactGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--rhi-space-2)}\n.rhiUxAssetFact{min-width:0;padding:9px 10px;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-md);background:var(--rhi-color-surface)}\n.rhiUxAssetFact small,.rhiUxAssetFact b,.rhiUxAssetFact span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.rhiUxAssetFact small{font-size:var(--rhi-font-label);color:var(--rhi-color-muted)}.rhiUxAssetFact b{margin-top:2px;font-size:13px}.rhiUxAssetFact span{margin-top:2px;font-size:var(--rhi-font-small);color:var(--rhi-color-muted)}\n.rhiUxAssetRelationship{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 10px;border:1px solid var(--rhi-color-line-soft);border-radius:var(--rhi-radius-md);background:var(--rhi-color-surface-soft)}\n.rhiUxAssetRelationship small,.rhiUxAssetRelationship b,.rhiUxAssetRelationship span{display:block}.rhiUxAssetRelationship small,.rhiUxAssetRelationship span{color:var(--rhi-color-muted);font-size:var(--rhi-font-small)}\n.rhiUxAssetDisclosure{border-top:1px solid var(--rhi-color-line-soft);padding-top:8px}.rhiUxAssetDisclosure summary{cursor:pointer;font-weight:var(--rhi-weight-medium)}\n.rhiUxAssetDisclosure>div{padding-top:8px}\n.rhiUxWriteFeedback{margin-top:6px;font-size:var(--rhi-font-small);color:var(--rhi-color-muted)}.rhiUxWriteFeedback[data-state=\"success\"]{color:#15803D}.rhiUxWriteFeedback[data-state=\"error\"]{color:var(--rhi-color-error)}\n@media(max-width:760px){.rhiUxAssetCardShell{padding:10px}.rhiUxAssetFactGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}\n@media(max-width:430px){.rhiUxAssetCardShell{gap:var(--rhi-space-2);padding:9px}.rhiUxAssetFactGrid{grid-template-columns:1fr 1fr}}\n\n\n/* Compact asset grammar. Opt-in: existing page heroes, navigation and panels are unchanged.\n   Domains own asset facts and relationships; Core only lays out their presentation. */\n.rhiUxAssetRow{\n  display:grid;grid-template-columns:52px minmax(0,1fr) minmax(76px,max-content) auto;\n  align-items:center;gap:10px;min-width:0;padding:8px 10px;\n  border-bottom:1px solid var(--rhi-color-line-soft);\n}\n.rhiUxAssetRow:last-child{border-bottom:0}\n.rhiUxAssetImage{\n  display:flex;align-items:center;justify-content:center;width:52px;height:52px;\n  border-radius:var(--rhi-radius-sm);background:var(--rhi-color-surface-soft);overflow:hidden;\n}\n.rhiUxAssetImage img{display:block;width:100%;height:100%;object-fit:contain}\n.rhiUxAssetRowIdentity{display:grid;gap:3px;min-width:0}\n.rhiUxAssetName{font-weight:var(--rhi-weight-strong);overflow-wrap:anywhere}\n.rhiUxAssetContext,.rhiUxAssetRowRelationship{font-size:var(--rhi-font-small);color:var(--rhi-color-muted);line-height:1.25}\n.rhiUxAssetRowRelationship .rhiUxAssetRelationshipLink{color:var(--rhi-color-primary);text-decoration:underline;text-underline-offset:2px}\n.rhiUxAssetRowRelationship .rhiUxAssetRelationshipLink:focus-visible{outline:2px solid var(--rhi-color-primary);outline-offset:3px}\n.rhiUxAssetLive{display:grid;justify-items:end;gap:3px;text-align:right;min-width:76px}\n.rhiUxAssetPower{font-size:var(--rhi-font-card);font-weight:var(--rhi-weight-strong);font-variant-numeric:tabular-nums;white-space:nowrap}\n.rhiUxAssetState{font-size:var(--rhi-font-small);color:var(--rhi-color-muted)}\n.rhiUxAssetExpand{display:flex;align-items:center;justify-content:center;min-width:32px;min-height:36px}\n@media(max-width:430px){\n  .rhiUxAssetRow{grid-template-columns:42px minmax(0,1fr) minmax(64px,max-content) auto;gap:7px;padding:7px 5px}\n  .rhiUxAssetImage{width:42px;height:42px}\n  .rhiUxAssetLive{min-width:64px}\n}\n\n/* Opt-in time-series presentation: preserve domain-owned data, periods and charts. */\n.rhiUxChartPanel{min-width:0;padding:12px;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-lg);background:var(--rhi-color-surface)}\n.rhiUxChartHeader{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px}\n.rhiUxChartLegend{display:flex;align-items:center;gap:8px 14px;flex-wrap:wrap;font-size:var(--rhi-font-small);color:var(--rhi-color-muted)}\n.rhiUxChartViewport{width:100%;min-width:0;overflow-x:auto}\n.rhiUxChartViewport svg,.rhiUxChartViewport canvas{display:block;max-width:100%}\n.rhiUxChartEmpty{padding:20px 12px;text-align:center;color:var(--rhi-color-muted);font-size:var(--rhi-font-small)}\n@media(max-width:760px){.rhiUxChartPanel{padding:9px}.rhiUxChartHeader{align-items:flex-start}}\n";
const RHI_MM_DOMAIN_CSS=":host{display:block;min-width:0;background:#f5f7fb;color:var(--rhi-color-text);font-family:var(--rhi-font-family)}\nha-card{background:transparent;border:0;box-shadow:none;overflow:visible}\n.mm-shell{max-width:1290px;margin:auto;padding:12px 16px 20px}\n.mm-page{gap:0}.mm-page .rhiUxPageContent{margin-top:9px}\n.mm-shell .rhiUxDomainShell{margin-bottom:10px}\n/* Multimedia has three directly actionable modules and no second tab tier. */\n.mm-shell .rhiUxDomainShellBottom{display:none}\n.mm-native-media-link{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-height:40px;min-width:40px;padding:6px 9px;border:1px solid #d4e4f5;border-radius:9px;background:#f5f9ff;color:#175aa3;font:inherit;font-size:11px;font-weight:650;cursor:pointer}\n.mm-native-media-link ha-icon{--mdc-icon-size:17px}\n.mm-native-media-link:focus-visible{outline:2px solid #1267be;outline-offset:2px}\n.mm-cockpit-remote-fold{min-width:0;border:1px solid #dce6f0;border-radius:12px;padding:10px;background:#fff}\n.mm-cockpit-remote-fold>summary{cursor:pointer;min-height:36px;display:flex;align-items:center;font-size:12px;font-weight:650;color:#155ca6}\n.mm-cockpit-remote-fold .mm-focused-remote{margin:8px 0 0;border:0;box-shadow:none;padding:4px}\n.mm-shell .rhiUxPageHero{border-radius:17px}\n.mm-shell .rhiUxPageHeroArt:before{background:linear-gradient(90deg,#fff 0%,rgba(255,255,255,.94) 9%,rgba(255,255,255,.62) 28%,transparent 66%)}\n.mm-hero-frame{position:relative;min-width:0}\n.mm-hero-actions{position:absolute;z-index:5;right:16px;bottom:12px;display:flex;justify-content:flex-end;gap:6px;flex-wrap:wrap;max-width:95%}\n.mm-hero-settings{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-height:34px;padding:6px 9px;border-radius:9px;background:rgba(255,255,255,.94);border:1px solid #dce7f4;color:#155ca6;font-size:12px;font-weight:650;text-decoration:none;cursor:pointer;font-family:inherit}\n.mm-hero-settings ha-icon{--mdc-icon-size:17px}\n.mm-hero-settings:focus-visible{outline:2px solid #1267be;outline-offset:2px}\n@media(max-width:430px){.mm-hero-actions{right:7px;bottom:5px;gap:4px}.mm-hero-settings{min-height:30px;padding:4px 6px;font-size:10px}.mm-shell .rhiUxPageHeroCopy{padding-bottom:48px}}\n.mm-shell .rhiUxTechnicalFooter{margin:12px 0 0;opacity:.8}\n.mm-section{border:1px solid var(--rhi-color-line);border-radius:15px;padding:14px 15px;background:#fff;box-shadow:var(--rhi-shadow-md)}\n.mm-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:13px}.mm-heading h2{font-size:20px;margin:0 0 2px;font-weight:650}.mm-heading p{font-size:11px;margin:0;color:var(--rhi-color-muted)}\n.mm-room-grid,.mm-activities,.mm-diag-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}\n.mm-room-card,.mm-surface{min-width:0;background:#fff;border:1px solid #dce6f0;border-radius:14px;padding:14px;box-shadow:0 3px 10px rgba(15,35,80,.028)}\n.mm-room-head{display:flex;align-items:center;gap:10px}.mm-room-head>div{flex:1;min-width:0}.mm-room-head small,.mm-room-current small{display:block;color:#7084a1;font-weight:650;font-size:10px;letter-spacing:.08em}.mm-room-head h3{font-size:17px;margin:1px 0;font-weight:650}.mm-room-glyph,.mm-role{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:11px;background:#ecf4ff;color:#2266c3}.mm-room-glyph ha-icon{--mdc-icon-size:23px}\n.mm-phase{display:inline-flex;align-items:center;justify-content:center;font-size:10px;padding:6px 8px;white-space:nowrap;border-radius:100px;background:#f2f5f9;color:#58718d}.mm-phase-good{background:#edfaf2;color:#16864d}.mm-phase-warn{background:#fff3e8;color:#a76120}.mm-phase-idle{background:#f3f6fa;color:#68798e}\n.mm-room-current{margin:11px 0 9px;padding:10px 11px;background:#f7faff;border:1px solid #edf1f7;border-radius:9px;display:grid;gap:2px}.mm-room-current>b{font-size:15px;font-weight:650}.mm-room-current>span{color:#667891;font-size:11px}\n.mm-controls{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:10px}.mm-activity,.mm-room-foot button,.mm-room-picker button,.mm-link{display:inline-flex;align-items:center;gap:5px;background:white;border:1px solid #d9e4f2;color:#145bb1;border-radius:8px;min-height:33px;padding:5px 9px;cursor:pointer;font:inherit;font-size:11px;font-weight:600;line-height:1.25}.mm-activity ha-icon,.mm-room-foot ha-icon,.mm-link ha-icon{--mdc-icon-size:16px}.mm-activity.active,.mm-room-picker button.active{background:#eaf3ff;border-color:#b4d5ff;color:#1253a5}.mm-activity:not(:disabled):hover,.mm-link:hover,.mm-room-picker button:hover{background:#ecf4ff}.mm-activity:disabled,.mm-room-foot button:disabled{opacity:.40;cursor:not-allowed}.mm-room-foot{display:flex;gap:7px;align-items:center;margin-top:12px;border-top:1px solid #edf1f6;padding-top:11px}.mm-room-foot .mm-link{margin-left:auto}\n.mm-room-error{color:#a6352a;background:#fff5f3;border:1px solid #f4d8d3;border-radius:8px;padding:8px;font-size:11px;margin:8px 0 0;overflow-wrap:anywhere}.mm-nowplaying{display:flex;gap:7px;color:#516e91;font-size:11px;align-items:center}.mm-nowplaying ha-icon{--mdc-icon-size:17px}\n.mm-link{border:0;color:#1467f5;background:none}.mm-room-picker{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}.mm-detail-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:10px}.mm-detail-grid>div{min-width:0;display:flex;flex-direction:column;gap:10px}\n.mm-surface h3{font-size:16px;margin:0 0 13px;color:#10213d}.mm-surface>p{margin-top:9px}.mm-media-detail{display:flex;gap:12px;align-items:center}.mm-media-detail img{width:75px;height:70px;object-fit:cover;border-radius:9px}.mm-media-detail b{font-size:13px}.mm-media-detail p,.mm-media-detail small{color:#687d92;font-size:11px;margin:2px 0}.mm-audio-readback{display:flex;align-items:center;gap:8px;margin-top:11px;padding-top:9px;border-top:1px solid #edf1f5;color:#516e91;font-size:12px}\n.mm-device-list{display:grid;gap:6px}.mm-device-row{display:flex;gap:10px;align-items:center;border:1px solid #edf2f8;padding:8px;border-radius:9px}.mm-device-row>div{flex:1;min-width:0}.mm-device-row b{font-size:12px;display:block;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.mm-device-row small{font-size:10px;color:#6d829a;display:block}.mm-device-row button{border:0;background:none;color:#1467f5;cursor:pointer}.mm-device-row button ha-icon{--mdc-icon-size:17px}\n.mm-route{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #eaf0f8;padding:8px 0;font-size:11px}.mm-route span{color:#5d7591}.mm-device-table{display:grid;gap:0}.mm-table-head,.mm-table-row{display:grid;grid-template-columns:1.7fr 1.2fr 1fr .8fr;gap:12px;align-items:center;padding:11px 12px;border-bottom:1px solid #e8eff7}.mm-table-head{font-size:10px;text-transform:uppercase;letter-spacing:.04em;background:#f7faff;color:#627c9c}.mm-table-row{font-size:12px}.mm-table-row span{overflow-wrap:anywhere}\n.mm-diag-grid{align-items:start}.mm-diag-status{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid #eef3f9;font-size:11px}.mm-diag-status span{color:#5e718b}.mm-tech{font-size:10px;color:#65758b;overflow-wrap:anywhere}.mm-tech p{margin:5px 0}.mm-surface details{margin-top:11px;font-size:11px}.mm-surface summary{cursor:pointer;color:#1467f5;font-weight:600}\n.mm-callout{display:flex;align-items:flex-start;gap:12px;border:1px solid #d9e4f1;border-radius:12px;background:#fff;padding:18px}.mm-callout>ha-icon{color:#467bb8;--mdc-icon-size:28px}.mm-callout b{font-size:16px}.mm-callout p{font-size:12px;color:#61758e;margin:7px 0 0;line-height:1.5}.mm-attention{border-color:#ebd5af;background:#fffdf9}.mm-muted{color:#6e829b;font-size:11px}\n.mm-shell .rhiUxWriteFeedback{margin:0 0 11px}\n@media(max-width:1000px){.mm-room-grid,.mm-activities,.mm-diag-grid{grid-template-columns:1fr}.mm-detail-grid{grid-template-columns:1fr}}\n@media(max-width:760px){.mm-shell{padding:8px}.mm-section{padding:11px}.mm-shell .rhiUxPageHeroCopy{width:78%}.mm-room-head h3{font-size:15px}.mm-table-head,.mm-table-row{grid-template-columns:1.2fr 1fr .7fr}.mm-table-head span:last-child,.mm-table-row span:last-child{display:none}}\n@media(max-width:430px){.mm-shell .rhiUxPageHeroCopy{width:95%;padding-right:10px}.mm-activity,.mm-room-foot button{min-height:36px}.mm-room-foot{flex-wrap:wrap}.mm-room-foot .mm-link{margin-left:0}.mm-device-row .mm-phase{display:none}}\n\n.mm-native-controls{display:grid;gap:10px}.mm-native-device{display:grid;gap:8px;min-width:0;border-top:1px solid var(--rhi-color-line);padding-top:10px}.mm-native-device small{color:var(--rhi-color-muted)}.mm-native-buttons{display:flex;flex-wrap:wrap;gap:6px}.mm-native-buttons button,.mm-native-device select{min-height:36px;border:1px solid var(--rhi-color-line);border-radius:8px;background:var(--card-background-color,#fff);color:inherit;padding:6px 10px;font:inherit;max-width:100%}.mm-native-buttons button:disabled,.mm-native-device select:disabled{opacity:.5;cursor:not-allowed}.mm-native-device label{display:grid;gap:4px;font-size:12px}.mm-native-device input{max-width:100%;width:100%}.mm-native-device details{min-width:0}.mm-native-device summary{cursor:pointer;padding:6px 0}\n\n.mm-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 12px}.mm-title h2{font-size:20px;margin:0}.mm-title a{text-decoration:none}.mm-quick-controls{display:grid;gap:5px;margin-top:8px}.mm-quick-controls .mm-native-device{gap:5px}.mm-context{margin-top:10px}.mm-context-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:8px}.mm-context-item{border:1px solid var(--rhi-color-line);padding:8px;border-radius:8px;min-width:0}.mm-context-item button{min-height:44px;width:100%;border:0;border-radius:6px;background:transparent;color:inherit;text-align:left;font:inherit;font-weight:600;cursor:pointer}.mm-context-item button[aria-expanded=true]{background:#eaf3ff;color:#1253a5}.mm-context-item [data-mm-summary]{min-height:24px;overflow-wrap:anywhere;font-size:12px}.mm-context [data-mm-expanded]{margin-top:8px}.mm-room-card button,.mm-native-buttons button,.mm-native-device select,.mm-room-picker button{min-height:44px}.mm-shell button:focus-visible,.mm-shell a:focus-visible,.mm-shell input:focus-visible,.mm-shell select:focus-visible{outline:2px solid #1267be;outline-offset:2px}.mm-native-device label{font-size:13px}.mm-device-row button{min-width:44px;min-height:44px}.mm-native-device input[type=range]{min-height:44px}.mm-room-head h3,.mm-device-row b{overflow-wrap:anywhere;white-space:normal}.mm-phase{white-space:normal;text-align:center}\n\n.mm-remote{padding:2px 0}.mm-remote-navigation{display:grid;grid-template-columns:repeat(3,minmax(44px,60px));grid-template-rows:repeat(3,minmax(44px,auto));gap:6px;justify-content:center;margin:10px 0}.mm-remote-key{display:flex;min-width:0}.mm-remote-key button{width:100%;min-height:44px}.mm-remote-key-up{grid-area:1 / 2}.mm-remote-key-left{grid-area:2 / 1}.mm-remote-key-ok{grid-area:2 / 2}.mm-remote-key-right{grid-area:2 / 3}.mm-remote-key-down{grid-area:3 / 2}.mm-remote-key-extra{grid-column:span 3;justify-self:center;width:auto}.mm-remote>details{margin:5px 0 0;padding:4px 8px;background:var(--card-background-color,#fff);border:1px solid var(--rhi-color-line);border-radius:8px}.mm-remote>details summary{min-height:44px;display:flex;align-items:center}.mm-remote>details .mm-native-buttons{padding:6px 0}.mm-remote-key button:focus-visible,.mm-remote>details summary:focus-visible{outline:2px solid #1267be;outline-offset:2px}\n\n\n/* Compact room-first Premium overview. Actual room health/readback comes from\n   the backend; fold state is presentation-only and never changes commands. */\n.mm-floor-nav{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 14px}\n.mm-floor-nav button{display:inline-flex;gap:6px;align-items:center;min-height:42px;padding:7px 12px;border-radius:10px;background:#fff;color:#274d79;border:1px solid #dce6f2;font:inherit;font-size:12px;font-weight:650;cursor:pointer}\n.mm-floor-nav button.active{background:#e8f2ff;border-color:#9fc5f1;color:#135baa}\n.mm-floor-nav ha-icon{--mdc-icon-size:17px}\n.mm-room-stack{display:grid;grid-template-columns:1fr;gap:9px}\n.mm-compact-room{min-width:0;border:1px solid #dce6f0;border-radius:15px;background:#fff;box-shadow:0 3px 11px rgba(26,52,88,.04);overflow:hidden}\n.mm-compact-room[open]{border-color:#acc9ed;box-shadow:0 5px 19px rgba(21,73,125,.075)}\n.mm-room-needs-attention{border-color:#ecd2ad}\n.mm-compact-room>summary{list-style:none;cursor:pointer}\n.mm-compact-room>summary::-webkit-details-marker{display:none}\n.mm-compact-summary{display:grid;grid-template-columns:40px minmax(0,1fr) auto auto 18px;gap:10px;align-items:center;min-height:76px;padding:11px 14px}\n.mm-compact-identity{display:grid;min-width:0;gap:3px}\n.mm-compact-identity>b{font-size:15px;line-height:1.2;color:#152c48;overflow-wrap:anywhere}\n.mm-compact-identity>small{font-size:11px;color:#68809e;overflow-wrap:anywhere}\n.mm-compact-current{font-size:12px;font-weight:600;color:#315b88;overflow-wrap:anywhere}\n.mm-compact-count{display:inline-flex;align-items:center;gap:5px;color:#6b8199;font-size:11px;white-space:nowrap}\n.mm-compact-count ha-icon{--mdc-icon-size:17px}\n.mm-expand-icon{--mdc-icon-size:18px;color:#436e99;transition:transform .15s ease}\n.mm-compact-room[open]>.mm-compact-summary>.mm-expand-icon{transform:rotate(180deg)}\n.mm-compact-expanded{border-top:1px solid #edf1f7;padding:6px 14px 12px}\n.mm-compact-expanded .mm-controls{margin:7px 0 11px}\n.mm-compact-expanded .mm-room-foot{margin-top:10px;padding-top:9px}\n.mm-compact-devices{display:flex;flex-wrap:wrap;gap:7px}\n.mm-compact-device{display:inline-flex;align-items:center;gap:5px;max-width:100%;padding:5px 8px;border-radius:9px;background:#f4f8fc;border:1px solid #e7edf6;color:#34516e;font-size:11px;font-weight:600}\n.mm-compact-device ha-icon{--mdc-icon-size:16px;color:#338e80}\n.mm-compact-device small{font-size:10px;font-weight:400;color:#687c93}\n.mm-compact-device-warn{background:#fff7ef;border-color:#f1d9b7}\n.mm-compact-device-warn ha-icon{color:#b46d24}\n.mm-compact-error{margin-top:8px}.mm-compact-error summary{font-size:11px;color:#a55232}\n.mm-room-location{color:#647d98;font-size:12px;margin:0 0 13px}\n.mm-native-fold,.mm-routes-fold{padding:12px 14px}\n.mm-native-fold>summary,.mm-routes-fold>summary{font-size:14px;font-weight:650;color:#164e91;cursor:pointer;min-height:28px}\n.mm-native-fold[open]>.mm-native-controls,.mm-routes-fold[open]>.mm-device-list{margin-top:12px}\n.mm-setup-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}\n.mm-setup-room{min-width:0;border:1px solid #dce6f2;background:#fff;padding:13px;border-radius:14px}\n.mm-setup-head{display:flex;gap:9px;align-items:center;justify-content:space-between}\n.mm-setup-head h3{font-size:15px;margin:0 0 4px;color:#122f50}\n.mm-setup-caption{font-size:11px;color:#68819a}\n.mm-setup-activities{display:grid;gap:7px;margin:12px 0}\n.mm-setup-activity{display:grid;gap:4px;padding:9px 11px;border-radius:10px;border:1px solid #edf1f7;background:#f9fbfe}\n.mm-setup-activity b{font-size:12px;color:#193d65}\n.mm-setup-activity small{font-size:10px;color:#6e8197}\n.mm-setup-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:10px}\n.mm-setup-actions a{display:inline-flex;align-items:center;min-height:40px;gap:6px;border:1px solid #d4e3f3;border-radius:9px;padding:7px 10px;color:#1759a5;font-size:12px;text-decoration:none;font-weight:650}\n.mm-setup-actions a ha-icon{--mdc-icon-size:16px}\n.mm-setup-actions button{min-height:40px}\n.mm-overview .mm-heading{margin-bottom:11px}\n.mm-overview .mm-room-card{min-width:0}\n.mm-floor-nav button:focus-visible,.mm-compact-room>summary:focus-visible,.mm-setup-actions a:focus-visible{outline:2px solid #1267be;outline-offset:2px}\n@media(max-width:760px){.mm-setup-grid{grid-template-columns:1fr}.mm-compact-summary{grid-template-columns:35px minmax(0,1fr) auto 18px;gap:8px;padding:9px 10px}.mm-compact-count{display:none}.mm-compact-expanded{padding:6px 10px 11px}}\n@media(max-width:430px){.mm-floor-nav button{padding:6px 9px;font-size:11px}.mm-compact-summary{grid-template-columns:30px minmax(0,1fr) auto 14px;gap:6px}.mm-compact-summary .mm-room-glyph{width:30px;height:30px}.mm-compact-identity>b{font-size:13px}.mm-compact-current{font-size:11px}.mm-compact-summary .mm-phase{max-width:94px;font-size:9px;padding:5px 7px}.mm-compact-identity>small{font-size:10px}}\n\n/* Keep backend-confirmed attention visible on collapsed room cards. */\n.mm-compact-warning{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;color:#9d5429;font-size:11px;line-height:1.35;overflow-wrap:anywhere}\n\n/* Explain only native source/route readback; collapse secondary detail. */\n.mm-setup-devices{margin-top:7px;border-top:1px solid #edf1f7;padding-top:7px}\n.mm-setup-devices>summary{cursor:pointer;color:#506f8e;font-size:12px;min-height:32px;padding-top:5px}\n.mm-setup-device-list{display:flex;gap:6px;flex-wrap:wrap;padding:7px 0}\n.mm-setup-device{font-size:11px;background:#f3f7fc;color:#365574;padding:5px 8px;border-radius:8px}\n.mm-setup-device b{font-size:10px;text-transform:capitalize}\n.mm-setup-device small{color:#637993}\n.mm-setup-device-warn,.mm-diag-route-review{background:#fff7ee;color:#985d2d}\n.mm-diag-explain{margin:11px 0;padding:9px;border-radius:9px;border:1px solid #e4ecf5}\n.mm-diag-explain h4{font-size:12px;margin:0 0 7px}\n.mm-diag-explain>summary{cursor:pointer;font-weight:600;color:#24588b;min-height:30px}\n.mm-diag-routes{margin-top:8px}\n.mm-diag-route{display:grid;gap:3px;min-width:0;border-bottom:1px solid #ecf1f8;padding:7px;font-size:11px;overflow-wrap:anywhere}\n.mm-diag-route b{font-size:12px}.mm-diag-route small{color:#677f9a}\n.mm-recover{margin-top:11px;border:1px solid #d4e2f2}\n\n/* Server-owned Options Flow forms: one transient editor, no persisted UI config. */\n.mm-options-editor{margin:10px 0 15px;border-color:#b8d3f1;background:#fcfdff}\n.mm-options-editor h3{margin:0 0 8px}\n.mm-options-description{font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere;color:#4c637b;max-height:260px;overflow:auto}\n.mm-option-fields{display:grid;gap:12px;margin:14px 0}\n.mm-option-field{display:grid;gap:5px;font-size:12px;font-weight:600;color:#34506d;min-width:0}\n.mm-option-field input:not([type=checkbox]),.mm-option-field select,.mm-option-field textarea{min-height:44px;max-width:100%;width:100%;padding:8px 10px;border-radius:9px;border:1px solid #c8d8e9;background:#fff;color:#183654;font:inherit}\n.mm-option-field textarea.mm-option-yaml{min-height:210px;max-height:560px;resize:vertical;white-space:pre;overflow:auto;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;line-height:1.5}\n.mm-option-field{max-width:100%}.mm-table-asset{min-width:0;overflow-wrap:anywhere}\n.mm-device-detail{margin-top:8px}.mm-device-detail>summary{cursor:pointer;font-size:11px;color:#406486;min-height:28px;padding:5px 0}\n.mm-device-detail-content{display:grid;gap:9px;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));align-items:center;padding:8px;border-radius:12px;background:#faf7f3;border:1px solid #eee5dd;max-width:440px}\n.mm-device-detail-content .mm-device-art{width:min(100%,220px);height:auto;aspect-ratio:1/1;border-radius:12px}\n.mm-device-detail-content .mm-device-art img{width:100%;height:100%;object-fit:contain}\n.mm-device-detail-content strong{font-size:12px;overflow-wrap:anywhere}\n.mm-device-detail-content small{display:block;font-size:11px;color:#637993;margin-top:4px}\n.mm-device-identity{display:flex;align-items:center;gap:9px;min-width:0}.mm-device-identity ha-icon{--mdc-icon-size:27px;color:#547ca4;flex:none}.mm-device-identity>div{min-width:0;display:grid;gap:2px}.mm-device-identity small{display:block;font-size:10px;color:var(--rhi-color-muted);overflow-wrap:anywhere}\n.mm-device-art{display:inline-flex;align-items:center;justify-content:center;flex:none;width:72px;height:72px;overflow:hidden;border-radius:12px;background:#f3eee8;border:1px solid #e9e2d9}\n.mm-device-art img{display:block;width:100%;height:100%;object-fit:contain}\n.mm-device-art-neutral{background:#f1f5fa;color:#547ca4;border-color:#e1e9f3}\n.mm-device-art-neutral ha-icon{--mdc-icon-size:27px}\n.mm-device-identity>.mm-device-art{flex:none}\n.mm-activity-identity{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0}\n.mm-activity-identity>div:first-child{min-width:0}\n.mm-activity-identity small{display:block;overflow-wrap:anywhere}\n.mm-activity-visuals{display:flex;gap:4px;flex:none;max-width:46%;overflow:hidden}\n.mm-activity-visuals>.mm-device-art{width:38px;height:38px;border-radius:9px}\n.mm-activity-visuals>.mm-device-art-neutral ha-icon{--mdc-icon-size:20px}\n.mm-setup-device>.mm-device-art{width:30px;height:30px;vertical-align:middle;border-radius:7px;margin-right:6px}\n.mm-setup-device>.mm-device-art-neutral ha-icon{--mdc-icon-size:18px}\n@media(max-width:430px){.mm-device-art{width:44px;height:44px}.mm-activity-visuals{max-width:42%}.mm-activity-visuals>.mm-device-art{width:30px;height:30px}}\n\n.mm-option-field input[type=checkbox]{width:19px;height:19px}\n.mm-option-multiple{display:flex;flex-wrap:wrap;gap:7px;border:1px solid #dae5f1;border-radius:10px;padding:9px}\n.mm-option-multiple legend{font-size:12px;font-weight:650}\n.mm-option-multiple label{display:flex;align-items:center;gap:7px;padding:7px;border:1px solid #e4edf5;border-radius:8px;font-size:12px}\n.mm-options-editor .mm-setup-actions button,.mm-setup-activity .mm-setup-actions button,.mm-setup-room .mm-setup-actions button{min-height:40px;border:1px solid #c9dbef;border-radius:9px;padding:7px 10px;color:#205c99;background:#f8fbff;font:inherit;font-size:12px;cursor:pointer}\n.mm-options-editor .mm-setup-actions button:disabled{opacity:.45;cursor:not-allowed}\n.mm-setup-advanced{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap}\n.mm-setup-advanced summary{min-height:40px;display:flex;align-items:center;color:#43678c;font-size:12px;cursor:pointer;padding:7px}\n.mm-setup-advanced[open]{width:100%}\n.mm-options-editor textarea:focus-visible,.mm-options-editor button:focus-visible,.mm-options-editor input:focus-visible,.mm-options-editor select:focus-visible{outline:2px solid #1267be;outline-offset:2px}\n@media(max-width:430px){.mm-setup-actions{gap:4px}.mm-options-editor{padding:9px}.mm-options-description{max-height:190px}}\n\n/* Room picker and active remote are content-only, not shared shell overrides. */\n.mm-room-picker>button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:44px}\n.mm-room-picker>button small{font-size:10px;font-weight:400;opacity:.8}\n.mm-focused-remote{margin:10px 0}.mm-focused-remote .mm-native-device{padding:12px}\n.mm-focused-remote .mm-native-buttons button{min-height:44px;min-width:44px}\n.mm-focused-remote .mm-remote-navigation{max-width:270px;margin:10px auto}\n.mm-context-settings{margin:10px 0}\n.mm-context-settings>summary{cursor:pointer;padding:8px 0;min-height:36px}\n@media(max-width:760px){.mm-room-picker{flex-wrap:wrap}.mm-focused-remote .mm-native-buttons{flex-wrap:wrap}}\n\n/* Contextual content only; keep the established shared shell. */\n.mm-room-operate{align-self:flex-start;margin:0 8px 10px;min-height:36px}.mm-compact-summary>.mm-device-art{width:38px;height:38px}.mm-focused-remote .mm-native-buttons{gap:6px}\n\n/* Approved Premium Settings: one category rail, one scoped editor. Existing\n   UX Core shell and Hero remain untouched. */\n.mm-settings-layout{display:grid;grid-template-columns:minmax(160px,210px) minmax(0,1fr);gap:12px;align-items:start}\n.mm-settings-menu{display:grid;gap:5px;padding:10px;border:1px solid #e4ebf5;border-radius:13px;background:#f8faff}\n.mm-settings-nav{min-height:44px;text-align:left;border:1px solid transparent;border-radius:9px;padding:9px 11px;background:transparent;color:#254769;font:inherit;font-size:13px;font-weight:600;cursor:pointer}\n.mm-settings-nav.active{background:#eaf3ff;border-color:#c5dbf6;color:#1254a1}\n.mm-settings-nav:disabled{opacity:.45;cursor:not-allowed}.mm-settings-nav small{display:block;font-size:10px;font-weight:400}\n.mm-settings-main{min-width:0;border:1px solid #e0e8f2;border-radius:13px;padding:15px;background:#fff}\n.mm-settings-heading,.mm-settings .mm-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}\n.mm-settings-heading h3{font-size:16px;margin:0;color:#173e66}\n.mm-settings-yaml{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:7px 11px;border:1px solid #cddfeb;border-radius:8px;background:#f7faff;color:#145eaa;font:inherit;font-size:12px;font-weight:650;cursor:pointer}\n.mm-settings-yaml ha-icon{--mdc-icon-size:17px}\n.mm-global-yaml{background:#eef5ff;border-color:#b7d3f4}\n.mm-settings-choices{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}\n.mm-settings-item{display:grid;gap:3px;min-height:44px;min-width:115px;max-width:240px;padding:8px 10px;text-align:left;background:#fff;border:1px solid #dfe7f2;border-radius:9px;color:#234567;cursor:pointer}\n.mm-settings-item.active{background:#f0f6ff;border-color:#a9caef}\n.mm-settings-item strong{font-size:12px}.mm-settings-item small{font-size:10px;color:#6c8095}\n.mm-settings-facts p{margin:6px 0;font-size:12px}\n.mm-script-devices{display:grid;gap:9px;margin-top:12px}\n.mm-script-device{border:1px solid #e2eaf3;border-radius:10px;overflow:hidden}\n.mm-script-device-head{display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;padding:9px 11px;background:#f7faff}\n.mm-script-device-head strong{font-size:13px}.mm-script-device-head small{font-size:11px;color:#657c95;max-width:75%;overflow-wrap:anywhere}\n.mm-script-steps{list-style:none;margin:0;padding:6px 11px 9px 25px;display:grid;gap:3px}\n.mm-script-steps li{display:flex;justify-content:space-between;gap:8px;font-size:12px;border-left:2px solid #e0ecfa;padding:4px 9px;overflow-wrap:anywhere}\n.mm-script-steps li small{color:#6d8198;white-space:nowrap}\n.mm-settings button:focus-visible,.mm-settings textarea:focus-visible{outline:2px solid #1267be;outline-offset:2px}\n@media(max-width:690px){.mm-settings-layout{grid-template-columns:1fr}.mm-settings-menu{display:flex;overflow-x:auto;gap:6px}.mm-settings-nav{flex:none}.mm-settings-main{padding:11px}.mm-script-device-head small{max-width:100%}}\n\n/* One-room operational cockpit. Existing shared Premium shell and Hero unchanged. */\n.mm-floor-room-select{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 12px}\n.mm-floor-filter{display:grid;gap:4px;font-size:11px;color:#61758d;font-weight:650;min-width:135px}\n.mm-floor-filter select{min-height:44px;padding:8px 10px;background:#fff;border:1px solid #d9e5f1;border-radius:9px;color:#1c466e;font:inherit;font-size:12px}\n.mm-floor-room-buttons{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0}\n.mm-floor-room-buttons button{min-height:44px;padding:7px 12px;background:#fff;border:1px solid #d6e2ee;border-radius:9px;color:#295377;font:inherit;font-size:12px;cursor:pointer}\n.mm-floor-room-buttons button.active{background:#e8f3ff;border-color:#99c2ef;color:#0e5daa;font-weight:700}\n.mm-cockpit{display:grid;grid-template-columns:minmax(165px,.9fr) minmax(230px,1.4fr) minmax(175px,1fr);align-items:start;gap:10px}\n/* Without a native remote, keep device actions visible instead of reserving a blank panel. */\n.mm-cockpit>.mm-surface,.mm-cockpit>.mm-cockpit-controls,.mm-cockpit-controls>.mm-focused-remote{min-width:0;margin:0}\n.mm-cockpit-activities,.mm-cockpit-devices{display:grid;gap:8px}\n.mm-cockpit h3{margin:0;font-size:14px;color:#1a3e64}\n.mm-cockpit-current{font-size:12px;color:#5d7891;margin:2px 0}\n.mm-cockpit-nowplaying{margin:4px 0;padding:8px;border-radius:8px;background:#f4f8fd;color:#345c7b;font-size:12px;overflow-wrap:break-word}\n.mm-cockpit-activity-list{display:grid;gap:6px}\n.mm-cockpit-activity .mm-activity{width:100%;min-height:44px;text-align:left}\n.mm-activity-primary{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:stretch}\n.mm-activity-primary .mm-activity-off{display:inline-flex;align-items:center;justify-content:center;\n  gap:4px;min-height:44px;padding:7px 10px;border:1px solid #cad8e6;border-radius:9px;\n  background:#fff;color:#345775;font:inherit;font-size:12px;font-weight:650;cursor:pointer}\n.mm-activity-primary .mm-activity-off ha-icon{--mdc-icon-size:18px}\n.mm-activity-primary .mm-activity-off:disabled{opacity:.5;cursor:not-allowed}\n.mm-activity-primary .mm-activity-off:focus-visible{outline:2px solid #176bc0;outline-offset:2px}\n.mm-cockpit-activity small{display:block;margin:4px 0 2px;font-size:11px}\n.mm-source-repair-hint{font-size:12px;line-height:1.45;color:#4d657f;overflow-wrap:break-word;margin:7px 0}\n.mm-source-repair{min-height:44px;padding:8px 12px;border:1px solid #b8d4ef;border-radius:9px;background:#f2f8ff;color:#125a9c;font:inherit;font-size:12px;font-weight:650;cursor:pointer}\n.mm-source-repair:focus-visible{outline:2px solid #176bc0;outline-offset:2px}\n.mm-cockpit-activities .mm-room-foot{margin-top:5px;flex-wrap:wrap}\n/* Optional logical Room Areas are sections, not extra rooms or fold walls. */\n.mm-device-room-area{display:grid;gap:8px;min-width:0}\n.mm-device-room-area h4{margin:5px 0 0;font-size:12px;color:#365f84}\n.mm-device-area-members{display:grid;gap:8px;min-width:0}\n.mm-activity-room-area{display:block;margin-top:2px;color:#687f97;font-size:10px}\n.mm-cockpit-device{margin:0!important;border:1px solid #e1eaf4;border-radius:9px;padding:7px 9px}\n.mm-cockpit-device-heading{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:9px;min-height:44px;color:#2d4e70}\n.mm-cockpit-device-heading span{display:flex;align-items:center;gap:7px;min-width:0}\n.mm-cockpit-device-heading b{font-size:12px;word-break:normal;overflow-wrap:break-word}\n.mm-cockpit-device-heading small{font-size:10px;white-space:normal;text-align:right}\n.mm-cockpit-device-details{border-top:1px solid #e7eef8;margin-top:8px}\n.mm-cockpit-device-details>summary{min-height:40px;display:flex;align-items:center;\n  font-size:11px;color:#365e84;cursor:pointer}\n.mm-device-basic{display:grid;gap:7px;margin-top:7px}\n.mm-device-basic-buttons{display:flex;gap:5px;align-items:center;flex-wrap:wrap}\n.mm-device-basic-buttons button{display:inline-flex;align-items:center;justify-content:center;\n  flex:1 1 70px;min-width:0;min-height:44px;gap:4px;padding:6px 8px;border:1px solid #c9dbea;\n  border-radius:8px;background:#f6faff;color:#245680;font:inherit;font-size:11px;\n  font-weight:650;cursor:pointer}\n.mm-device-basic-buttons button ha-icon{--mdc-icon-size:17px;flex:none}\n.mm-device-basic-buttons button:disabled{opacity:.5;cursor:not-allowed}\n.mm-device-basic-buttons button:focus-visible,\n.mm-device-basic select:focus-visible,.mm-device-basic input:focus-visible{\n  outline:2px solid #176bc0;outline-offset:2px}\n.mm-device-basic-source,.mm-device-basic-volume{display:grid;gap:4px;\n  min-width:0;font-size:11px;color:#4f6983}\n.mm-device-basic-source select{min-height:44px;width:100%;min-width:0;\n  border:1px solid #cbdbea;border-radius:8px;background:#fff;color:#245680;\n  padding:6px 8px;font:inherit}\n.mm-device-basic-volume input{width:100%;min-height:28px;accent-color:#2765a8}\n.mm-device-basic-audio{display:grid;gap:6px}\n.mm-device-basic small{color:#5e738a}\n@media(min-width:1090px) and (max-width:1450px){\n  .mm-device-basic-buttons button{flex-basis:100%}\n}\n.mm-cockpit-device-body{border-top:1px solid #e7eef8;margin-top:5px;padding-top:9px}\n.mm-cockpit-device-body small{font-size:11px;color:#60758e}\n.mm-cockpit-device-body button{min-height:44px}\n.mm-cockpit-diagnostics{margin-top:12px}\n.mm-remote-tabs{display:flex;gap:5px;flex-wrap:wrap;margin:8px 0 12px}\n.mm-remote-tabs button{min-height:44px;flex:1;border:1px solid #d6e4f1;border-radius:8px;background:#fff;font:inherit;font-size:12px;cursor:pointer}\n.mm-remote-tabs button[aria-pressed=true]{background:#e9f3ff;border-color:#9bc6ed;color:#1259a5;font-weight:700}\n.mm-remote-numbers{display:grid;grid-template-columns:repeat(3,minmax(44px,1fr));gap:6px;max-width:220px;margin:10px auto}\n.mm-remote-numbers button{min-height:44px;border:1px solid #d5e4f1;border-radius:9px;background:#fff;font:inherit;cursor:pointer}\n@media(max-width:1080px){.mm-cockpit{grid-template-columns:minmax(180px,1fr) minmax(250px,1.7fr)}.mm-cockpit-devices{grid-column:1/-1}}\n@media(max-width:700px){.mm-cockpit{grid-template-columns:1fr}.mm-cockpit-devices{grid-column:auto}.mm-floor-room-select{align-items:start;flex-direction:column}.mm-cockpit-device-heading{grid-template-columns:minmax(0,1fr) auto}.mm-cockpit-device-heading .mm-native-media-link{grid-column:1/-1;justify-self:start}}\n\n.mm-remote-text-input{display:flex;align-items:end;flex-wrap:wrap;gap:9px;padding:8px 0}\n.mm-remote-text-input label{display:grid;gap:5px;flex:1;min-width:165px;color:#627a94;font-size:12px}\n.mm-remote-text-input input{width:100%;min-height:44px;padding:8px 10px;background:#fff;color:#183a5c;border:1px solid #d6e4f1;border-radius:9px;font:inherit}\n.mm-remote-text-input button{min-height:44px;padding:9px 12px;background:#eaf3ff;color:#155da7;border:1px solid #a9cbed;border-radius:9px;font:inherit;cursor:pointer}\n\n/* User-first Insights: room/task truth, no synthetic KPI strip. */\n.mm-insights-list{display:grid;gap:10px}\n.mm-insight{display:grid;gap:8px;min-width:0}\n.mm-insight-head{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}\n.mm-insight-head h3{margin:0;font-size:15px;color:#183d66}\n.mm-insight-head small{display:block;font-size:11px;color:#657d94;margin-top:2px}\n.mm-insight-state{font-size:11px;color:#566f87;border:1px solid #e3eaf2;border-radius:10px;padding:5px 8px;max-width:100%;overflow-wrap:anywhere}\n.mm-insight-attention .mm-insight-state{color:#8e4a16;border-color:#efd7bb;background:#fffbf4}\n.mm-insight-summary{margin:0;color:#3a5774;font-size:12px;line-height:1.5}\n.mm-insight-affected{display:flex;gap:7px;flex-wrap:wrap}\n.mm-insight-target{display:grid;gap:2px;min-width:145px;flex:1 1 180px;padding:9px 11px;border:1px solid #e0e9f4;border-radius:9px;background:#f8fbff}\n.mm-insight-target b{font-size:12px;color:#2a4d6e}\n.mm-insight-target span{font-size:11px;color:#526d84;overflow-wrap:anywhere}\n.mm-insight-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}\n.mm-insight-actions button{display:inline-flex;gap:6px;align-items:center;min-height:44px;border:1px solid #cadced;border-radius:8px;background:#fff;color:#155b9c;font:inherit;font-size:12px;font-weight:600;padding:8px 12px;cursor:pointer}\n.mm-insight-actions button.mm-insight-fix{background:#ecf5ff}\n.mm-insight details{border-top:1px solid #e7edf5;padding-top:9px}\n.mm-insight details summary{cursor:pointer;min-height:38px;display:flex;align-items:center;font-size:12px;color:#355978;font-weight:600}\n.mm-insights button:focus-visible,.mm-insights summary:focus-visible{outline:2px solid #176bc0;outline-offset:2px}\n\n/* Activity editor: show automatic device readiness + user-authored actions. */\n.mm-script-automatic{display:flex;align-items:center;gap:7px;font-size:11px;color:#5f738c;padding:7px 11px}\n.mm-script-automatic ha-icon{--mdc-icon-size:16px}\n.mm-script-stop{border-top:1px solid #edf2f8;margin:0}\n.mm-script-stop summary{display:flex;align-items:center;min-height:44px;padding:6px 11px;color:#315b7f;font-size:12px;cursor:pointer}\n.mm-script-step{flex-wrap:wrap}\n.mm-script-step span{min-width:0;flex:1 1 170px}\n.mm-script-step small{flex:0 0 auto;max-width:100%;white-space:normal;text-align:right}\n\n/* Native Options Flow quick access from the exact configured device/step. */\n.mm-step-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap;justify-content:flex-end}\n.mm-step-actions small{font-size:10px}\n.mm-step-edit,.mm-step-add{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-height:44px;min-width:44px;border:1px solid #d6e4f2;border-radius:8px;background:#fff;color:#195b98;padding:6px 9px;font:inherit;font-size:11px;font-weight:600;cursor:pointer}\n.mm-step-add{margin:4px 10px 9px;background:#f6faff}\n.mm-step-add ha-icon{--mdc-icon-size:15px}\n.mm-script-device button:focus-visible{outline:2px solid #176bc0;outline-offset:2px}\n\n/* Favorite activities reuse the normal guarded start command, no second macro writer. */\n.mm-cockpit-activity .mm-favorite-star{--mdc-icon-size:15px;color:#c18a33;flex:none;margin-right:3px}\n\n/* Assigned activity buttons and shortcuts reuse the native room control flow. */\n.mm-activity-shortcuts{display:grid;gap:8px;margin:10px 0 0;padding:10px 0 0;border-top:1px solid #e4ecf5}\n.mm-activity-shortcuts>b{font-size:12px;color:#2b4e6f}\n.mm-activity-shortcuts .mm-native-buttons{display:flex;gap:5px;flex-wrap:wrap}\n.mm-activity-shortcuts button{min-height:44px;min-width:44px;padding:6px 11px;background:#f5f9ff;border:1px solid #cfe0f2;border-radius:9px;color:#175a9d;font:inherit;font-size:12px;font-weight:600;cursor:pointer}\n.mm-activity-shortcuts button:disabled{opacity:.5;cursor:not-allowed}\n.mm-activity-shortcuts button:focus-visible{outline:2px solid #176bc0;outline-offset:2px}\n\n/* Folded activity plan, one existing room scope, no duplicate Attention row. */\n.mm-cockpit-current small{display:block;margin-top:2px;color:#6d8092;font-size:11px}\n.mm-activity-plan{border:1px solid #e5ecf5;border-radius:8px;margin:4px 0}\n.mm-activity-plan summary{min-height:40px;padding:6px 10px;cursor:pointer;color:#426784;font-size:11px;display:flex;align-items:center}\n.mm-activity-plan ol{margin:2px 0 7px;padding:4px 10px 4px 23px;font-size:11px;color:#46637c}\n.mm-activity-plan li{display:grid;gap:2px;padding:4px 0;overflow-wrap:anywhere}\n.mm-activity-plan li span{color:#687d91}\n.mm-activity-plan summary:focus-visible{outline:2px solid #176bc0;outline-offset:2px}\n\n\n/* Multimedia Premium resident experience: one coherent action/button grammar.\n   Backend flags and native readback determine activity color/availability. */\n.mm-cockpit{grid-template-columns:minmax(185px,.8fr) minmax(260px,1.25fr) minmax(215px,1.1fr);gap:12px}\n.mm-cockpit-activity-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}\n.mm-cockpit-activity-list .mm-activity-choice{display:flex;align-items:center;gap:9px;min-height:48px;\n  padding:8px 10px;border:1px solid #d5e0ed;background:#fff;border-radius:10px;\n  color:#234769;font:inherit;font-size:12px;font-weight:650;text-align:left;cursor:pointer;min-width:0}\n.mm-activity-choice ha-icon{--mdc-icon-size:21px;flex:none}\n.mm-activity-choice span{min-width:0;overflow-wrap:break-word}\n.mm-cockpit-activity-list .mm-activity-choice.active{background:#1c5e9c;color:#fff;border-color:#1c5e9c}\n.mm-cockpit-activity-list .mm-activity-choice:disabled{opacity:.53;cursor:not-allowed}\n.mm-cockpit-activity-list .mm-all-off{border-color:#cbd8e5;color:#5d3440;background:#f9fbfd}\n.mm-cockpit-activity-list .mm-all-off:not(:disabled):hover{background:#f8eef0;border-color:#c9aeb6}\n.mm-activity-choice:focus-visible,.mm-activity-repair:focus-visible,.mm-remote-command:focus-visible{outline:2px solid #176bc0;outline-offset:2px}\n.mm-activity-status{display:flex;align-items:center;flex-wrap:wrap;justify-content:space-between;gap:6px;\n  margin:4px 0 2px;font-size:11px;color:#586f88}\n.mm-activity-repair{display:inline-flex;gap:5px;align-items:center;min-height:40px;padding:5px 9px;\n  border:1px solid #e4cd9f;background:#fffbf2;border-radius:8px;color:#805920;\n  font:inherit;font-weight:650;font-size:11px;cursor:pointer}\n.mm-activity-repair ha-icon{--mdc-icon-size:17px}\n.mm-cockpit-activities .mm-activity-plan{border-top:1px solid #e0e8f1;margin-top:6px;padding-top:6px}\n.mm-cockpit-activities .mm-activity-plan summary{cursor:pointer;min-height:38px;font-size:11px;color:#37668d}\n.mm-cockpit-activities .mm-activity-plan li{font-size:11px;line-height:1.5;margin:4px 0}\n/* The active native media source is the centrepiece; one backend-owned\n   playback projection, no second player/metadata/command implementation. */\n.mm-now-playing{display:grid;gap:12px}\n.mm-media-head{display:flex;align-items:center;justify-content:space-between;gap:10px}\n.mm-media-head h3{font-size:14px;margin:0}\n.mm-media-state{font-size:11px;color:#326b99;border:1px solid #d5e2f0;\n  border-radius:18px;padding:5px 10px;overflow-wrap:anywhere;text-align:right}\n.mm-media-stage{position:relative;isolation:isolate;display:grid;place-items:center;\n  width:100%;aspect-ratio:16/9;min-height:160px;max-height:340px;overflow:hidden;\n  border-radius:13px;background:linear-gradient(138deg,#263c53,#121f30 65%,#304963);\n  color:#cbd9eb}\n.mm-media-stage>ha-icon{--mdc-icon-size:64px;opacity:.62}\n.mm-media-backdrop{position:absolute;inset:0;width:100%;height:100%;\n  object-fit:cover;filter:blur(22px) brightness(.52);transform:scale(1.08)}\n.mm-media-cover{position:relative;width:100%;height:100%;object-fit:contain;min-height:0;min-width:0}\n.mm-media-stage-video .mm-media-cover{object-fit:cover}\n.mm-media-stage-audio .mm-media-cover{width:auto;max-width:82%;max-height:94%;\n  height:auto;aspect-ratio:1/1;object-fit:contain;border-radius:8px;\n  box-shadow:0 8px 30px #08132280}\n.mm-media-copy{display:grid;gap:4px;min-width:0}\n.mm-media-copy strong{font-size:17px;line-height:1.3;overflow-wrap:break-word;color:#193d61}\n.mm-media-copy span{font-size:13px;color:#4d6681;overflow-wrap:break-word}\n.mm-media-copy small{font-size:11px;color:#607791;overflow-wrap:anywhere}\n.mm-media-progress{display:grid;gap:5px}\n.mm-media-progress progress{height:7px;width:100%;max-width:100%;accent-color:#266bae}\n.mm-media-progress span{font-size:10px;text-align:right;color:#70849a;font-variant-numeric:tabular-nums}\n.mm-media-transport{display:flex;align-items:center;justify-content:center;gap:7px;flex-wrap:wrap}\n.mm-media-action{display:grid;place-items:center;width:46px;height:46px;padding:0;border:1px solid #d3e0ee;\n  background:#fff;border-radius:10px;color:#245b90;cursor:pointer;flex:none}\n.mm-media-action ha-icon{--mdc-icon-size:21px}\n.mm-media-action:focus-visible,.mm-media-volume input:focus-visible{outline:2px solid #176bc0;outline-offset:2px}\n.mm-media-audio{display:flex;align-items:center;gap:8px}\n.mm-media-volume{display:grid;gap:4px;flex:1;min-width:0;font-size:11px;color:#53708a}\n.mm-media-volume input{width:100%;accent-color:#296da7;min-height:28px}\n.mm-media-native{display:flex;justify-content:flex-end}\n@media(max-width:700px){.mm-media-stage{min-height:0;max-height:360px}\n  .mm-media-cover{max-height:360px} .mm-media-copy strong{font-size:16px}}\n.mm-cockpit-device-heading{grid-template-columns:minmax(0,1fr) auto;gap:6px 8px}\n.mm-cockpit-device-heading .mm-native-media-link{grid-column:1/-1;justify-self:start}\n.mm-device-nowplaying{display:flex;align-items:start;gap:8px;padding:8px;border-radius:8px;\n  background:#f4f8fc;font-size:11px;color:#315879;min-width:0}\n.mm-device-nowplaying ha-icon{--mdc-icon-size:19px;flex:none}\n.mm-device-nowplaying span{display:grid;gap:2px;min-width:0}\n.mm-device-nowplaying b{overflow-wrap:break-word}\n.mm-device-nowplaying small{color:#657c91}\n.mm-remote-command{display:grid;place-items:center;min-width:44px;min-height:44px;\n  border:1px solid #cfddeb;border-radius:9px;background:#f8fbfe;color:#1f527f;\n  font:inherit;font-weight:650;font-size:11px;cursor:pointer}\n.mm-remote-command ha-icon{--mdc-icon-size:22px}\n.mm-remote-command span{padding:0 4px;overflow-wrap:break-word;text-align:center}\n.mm-remote-navigation .mm-remote-command{width:100%;height:100%}\n.mm-remote-numbers .mm-remote-command{min-width:0;width:100%}\n.mm-native-buttons .mm-remote-command{min-width:44px}\n.mm-remote-command:hover:not(:disabled),.mm-media-action:hover:not(:disabled){background:#e8f3ff}\n@media(max-width:880px){.mm-cockpit{grid-template-columns:minmax(220px,.9fr) minmax(290px,1.2fr)}\n  .mm-cockpit-devices{grid-column:1/-1}}\n@media(max-width:700px){.mm-cockpit{grid-template-columns:minmax(0,1fr)}\n  .mm-cockpit-devices{grid-column:auto}.mm-media-identity{grid-template-columns:76px minmax(0,1fr)}\n  .mm-media-artwork{width:76px;height:76px}.mm-cockpit-activity-list{grid-template-columns:repeat(2,minmax(0,1fr))}}\n\n/* Activity authoring stays inside the existing two-column Settings pane. */\n.mm-activity-wizard-stages{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0 14px}\n.mm-activity-wizard-stages button{display:flex;align-items:center;gap:9px;min-height:48px;padding:9px 11px;\n border:1px solid #d4e1ef;border-radius:10px;background:#fff;color:#325a7d;\n text-align:left;font:inherit;font-size:12px;cursor:pointer}\n.mm-activity-wizard-stages button b{display:grid;place-items:center;flex:none;width:26px;height:26px;\n border-radius:50%;border:1px solid #c8d9eb;font-size:12px}\n.mm-activity-wizard-stages button.active{border-color:#9ec3e9;background:#edf5ff;color:#154d83;font-weight:700}\n.mm-activity-wizard-stages button.active b{background:#216ba7;border-color:#216ba7;color:#fff}\n.mm-activity-wizard-stages button:focus-visible,.mm-settings-edit-cast:focus-visible,.mm-step-move:focus-visible{outline:2px solid #176bc0;outline-offset:2px}\n.mm-activity-device-stage{display:grid;gap:8px}\n.mm-device-choice{display:flex;align-items:center;gap:10px;min-height:56px;padding:9px 12px;\n border:1px solid #e1e8f1;border-radius:9px;color:#345876}\n.mm-device-choice.selected{border-color:#b1d0ed;background:#f5faff}\n.mm-device-choice ha-icon{--mdc-icon-size:21px;color:#28699f;flex:none}\n.mm-device-choice span{display:grid;gap:3px;min-width:0;flex:1}\n.mm-device-choice b{font-size:12px;overflow-wrap:break-word}\n.mm-device-choice small{font-size:11px;color:#678097;overflow-wrap:break-word}\n.mm-settings-edit-cast{min-height:44px;padding:9px 13px;border:1px solid #a9cdea;\n border-radius:9px;background:#eaf4ff;color:#17578c;font:inherit;font-size:12px;font-weight:650;cursor:pointer}\n.mm-step-move{display:inline-grid;place-items:center;width:42px;height:42px;padding:0;\n border:1px solid #d1deed;border-radius:8px;background:#f8fbff;color:#275e92;cursor:pointer}\n.mm-step-move ha-icon{--mdc-icon-size:19px}\n@media(max-width:700px){.mm-activity-wizard-stages{grid-template-columns:1fr}}\n\n/* Native step outcomes from the latest backend attempt, not frontend estimates. */\n.mm-step-trace{margin:10px 0 3px;padding:8px 10px;border:1px solid #d7e3ef;\n  border-radius:9px;background:#f8fbff;color:#355c7e}\n.mm-step-trace summary{min-height:38px;display:list-item;cursor:pointer;\n  font-size:12px;font-weight:650}\n.mm-step-trace ol{padding-left:20px;display:grid;gap:6px;margin:8px 0}\n.mm-step-trace li{font-size:11px;line-height:1.45;overflow-wrap:break-word}\n.mm-step-trace-action{display:block;color:#3e607c}\n.mm-step-trace-result{display:block;color:#6b8298}\n.mm-step-trace .mm-room-error{color:#a04242}\n\n\n/* The only iPad whole-home editor is the existing HA Options Flow session. */\n.mm-settings-primary-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px}\n.mm-settings-configure-all,.mm-whole-home-save{display:inline-flex;align-items:center;\n  justify-content:center;gap:9px;min-height:48px;padding:10px 15px;\n  border:1px solid #1d629e;background:#1d629e;color:#fff;border-radius:10px;\n  font:inherit;font-size:13px;font-weight:700;cursor:pointer}\n.mm-settings-configure-all ha-icon,.mm-whole-home-save ha-icon{--mdc-icon-size:21px}\n.mm-settings-configure-all:disabled{opacity:.55;cursor:not-allowed}\n.mm-settings-configure-all:focus-visible,.mm-whole-home button:focus-visible{\n  outline:3px solid #2d81d3;outline-offset:2px}\n.mm-whole-home{display:grid;gap:15px;min-width:0}\n.mm-whole-home-head{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start;\n  justify-content:space-between}\n.mm-whole-home-head h3{margin:0 0 4px;font-size:19px}\n.mm-whole-home-head p{font-size:12px;color:#617b91;max-width:550px}\n.mm-whole-home-unsaved{padding:6px 9px;border-radius:8px;background:#fff8e9;\n  border:1px solid #e7d3a9;color:#946521;font-size:11px;font-weight:650}\n.mm-whole-home-groups{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}\n.mm-whole-home-group{min-width:0;padding:12px;border:1px solid #dae4ee;\n  border-radius:11px;background:#fbfdff;display:flex;flex-direction:column;gap:10px}\n.mm-whole-home-group header{display:flex;align-items:center;gap:9px}\n.mm-whole-home-group header ha-icon{--mdc-icon-size:23px;color:#245e96}\n.mm-whole-home-group h4,.mm-whole-home-summary h4{font-size:13px;margin:0;color:#1d456c}\n.mm-whole-home-choices{display:grid;gap:6px}\n.mm-whole-home-choices button{display:flex;align-items:center;text-align:left;min-height:44px;\n  padding:9px 11px;border:1px solid #ccdcec;border-radius:9px;background:#fff;\n  color:#254b71;font:inherit;font-size:12px;cursor:pointer;overflow-wrap:anywhere}\n.mm-whole-home-choices button:hover{background:#eef6fe}\n.mm-whole-home-summary{padding:12px;border:1px solid #e0e8f2;border-radius:10px;\n  background:#f7fafd;min-width:0}\n.mm-whole-home-summary pre{font:inherit;font-size:12px;line-height:1.55;\n  color:#456480;white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0 0}\n.mm-whole-home-actions{display:flex;flex-wrap:wrap;align-items:center;gap:10px}\n.mm-whole-home-actions>button:last-child{min-height:44px;padding:9px 14px;\n  border:1px solid #d1dfec;background:#fff;color:#456580;border-radius:9px;\n  font:inherit;cursor:pointer}\n.mm-device-power-row{display:flex;align-items:center;gap:9px;flex-wrap:wrap;min-width:0}\n.mm-device-power{display:inline-flex;gap:7px;align-items:center;justify-content:center;\n  min-height:44px;min-width:86px;border-radius:9px;border:1px solid #a3c5e7;\n  padding:8px 11px;background:#edf5ff;color:#1f629a;font:inherit;font-weight:700;\n  cursor:pointer}\n.mm-device-power ha-icon{--mdc-icon-size:21px}\n.mm-device-power:disabled{background:#f5f7fa;border-color:#dbe2ea;color:#8190a0;\n  opacity:1;cursor:not-allowed}\n.mm-device-power-reason{font-size:11px;color:#8b5360;overflow-wrap:anywhere}\n.mm-device-power-row .mm-source-repair{min-height:40px;padding:7px 9px}\n@media(max-width:1120px){\n  .mm-whole-home-groups{grid-template-columns:repeat(2,minmax(0,1fr))}\n}\n@media(max-width:760px){\n  .mm-whole-home-groups{grid-template-columns:minmax(0,1fr)}\n  .mm-settings-primary-actions{width:100%}\n  .mm-settings-configure-all{flex:1}\n}\n\n\n/* One editable iPad Home Assistant Options Flow draft. No secondary writer. */\n.mm-wh-editor{display:grid;gap:15px;min-width:0;width:100%}\n.mm-wh-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}\n.mm-wh-header h2{margin:0 0 5px;font-size:23px;color:#153e62}\n.mm-wh-header p{font-size:12px;color:#5f7994}\n.mm-wh-draft{border:1px solid #c8d9ea;border-radius:9px;padding:7px 10px;\n  background:#f0f7ff;color:#2e638f;font-weight:650;font-size:11px}\n.mm-wh-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}\n.mm-wh-tabs button{display:flex;justify-content:center;align-items:center;gap:8px;\n  min-height:48px;padding:9px;border:1px solid #d2deeb;border-radius:9px;\n  background:#fff;color:#315c80;font-size:12px;font-weight:700;cursor:pointer}\n.mm-wh-tabs button[aria-pressed=\"true\"]{background:#e8f2ff;color:#185d9a;border-color:#a7c7ec}\n.mm-wh-tabs ha-icon{--mdc-icon-size:20px}\n.mm-wh-grid{display:grid;grid-template-columns:minmax(225px,.88fr) minmax(0,1.9fr);gap:12px}\n.mm-wh-panel{display:grid;align-content:start;gap:9px;min-width:0;padding:14px;\n  border:1px solid #e0e8f1;border-radius:11px;background:#fbfdff}\n.mm-wh-panel h4,.mm-wh-steps h4{margin:8px 0 1px;color:#244c74;font-size:13px}\n.mm-wh-panel h4 small{font-size:10px;font-weight:500;color:#607c96}\n.mm-wh-room-areas{padding:9px 10px;border:1px solid #d6e4f1;border-radius:9px;background:#fff;\n  min-width:0;display:grid;gap:8px}\n.mm-wh-room-areas>summary{cursor:pointer;min-height:40px;padding:7px 0;font-size:12px;\n  font-weight:700;color:#315d81}\n.mm-wh-room-areas .mm-wh-area{display:grid;grid-template-columns:minmax(0,1fr) auto;\n  align-items:end;gap:9px;border-top:1px solid #e4ebf4;padding-top:9px}\n@media(max-width:700px){.mm-wh-room-areas .mm-wh-area{grid-template-columns:1fr}}\n\n.mm-wh-panel label{display:grid;gap:5px;min-width:0;color:#4f708d;font-weight:600;font-size:11px}\n.mm-wh-panel label.mm-wh-check{display:flex;align-items:center;gap:8px;min-height:35px}\n.mm-wh-panel input:not([type=checkbox]),.mm-wh-panel select,.mm-wh-roomselect select{\n  width:100%;min-width:0;box-sizing:border-box;min-height:44px;padding:8px 10px;\n  border:1px solid #cbdcec;border-radius:9px;background:#fff;color:#244969;font:inherit;font-size:13px}\n.mm-wh-panel input[type=checkbox]{min-width:20px;min-height:20px;accent-color:#1e6caf}\n.mm-wh-panel button:not([aria-pressed]),.mm-wh-footer button{\n  min-height:44px;padding:9px 12px;border:1px solid #b6d1eb;border-radius:9px;\n  background:#edf5ff;color:#1d578a;font-size:12px;font-weight:650;cursor:pointer}\n.mm-wh-panel button.danger{border-color:#e3c4c4;background:#fff8f8;color:#994546}\n.mm-wh-panel button:disabled{opacity:.58;cursor:not-allowed}\n.mm-wh-panel small{font-size:11px;color:#6b8297;overflow-wrap:anywhere}\n.mm-wh-list{display:flex;flex-wrap:wrap;gap:7px}\n.mm-wh-list button{min-height:44px;max-width:100%;padding:8px 11px;border-radius:9px;\n  border:1px solid #cbdbeb;background:#fff;color:#28537c;font-size:12px;\n  text-align:left;overflow-wrap:anywhere;cursor:pointer}\n.mm-wh-list button[aria-pressed=\"true\"]{border-color:#6fa6de;background:#eaf4ff;color:#174f86}\n.mm-wh-cast{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}\n.mm-wh-steps{display:grid;gap:8px;padding:9px;border-top:1px solid #e0e8f1}\n.mm-wh-step{display:grid;grid-template-columns:28px repeat(2,minmax(120px,1fr));\n  gap:8px;padding:12px;border:1px solid #dce7f0;background:#fff;border-radius:9px}\n.mm-wh-step strong{display:grid;place-items:center;width:27px;height:27px;\n  border-radius:50%;background:#e5f2ff;color:#18578d;font-size:12px}\n.mm-wh-step-actions{display:flex;align-items:center;justify-content:flex-end;gap:5px}\n.mm-wh-step-actions button{min-height:44px;min-width:44px}\n.mm-wh-roomselect{display:flex;align-items:center;gap:8px}\n.mm-wh-roomselect label{display:flex;align-items:center;gap:9px;flex-wrap:wrap;\n  color:#315877;font-size:12px;font-weight:650}\n.mm-wh-footer{display:flex;align-items:center;justify-content:flex-end;gap:10px;\n  flex-wrap:wrap;border-top:1px solid #dde7f0;padding-top:12px}\n.mm-wh-footer span{margin-right:auto;font-size:11px;color:#6b8297}\n.mm-wh-footer .mm-wh-save{background:#1c609e;border-color:#1c609e;color:#fff}\n.mm-wh-editor button:focus-visible,.mm-wh-editor input:focus-visible,.mm-wh-editor select:focus-visible{\n  outline:2px solid #176bc0;outline-offset:2px}\n@media(max-width:980px){\n  .mm-wh-grid{grid-template-columns:minmax(0,1fr)}\n  .mm-wh-step{grid-template-columns:26px repeat(2,minmax(0,1fr))}\n}\n@media(max-width:600px){\n  .mm-wh-tabs button{font-size:11px;gap:4px}\n  .mm-wh-tabs ha-icon{--mdc-icon-size:17px}\n  .mm-wh-cast{grid-template-columns:minmax(0,1fr)}\n  .mm-wh-step{grid-template-columns:26px minmax(0,1fr)}\n  .mm-wh-step label{grid-column:2}\n  .mm-wh-step-actions{grid-column:1/-1}\n}\n";
// RHI UX Core 1.6.3 — build-time presentation primitives only.
// No domain semantics or Home Assistant contract/entity knowledge belongs here.
const RHI_UX_CORE_VERSION = "1.6.4";
const RHI_UX_COMPANY_LOGO_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"75 116 1624 688\" role=\"img\" aria-labelledby=\"title desc\">\n<title id=\"title\">Robotix.be</title>\n<desc id=\"desc\">DomotiX · Network · Security</desc>\n<path fill=\"#0B4C86\" fill-rule=\"evenodd\" d=\"M536,549 L516,554 L512,556 L501,558 L497,560 L497,609 L512,608 L513,607 L525,606 L537,603 L537,551ZM1698,698 L1696,696 L1692,695 L1678,695 L1677,694 L1658,694 L1657,693 L1638,693 L1637,692 L1618,692 L1617,691 L1573,690 L1572,689 L1552,689 L1551,688 L1524,688 L1523,687 L1494,687 L1493,686 L1447,685 L1446,684 L1441,684 L1440,683 L1441,682 L1440,679 L1440,636 L1419,633 L1418,632 L1397,630 L1396,629 L1381,628 L1380,627 L1364,625 L1362,623 L1362,542 L1360,539 L1334,531 L1327,530 L1313,525 L1310,525 L1293,519 L1262,511 L1255,508 L1245,506 L1211,495 L1201,493 L1175,484 L1172,484 L1148,476 L1145,476 L1122,468 L1115,467 L1092,459 L1085,458 L1076,454 L1059,450 L1049,446 L1036,443 L1033,441 L1030,441 L1013,435 L1006,434 L997,430 L987,428 L964,420 L957,419 L944,414 L941,414 L928,409 L925,409 L909,403 L906,403 L890,397 L887,397 L867,404 L857,406 L848,410 L832,414 L819,419 L809,421 L784,430 L781,430 L771,434 L761,436 L752,440 L749,440 L721,450 L714,451 L683,462 L680,462 L639,476 L623,480 L620,482 L614,483 L601,488 L598,488 L595,490 L583,493 L573,497 L563,496 L562,495 L554,495 L547,499 L538,508 L343,571 L342,572 L342,638 L338,640 L332,640 L321,643 L315,643 L314,644 L309,644 L301,646 L300,648 L300,683 L296,685 L252,686 L251,687 L231,687 L230,688 L210,688 L209,689 L191,689 L190,690 L170,690 L169,691 L152,691 L151,692 L135,692 L134,693 L82,695 L81,696 L77,696 L76,700 L78,701 L121,701 L122,702 L299,704 L300,705 L300,729 L302,732 L306,733 L315,733 L316,734 L334,735 L335,736 L360,738 L361,739 L371,739 L372,740 L380,740 L381,741 L400,742 L401,743 L408,743 L409,744 L417,744 L418,745 L427,745 L428,746 L436,746 L437,747 L453,748 L454,749 L472,750 L473,751 L489,752 L490,753 L514,755 L515,756 L522,756 L523,757 L558,760 L559,761 L591,764 L599,766 L607,766 L608,767 L625,768 L632,770 L657,772 L665,774 L691,776 L692,777 L698,777 L706,779 L713,779 L714,780 L721,780 L729,782 L752,784 L753,785 L765,786 L766,787 L781,788 L789,790 L812,792 L813,793 L819,793 L820,794 L826,794 L827,795 L833,795 L841,797 L848,797 L849,798 L855,798 L856,799 L862,799 L870,801 L884,802 L885,801 L906,799 L907,798 L913,798 L914,797 L920,797 L921,796 L927,796 L928,795 L934,795 L935,794 L941,794 L942,793 L948,793 L949,792 L955,792 L956,791 L962,791 L970,789 L985,788 L986,787 L992,787 L999,785 L1006,785 L1007,784 L1035,781 L1036,780 L1042,780 L1050,778 L1057,778 L1058,777 L1065,777 L1066,776 L1072,776 L1080,774 L1103,772 L1104,771 L1112,771 L1113,770 L1127,769 L1128,768 L1149,766 L1150,765 L1157,765 L1165,763 L1173,763 L1174,762 L1190,761 L1191,760 L1205,759 L1213,757 L1223,757 L1224,756 L1256,753 L1257,752 L1264,752 L1265,751 L1272,751 L1273,750 L1316,746 L1324,744 L1332,744 L1333,743 L1341,743 L1342,742 L1350,742 L1351,741 L1359,741 L1360,740 L1369,740 L1370,739 L1378,739 L1379,738 L1387,738 L1388,737 L1398,737 L1399,736 L1416,735 L1417,734 L1424,734 L1425,733 L1434,733 L1440,731 L1440,708 L1441,707 L1440,706 L1442,704 L1513,704 L1514,703 L1524,703 L1527,704 L1528,703 L1657,702 L1658,701 L1695,701ZM1408,720 L1404,722 L1400,721 L1400,652 L1399,651 L1384,649 L1383,648 L1377,648 L1376,647 L1369,647 L1368,646 L1349,644 L1349,726 L1348,727 L1341,727 L1340,728 L1333,728 L1332,729 L1314,730 L1313,729 L1313,640 L1307,638 L1278,635 L1277,634 L1271,634 L1263,632 L1224,628 L1224,738 L1222,740 L1189,743 L1188,744 L1180,744 L1179,745 L1171,745 L1170,746 L1163,746 L1162,747 L1139,749 L1138,750 L1131,750 L1130,751 L1122,751 L1121,752 L1114,752 L1113,753 L1096,754 L1095,753 L1095,611 L1071,608 L1070,607 L1048,605 L1047,604 L1040,604 L1039,603 L1033,603 L1032,602 L1026,602 L1025,601 L1019,601 L1011,599 L1003,599 L995,597 L972,595 L971,594 L959,593 L958,592 L954,592 L953,593 L953,772 L951,774 L937,775 L936,776 L908,779 L900,781 L893,781 L885,783 L877,783 L876,782 L862,781 L861,780 L855,780 L847,778 L840,778 L839,777 L817,775 L816,774 L807,774 L806,773 L800,773 L799,772 L793,772 L785,770 L778,770 L777,769 L770,769 L769,768 L762,768 L761,767 L739,765 L738,764 L730,764 L729,763 L729,606 L714,607 L706,609 L676,612 L675,613 L661,614 L660,615 L646,616 L645,617 L631,618 L630,619 L623,619 L622,620 L622,750 L621,751 L588,748 L587,747 L571,746 L570,745 L562,745 L561,744 L552,744 L551,743 L544,743 L537,741 L537,631 L536,630 L507,633 L506,634 L500,634 L499,635 L485,636 L484,637 L476,638 L476,735 L475,736 L466,736 L465,735 L465,644 L464,643 L464,639 L402,648 L402,729 L401,730 L364,727 L361,725 L361,661 L364,659 L370,659 L371,658 L377,658 L378,657 L394,655 L395,654 L395,650 L394,649 L362,653 L361,654 L355,654 L354,655 L340,656 L339,657 L327,658 L326,659 L318,659 L317,660 L313,660 L312,659 L312,655 L322,652 L342,650 L355,647 L393,643 L406,640 L413,640 L414,639 L420,639 L421,638 L434,637 L435,636 L441,636 L449,634 L456,634 L457,633 L463,633 L471,631 L479,631 L480,630 L492,629 L493,628 L509,627 L510,626 L530,624 L536,622 L552,621 L553,620 L576,618 L583,616 L607,614 L608,613 L615,613 L616,612 L624,612 L632,610 L640,610 L648,608 L671,606 L672,605 L701,602 L702,601 L709,601 L710,600 L716,600 L717,599 L723,599 L731,597 L739,597 L747,595 L755,595 L762,593 L770,593 L771,592 L792,590 L800,588 L832,585 L833,584 L861,581 L862,580 L879,579 L880,578 L887,578 L888,577 L898,577 L906,579 L915,579 L916,580 L923,580 L924,581 L956,584 L963,586 L979,587 L986,589 L1002,590 L1003,591 L1031,594 L1039,596 L1046,596 L1054,598 L1062,598 L1063,599 L1069,599 L1076,601 L1083,601 L1084,602 L1090,602 L1098,604 L1106,604 L1107,605 L1113,605 L1114,606 L1120,606 L1121,607 L1127,607 L1135,609 L1143,609 L1144,610 L1166,612 L1167,613 L1181,614 L1189,616 L1197,616 L1198,617 L1210,618 L1211,619 L1218,619 L1219,620 L1233,621 L1234,622 L1242,622 L1243,623 L1272,626 L1273,627 L1279,627 L1287,629 L1312,631 L1313,632 L1319,632 L1320,633 L1339,635 L1340,636 L1347,636 L1354,638 L1362,638 L1363,639 L1369,639 L1376,641 L1404,644 L1408,646ZM885,440 L886,441 L886,560 L883,562 L875,562 L869,564 L861,564 L853,566 L846,566 L845,567 L817,570 L816,569 L816,460 L819,458 L822,458 L826,456 L829,456 L833,454 L836,454 L840,452 L843,452 L847,450 L858,448 L875,442ZM1339,551 L1339,612 L1338,613 L1338,620 L1337,621 L1332,620 L1330,617 L1330,589 L1331,588 L1331,578 L1330,577 L1331,559 L1330,558 L1330,554 L1316,549 L1283,541 L1276,538 L1269,537 L1251,531 L1248,531 L1248,606 L1246,608 L1238,608 L1237,607 L1230,607 L1222,605 L1215,605 L1214,604 L1208,604 L1207,603 L1201,603 L1200,602 L1194,602 L1193,601 L1187,601 L1186,600 L1180,600 L1172,598 L1149,596 L1142,594 L1135,594 L1128,592 L1086,587 L1085,586 L1066,584 L1065,583 L1058,583 L1057,582 L1035,580 L1034,579 L1021,578 L1020,577 L1014,577 L1013,576 L1007,576 L999,574 L992,574 L991,573 L985,573 L977,571 L963,570 L959,568 L959,524 L958,523 L958,509 L959,508 L959,455 L958,454 L958,448 L955,448 L941,443 L920,438 L891,429 L885,429 L860,437 L843,441 L823,448 L820,448 L813,451 L799,454 L786,459 L779,460 L766,465 L749,469 L743,472 L743,579 L741,581 L709,585 L708,586 L702,586 L701,587 L695,587 L694,588 L688,588 L687,589 L666,591 L665,592 L657,592 L656,593 L650,593 L649,594 L643,594 L635,596 L620,597 L612,599 L604,599 L603,598 L603,583 L602,582 L602,578 L603,577 L603,546 L602,545 L603,543 L603,523 L602,522 L602,513 L600,513 L556,527 L553,527 L543,531 L526,535 L488,548 L485,548 L482,550 L482,564 L480,566 L444,575 L440,577 L429,579 L425,581 L421,581 L414,584 L411,584 L395,589 L395,625 L396,626 L404,624 L416,623 L417,622 L423,622 L424,621 L451,618 L458,616 L464,616 L470,614 L478,614 L479,613 L489,612 L490,611 L490,556 L493,554 L522,547 L543,540 L545,547 L545,599 L544,600 L545,607 L543,609 L525,611 L518,613 L504,614 L503,615 L497,615 L496,616 L477,618 L476,619 L464,620 L463,621 L456,621 L455,622 L429,625 L428,626 L422,626 L421,627 L389,631 L388,632 L376,633 L375,634 L369,634 L362,636 L358,635 L358,583 L360,581 L372,578 L391,571 L394,571 L429,559 L432,559 L435,557 L444,555 L466,547 L469,547 L491,539 L494,539 L506,534 L509,534 L542,523 L545,523 L551,520 L564,517 L577,512 L580,512 L587,509 L590,509 L597,506 L610,503 L616,500 L636,495 L665,485 L679,482 L689,478 L692,478 L728,466 L735,465 L778,451 L785,450 L798,445 L818,440 L828,436 L848,431 L861,426 L870,424 L873,422 L884,420 L887,418 L913,426 L916,426 L926,430 L933,431 L936,433 L957,438 L999,451 L1006,452 L1023,458 L1030,459 L1033,461 L1065,469 L1085,476 L1092,477 L1099,480 L1120,485 L1130,489 L1141,491 L1147,494 L1182,503 L1212,513 L1231,517 L1265,528 L1268,528 L1272,530 L1303,538 L1309,541 L1316,542 L1326,546 L1336,548ZM1248,241 L1248,281 L1249,282 L1295,282 L1296,281 L1296,241 L1295,240 L1249,240ZM1493,178 L1490,184 L1487,195 L1487,246 L1488,247 L1489,255 L1493,263 L1498,270 L1503,274 L1515,280 L1523,282 L1533,282 L1534,283 L1640,282 L1641,280 L1641,250 L1640,246 L1549,246 L1546,245 L1541,240 L1540,237 L1541,234 L1639,234 L1641,226 L1641,198 L1640,197 L1640,191 L1635,178 L1625,167 L1618,163 L1602,159 L1526,159 L1525,160 L1517,161 L1505,166ZM1540,201 L1548,193 L1581,193 L1584,194 L1589,199 L1590,206 L1589,207 L1582,207 L1581,208 L1545,208 L1540,206ZM998,159 L995,161 L995,281 L996,282 L1049,282 L1049,160 L1048,159ZM1059,159 L1059,162 L1114,221 L1105,232 L1062,276 L1059,280 L1059,282 L1126,282 L1150,257 L1160,266 L1174,282 L1241,282 L1241,280 L1190,226 L1187,221 L1243,163 L1244,161 L1243,159 L1178,159 L1151,187 L1125,159 L1119,159 L1118,158 L1117,159ZM865,177 L852,165 L842,161 L834,160 L833,159 L819,159 L818,158 L815,159 L749,159 L748,160 L740,161 L728,166 L715,179 L712,185 L709,196 L709,245 L713,258 L718,266 L725,273 L737,279 L749,282 L831,282 L832,281 L841,280 L853,275 L866,262 L870,254 L872,246 L873,203 L872,202 L871,190ZM765,202 L770,198 L775,196 L805,196 L806,197 L810,197 L816,202 L819,211 L819,231 L816,239 L813,242 L804,245 L777,245 L768,242 L763,236 L763,230 L762,229 L762,211ZM514,177 L508,170 L499,164 L482,159 L456,159 L455,158 L446,158 L445,159 L392,159 L375,164 L365,171 L359,178 L353,193 L353,199 L352,200 L352,240 L353,241 L354,252 L358,261 L372,275 L385,280 L395,281 L396,282 L476,282 L477,281 L483,281 L491,279 L505,272 L513,264 L517,257 L520,248 L520,242 L521,241 L521,197 L520,196 L519,188ZM408,204 L414,198 L420,196 L450,196 L457,198 L463,204 L465,209 L465,232 L463,237 L457,243 L449,245 L422,245 L414,243 L409,239 L406,231 L406,210ZM894,134 L894,158 L893,159 L877,159 L876,160 L876,196 L893,196 L894,197 L894,247 L895,248 L896,257 L901,268 L911,277 L924,282 L929,282 L930,283 L965,283 L966,282 L980,281 L982,279 L982,245 L981,244 L959,245 L954,243 L951,240 L949,234 L949,197 L950,196 L979,196 L979,160 L978,159 L950,159 L949,158 L949,122 L948,121 L924,127 L920,127 L912,130 L899,132ZM134,122 L134,281 L135,282 L191,282 L192,281 L192,230 L193,229 L223,229 L272,282 L345,282 L343,277 L338,273 L295,227 L312,223 L323,217 L333,206 L336,199 L338,191 L338,155 L336,147 L332,139 L324,130 L315,125 L306,122 L289,121 L288,120 L137,120ZM192,163 L193,162 L266,162 L271,164 L275,168 L277,173 L277,178 L275,183 L271,187 L266,189 L193,189 L192,188ZM1311,117 L1310,118 L1310,260 L1311,261 L1310,263 L1310,280 L1311,282 L1358,282 L1362,272 L1372,279 L1383,282 L1435,282 L1448,279 L1458,274 L1467,265 L1471,258 L1474,247 L1474,240 L1475,239 L1474,193 L1471,183 L1465,173 L1458,167 L1451,163 L1435,159 L1390,159 L1375,163 L1366,169 L1365,168 L1365,118 L1364,117ZM1366,200 L1373,196 L1407,196 L1413,198 L1418,203 L1420,209 L1420,232 L1419,233 L1419,237 L1415,242 L1407,245 L1373,245 L1368,243 L1365,239 L1365,202ZM995,118 L995,151 L1049,151 L1049,117 L996,117ZM533,118 L533,281 L534,282 L582,282 L583,276 L585,272 L591,277 L597,280 L605,281 L606,282 L658,282 L674,278 L684,272 L690,266 L697,251 L698,239 L699,238 L699,229 L698,228 L698,193 L697,192 L697,188 L692,177 L684,168 L673,162 L661,159 L613,159 L600,162 L589,169 L588,168 L588,118 L587,117 L534,117ZM593,197 L596,196 L630,196 L638,199 L643,206 L643,234 L641,239 L638,242 L629,245 L598,245 L591,243 L588,239 L588,203Z\"/>\n<path fill=\"#5B95C8\" fill-rule=\"evenodd\" d=\"M1143,328 L1137,334 L1136,337 L1137,342 L1140,346 L1144,348 L1150,348 L1156,343 L1157,340 L1156,333 L1150,328ZM594,328 L588,334 L588,341 L593,347 L601,348 L607,344 L609,338 L608,334 L602,328ZM1591,313 L1590,314 L1609,341 L1609,360 L1617,360 L1618,359 L1618,341 L1635,317 L1636,313 L1635,312 L1628,312 L1614,331 L1612,330 L1605,319 L1599,312 L1598,313ZM1539,312 L1537,314 L1538,321 L1551,321 L1552,322 L1552,358 L1553,360 L1561,360 L1562,359 L1562,322 L1563,321 L1576,321 L1577,320 L1577,313 L1576,312ZM1519,312 L1512,313 L1512,360 L1520,360 L1521,358 L1521,314ZM1453,312 L1452,313 L1452,360 L1460,360 L1461,359 L1461,343 L1462,342 L1469,342 L1483,360 L1492,360 L1493,359 L1481,343 L1482,341 L1487,339 L1490,336 L1492,331 L1492,324 L1489,318 L1484,314 L1477,312ZM1461,322 L1462,321 L1478,321 L1482,324 L1483,329 L1478,334 L1462,334 L1461,333ZM1391,313 L1391,347 L1394,354 L1398,358 L1405,361 L1418,361 L1424,359 L1428,356 L1432,348 L1432,313 L1431,312 L1425,312 L1423,314 L1423,346 L1419,351 L1414,353 L1408,353 L1402,349 L1400,344 L1400,313 L1399,312ZM1273,313 L1273,359 L1274,360 L1308,360 L1308,352 L1283,352 L1282,351 L1282,341 L1283,340 L1305,340 L1306,339 L1306,332 L1283,332 L1282,331 L1282,322 L1283,321 L1306,321 L1308,319 L1308,314 L1306,312 L1275,312ZM1040,313 L1040,359 L1041,360 L1048,360 L1049,359 L1049,345 L1054,341 L1071,360 L1082,360 L1081,357 L1061,335 L1081,313 L1079,312 L1071,312 L1051,331 L1049,330 L1049,313 L1048,312ZM982,312 L981,313 L981,325 L980,326 L980,345 L981,346 L981,356 L980,358 L981,360 L989,360 L990,343 L991,342 L992,343 L993,342 L998,343 L1012,360 L1021,360 L1020,356 L1010,343 L1011,341 L1017,338 L1020,333 L1021,326 L1019,320 L1013,314 L1006,312ZM989,325 L991,321 L1007,321 L1011,324 L1012,328 L1006,334 L991,334 L990,333ZM832,313 L834,322 L838,332 L838,335 L847,360 L854,360 L856,358 L865,330 L867,332 L876,359 L877,360 L884,360 L885,359 L899,315 L898,312 L891,312 L890,313 L885,327 L883,337 L880,343 L870,313 L863,312 L861,314 L854,337 L851,342 L848,336 L841,313 L839,312ZM781,312 L780,313 L780,320 L781,321 L794,321 L795,322 L795,358 L796,360 L804,360 L804,329 L805,328 L805,322 L806,321 L818,321 L820,319 L820,314 L818,312ZM731,312 L729,314 L729,355 L730,356 L730,360 L765,360 L765,353 L764,352 L740,352 L739,351 L739,341 L740,340 L762,340 L763,339 L763,333 L762,332 L740,332 L739,331 L739,322 L740,321 L763,321 L765,319 L764,313 L763,312ZM664,313 L664,359 L665,360 L672,360 L673,359 L673,330 L674,329 L698,360 L707,360 L707,313 L706,312 L698,313 L698,342 L697,343 L673,312 L666,312ZM493,312 L492,314 L508,336 L491,359 L492,360 L501,360 L510,348 L515,344 L527,360 L536,360 L537,358 L521,337 L521,334 L536,315 L536,313 L535,312 L527,312 L514,328 L501,312ZM466,312 L465,313 L465,359 L466,360 L474,360 L474,312ZM410,312 L409,313 L409,319 L413,321 L423,321 L424,322 L424,359 L425,360 L432,360 L433,359 L433,322 L435,320 L436,321 L448,320 L449,319 L449,314 L448,312ZM274,313 L274,323 L273,324 L273,358 L275,360 L282,360 L283,359 L283,336 L284,335 L288,341 L296,358 L302,358 L307,350 L311,340 L313,338 L313,336 L315,334 L316,335 L316,359 L317,360 L324,360 L325,359 L325,313 L324,312 L315,312 L303,338 L299,343 L283,312 L275,312ZM139,312 L138,313 L138,359 L139,360 L161,360 L162,359 L166,359 L172,356 L179,349 L182,343 L182,330 L179,322 L172,315 L164,312ZM148,320 L163,321 L170,326 L173,333 L173,338 L171,344 L165,350 L162,351 L148,351 L147,350 L147,321ZM1344,312 L1339,314 L1330,322 L1326,332 L1327,345 L1330,351 L1338,358 L1346,361 L1357,361 L1368,356 L1371,353 L1371,351 L1366,346 L1361,350 L1354,353 L1349,353 L1343,351 L1338,346 L1336,342 L1336,331 L1338,327 L1343,322 L1348,320 L1358,321 L1365,326 L1368,325 L1371,320 L1366,315 L1359,312 L1354,312 L1353,311ZM1237,311 L1224,313 L1220,315 L1215,322 L1215,330 L1221,337 L1230,340 L1239,341 L1244,345 L1244,348 L1240,352 L1237,353 L1230,353 L1223,350 L1220,347 L1218,347 L1214,352 L1214,354 L1227,361 L1243,360 L1247,358 L1251,354 L1253,350 L1253,341 L1247,335 L1243,333 L1227,330 L1224,327 L1224,324 L1229,320 L1237,320 L1244,323 L1246,325 L1249,323 L1251,318 L1249,316ZM929,312 L922,315 L913,325 L911,331 L911,342 L915,351 L920,356 L927,360 L931,361 L946,360 L952,357 L959,350 L962,344 L962,329 L961,326 L954,317 L947,313 L939,311ZM930,321 L933,320 L944,321 L950,326 L953,333 L952,343 L943,352 L939,353 L930,352 L923,346 L920,339 L921,330 L924,325ZM355,315 L350,320 L345,330 L346,345 L352,354 L360,359 L367,361 L379,360 L387,356 L393,350 L397,340 L397,332 L394,323 L385,314 L377,311 L364,311ZM361,322 L365,320 L376,320 L381,322 L385,326 L387,330 L387,341 L385,345 L380,350 L375,352 L366,352 L358,347 L355,342 L354,333 L357,326ZM215,313 L205,322 L202,329 L201,338 L204,348 L211,356 L219,360 L230,361 L242,357 L249,351 L253,342 L253,336 L254,335 L253,334 L253,328 L250,322 L243,315 L234,311 L221,311ZM218,322 L222,320 L233,320 L237,322 L242,327 L244,332 L244,339 L241,346 L237,350 L232,352 L223,352 L217,349 L213,345 L211,340 L211,332 L213,327Z\"/>\n</svg>\n";

function rhiUxEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch]));
}

function rhiUxDisplay(value, fallback = "—") {
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function rhiUxLocaleCandidates(locale = "en") {
  const normalized = String(locale || "en").trim().replace(/_/g, "-").toLowerCase();
  const base = normalized.split("-")[0] || "en";
  return [...new Set([normalized, base, "en"])];
}

function rhiUxTranslate(resources = {}, key = "", { locale = "en", params = {}, fallback = "" } = {}) {
  const wanted = String(key || "");
  let template = "";
  for (const candidate of rhiUxLocaleCandidates(locale)) {
    const row = resources?.[candidate];
    if (row && Object.prototype.hasOwnProperty.call(row, wanted)) {
      template = String(row[wanted] ?? "");
      break;
    }
  }
  if (!template) template = fallback || wanted;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, name) => rhiUxEscape(rhiUxDisplay(params?.[name], "")));
}

function rhiUxFormatNumber(value, { locale = "en", maximumFractionDigits = 2, minimumFractionDigits = 0 } = {}) {
  if (value === undefined || value === null || value === "" || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat(locale, { maximumFractionDigits, minimumFractionDigits }).format(Number(value));
}

function rhiUxFormatCurrency(value, currency = "EUR", { locale = "en", maximumFractionDigits = 2 } = {}) {
  if (value === undefined || value === null || value === "" || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat(locale, { style:"currency", currency, maximumFractionDigits }).format(Number(value));
}

function rhiUxFormatPercent(value, { locale = "en", scale = 100, maximumFractionDigits = 1 } = {}) {
  if (value === undefined || value === null || value === "" || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat(locale, { style:"percent", maximumFractionDigits }).format(Number(value) / Number(scale || 100));
}

function rhiUxFormatDateTime(value, { locale = "en", dateStyle = "medium", timeStyle = "short" } = {}) {
  if (value === undefined || value === null || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, { dateStyle, timeStyle }).format(date);
}

function rhiUxStatusItem({ icon = "•", label = "", value = "—", detail = "" } = {}) {
  const iconMarkup = /^mdi:/.test(String(icon || "")) ? `<ha-icon icon="${rhiUxEscape(icon)}"></ha-icon>` : rhiUxEscape(icon);
  return `<div class="rhiUxStatusItem"><span class="rhiUxStatusIcon">${iconMarkup}</span><div class="rhiUxStatusCopy"><small>${rhiUxEscape(label)}</small><b>${rhiUxEscape(rhiUxDisplay(value))}</b>${detail ? `<em>${rhiUxEscape(detail)}</em>` : ""}</div></div>`;
}

function rhiUxStatusGrid(items = []) {
  return `<section class="rhiUxStatusGrid">${items.map(rhiUxStatusItem).join("")}</section>`;
}

function rhiUxPageHero({ eyebrow = "", title = "", description = "", image = "", imageAlt = "" } = {}) {
  return `<section class="rhiUxPageHero"><div class="rhiUxPageHeroCopy">${eyebrow ? `<small>${rhiUxEscape(eyebrow)}</small>` : ""}<h2>${rhiUxEscape(title)}</h2>${description ? `<p>${rhiUxEscape(description)}</p>` : ""}</div>${image ? `<div class="rhiUxPageHeroArt"><img src="${rhiUxEscape(image)}" alt="${rhiUxEscape(imageAlt)}"></div>` : ""}</section>`;
}

function rhiUxState({ state = "unavailable", title = "Unavailable", detail = "" } = {}) {
  return `<div class="rhiUxState" data-state="${rhiUxEscape(state)}"><b>${rhiUxEscape(title)}</b>${detail ? `<span>${rhiUxEscape(detail)}</span>` : ""}</div>`;
}

function rhiUxConclusion({ title = "", detail = "", label = "Conclusion" } = {}) {
  return `<section class="rhiUxConclusion"><div><small>${rhiUxEscape(label)}</small><h2>${rhiUxEscape(title)}</h2>${detail ? `<p>${rhiUxEscape(detail)}</p>` : ""}</div></section>`;
}

function rhiUxTechnicalFooter({ product = "", uxVersion = "", backendVersion = "", issue = "", severity = "" } = {}) {
  return `<footer class="rhiUxTechnicalFooter"><span>${rhiUxEscape(product)} UX ${rhiUxEscape(uxVersion)}</span><span>Backend ${rhiUxEscape(rhiUxDisplay(backendVersion,"Unknown"))}</span>${issue ? `<span data-severity="${rhiUxEscape(severity)}">${rhiUxEscape(issue)}</span>` : ""}</footer>`;
}

function rhiUxCompanyBrand({ ariaLabel = "Robotix.be — DomotiX · Network · Security" } = {}) {
  return `<span class="rhiUxCompanyLogo" role="img" aria-label="${rhiUxEscape(ariaLabel)}">${RHI_UX_COMPANY_LOGO_SVG}</span>`;
}

function rhiUxDomainShell({ product = "Home Intelligence", domain = "", modules = [], activeModule = "", activeItem = "", brandHtml = rhiUxCompanyBrand() } = {}) {
  const selected = modules.find(row => String(row.id || "") === String(activeModule || "")) || modules[0] || { items:[] };
  const moduleButtons = modules.map(row => {
    const active = String(row.id || "") === String(selected.id || "");
    return `<button type="button" class="rhiUxModuleTab${active ? " active" : ""}" data-rhi-module="${rhiUxEscape(row.id || "")}"${row.target ? ` data-nav="${rhiUxEscape(row.target)}"` : ""}><span>${rhiUxEscape(row.label || row.id || "")}</span></button>`;
  }).join("");
  const itemButtons = (selected.items || []).map(row => {
    const active = String(row.id || "") === String(activeItem || "");
    return `<button type="button" class="rhiUxDomainTab${active ? " active" : ""}" data-rhi-item="${rhiUxEscape(row.id || "")}"${row.target ? ` data-nav="${rhiUxEscape(row.target)}"` : ""}><span>${rhiUxEscape(row.label || row.id || "")}</span></button>`;
  }).join("");
  return `<header class="rhiUxDomainShell"><div class="rhiUxProductArea"><div class="rhiUxDomainShellTop"><div class="rhiUxDomainIdentity"><span>${rhiUxEscape(product)}</span><strong>${rhiUxEscape(domain)}</strong></div><nav class="rhiUxModuleTabs" aria-label="Modules">${moduleButtons}</nav></div><div class="rhiUxDomainShellBottom"><nav class="rhiUxDomainTabs" aria-label="${rhiUxEscape(selected.label || domain || "Domain")} navigation">${itemButtons}</nav></div></div>${brandHtml ? `<div class="rhiUxCompanyBrand">${brandHtml}</div>` : ""}</header>`;
}


function rhiUxQuickActionBar({ label = "Quick actions", actions = [] } = {}) {
  const visibleActions = actions.filter(action => action?.visible !== false);
  if (!visibleActions.length) return "";
  return `<section class="rhiUxQuickActionBar" aria-label="${rhiUxEscape(label)}"><small>${rhiUxEscape(label)}</small><div class="rhiUxQuickActions">${visibleActions.map((action,index) => {
    const disabled = action.enabled === false || action.disabled === true;
    const reason = String(action.reason || "");
    return `<button type="button" class="rhiUxQuickAction${action.primary || index === 0 ? " primary" : ""}"${action.target ? ` data-nav="${rhiUxEscape(action.target)}"` : ""}${disabled ? " disabled" : ""}${reason ? ` title="${rhiUxEscape(reason)}"` : ""}>${action.icon ? `<ha-icon icon="${rhiUxEscape(action.icon)}"></ha-icon>` : ""}<span>${rhiUxEscape(action.label || "Open")}</span></button>`;
  }).join("")}</div></section>`;
}

function rhiUxContextBar({ label = "View", controls = [], controlsId = "" } = {}) {
  if (!Array.isArray(controls) || controls.length === 0) return "";
  const labelled = label ? `<small>${rhiUxEscape(label)}</small>` : "";
  const body = controls.filter(control => control?.visible !== false).map((control,index) => {
    const attrs = [];
    if (control.value !== undefined) attrs.push(`data-value="${rhiUxEscape(control.value)}"`);
    if (control.target) attrs.push(`data-nav="${rhiUxEscape(control.target)}"`);
    if (control.pressed !== undefined) attrs.push(`aria-pressed="${control.pressed ? "true" : "false"}"`);
    if (control.enabled === false || control.disabled) attrs.push("disabled");
    if (control.reason) attrs.push(`title="${rhiUxEscape(control.reason)}"`);
    const cls = `rhiUxContextControl${control.active || control.pressed ? " active" : ""}`;
    return `<button type="button" class="${cls}" ${attrs.join(" ")}>${rhiUxEscape(control.label || control.value || `Option ${index+1}`)}</button>`;
  }).join("");
  const idAttr = controlsId ? ` aria-controls="${rhiUxEscape(controlsId)}"` : "";
  return `<section class="rhiUxContextBar" aria-label="${rhiUxEscape(label || "View controls")}"${idAttr}>${labelled}<div class="rhiUxContextControls">${body}</div></section>`;
}


function rhiUxPageTemplate({ hero = "", status = "", actions = "", context = "", content = "", className = "" } = {}) {
  return `<main class="rhiUxPage rhiUxPageStack ${rhiUxEscape(className)}">${hero}${status}${actions}${context}<section class="rhiUxPageContent">${content}</section></main>`;
}


/* Shared presentation only. Domain adapters supply the factual values and safe actions. */
function rhiUxCompactAssetRow({
  name = "", visualHtml = "", context = "", power = "—", state = "",
  relationshipLabel = "", relationshipTarget = "", disclosureHtml = ""
} = {}) {
  const link = relationshipLabel && relationshipTarget
    ? `<button type="button" class="rhiUxAssetRelationshipLink" data-nav="${rhiUxEscape(relationshipTarget)}">${rhiUxEscape(relationshipLabel)}</button>`
    : (relationshipLabel ? `<span>${rhiUxEscape(relationshipLabel)}</span>` : "");
  return `<div class="rhiUxAssetRow">
    <div class="rhiUxAssetImage">${visualHtml}</div>
    <div class="rhiUxAssetRowIdentity"><strong class="rhiUxAssetName">${rhiUxEscape(name)}</strong>${context ? `<span class="rhiUxAssetContext">${rhiUxEscape(context)}</span>` : ""}${link ? `<div class="rhiUxAssetRowRelationship">${link}</div>` : ""}</div>
    <div class="rhiUxAssetLive"><strong class="rhiUxAssetPower">${rhiUxEscape(rhiUxDisplay(power))}</strong>${state ? `<span class="rhiUxAssetState">${rhiUxEscape(state)}</span>` : ""}</div>
    ${disclosureHtml ? `<div class="rhiUxAssetExpand">${disclosureHtml}</div>` : ""}
  </div>`;
}

function rhiUxAssetCardShell({ identity = "", facts = "", relationships = "", actions = "", details = "", feedback = "", className = "" } = {}) {
  const cls = ["rhiUxAssetCardShell", String(className || "").trim()].filter(Boolean).join(" ");
  const body = [
    identity ? `<div class="rhiUxAssetCardIdentity">${identity}</div>` : "",
    facts ? `<div class="rhiUxAssetCardFacts">${facts}</div>` : "",
    relationships ? `<div class="rhiUxAssetCardRelationships">${relationships}</div>` : "",
    actions ? `<div class="rhiUxAssetCardActions">${actions}</div>` : "",
    details ? `<div class="rhiUxAssetCardDetails">${details}</div>` : "",
    feedback ? `<div class="rhiUxAssetCardFeedback">${feedback}</div>` : ""
  ].join("");
  return `<article class="${rhiUxEscape(cls)}">${body}</article>`;
}

function rhiUxAssetIdentity({ eyebrow = "", title = "", subtitle = "", visual = "" } = {}) {
  return `<header class="rhiUxAssetIdentity">${visual ? `<div class="rhiUxAssetVisual">${visual}</div>` : ""}<div class="rhiUxAssetIdentityCopy">${eyebrow ? `<small>${rhiUxEscape(eyebrow)}</small>` : ""}<h2>${rhiUxEscape(title)}</h2>${subtitle ? `<p>${rhiUxEscape(subtitle)}</p>` : ""}</div></header>`;
}

function rhiUxAssetFactGrid(items = []) {
  return `<div class="rhiUxAssetFactGrid">${items.map(item => `<div class="rhiUxAssetFact"><small>${rhiUxEscape(item?.label || "")}</small><b>${rhiUxEscape(rhiUxDisplay(item?.value))}</b>${item?.detail ? `<span>${rhiUxEscape(item.detail)}</span>` : ""}</div>`).join("")}</div>`;
}

function rhiUxAssetRelationship({ label = "", value = "", detail = "", target = "" } = {}) {
  return `<div class="rhiUxAssetRelationship"><div><small>${rhiUxEscape(label)}</small><b>${rhiUxEscape(rhiUxDisplay(value))}</b>${detail ? `<span>${rhiUxEscape(detail)}</span>` : ""}</div>${target ? `<button type="button" data-nav="${rhiUxEscape(target)}">Open</button>` : ""}</div>`;
}

function rhiUxAssetDisclosure({ title = "Details", content = "", open = false } = {}) {
  return `<details class="rhiUxAssetDisclosure"${open ? " open" : ""}><summary>${rhiUxEscape(title)}</summary><div>${content}</div></details>`;
}

function rhiUxWriteFeedback({ state = "idle", message = "" } = {}) {
  if (!message) return "";
  return `<div class="rhiUxWriteFeedback" data-state="${rhiUxEscape(state)}" role="status">${rhiUxEscape(message)}</div>`;
}




const RHI_UX_NAVIGATION_STORAGE_KEY = "rhi.navigation.registry.v1";

function rhiUxReadNavigationRegistry(storage = globalThis?.localStorage) {
  try {
    const raw = storage?.getItem?.(RHI_UX_NAVIGATION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    return {};
  }
}

function rhiUxRegisterDomainNavigation({ domain = "", assetDetailTemplate = "" } = {}, storage = globalThis?.localStorage) {
  const key = String(domain || "").trim();
  const template = String(assetDetailTemplate || "").trim();
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(key)) return false;
  if (!template || !template.includes("{asset_id}")) return false;
  if (/^https?:\/\//i.test(template)) return false;
  try {
    const registry = rhiUxReadNavigationRegistry(storage);
    registry[key] = { asset_detail_template:template };
    storage?.setItem?.(RHI_UX_NAVIGATION_STORAGE_KEY, JSON.stringify(registry));
    return true;
  } catch (_) {
    return false;
  }
}

function rhiUxResolveDomainAssetNavigation(domain = "", assetId = "", storage = globalThis?.localStorage) {
  const key = String(domain || "").trim();
  const id = String(assetId || "").trim();
  if (!key || !id) return "";
  const row = rhiUxReadNavigationRegistry(storage)[key];
  const template = String(row?.asset_detail_template || "");
  if (!template.includes("{asset_id}")) return "";
  return template.replaceAll("{asset_id}", encodeURIComponent(id));
}


function rhiUxVisualPickerStyles() {
  return `
.rhiUxVisualPickerBackdrop{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.44);display:grid;place-items:center;padding:20px}
.rhiUxVisualPickerPanel{width:min(920px,94vw);max-height:min(82vh,760px);overflow:hidden;background:#fff;border:1px solid var(--rhi-color-line,#e5ebf3);border-radius:20px;box-shadow:0 30px 80px rgba(15,23,42,.24);padding:16px;box-sizing:border-box;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto auto;gap:10px}
.rhiUxVisualPickerHead{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;min-height:0}
.rhiUxVisualPickerHead small{font-size:var(--rhi-font-label);font-weight:800;letter-spacing:.12em;color:#64748b}.rhiUxVisualPickerHead h3{margin:2px 0 0;font-size:20px}.rhiUxVisualPickerHead p{margin:3px 0 0;font-size:11px;color:#64748b}
.rhiUxVisualPickerFilters{display:flex;gap:6px;flex-wrap:wrap;margin:0;min-height:0}
.rhiUxVisualPickerFilters button{border:1px solid #dbe3ee;background:#fff;border-radius:999px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer}.rhiUxVisualPickerFilters button.selected{border-color:#93c5fd;background:#eff6ff;color:#1d4ed8}
.rhiUxVisualChoiceGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:142px;gap:8px;margin:0;overflow-y:auto;overscroll-behavior:contain;padding:2px 3px 4px 1px;align-content:start}
.rhiUxVisualChoice{height:142px;min-height:142px;max-height:142px;display:grid;grid-template-rows:86px minmax(0,1fr);gap:6px;align-items:stretch;text-align:left;border:1px solid #e2e8f0;background:#fff;border-radius:12px;padding:8px;cursor:pointer;overflow:hidden}.rhiUxVisualChoice:hover{border-color:#93c5fd;background:#f8fbff}.rhiUxVisualChoice.selected{border-color:#2563eb;box-shadow:0 0 0 2px rgba(37,99,235,.12);background:#f8fbff}
.rhiUxVisualChoiceImage{width:100%;height:86px;min-width:0;min-height:86px;max-width:none;max-height:86px;display:grid;place-items:center;overflow:hidden}.rhiUxVisualChoiceImage img{display:block;width:100%;height:100%;min-width:0;min-height:0;max-width:100%;max-height:100%;object-fit:contain;object-position:center}
.rhiUxVisualChoiceCopy{min-width:0;align-self:end}.rhiUxVisualChoiceCopy small,.rhiUxVisualChoiceCopy b,.rhiUxVisualChoiceCopy em{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rhiUxVisualChoiceCopy small{font-size:var(--rhi-font-label);color:#64748b;text-transform:uppercase}.rhiUxVisualChoiceCopy b{font-size:12px;margin-top:1px}.rhiUxVisualChoiceCopy em{font-size:var(--rhi-font-small);color:#64748b;font-style:normal;margin-top:1px}
.rhiUxVisualPickerRefine{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:8px;margin:0}.rhiUxVisualPickerRefine label span{display:block;font-size:var(--rhi-font-label);color:#64748b;margin-bottom:3px}.rhiUxVisualPickerRefine select{width:100%;height:34px;border:1px solid #dbe3ee;border-radius:8px;background:#fff;padding:0 8px}
.rhiUxVisualPickerFooter{display:flex;align-items:center;gap:8px;margin:0;padding-top:9px;border-top:1px solid #edf1f6}.rhiUxVisualPickerSpacer{flex:1}.rhiUxVisualPickerFooter button{height:34px;border:1px solid #dbe3ee;border-radius:9px;background:#fff;padding:0 12px;font-size:var(--rhi-font-small);font-weight:700}.rhiUxVisualPickerFooter button.primary{background:#0b65ea;color:#fff;border-color:#0b65ea}.rhiUxVisualPickerFooter button:disabled{opacity:.45}
@media(max-width:900px){.rhiUxVisualChoiceGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.rhiUxVisualPickerBackdrop{padding:8px}.rhiUxVisualPickerPanel{width:96vw;max-height:88vh;padding:12px}.rhiUxVisualChoiceGrid{grid-template-columns:1fr;grid-auto-rows:116px}.rhiUxVisualChoice{height:116px;min-height:116px;max-height:116px;grid-template-columns:94px minmax(0,1fr);grid-template-rows:1fr}.rhiUxVisualChoiceImage{width:94px;height:86px;min-width:94px;max-width:94px}.rhiUxVisualChoiceCopy{align-self:center}.rhiUxVisualPickerRefine{grid-template-columns:1fr 1fr}.rhiUxVisualPickerFooter{flex-wrap:wrap}}
`;
}

function rhiUxVisualPickerShell({
  eyebrow = "Appearance",
  title = "Choose appearance",
  description = "",
  filtersHtml = "",
  choicesHtml = "",
  refineHtml = "",
  selectedHtml = "",
  resetHtml = "",
  cancelHtml = "",
  saveHtml = "",
  modal = false,
  closeHtml = ""
} = {}) {
  const panel = `<section class="rhiUxVisualPickerPanel" role="${modal ? "dialog" : "region"}"${modal ? ' aria-modal="true"' : ""}>
    <header class="rhiUxVisualPickerHead"><div><small>${rhiUxEscape(eyebrow)}</small><h3>${rhiUxEscape(title)}</h3>${description ? `<p>${rhiUxEscape(description)}</p>` : ""}</div>${closeHtml}</header>
    ${filtersHtml ? `<div class="rhiUxVisualPickerFilters">${filtersHtml}</div>` : ""}
    <div class="rhiUxVisualChoiceGrid">${choicesHtml}</div>
    ${refineHtml ? `<div class="rhiUxVisualPickerRefine">${refineHtml}</div>` : ""}
    <footer class="rhiUxVisualPickerFooter">${resetHtml}<span class="rhiUxVisualPickerSpacer"></span>${selectedHtml}${cancelHtml}${saveHtml}</footer>
  </section>`;
  return modal ? `<div class="rhiUxVisualPickerBackdrop">${panel}</div>` : panel;
}


function rhiUxVisualFilterButtons({ values = [], active = "all", allLabel = "All", attribute = "data-rhi-visual-filter" } = {}) {
  const rows = [{ value:"all", label:allLabel }, ...values.map(value => typeof value === "object" ? value : { value, label:value })];
  return rows.map(row => { const value=String(row?.value ?? ""); const label=String(row?.label ?? value); const selected=value===String(active ?? "all"); return `<button type="button" class="${selected ? "selected" : ""}" ${rhiUxEscape(attribute)}="${rhiUxEscape(value)}" aria-pressed="${selected ? "true" : "false"}">${rhiUxEscape(label)}</button>`; }).join("");
}
function rhiUxVisualChoice({ id = "", image = "", imageAlt = "", eyebrow = "", label = "", detail = "", selected = false, imageStyle = "", attributes = {} } = {}) {
  const attrs=Object.entries(attributes || {}).filter(([key])=>/^data-[a-z0-9_-]+$/i.test(String(key))).map(([key,value])=>`${rhiUxEscape(key)}="${rhiUxEscape(value)}"`).join(" "); const style=imageStyle ? ` style="${rhiUxEscape(imageStyle)}"` : "";
  return `<button type="button" class="rhiUxVisualChoice${selected ? " selected" : ""}" data-rhi-visual-choice="${rhiUxEscape(id)}" ${attrs} aria-pressed="${selected ? "true" : "false"}><span class="rhiUxVisualChoiceImage">${image ? `<img src="${rhiUxEscape(image)}" alt="${rhiUxEscape(imageAlt)}"${style}>` : ""}</span><span class="rhiUxVisualChoiceCopy">${eyebrow ? `<small>${rhiUxEscape(eyebrow)}</small>` : ""}<b>${rhiUxEscape(label)}</b>${detail ? `<em>${rhiUxEscape(detail)}</em>` : ""}</span></button>`;
}
function rhiUxVisualSelect({ label = "", value = "", options = [], placeholder = "", disabled = false, attribute = "data-rhi-visual-select" } = {}) {
  const current=String(value ?? ""); const first=placeholder ? `<option value="" ${current ? "" : "selected"} disabled>${rhiUxEscape(placeholder)}</option>` : ""; const rows=options.map(row=>typeof row==="object" ? row : {value:row,label:row}).map(row=>`<option value="${rhiUxEscape(row.value)}" ${String(row.value)===current ? "selected" : ""}>${rhiUxEscape(row.label ?? row.value)}</option>`).join(""); return `<label><span>${rhiUxEscape(label)}</span><select ${rhiUxEscape(attribute)}="1" ${disabled ? "disabled" : ""}>${first}${rows}</select></label>`;
}


// Existing native room status entities own the resident-facing properties.
const RHI_MM_VIEWS = Object.freeze(['overview','settings','insights','rooms','activities','devices','diagnostics']);
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
    return {domain:'rhi_multimedia',service:action,data:{room:room.id,button:key}};
  }
  if(action==='run_activity_macro'){
    if(!Array.isArray(active.macros)||
       !active.macros.some(macro=>macro.id===key&&macro.enabled===true))return null;
    return {domain:'rhi_multimedia',service:action,data:{room:room.id,macro:key}};
  }
  return null;
}

function rhiMmDeviceIntent(room, key, action, value) {
  const device=room?.devices?.find(d=>d.key===key);
  const capability=device?.controls?.[action];
  if(!device?.foundation_approved||!capability?.enabled||['starting','stopping'].includes(room.phase))return null;
  if(Array.isArray(capability.options)){if(typeof value!=='string'||!capability.options.includes(value))return null;}
  else if(action==='volume'){if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1)return null;}
  else if(action==='mute'){if(typeof value!=='boolean')return null;}
  else if(action==='remote_text'){
    if(typeof value!=='string'||value.length<1||value.length>256||/[\x00-\x1f\x7f]/.test(value))return null;
  }else if(value!==undefined&&value!==null)return null;
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
  'complete_setup',
  'add_room','rename_room','edit_room','remove_room',
  'guided_activity','add_activity','quick_edit_activity','edit_activity','activity_devices','remove_activity',
  'cec_device','cec_activity','tv_wake','harmony_owner','speech_endpoint','expert_yaml','yaml','script_defaults','script_step','button_mapping','macro_manage'
]));
async function rhiMmOptionsBegin(hass,{action,room='',activity='',scope='',id='',
  phase='',operation='',index=null,device='',stepType=''}){
  if(hass?.user?.is_admin!==true||typeof hass.callWS!=='function'||
     typeof hass.callApi!=='function'||!RHI_MM_OPTION_ACTIONS.has(action))
    throw new Error('Multimedia configuration is not authorized');
  const entries=await hass.callWS({type:'config_entries/get',domain:'rhi_multimedia'});
  const matched=Array.isArray(entries)?entries.filter(e=>
    e?.domain==='rhi_multimedia'&&e.supports_options===true&&
    typeof e.entry_id==='string'&&e.entry_id):[];
  if(matched.length!==1)throw new Error('Multimedia Options Flow unavailable');
  let step=await hass.callApi('POST','config/config_entries/options/flow',
    {handler:matched[0].entry_id});
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


const RHI_MM_TEXT = {
  "en": {
    "settings_post_power_delay": "After actual Power On",
    "failed_step": "Failed at",
    "execution_trace": "Execution steps",
    "trace_truncated": "Only the latest 64 steps are shown",
    "trace_phase_start": "Start",
    "trace_phase_steps": "Actions",
    "trace_phase_stop_steps": "Stop actions",
    "trace_phase_retire": "Power down",
    "trace_phase_verify": "Verify",
    "trace_result_pending": "In progress",
    "trace_result_observed": "Native HA readback observed",
    "trace_result_already_ready_or_passive": "Already ready or passive; no new power command",
    "trace_result_submitted_unverified": "Submitted; physical outcome not independently verified",
    "trace_result_command_completed": "Command completed; target proof separate",
    "trace_result_cec_delegated_unverified": "Delegated to HDMI-CEC; outcome not independently verified",
    "trace_result_skipped_unsafe_replay": "Skipped to avoid unsafe replay",
    "trace_result_failed": "Failed",
    "trace_result_interrupted": "Interrupted",
    "trace_result_attention": "Native target mismatch",
    "trace_result_completed": "Completed; review native readback",
    "reserved_by": "Reserved by",
    "activity_off": "Activity Off",
    "all_off": "All Off",
    "repair_activity": "Repair activity",
    "media_unknown": "Media details unavailable",
    "source_unknown": "Source unknown",
    "playback_progress": "Reported playback progress",
    "device_basic_actions": "Basic device actions",
    "settings_button_mapping": "Assign activity buttons",
    "settings_macro_shortcuts": "Manage one-touch macros",
    "settings_no_mapping": "No button assignment configured.",
    "settings_no_macro": "No named macros configured.",
    "settings_step_count": "steps",
    "role_display": "Screen",
    "role_receiver": "Audio zone",
    "role_amplifier": "Audio zone",
    "role_player": "Media player",
    "role_source": "Media source",
    "role_remote": "Remote control",
    "state_paused": "Paused",
    "state_standby": "Standby",
    "state_buffering": "Buffering",
    "room_attention_detail": "Check this room’s devices or activity.",
    "product_specs": "Product specifications",
    "spec_screen_inches": "Screen (inches)",
    "spec_panel": "Panel",
    "spec_resolution": "Resolution",
    "spec_amplified_channels": "Amplified channels",
    "spec_subwoofer_outputs": "Subwoofer outputs",
    "spec_hdmi_inputs": "HDMI inputs",
    "spec_hdmi_outputs": "HDMI outputs",
    "spec_touch_points": "Touch points",
    "available_room_controls": "Available in this room",
    "product_details": "Product details",
    "setup_editor": "Configure Multimedia",
    "setup_continue": "Continue / review",
    "setup_cancel": "Cancel",
    "setup_saved": "Multimedia configuration saved; await native device status refresh",
    "setup_flow_failed": "Configuration flow unavailable or interrupted; use native Home Assistant settings",
    "setup_field_unsupported": "Field requires native Home Assistant configuration",
    "setup_edit_activity": "Quick edit",
    "setup_expert_yaml": "Expert · YAML",
    "illustrative_device_art": "Illustrative product image",
    "product_image_details": "View device image",
    "setup_expert_yaml_all": "Expert YAML · All Multimedia",
    "setup_more_actions": "More settings",
    "setup_edit_cast": "Full edit",
    "setup_remove_activity": "Delete activity",
    "setup_add_activity": "Add activity",
    "setup_guided_activity": "Create an experience",
    "setup_edit_location": "Room / floor",
    "setup_edit_devices": "Devices / roles",
    "setup_remove_room": "Delete room",
    "setup_add_room": "Add room",
    "diag_actual": "Actual native readback",
    "diag_device_unavailable": "Native endpoint unavailable",
    "diag_not_selected": "Foundation selection no longer valid",
    "source_repair_action": "Review device binding",
    "source_repair_hint": "Review this exact device in RHI Foundation → Configure → Multimedia, then confirm its room role and native input here in Multimedia Settings. No commands are sent during review.",
    "diag_devices_attention": "Device attention",
    "recommend_recover": "Recommended action: Recover activity",
    "recommend_review_foundation": "Recommended action: Review Foundation device selection",
    "recommend_inspect_sources": "Recommended action: Check unavailable devices",
    "diag_asset_id": "Logical asset",
    "diag_source": "Native HA source",
    "diag_provider": "Source integration",
    "diag_command_allowed": "Permitted",
    "diag_command_blocked": "Blocked",
    "verified_model": "Native-verified model",
    "last_attempt": "Last activity attempt",
    "last_control": "Last direct command",
    "native_features": "Native HA feature bitmask",
    "native_readback_at": "Native readback at",
    "readback_quality": "Native readback evidence",
    "readback_provider_optimistic": "Provider-reported; independent physical confirmation unavailable",
    "readback_native_ha_state": "Home Assistant source state",
    "readback_unapproved": "Source selection is not approved",
    "setup_native_route_only": "TV/receiver input routing — no separate native player assigned",
    "remote_navigation": "Navigation",
    "remote_media": "Channels and playback",
    "remote_numbers": "Number keypad",
    "remote_apps": "Apps and colour keys",
    "remote_more": "Other remote keys",
    "harmony_owner": "Harmony control",
    "harmony_scope": "Harmony owns the declared endpoints; Premium activities are retained but disabled.",
    "harmony_activity": "Harmony activity",
    "harmony_confirmed": "Harmony hub confirmed its activity. Individual physical devices are not independently verified.",
    "harmony_unavailable": "Harmony activity unavailable",
    "multimedia": "Multimedia",
    "overview": "Overview",
    "rooms": "Rooms",
    "activities": "Activities",
    "insights": "Insights",
    "devices": "Devices",
    "diagnostics": "Diagnostics",
    "overview_title": "Multimedia Overview",
    "hero_overview": "Your multimedia rooms and activities, all in one place.",
    "hero_rooms": "Choose a room to see its activity, availability and controls.",
    "hero_activities": "Arrange activities, devices and source routes by room.",
    "hero_devices": "See which selected devices are available and where they belong.",
    "hero_diagnostics": "Understand readback, connection issues and recovery needs.",
    "hero_art_multimedia": "Bright contemporary living room with a home cinema", 
    "hero_art_activities": "Illustrated screen, receiver and media source routing",
    "hero_art_insights": "Illustrated AV diagnostics and connection health",
    "room": "ROOM",
    "activity": "ACTIVITY",
    "settings": "Settings",
    "settings_profiles": "Profiles",
    "settings_floor_rooms": "Floors & Rooms",
    "whole_home_setup": "Configure entire home",
    "whole_home_draft": "Configure floors, rooms, devices and activities in one session, then Save once.",
    "whole_home_unsaved": "Unsaved draft",
    "whole_home_ha_floor": "Floors and Areas are managed by Home Assistant. Select the real HA Area for each room; device candidates come only from Foundation.",
    "whole_home_summary": "Current draft",
    "whole_home_review": "Review everything & Save",
    "whole_home_advanced": "Advanced native connections",
    "whole_home_back": "Back to home setup",
    "whole_home_leave_warning": "Configuration is not yet saved. Use Review & Save or Cancel before leaving.",
    "power_not_approved": "Device not approved in Foundation",
    "power_not_supported": "No supported native power command",
    "activity_wizard": "Set up activity",
    "choose_devices": "Choose devices",
    "tune_actions": "Tune actions & order",
    "startup_position": "Startup position",
    "choose_devices_help": "First choose actual, Foundation-approved devices. Nothing starts while editing.",
    "edit_activity_devices": "Select devices and order",
    "activity_devices_saved_first": "Continue to step 2 to tune each selected device's native steps and delays.",
    "move_step_up": "Move this action earlier",
    "move_step_down": "Move this action later",
    "floor_missing_help": "No native Home Assistant floor is published for this room. Check its HA Area and Floor assignment; Multimedia does not invent a location.",
    "settings_later": "Later",
    "settings_yaml": "YAML",
    "settings_edit_all_yaml": "Edit YAML",
    "settings_expected": "Target",
    "settings_no_steps": "No script steps configured",
    "settings_default_delay": "Default delay",
    "settings_edit_steps": "Edit steps",
    "settings_edit_step": "Edit",
    "settings_add_step": "Add action",
    "settings_edit_activity_devices": "Edit devices & activity",
    "settings_remove_activity": "Remove activity",
    "settings_remove_room": "Remove room",
    "settings_activity_shortcuts": "Activity shortcuts",
    "activity_button_home": "Home",
    "activity_button_guide": "Guide",
    "activity_button_channel_up": "Channel +",
    "activity_button_channel_down": "Channel −",
    "activity_button_volume_up": "Volume +",
    "activity_button_volume_down": "Volume −",
    "activity_button_mute": "Mute",
    "activity_button_ok": "OK",
    "activity_button_back": "Back",
    "activity_button_info": "Info",
    "favorite": "Favorite",
    "settings_wait_timeout": "timeout",
    "script_action_remote_key": "Remote button",
    "script_action_source": "Input",
    "script_action_sound_mode": "Sound mode",
    "script_action_volume": "Volume",
    "script_action_play": "Play",
    "script_action_pause": "Pause",
    "script_action_delay": "Wait",
    "script_action_wait_until": "Wait until",
    "settings_add_stop_step": "Add stop command",
    "settings_automatic_start": "Automatic start",
    "settings_ensure_ready": "Power on / check ready",
    "settings_cec_wake": "HDMI-CEC wake, verify readiness",
    "settings_automatic_stop": "Automatically power down when no other activity needs this device",
    "settings_stop_actions": "Stop commands",
    "settings_delay_inherited": "Default",
    "settings_delay_override": "Override",
    "insights_explainer": "See which room needs help and what you can safely do.",
    "insights_attention": "Needs attention",
    "insights_unavailable": "A device is unavailable or not approved.",
    "insights_target_mismatch": "The observed state differs from the activity target.",
    "insights_no_issue": "No problem reported by Multimedia.",
    "insights_open_room": "Open room",
    "insights_details": "Details and diagnostic evidence",
    "settings_save": "Save",
    "settings_empty": "Nothing configured yet",
    "settings_unassigned": "Without floor",
    "remote_buttons": "Buttons",
    "remote_text": "Text",
    "remote_text_unavailable": "Text input is not supported by this native device.",
    "remote_text_placeholder": "Type into the focused TV field",
    "remote_text_send": "Send text",
    "remote_not_supported": "This device does not provide these remote keys.",
    "hero_settings": "Configure rooms, devices and activity scripts.",
    "hero_insights": "See what worked, what failed and what can be safely recovered.",
    "manage": "Manage rooms and activities",
    "context": "Context",
    "events": "Events",
    "notifications": "Notifications",
    "planning": "Planning",
    "refresh": "Refresh",
    "collapse": "Collapse",
    "shared_unavailable": "Shared card unavailable",
    "loading": "Loading…",
    "overdue": "Overdue",
    "deadline": "Deadline",
    "no_upcoming": "No upcoming activity",
    "plan_unknown": "Planning evidence unavailable",
    "backend_unavailable": "Backend unavailable",
    "not_published": "Not published",
    "not_ready": "Multimedia backend not ready",
    "setup_help": "Complete Foundation's Multimedia device selection, configure your room in Multimedia, then refresh this dashboard.",
    "configured_rooms": "Visible rooms",
    "active": "Active",
    "activity_state": "Backend activity state",
    "playback": "Playback",
    "playing_readback": "Native playing readback",
    "attention": "Attention",
    "review_rooms": "Rooms requiring review",
    "partial_rooms": "Some room statuses are unavailable or ambiguous.",
    "rooms_activities": "Rooms & activities",
    "floor_navigation": "Filter rooms by floor",
    "all_floors": "All floors",
    "compact_room_help": "Choose a floor, then open only the room you need. Actual status stays visible.",
    "no_floor_rooms": "No rooms on this floor",
    "choose_other_floor": "Select another floor or all floors.",
    "error_detail": "Technical error details",
    "device_unavailable": "Device unavailable",
    "setup_rooms": "Room, devices & activities",
    "setup_help_short": "Review existing links and activity routes. Make changes through the native Multimedia configuration.",
    "setup_devices": "Connected devices",
    "setup_activity": "Activity configuration",
    "setup_manage": "Manage configuration",
    "setup_room_details": "Room and controls",
    "active_first": "Active rooms first. Switch activities without choosing individual HDMI devices.",
    "all_rooms": "All rooms",
    "no_rooms": "No rooms configured",
    "create_room": "Create a Multimedia room after Foundation technical selection.",
    "no_activity": "No activity",
    "no_activities": "No activities configured",
    "stop_activity": "Stop activity",
    "recover": "Fix It / Recover",
    "cec_device": "HDMI-CEC enabled (device setting)",
    "cec_activity": "Verified HDMI-CEC link",
    "cec_skips": "Automated by HDMI-CEC",
    "target_state": "Desired state vs native readback",
    "target_expected": "Expected",
    "target_actual": "Observed",
    "target_attention": "Needs correction",
    "target_observed": "Observed in HA (not physical proof)",
    "setup_cec_devices": "Device Power On timing / HDMI-CEC",
    "setup_tv_wake": "TV Wake-on-LAN",
    "setup_harmony_owner": "Harmony / Premium ownership",
    "setup_speech_endpoint": "Speaker notifications",
    "setup_cec_activity": "Configure HDMI-CEC activity link",
    "details": "Details",
    "room_control": "Room control",
    "room_ownership": "Rooms are configured in Multimedia; source devices remain owned by their HA integrations.",
    "configure_room": "Configure a room in the Multimedia integration.",
    "now_playing": "Now playing",
    "media_ready": "Ready to play",
    "media_no_source_metadata": "This source does not publish media details",
    "media_artwork": "Media artwork",
    "artist_unknown": "Artist not published",
    "no_playback": "No confirmed playback",
    "playback_help": "Playback is shown only when a configured source reports playing.",
    "volume_unknown": "Volume not published",
    "on": "On",
    "off": "Off",
    "volume_down": "Volume −",
    "volume_up": "Volume +",
    "play": "Play",
    "pause": "Pause",
    "stop": "Stop",
    "previous": "Previous",
    "next": "Next",
    "input": "Input",
    "sound_mode": "Sound mode",
    "volume": "Volume",
    "mute": "Mute",
    "unmute": "Unmute",
    "add_player": "Add player",
    "leave_group": "Leave group",
    "unavailable": "Unavailable",
    "select": "Select",
    "remote_keys": "Remote keys",
    "shared_source": "Shared source",
    "native_area": "Registered HA area",
    "used_in": "Used in",
    "grouped": "Grouped",
    "players": "players",
    "device_controls": "Device controls",
    "connected_devices": "Connected devices",
    "connected": "Connected",
    "native_device": "Open native device",
    "routes": "Input routes",
    "no_routes": "No explicit routes",
    "route_help": "Select the available physical inputs in Multimedia configuration.",
    "activities_help": "Only configured activities and backend-approved source paths are actionable.",
    "no_active_activity": "No active activity",
    "devices_roles": "Devices & roles",
    "device_help": "Selected in Foundation, then assigned to rooms and activities by Multimedia.",
    "device": "Device",
    "role_room": "Role / room",
    "native_state": "Native state",
    "approved": "Approved",
    "review": "Review",
    "no_devices": "No devices",
    "no_bound": "No devices are bound in Multimedia.",
    "runtime_diagnostics": "Runtime diagnostics",
    "diag_help": "Backend-owned phase, readback and Foundation binding results.",
    "phase": "Execution phase",
    "approvals": "Foundation source approvals",
    "valid": "Valid",
    "confirmed_playback": "Confirmed playback",
    "not_confirmed": "Not confirmed",
    "technical": "Technical source identities",
    "playing": "Playing",
    "idle": "Idle",
    "unknown": "Unknown",
    "starting": "Starting",
    "stopping": "Stopping",
    "ready": "Ready",
    "recovery": "Recovery required",
    "error": "Error",
    "action_unavailable": "Action unavailable. Check selected devices and native capabilities.",
    "waiting": "Waiting for the result of this command…",
    "confirmed": "Backend confirmed this command.",
    "submitted": "Command submitted. Physical result is not confirmed.",
    "failed": "Command completed with unconfirmed devices.",
    "cancelled": "Command interrupted by a newer request.",
    "result_unknown": "No matching command result returned. Check actual device state."
  },
  "nl": {
    "settings_post_power_delay": "Na daadwerkelijk inschakelen",
    "failed_step": "Mislukt bij",
    "execution_trace": "Uitgevoerde stappen",
    "trace_truncated": "Alleen de laatste 64 stappen worden getoond",
    "trace_phase_start": "Opstart",
    "trace_phase_steps": "Acties",
    "trace_phase_stop_steps": "Stopacties",
    "trace_phase_retire": "Uitschakelen",
    "trace_phase_verify": "Controleren",
    "trace_result_pending": "Bezig",
    "trace_result_observed": "Native HA-status bevestigd",
    "trace_result_already_ready_or_passive": "Al klaar of passief; geen nieuw inschakelcommando",
    "trace_result_submitted_unverified": "Verzonden; fysiek resultaat niet onafhankelijk bevestigd",
    "trace_result_command_completed": "Commando afgerond; doelstatus wordt apart getoetst",
    "trace_result_cec_delegated_unverified": "Via HDMI-CEC; resultaat niet onafhankelijk bevestigd",
    "trace_result_skipped_unsafe_replay": "Overgeslagen om onveilig herhalen te voorkomen",
    "trace_result_failed": "Mislukt",
    "trace_result_interrupted": "Onderbroken",
    "trace_result_attention": "Native doelstatus wijkt af",
    "trace_result_completed": "Afgerond; controleer native status",
    "reserved_by": "Gereserveerd door",
    "activity_off": "Activiteit uit",
    "all_off": "Alles uit",
    "repair_activity": "Activiteit herstellen",
    "media_unknown": "Media-informatie ontbreekt",
    "source_unknown": "Bron onbekend",
    "playback_progress": "Gerapporteerde afspeelpositie",
    "device_basic_actions": "Basisbediening apparaat",
    "settings_button_mapping": "Activiteitstoetsen toewijzen",
    "settings_macro_shortcuts": "One-touch macro's beheren",
    "settings_no_mapping": "Nog geen toetsen toegewezen.",
    "settings_no_macro": "Nog geen benoemde macro's ingesteld.",
    "settings_step_count": "stappen",
    "role_display": "Scherm",
    "role_receiver": "Audiozone",
    "role_amplifier": "Audiozone",
    "role_player": "Mediaspeler",
    "role_source": "Mediabron",
    "role_remote": "Afstandsbediening",
    "state_paused": "Gepauzeerd",
    "state_standby": "Stand-by",
    "state_buffering": "Bufferen",
    "room_attention_detail": "Controleer de apparaten of activiteit van deze ruimte.",
    "product_specs": "Productspecificaties",
    "spec_screen_inches": "Scherm (inch)",
    "spec_panel": "Paneel",
    "spec_resolution": "Resolutie",
    "spec_amplified_channels": "Versterkte kanalen",
    "spec_subwoofer_outputs": "Subwooferuitgangen",
    "spec_hdmi_inputs": "HDMI-ingangen",
    "spec_hdmi_outputs": "HDMI-uitgangen",
    "spec_touch_points": "Aanraakpunten",
    "available_room_controls": "Beschikbaar in deze ruimte",
    "product_details": "Productdetails",
    "setup_editor": "Multimedia configureren",
    "setup_continue": "Verder / controleren",
    "setup_cancel": "Annuleren",
    "setup_saved": "Multimedia-configuratie opgeslagen; wacht op native statusvernieuwing",
    "setup_flow_failed": "Configuratiestroom niet beschikbaar of onderbroken; gebruik de native Home Assistant-instellingen",
    "setup_field_unsupported": "Veld vereist native Home Assistant-configuratie",
    "setup_edit_activity": "Snel aanpassen",
    "setup_expert_yaml": "Expert · YAML",
    "illustrative_device_art": "Illustratieve productafbeelding",
    "product_image_details": "Apparaatafbeelding bekijken",
    "setup_expert_yaml_all": "Expert YAML · Heel Multimedia",
    "setup_more_actions": "Meer instellingen",
    "setup_edit_cast": "Volledig aanpassen",
    "setup_remove_activity": "Activiteit verwijderen",
    "setup_add_activity": "Activiteit toevoegen",
    "setup_guided_activity": "Activiteit instellen",
    "setup_edit_location": "Ruimte / verdieping",
    "setup_edit_devices": "Apparaten / rollen",
    "setup_remove_room": "Ruimte verwijderen",
    "setup_add_room": "Ruimte toevoegen",
    "diag_actual": "Werkelijke native status",
    "diag_device_unavailable": "Native apparaat niet beschikbaar",
    "diag_not_selected": "Foundation-selectie niet meer geldig",
    "source_repair_action": "Apparaatkoppeling nakijken",
    "source_repair_hint": "Controleer dit exacte apparaat via RHI Foundation → Configure → Multimedia. Bevestig daarna de rol en de broningang hier in Multimedia Settings. Dit verstuurt geen opdrachten.",
    "diag_devices_attention": "Apparaten die aandacht vragen",
    "recommend_recover": "Aanbevolen actie: Activiteit herstellen",
    "recommend_review_foundation": "Aanbevolen actie: Apparaatselectie in Foundation nakijken",
    "recommend_inspect_sources": "Aanbevolen actie: Niet-beschikbare apparaten controleren",
    "diag_asset_id": "Logische asset",
    "diag_source": "Native HA-bron",
    "diag_provider": "Bronintegratie",
    "diag_command_allowed": "Toegestaan",
    "diag_command_blocked": "Geblokkeerd",
    "verified_model": "Native geverifieerd model",
    "last_attempt": "Laatste activiteitspoging",
    "last_control": "Laatste directe opdracht",
    "native_features": "Native HA-featurebits",
    "native_readback_at": "Native terugmelding om",
    "readback_quality": "Bewijs voor native terugmelding",
    "readback_provider_optimistic": "Status van provider; fysieke bevestiging ontbreekt",
    "readback_native_ha_state": "Status van Home Assistant-bron",
    "readback_unapproved": "Bronselectie niet goedgekeurd",
    "setup_native_route_only": "TV-/receiverbronroute — geen afzonderlijke native speler toegewezen",
    "remote_navigation": "Navigatie",
    "remote_media": "Kanalen en afspelen",
    "remote_numbers": "Cijfertoetsen",
    "remote_apps": "Apps en kleurtoetsen",
    "remote_more": "Andere toetsen",
    "harmony_owner": "Harmony-bediening",
    "harmony_scope": "Harmony beheert de toegewezen apparaten; Premium-activiteiten blijven bewaard maar zijn uitgeschakeld.",
    "harmony_activity": "Harmony-activiteit",
    "harmony_confirmed": "Harmony bevestigt de activiteit. De afzonderlijke fysieke apparaten zijn niet onafhankelijk geverifieerd.",
    "harmony_unavailable": "Harmony-activiteit niet beschikbaar",
    "multimedia": "Multimedia",
    "overview": "Overzicht",
    "rooms": "Ruimtes",
    "activities": "Activiteiten",
    "insights": "Inzicht",
    "devices": "Apparaten",
    "diagnostics": "Diagnostiek",
    "overview_title": "Multimediaoverzicht",
    "hero_overview": "Al je multimedia-ruimtes en activiteiten in één overzicht.",
    "hero_rooms": "Kies een ruimte voor de activiteit, beschikbaarheid en bediening.",
    "hero_activities": "Beheer activiteiten, apparaten en bronroutes per ruimte.",
    "hero_devices": "Bekijk de geselecteerde apparaten, beschikbaarheid en ruimtes.",
    "hero_diagnostics": "Bekijk terugmelding, verbindingsproblemen en herstel.",
    "hero_art_multimedia": "Lichte moderne woonkamer met thuisbioscoop", 
    "hero_art_activities": "Illustratie van scherm, receiver en mediabronnen",
    "hero_art_insights": "Illustratie van audiovisuele diagnose en verbindingen",
    "room": "RUIMTE",
    "activity": "ACTIVITEIT",
    "settings": "Instellingen",
    "settings_profiles": "Profielen",
    "settings_floor_rooms": "Verdiepingen & ruimtes",
    "whole_home_setup": "Hele woning instellen",
    "whole_home_draft": "Stel verdiepingen, ruimtes, apparaten en activiteiten in één sessie in en sla één keer op.",
    "whole_home_unsaved": "Nog niet opgeslagen",
    "whole_home_ha_floor": "Verdiepingen en zones worden beheerd door Home Assistant. Kies de echte HA-zone per ruimte; apparaatkeuzes komen uitsluitend uit Foundation.",
    "whole_home_summary": "Huidige wijzigingen",
    "whole_home_review": "Alles controleren en opslaan",
    "whole_home_advanced": "Geavanceerde verbindingen",
    "whole_home_back": "Terug naar woninginstellingen",
    "whole_home_leave_warning": "De configuratie is nog niet opgeslagen. Gebruik Alles controleren en opslaan of Annuleren voordat je weggaat.",
    "power_not_approved": "Apparaat niet goedgekeurd in Foundation",
    "power_not_supported": "Geen ondersteunde native aan/uit-opdracht",
    "activity_wizard": "Activiteit instellen",
    "choose_devices": "Apparaten kiezen",
    "tune_actions": "Acties en volgorde",
    "startup_position": "Opstartvolgorde",
    "choose_devices_help": "Kies eerst de echte door Foundation goedgekeurde apparaten. Instellen start geen apparatuur.",
    "edit_activity_devices": "Apparaten en volgorde instellen",
    "activity_devices_saved_first": "Ga daarna naar stap 2 om per apparaat acties en vertragingen te configureren.",
    "move_step_up": "Actie vroeger uitvoeren",
    "move_step_down": "Actie later uitvoeren",
    "floor_missing_help": "Voor deze ruimte is geen Home Assistant-verdieping bekend. Controleer de HA-ruimte en verdieping; Multimedia verzint geen locatie.",
    "settings_later": "Later",
    "settings_yaml": "YAML",
    "settings_edit_all_yaml": "Edit YAML",
    "settings_expected": "Doel",
    "settings_no_steps": "Nog geen scriptstappen",
    "settings_default_delay": "Standaardwachttijd",
    "settings_edit_steps": "Stappen bewerken",
    "settings_edit_step": "Bewerken",
    "settings_add_step": "Actie toevoegen",
    "settings_edit_activity_devices": "Apparaten & activiteit bewerken",
    "settings_remove_activity": "Activiteit verwijderen",
    "settings_remove_room": "Ruimte verwijderen",
    "settings_activity_shortcuts": "Activiteitsknoppen",
    "activity_button_home": "Home",
    "activity_button_guide": "TV-gids",
    "activity_button_channel_up": "Kanaal +",
    "activity_button_channel_down": "Kanaal −",
    "activity_button_volume_up": "Volume +",
    "activity_button_volume_down": "Volume −",
    "activity_button_mute": "Dempen",
    "activity_button_ok": "OK",
    "activity_button_back": "Terug",
    "activity_button_info": "Info",
    "favorite": "Favoriet",
    "settings_wait_timeout": "timeout",
    "script_action_remote_key": "Afstandsbediening",
    "script_action_source": "Bron",
    "script_action_sound_mode": "Geluidsmodus",
    "script_action_volume": "Volume",
    "script_action_play": "Afspelen",
    "script_action_pause": "Pauzeren",
    "script_action_delay": "Wachten",
    "script_action_wait_until": "Wachten tot",
    "settings_add_stop_step": "Stopcommando toevoegen",
    "settings_automatic_start": "Automatisch opstarten",
    "settings_ensure_ready": "Inschakelen / gereed controleren",
    "settings_cec_wake": "HDMI-CEC inschakeling, gereedheid verifiëren",
    "settings_automatic_stop": "Automatisch uitschakelen wanneer geen andere activiteit dit apparaat gebruikt",
    "settings_stop_actions": "Stopcommando's",
    "settings_delay_inherited": "Standaard",
    "settings_delay_override": "Afwijking",
    "insights_explainer": "Bekijk welke ruimte aandacht nodig heeft en wat je veilig kunt doen.",
    "insights_attention": "Aandacht vereist",
    "insights_unavailable": "Een apparaat is niet beschikbaar of niet goedgekeurd.",
    "insights_target_mismatch": "De gemeten toestand wijkt af van de gewenste toestand.",
    "insights_no_issue": "Multimedia meldt geen probleem.",
    "insights_open_room": "Open ruimte",
    "insights_details": "Details en diagnose",
    "settings_save": "Opslaan",
    "settings_empty": "Nog geen instellingen",
    "settings_unassigned": "Zonder verdieping",
    "remote_buttons": "Knoppen",
    "remote_text": "Tekst",
    "remote_text_unavailable": "Tekstinvoer wordt niet ondersteund door dit native apparaat.",
    "remote_text_placeholder": "Tekst voor het actieve invoerveld",
    "remote_text_send": "Verstuur tekst",
    "remote_not_supported": "Dit apparaat biedt deze remote-knoppen niet aan.",
    "hero_settings": "Configureer ruimtes, apparaten en activiteitenscripts.",
    "hero_insights": "Bekijk wat werkte, wat misliep en wat veilig hersteld kan worden.",
    "manage": "Ruimtes en activiteiten beheren",
    "context": "Context",
    "events": "Gebeurtenissen",
    "notifications": "Meldingen",
    "planning": "Planning",
    "refresh": "Vernieuwen",
    "collapse": "Inklappen",
    "shared_unavailable": "Gedeelde kaart niet beschikbaar",
    "loading": "Laden…",
    "overdue": "Te laat",
    "deadline": "Deadline",
    "no_upcoming": "Geen geplande activiteit",
    "plan_unknown": "Planningstatus niet beschikbaar",
    "backend_unavailable": "Backend niet beschikbaar",
    "not_published": "Niet gepubliceerd",
    "not_ready": "Multimediabackend niet gereed",
    "setup_help": "Voltooi de apparaatselectie in Foundation, configureer je ruimte in Multimedia en vernieuw het dashboard.",
    "configured_rooms": "Zichtbare ruimtes",
    "active": "Actief",
    "activity_state": "Activiteitsstatus",
    "playback": "Afspelen",
    "playing_readback": "Bevestigde afspeelstatus",
    "attention": "Aandacht",
    "review_rooms": "Ruimtes die aandacht vragen",
    "partial_rooms": "Sommige ruimtestatussen zijn niet beschikbaar of dubbelzinnig.",
    "rooms_activities": "Ruimtes en activiteiten",
    "floor_navigation": "Ruimtes filteren op verdieping",
    "all_floors": "Alle verdiepingen",
    "compact_room_help": "Kies een verdieping en open alleen de ruimte die je nodig hebt. De status blijft zichtbaar.",
    "no_floor_rooms": "Geen ruimtes op deze verdieping",
    "choose_other_floor": "Kies een andere verdieping of alle verdiepingen.",
    "error_detail": "Technische foutdetails",
    "device_unavailable": "Apparaat niet beschikbaar",
    "setup_rooms": "Ruimte, apparaten en activiteiten",
    "setup_help_short": "Bekijk de huidige verbindingen en routes. Wijzig ze via de bestaande Multimedia-configuratie.",
    "setup_devices": "Gekoppelde apparaten",
    "setup_activity": "Activiteit configureren",
    "setup_manage": "Configuratie beheren",
    "setup_room_details": "Ruimte en bediening",
    "active_first": "Actieve ruimtes eerst. Wissel van activiteit zonder afzonderlijke HDMI-apparaten te kiezen.",
    "all_rooms": "Alle ruimtes",
    "no_rooms": "Geen ruimtes geconfigureerd",
    "create_room": "Maak een Multimedia-ruimte na de apparaatselectie in Foundation.",
    "no_activity": "Geen activiteit",
    "no_activities": "Geen activiteiten geconfigureerd",
    "stop_activity": "Stop activiteit",
    "recover": "Fix It / Herstellen",
    "cec_device": "HDMI-CEC ingeschakeld (apparaat)",
    "cec_activity": "Geverifieerde HDMI-CEC-verbinding",
    "cec_skips": "Automatisch via HDMI-CEC",
    "target_state": "Doelstatus tegenover native terugmelding",
    "target_expected": "Verwacht",
    "target_actual": "Waargenomen",
    "target_attention": "Correctie nodig",
    "target_observed": "In HA waargenomen (geen fysiek bewijs)",
    "setup_cec_devices": "Apparaat inschakelvertraging / HDMI-CEC",
    "setup_tv_wake": "TV Wake-on-LAN",
    "setup_harmony_owner": "Harmony / Premium-bediening",
    "setup_speech_endpoint": "Luidsprekermeldingen",
    "setup_cec_activity": "HDMI-CEC-activiteit configureren",
    "details": "Details",
    "room_control": "Ruimtebediening",
    "room_ownership": "Ruimtes worden in Multimedia geconfigureerd; de bronapparaten blijven eigendom van hun HA-integraties.",
    "configure_room": "Configureer een ruimte in de Multimedia-integratie.",
    "now_playing": "Speelt nu",
    "media_ready": "Klaar om af te spelen",
    "media_no_source_metadata": "Deze bron publiceert geen mediagegevens",
    "media_artwork": "Media-afbeelding",
    "artist_unknown": "Artiest niet beschikbaar",
    "no_playback": "Geen bevestigde weergave",
    "playback_help": "Weergave verschijnt alleen als een gekoppelde bron daadwerkelijk afspeelt.",
    "volume_unknown": "Volume niet beschikbaar",
    "on": "Aan",
    "off": "Uit",
    "volume_down": "Volume −",
    "volume_up": "Volume +",
    "play": "Afspelen",
    "pause": "Pauze",
    "stop": "Stop",
    "previous": "Vorige",
    "next": "Volgende",
    "input": "Ingang",
    "sound_mode": "Geluidsmodus",
    "volume": "Volume",
    "mute": "Dempen",
    "unmute": "Geluid aan",
    "add_player": "Speler toevoegen",
    "leave_group": "Groep verlaten",
    "unavailable": "Niet beschikbaar",
    "select": "Kies",
    "remote_keys": "Afstandsbediening",
    "shared_source": "Gedeelde bron",
    "native_area": "Geregistreerde HA-ruimte",
    "used_in": "Gebruikt in",
    "grouped": "Gegroepeerd",
    "players": "spelers",
    "device_controls": "Apparaatbediening",
    "connected_devices": "Gekoppelde apparaten",
    "connected": "Verbonden",
    "native_device": "Open native apparaat",
    "routes": "Ingangsroutes",
    "no_routes": "Geen expliciete routes",
    "route_help": "Selecteer de beschikbare fysieke ingangen in de Multimedia-configuratie.",
    "activities_help": "Alleen geconfigureerde activiteiten met goedgekeurde bronroutes zijn bedienbaar.",
    "no_active_activity": "Geen actieve activiteit",
    "devices_roles": "Apparaten en rollen",
    "device_help": "Geselecteerd in Foundation en toegewezen aan ruimtes en activiteiten in Multimedia.",
    "device": "Apparaat",
    "role_room": "Rol / ruimte",
    "native_state": "Native status",
    "approved": "Goedgekeurd",
    "review": "Controleren",
    "no_devices": "Geen apparaten",
    "no_bound": "Geen apparaten gekoppeld in Multimedia.",
    "runtime_diagnostics": "Runtime-diagnostiek",
    "diag_help": "Uitvoeringsstatus, terugmelding en Foundation-koppelingen vanuit de backend.",
    "phase": "Uitvoeringsfase",
    "approvals": "Foundation-brongoedkeuringen",
    "valid": "Geldig",
    "confirmed_playback": "Bevestigde weergave",
    "not_confirmed": "Niet bevestigd",
    "technical": "Technische bronidentiteiten",
    "playing": "Speelt",
    "idle": "Inactief",
    "unknown": "Onbekend",
    "starting": "Starten",
    "stopping": "Stoppen",
    "ready": "Gereed",
    "recovery": "Herstel nodig",
    "error": "Fout",
    "action_unavailable": "Actie niet beschikbaar. Controleer de geselecteerde apparaten en functies.",
    "waiting": "Wachten op het resultaat van deze opdracht…",
    "confirmed": "De backend heeft deze opdracht bevestigd.",
    "submitted": "Opdracht verstuurd. Het fysieke resultaat is niet bevestigd.",
    "failed": "Opdracht beëindigd met onbevestigde apparaten.",
    "cancelled": "Opdracht onderbroken door een nieuw verzoek.",
    "result_unknown": "Geen passend opdrachtresultaat ontvangen. Controleer de apparaatstatus."
  },
  "fr": {
    "settings_post_power_delay": "Après mise sous tension effective",
    "failed_step": "Échec à l’étape",
    "execution_trace": "Étapes d'exécution",
    "trace_truncated": "Seules les 64 dernières étapes sont affichées",
    "trace_phase_start": "Démarrage",
    "trace_phase_steps": "Actions",
    "trace_phase_stop_steps": "Actions d'arrêt",
    "trace_phase_retire": "Extinction",
    "trace_phase_verify": "Vérification",
    "trace_result_pending": "En cours",
    "trace_result_observed": "État HA natif observé",
    "trace_result_already_ready_or_passive": "Déjà prêt ou passif ; aucune nouvelle commande",
    "trace_result_submitted_unverified": "Envoyé ; résultat physique non vérifié indépendamment",
    "trace_result_command_completed": "Commande terminée ; état cible vérifié séparément",
    "trace_result_cec_delegated_unverified": "Délégué à HDMI-CEC ; résultat non vérifié indépendamment",
    "trace_result_skipped_unsafe_replay": "Ignoré pour éviter une répétition dangereuse",
    "trace_result_failed": "Échec",
    "trace_result_interrupted": "Interrompu",
    "trace_result_attention": "Écart de l'état cible natif",
    "trace_result_completed": "Terminé ; vérifier l'état natif",
    "reserved_by": "Réservé par",
    "activity_off": "Arrêter l’activité",
    "all_off": "Tout éteindre",
    "repair_activity": "Rétablir l’activité",
    "media_unknown": "Informations média indisponibles",
    "source_unknown": "Source inconnue",
    "playback_progress": "Progression de lecture observée",
    "device_basic_actions": "Commandes essentielles de l’appareil",
    "settings_button_mapping": "Attribuer les touches",
    "settings_macro_shortcuts": "Gérer les macros",
    "settings_no_mapping": "Aucune touche attribuée.",
    "settings_no_macro": "Aucune macro nommée configurée.",
    "settings_step_count": "étapes",
    "role_display": "Écran",
    "role_receiver": "Zone audio",
    "role_amplifier": "Zone audio",
    "role_player": "Lecteur multimédia",
    "role_source": "Source multimédia",
    "role_remote": "Télécommande",
    "state_paused": "En pause",
    "state_standby": "Veille",
    "state_buffering": "Mise en mémoire tampon",
    "room_attention_detail": "Vérifiez les appareils ou l’activité de cette pièce.",
    "product_specs": "Caractéristiques du produit",
    "spec_screen_inches": "Écran (pouces)",
    "spec_panel": "Dalle",
    "spec_resolution": "Résolution",
    "spec_amplified_channels": "Canaux amplifiés",
    "spec_subwoofer_outputs": "Sorties caisson de basses",
    "spec_hdmi_inputs": "Entrées HDMI",
    "spec_hdmi_outputs": "Sorties HDMI",
    "spec_touch_points": "Points tactiles",
    "available_room_controls": "Disponible dans cette pièce",
    "product_details": "Détails du produit",
    "setup_editor": "Configurer Multimedia",
    "setup_continue": "Continuer / vérifier",
    "setup_cancel": "Annuler",
    "setup_saved": "Configuration Multimedia enregistrée ; attendre la mise à jour des états natifs",
    "setup_flow_failed": "Assistant de configuration indisponible ou interrompu ; utilisez les paramètres natifs de Home Assistant",
    "setup_field_unsupported": "Ce champ nécessite la configuration native Home Assistant",
    "setup_edit_activity": "Modifier rapidement",
    "setup_expert_yaml": "Expert · YAML",
    "illustrative_device_art": "Image produit illustrative",
    "product_image_details": "Voir l'image de l'appareil",
    "setup_expert_yaml_all": "Expert YAML · Tout Multimédia",
    "setup_more_actions": "Plus de réglages",
    "setup_edit_cast": "Modification complète",
    "setup_remove_activity": "Supprimer l’activité",
    "setup_add_activity": "Ajouter une activité",
    "setup_guided_activity": "Configurer une activité",
    "setup_edit_location": "Pièce / étage",
    "setup_edit_devices": "Appareils / rôles",
    "setup_remove_room": "Supprimer la pièce",
    "setup_add_room": "Ajouter une pièce",
    "diag_actual": "Retour d’état natif réel",
    "diag_device_unavailable": "Appareil natif indisponible",
    "diag_not_selected": "Sélection Foundation non valide",
    "source_repair_action": "Vérifier la liaison de l’appareil",
    "source_repair_hint": "Vérifiez cet appareil exact dans RHI Foundation → Configurer → Multimedia, puis contrôlez son rôle et son entrée native ici dans les paramètres Multimedia. Aucun ordre n’est envoyé.",
    "diag_devices_attention": "Appareils nécessitant une intervention",
    "recommend_recover": "Action recommandée : Rétablir l’activité",
    "recommend_review_foundation": "Action recommandée : Vérifier la sélection dans Foundation",
    "recommend_inspect_sources": "Action recommandée : Vérifier les appareils indisponibles",
    "diag_asset_id": "Équipement logique",
    "diag_source": "Source HA native",
    "diag_provider": "Intégration source",
    "diag_command_allowed": "Autorisé",
    "diag_command_blocked": "Bloqué",
    "verified_model": "Modèle vérifié par la source native",
    "last_attempt": "Dernière tentative d’activité",
    "last_control": "Dernière commande directe",
    "native_features": "Masque des fonctions HA natives",
    "native_readback_at": "Dernier retour d’état natif",
    "readback_quality": "Preuve de retour d’état natif",
    "readback_provider_optimistic": "État déclaré par l’intégration, non confirmé physiquement",
    "readback_native_ha_state": "État de la source Home Assistant",
    "readback_unapproved": "Source non approuvée",
    "setup_native_route_only": "Routage des entrées TV/ampli — aucun lecteur natif distinct assigné",
    "remote_navigation": "Navigation",
    "remote_media": "Chaînes et lecture",
    "remote_numbers": "Clavier numérique",
    "remote_apps": "Applications et touches de couleur",
    "remote_more": "Autres touches",
    "harmony_owner": "Commande Harmony",
    "harmony_scope": "Harmony contrôle les appareils déclarés ; les activités Premium sont conservées mais désactivées.",
    "harmony_activity": "Activité Harmony",
    "harmony_confirmed": "Le hub Harmony confirme son activité. Les appareils physiques ne sont pas vérifiés indépendamment.",
    "harmony_unavailable": "Activité Harmony indisponible",
    "multimedia": "Multimédia",
    "overview": "Vue d’ensemble",
    "rooms": "Pièces",
    "activities": "Activités",
    "insights": "Informations",
    "devices": "Appareils",
    "diagnostics": "Diagnostic",
    "overview_title": "Vue d’ensemble multimédia",
    "hero_overview": "Vos pièces et activités multimédias en un coup d’œil.",
    "hero_rooms": "Choisissez une pièce pour voir son état et ses commandes.",
    "hero_activities": "Configurez les activités, appareils et sources de chaque pièce.",
    "hero_devices": "Consultez les appareils sélectionnés et leur disponibilité.",
    "hero_diagnostics": "Vérifiez les retours d’état, les connexions et la reprise.",
    "hero_art_multimedia": "Salon contemporain lumineux avec installation home cinéma", 
    "hero_art_activities": "Illustration d’un écran, amplificateur et sources multimédias",
    "hero_art_insights": "Illustration du diagnostic audiovisuel et des connexions",
    "room": "PIÈCE",
    "activity": "ACTIVITÉ",
    "settings": "Paramètres",
    "settings_profiles": "Profils",
    "settings_floor_rooms": "Étages et pièces",
    "whole_home_setup": "Configurer toute la maison",
    "whole_home_draft": "Configurez étages, pièces, appareils et activités dans une seule session, puis enregistrez une fois.",
    "whole_home_unsaved": "Modifications non enregistrées",
    "whole_home_ha_floor": "Les étages et zones sont gérés par Home Assistant. Choisissez la zone HA réelle; les appareils sont approuvés uniquement par Foundation.",
    "whole_home_summary": "Modifications en cours",
    "whole_home_review": "Vérifier et enregistrer",
    "whole_home_advanced": "Connexions natives avancées",
    "whole_home_back": "Retour à la configuration",
    "whole_home_leave_warning": "La configuration n'est pas encore enregistrée. Utilisez Vérifier et enregistrer ou Annuler avant de quitter.",
    "power_not_approved": "Appareil non approuvé dans Foundation",
    "power_not_supported": "Aucune commande native marche/arrêt disponible",
    "activity_wizard": "Configurer l’activité",
    "choose_devices": "Choisir les appareils",
    "tune_actions": "Actions et ordre",
    "startup_position": "Position au démarrage",
    "choose_devices_help": "Choisissez d’abord les appareils réellement approuvés par Foundation. Aucune commande n’est envoyée pendant la configuration.",
    "edit_activity_devices": "Sélectionner les appareils et l’ordre",
    "activity_devices_saved_first": "Passez à l’étape 2 pour définir les actions et les délais de chaque appareil.",
    "move_step_up": "Avancer cette action",
    "move_step_down": "Retarder cette action",
    "floor_missing_help": "Aucun étage Home Assistant natif n’est publié pour cette pièce. Vérifiez l’affectation Zone/Étage dans HA ; Multimedia n’invente pas de localisation.",
    "settings_later": "Plus tard",
    "settings_yaml": "YAML",
    "settings_edit_all_yaml": "Modifier YAML",
    "settings_expected": "Cible",
    "settings_no_steps": "Aucune étape configurée",
    "settings_default_delay": "Délai par défaut",
    "settings_edit_steps": "Modifier les étapes",
    "settings_edit_step": "Modifier",
    "settings_add_step": "Ajouter une action",
    "settings_edit_activity_devices": "Modifier appareils et activité",
    "settings_remove_activity": "Supprimer l'activité",
    "settings_remove_room": "Supprimer la pièce",
    "settings_activity_shortcuts": "Raccourcis de l'activité",
    "activity_button_home": "Accueil",
    "activity_button_guide": "Guide TV",
    "activity_button_channel_up": "Chaîne +",
    "activity_button_channel_down": "Chaîne −",
    "activity_button_volume_up": "Volume +",
    "activity_button_volume_down": "Volume −",
    "activity_button_mute": "Sourdine",
    "activity_button_ok": "OK",
    "activity_button_back": "Retour",
    "activity_button_info": "Info",
    "favorite": "Favori",
    "settings_wait_timeout": "délai maximal",
    "script_action_remote_key": "Télécommande",
    "script_action_source": "Entrée",
    "script_action_sound_mode": "Mode sonore",
    "script_action_volume": "Volume",
    "script_action_play": "Lecture",
    "script_action_pause": "Pause",
    "script_action_delay": "Attendre",
    "script_action_wait_until": "Attendre jusqu'à",
    "settings_add_stop_step": "Ajouter une commande d'arrêt",
    "settings_automatic_start": "Démarrage automatique",
    "settings_ensure_ready": "Allumer / vérifier prêt",
    "settings_cec_wake": "Démarrage HDMI-CEC, vérifier la disponibilité",
    "settings_automatic_stop": "Éteindre automatiquement si aucune autre activité ne nécessite cet appareil",
    "settings_stop_actions": "Commandes d'arrêt",
    "settings_delay_inherited": "Par défaut",
    "settings_delay_override": "Exception",
    "insights_explainer": "Identifiez les pièces nécessitant une intervention et les actions sûres.",
    "insights_attention": "Intervention nécessaire",
    "insights_unavailable": "Un appareil est indisponible ou non approuvé.",
    "insights_target_mismatch": "L'état observé diffère de l'état attendu.",
    "insights_no_issue": "Aucun problème signalé par Multimedia.",
    "insights_open_room": "Ouvrir la pièce",
    "insights_details": "Détails et diagnostics",
    "settings_save": "Enregistrer",
    "settings_empty": "Aucun élément configuré",
    "settings_unassigned": "Sans étage",
    "remote_buttons": "Boutons",
    "remote_text": "Texte",
    "remote_text_unavailable": "La saisie de texte n'est pas prise en charge par cet appareil.",
    "remote_text_placeholder": "Texte du champ actif sur la TV",
    "remote_text_send": "Envoyer le texte",
    "remote_not_supported": "Cet appareil ne propose pas ces touches.",
    "hero_settings": "Configurez les pièces, appareils et scripts d'activité.",
    "hero_insights": "Comprenez les réussites, les erreurs et les actions de reprise sûres.",
    "manage": "Gérer les pièces et activités",
    "context": "Contexte",
    "events": "Événements",
    "notifications": "Notifications",
    "planning": "Planification",
    "refresh": "Actualiser",
    "collapse": "Réduire",
    "shared_unavailable": "Carte partagée indisponible",
    "loading": "Chargement…",
    "overdue": "En retard",
    "deadline": "Échéance",
    "no_upcoming": "Aucune activité à venir",
    "plan_unknown": "État de planification indisponible",
    "backend_unavailable": "Backend indisponible",
    "not_published": "Non publié",
    "not_ready": "Backend multimédia non prêt",
    "setup_help": "Terminez la sélection des appareils dans Foundation, configurez votre pièce dans Multimedia, puis actualisez ce tableau de bord.",
    "configured_rooms": "Pièces visibles",
    "active": "Actif",
    "activity_state": "État des activités",
    "playback": "Lecture",
    "playing_readback": "État de lecture confirmé",
    "attention": "Attention",
    "review_rooms": "Pièces à vérifier",
    "partial_rooms": "Certains états de pièce sont indisponibles ou ambigus.",
    "rooms_activities": "Pièces et activités",
    "floor_navigation": "Filtrer les pièces par étage",
    "all_floors": "Tous les étages",
    "compact_room_help": "Choisissez l’étage, puis ouvrez uniquement la pièce voulue. Son état reste visible.",
    "no_floor_rooms": "Aucune pièce à cet étage",
    "choose_other_floor": "Choisissez un autre étage ou tous les étages.",
    "error_detail": "Détails techniques de l’erreur",
    "device_unavailable": "Appareil indisponible",
    "setup_rooms": "Pièce, appareils et activités",
    "setup_help_short": "Consultez les appareils et routes. Modifiez-les dans la configuration Multimedia native.",
    "setup_devices": "Appareils associés",
    "setup_activity": "Configurer l’activité",
    "setup_manage": "Gérer la configuration",
    "setup_room_details": "Pièce et commandes",
    "active_first": "Pièces actives en premier. Changez d’activité sans sélectionner les appareils HDMI individuellement.",
    "all_rooms": "Toutes les pièces",
    "no_rooms": "Aucune pièce configurée",
    "create_room": "Créez une pièce Multimedia après la sélection technique dans Foundation.",
    "no_activity": "Aucune activité",
    "no_activities": "Aucune activité configurée",
    "stop_activity": "Arrêter l’activité",
    "recover": "Fix It / Rétablir",
    "cec_device": "HDMI-CEC activé (appareil)",
    "cec_activity": "Lien HDMI-CEC vérifié",
    "cec_skips": "Automatisé par HDMI-CEC",
    "target_state": "État souhaité et retour natif",
    "target_expected": "Attendu",
    "target_actual": "Observé",
    "target_attention": "Correction nécessaire",
    "target_observed": "Observé dans HA (pas preuve physique)",
    "setup_cec_devices": "Délai d'allumage / HDMI-CEC",
    "setup_tv_wake": "Réveil TV Wake-on-LAN",
    "setup_harmony_owner": "Commande Harmony / Premium",
    "setup_speech_endpoint": "Notifications vocales",
    "setup_cec_activity": "Configurer un lien HDMI-CEC",
    "details": "Détails",
    "room_control": "Commande de la pièce",
    "room_ownership": "Les pièces sont configurées dans Multimedia ; les appareils sources restent gérés par leurs intégrations HA.",
    "configure_room": "Configurez une pièce dans l’intégration Multimedia.",
    "now_playing": "Lecture en cours",
    "media_ready": "Prêt pour la lecture",
    "media_no_source_metadata": "Cette source ne publie pas de détails média",
    "media_artwork": "Illustration du média",
    "artist_unknown": "Artiste non disponible",
    "no_playback": "Aucune lecture confirmée",
    "playback_help": "La lecture est affichée uniquement lorsqu’une source configurée signale une lecture.",
    "volume_unknown": "Volume non disponible",
    "on": "Allumé",
    "off": "Éteint",
    "volume_down": "Volume −",
    "volume_up": "Volume +",
    "play": "Lire",
    "pause": "Pause",
    "stop": "Arrêter",
    "previous": "Précédent",
    "next": "Suivant",
    "input": "Entrée",
    "sound_mode": "Mode sonore",
    "volume": "Volume",
    "mute": "Couper le son",
    "unmute": "Rétablir le son",
    "add_player": "Ajouter un lecteur",
    "leave_group": "Quitter le groupe",
    "unavailable": "Indisponible",
    "select": "Sélectionner",
    "remote_keys": "Télécommande",
    "shared_source": "Source partagée",
    "native_area": "Pièce enregistrée dans HA",
    "used_in": "Utilisée dans",
    "grouped": "Groupé",
    "players": "lecteurs",
    "device_controls": "Commandes des appareils",
    "connected_devices": "Appareils associés",
    "connected": "Connecté",
    "native_device": "Ouvrir l’appareil natif",
    "routes": "Routes d’entrée",
    "no_routes": "Aucune route explicite",
    "route_help": "Sélectionnez les entrées physiques disponibles dans la configuration Multimedia.",
    "activities_help": "Seules les activités configurées et les routes sources approuvées sont utilisables.",
    "no_active_activity": "Aucune activité active",
    "devices_roles": "Appareils et rôles",
    "device_help": "Sélectionnés dans Foundation puis associés aux pièces et activités dans Multimedia.",
    "device": "Appareil",
    "role_room": "Rôle / pièce",
    "native_state": "État natif",
    "approved": "Approuvé",
    "review": "À vérifier",
    "no_devices": "Aucun appareil",
    "no_bound": "Aucun appareil associé dans Multimedia.",
    "runtime_diagnostics": "Diagnostic d’exécution",
    "diag_help": "Phase, retour d’état et associations Foundation fournis par le backend.",
    "phase": "Phase d’exécution",
    "approvals": "Approbations des sources Foundation",
    "valid": "Valide",
    "confirmed_playback": "Lecture confirmée",
    "not_confirmed": "Non confirmé",
    "technical": "Identités techniques des sources",
    "playing": "En lecture",
    "idle": "Inactif",
    "unknown": "Inconnu",
    "starting": "Démarrage",
    "stopping": "Arrêt",
    "ready": "Prêt",
    "recovery": "Rétablissement nécessaire",
    "error": "Erreur",
    "action_unavailable": "Action indisponible. Vérifiez les appareils sélectionnés et leurs capacités.",
    "waiting": "En attente du résultat de cette commande…",
    "confirmed": "Le backend a confirmé cette commande.",
    "submitted": "Commande envoyée. Le résultat physique n’est pas confirmé.",
    "failed": "Commande terminée avec des appareils non confirmés.",
    "cancelled": "Commande interrompue par une nouvelle demande.",
    "result_unknown": "Aucun résultat correspondant reçu. Vérifiez l’état réel de l’appareil."
  }
};
function rhiMmText(hass,key){return rhiUxTranslate(RHI_MM_TEXT,key,{locale:hass?.locale?.language||hass?.language||'en'});}

// Presentation-neutral projection only. Do not infer raw vendor entities or backend truth.
function rhiMmPresentation(contract) {
  if (!contract.ready) return {ready:false,reason:contract.reason,rooms:[],summary:null};
  return {
    ready:true,backendVersion:contract.backendVersion,unavailable:contract.unavailable,
    // Counts describe only the native room rows visible to this HA client.
    summary:{room_count:contract.rooms.length,
      active_rooms:contract.rooms.filter(room=>room.active).length,
      playing_rooms:contract.rooms.filter(room=>room.playing).length,
      attention_rooms:contract.rooms.filter(room=>room.attention).length},
    rooms:[...contract.rooms].sort((a,b) => Number(Boolean(b.active))-Number(Boolean(a.active)) || a.name.localeCompare(b.name))
  };
}

function rhiMmRoomStatus(room,hass) {
  if(room?.attention&&['idle','active'].includes(room.phase))return rhiMmText(hass,'attention');
  if(room?.phase==='idle'&&room.native_status)return rhiMmText(hass,(['playing','on','idle','off','unknown'].includes(room.native_status)?room.native_status:'unknown'));
  const phases = {
    idle:'unknown', starting:'starting', stopping:'stopping', active:'ready',
    partial:'attention', interrupted:'recovery', error:'error'
  };
  return rhiMmText(hass,phases[room?.phase] || 'unknown');
}

function rhiMmActivityIcon(activityId = '') {
  // Icon is pure decoration; capabilities, labels and command truth come from the backend.
  const id=String(activityId).toLowerCase();
  if (id.includes('music') || id.includes('radio') || id.includes('audio')) return 'mdi:music';
  if (id.includes('game') || id.includes('xbox') || id.includes('playstation')) return 'mdi:controller';
  if (id.includes('tv') || id.includes('television')) return 'mdi:television';
  return 'mdi:play-circle-outline';
}

function rhiMmMediaSubtitle(room,hass) {
  if (room.now_playing?.title) return [room.now_playing.title,room.now_playing.artist].filter(Boolean).join(' · ');
  if (room.activity_name) return room.activity_name;
  return rhiMmRoomStatus(room,hass);
}


function rhiMmRoleLabel(hass,role){
  return ['display','receiver','amplifier','player','source','remote'].includes(role)
    ?rhiMmText(hass,'role_'+role):rhiMmText(hass,'device');
}
function rhiMmStateLabel(hass,state){
  if(['on','off','idle','playing','unknown','unavailable'].includes(state))return rhiMmText(hass,state);
  if(['paused','standby','buffering'].includes(state))return rhiMmText(hass,'state_'+state);
  return rhiMmText(hass,'unknown');
}


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


// RHI Multimedia Premium: one-card native Home Assistant dashboard.
// Core owns look/feel; backend owns meaning and all physical writers.
const RHI_MM_UX_VERSION = '0.1.12';
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
    this._activitySettingsStage='devices';this._wholeHomeFlow=false;this._wholeHome=null;
    this._destinationSelection=null;this._contextSelections=new Map();this._contextKey='';this._contextCards=[];this._planSummary=null;this._planRequest=0;
    this._optionsStep=null;this._optionsData={};this._optionsBusy=false;
    this._optionsError='';this._optionsNotice='';this._optionsEpoch=0;this._optionsRevision=0;
    this._onLocation=()=>{
      if(!['settings','activities','devices'].includes(this.currentRoute().view)&&(this._optionsStep||this._optionsBusy)){
        void this.cancelOptions();
      }else{this._lastSignature='';this.render();}
    };
    this.shadowRoot.addEventListener('click',event=>this.onClick(event));
    this.shadowRoot.addEventListener('change',event=>{this.onControlChange(event);this.onOptionValue(event);this.onWholeHomeInput(event);});
    this.shadowRoot.addEventListener('input',event=>{this.onOptionValue(event);this.onWholeHomeInput(event);});
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
    // A recovery link only selects the exact logical room/device editor.
    // It never changes Foundation binding or performs a native device write.
    const openSettings=event.target?.closest?.('[data-mm-settings-open]');
    if(openSettings){
      event.preventDefault();
      const category=openSettings.getAttribute('data-mm-settings-open');
      if(['locations','devices','activities'].includes(category)){
        if(this._optionsStep||this._optionsBusy)await this.cancelOptions();
        const room=openSettings.getAttribute('data-room')||'';
        const key=openSettings.getAttribute('data-device')||'';
        if(category==='devices'&&room&&key)
          this._settingsSelections.set('devices',room+':'+key);
        this._settingsCategory=category;
        this.navigate('settings');
      }
      return;
    }
    const reviewBack=event.target?.closest?.('[data-mm-review-back]');
    if(reviewBack&&this._wholeHomeFlow&&this._optionsStep?.step_id==='review'){
      this._optionsData.return_to_setup=true;this._optionsData.confirm=false;
      await this.submitOptions();return;
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
      this._settingsSelections.set(this._settingsCategory,settingsPick.getAttribute('data-mm-settings-pick'));
      this._activitySettingsStage='devices';
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
    const wholeAction=event.target?.closest?.('[data-wh-action]');
    if(wholeAction&&this._optionsStep?.step_id==='complete_setup'&&this._wholeHome){
      event.preventDefault();
      const action=wholeAction.getAttribute('data-wh-action');
      if(action==='review'){
        this._optionsData.yaml_text=JSON.stringify(this._wholeHome.doc,null,2);
        await this.submitOptions();
      }else{
        const id=action==='apply_json'
          ?this.shadowRoot?.querySelector?.('[data-wh-raw]')?.value||''
          :wholeAction.getAttribute('data-wh-id')||'';
        rhiMmWholeAction(this._wholeHome,action,id,
          wholeAction.getAttribute('data-phase')||'',
          Number(wholeAction.getAttribute('data-index')));
        this._optionRefresh();
      }
      return;
    }
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
    if(nav){event.preventDefault();if(this.blockWholeHomeNavigation())return;
      if(this._optionsStep||this._optionsBusy)await this.cancelOptions();
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
  onWholeHomeInput(event){
    if(this._optionsStep?.step_id!=='complete_setup'||!this._wholeHome)return;
    const element=event.target?.closest?.('[data-wh-field]');
    if(!element)return;
    const key=element.getAttribute('data-wh-field');
    const value=element.type==='checkbox'?element.checked:element.value;
    const before=this._wholeHome.error;
    const changed=rhiMmWholeChange(this._wholeHome,key,value,element.checked);
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
  blockWholeHomeNavigation(){
    if(this._wholeHomeFlow&&(this._optionsStep||this._optionsBusy)){
      this._optionsError=this.t('whole_home_leave_warning');
      this._optionRefresh();return true;
    }
    return false;
  }
  async openOptions({action,room='',activity='',scope='',id='',
    phase='',operation='',index=null,device='',stepType=''}) {
    if(!this._hass?.user?.is_admin||this._optionsBusy)return;
    const oldStep=this._optionsStep;
    const wholeHome=action==='complete_setup';
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
      this._wholeHomeFlow=wholeHome;
      this._optionsStep=step;this._optionsData=rhiMmOptionDefaults(step);
      this._wholeHome=step.step_id==='complete_setup'?rhiMmWholeFromStep(step):null;
    }catch(_){
      if(epoch===this._optionsEpoch){this._wholeHomeFlow=false;this._optionsError=this.t('setup_flow_failed');}
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
        this._optionsStep=null;this._optionsData={};this._wholeHomeFlow=false;this._wholeHome=null;
        this._optionsNotice=this.t('setup_saved');
        if(this._settingsCategory==='activities')this._activitySettingsStage='tune';
      }else if(response?.type==='form'){
        this._optionsStep=response;
        if(response.step_id!==step.step_id)this._optionsData=rhiMmOptionDefaults(response);
        if(response.step_id==='complete_setup'&&this._wholeHome)
          this._wholeHome.error=this.optionError(response,response.errors?.base)||'';
        else if(response.step_id==='complete_setup')
          this._wholeHome=rhiMmWholeFromStep(response);
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
    this._optionsStep=null;this._optionsData={};this._optionsBusy=false;this._wholeHomeFlow=false;
    this._wholeHome=null;
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
    return rhiMmWholeRender(this._wholeHome,key=>this.t(key),rhiUxEscape);
  }
  renderOptionsEditor(){
    // HA's actual administrator permission remains authoritative on every
    // render. Never expose an in-flight form after role revocation.
    if(!this._hass?.user?.is_admin)return '';
    const escape=rhiUxEscape,step=this._optionsStep;
    if(step?.step_id==='complete_setup')return this.renderCompleteSetup(step);
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
    const stageTitle=step?.step_id==='activity_devices'?this.t('choose_devices'):
      step?.step_id==='activity_device_order'?this.t('tune_actions'):null;
    return `<section class="mm-surface mm-options-editor" aria-live="polite" data-mm-flow-editor>
      <h3>${escape(stageTitle||label||this.t('setup_editor'))}</h3>
      ${guidance?`<p class="mm-options-description">${escape(guidance)}</p>`:''}
      ${base?`<p role="alert" class="mm-room-error">${escape(base)}</p>`:''}
      ${this._optionsNotice?`<p role="status">${escape(this._optionsNotice)}</p>`:''}
      ${step?.type==='form'?`<div class="mm-option-fields">
        ${(step.data_schema||[]).filter(field=>!(this._wholeHomeFlow&&
          step.step_id==='review'&&field.name==='return_to_setup'))
          .map(field=>this.optionInput(step,field)).join('')}</div>`:''}
      <div class="mm-setup-actions">
        ${this._wholeHomeFlow&&step?.step_id==='review'?
          `<button type='button' data-mm-review-back>${this.t('whole_home_back')}</button>`:''}
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
      this._optionsRevision,this._activitySettingsStage,this._hass.user?.id,this._hass.user?.is_admin,this._hass.locale?.language||this._hass.language]);
    // Keep independently mounted Core cards connected when media state changes.
    // Only replace the domain page, not the shared contextual editor.
    if(this._lastSignature!==fingerprint){
      this._lastSignature=fingerprint;
      const activeModule=['settings','activities','devices'].includes(route.view)?'settings':
        ['insights','diagnostics'].includes(route.view)?'insights':'overview';
      const shell=rhiUxDomainShell({product:'Home Intelligence',domain:'MULTIMEDIA',
        modules:MM_MODULES.map(m=>({...m,label:this.t(m.id)})),activeModule,activeItem:''});
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
    // A full-house editing session deserves the available iPad canvas, not
    // the marketing hero and separate read-only Settings cards.
    if(view==='settings'&&this._wholeHomeFlow&&this._optionsStep&&
        this._hass?.user?.is_admin===true)
      return `<section class='mm-page-whole-home'>${this.renderOptionsEditor()}</section>`;
    const hero=this.hero(view);
    if(!model.ready){
      // A first-time installer must be able to reach the authoritative
      // Options Flow even before any room sensor exists.
      const firstSetup=view==='settings'&&this._hass?.user?.is_admin?
        this.settings({rooms:[]}):view==='activities'&&this._hass?.user?.is_admin?
        this.activities({rooms:[]}):'';
      const editor=''; // Editors live exclusively in Settings and its configuration workspaces.
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
    const editor=''; // Editors live exclusively in Settings and its configuration workspaces.
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
      const unavailable=!d.available||!d.foundation_approved;
      const advanced=['play','pause','stop','previous','next','remote_key','sound_mode']
        .some(action=>d.controls?.[action]?.enabled===true);
      return `<div class="mm-cockpit-device">
        <div class="mm-cockpit-device-heading">
          <span>${rhiMmDeviceArt(d,this.t('illustrative_device_art'))}<b>${escape(d.name)}</b></span>
          <small class="${unavailable?'mm-room-error':''}">${unavailable?
            this.t('device_unavailable'):escape(rhiMmStateLabel(this._hass,d.state))}</small>
          ${this.nativeMediaPlayerAction(d)}
        </div>
        ${d.foundation_approved&&d.available&&d.media_title?
          `<div class='mm-device-nowplaying'><ha-icon icon='mdi:play-circle-outline'></ha-icon>
             <span><b>${escape(d.media_title)}</b>
               ${d.media_artist?`<small>${escape(d.media_artist)}</small>`:''}
               ${d.source?`<small>${this.t('input')}: ${escape(d.source)}</small>`:''}
             </span></div>`:''}
        ${this.roomDeviceBasicActions(room,d)}
        <details class="mm-cockpit-device-details" data-persist="${escape(key)}"
          ${this._expanded.has(key)?'open':''}>
          <summary>${this.t('details')}</summary>
          <div class="mm-cockpit-device-body">
            <small>${escape(rhiMmRoleLabel(this._hass,d.role))} ${d.shared?' · '+this.t('shared_source'):''}</small>
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
          ${devices||this.t('no_devices')}</article>
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
    const e=rhiUxEscape,media=room.now_playing||null,focus=room.media_focus||{};
    const player=media?(room.devices||[]).find(d=>d.key===media.device_key):null;
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
    const progress=validTimeline?`<div class='mm-media-progress'>
      <progress max='${media.duration}' value='${media.position}'
        aria-label='${this.t('playback_progress')}'></progress>
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
    const nativePlayer=player?this.nativeMediaPlayerAction(player):'';
    const focusLabel=focus.device_name||room.activity_name||this.t('media_ready');
    const sourceLabel=focus.source||media?.source||player?.source||'';
    const hasPlayback=!!media;
    return `<article class='mm-surface mm-now-playing' aria-label='${this.t('now_playing')}'>
      <div class='mm-media-head'><h3>${this.t('now_playing')}</h3>
        <span class='mm-media-state'>${e(hasPlayback?
          rhiMmStateLabel(this._hass,media.state||player?.state):
          room.activity_name?rhiMmRoomStatus(room,this._hass):this.t('media_ready'))}</span>
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

  nativeMediaPlayerAction(device){
    // Reuse the actual Home Assistant media-player dialog as Basic does.
    // Never discover a new endpoint from entity names or invent an action.
    const id=device?.entity_id;
    if(typeof id!=='string'||!/^media_player\.[a-z0-9_]+$/.test(id)||
       !this._hass?.states?.[id])return '';
    const e=rhiUxEscape;
    return `<button type="button" class="mm-native-media-link" data-more-info="${e(id)}"
      aria-label="${e(device.name+' · '+this.t('native_device'))}">
      <ha-icon icon="mdi:open-in-new"></ha-icon>${this.t('native_device')}</button>`;
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
    const shouldShowPower=!!device.entity_id?.startsWith('media_player.')||
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
            data-value="${escape(JSON.stringify(k))}"
            aria-label="${escape(d.name+' · '+label)}" title="${escape(label)}">
            ${icons[name]?`<ha-icon icon='${icons[name]}'></ha-icon>`:
              `<span>${escape(label)}</span>`}</button>`;
        };
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
  roomDeviceDetails(room){return `<article class="mm-surface"><h3>${this.t('connected_devices')}</h3><div class="mm-device-list">${room.devices.map(d=>`<div class="mm-device-row">${rhiMmDeviceArt(d,this.t('illustrative_device_art'))}<div><b>${rhiUxEscape(d.name)}</b>${d.product_profile?`<small>${this.t('verified_model')}: ${rhiUxEscape(d.product_profile.manufacturer)} ${rhiUxEscape(d.product_profile.model)}</small>`:''}<small>${rhiUxEscape(rhiMmRoleLabel(this._hass,d.role))} · ${rhiUxEscape(d.source||rhiMmStateLabel(this._hass,d.state))}${d.shared?' · '+this.t('shared_source'):''}${d.group_members?.length>1?' · '+this.t('grouped')+' ('+d.group_members.length+' '+this.t('players')+')':''}</small>${d.registered_location?.area_id?`<small>${this.t('native_area')}: ${rhiUxEscape(d.registered_location.area_name||d.registered_location.area_id)}${d.registered_location.area_id!==room.area_id?` · ${this.t('used_in')}: ${rhiUxEscape(room.name)}`:''}</small>`:''}${this.roomAvailableControls(d)}${this.deviceNotificationActions(d)}</div><span class="mm-phase ${d.available&&d.foundation_approved?'mm-phase-good':'mm-phase-warn'}">${d.available&&d.foundation_approved?this.t('connected'):this.t('attention')}</span>${this.nativeMediaPlayerAction(d)}</div>`).join('')}</div></article>`;}
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
${manage?`<div class="mm-setup-actions"><button type="button" data-mm-option-action="cec_device"
          data-mm-option-room="${esc(selected.room.id)}">${this.t('setup_cec_devices')}</button>
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
      const invalidSelection=offline.find(d=>d.foundation_approved===false);
      const message=room.phase==='starting'||room.phase==='stopping'?
        this.t('waiting'):
        offline.length?`${affected?.name||room.name}: ${this.t('insights_unavailable')}`:
        attention&&misses.length?`${affected?.name||room.name}: ${this.t('insights_target_mismatch')}`:
        attention?this.t('insights_attention'):
        this.t('insights_no_issue');
      const latest=room.last_attempt;
      const repairAction=invalidSelection&&this._hass?.user?.is_admin===true?
        `<button type='button' data-mm-settings-open='devices'
          data-room='${esc(room.id)}' data-device='${esc(invalidSelection.key)}'>
          ${this.t('source_repair_action')}</button>`:'';
      const more=room.id+':insights:details';
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
        ${invalidSelection?`<p class='mm-source-repair-hint'>${esc(this.t('source_repair_hint'))}</p>`:''}
        <div class="mm-insight-actions">${repairAction}${fix}
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
        ${traceDetail}
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

})();
