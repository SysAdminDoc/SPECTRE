/* ============================================
   SPECTRE - UI Module
   Version: 2.0.0 (Modular)
   
   Handles all user interface interactions:
   - Modals
   - Toast notifications
   - Dropdowns
   - Tabs
   - Theme management
   - Sidebar
   
   Dependencies: utils.js, storage.js
   ============================================ */

/**
 * SPECTRE UI Namespace
 */
const SPECTRE_UI = {

    // ==========================================
    // Toast Notifications
    // ==========================================

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in ms (default: 3000)
     */
    toast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || 'ℹ'}</span>
            <span class="toast-message">${SPECTRE_UTILS.string.escapeHtml(message)}</span>
        `;
        
        container.appendChild(toast);
        
        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Auto-remove
        setTimeout(() => {
            toast.classList.add('hide');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    },

    // ==========================================
    // Modal System
    // ==========================================

    /**
     * Show a modal dialog
     * @param {string} title - Modal title
     * @param {string} content - HTML content
     * @param {Array} buttons - Button configurations
     */
    showModal(title, content, buttons = []) {
        const container = document.getElementById('modalContainer');
        if (!container) return;

        const buttonHtml = buttons.length > 0 
            ? `<div class="modal-footer">
                ${buttons.map(b => `
                    <button class="btn ${b.class || ''}" onclick="${b.action}">
                        ${b.text}
                    </button>
                `).join('')}
               </div>`
            : '';

        container.innerHTML = `
            <div class="modal-backdrop open" id="activeModal" onclick="if(event.target===this)SPECTRE.ui.closeModal()">
                <div class="modal scale-in">
                    <div class="modal-header">
                        <span class="modal-title">${title}</span>
                        <button class="modal-close" onclick="SPECTRE.ui.closeModal()" data-tooltip="Close">&times;</button>
                    </div>
                    <div class="modal-body">${content}</div>
                    ${buttonHtml}
                </div>
            </div>
        `;

        // Focus trap
        const modal = container.querySelector('.modal');
        if (modal) {
            const focusable = modal.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable.length) focusable[0].focus();
        }
    },

    /**
     * Close the active modal
     */
    closeModal() {
        const container = document.getElementById('modalContainer');
        if (container) {
            container.innerHTML = '';
        }
    },

    /**
     * Show About modal
     */
    showAboutModal() {
        const toolsDB = window.SPECTRE_TOOLS || {};
        const toolCount = Object.values(toolsDB).reduce((sum, cat) => sum + (cat.tools?.length || 0), 0);
        const categoryCount = Object.keys(toolsDB).length;

        this.showModal('About SPECTRE', `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">👁️</div>
                <h2 style="margin: 0; font-size: 1.5rem; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">SPECTRE</h2>
                <p style="color: var(--text-muted); margin-top: 0.25rem; font-size: 0.85rem;">
                    Systematic Platform for Efficient Collection,<br>Tracking, and Research of Evidence
                </p>
            </div>
            
            <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; margin-bottom: 1rem;">
                SPECTRE is a comprehensive OSINT aggregation tool designed to streamline intelligence gathering across 
                <strong style="color: var(--accent-cyan);">${toolCount}+</strong> sources. Built for researchers, investigators, journalists, and security professionals.
            </p>
            
            <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <p style="margin: 0 0 0.5rem; font-size: 0.8rem; font-weight: 600; color: var(--text-primary);">Key Features:</p>
                <ul style="margin: 0; padding-left: 1.25rem; color: var(--text-secondary); font-size: 0.8rem; line-height: 1.8;">
                    <li>${toolCount}+ OSINT tools across ${categoryCount} categories</li>
                    <li>Smart URL generation with template placeholders</li>
                    <li>Filter by pricing: Free, Freemium, Paid, CLI</li>
                    <li>Search history and favorites</li>
                    <li>Export results in JSON, CSV, Markdown, HTML</li>
                    <li>Multiple themes including Dark, Light, Hacker, Nord</li>
                    <li>Keyboard shortcuts for power users</li>
                </ul>
            </div>
            
            <div style="display: flex; gap: 0.5rem; font-size: 0.75rem; color: var(--text-muted);">
                <span>Version 2.0.0 (Modular)</span>
                <span>•</span>
                <a href="https://github.com/spectre-osint" target="_blank" style="color: var(--accent-primary);">GitHub</a>
            </div>
        `, [{ text: 'Close', action: 'SPECTRE.ui.closeModal()' }]);
    },

    /**
     * Show Settings modal
     */
    showSettingsModal() {
        const currentTheme = SPECTRE_STORAGE.getTheme();
        const settings = SPECTRE_STORAGE.getSettings();
        const stats = SPECTRE_STORAGE.getStorageStats();

        this.showModal('Settings', `
            <div class="settings-section">
                <label class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Theme</label>
                <select class="select" id="settingsTheme" onchange="SPECTRE.ui.setTheme(this.value)" style="width: 100%;">
                    <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>🌙 Dark - Default dark theme</option>
                    <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>☀️ Light - Bright mode</option>
                    <option value="hacker" ${currentTheme === 'hacker' ? 'selected' : ''}>💻 Hacker - Matrix green</option>
                    <option value="nord" ${currentTheme === 'nord' ? 'selected' : ''}>❄️ Nord - Arctic colors</option>
                    <option value="high-contrast" ${currentTheme === 'high-contrast' ? 'selected' : ''}>🔲 High Contrast - Accessibility</option>
                </select>
            </div>
            
            <hr style="border-color: var(--border-subtle); margin: 1.25rem 0;">
            
            <div class="settings-section">
                <label class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Default Filter</label>
                <select class="select" id="settingsDefaultFilter" onchange="SPECTRE_STORAGE.setSetting('defaultFilter', this.value)" style="width: 100%;">
                    <option value="all" ${settings.defaultFilter === 'all' ? 'selected' : ''}>All Tools</option>
                    <option value="free" ${settings.defaultFilter === 'free' ? 'selected' : ''}>Free Only</option>
                    <option value="freemium" ${settings.defaultFilter === 'freemium' ? 'selected' : ''}>Freemium</option>
                    <option value="paid" ${settings.defaultFilter === 'paid' ? 'selected' : ''}>Paid</option>
                    <option value="cli" ${settings.defaultFilter === 'cli' ? 'selected' : ''}>CLI Tools</option>
                </select>
            </div>
            
            <hr style="border-color: var(--border-subtle); margin: 1.25rem 0;">
            
            <div class="settings-section">
                <label class="form-label" style="display: block; margin-bottom: 0.75rem; font-weight: 600;">Data Management</label>
                <div style="background: var(--bg-tertiary); padding: 0.75rem; border-radius: 6px; margin-bottom: 0.75rem; font-size: 0.75rem; color: var(--text-muted);">
                    <div>📊 Storage: ${stats.totalKB} KB</div>
                    <div>⭐ Favorites: ${stats.favorites} items</div>
                    <div>📜 History: ${stats.history} entries</div>
                </div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="btn btn-sm" onclick="SPECTRE.ui.exportUserData()" data-tooltip="Download all data">
                        📤 Export Data
                    </button>
                    <button class="btn btn-sm" onclick="SPECTRE.ui.importUserData()" data-tooltip="Import from file">
                        📥 Import Data
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="SPECTRE.ui.clearAllUserData()" data-tooltip="Delete all saved data">
                        🗑️ Clear All
                    </button>
                </div>
            </div>
        `, [{ text: 'Done', action: 'SPECTRE.ui.closeModal()' }]);
    },

    /**
     * Show Help modal
     */
    showHelpModal() {
        this.showModal('Help & Getting Started', `
            <h3 style="margin-bottom: 0.75rem; font-size: 1rem; color: var(--text-primary);">Quick Start</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.6; margin-bottom: 1rem;">
                Enter any combination of search parameters (name, username, email, etc.) and click 
                <strong>Search OSINT</strong>. SPECTRE will generate direct links to all relevant tools.
            </p>
            
            <h3 style="margin-bottom: 0.75rem; font-size: 1rem; color: var(--text-primary);">Smart Search</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.6; margin-bottom: 1rem;">
                The main search bar auto-detects input type:
            </p>
            <ul style="color: var(--text-secondary); font-size: 0.8rem; line-height: 1.8; padding-left: 1.25rem; margin-bottom: 1rem;">
                <li><strong>email@example.com</strong> → Email search</li>
                <li><strong>5551234567</strong> → Phone lookup</li>
                <li><strong>example.com</strong> → Domain analysis</li>
                <li><strong>192.168.1.1</strong> → IP investigation</li>
                <li><strong>johndoe123</strong> → Username search</li>
                <li><strong>John Doe</strong> → People search</li>
            </ul>
            
            <h3 style="margin-bottom: 0.75rem; font-size: 1rem; color: var(--text-primary);">Tips</h3>
            <ul style="color: var(--text-secondary); font-size: 0.8rem; line-height: 1.8; padding-left: 1.25rem;">
                <li>✅ Use checkboxes to track which tools you've visited</li>
                <li>⭐ Star tools to add them to favorites for quick access</li>
                <li>🎯 Use filters to show only Free, Paid, or specific tool types</li>
                <li>💾 Export results for documentation and reports</li>
                <li>🔍 Use the text filter to find specific tools by name</li>
                <li>⌨️ Press <code style="background: var(--bg-tertiary); padding: 0.1rem 0.3rem; border-radius: 4px;">Ctrl+K</code> to focus the filter</li>
            </ul>
        `, [{ text: 'Got it!', action: 'SPECTRE.ui.closeModal()', class: 'btn-primary' }]);
    },

    /**
     * Show Keyboard Shortcuts modal
     */
    showShortcutsModal() {
        const shortcuts = [
            { key: 'Ctrl + Enter', desc: 'Run search' },
            { key: 'Ctrl + K', desc: 'Focus tool filter' },
            { key: 'Escape', desc: 'Close modal / dropdown' },
            { key: 'Alt + H', desc: 'Return to home' },
            { key: 'Alt + E', desc: 'Expand all categories' },
            { key: 'Alt + C', desc: 'Collapse all categories' }
        ];

        this.showModal('Keyboard Shortcuts', `
            <div style="display: grid; gap: 0.5rem;">
                ${shortcuts.map(s => `
                    <div style="display: flex; justify-content: space-between; padding: 0.6rem; background: var(--bg-tertiary); border-radius: 6px;">
                        <span style="color: var(--text-secondary);">${s.desc}</span>
                        <code style="background: var(--bg-elevated); padding: 0.2rem 0.5rem; border-radius: 4px; font-family: var(--font-mono); font-size: 0.75rem;">${s.key}</code>
                    </div>
                `).join('')}
            </div>
        `, [{ text: 'Close', action: 'SPECTRE.ui.closeModal()' }]);
    },

    // ==========================================
    // Theme Management
    // ==========================================

    /**
     * Set application theme
     * @param {string} theme - Theme name
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        SPECTRE_STORAGE.setTheme(theme);
        
        // Sync all theme selectors
        document.querySelectorAll('#themeSelectLanding, #themeSelectResults').forEach(select => {
            if (select) select.value = theme;
        });
        
        this.toast(`Theme: ${theme}`, 'info', 1500);
    },

    /**
     * Initialize theme from storage
     */
    initTheme() {
        const theme = SPECTRE_STORAGE.getTheme();
        document.documentElement.setAttribute('data-theme', theme);
        
        // Sync selectors
        document.querySelectorAll('#themeSelectLanding, #themeSelectResults').forEach(select => {
            if (select) select.value = theme;
        });
    },

    // ==========================================
    // Dropdown System
    // ==========================================

    /**
     * Toggle a dropdown
     * @param {string} id - Dropdown element ID
     */
    toggleDropdown(id) {
        const dropdown = document.getElementById(id);
        if (!dropdown) return;

        const isOpen = dropdown.classList.contains('open');
        this.closeAllDropdowns();
        
        if (!isOpen) {
            dropdown.classList.add('open');
        }
    },

    /**
     * Close all dropdowns
     */
    closeAllDropdowns() {
        document.querySelectorAll('.dropdown.open').forEach(d => {
            d.classList.remove('open');
        });
    },

    // ==========================================
    // Sidebar Management
    // ==========================================

    /**
     * Toggle sidebar visibility
     */
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            
            // Mobile behavior
            if (window.innerWidth < 768) {
                sidebar.classList.toggle('open');
                if (overlay) overlay.classList.toggle('active');
            }
        }
    },

    /**
     * Close sidebar (mobile)
     */
    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar) {
            sidebar.classList.remove('open');
            sidebar.classList.add('collapsed');
        }
        if (overlay) overlay.classList.remove('active');
    },

    /**
     * Switch sidebar tab
     * @param {string} tab - Tab name
     */
    switchTab(tab) {
        document.querySelectorAll('.sidebar-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('hidden', panel.id !== `panel-${tab}`);
        });
    },

    // ==========================================
    // UI Toggles
    // ==========================================

    /**
     * Toggle advanced options panel
     */
    toggleAdvanced() {
        const toggle = document.getElementById('advancedToggle');
        const panel = document.getElementById('advancedPanel');
        
        if (toggle) toggle.classList.toggle('open');
        if (panel) panel.classList.toggle('open');
    },

    /**
     * Toggle extended inputs bar
     */
    toggleExtended() {
        const bar = document.getElementById('extendedBar');
        if (bar) bar.classList.toggle('visible');
    },

    // ==========================================
    // Data Management UI
    // ==========================================

    /**
     * Export user data to file
     */
    exportUserData() {
        const data = SPECTRE_STORAGE.exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `spectre-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.toast('Data exported successfully', 'success');
        this.closeModal();
    },

    /**
     * Import user data from file
     */
    importUserData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                // Confirm import
                const merge = confirm('Merge with existing data? (Cancel to replace)');
                const results = SPECTRE_STORAGE.importData(data, { merge });
                
                this.toast(`Imported: ${results.favorites} favorites, ${results.history} history`, 'success');
                this.closeModal();
                
                // Refresh UI
                if (typeof SPECTRE !== 'undefined' && SPECTRE.app) {
                    SPECTRE.app.renderHistory();
                    SPECTRE.app.renderFavorites();
                }
            } catch (err) {
                this.toast('Import failed: Invalid file', 'error');
            }
        };
        
        input.click();
    },

    /**
     * Clear all user data with confirmation
     */
    clearAllUserData() {
        if (SPECTRE_STORAGE.clearAllData(true)) {
            this.toast('All data cleared', 'info');
            this.closeModal();
            setTimeout(() => location.reload(), 500);
        }
    },

    // ==========================================
    // History & Favorites UI
    // ==========================================

    /**
     * Render search history in sidebar
     */
    renderHistory() {
        const list = document.getElementById('historyList');
        if (!list) return;

        const history = SPECTRE_STORAGE.getHistory();
        
        if (history.length === 0) {
            list.innerHTML = `
                <div style="padding: 0.75rem; color: var(--text-muted); font-size: 0.75rem; text-align: center;">
                    No recent searches
                </div>
            `;
            return;
        }

        list.innerHTML = history.slice(0, 15).map((entry, index) => `
            <div class="history-item" 
                 onclick="SPECTRE.app.loadHistoryEntry(${index})"
                 data-tooltip="Click to load this search">
                <span>🔍</span>
                <span class="history-text">${SPECTRE_UTILS.string.escapeHtml(entry.display)}</span>
                <span class="history-time">${SPECTRE_UTILS.date.relativeTime(entry.timestamp)}</span>
            </div>
        `).join('');
    },

    /**
     * Render favorites in sidebar
     */
    renderFavorites() {
        const list = document.getElementById('favoritesList');
        if (!list) return;

        const favorites = SPECTRE_STORAGE.getFavorites();
        
        if (favorites.length === 0) {
            list.innerHTML = `
                <div style="padding: 0.75rem; color: var(--text-muted); font-size: 0.75rem; text-align: center;">
                    No favorites yet.<br>Click ⭐ on any tool to add it.
                </div>
            `;
            return;
        }

        list.innerHTML = favorites.map((fav, index) => `
            <div class="fav-item" data-tooltip="${SPECTRE_UTILS.string.escapeHtml(fav.desc || fav.name)}">
                <span>⭐</span>
                <span class="history-text">${SPECTRE_UTILS.string.escapeHtml(fav.name)}</span>
                <button class="btn btn-xs" 
                        onclick="SPECTRE.ui.removeFavoriteFromUI(${index}); event.stopPropagation();"
                        data-tooltip="Remove from favorites">✕</button>
            </div>
        `).join('');
    },

    /**
     * Remove favorite and update UI
     * @param {number} index - Favorite index
     */
    removeFavoriteFromUI(index) {
        const removed = SPECTRE_STORAGE.removeFavoriteByIndex(index);
        if (removed) {
            this.toast(`Removed ${removed.name}`, 'info');
            this.renderFavorites();
        }
    },

    // ==========================================
    // Event Listeners Setup
    // ==========================================

    /**
     * Initialize all UI event listeners
     */
    initEventListeners() {
        // Close dropdowns on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                this.closeAllDropdowns();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape - close modals/dropdowns
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeAllDropdowns();
                this.closeSidebar();
            }

            // Ctrl+K - focus filter
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                const filter = document.getElementById('toolSearch');
                if (filter) filter.focus();
            }

            // Ctrl+Enter - run search
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                if (typeof SPECTRE !== 'undefined' && SPECTRE.app) {
                    SPECTRE.app.runSearch();
                }
            }

            // Alt+H - go home
            if (e.altKey && e.key === 'h') {
                e.preventDefault();
                if (typeof SPECTRE !== 'undefined' && SPECTRE.app) {
                    SPECTRE.app.goHome();
                }
            }

            // Alt+E - expand all
            if (e.altKey && e.key === 'e') {
                e.preventDefault();
                if (typeof SPECTRE !== 'undefined' && SPECTRE.app) {
                    SPECTRE.app.expandAll();
                }
            }

            // Alt+C - collapse all
            if (e.altKey && e.key === 'c') {
                e.preventDefault();
                if (typeof SPECTRE !== 'undefined' && SPECTRE.app) {
                    SPECTRE.app.collapseAll();
                }
            }
        });

        // Handle window resize for mobile sidebar
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (window.innerWidth >= 768) {
                    this.closeSidebar();
                }
            }, 100);
        });

        console.log('[SPECTRE UI] Event listeners initialized');
    }
};

// Export for global access
if (typeof window !== 'undefined') {
    window.SPECTRE_UI = SPECTRE_UI;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPECTRE_UI;
}
