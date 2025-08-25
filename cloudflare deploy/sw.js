// Service Worker for NexusRank Pro
// Basic offline functionality

const CACHE_NAME = 'nexusrank-pro-v1.0';
const urlsToCache = [
    '/',
    '/css/style.css',
    '/js/app.js',
    '/index.html'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});