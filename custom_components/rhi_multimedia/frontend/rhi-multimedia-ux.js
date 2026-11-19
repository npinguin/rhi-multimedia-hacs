/* Robotix Home Intelligence Multimedia UX v0.1.7; canonical RHI UX Core 1.6.4 */
(()=>{
'use strict';
const RHI_MM_CORE_CSS=":host,.rhi-ux-root{\n  --rhi-color-primary:#1467F5;\n  --rhi-color-primary-soft:#EAF3FF;\n  --rhi-color-text:#0F172A;\n  --rhi-color-muted:#64748B;\n  --rhi-color-muted-soft:#758399;\n  --rhi-color-line:#DCE5EF;\n  --rhi-color-line-soft:#EAF0F6;\n  --rhi-color-surface:#FFFFFF;\n  --rhi-color-surface-soft:#F8FAFC;\n  --rhi-color-ok:#22C55E;\n  --rhi-color-attention:#F59E0B;\n  --rhi-color-error:#B42318;\n  --rhi-color-unknown:#94A3B8;\n\n  --rhi-font-family:var(--ha-font-family-body,Roboto,Noto,sans-serif);\n  --rhi-font-family-mono:var(--ha-font-family-code,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);\n  --rhi-font-display:clamp(29px,2.55vw,42px);\n  --rhi-font-section:clamp(18px,1.4vw,22px);\n  --rhi-font-card:15px;\n  --rhi-font-body:12.5px;\n  --rhi-font-small:11px;\n  --rhi-font-label:10.5px;\n  --rhi-font-value:13px;\n  --rhi-font-diagnostic:10px;\n  --rhi-weight-regular:400;\n  --rhi-weight-medium:500;\n  --rhi-weight-strong:600;\n  --rhi-line-height-tight:1.15;\n  --rhi-line-height-body:1.42;\n\n  --rhi-space-1:4px;\n  --rhi-space-2:7px;\n  --rhi-space-3:10px;\n  --rhi-space-4:14px;\n  --rhi-space-5:18px;\n  --rhi-space-6:24px;\n  --rhi-radius-sm:9px;\n  --rhi-radius-md:12px;\n  --rhi-radius-lg:16px;\n  --rhi-radius-xl:20px;\n  --rhi-shadow-sm:0 4px 14px rgba(21,61,115,.025);\n  --rhi-shadow-md:0 7px 20px rgba(15,35,80,.035);\n  --rhi-page-max:1640px;\n  --rhi-page-pad-x:24px;\n  --rhi-page-pad-y:14px;\n  --rhi-control-h:38px;\n  --rhi-icon-action:18px;\n  --rhi-icon-status:24px;\n  --rhi-break-phone:430px;\n  --rhi-break-tablet:760px;\n  --rhi-break-desktop:1024px;\n  --rhi-domain-accent:var(--rhi-color-primary);\n\n  color:var(--rhi-color-text);\n  font-family:var(--rhi-font-family);\n  font-size:var(--rhi-font-body);\n  font-weight:var(--rhi-weight-regular);\n  line-height:var(--rhi-line-height-body);\n}\n\n.rhiUxDomainShell{\n  --rhi-nav-active-bg:var(--rhi-color-primary-soft);\n  --rhi-nav-active-border:#CFDEF1;\n  --rhi-nav-active-text:#0F4CA4;\n  position:relative;display:grid;grid-template-columns:minmax(0,1fr) clamp(190px,23%,280px);\n  width:100%;margin:0 0 12px;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-xl);\n  background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(249,251,254,.91));box-shadow:var(--rhi-shadow-md);overflow:hidden;\n}\n.rhiUxProductArea{min-width:0;overflow:hidden}\n.rhiUxDomainShellTop{min-height:68px;display:grid;grid-template-columns:minmax(168px,.52fr) minmax(0,1.48fr);align-items:center;gap:14px;padding:10px 22px 9px}\n.rhiUxDomainIdentity{display:grid;align-content:center;gap:2px;min-width:0;min-height:48px;padding:2px 0 0 4px}\n.rhiUxDomainIdentity span{font-size:13px;line-height:1.15;font-weight:var(--rhi-weight-regular);color:#58708F;white-space:nowrap}\n.rhiUxDomainIdentity strong{font-size:21px;line-height:1.03;letter-spacing:.045em;font-weight:var(--rhi-weight-strong);color:#0B467F;white-space:nowrap}\n.rhiUxModuleTabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;min-width:0}\n.rhiUxModuleTab,.rhiUxDomainTab{appearance:none;border:0;background:transparent;font:inherit;color:#53647D;cursor:pointer;white-space:nowrap}\n.rhiUxModuleTab{min-height:40px;border-radius:12px;padding:8px;font-size:12px;font-weight:var(--rhi-weight-medium)}\n.rhiUxModuleTab.active{background:var(--rhi-nav-active-bg);color:var(--rhi-nav-active-text);box-shadow:inset 0 0 0 1px var(--rhi-nav-active-border),0 6px 16px rgba(15,23,42,.035)}\n.rhiUxDomainShellBottom{padding:5px 22px 7px;border-top:1px solid var(--rhi-color-line-soft);background:rgba(255,255,255,.52);min-height:46px;box-sizing:border-box}\n.rhiUxDomainTabs{display:flex;align-items:center;gap:10px;min-height:34px;overflow-x:auto;scrollbar-width:none}\n.rhiUxDomainTabs::-webkit-scrollbar{display:none}\n.rhiUxDomainTab{flex:0 0 auto;min-height:34px;border-radius:11px;padding:7px 12px;font-size:11.5px;font-weight:var(--rhi-weight-medium);color:#5F6D80}\n.rhiUxDomainTab.active{background:var(--rhi-nav-active-bg);color:var(--rhi-nav-active-text);box-shadow:inset 0 0 0 1px var(--rhi-nav-active-border)}\n.rhiUxCompanyBrand{min-width:0;border-left:1px solid var(--rhi-color-line-soft);display:grid;place-items:center;padding:10px 16px;background:linear-gradient(180deg,rgba(252,254,255,.78),rgba(247,250,253,.58))}\n.rhiUxCompanyLogo{display:block;width:min(100%,250px);max-height:116px;line-height:0;overflow:hidden}\n.rhiUxCompanyLogo svg{display:block;width:100%;height:auto;max-height:116px;object-fit:contain;object-position:center}\n\n/* Canonical page stack: visual order is invariant across domains. */\n.rhiUxPageStack{display:flex;flex-direction:column}\n.rhiUxPageStack>.rhiUxPageHero{order:1}\n.rhiUxPageStack>.rhiUxStatusGrid{order:2}\n.rhiUxPageStack>.rhiUxQuickActionBar{order:3}\n\n/* Canonical page hero: image is one background layer, never a split side panel. */\n.rhiUxPageHero{\n  position:relative;display:block;height:146px;min-height:146px;overflow:hidden;\n  border:0;border-radius:var(--rhi-radius-lg);background:#fff;box-shadow:none;margin:0;\n}\n.rhiUxPageHeroCopy{\n  position:relative;z-index:4;width:min(48%,650px);max-width:none;padding:20px 18px 18px 22px;box-sizing:border-box;\n}\n.rhiUxPageHeroCopy>small{display:none}\n.rhiUxPageHeroCopy h1,.rhiUxPageHeroCopy h2{\n  margin:4px 0 8px;font-size:var(--rhi-font-display);line-height:1.02;letter-spacing:-.038em;\n  color:#0B1739;font-weight:var(--rhi-weight-strong);\n}\n.rhiUxPageHeroCopy p{\n  margin:0;max-width:520px;font-size:clamp(12.5px,1.05vw,15px);line-height:var(--rhi-line-height-body);\n  color:#536781;font-weight:var(--rhi-weight-regular);\n}\n.rhiUxPageHeroArt{position:absolute;z-index:1;inset:0 0 0 28%;display:block;overflow:hidden;pointer-events:none}\n.rhiUxPageHeroArt:before{\n  content:\"\";display:block;position:absolute;z-index:2;inset:0;\n  background:linear-gradient(90deg,#fff 0%,rgba(255,255,255,.95) 8%,rgba(255,255,255,.62) 19%,rgba(255,255,255,.10) 38%,rgba(255,255,255,0) 57%);\n}\n.rhiUxPageHeroArt img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 52%;transform:none}\n\n/* One canonical page status layer. */\n.rhiUxStatusGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:7px 0 0;padding:0;border:0;background:transparent;box-shadow:none}\n.rhiUxStatusItem{\n  min-width:0;min-height:68px;display:grid;grid-template-columns:44px minmax(0,1fr);gap:10px;align-items:center;\n  padding:10px 12px;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-md);background:#fff;box-shadow:var(--rhi-shadow-md);\n}\n.rhiUxStatusIcon{width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:#F0F5FC;color:#355D96;font-size:18px}\n.rhiUxStatusIcon ha-icon{--mdc-icon-size:var(--rhi-icon-status)}\n.rhiUxStatusCopy{min-width:0;display:block}\n.rhiUxStatusCopy small{display:block;margin:0 0 2px;color:#476487;font-size:var(--rhi-font-label);font-weight:var(--rhi-weight-medium);line-height:1.2}\n.rhiUxStatusCopy b{display:block;margin:0 0 2px;color:var(--rhi-color-text);font-size:clamp(14px,1.12vw,17px);font-weight:var(--rhi-weight-strong);line-height:1.12;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.rhiUxStatusCopy em{display:block;margin-top:2px;color:var(--rhi-color-muted);font-size:var(--rhi-font-small);font-style:normal;font-weight:var(--rhi-weight-regular);line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n\n/* Canonical page-level quick actions. */\n.rhiUxQuickActionBar,.rhiEnergyQuickActions,.rhi-top-actions{\n  min-height:48px;padding:5px 8px;margin:7px 0 0;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-md);\n  background:#fff;box-shadow:var(--rhi-shadow-sm);display:flex;align-items:center;gap:7px;flex-wrap:wrap;\n}\n.rhiUxQuickActionBar>small,.rhiEnergyQuickActions>small,.rhi-top-actions-title{\n  font-size:var(--rhi-font-label);letter-spacing:.10em;text-transform:uppercase;color:#476487;\n  font-weight:var(--rhi-weight-medium);margin-right:2px;white-space:nowrap;\n}\n.rhiUxQuickActions{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:0}\n.rhiUxQuickAction,.rhiUxQuickActionBar button,.rhiEnergyQuickActions .hiAction,.rhi-top-action{\n  height:36px;min-height:36px;border:1px solid #D6E0EB;border-radius:9px;background:#fff;color:#125DB7;\n  box-shadow:none;font:inherit;font-size:11.5px;font-weight:var(--rhi-weight-medium);padding:0 12px;\n  display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;white-space:nowrap;\n}\n.rhiUxQuickAction.primary,.rhiUxQuickActionBar button:first-of-type,.rhiEnergyQuickActions .hiAction:first-of-type,.rhi-top-action.primary{\n  background:var(--rhi-color-primary);border-color:var(--rhi-color-primary);color:#fff;\n}\n.rhiUxQuickAction:disabled,.rhiEnergyQuickActions .hiAction:disabled,.rhi-top-action:disabled{opacity:.46}\n\n/* Canonical body grammar. */\n.rhiUxDomainBody{font-family:var(--rhi-font-family);color:var(--rhi-color-text);font-size:var(--rhi-font-body);line-height:var(--rhi-line-height-body)}\n.rhiUxDomainBody button,.rhiUxDomainBody select,.rhiUxDomainBody input,.rhiUxDomainBody textarea{font-family:inherit}\n.rhiUxPanel,.rhiUxDomainBody .panel,.rhiUxDomainBody .info,.rhiUxDomainBody .summary,.rhiUxDomainBody .ov-panel{\n  border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-lg);background:var(--rhi-color-surface);box-shadow:var(--rhi-shadow-sm);\n}\n.rhiUxPanel{padding:14px 16px}\n.rhiUxDomainBody .panel h2,.rhiUxDomainBody .info h2,.rhiUxDomainBody .summary h2,.rhiUxDomainBody .ov-panel h2{\n  font-size:var(--rhi-font-section);font-weight:var(--rhi-weight-strong);line-height:var(--rhi-line-height-tight);letter-spacing:-.02em;color:var(--rhi-color-text);\n}\n.rhiUxDomainBody .panel h3,.rhiUxDomainBody .info h3,.rhiUxDomainBody .summary h3,.rhiUxDomainBody .ov-panel h3{\n  font-size:var(--rhi-font-card);font-weight:var(--rhi-weight-strong);line-height:1.2;color:var(--rhi-color-text);\n}\n.rhiUxDomainBody .panel p,.rhiUxDomainBody .info p,.rhiUxDomainBody .summary p,.rhiUxDomainBody .ov-panel p{\n  font-size:var(--rhi-font-body);font-weight:var(--rhi-weight-regular);line-height:var(--rhi-line-height-body);color:var(--rhi-color-muted);\n}\n.rhiUxDataList{display:grid;gap:6px}\n.rhiUxDataRow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:9px 10px;border:1px solid var(--rhi-color-line-soft);border-radius:var(--rhi-radius-sm);background:var(--rhi-color-surface-soft)}\n.rhiUxState{display:grid;gap:4px;padding:14px 16px;border:1px dashed var(--rhi-color-line);border-radius:var(--rhi-radius-md);background:var(--rhi-color-surface-soft);color:var(--rhi-color-muted)}\n.rhiUxState b{color:var(--rhi-color-text);font-size:13px}\n.rhiUxState[data-state=\"attention\"]{border-color:#F6D48C;background:#FFFBEB}\n.rhiUxState[data-state=\"error\"]{border-color:#F1B8B4;background:#FFF7F7}\n.rhiUxConclusion{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;margin:8px 0 0;padding:10px 12px;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-md);background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(247,250,252,.96))}\n.rhiUxConclusion small{font-size:var(--rhi-font-label);letter-spacing:.1em;text-transform:uppercase;color:var(--rhi-color-muted)}\n.rhiUxConclusion h2{font-size:var(--rhi-font-card);line-height:1.2;margin:1px 0 2px}\n.rhiUxConclusion p{font-size:var(--rhi-font-small);line-height:1.3;margin:0;color:var(--rhi-color-muted)}\n.rhiUxTechnicalFooter{display:flex;justify-content:center;flex-wrap:wrap;gap:4px 9px;margin:6px 0 0;padding:3px 2px 0;border-top:1px solid rgba(148,163,184,.20);color:#94A3B8;font-size:9px;line-height:1.2}\n.rhiUxTechnicalFooter span+span:before{content:\"·\";margin-right:9px;color:#CBD5E1}\n.rhiUxTechnicalFooter [data-severity=\"warning\"]{color:#B7791F;font-weight:var(--rhi-weight-strong)}\n.rhiUxTechnicalFooter [data-severity=\"error\"]{color:var(--rhi-color-error);font-weight:var(--rhi-weight-strong)}\n\n@media(max-width:1180px){\n  :host,.rhi-ux-root{--rhi-page-pad-x:18px}\n  .rhiUxPageHero{height:140px;min-height:140px}\n  .rhiUxPageHeroCopy{width:51%;padding:18px 14px 16px 18px}\n  .rhiUxPageHeroArt{inset:0 0 0 30%}\n  .rhiUxStatusItem{grid-template-columns:40px minmax(0,1fr);padding:9px 10px;min-height:66px}\n  .rhiUxStatusIcon{width:37px;height:37px}\n}\n@media(max-width:760px){\n  :host,.rhi-ux-root{--rhi-page-pad-x:10px;--rhi-page-pad-y:9px;--rhi-font-body:12px;--rhi-font-small:10.75px}\n  .rhiUxDomainShell{grid-template-columns:1fr}.rhiUxCompanyBrand{display:none}.rhiUxDomainShellTop{grid-template-columns:1fr;padding:10px 12px}.rhiUxDomainIdentity{min-height:auto}.rhiUxDomainShellBottom{padding:7px 12px 9px}\n  .rhiUxPageHero{height:128px;min-height:128px;border-radius:14px}\n  .rhiUxPageHeroCopy{width:59%;padding:18px 9px 16px 13px}\n  .rhiUxPageHeroCopy h1,.rhiUxPageHeroCopy h2{font-size:27px;letter-spacing:-.032em}\n  .rhiUxPageHeroCopy p{font-size:11px;line-height:1.32;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}\n  .rhiUxPageHeroArt{inset:0 0 0 34%}\n  .rhiUxStatusGrid{grid-template-columns:repeat(2,minmax(0,1fr))}\n  .rhiUxStatusItem{min-height:74px;grid-template-columns:34px minmax(0,1fr);gap:7px;padding:8px}\n  .rhiUxStatusIcon{width:32px;height:32px;border-radius:9px}.rhiUxStatusIcon ha-icon{--mdc-icon-size:20px}\n  .rhiUxQuickActionBar,.rhiEnergyQuickActions,.rhi-top-actions{overflow-x:auto;flex-wrap:nowrap}\n  .rhiUxQuickActionBar>small,.rhiEnergyQuickActions>small,.rhi-top-actions-title,.rhiUxQuickAction,.rhiUxQuickActionBar button,.rhiEnergyQuickActions .hiAction,.rhi-top-action{flex:0 0 auto}\n  .rhiUxConclusion{grid-template-columns:1fr}\n}\n@media(max-width:430px){\n  :host,.rhi-ux-root{--rhi-page-pad-x:8px;--rhi-page-pad-y:8px}\n  .rhiUxPageHero{height:118px;min-height:118px}\n  .rhiUxPageHeroCopy{width:64%;padding:16px 8px 14px 11px}\n  .rhiUxPageHeroCopy h1,.rhiUxPageHeroCopy h2{font-size:24px}\n  .rhiUxPageHeroCopy p{font-size:10.5px;-webkit-line-clamp:2}\n  .rhiUxPageHeroArt{inset:0 0 0 38%}\n  .rhiUxStatusGrid{grid-template-columns:1fr 1fr}\n}\n\n/* Optional body/section-scoped view and filter controls. */\n.rhiUxContextBar{\n  min-height:42px;padding:4px 7px;margin:0 0 8px;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-md);\n  background:#fff;box-shadow:var(--rhi-shadow-sm);display:flex;align-items:center;gap:7px;flex-wrap:wrap;\n}\n.rhiUxContextBar>small{\n  font-size:var(--rhi-font-label);letter-spacing:.10em;text-transform:uppercase;color:#476487;font-weight:var(--rhi-weight-medium);white-space:nowrap;\n}\n.rhiUxContextControls{display:flex;align-items:center;gap:6px;flex-wrap:wrap}\n.rhiUxContextControl{\n  min-height:32px;border:1px solid #D6E0EB;border-radius:9px;background:#fff;color:#355D96;font:inherit;font-size:11.5px;font-weight:var(--rhi-weight-medium);padding:0 11px;cursor:pointer;white-space:nowrap;\n}\n.rhiUxContextControl.active,.rhiUxContextControl[aria-pressed=\"true\"]{background:var(--rhi-color-primary-soft);border-color:#CFDEF1;color:#0F4CA4}\n.rhiUxContextControl:disabled{opacity:.46}\n@media(max-width:760px){.rhiUxContextBar{overflow-x:auto;flex-wrap:nowrap}.rhiUxContextBar>small,.rhiUxContextControls,.rhiUxContextControl{flex:0 0 auto}}\n\n/* Canonical cross-domain appearance picker. Domains own catalogs and persistence. */\n.rhiUxVisualPickerBackdrop{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.44);display:grid;place-items:center;padding:20px}\n.rhiUxVisualPickerPanel{width:min(920px,94vw);max-height:min(82vh,760px);overflow:hidden;background:#fff;border:1px solid var(--rhi-color-line);border-radius:20px;box-shadow:0 30px 80px rgba(15,23,42,.24);padding:16px;box-sizing:border-box;display:grid;grid-template-rows:auto auto minmax(0,1fr) auto auto;gap:10px}\n.rhiUxVisualPickerHead{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;min-height:0}\n.rhiUxVisualPickerHead small{font-size:var(--rhi-font-label);font-weight:800;letter-spacing:.12em;color:#64748b}.rhiUxVisualPickerHead h3{margin:2px 0 0;font-size:20px}.rhiUxVisualPickerHead p{margin:3px 0 0;font-size:11px;color:#64748b}\n.rhiUxVisualPickerFilters{display:flex;gap:6px;flex-wrap:wrap;margin:0;min-height:0}\n.rhiUxVisualPickerFilters button{border:1px solid #dbe3ee;background:#fff;border-radius:999px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer}.rhiUxVisualPickerFilters button.selected{border-color:#93c5fd;background:#eff6ff;color:#1d4ed8}\n.rhiUxVisualChoiceGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:142px;gap:8px;margin:0;overflow-y:auto;overscroll-behavior:contain;padding:2px 3px 4px 1px;align-content:start}\n.rhiUxVisualChoice{height:142px;min-height:142px;max-height:142px;display:grid;grid-template-rows:86px minmax(0,1fr);gap:6px;align-items:stretch;text-align:left;border:1px solid #e2e8f0;background:#fff;border-radius:12px;padding:8px;cursor:pointer;overflow:hidden}.rhiUxVisualChoice:hover{border-color:#93c5fd;background:#f8fbff}.rhiUxVisualChoice.selected{border-color:#2563eb;box-shadow:0 0 0 2px rgba(37,99,235,.12);background:#f8fbff}\n.rhiUxVisualChoiceImage{width:100%;height:86px;min-width:0;min-height:86px;max-width:none;max-height:86px;display:grid;place-items:center;overflow:hidden}.rhiUxVisualChoiceImage img{display:block;width:100%;height:100%;min-width:0;min-height:0;max-width:100%;max-height:100%;object-fit:contain;object-position:center}\n.rhiUxVisualChoiceCopy{min-width:0;align-self:end}.rhiUxVisualChoiceCopy small,.rhiUxVisualChoiceCopy b,.rhiUxVisualChoiceCopy em{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rhiUxVisualChoiceCopy small{font-size:var(--rhi-font-label);color:#64748b;text-transform:uppercase}.rhiUxVisualChoiceCopy b{font-size:12px;margin-top:1px}.rhiUxVisualChoiceCopy em{font-size:var(--rhi-font-small);color:#64748b;font-style:normal;margin-top:1px}\n.rhiUxVisualPickerRefine{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:8px;margin:0}.rhiUxVisualPickerRefine label span{display:block;font-size:var(--rhi-font-label);color:#64748b;margin-bottom:3px}.rhiUxVisualPickerRefine select{width:100%;height:34px;border:1px solid #dbe3ee;border-radius:8px;background:#fff;padding:0 8px}\n.rhiUxVisualPickerFooter{display:flex;align-items:center;gap:8px;margin:0;padding-top:9px;border-top:1px solid #edf1f6}.rhiUxVisualPickerSpacer{flex:1}.rhiUxVisualPickerFooter button{height:34px;border:1px solid #dbe3ee;border-radius:9px;background:#fff;padding:0 12px;font-size:var(--rhi-font-small);font-weight:700}.rhiUxVisualPickerFooter button.primary{background:#0b65ea;color:#fff;border-color:#0b65ea}.rhiUxVisualPickerFooter button:disabled{opacity:.45}\n@media(max-width:900px){.rhiUxVisualChoiceGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}\n@media(max-width:560px){.rhiUxVisualPickerBackdrop{padding:8px}.rhiUxVisualPickerPanel{width:96vw;max-height:88vh;padding:12px}.rhiUxVisualChoiceGrid{grid-template-columns:1fr;grid-auto-rows:116px}.rhiUxVisualChoice{height:116px;min-height:116px;max-height:116px;grid-template-columns:94px minmax(0,1fr);grid-template-rows:1fr}.rhiUxVisualChoiceImage{width:94px;height:86px;min-width:94px;max-width:94px}.rhiUxVisualChoiceCopy{align-self:center}.rhiUxVisualPickerRefine{grid-template-columns:1fr 1fr}.rhiUxVisualPickerFooter{flex-wrap:wrap}}\n\n\n/* Canonical page and asset composition primitives. */\n.rhiUxPage{display:block;width:100%;max-width:var(--rhi-page-max);margin:0 auto;padding:var(--rhi-page-pad-y) var(--rhi-page-pad-x);box-sizing:border-box}\n.rhiUxPageContent{display:grid;gap:var(--rhi-space-3);margin-top:var(--rhi-space-3)}\n.rhiUxAssetCardShell{display:grid;gap:var(--rhi-space-3);min-width:0;padding:12px;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-lg);background:var(--rhi-color-surface);box-shadow:var(--rhi-shadow-sm)}\n.rhiUxAssetCardIdentity,.rhiUxAssetCardFacts,.rhiUxAssetCardRelationships,.rhiUxAssetCardActions,.rhiUxAssetCardDetails,.rhiUxAssetCardFeedback{min-width:0}\n.rhiUxAssetCardRelationships{display:grid;gap:var(--rhi-space-2)}\n.rhiUxAssetCardActions{display:flex;align-items:center;gap:var(--rhi-space-2);flex-wrap:wrap}\n.rhiUxAssetCardDetails:empty,.rhiUxAssetCardFeedback:empty{display:none}\n.rhiUxAssetIdentity{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center;min-width:0}\n.rhiUxAssetVisual{width:72px;height:58px;display:grid;place-items:center;overflow:hidden}\n.rhiUxAssetVisual img{display:block;width:100%;height:100%;object-fit:contain}\n.rhiUxAssetIdentityCopy{min-width:0}.rhiUxAssetIdentityCopy small{display:block;color:var(--rhi-color-muted);font-size:var(--rhi-font-label);text-transform:uppercase;letter-spacing:.08em}\n.rhiUxAssetIdentityCopy h2{margin:2px 0;font-size:var(--rhi-font-section);line-height:1.12}.rhiUxAssetIdentityCopy p{margin:0;color:var(--rhi-color-muted);font-size:var(--rhi-font-body)}\n.rhiUxAssetFactGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--rhi-space-2)}\n.rhiUxAssetFact{min-width:0;padding:9px 10px;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-md);background:var(--rhi-color-surface)}\n.rhiUxAssetFact small,.rhiUxAssetFact b,.rhiUxAssetFact span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.rhiUxAssetFact small{font-size:var(--rhi-font-label);color:var(--rhi-color-muted)}.rhiUxAssetFact b{margin-top:2px;font-size:13px}.rhiUxAssetFact span{margin-top:2px;font-size:var(--rhi-font-small);color:var(--rhi-color-muted)}\n.rhiUxAssetRelationship{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 10px;border:1px solid var(--rhi-color-line-soft);border-radius:var(--rhi-radius-md);background:var(--rhi-color-surface-soft)}\n.rhiUxAssetRelationship small,.rhiUxAssetRelationship b,.rhiUxAssetRelationship span{display:block}.rhiUxAssetRelationship small,.rhiUxAssetRelationship span{color:var(--rhi-color-muted);font-size:var(--rhi-font-small)}\n.rhiUxAssetDisclosure{border-top:1px solid var(--rhi-color-line-soft);padding-top:8px}.rhiUxAssetDisclosure summary{cursor:pointer;font-weight:var(--rhi-weight-medium)}\n.rhiUxAssetDisclosure>div{padding-top:8px}\n.rhiUxWriteFeedback{margin-top:6px;font-size:var(--rhi-font-small);color:var(--rhi-color-muted)}.rhiUxWriteFeedback[data-state=\"success\"]{color:#15803D}.rhiUxWriteFeedback[data-state=\"error\"]{color:var(--rhi-color-error)}\n@media(max-width:760px){.rhiUxAssetCardShell{padding:10px}.rhiUxAssetFactGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}\n@media(max-width:430px){.rhiUxAssetCardShell{gap:var(--rhi-space-2);padding:9px}.rhiUxAssetFactGrid{grid-template-columns:1fr 1fr}}\n\n\n/* Compact asset grammar. Opt-in: existing page heroes, navigation and panels are unchanged.\n   Domains own asset facts and relationships; Core only lays out their presentation. */\n.rhiUxAssetRow{\n  display:grid;grid-template-columns:52px minmax(0,1fr) minmax(76px,max-content) auto;\n  align-items:center;gap:10px;min-width:0;padding:8px 10px;\n  border-bottom:1px solid var(--rhi-color-line-soft);\n}\n.rhiUxAssetRow:last-child{border-bottom:0}\n.rhiUxAssetImage{\n  display:flex;align-items:center;justify-content:center;width:52px;height:52px;\n  border-radius:var(--rhi-radius-sm);background:var(--rhi-color-surface-soft);overflow:hidden;\n}\n.rhiUxAssetImage img{display:block;width:100%;height:100%;object-fit:contain}\n.rhiUxAssetRowIdentity{display:grid;gap:3px;min-width:0}\n.rhiUxAssetName{font-weight:var(--rhi-weight-strong);overflow-wrap:anywhere}\n.rhiUxAssetContext,.rhiUxAssetRowRelationship{font-size:var(--rhi-font-small);color:var(--rhi-color-muted);line-height:1.25}\n.rhiUxAssetRowRelationship .rhiUxAssetRelationshipLink{color:var(--rhi-color-primary);text-decoration:underline;text-underline-offset:2px}\n.rhiUxAssetRowRelationship .rhiUxAssetRelationshipLink:focus-visible{outline:2px solid var(--rhi-color-primary);outline-offset:3px}\n.rhiUxAssetLive{display:grid;justify-items:end;gap:3px;text-align:right;min-width:76px}\n.rhiUxAssetPower{font-size:var(--rhi-font-card);font-weight:var(--rhi-weight-strong);font-variant-numeric:tabular-nums;white-space:nowrap}\n.rhiUxAssetState{font-size:var(--rhi-font-small);color:var(--rhi-color-muted)}\n.rhiUxAssetExpand{display:flex;align-items:center;justify-content:center;min-width:32px;min-height:36px}\n@media(max-width:430px){\n  .rhiUxAssetRow{grid-template-columns:42px minmax(0,1fr) minmax(64px,max-content) auto;gap:7px;padding:7px 5px}\n  .rhiUxAssetImage{width:42px;height:42px}\n  .rhiUxAssetLive{min-width:64px}\n}\n\n/* Opt-in time-series presentation: preserve domain-owned data, periods and charts. */\n.rhiUxChartPanel{min-width:0;padding:12px;border:1px solid var(--rhi-color-line);border-radius:var(--rhi-radius-lg);background:var(--rhi-color-surface)}\n.rhiUxChartHeader{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px}\n.rhiUxChartLegend{display:flex;align-items:center;gap:8px 14px;flex-wrap:wrap;font-size:var(--rhi-font-small);color:var(--rhi-color-muted)}\n.rhiUxChartViewport{width:100%;min-width:0;overflow-x:auto}\n.rhiUxChartViewport svg,.rhiUxChartViewport canvas{display:block;max-width:100%}\n.rhiUxChartEmpty{padding:20px 12px;text-align:center;color:var(--rhi-color-muted);font-size:var(--rhi-font-small)}\n@media(max-width:760px){.rhiUxChartPanel{padding:9px}.rhiUxChartHeader{align-items:flex-start}}\n";
const RHI_MM_DOMAIN_CSS=":host{display:block;min-width:0;background:#f5f7fb;color:var(--rhi-color-text);font-family:var(--rhi-font-family)}\nha-card{background:transparent;border:0;box-shadow:none;overflow:visible}\n.mm-shell{max-width:1290px;margin:auto;padding:12px 16px 20px}\n.mm-page{gap:0}.mm-page .rhiUxPageContent{margin-top:9px}\n.mm-shell .rhiUxDomainShell{margin-bottom:10px}\n.mm-shell .rhiUxPageHero{border-radius:17px}\n.mm-shell .rhiUxPageHeroArt:before{background:linear-gradient(90deg,#fff 0%,rgba(255,255,255,.94) 9%,rgba(255,255,255,.62) 28%,transparent 66%)}\n.mm-shell .rhiUxTechnicalFooter{margin:12px 0 0;opacity:.8}\n.mm-section{border:1px solid var(--rhi-color-line);border-radius:15px;padding:14px 15px;background:#fff;box-shadow:var(--rhi-shadow-md)}\n.mm-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:13px}.mm-heading h2{font-size:20px;margin:0 0 2px;font-weight:650}.mm-heading p{font-size:11px;margin:0;color:var(--rhi-color-muted)}\n.mm-room-grid,.mm-activities,.mm-diag-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}\n.mm-room-card,.mm-surface{min-width:0;background:#fff;border:1px solid #dce6f0;border-radius:14px;padding:14px;box-shadow:0 3px 10px rgba(15,35,80,.028)}\n.mm-room-head{display:flex;align-items:center;gap:10px}.mm-room-head>div{flex:1;min-width:0}.mm-room-head small,.mm-room-current small{display:block;color:#7084a1;font-weight:650;font-size:10px;letter-spacing:.08em}.mm-room-head h3{font-size:17px;margin:1px 0;font-weight:650}.mm-room-glyph,.mm-role{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:11px;background:#ecf4ff;color:#2266c3}.mm-room-glyph ha-icon{--mdc-icon-size:23px}\n.mm-phase{display:inline-flex;align-items:center;justify-content:center;font-size:10px;padding:6px 8px;white-space:nowrap;border-radius:100px;background:#f2f5f9;color:#58718d}.mm-phase-good{background:#edfaf2;color:#16864d}.mm-phase-warn{background:#fff3e8;color:#a76120}.mm-phase-idle{background:#f3f6fa;color:#68798e}\n.mm-room-current{margin:11px 0 9px;padding:10px 11px;background:#f7faff;border:1px solid #edf1f7;border-radius:9px;display:grid;gap:2px}.mm-room-current>b{font-size:15px;font-weight:650}.mm-room-current>span{color:#667891;font-size:11px}\n.mm-controls{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:10px}.mm-activity,.mm-room-foot button,.mm-room-picker button,.mm-link{display:inline-flex;align-items:center;gap:5px;background:white;border:1px solid #d9e4f2;color:#145bb1;border-radius:8px;min-height:33px;padding:5px 9px;cursor:pointer;font:inherit;font-size:11px;font-weight:600;line-height:1.25}.mm-activity ha-icon,.mm-room-foot ha-icon,.mm-link ha-icon{--mdc-icon-size:16px}.mm-activity.active,.mm-room-picker button.active{background:#eaf3ff;border-color:#b4d5ff;color:#1253a5}.mm-activity:not(:disabled):hover,.mm-link:hover,.mm-room-picker button:hover{background:#ecf4ff}.mm-activity:disabled,.mm-room-foot button:disabled{opacity:.40;cursor:not-allowed}.mm-room-foot{display:flex;gap:7px;align-items:center;margin-top:12px;border-top:1px solid #edf1f6;padding-top:11px}.mm-room-foot .mm-link{margin-left:auto}\n.mm-room-error{color:#a6352a;background:#fff5f3;border:1px solid #f4d8d3;border-radius:8px;padding:8px;font-size:11px;margin:8px 0 0;overflow-wrap:anywhere}.mm-nowplaying{display:flex;gap:7px;color:#516e91;font-size:11px;align-items:center}.mm-nowplaying ha-icon{--mdc-icon-size:17px}\n.mm-link{border:0;color:#1467f5;background:none}.mm-room-picker{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}.mm-detail-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:10px}.mm-detail-grid>div{min-width:0;display:flex;flex-direction:column;gap:10px}\n.mm-surface h3{font-size:16px;margin:0 0 13px;color:#10213d}.mm-surface>p{margin-top:9px}.mm-media-detail{display:flex;gap:12px;align-items:center}.mm-media-detail img{width:75px;height:70px;object-fit:cover;border-radius:9px}.mm-media-detail b{font-size:13px}.mm-media-detail p,.mm-media-detail small{color:#687d92;font-size:11px;margin:2px 0}.mm-audio-readback{display:flex;align-items:center;gap:8px;margin-top:11px;padding-top:9px;border-top:1px solid #edf1f5;color:#516e91;font-size:12px}\n.mm-device-list{display:grid;gap:6px}.mm-device-row{display:flex;gap:10px;align-items:center;border:1px solid #edf2f8;padding:8px;border-radius:9px}.mm-device-row>div{flex:1;min-width:0}.mm-device-row b{font-size:12px;display:block;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.mm-device-row small{font-size:10px;color:#6d829a;display:block}.mm-device-row button{border:0;background:none;color:#1467f5;cursor:pointer}.mm-device-row button ha-icon{--mdc-icon-size:17px}\n.mm-route{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #eaf0f8;padding:8px 0;font-size:11px}.mm-route span{color:#5d7591}.mm-device-table{display:grid;gap:0}.mm-table-head,.mm-table-row{display:grid;grid-template-columns:1.7fr 1.2fr 1fr .8fr;gap:12px;align-items:center;padding:11px 12px;border-bottom:1px solid #e8eff7}.mm-table-head{font-size:10px;text-transform:uppercase;letter-spacing:.04em;background:#f7faff;color:#627c9c}.mm-table-row{font-size:12px}.mm-table-row span{overflow-wrap:anywhere}\n.mm-diag-grid{align-items:start}.mm-diag-status{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid #eef3f9;font-size:11px}.mm-diag-status span{color:#5e718b}.mm-tech{font-size:10px;color:#65758b;overflow-wrap:anywhere}.mm-tech p{margin:5px 0}.mm-surface details{margin-top:11px;font-size:11px}.mm-surface summary{cursor:pointer;color:#1467f5;font-weight:600}\n.mm-callout{display:flex;align-items:flex-start;gap:12px;border:1px solid #d9e4f1;border-radius:12px;background:#fff;padding:18px}.mm-callout>ha-icon{color:#467bb8;--mdc-icon-size:28px}.mm-callout b{font-size:16px}.mm-callout p{font-size:12px;color:#61758e;margin:7px 0 0;line-height:1.5}.mm-attention{border-color:#ebd5af;background:#fffdf9}.mm-muted{color:#6e829b;font-size:11px}\n.mm-shell .rhiUxWriteFeedback{margin:0 0 11px}\n@media(max-width:1000px){.mm-room-grid,.mm-activities,.mm-diag-grid{grid-template-columns:1fr}.mm-detail-grid{grid-template-columns:1fr}}\n@media(max-width:760px){.mm-shell{padding:8px}.mm-section{padding:11px}.mm-shell .rhiUxPageHeroCopy{width:78%}.mm-room-head h3{font-size:15px}.mm-table-head,.mm-table-row{grid-template-columns:1.2fr 1fr .7fr}.mm-table-head span:last-child,.mm-table-row span:last-child{display:none}}\n@media(max-width:430px){.mm-shell .rhiUxPageHeroCopy{width:95%;padding-right:10px}.mm-activity,.mm-room-foot button{min-height:36px}.mm-room-foot{flex-wrap:wrap}.mm-room-foot .mm-link{margin-left:0}.mm-device-row .mm-phase{display:none}}\n\n.mm-native-controls{display:grid;gap:10px}.mm-native-device{display:grid;gap:8px;min-width:0;border-top:1px solid var(--rhi-color-line);padding-top:10px}.mm-native-device small{color:var(--rhi-color-muted)}.mm-native-buttons{display:flex;flex-wrap:wrap;gap:6px}.mm-native-buttons button,.mm-native-device select{min-height:36px;border:1px solid var(--rhi-color-line);border-radius:8px;background:var(--card-background-color,#fff);color:inherit;padding:6px 10px;font:inherit;max-width:100%}.mm-native-buttons button:disabled,.mm-native-device select:disabled{opacity:.5;cursor:not-allowed}.mm-native-device label{display:grid;gap:4px;font-size:12px}.mm-native-device input{max-width:100%;width:100%}.mm-native-device details{min-width:0}.mm-native-device summary{cursor:pointer;padding:6px 0}\n\n.mm-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 12px}.mm-title h2{font-size:20px;margin:0}.mm-title a{text-decoration:none}.mm-quick-controls{display:grid;gap:5px;margin-top:8px}.mm-quick-controls .mm-native-device{gap:5px}.mm-context{margin-top:10px}.mm-context-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:8px}.mm-context-item{border:1px solid var(--rhi-color-line);padding:8px;border-radius:8px;min-width:0}.mm-context-item button{min-height:44px;width:100%;border:0;border-radius:6px;background:transparent;color:inherit;text-align:left;font:inherit;font-weight:600;cursor:pointer}.mm-context-item button[aria-expanded=true]{background:#eaf3ff;color:#1253a5}.mm-context-item [data-mm-summary]{min-height:24px;overflow-wrap:anywhere;font-size:12px}.mm-context [data-mm-expanded]{margin-top:8px}.mm-room-card button,.mm-native-buttons button,.mm-native-device select,.mm-room-picker button{min-height:44px}.mm-shell button:focus-visible,.mm-shell a:focus-visible,.mm-shell input:focus-visible,.mm-shell select:focus-visible{outline:2px solid #1267be;outline-offset:2px}.mm-native-device label{font-size:13px}.mm-device-row button{min-width:44px;min-height:44px}.mm-native-device input[type=range]{min-height:44px}.mm-room-head h3,.mm-device-row b{overflow-wrap:anywhere;white-space:normal}.mm-phase{white-space:normal;text-align:center}\n\n.mm-remote{padding:2px 0}.mm-remote-navigation{display:grid;grid-template-columns:repeat(3,minmax(44px,60px));grid-template-rows:repeat(3,minmax(44px,auto));gap:6px;justify-content:center;margin:10px 0}.mm-remote-key{display:flex;min-width:0}.mm-remote-key button{width:100%;min-height:44px}.mm-remote-key-up{grid-area:1 / 2}.mm-remote-key-left{grid-area:2 / 1}.mm-remote-key-ok{grid-area:2 / 2}.mm-remote-key-right{grid-area:2 / 3}.mm-remote-key-down{grid-area:3 / 2}.mm-remote-key-extra{grid-column:span 3;justify-self:center;width:auto}.mm-remote>details{margin:5px 0 0;padding:4px 8px;background:var(--card-background-color,#fff);border:1px solid var(--rhi-color-line);border-radius:8px}.mm-remote>details summary{min-height:44px;display:flex;align-items:center}.mm-remote>details .mm-native-buttons{padding:6px 0}.mm-remote-key button:focus-visible,.mm-remote>details summary:focus-visible{outline:2px solid #1267be;outline-offset:2px}\n";
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
const RHI_MM_VIEWS = Object.freeze(['overview','rooms','activities','devices','diagnostics']);
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

function rhiMmDeviceIntent(room, key, action, value) {
  const device=room?.devices?.find(d=>d.key===key);
  const capability=device?.controls?.[action];
  if(!device?.foundation_approved||!capability?.enabled||['starting','stopping'].includes(room.phase))return null;
  if(Array.isArray(capability.options)){if(typeof value!=='string'||!capability.options.includes(value))return null;}
  else if(action==='volume'){if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1)return null;}
  else if(action==='mute'){if(typeof value!=='boolean')return null;}
  else if(value!==undefined&&value!==null)return null;
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


const RHI_MM_TEXT = {
  "en": {
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
    "room": "ROOM",
    "activity": "ACTIVITY",
    "settings": "Settings",
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
    "active_first": "Active rooms first. Switch activities without choosing individual HDMI devices.",
    "all_rooms": "All rooms",
    "no_rooms": "No rooms configured",
    "create_room": "Create a Multimedia room after Foundation technical selection.",
    "no_activity": "No activity",
    "no_activities": "No activities configured",
    "stop_activity": "Stop activity",
    "recover": "Recover",
    "details": "Details",
    "room_control": "Room control",
    "room_ownership": "Rooms are configured in Multimedia; source devices remain owned by their HA integrations.",
    "configure_room": "Configure a room in the Multimedia integration.",
    "now_playing": "Now playing",
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
    "room": "RUIMTE",
    "activity": "ACTIVITEIT",
    "settings": "Instellingen",
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
    "active_first": "Actieve ruimtes eerst. Wissel van activiteit zonder afzonderlijke HDMI-apparaten te kiezen.",
    "all_rooms": "Alle ruimtes",
    "no_rooms": "Geen ruimtes geconfigureerd",
    "create_room": "Maak een Multimedia-ruimte na de apparaatselectie in Foundation.",
    "no_activity": "Geen activiteit",
    "no_activities": "Geen activiteiten geconfigureerd",
    "stop_activity": "Stop activiteit",
    "recover": "Herstellen",
    "details": "Details",
    "room_control": "Ruimtebediening",
    "room_ownership": "Ruimtes worden in Multimedia geconfigureerd; de bronapparaten blijven eigendom van hun HA-integraties.",
    "configure_room": "Configureer een ruimte in de Multimedia-integratie.",
    "now_playing": "Speelt nu",
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
    "room": "PIÈCE",
    "activity": "ACTIVITÉ",
    "settings": "Paramètres",
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
    "active_first": "Pièces actives en premier. Changez d’activité sans sélectionner les appareils HDMI individuellement.",
    "all_rooms": "Toutes les pièces",
    "no_rooms": "Aucune pièce configurée",
    "create_room": "Créez une pièce Multimedia après la sélection technique dans Foundation.",
    "no_activity": "Aucune activité",
    "no_activities": "Aucune activité configurée",
    "stop_activity": "Arrêter l’activité",
    "recover": "Rétablir",
    "details": "Détails",
    "room_control": "Commande de la pièce",
    "room_ownership": "Les pièces sont configurées dans Multimedia ; les appareils sources restent gérés par leurs intégrations HA.",
    "configure_room": "Configurez une pièce dans l’intégration Multimedia.",
    "now_playing": "Lecture en cours",
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


// RHI Multimedia Premium: one-card native Home Assistant dashboard.
// Core owns look/feel; backend owns meaning and all physical writers.
const RHI_MM_UX_VERSION = '0.1.7';
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

})();
