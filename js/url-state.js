/* ============================================
   SPECTRE - URL State Module
   Version: 2.1.0
   
   URL hash state management for:
   - Shareable/bookmarkable searches
   - Deep linking to results
   - Browser history integration
   - State serialization/deserialization
   
   Example:
   spectre.html#first=John&last=Doe&email=john@test.com
   
   Dependencies: utils.js, app.js
   ============================================ */

/**
 * SPECTRE URL State Namespace
 */
const SPECTRE_URL_STATE = {

    /**
     * Configuration
     */
    CONFIG: {
        // Fields that can be in URL
        ALLOWED_FIELDS: [
            'first', 'last', 'username', 'email', 'phone',
            'city', 'state', 'zip', 'domain', 'ip', 'company',
            'streetAddress', 'imageUrl', 'vin', 'crypto', 'country'
        ],
        // State fields
        STATE_FIELDS: ['filter', 'category', 'view'],
        // Maximum URL length (most browsers support ~2000)
        MAX_URL_LENGTH: 1800,
        // Enable history push state
        USE_HISTORY: true,
        // Auto-search on hash change
        AUTO_SEARCH: true
    },

    /**
     * State tracking
     */
    _initialized: false,
    _lastHash: '',

    // ==========================================
    // Initialization
    // ==========================================

    /**
     * Initialize URL state module
     */
    init() {
        if (this._initialized) return;

        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleHashChange());

        // Check for initial hash on load
        if (window.location.hash) {
            this.handleHashChange();
        }

        this._initialized = true;
        console.log('[SPECTRE URL State] Initialized');
    },

    // ==========================================
    // Hash Parsing & Building
    // ==========================================

    /**
     * Parse URL hash into state object
     * @param {string} hash - URL hash (with or without #)
     * @returns {Object} Parsed state
     */
    parseHash(hash = window.location.hash) {
        const state = {
            values: {},
            settings: {}
        };

        if (!hash || hash === '#') return state;

        // Remove leading #
        const hashString = hash.startsWith('#') ? hash.slice(1) : hash;
        
        // Parse key=value pairs
        const params = new URLSearchParams(hashString);

        params.forEach((value, key) => {
            const decodedValue = decodeURIComponent(value);

            if (this.CONFIG.ALLOWED_FIELDS.includes(key)) {
                state.values[key] = decodedValue;
            } else if (this.CONFIG.STATE_FIELDS.includes(key)) {
                state.settings[key] = decodedValue;
            }
        });

        return state;
    },

    /**
     * Build URL hash from state
     * @param {Object} values - Search values
     * @param {Object} settings - State settings (filter, category, etc.)
     * @returns {string} URL hash string
     */
    buildHash(values, settings = {}) {
        const params = new URLSearchParams();

        // Add search values
        this.CONFIG.ALLOWED_FIELDS.forEach(field => {
            const value = values[field];
            if (value && typeof value === 'string' && value.trim()) {
                params.set(field, value.trim());
            }
        });

        // Add state settings
        Object.entries(settings).forEach(([key, value]) => {
            if (this.CONFIG.STATE_FIELDS.includes(key) && value) {
                params.set(key, value);
            }
        });

        const hashString = params.toString();
        
        // Check length limit
        if (hashString.length > this.CONFIG.MAX_URL_LENGTH) {
            console.warn('[SPECTRE URL State] Hash exceeds max length, some params may be truncated');
        }

        return hashString ? `#${hashString}` : '';
    },

    // ==========================================
    // State Management
    // ==========================================

    /**
     * Handle hash change event
     */
    handleHashChange() {
        const hash = window.location.hash;
        
        // Avoid duplicate processing
        if (hash === this._lastHash) return;
        this._lastHash = hash;

        if (!hash || hash === '#') return;

        const state = this.parseHash(hash);
        
        // Check if we have any search values
        const hasValues = Object.keys(state.values).length > 0;
        
        if (hasValues) {
            this.applyState(state);
        }
    },

    /**
     * Apply parsed state to the application
     * @param {Object} state - Parsed state object
     */
    applyState(state) {
        if (!window.SPECTRE_APP) {
            console.warn('[SPECTRE URL State] App not ready, delaying state apply');
            setTimeout(() => this.applyState(state), 100);
            return;
        }

        // Map parsed values to input field IDs
        const inputMappings = {
            'first': ['qFirst', 'firstName'],
            'last': ['qLast', 'lastName'],
            'username': ['qUsername', 'username'],
            'email': ['qEmail', 'email'],
            'phone': ['qPhone', 'phone'],
            'city': ['qCity', 'city'],
            'state': ['qState', 'state'],
            'zip': ['qZip', 'zip'],
            'domain': ['qDomain', 'domain'],
            'ip': ['qIP', 'ip'],
            'company': ['qCompany', 'company'],
            'streetAddress': ['qStreet', 'streetAddress'],
            'imageUrl': ['qImageUrl', 'imageUrl'],
            'vin': ['qVIN', 'vin'],
            'crypto': ['qCrypto', 'crypto'],
            'country': ['qCountry', 'country']
        };

        // Populate inputs
        Object.entries(state.values).forEach(([key, value]) => {
            const inputIds = inputMappings[key] || [key];
            inputIds.forEach(id => {
                const input = document.getElementById(id);
                if (input) input.value = value;
            });
        });

        // Apply state settings
        if (state.settings.filter && window.SPECTRE_APP) {
            SPECTRE_APP.state.filter = state.settings.filter;
            document.querySelectorAll('.filter-pill').forEach(pill => {
                pill.classList.toggle('active', pill.dataset.filter === state.settings.filter);
            });
        }

        if (state.settings.category && window.SPECTRE_APP) {
            SPECTRE_APP.selectCategory(state.settings.category);
        }

        // Trigger search if configured
        if (this.CONFIG.AUTO_SEARCH && window.SPECTRE_APP) {
            // Small delay to ensure inputs are populated
            setTimeout(() => {
                SPECTRE_APP.runSearch();
            }, 50);
        }

        console.log('[SPECTRE URL State] Applied state from URL:', state);
    },

    /**
     * Update URL hash from current state
     * @param {boolean} pushHistory - Whether to push to browser history
     */
    updateFromCurrentState(pushHistory = true) {
        if (!window.SPECTRE_APP) return;

        const values = SPECTRE_APP.gatherSearchValues('results');
        const settings = {
            filter: SPECTRE_APP.state.filter !== 'free' ? SPECTRE_APP.state.filter : null,
            category: SPECTRE_APP.state.selectedCategory !== 'all' ? SPECTRE_APP.state.selectedCategory : null
        };

        const hash = this.buildHash(values, settings);
        
        if (hash) {
            this._lastHash = hash;
            
            if (this.CONFIG.USE_HISTORY && pushHistory) {
                history.pushState(null, '', hash);
            } else {
                // Just update hash without creating history entry
                history.replaceState(null, '', hash);
            }
        }
    },

    /**
     * Clear URL hash
     */
    clearHash() {
        this._lastHash = '';
        history.replaceState(null, '', window.location.pathname);
    },

    // ==========================================
    // Shareable Links
    // ==========================================

    /**
     * Generate a shareable URL for current search
     * @returns {string} Full shareable URL
     */
    getShareableUrl() {
        if (!window.SPECTRE_APP) return window.location.href;

        const values = SPECTRE_APP.gatherSearchValues('results');
        const settings = {
            filter: SPECTRE_APP.state.filter !== 'free' ? SPECTRE_APP.state.filter : null,
            category: SPECTRE_APP.state.selectedCategory !== 'all' ? SPECTRE_APP.state.selectedCategory : null
        };

        const hash = this.buildHash(values, settings);
        return `${window.location.origin}${window.location.pathname}${hash}`;
    },

    /**
     * Copy shareable URL to clipboard
     * @returns {Promise<boolean>} Success status
     */
    async copyShareableUrl() {
        const url = this.getShareableUrl();
        
        try {
            await SPECTRE_UTILS.clipboard.copy(url);
            SPECTRE_UI.toast('Search URL copied to clipboard', 'success');
            return true;
        } catch {
            SPECTRE_UI.toast('Failed to copy URL', 'error');
            return false;
        }
    },

    /**
     * Generate a short shareable link (if supported)
     * Note: This would require a URL shortener service
     * @returns {Promise<string>} Short URL
     */
    async getShortUrl() {
        // Placeholder for URL shortener integration
        // Could integrate with services like TinyURL, bit.ly, or self-hosted
        const fullUrl = this.getShareableUrl();
        
        // For now, just return the full URL
        // In a real implementation, you'd call a shortener API
        return fullUrl;
    },

    // ==========================================
    // State Snapshots
    // ==========================================

    /**
     * Create a state snapshot that can be stored/restored
     * @returns {Object} State snapshot
     */
    createSnapshot() {
        if (!window.SPECTRE_APP) return null;

        return {
            version: '1.0',
            timestamp: Date.now(),
            values: SPECTRE_APP.gatherSearchValues('results'),
            filter: SPECTRE_APP.state.filter,
            category: SPECTRE_APP.state.selectedCategory,
            checkedTools: Array.from(SPECTRE_APP.state.checkedTools)
        };
    },

    /**
     * Restore from a state snapshot
     * @param {Object} snapshot - State snapshot
     */
    restoreSnapshot(snapshot) {
        if (!snapshot || !window.SPECTRE_APP) return;

        // Populate values
        SPECTRE_APP.populateResultsInputs(snapshot.values);

        // Restore filter
        if (snapshot.filter) {
            SPECTRE_APP.setFilter(snapshot.filter);
        }

        // Restore category
        if (snapshot.category) {
            SPECTRE_APP.selectCategory(snapshot.category);
        }

        // Restore checked tools
        if (snapshot.checkedTools && Array.isArray(snapshot.checkedTools)) {
            SPECTRE_APP.state.checkedTools = new Set(snapshot.checkedTools);
        }

        // Re-render
        SPECTRE_APP.renderAllTools();
        
        // Update URL
        this.updateFromCurrentState(false);
    },

    // ==========================================
    // QR Code Generation (Optional)
    // ==========================================

    /**
     * Generate QR code for shareable URL
     * Uses a free QR code API
     * @param {number} size - QR code size in pixels
     * @returns {string} QR code image URL
     */
    getQRCodeUrl(size = 200) {
        const url = encodeURIComponent(this.getShareableUrl());
        // Using Google Charts API (still works) or QRServer API
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${url}`;
    },

    /**
     * Show share modal with URL and QR code
     */
    showShareModal() {
        const url = this.getShareableUrl();
        const qrUrl = this.getQRCodeUrl(150);

        SPECTRE_UI.showModal('🔗 Share Search', `
            <style>
                .share-url-box {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }
                .share-url-input {
                    flex: 1;
                    padding: 0.75rem;
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-subtle);
                    border-radius: 6px;
                    color: var(--text-primary);
                    font-family: var(--font-mono);
                    font-size: 0.8rem;
                }
                .share-qr {
                    text-align: center;
                    padding: 1rem;
                    background: white;
                    border-radius: 8px;
                    display: inline-block;
                }
                .share-section {
                    margin-bottom: 1.5rem;
                }
                .share-section-title {
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                }
            </style>

            <div class="share-section">
                <div class="share-section-title">Shareable URL</div>
                <div class="share-url-box">
                    <input type="text" class="share-url-input" value="${SPECTRE_UTILS.string.escapeHtml(url)}" readonly onclick="this.select()">
                    <button class="btn btn-primary" onclick="SPECTRE.urlState.copyShareableUrl()">
                        📋 Copy
                    </button>
                </div>
                <p style="font-size: 0.75rem; color: var(--text-muted);">
                    Anyone with this link will see the same search parameters.
                </p>
            </div>

            <div class="share-section" style="text-align: center;">
                <div class="share-section-title">QR Code</div>
                <div class="share-qr">
                    <img src="${qrUrl}" alt="QR Code" style="display: block;">
                </div>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">
                    Scan to open on mobile device
                </p>
            </div>
        `, [{ text: 'Close', action: 'SPECTRE.ui.closeModal()' }]);
    },

    // ==========================================
    // Bookmarklet Generator
    // ==========================================

    /**
     * Generate a bookmarklet for quick searches
     * @returns {string} Bookmarklet code
     */
    generateBookmarklet() {
        // This creates a bookmarklet that prompts for input and opens SPECTRE
        const baseUrl = window.location.origin + window.location.pathname;
        
        const bookmarkletCode = `javascript:(function(){
            var q=prompt('SPECTRE Quick Search:','');
            if(q){
                var url='${baseUrl}#';
                if(q.indexOf('@')>-1){url+='email='+encodeURIComponent(q);}
                else if(/^[0-9-().+ ]+$/.test(q)){url+='phone='+encodeURIComponent(q);}
                else if(q.indexOf('.')>-1&&q.indexOf(' ')===-1){url+='domain='+encodeURIComponent(q);}
                else{var p=q.split(' ');url+='first='+encodeURIComponent(p[0]);if(p[1])url+='&last='+encodeURIComponent(p.slice(1).join(' '));}
                window.open(url);
            }
        })();`;

        return bookmarkletCode.replace(/\s+/g, ' ');
    },

    /**
     * Show bookmarklet modal
     */
    showBookmarkletModal() {
        const bookmarklet = this.generateBookmarklet();

        SPECTRE_UI.showModal('🔖 Quick Search Bookmarklet', `
            <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                Drag this button to your bookmarks bar for quick SPECTRE searches from any page:
            </p>

            <div style="text-align: center; margin: 1.5rem 0;">
                <a href="${bookmarklet}" 
                   class="btn btn-primary" 
                   style="font-size: 1rem; padding: 0.75rem 1.5rem;"
                   onclick="event.preventDefault(); alert('Drag this to your bookmarks bar!');">
                    🔍 SPECTRE Search
                </a>
            </div>

            <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                <p style="font-weight: 500; margin-bottom: 0.5rem;">How to use:</p>
                <ol style="margin: 0; padding-left: 1.25rem; color: var(--text-secondary); font-size: 0.85rem; line-height: 1.8;">
                    <li>Drag the button above to your bookmarks bar</li>
                    <li>Click the bookmark from any webpage</li>
                    <li>Enter a name, email, username, phone, or domain</li>
                    <li>SPECTRE opens with your search ready</li>
                </ol>
            </div>

            <p style="margin-top: 1rem; font-size: 0.75rem; color: var(--text-muted);">
                The bookmarklet auto-detects input type: emails, phone numbers, domains, and names.
            </p>
        `, [{ text: 'Close', action: 'SPECTRE.ui.closeModal()' }]);
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.SPECTRE_URL_STATE = SPECTRE_URL_STATE;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SPECTRE_URL_STATE.init());
    } else {
        SPECTRE_URL_STATE.init();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPECTRE_URL_STATE;
}
