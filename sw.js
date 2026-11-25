const CACHE='dp-der-shell-v22-performance';
const FILES=['./','./index.html','./base.css','./style.css?v=3-historico','./access.css?v=1','./access-config.js?v=1','./access.js?v=3-central','./cloud.js?v=2-performance','./app.js?v=15-km','./calc.js','./measurement.js?v=1','./install.js?v=2','./manifest.webmanifest','./icon-192.png','./icon-512.png','./logo-der.jpg','./tpu.json','./vendor/xlsx.full.min.js','./vendor/pdf-lib.min.js','./summary-pdf.js?v=5-sei-evento','./history.js?v=7-sei-evento','./report-pdf.js?v=7-sei-evento'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(path=>new Request(path,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('dp-der-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
/* Only public application assets use the cache. Authenticated API requests bypass it. */
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(new URL('./',self.location).pathname))return;
 if(event.request.mode==='navigate'){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE);
   try{const response=await fetch(event.request,{cache:'no-cache',signal:AbortSignal.timeout(4000)});if(response.ok){await cache.put('./index.html',response.clone());return response}}catch{}
   return (await cache.match('./index.html'))||Response.error();
  })());return;
 }
 if(!FILES.some(path=>new URL(path,self.location).href===url.href))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),stored=await cache.match(event.request);
  if(stored)return stored;
  const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;
 })());
});
