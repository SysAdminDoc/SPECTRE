/* ============================================
   SPECTRE - Service Worker
   Version: 2.1.0
   
   PWA support with:
   - Offline caching
   - Background sync
   - Push notifications (future)
   - Cache-first strategy for assets
   - Network-first for API calls
   ============================================ */

const CACHE_NAME = 'spectre-v2.1.0';
const STATIC_CACHE = 'spectre-static-v2.1.0';
const DYNAMIC_CACHE = 'spectre-dynamic-v2.1.0';

// Files to cache immediately on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    
    // CSS
    '/css/variables.css',
    '/css/base.css',
    '/css/components.css',
    '/css/layout.css',
    '/css/utilities.css',
    
    // Core JS
    '/js/tools-db.js',
    '/js/utils.js',
    '/js/storage.js',
    '/js/ui.js',
    '/js/export.js',
    '/js/app.js',
    '/js/init.js',
    
    // Enhanced modules
    '/js/case-manager.js',
    '/js/custom-tools.js',
    '/js/url-state.js',
    '/js/api-integrations.js',
    '/js/workflows.js',
    '/js/smart-suggestions.js',
    '/js/command-palette.js',
    '/js/bulk-processing.js',
    '/js/workspace.js',
    '/js/pwa.js',
    
    // Fonts (from Google Fonts - we'll cache them when fetched)
    // Icons will be generated/added later
];

// External resources to cache when fetched
const CACHEABLE_EXTERNAL = [
    'fonts.googleapis.com',
    'fonts.gstatic.com'
];

// API endpoints that should use network-first
const NETWORK_FIRST_PATTERNS = [
    /api\.anthropic\.com/,
    /emailrep\.io/,
    /ipinfo\.io/,
    /crt\.sh/,
    /haveibeenpwned\.com/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS.filter(url => !url.startsWith('http')));
            })
            .then(() => {
                console.log('[SW] Static assets cached');
                return self.skipWaiting();
            })
            .catch((err) => {
                console.error('[SW] Install failed:', err);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) return;

    // Skip cross-origin requests that aren't cacheable
    const isCacheableExternal = CACHEABLE_EXTERNAL.some(domain => url.hostname.includes(domain));
    const isSameOrigin = url.origin === self.location.origin;
    
    if (!isSameOrigin && !isCacheableExternal) return;

    // Check if this is an API request (network-first)
    const isNetworkFirst = NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.href));

    if (isNetworkFirst) {
        event.respondWith(networkFirst(request));
    } else {
        event.respondWith(cacheFirst(request));
    }
});

/**
 * Cache-first strategy
 * Try cache, fall back to network, cache the response
 */
async function cacheFirst(request) {
    const cached = await caches.match(request);
    
    if (cached) {
        // Return cached version but also update cache in background
        updateCache(request);
        return cached;
    }

    try {
        const response = await fetch(request);
        
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (err) {
        // Return offline page if available
        const offlineResponse = await caches.match('/offline.html');
        if (offlineResponse) return offlineResponse;
        
        // Otherwise return a basic offline response
        return new Response('Offline - Please check your connection', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

/**
 * Network-first strategy
 * Try network, fall back to cache
 */
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        
        return new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Update cache in background (stale-while-revalidate)
 */
async function updateCache(request) {
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response);
        }
    } catch (err) {
        // Silently fail - we already returned cached version
    }
}

// Message handling for manual cache control
self.addEventListener('message', (event) => {
    const { type, payload } = event.data || {};

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0]?.postMessage({ success: true });
            });
            break;
            
        case 'CACHE_URLS':
            cacheUrls(payload.urls).then(() => {
                event.ports[0]?.postMessage({ success: true });
            });
            break;
            
        case 'GET_CACHE_SIZE':
            getCacheSize().then((size) => {
                event.ports[0]?.postMessage({ size });
            });
            break;
    }
});

/**
 * Clear all caches
 */
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[SW] All caches cleared');
}

/**
 * Cache specific URLs
 */
async function cacheUrls(urls) {
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.addAll(urls);
    console.log('[SW] URLs cached:', urls.length);
}

/**
 * Get total cache size
 */
async function getCacheSize() {
    if (!navigator.storage || !navigator.storage.estimate) {
        return null;
    }
    
    const estimate = await navigator.storage.estimate();
    return {
        usage: estimate.usage,
        quota: estimate.quota,
        percent: Math.round((estimate.usage / estimate.quota) * 100)
    };
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
    
    if (event.tag === 'sync-cases') {
        event.waitUntil(syncCases());
    }
});

/**
 * Sync cases when back online
 */
async function syncCases() {
    // This would sync case data with a backend if we had one
    console.log('[SW] Syncing cases...');
    
    // Notify all clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({ type: 'SYNC_COMPLETE', tag: 'cases' });
    });
}

// Push notification handling (for future use)
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    
    const options = {
        body: data.body || 'New notification from SPECTRE',
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        vibrate: [100, 50, 100],
        data: data.data || {},
        actions: data.actions || []
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'SPECTRE', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clients) => {
                // Check if already open
                for (const client of clients) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window
                return self.clients.openWindow(urlToOpen);
            })
    );
});

console.log('[SW] Service Worker loaded');
