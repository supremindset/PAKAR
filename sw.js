var GHPATH = '/PAKAR';
var APP_PREFIX = 'gppwa_';
var VERSION = 'version_002';
var URLS = [    
  `${GHPATH}/`,
  `${GHPATH}/index.html`,
  `${GHPATH}/css/styles.css`,
  `${GHPATH}/Papirus-Team-Papirus-Apps-NoMachine-icon.256.png`,
  `${GHPATH}/js/app.js`
];

var CACHE_NAME = APP_PREFIX + VERSION;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Installing cache : ' + CACHE_NAME);
      return cache.addAll(URLS);
    }).catch((error) => {
      console.error('Failed to cache resources during install:', error);
    })
  );
});

self.addEventListener('fetch', (e) => {
  console.log('Fetch request : ' + e.request.url);
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('Responding with cache : ' + e.request.url);
        return cachedResponse;
      } else {
        console.log('File is not cached, fetching : ' + e.request.url);
        return fetch(e.request).catch((error) => {
          console.error('Fetch failed:', error);
          throw error;
        });
      }
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      let cacheWhitelist = keyList.filter((key) => key.indexOf(APP_PREFIX) !== -1);
      cacheWhitelist.push(CACHE_NAME);
      return Promise.all(keyList.map((key, i) => {
        if (cacheWhitelist.indexOf(key) === -1) {
          console.log('Deleting cache : ' + keyList[i]);
          return caches.delete(keyList[i]);
        }
      }));
    })
  );
});
