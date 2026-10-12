const CACHE='ffm-trip-v5';
const TILES='ffm-tiles-v2';
const CORE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png','leaflet/leaflet.js','leaflet/leaflet.css'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==TILES).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET')return;
  const url=new URL(req.url);
  const isPage=req.mode==='navigate'||url.pathname.endsWith('index.html');
  if(isPage){
    // network first so plan updates show up, cache as offline fallback
    e.respondWith(fetch(req.url,{cache:'no-cache'}).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put('index.html',cp));return r;}).catch(()=>caches.match('index.html')));
    return;
  }
  const isTile=url.hostname.endsWith('tile.openstreetmap.org');
  const bucket=isTile?TILES:CACHE;
  // cache first for map tiles, the map library, icons and fonts
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{
    if(r.ok||r.type==='opaque'){const cp=r.clone();caches.open(bucket).then(c=>c.put(req,cp));}
    return r;
  })));
});
