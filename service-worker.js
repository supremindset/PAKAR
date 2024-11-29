const CACHE_NAME = 'static-cache-v1';

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json',
        './styles.css', // Add your CSS file
        './script.js', // Add your JavaScript file
        './icon-192x192.png', // Add your icons
        './icon-512x512.png',
        './offline.html' // Add an offline fallback page
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request).catch(() => {
        return caches.match('./offline.html'); // Fallback to offline page
      });
    })
  );
});
