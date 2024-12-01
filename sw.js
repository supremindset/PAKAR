// configuration options
self.VERSION = 14; // increase number to update the service worker itself (not the assets, they are controlled in the "activate" section)
//self.VERSION = Date.now(); // only for debugging reasons(!)
let CACHE_NAME = 'UniqueName'+self.VERSION;
let SUBFOLDER = 'app';

// if you really need to import external scripts, you can do something like
//self.importScripts('idb-keyval.js'); // copy https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/umd.js to idb-keyval.js

self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            // open cache
            let cache = await caches.open(CACHE_NAME);
            // add assets to cache on installation
            // this has nothing to do with caching assets
            // this is done below in the cached section of the fetch listener
            let assets = [
                // manifest should also be cached
                '/manifest.json',
                // icons should also be cached
                '/icon192.png',
                '/icon256.png',
                // all other static assets
                '/style.css',
                '/script.js',
                '/index.html',
                // this is needed also
                '/'
            ];
            cache.addAll(assets.map(assets__value => '/'+SUBFOLDER+assets__value));
            // add offline page (only if you follow the offline-strategy in the fetch event listener)
            await cache.add(new Request('offline.html', { cache: 'reload' }));
        })()
    );

    // replace old service worker
    self.skipWaiting();
});

// this is run *NOT* on every page reload(!)
self.addEventListener('activate', (event) => {
    // new feature: navigation preload
    event.waitUntil(
        (async () => {
            if ('navigationPreload' in self.registration) {
                await self.registration.navigationPreload.enable();
            }
        })()
    );

    // tell the active service worker to take control of the page immediately
    self.clients.claim();
});

// intercept fetch calls
// be aware: this also catches static requests and also the initial page request
self.addEventListener('fetch', (event) => {

    // only handle GET requests (never POST, since we want to always do this in the frontend, because we don't want to mess with Requests/Responses)
    if (event.request.method !== 'GET') {
        return;
    }

    // exclude certain dynamic routes from caching (we want to handle the error in the client javascript, not here
    else if (event.request.url.match(/\/api\.php$/)) {
        return false;
    }
  
    // skip chrome extensions
    if (!(event.request.url.indexOf('http') === 0)) {
        return;
    }
  
    // SPA strategy: always serve shell index when offline (ignoring GET URL parameters)
    if (event.request.mode === 'navigate' && event.request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            (async () => {
                try {
                    let preloadResponse = await event.preloadResponse;
                    if (preloadResponse) {
                        return preloadResponse;
                    }
                    let networkResponse = await fetch(event.request);
                    return networkResponse;
                } catch (error) {
                    let cache = await caches.open(CACHE_NAME);
                    let cachedResponse = await cache.match('/' + SUBFOLDER + '/index.html', { ignoreSearch: true });
                    return cachedResponse;
                }
            })()
        );
    }

    // GET strategy: network first, always update cache, cache fallback
    else {
        event.respondWith(
          (async () => {
              try {
                  let response = await fetch(event.request),
                      cache = await caches.open(CACHE_NAME);
                  cache.put(event.request, response.clone());
                  return response;
              } catch (err) {
                  let response = caches.match(event.request);
                  return response;
              }
          })()
        );
    }
  
    // different strategy: always serve offline page
    else if (event.request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    // try navigation preload
                    let preloadResponse = await event.preloadResponse;
                    if (preloadResponse) {
                       return preloadResponse;
                    }
                    // try network
                    let networkResponse = await fetch(event.request);
                    return networkResponse;
                }
                catch (error) {
                    // if exception (network error), return offline page
                    let cache = await caches.open(CACHE_NAME);
                    let cachedResponse = await cache.match(OFFLINE_URL);
                    return cachedResponse;
                }
            })()
        );
    }

});

// helper to fetch variables from the service worker
self.addEventListener('message', (event) => {
    if (event.data.type === 'request-val') {
        self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
                client.postMessage({ type: 'receive-val', key: event.data.key, value: self[event.data.key] });
            });
        });
    }
});
