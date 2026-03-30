const CACHE_NAME = 'fc-admin-v1';
const PRECACHE_URLS = ['/admin', '/admin/agenda', '/admin/galeria', '/admin/definicoes'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // Network first for API calls
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else {
    // Cache first for static assets
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'Nova Marcação — FC Admin';
  const options = {
    body: data.body || `${data.clienteNome || 'Cliente'} — ${data.servicoNome || 'Serviço'}`,
    icon: '/icons/admin-icon-192.png',
    badge: '/icons/admin-icon-192.png',
    tag: 'nova-marcacao',
    data: { url: data.url || '/admin/agenda' },
    actions: [
      { action: 'ver', title: 'Ver Marcação' },
      { action: 'fechar', title: 'Fechar' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'fechar') return;
  const url = event.notification.data?.url || '/admin/agenda';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-marcacoes') {
    event.waitUntil(
      // Background sync placeholder — process queued offline operations
      self.registration.sync
        ? Promise.resolve()
        : Promise.resolve()
    );
  }
});
