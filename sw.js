/* Ashen Depths service worker
 * Small site files are precached atomically (cache.addAll). Large files such as
 * the ~2 MB v3 game are cached separately with retries, so a flaky first load
 * of the big file never fails the install. Anything still missing is cached
 * the first time it loads successfully, and on activate the previous cache's
 * copy is kept as an offline fallback. Relative URLs resolve against this
 * script, so the app works at a GitHub Pages subpath as well as at a domain root.
 */
const CACHE_NAME = 'ashen-depths-a653eac00edd';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.png',
  './apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './dungeon.html',
  './ashen-depths-fp.html'
];
const LARGE_URLS = [
  './ashen-depths-64.html'
];

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function cacheWithRetry(cache, url, tries) {
  tries = tries || 4;
  var attempt = 0;
  function go() {
    attempt++;
    return fetch(new Request(url, { cache: 'reload' })).then(function (res) {
      if (!res || !res.ok) throw new Error('HTTP ' + (res && res.status));
      return cache.put(url, res);
    }).catch(function (err) {
      if (attempt >= tries) throw err;
      return sleep(800 * Math.pow(2, attempt - 1)).then(go);   // 0.8s, 1.6s, 3.2s
    });
  }
  return go();
}

function cacheLarge(cache) {
  return Promise.all(LARGE_URLS.map(function (url) {
    return cache.match(url).then(function (hit) {
      if (hit) return true;
      return cacheWithRetry(cache, url).then(function () { return true; }, function () { return false; });
    });
  }));
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // all-or-nothing for the small files only
      return cache.addAll(PRECACHE_URLS).then(function () {
        return cacheLarge(cache);          // never rejects; missing files are retried later
      });
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cacheLarge(cache).then(function (ok) {
        // If a large file still couldn't be fetched, keep the previous version's copy for offline play.
        return Promise.all(LARGE_URLS.map(function (url, i) {
          if (ok[i]) return null;
          return caches.match(url).then(function (old) { return old ? cache.put(url, old) : null; });
        }));
      });
    }).then(function () {
      return caches.keys();
    }).then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return key !== CACHE_NAME && key.indexOf('ashen-depths-') === 0;
      }).map(function (key) {
        return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  var sameOrigin = new URL(event.request.url).origin === self.location.origin;
  event.respondWith(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.match(event.request, { ignoreSearch: true }).then(function (cached) {
        if (cached) return cached;
        return fetch(event.request).then(function (response) {
          // runtime-cache same-origin files that missed precache (e.g. v3 after a flaky install)
          if (sameOrigin && response && response.ok && response.type === 'basic') {
            var copy = response.clone();
            event.waitUntil(cache.put(event.request, copy).catch(function () {}));
          }
          return response;
        }).catch(function () {
          return caches.match(event.request, { ignoreSearch: true }).then(function (any) {
            if (any) return any;
            if (event.request.mode === 'navigate') return cache.match('./index.html');
            return Response.error();
          });
        });
      });
    })
  );
});
