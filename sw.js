/* Royal Ace Blackjack — service worker
   Stratégie: network-first pour le HTML (les mises à jour de code arrivent toujours),
   cache-first pour les assets statiques (icônes, manifest, polices). */
const CACHE='royal-ace-v2';
const ASSETS=['./','./index.html','./manifest.json','./icon-180.png','./icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
  )).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  const isHTML=req.mode==='navigate'||req.destination==='document'||
               req.url.endsWith('/')||req.url.endsWith('index.html');
  if(isHTML){
    /* network-first : on tente le réseau, fallback cache si hors-ligne */
    e.respondWith(
      fetch(req).then(res=>{
        const clone=res.clone();
        caches.open(CACHE).then(c=>c.put('./index.html',clone));
        return res;
      }).catch(()=>caches.match('./index.html').then(r=>r||caches.match('./')))
    );
    return;
  }
  /* cache-first pour le reste */
  e.respondWith(
    caches.match(req).then(hit=>{
      if(hit)return hit;
      return fetch(req).then(res=>{
        const url=req.url;
        if(res.ok&&(url.startsWith(self.location.origin)||url.includes('fonts.g'))){
          const clone=res.clone();
          caches.open(CACHE).then(c=>c.put(req,clone));
        }
        return res;
      }).catch(()=>caches.match('./index.html'));
    })
  );
});
