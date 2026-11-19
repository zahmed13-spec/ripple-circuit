import { defineConfig } from 'vitest/config';
import { createHash } from 'node:crypto';
import { validateContent } from './scripts/check-content';
import { html, siteContent } from './src/content';
export default defineConfig({
 base: process.env.BASE_PATH || "/",
 plugins:[{name:'offline-cache',
 transformIndexHtml(htmlSource){
  return htmlSource.replace(/<title>[^<]*<\/title>/,()=>'<title>'+html(siteContent.title)+'</title>')
   .replace(/(name="description" content=")[^"]*/,(_match,prefix)=>prefix+html(siteContent.description));
 },
 buildStart(){if(process.env.NODE_ENV==='production')validateContent();},generateBundle(_options,bundle){this.emitFile({type:'asset',fileName:'version.json',source:JSON.stringify({release:'5.0',revision:process.env.GITHUB_SHA||process.env.RELEASE_SHA||'local'})});const names=Object.keys(bundle);const version=createHash('sha256').update('cache-policy-3|'+names.join('|')).digest('hex').slice(0,12);this.emitFile({type:'asset',fileName:'sw.js',source:`const CACHE='ripple-${version}';const FILES=${JSON.stringify(['./','./index.html','./icon.svg','./assets/aero-world.svg',...names.map(n=>'./'+n)])};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('ripple-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith((async()=>{const cached=await caches.match(e.request.url,{ignoreVary:true});if(cached&&e.request.mode!=='navigate')return cached;try{return await fetch(e.request);}catch{return cached||(e.request.mode==='navigate'?await caches.match('./index.html'):Response.error());}})());});`});}}],
 test:{include:['tests/**/*.test.ts'],environment:'node'}
});
