// RHI UX Core 1.6.3 — build-time presentation primitives only.
// No domain semantics or Home Assistant contract/entity knowledge belongs here.
const RHI_UX_CORE_VERSION = "1.6.4";
const RHI_UX_COMPANY_LOGO_SVG = "__RHI_UX_COMPANY_LOGO_INLINE__";

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
