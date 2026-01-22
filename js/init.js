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
    // Core module references
    app: SPECTRE_APP,
    ui: SPECTRE_UI,
    storage: SPECTRE_STORAGE,
    export: SPECTRE_EXPORT,
    utils: SPECTRE_UTILS,
    tools: SPECTRE_TOOLS,

    // Enhanced module references (v2.1)
    cases: typeof SPECTRE_CASES !== 'undefined' ? SPECTRE_CASES : null,
    customTools: typeof SPECTRE_CUSTOM_TOOLS !== 'undefined' ? SPECTRE_CUSTOM_TOOLS : null,
    urlState: typeof SPECTRE_URL_STATE !== 'undefined' ? SPECTRE_URL_STATE : null,
    api: typeof SPECTRE_API !== 'undefined' ? SPECTRE_API : null,
    workflows: typeof SPECTRE_WORKFLOWS !== 'undefined' ? SPECTRE_WORKFLOWS : null,
    suggestions: typeof SPECTRE_SUGGESTIONS !== 'undefined' ? SPECTRE_SUGGESTIONS : null,

    // Power feature references (v2.2)
    commandPalette: typeof SPECTRE_COMMAND_PALETTE !== 'undefined' ? SPECTRE_COMMAND_PALETTE : null,
    bulk: typeof SPECTRE_BULK !== 'undefined' ? SPECTRE_BULK : null,
    workspace: typeof SPECTRE_WORKSPACE !== 'undefined' ? SPECTRE_WORKSPACE : null,
    pwa: typeof SPECTRE_PWA !== 'undefined' ? SPECTRE_PWA : null,

    // Version info
    version: '2.2.0',
    build: 'power-features',

    /**
     * Initialize the entire application
     */
    init() {
        console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   👁️  SPECTRE OSINT Platform                          ║
║   Version ${this.version} (${this.build})                      ║
║                                                       ║
║   Systematic Platform for Efficient Collection,       ║
║   Tracking, and Research of Evidence                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
        `);

        // Initialize core storage (loads cached data)
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

        // ========================================
        // Initialize Enhanced Modules (v2.1)
        // ========================================

        // Initialize Case Manager
        if (this.cases) {
            this.cases.init();
            this.renderActiveCaseIndicator();
        }

        // Initialize Custom Tools (merges into tools DB)
        if (this.customTools) {
            this.customTools.init();
        }

        // Initialize URL State (handles deep links)
        if (this.urlState) {
            this.urlState.init();
        }

        // Initialize Workflows
        if (this.workflows) {
            this.workflows.init();
        }

        // Focus main search on landing page
        const mainInput = document.getElementById('mainSearchInput');
        if (mainInput) {
            mainInput.focus();
        }

        console.log('[SPECTRE] Initialization complete');
        console.log('[SPECTRE] Enhanced modules loaded:', {
            cases: !!this.cases,
            customTools: !!this.customTools,
            urlState: !!this.urlState,
            api: !!this.api,
            workflows: !!this.workflows,
            suggestions: !!this.suggestions
        });
        console.log('[SPECTRE] Power features loaded:', {
            commandPalette: !!this.commandPalette,
            bulk: !!this.bulk,
            workspace: !!this.workspace,
            pwa: !!this.pwa
        });
    },

    /**
     * Render active case indicator in UI
     */
    renderActiveCaseIndicator() {
        if (!this.cases) return;
        
        const activeCase = this.cases.getActiveCase();
        const indicator = document.getElementById('activeCaseIndicator');
        
        if (indicator) {
            if (activeCase) {
                indicator.innerHTML = `
                    <span class="case-indicator active" onclick="SPECTRE.cases.showCaseManagerModal()" data-tooltip="Active Investigation: ${SPECTRE_UTILS.string.escapeHtml(activeCase.name)}">
                        📁 ${SPECTRE_UTILS.string.truncate(activeCase.name, 15)}
                    </span>
                `;
            } else {
                indicator.innerHTML = `
                    <span class="case-indicator" onclick="SPECTRE.cases.showCaseManagerModal()" data-tooltip="No active investigation">
                        📁 No Case
                    </span>
                `;
            }
        }
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
