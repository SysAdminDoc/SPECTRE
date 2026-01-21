/* ============================================
   SPECTRE - Initialization Module
   Version: 2.0.0 (Modular)
   
   Initializes the application and creates the
   unified SPECTRE namespace for easy access.
   
   This file should be loaded LAST after all
   other modules.
   
   Dependencies: All other SPECTRE modules
   ============================================ */

/**
 * Create unified SPECTRE namespace
 * This provides a clean API for accessing all modules
 */
window.SPECTRE = {
    // Module references
    app: SPECTRE_APP,
    ui: SPECTRE_UI,
    storage: SPECTRE_STORAGE,
    export: SPECTRE_EXPORT,
    utils: SPECTRE_UTILS,
    tools: SPECTRE_TOOLS,

    // Version info
    version: '2.0.0',
    build: 'modular',

    /**
     * Initialize the entire application
     */
    init() {
        console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   👁️  SPECTRE OSINT Platform                          ║
║   Version ${this.version} (${this.build})                           ║
║                                                       ║
║   Systematic Platform for Efficient Collection,       ║
║   Tracking, and Research of Evidence                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
        `);

        // Initialize storage (loads cached data)
        SPECTRE_STORAGE.init();

        // Initialize theme
        SPECTRE_UI.initTheme();

        // Initialize UI event listeners
        SPECTRE_UI.initEventListeners();

        // Render sidebar content
        SPECTRE_UI.renderHistory();
        SPECTRE_UI.renderFavorites();

        // Count and display total tools
        this.countTools();

        // Set default filter from settings
        const defaultFilter = SPECTRE_STORAGE.getSetting('defaultFilter', 'free');
        SPECTRE_APP.state.filter = defaultFilter;
        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.classList.toggle('active', pill.dataset.filter === defaultFilter);
        });

        // Setup main search input handler
        this.setupMainSearch();

        // Setup input validation handlers
        this.setupInputValidation();

        // Focus main search on landing page
        const mainInput = document.getElementById('mainSearchInput');
        if (mainInput) {
            mainInput.focus();
        }

        console.log('[SPECTRE] Initialization complete');
    },

    /**
     * Count total tools and update display
     */
    countTools() {
        let totalTools = 0;
        let categories = 0;

        Object.values(SPECTRE_TOOLS || {}).forEach(category => {
            if (category.tools) {
                totalTools += category.tools.length;
                categories++;
            }
        });

        // Update landing page counter
        const counter = document.getElementById('totalToolCount');
        if (counter) {
            counter.textContent = totalTools;
        }

        console.log(`[SPECTRE] Loaded ${totalTools} tools across ${categories} categories`);
    },

    /**
     * Setup main search input handler
     */
    setupMainSearch() {
        const mainInput = document.getElementById('mainSearchInput');
        if (!mainInput) return;

        mainInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const value = e.target.value.trim();
                if (value) {
                    SPECTRE_APP.handleSmartSearch(value);
                }
            }
        });

        // Add placeholder animation
        const placeholders = [
            'Search by name, username, email, phone, domain...',
            'Try: John Smith',
            'Try: john@example.com',
            'Try: johndoe123',
            'Try: example.com',
            'Try: 555-123-4567'
        ];
        
        let placeholderIndex = 0;
        setInterval(() => {
            if (document.activeElement !== mainInput && !mainInput.value) {
                placeholderIndex = (placeholderIndex + 1) % placeholders.length;
                mainInput.placeholder = placeholders[placeholderIndex];
            }
        }, 3000);
    },

    /**
     * Setup input validation handlers
     */
    setupInputValidation() {
        document.querySelectorAll('.input-pill input, .quick-field input, .adv-input input').forEach(input => {
            input.addEventListener('input', () => {
                SPECTRE_APP.validateInputHighlight();
            });
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    SPECTRE_APP.runSearch();
                }
            });
        });
    },

    /**
     * Debug helper - log current state
     */
    debug() {
        console.log('[SPECTRE Debug]', {
            state: SPECTRE_APP.state,
            storage: SPECTRE_STORAGE.getStorageStats(),
            tools: Object.keys(SPECTRE_TOOLS || {}).length + ' categories'
        });
    }
};

// ==========================================
// DOM Ready Initialization
// ==========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SPECTRE.init());
} else {
    // DOM already loaded
    SPECTRE.init();
}

// ==========================================
// Global Error Handler
// ==========================================
window.addEventListener('error', (event) => {
    console.error('[SPECTRE Error]', event.error);
});

// ==========================================
// Expose debug in development
// ==========================================
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.spectreDebug = SPECTRE.debug.bind(SPECTRE);
    console.log('[SPECTRE] Debug mode enabled. Use spectreDebug() to inspect state.');
}
