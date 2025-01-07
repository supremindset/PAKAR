var GHPATH = '/PAKAR';
var CACHE_NAME = 'cache-v1.20';
var urlsToCache = [
  `${GHPATH}/`, // Cache the root path
  `${GHPATH}/index.html`, // Cache your main HTML file
  // Add other resources you want to cache
  `${GHPATH}/redPin.svg`,
  // Add more URLs as needed
];

// Install event: Cache the resources
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event: Serve cached content when offline
self.addEventListener('fetch', function (event) {
  console.log('Fetch request : ' + event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        // Cache hit - return response
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }
        // Fetch from network if not in cache
        return fetch(event.request).then(
          function (networkResponse) {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response
            var responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(function (cache) {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', function (event) {
  var cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
