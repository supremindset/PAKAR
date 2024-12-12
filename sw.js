var GHPATH = '/PAKAR';

self.addEventListener('fetch', function (e) {
  console.log('Fetch request : ' + e.request.url);
  e.respondWith(
    fetch(e.request)
  );
});
