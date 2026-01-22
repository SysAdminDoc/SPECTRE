/* ============================================
   SPECTRE - PWA Module
   Version: 2.1.0
   
   Progressive Web App support:
   - Service Worker registration
   - Install prompt handling
   - Update notifications
   - Offline detection
   - Cache management UI
   
   Dependencies: ui.js
   ============================================ */

const SPECTRE_PWA = {

    // State
    state: {
        deferredPrompt: null,
        isInstalled: false,
        isOnline: navigator.onLine,
        swRegistration: null,
        updateAvailable: false
    },

    /**
     * Initialize PWA features
     */
    init() {
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupOnlineOfflineDetection();
        this.checkIfInstalled();
        this.injectStyles();
        console.log('[SPECTRE] PWA module initialized');
    },

    /**
     * Register Service Worker
     */
    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.log('[PWA] Service Workers not supported');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            
            this.state.swRegistration = registration;
            console.log('[PWA] Service Worker registered:', registration.scope);

            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.state.updateAvailable = true;
                        this.showUpdateNotification();
                    }
                });
            });

            // Handle messages from SW
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleSWMessage(event.data);
            });

            // Check for waiting worker (update available)
            if (registration.waiting) {
                this.state.updateAvailable = true;
                this.showUpdateNotification();
            }

        } catch (err) {
            console.error('[PWA] Service Worker registration failed:', err);
        }
    },

    /**
     * Handle Service Worker messages
     */
    handleSWMessage(data) {
        switch (data.type) {
            case 'SYNC_COMPLETE':
                SPECTRE_UI?.toast('Data synced successfully', 'success');
                break;
            case 'CACHE_UPDATED':
                console.log('[PWA] Cache updated');
                break;
        }
    },

    /**
     * Setup install prompt capture
     */
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.state.deferredPrompt = e;
            this.showInstallButton();
            console.log('[PWA] Install prompt captured');
        });

        window.addEventListener('appinstalled', () => {
            this.state.isInstalled = true;
            this.state.deferredPrompt = null;
            this.hideInstallButton();
            SPECTRE_UI?.toast('SPECTRE installed successfully! 🎉', 'success');
            console.log('[PWA] App installed');
        });
    },

    /**
     * Setup online/offline detection
     */
    setupOnlineOfflineDetection() {
        window.addEventListener('online', () => {
            this.state.isOnline = true;
            this.hideOfflineBanner();
            SPECTRE_UI?.toast('Back online', 'success');
            
            // Trigger background sync if supported
            if (this.state.swRegistration && 'sync' in this.state.swRegistration) {
                this.state.swRegistration.sync.register('sync-cases');
            }
        });

        window.addEventListener('offline', () => {
            this.state.isOnline = false;
            this.showOfflineBanner();
            SPECTRE_UI?.toast('You are offline. Some features may be limited.', 'warning');
        });

        // Initial check
        if (!navigator.onLine) {
            this.showOfflineBanner();
        }
    },

    /**
     * Check if app is already installed
     */
    checkIfInstalled() {
        // Check display mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.state.isInstalled = true;
            console.log('[PWA] Running in standalone mode (installed)');
        }

        // Check iOS standalone
        if (window.navigator.standalone === true) {
            this.state.isInstalled = true;
            console.log('[PWA] Running as iOS PWA');
        }
    },

    /**
     * Inject CSS styles
     */
    injectStyles() {
        if (document.getElementById('spectre-pwa-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'spectre-pwa-styles';
        style.textContent = `
            .pwa-install-banner {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--bg-secondary);
                border: 1px solid var(--border-default);
                border-radius: 12px;
                padding: 1rem 1.5rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                z-index: 9000;
                max-width: 90%;
                animation: slideUp 0.3s ease;
            }
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            .pwa-install-icon {
                font-size: 2rem;
            }
            .pwa-install-content {
                flex: 1;
            }
            .pwa-install-title {
                font-weight: 600;
                margin-bottom: 0.25rem;
            }
            .pwa-install-desc {
                font-size: 0.85rem;
                color: var(--text-secondary);
            }
            .pwa-install-actions {
                display: flex;
                gap: 0.5rem;
            }
            .pwa-install-btn {
                padding: 0.5rem 1rem;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.15s ease;
            }
            .pwa-install-btn.primary {
                background: var(--accent-primary);
                color: white;
            }
            .pwa-install-btn.primary:hover {
                background: var(--accent-secondary);
            }
            .pwa-install-btn.secondary {
                background: var(--bg-tertiary);
                color: var(--text-secondary);
            }
            .pwa-install-btn.secondary:hover {
                background: var(--bg-hover);
            }
            .pwa-offline-banner {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: var(--accent-amber);
                color: #000;
                padding: 0.5rem;
                text-align: center;
                font-size: 0.85rem;
                font-weight: 500;
                z-index: 10000;
                display: none;
            }
            .pwa-offline-banner.visible {
                display: block;
            }
            .pwa-update-banner {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: var(--bg-secondary);
                border: 1px solid var(--accent-primary);
                border-radius: 8px;
                padding: 1rem;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                z-index: 9000;
                max-width: 300px;
                animation: slideIn 0.3s ease;
            }
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            .pwa-cache-stats {
                background: var(--bg-tertiary);
                border-radius: 8px;
                padding: 1rem;
                margin-top: 1rem;
            }
            .pwa-cache-bar {
                height: 8px;
                background: var(--bg-secondary);
                border-radius: 4px;
                overflow: hidden;
                margin: 0.5rem 0;
            }
            .pwa-cache-fill {
                height: 100%;
                background: var(--accent-primary);
                transition: width 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Show install button/banner
     */
    showInstallButton() {
        if (this.state.isInstalled) return;
        
        // Remove existing banner if any
        this.hideInstallButton();

        const banner = document.createElement('div');
        banner.id = 'pwaInstallBanner';
        banner.className = 'pwa-install-banner';
        banner.innerHTML = `
            <span class="pwa-install-icon">👁️</span>
            <div class="pwa-install-content">
                <div class="pwa-install-title">Install SPECTRE</div>
                <div class="pwa-install-desc">Add to your home screen for quick access and offline use</div>
            </div>
            <div class="pwa-install-actions">
                <button class="pwa-install-btn secondary" onclick="SPECTRE_PWA.hideInstallButton()">Later</button>
                <button class="pwa-install-btn primary" onclick="SPECTRE_PWA.promptInstall()">Install</button>
            </div>
        `;
        document.body.appendChild(banner);
    },

    /**
     * Hide install button
     */
    hideInstallButton() {
        const banner = document.getElementById('pwaInstallBanner');
        if (banner) {
            banner.remove();
        }
    },

    /**
     * Prompt user to install
     */
    async promptInstall() {
        if (!this.state.deferredPrompt) {
            SPECTRE_UI?.toast('Install not available', 'warning');
            return;
        }

        this.state.deferredPrompt.prompt();
        
        const { outcome } = await this.state.deferredPrompt.userChoice;
        
        console.log('[PWA] Install prompt outcome:', outcome);
        
        if (outcome === 'accepted') {
            SPECTRE_UI?.toast('Installing SPECTRE...', 'info');
        }
        
        this.state.deferredPrompt = null;
        this.hideInstallButton();
    },

    /**
     * Show offline banner
     */
    showOfflineBanner() {
        let banner = document.getElementById('pwaOfflineBanner');
        
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'pwaOfflineBanner';
            banner.className = 'pwa-offline-banner';
            banner.textContent = '⚠️ You are offline. Some features may be limited.';
            document.body.prepend(banner);
        }
        
        banner.classList.add('visible');
    },

    /**
     * Hide offline banner
     */
    hideOfflineBanner() {
        const banner = document.getElementById('pwaOfflineBanner');
        if (banner) {
            banner.classList.remove('visible');
        }
    },

    /**
     * Show update notification
     */
    showUpdateNotification() {
        // Remove existing
        const existing = document.getElementById('pwaUpdateBanner');
        if (existing) existing.remove();

        const banner = document.createElement('div');
        banner.id = 'pwaUpdateBanner';
        banner.className = 'pwa-update-banner';
        banner.innerHTML = `
            <div style="margin-bottom: 0.75rem;">
                <strong>🔄 Update Available</strong>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
                    A new version of SPECTRE is ready.
                </p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="pwa-install-btn secondary" onclick="SPECTRE_PWA.dismissUpdate()">Later</button>
                <button class="pwa-install-btn primary" onclick="SPECTRE_PWA.applyUpdate()">Update Now</button>
            </div>
        `;
        document.body.appendChild(banner);
    },

    /**
     * Dismiss update notification
     */
    dismissUpdate() {
        const banner = document.getElementById('pwaUpdateBanner');
        if (banner) banner.remove();
    },

    /**
     * Apply update
     */
    applyUpdate() {
        if (this.state.swRegistration?.waiting) {
            this.state.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        window.location.reload();
    },

    /**
     * Get cache statistics
     */
    async getCacheStats() {
        if (!navigator.storage || !navigator.storage.estimate) {
            return null;
        }

        try {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage,
                quota: estimate.quota,
                usageFormatted: this.formatBytes(estimate.usage),
                quotaFormatted: this.formatBytes(estimate.quota),
                percent: Math.round((estimate.usage / estimate.quota) * 100)
            };
        } catch (err) {
            console.error('[PWA] Error getting cache stats:', err);
            return null;
        }
    },

    /**
     * Clear all caches
     */
    async clearCache() {
        if (!this.state.swRegistration) {
            SPECTRE_UI?.toast('Service Worker not available', 'warning');
            return;
        }

        try {
            // Send message to SW
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                if (event.data.success) {
                    SPECTRE_UI?.toast('Cache cleared successfully', 'success');
                }
            };

            navigator.serviceWorker.controller?.postMessage(
                { type: 'CLEAR_CACHE' },
                [messageChannel.port2]
            );
        } catch (err) {
            console.error('[PWA] Error clearing cache:', err);
            SPECTRE_UI?.toast('Error clearing cache', 'error');
        }
    },

    /**
     * Show PWA settings modal
     */
    showPWASettings() {
        this.getCacheStats().then(stats => {
            const statsHtml = stats ? `
                <div class="pwa-cache-stats">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Cache Usage</span>
                        <span>${stats.usageFormatted} / ${stats.quotaFormatted}</span>
                    </div>
                    <div class="pwa-cache-bar">
                        <div class="pwa-cache-fill" style="width: ${stats.percent}%"></div>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">
                        ${stats.percent}% of available storage
                    </div>
                </div>
            ` : '<p style="color: var(--text-muted);">Cache statistics not available</p>';

            SPECTRE_UI.showModal('📱 PWA Settings', `
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div>
                        <h3 style="margin-bottom: 0.5rem; font-size: 1rem;">Installation Status</h3>
                        <p style="color: var(--text-secondary);">
                            ${this.state.isInstalled 
                                ? '✅ SPECTRE is installed as an app' 
                                : '📲 SPECTRE can be installed as an app'}
                        </p>
                        ${!this.state.isInstalled && this.state.deferredPrompt ? `
                            <button class="btn btn-primary" onclick="SPECTRE_PWA.promptInstall()" style="margin-top: 0.5rem;">
                                Install SPECTRE
                            </button>
                        ` : ''}
                    </div>

                    <div>
                        <h3 style="margin-bottom: 0.5rem; font-size: 1rem;">Connection Status</h3>
                        <p style="color: var(--text-secondary);">
                            ${this.state.isOnline ? '🟢 Online' : '🔴 Offline'}
                        </p>
                    </div>

                    <div>
                        <h3 style="margin-bottom: 0.5rem; font-size: 1rem;">Cache Storage</h3>
                        ${statsHtml}
                        <button class="btn btn-sm" onclick="SPECTRE_PWA.clearCache()" style="margin-top: 0.75rem;">
                            🗑️ Clear Cache
                        </button>
                    </div>

                    <div>
                        <h3 style="margin-bottom: 0.5rem; font-size: 1rem;">Service Worker</h3>
                        <p style="color: var(--text-secondary);">
                            ${this.state.swRegistration ? '✅ Active' : '❌ Not registered'}
                        </p>
                        ${this.state.updateAvailable ? `
                            <button class="btn btn-primary btn-sm" onclick="SPECTRE_PWA.applyUpdate()" style="margin-top: 0.5rem;">
                                🔄 Apply Update
                            </button>
                        ` : ''}
                    </div>
                </div>
            `, [{ text: 'Close', action: 'SPECTRE.ui.closeModal()' }]);
        });
    },

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Check if running as PWA
     */
    isPWA() {
        return this.state.isInstalled || 
               window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    }
};

// Initialize on DOM ready
if (typeof window !== 'undefined') {
    window.SPECTRE_PWA = SPECTRE_PWA;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SPECTRE_PWA.init());
    } else {
        SPECTRE_PWA.init();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPECTRE_PWA;
}
