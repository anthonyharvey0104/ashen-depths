/* Ashen Depths service worker
 * Small site files are precached atomically (cache.addAll). Large files such as
 * area music and other larger files are cached separately with retries, so a flaky first load
 * of a large file never fails the install. Large fetches never block skipWaiting. Anything still missing is cached
 * the first time it loads successfully, and on activate the previous cache's
 * copy is kept as an offline fallback. Relative URLs resolve against this
 * script, so the app works at a GitHub Pages subpath as well as at a domain root.
 */
const CACHE_NAME = 'ashen-depths-4418b82145f2';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.png',
  './apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './ashen-depths-64.html',
  './dungeon.html',
  './ashen-depths-fp.html',
  './assets/manifest.json',
  './assets/three.js',
  './assets/key_art.webp'
];
const LARGE_URLS = [
  './assets/audio/v43/music_cave.mp3',
  './assets/audio/v43/music_dungeon_ashkar.mp3',
  './assets/audio/v43/music_dungeon_hollow.mp3',
  './assets/audio/v43/music_dungeon_isolde.mp3',
  './assets/audio/v43/music_dungeon_morgana.mp3',
  './assets/audio/v43/music_dungeon_vesper.mp3',
  './assets/audio/v43/music_overworld.mp3',
  './assets/audio/v43/music_town.mp3',
  './assets/audio/v43/amb_cave.mp3',
  './assets/audio/v43/amb_dungeon.mp3',
  './assets/audio/v43/amb_overworld.mp3',
  './assets/audio/v43/amb_town.mp3'
];

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function withTimeout(p, ms) {
  return new Promise(function (resolve, reject) {
    var t = setTimeout(function () { reject(new Error('timeout')); }, ms);
    p.then(function (v) { clearTimeout(t); resolve(v); }, function (e) { clearTimeout(t); reject(e); });
  });
}

function fetchTimeout(request, ms) {
  return withTimeout(fetch(request), ms || 8000);
}

function cacheWithRetry(cache, url, tries) {
  tries = tries || 4;
  var attempt = 0;
  function go() {
    attempt++;
    return fetchTimeout(new Request(url, { cache: 'reload' }), 8000).then(function (res) {
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
      // Small files only; do not block install / skipWaiting on large music/amb fetches.
      return withTimeout(cache.addAll(PRECACHE_URLS), 12000).catch(function () {
        return Promise.all(PRECACHE_URLS.map(function (url) {
          return cacheWithRetry(cache, url, 2).then(function () { return true; }, function () { return false; });
        }));
      }).then(function () {
        cacheLarge(cache);  // kicked off here, awaited on activate
        return self.skipWaiting();
      });
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
  var isNav = event.request.mode === 'navigate';
  event.respondWith(
    caches.open(CACHE_NAME).then(function (cache) {
      var fromNet = function (ms) {
        return fetchTimeout(event.request, ms || 8000).then(function (response) {
          if (sameOrigin && response && response.ok && response.type === 'basic') {
            var copy = response.clone();
            event.waitUntil(cache.put(event.request, copy).catch(function () {}));
          }
          return response;
        });
      };
      if (isNav) {
        // Network-first for documents so a visit after a deploy can pick up the new build.
        // A short timeout prevents a hung navigation fetch from blocking the title.
        return fromNet(4000).catch(function () {
          return cache.match(event.request, { ignoreSearch: true }).then(function (cached) {
            if (cached) return cached;
            return cache.match('./index.html').then(function (idx) {
              return idx || cache.match('./ashen-depths-64.html');
            });
          }).then(function (any) { return any || Response.error(); });
        });
      }
      return cache.match(event.request, { ignoreSearch: true }).then(function (cached) {
        if (cached) return cached;
        return fromNet().catch(function () {
          return caches.match(event.request, { ignoreSearch: true }).then(function (any) {
            if (any) return any;
            return Response.error();
          });
        });
      });
    })
  );
});
