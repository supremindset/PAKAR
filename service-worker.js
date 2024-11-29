self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('static-cache').then(function(cache) {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json',
        './style.css',
        './script.js',
        // Add other assets you need to cache
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
