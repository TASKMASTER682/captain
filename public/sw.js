// The app no longer ships a service worker. Older builds registered one whose
// script was later removed, so the browser kept hitting /sw.js (404) and looping
// page reloads. This replacement script self-destructs on the next update check,
// permanently clearing the stale registration.
self.addEventListener('install', function () {
  self.skipWaiting();
  self.registration.unregister();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.registration.unregister());
});
