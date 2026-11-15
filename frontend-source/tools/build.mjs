import {readFileSync,existsSync,mkdirSync,writeFileSync,rmSync,readdirSync,copyFileSync,statSync} from 'node:fs';
import {resolve,dirname,relative,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(ROOT,p),'utf8');
const parse=p=>JSON.parse(read(p));
const hash=b=>createHash('sha256').update(b).digest('hex');
export const VERSION=parse('../custom_components/rhi_multimedia/manifest.json').version;

function walk(dir){return existsSync(dir)?readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(join(dir,x.name)):[join(dir,x.name)]).sort():[];}

export function assemble(){
  const spec=parse('src/manifest.json');
  const vendor=parse('src/vendor/RHI_UX_CORE.json');
  if(vendor.version!=='1.6.4'||!read('src/runtime/multimedia-gateway.js').includes('RHI_MULTIMEDIA_EXPERIENCE_V1'))throw Error('source ownership/contract version drift');
  const logo=read('src/assets/branding/company-logo.svg');
  if(!logo.includes('Robotix.be')||!logo.includes('#0B4C86'))throw Error('Canonical Robotix company SVG missing or invalid');
  const modules=spec.modules;
  if(!Array.isArray(modules)||modules.length<4||modules[0]!=='vendor/rhi-ux-core.js')throw Error('Canonical module order missing');
  const coreCSS=read('src/vendor/rhi-ux-core-tokens.css')+'\n'+read('src/vendor/rhi-ux-core-primitives.css');
  const styles=read('src/ui/styles.css');
  const js=modules.map(file=>{
    const input=read('src/'+file);
    if(file==='vendor/rhi-ux-core.js'){
      if(!input.includes('"__RHI_UX_COMPANY_LOGO_INLINE__"'))throw Error('Pinned UX Core logo injection point drift');
      return input.replace('"__RHI_UX_COMPANY_LOGO_INLINE__"',JSON.stringify(logo));
    }
    return input.replaceAll('__RHI_MM_UX_VERSION__',VERSION);
  });
  const bundle=`/* Robotix Home Intelligence Multimedia UX v${VERSION}; canonical RHI UX Core ${vendor.version} */\n(()=>{\n'use strict';\nconst RHI_MM_CORE_CSS=${JSON.stringify(coreCSS)};\nconst RHI_MM_DOMAIN_CSS=${JSON.stringify(styles)};\n${js.join('\n\n')}\n})();\n`;
  const result=new Map();
  result.set('rhi-multimedia-ux.js',Buffer.from(bundle,'utf8'));
  result.set('rhi-multimedia-ux.js.sha256',Buffer.from(`${hash(Buffer.from(bundle))}  rhi-multimedia-ux.js\n`));
  for(const file of walk(resolve(ROOT,'src/assets'))){
    const path='assets/'+relative(resolve(ROOT,'src/assets'),file).replaceAll('\\','/');
    result.set(path,readFileSync(file));
  }
  const entries=[...result].map(([path,contents])=>({path,size:contents.length,bytes:contents.length,sha256:hash(contents)})).sort((a,b)=>a.path.localeCompare(b.path));
  result.set('PACKAGE_MANIFEST.json',Buffer.from(JSON.stringify({schema_version:1,product:'rhi_multimedia',version:VERSION,bundle_filename:'rhi-multimedia-ux.js',runtime_sha256:hash(result.get('rhi-multimedia-ux.js')),core_version:vendor.version,files:entries},null,2)+'\n'));
  return result;
}

export function build(){
  const dist=resolve(ROOT,'dist');rmSync(dist,{recursive:true,force:true});mkdirSync(dist,{recursive:true});
  for(const [path,data] of assemble()){
    const target=resolve(dist,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,data);
  }
  return dist;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(build());
