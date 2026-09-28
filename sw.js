// Biblioteca: cada página que abres se guarda en el dispositivo para poder leerla sin conexión.
// Con conexión siempre se pide la versión nueva a la red, así los libros nuevos aparecen al momento.
const ALMACEN = 'biblioteca-v1';

const sinConexion = () => new Response(`<!doctype html>
<html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sin conexión</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; padding: 48px 20px; font: 18px/1.5 system-ui, sans-serif; background: #edf0f2; color: #1b2330; }
  @media (prefers-color-scheme: dark) { body { background: #14181d; color: #e7eaee; } }
  main { max-width: 32rem; margin: auto; }
  a { color: inherit; }
</style>
<main>
  <h1>Sin conexión</h1>
  <p>Esta página todavía no está guardada en este dispositivo. Los libros que ya abriste antes se pueden leer sin internet.</p>
  <p><a href="${self.registration.scope}">Volver a la biblioteca</a></p>
</main>
</html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', ev => ev.waitUntil((async () => {
  for (const nombre of await caches.keys()) if (nombre !== ALMACEN) await caches.delete(nombre);
  await self.clients.claim();
})()));

self.addEventListener('fetch', ev => {
  const pet = ev.request;
  if (pet.method !== 'GET' || new URL(pet.url).origin !== self.location.origin) return;
  ev.respondWith((async () => {
    try {
      const resp = await fetch(pet);
      if (resp.ok && resp.type === 'basic') {
        const copia = resp.clone();
        ev.waitUntil(caches.open(ALMACEN).then(c => c.put(pet, copia)));
      }
      return resp;
    } catch (fallo) {
      const url = pet.url.split('#')[0];
      const otra = url.endsWith('/') ? url + 'index.html' : url.endsWith('/index.html') ? url.slice(0, -'index.html'.length) : null;
      const guardada = await caches.match(pet, { ignoreSearch: true }) || (otra && await caches.match(otra, { ignoreSearch: true }));
      if (guardada) return guardada;
      if (pet.mode === 'navigate') return sinConexion();
      throw fallo;
    }
  })());
});
