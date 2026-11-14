/* TESSERA offline helper (v6.121.72).
   v6.121.72: when the device itself reports no connection (Airplane Mode), go straight to the saved copy
   without trying the network — the attempt made iOS show its "Turn Off Airplane Mode" box.
   One job: keep a copy of the app page on the device so Tessera opens with no connection.
   - Online: always fetch the newest page from the network, and refresh the saved copy with it.
   - Offline (or the network gives no answer within 5 s): serve the saved copy.
   It handles ONLY this folder's own page and icon. GitHub sync calls (api.github.com) are never
   touched, and it never reads or writes project storage (localStorage / IndexedDB).
   Off switch: set OFFLINE_COPY = false in tessera.html — the page then unregisters this file
   and deletes the saved copy. */
const CACHE = "tessera-offline-v1";
const PAGE = "tessera.html";
const ASSETS = [PAGE, "apple-touch-icon.png"];
const WAIT_MS = 5000;

const keyFor = (url) => url.origin + url.pathname;   // Reload adds ?u=<time>; the saved copy ignores it
const storable = (res) => res && res.ok && res.type === "basic" && !res.redirected;

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(ASSETS.map((a) =>
        fetch(a, { cache: "no-store" }).then((res) => (storable(res) ? c.put(new URL(a, self.registration.scope).href, res) : null)).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE && n.indexOf("tessera-offline-") === 0).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (ev) => {
  const req = ev.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;                       // GitHub and everything else: untouched
  const scope = new URL(self.registration.scope);
  const rel = url.pathname.indexOf(scope.pathname) === 0 ? url.pathname.slice(scope.pathname.length) : null;
  if (rel === null || ASSETS.indexOf(rel) < 0) return;                   // only the app page and its icon
  const key = keyFor(url);
  const saved = () => caches.open(CACHE).then((c) => c.match(key));
  const net = () => fetch(req.url, { cache: "no-store", credentials: "same-origin" });

  if (self.navigator && self.navigator.onLine === false) {              // known offline: no network attempt at all
    ev.respondWith(saved().then((hit) => hit || net()));
    return;
  }

  const fromNet = net().then((res) => {
    if (storable(res)) {
      const copy = res.clone();
      ev.waitUntil(caches.open(CACHE).then((c) => c.put(key, copy)).catch(() => {}));
    }
    return res;
  });
  ev.respondWith(new Promise((resolve, reject) => {
    let done = false;
    const finish = (res) => { if (!done) { done = true; resolve(res); } };
    const timer = setTimeout(() => saved().then((hit) => { if (hit) finish(hit); }), WAIT_MS);   // slow network: use the saved copy, the fetch keeps going and refreshes it
    fromNet.then(
      (res) => {
        clearTimeout(timer);
        if (res.ok) return finish(res);
        return saved().then((hit) => finish(hit || res));                // server error: prefer the saved copy
      },
      (err) => {
        clearTimeout(timer);
        return saved().then((hit) => { if (hit) finish(hit); else if (!done) { done = true; reject(err); } });
      }
    );
    ev.waitUntil(fromNet.catch(() => {}));
  }));
});
