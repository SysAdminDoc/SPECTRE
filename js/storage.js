/* ============================================
   SPECTRE - Storage Module
   Version: 2.0.0 (Modular)
   
   Handles all localStorage operations:
   - Search history
   - Favorites
   - Settings/preferences
   - Data export/import
   
   Dependencies: utils.js
   ============================================ */

/**
 * SPECTRE Storage Namespace
 */
const SPECTRE_STORAGE = {
    
    /**
     * Storage Keys
     */
    KEYS: {
        FAVORITES: 'spectre-fav',
        HISTORY: 'spectre-hist',
        THEME: 'spectre-theme',
        SETTINGS: 'spectre-settings',
        CHECKED_TOOLS: 'spectre-checked'
    },

    /**
     * Configuration
     */
    CONFIG: {
        MAX_HISTORY: 30,
        MAX_FAVORITES: 100
    },

    /**
     * In-memory cache
     */
    _cache: {
        favorites: null,
        history: null,
        settings: null
    },

    /**
     * Initialize storage module
     * Loads data from localStorage into cache
     */
    init() {
        this._cache.favorites = this.getFavorites();
        this._cache.history = this.getHistory();
        this._cache.settings = this.getSettings();
        
        console.log('[SPECTRE Storage] Initialized:', {
            favorites: this._cache.favorites.length,
            history: this._cache.history.length
        });
    },

    // ==========================================
    // Core Storage Operations
    // ==========================================

    /**
     * Get item from localStorage with error handling
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default if not found
     * @returns {*} Stored value or default
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (err) {
            console.warn(`[SPECTRE Storage] Error reading ${key}:`, err);
            return defaultValue;
        }
    },

    /**
     * Set item in localStorage with error handling
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success status
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (err) {
            console.error(`[SPECTRE Storage] Error writing ${key}:`, err);
            // Handle quota exceeded
            if (err.name === 'QuotaExceededError') {
                this.handleQuotaExceeded();
            }
            return false;
        }
    },

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (err) {
            console.warn(`[SPECTRE Storage] Error removing ${key}:`, err);
        }
    },

    /**
     * Handle storage quota exceeded
     * Clears oldest history entries to make space
     */
    handleQuotaExceeded() {
        console.warn('[SPECTRE Storage] Quota exceeded, clearing old data...');
        
        // Clear half of history
        const history = this.getHistory();
        if (history.length > 10) {
            this._cache.history = history.slice(0, Math.floor(history.length / 2));
            this.set(this.KEYS.HISTORY, this._cache.history);
        }
    },

    // ==========================================
    // Favorites Management
    // ==========================================

    /**
     * Get all favorites
     * @returns {Array} Favorites array
     */
    getFavorites() {
        if (this._cache.favorites) return this._cache.favorites;
        return this.get(this.KEYS.FAVORITES, []);
    },

    /**
     * Add a tool to favorites
     * @param {Object} tool - Tool object
     * @param {string} categoryId - Category ID
     * @returns {boolean} Success status
     */
    addFavorite(tool, categoryId) {
        const favorites = this.getFavorites();
        
        // Check if already exists
        if (favorites.some(f => f.name === tool.name)) {
            return false;
        }
        
        // Add to beginning of array
        favorites.unshift({
            ...tool,
            categoryId,
            favoritedAt: Date.now()
        });
        
        // Limit size
        if (favorites.length > this.CONFIG.MAX_FAVORITES) {
            favorites.pop();
        }
        
        this._cache.favorites = favorites;
        return this.set(this.KEYS.FAVORITES, favorites);
    },

    /**
     * Remove a tool from favorites
     * @param {string} toolName - Tool name
     * @returns {Object|null} Removed tool or null
     */
    removeFavorite(toolName) {
        const favorites = this.getFavorites();
        const index = favorites.findIndex(f => f.name === toolName);
        
        if (index === -1) return null;
        
        const removed = favorites.splice(index, 1)[0];
        this._cache.favorites = favorites;
        this.set(this.KEYS.FAVORITES, favorites);
        
        return removed;
    },

    /**
     * Remove favorite by index
     * @param {number} index - Index to remove
     * @returns {Object|null} Removed tool or null
     */
    removeFavoriteByIndex(index) {
        const favorites = this.getFavorites();
        
        if (index < 0 || index >= favorites.length) return null;
        
        const removed = favorites.splice(index, 1)[0];
        this._cache.favorites = favorites;
        this.set(this.KEYS.FAVORITES, favorites);
        
        return removed;
    },

    /**
     * Check if a tool is favorited
     * @param {string} toolName - Tool name
     * @returns {boolean} Is favorited
     */
    isFavorite(toolName) {
        return this.getFavorites().some(f => f.name === toolName);
    },

    /**
     * Clear all favorites
     */
    clearFavorites() {
        this._cache.favorites = [];
        this.remove(this.KEYS.FAVORITES);
    },

    // ==========================================
    // Search History Management
    // ==========================================

    /**
     * Get search history
     * @returns {Array} History array
     */
    getHistory() {
        if (this._cache.history) return this._cache.history;
        return this.get(this.KEYS.HISTORY, []);
    },

    /**
     * Add entry to search history
     * @param {Object} values - Search values
     * @returns {boolean} Success status
     */
    addToHistory(values) {
        // Build display string
        const parts = [];
        if (values.first && values.last) {
            parts.push(`${SPECTRE_UTILS.string.capitalize(values.first)} ${SPECTRE_UTILS.string.capitalize(values.last)}`);
        } else if (values.first) {
            parts.push(SPECTRE_UTILS.string.capitalize(values.first));
        }
        if (values.username) parts.push(`@${values.username}`);
        if (values.email) parts.push(values.email);
        if (values.domain) parts.push(values.domain);
        if (values.phone) parts.push(values.phone);
        if (values.ip) parts.push(values.ip);
        
        // Skip if nothing meaningful
        if (parts.length === 0) return false;
        
        const entry = {
            values: { ...values },
            display: parts.join(' • '),
            timestamp: Date.now()
        };
        
        const history = this.getHistory();
        
        // Remove duplicate if exists
        const existingIndex = history.findIndex(h => h.display === entry.display);
        if (existingIndex !== -1) {
            history.splice(existingIndex, 1);
        }
        
        // Add to beginning
        history.unshift(entry);
        
        // Limit size
        while (history.length > this.CONFIG.MAX_HISTORY) {
            history.pop();
        }
        
        this._cache.history = history;
        return this.set(this.KEYS.HISTORY, history);
    },

    /**
     * Get a history entry by index
     * @param {number} index - Index
     * @returns {Object|null} History entry
     */
    getHistoryEntry(index) {
        const history = this.getHistory();
        return history[index] || null;
    },

    /**
     * Clear search history
     */
    clearHistory() {
        this._cache.history = [];
        this.remove(this.KEYS.HISTORY);
    },

    // ==========================================
    // Theme Management
    // ==========================================

    /**
     * Get current theme
     * @returns {string} Theme name
     */
    getTheme() {
        return this.get(this.KEYS.THEME, 'dark');
    },

    /**
     * Set theme
     * @param {string} theme - Theme name
     */
    setTheme(theme) {
        this.set(this.KEYS.THEME, theme);
    },

    // ==========================================
    // Settings Management
    // ==========================================

    /**
     * Get all settings
     * @returns {Object} Settings object
     */
    getSettings() {
        if (this._cache.settings) return this._cache.settings;
        return this.get(this.KEYS.SETTINGS, {
            defaultFilter: 'free',
            autoOpenLinks: false,
            showTooltips: true,
            compactMode: false
        });
    },

    /**
     * Update settings
     * @param {Object} updates - Settings to update
     * @returns {Object} Updated settings
     */
    updateSettings(updates) {
        const settings = { ...this.getSettings(), ...updates };
        this._cache.settings = settings;
        this.set(this.KEYS.SETTINGS, settings);
        return settings;
    },

    /**
     * Get a specific setting
     * @param {string} key - Setting key
     * @param {*} defaultValue - Default value
     * @returns {*} Setting value
     */
    getSetting(key, defaultValue = null) {
        const settings = this.getSettings();
        return settings.hasOwnProperty(key) ? settings[key] : defaultValue;
    },

    /**
     * Set a specific setting
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     */
    setSetting(key, value) {
        this.updateSettings({ [key]: value });
    },

    // ==========================================
    // Checked Tools (Session)
    // ==========================================

    /**
     * Get checked tools set
     * @returns {Set} Checked tool IDs
     */
    getCheckedTools() {
        const arr = this.get(this.KEYS.CHECKED_TOOLS, []);
        return new Set(arr);
    },

    /**
     * Save checked tools
     * @param {Set} checked - Checked tool IDs set
     */
    saveCheckedTools(checked) {
        this.set(this.KEYS.CHECKED_TOOLS, Array.from(checked));
    },

    /**
     * Clear checked tools
     */
    clearCheckedTools() {
        this.remove(this.KEYS.CHECKED_TOOLS);
    },

    // ==========================================
    // Data Export/Import
    // ==========================================

    /**
     * Export all data as JSON
     * @returns {Object} All stored data
     */
    exportAllData() {
        return {
            favorites: this.getFavorites(),
            searchHistory: this.getHistory(),
            settings: this.getSettings(),
            theme: this.getTheme(),
            exportedAt: new Date().toISOString(),
            version: '2.0.0'
        };
    },

    /**
     * Import data from JSON
     * @param {Object} data - Data to import
     * @param {Object} options - Import options
     * @returns {Object} Import results
     */
    importData(data, options = { merge: false }) {
        const results = {
            favorites: 0,
            history: 0,
            settings: false,
            errors: []
        };

        try {
            // Import favorites
            if (data.favorites && Array.isArray(data.favorites)) {
                if (options.merge) {
                    const existing = this.getFavorites();
                    const merged = [...existing];
                    data.favorites.forEach(fav => {
                        if (!merged.some(f => f.name === fav.name)) {
                            merged.push(fav);
                            results.favorites++;
                        }
                    });
                    this._cache.favorites = merged.slice(0, this.CONFIG.MAX_FAVORITES);
                } else {
                    this._cache.favorites = data.favorites.slice(0, this.CONFIG.MAX_FAVORITES);
                    results.favorites = this._cache.favorites.length;
                }
                this.set(this.KEYS.FAVORITES, this._cache.favorites);
            }

            // Import history
            if (data.searchHistory && Array.isArray(data.searchHistory)) {
                if (options.merge) {
                    const existing = this.getHistory();
                    const merged = [...data.searchHistory, ...existing];
                    // Deduplicate by display
                    const unique = [];
                    const seen = new Set();
                    merged.forEach(item => {
                        if (!seen.has(item.display)) {
                            seen.add(item.display);
                            unique.push(item);
                        }
                    });
                    this._cache.history = unique.slice(0, this.CONFIG.MAX_HISTORY);
                } else {
                    this._cache.history = data.searchHistory.slice(0, this.CONFIG.MAX_HISTORY);
                }
                results.history = this._cache.history.length;
                this.set(this.KEYS.HISTORY, this._cache.history);
            }

            // Import settings
            if (data.settings && typeof data.settings === 'object') {
                this.updateSettings(data.settings);
                results.settings = true;
            }

            // Import theme
            if (data.theme) {
                this.setTheme(data.theme);
            }

        } catch (err) {
            results.errors.push(err.message);
        }

        return results;
    },

    /**
     * Clear all stored data
     * @param {boolean} confirm - Require confirmation
     * @returns {boolean} Success status
     */
    clearAllData(confirm = true) {
        if (confirm && !window.confirm('This will delete all your saved history, favorites, and settings. Continue?')) {
            return false;
        }

        Object.values(this.KEYS).forEach(key => {
            this.remove(key);
        });

        this._cache = {
            favorites: [],
            history: [],
            settings: null
        };

        return true;
    },

    /**
     * Get storage usage statistics
     * @returns {Object} Usage stats
     */
    getStorageStats() {
        let totalSize = 0;
        const breakdown = {};

        Object.entries(this.KEYS).forEach(([name, key]) => {
            const item = localStorage.getItem(key);
            const size = item ? new Blob([item]).size : 0;
            breakdown[name] = size;
            totalSize += size;
        });

        return {
            totalBytes: totalSize,
            totalKB: (totalSize / 1024).toFixed(2),
            breakdown,
            favorites: this.getFavorites().length,
            history: this.getHistory().length
        };
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.SPECTRE_STORAGE = SPECTRE_STORAGE;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SPECTRE_STORAGE.init());
    } else {
        SPECTRE_STORAGE.init();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPECTRE_STORAGE;
}
