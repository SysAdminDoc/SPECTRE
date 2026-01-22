/* ============================================
   SPECTRE - Command Palette Module
   Version: 2.1.0
   
   Quick keyboard-driven command interface:
   - Ctrl+K to open
   - Fuzzy search across all actions
   - Tool search, workflow execution
   - Navigation and exports
   - Recent commands history
   
   Dependencies: utils.js, ui.js
   ============================================ */

const SPECTRE_COMMAND_PALETTE = {

    // State
    isOpen: false,
    selectedIndex: 0,
    recentCommands: [],
    maxRecent: 5,

    /**
     * Command definitions
     */
    commands: [
        // Navigation
        { id: 'nav-home', label: 'Go to Home', category: 'Navigation', icon: '🏠', action: () => SPECTRE.ui.showLanding() },
        { id: 'nav-results', label: 'Go to Results', category: 'Navigation', icon: '📊', action: () => SPECTRE.ui.showResults() },
        { id: 'toggle-sidebar', label: 'Toggle Sidebar', category: 'Navigation', icon: '☰', action: () => SPECTRE.ui.toggleSidebar(), shortcut: 'Ctrl+B' },
        { id: 'toggle-extended', label: 'Toggle Extended Fields', category: 'Navigation', icon: '➕', action: () => SPECTRE.ui.toggleExtended() },

        // Search Actions
        { id: 'search-run', label: 'Run Search', category: 'Search', icon: '🔍', action: () => SPECTRE.app.renderAllTools(), shortcut: 'Enter' },
        { id: 'search-clear', label: 'Clear All Fields', category: 'Search', icon: '✕', action: () => SPECTRE.app.clearAll() },
        { id: 'expand-all', label: 'Expand All Categories', category: 'Search', icon: '⬇️', action: () => SPECTRE.app.expandAll() },
        { id: 'collapse-all', label: 'Collapse All Categories', category: 'Search', icon: '⬆️', action: () => SPECTRE.app.collapseAll() },
        { id: 'open-all', label: 'Open All Active Tools', category: 'Search', icon: '🚀', action: () => SPECTRE.app.openAllLinks() },
        { id: 'copy-all', label: 'Copy All URLs', category: 'Search', icon: '📋', action: () => SPECTRE.app.copyAllLinks() },

        // Workflows
        { id: 'workflow-person', label: 'Workflow: Full Person Workup', category: 'Workflows', icon: '👤', action: () => SPECTRE.workflows?.runWorkflow('person-full') },
        { id: 'workflow-domain', label: 'Workflow: Domain Recon', category: 'Workflows', icon: '🌐', action: () => SPECTRE.workflows?.runWorkflow('domain-recon') },
        { id: 'workflow-email', label: 'Workflow: Email OSINT', category: 'Workflows', icon: '📧', action: () => SPECTRE.workflows?.runWorkflow('email-osint') },
        { id: 'workflow-username', label: 'Workflow: Username Enumeration', category: 'Workflows', icon: '🔎', action: () => SPECTRE.workflows?.runWorkflow('username-enum') },
        { id: 'workflow-ip', label: 'Workflow: IP Analysis', category: 'Workflows', icon: '🔌', action: () => SPECTRE.workflows?.runWorkflow('ip-analysis') },
        { id: 'workflow-business', label: 'Workflow: Business Intel', category: 'Workflows', icon: '🏢', action: () => SPECTRE.workflows?.runWorkflow('business-intel') },
        { id: 'workflow-manager', label: 'Open Workflow Manager', category: 'Workflows', icon: '⚙️', action: () => SPECTRE.workflows?.showWorkflowsModal() },

        // Export
        { id: 'export-json', label: 'Export as JSON', category: 'Export', icon: '📄', action: () => SPECTRE.export.exportAs('json') },
        { id: 'export-csv', label: 'Export as CSV', category: 'Export', icon: '📊', action: () => SPECTRE.export.exportAs('csv') },
        { id: 'export-markdown', label: 'Export as Markdown', category: 'Export', icon: '📝', action: () => SPECTRE.export.exportAs('markdown') },
        { id: 'export-html', label: 'Export as HTML Report', category: 'Export', icon: '🌐', action: () => SPECTRE.export.exportAs('html') },

        // Case Management
        { id: 'case-manager', label: 'Open Case Manager', category: 'Cases', icon: '📁', action: () => SPECTRE.cases?.showCaseManagerModal() },
        { id: 'case-new', label: 'Create New Case', category: 'Cases', icon: '➕', action: () => SPECTRE.cases?.showNewCaseModal() },
        { id: 'case-save-search', label: 'Save Current Search to Case', category: 'Cases', icon: '💾', action: () => SPECTRE.cases?.saveCurrentSearch() },

        // Tools
        { id: 'custom-tools', label: 'Open Custom Tools Manager', category: 'Tools', icon: '🛠️', action: () => SPECTRE.customTools?.showCustomToolsModal() },
        { id: 'custom-tool-new', label: 'Add New Custom Tool', category: 'Tools', icon: '➕', action: () => SPECTRE.customTools?.showAddToolModal() },
        { id: 'suggestions', label: 'Show Smart Suggestions', category: 'Tools', icon: '💡', action: () => SPECTRE.suggestions?.showSuggestionsModal() },

        // Share
        { id: 'share-url', label: 'Copy Shareable URL', category: 'Share', icon: '🔗', action: () => SPECTRE.urlState?.copyShareableUrl() },
        { id: 'share-qr', label: 'Generate QR Code', category: 'Share', icon: '📱', action: () => SPECTRE.urlState?.showQRCode() },
        { id: 'share-modal', label: 'Open Share Options', category: 'Share', icon: '📤', action: () => SPECTRE.urlState?.showShareModal() },

        // Bulk Operations
        { id: 'bulk-input', label: 'Bulk Input Processing', category: 'Bulk', icon: '📋', action: () => SPECTRE.bulk?.showBulkInputModal() },
        
        // Workspace
        { id: 'workspace-open', label: 'Open Results Workspace', category: 'Workspace', icon: '🖥️', action: () => SPECTRE.workspace?.openWorkspace() },

        // Settings
        { id: 'settings', label: 'Open Settings', category: 'Settings', icon: '⚙️', action: () => SPECTRE.ui.showSettingsModal() },
        { id: 'help', label: 'Show Help & Shortcuts', category: 'Settings', icon: '❓', action: () => SPECTRE.ui.showHelpModal() },
        { id: 'about', label: 'About SPECTRE', category: 'Settings', icon: 'ℹ️', action: () => SPECTRE.ui.showAboutModal() },

        // Presets
        { id: 'preset-person', label: 'Preset: Person Dossier', category: 'Presets', icon: '👤', action: () => SPECTRE.app.applyPreset('person') },
        { id: 'preset-social', label: 'Preset: Social Sweep', category: 'Presets', icon: '📱', action: () => SPECTRE.app.applyPreset('social') },
        { id: 'preset-technical', label: 'Preset: Technical Recon', category: 'Presets', icon: '🔧', action: () => SPECTRE.app.applyPreset('technical') },
        { id: 'preset-business', label: 'Preset: Business Intel', category: 'Presets', icon: '🏢', action: () => SPECTRE.app.applyPreset('business') },

        // Theme
        { id: 'theme-dark', label: 'Theme: Dark', category: 'Theme', icon: '🌙', action: () => SPECTRE.ui.setTheme('dark') },
        { id: 'theme-light', label: 'Theme: Light', category: 'Theme', icon: '☀️', action: () => SPECTRE.ui.setTheme('light') },
        { id: 'theme-hacker', label: 'Theme: Hacker', category: 'Theme', icon: '💻', action: () => SPECTRE.ui.setTheme('hacker') },
        { id: 'theme-nord', label: 'Theme: Nord', category: 'Theme', icon: '❄️', action: () => SPECTRE.ui.setTheme('nord') },
        { id: 'theme-contrast', label: 'Theme: High Contrast', category: 'Theme', icon: '🔲', action: () => SPECTRE.ui.setTheme('high-contrast') },
    ],

    /**
     * Initialize command palette
     */
    init() {
        this.loadRecentCommands();
        this.injectStyles();
        this.createPaletteElement();
        this.bindGlobalShortcuts();
        this.buildToolCommands();
        console.log('[SPECTRE] Command Palette initialized');
    },

    /**
     * Build commands for all tools
     */
    buildToolCommands() {
        const toolsDB = window.SPECTRE_TOOLS || {};
        
        Object.entries(toolsDB).forEach(([categoryId, category]) => {
            if (!category.tools) return;
            
            category.tools.forEach(tool => {
                this.commands.push({
                    id: `tool-${categoryId}-${tool.name.toLowerCase().replace(/\s+/g, '-')}`,
                    label: `Tool: ${tool.name}`,
                    category: category.name,
                    icon: category.icon || '🔧',
                    description: tool.desc,
                    action: () => this.openTool(tool, categoryId)
                });
            });
        });
    },

    /**
     * Open a specific tool
     */
    openTool(tool, categoryId) {
        const values = SPECTRE.app?.gatherSearchValues('results') || {};
        const url = SPECTRE_UTILS.url.buildToolUrl(tool.url, values);
        
        if (url) {
            window.open(url, '_blank');
            SPECTRE.ui?.toast(`Opening ${tool.name}`, 'success');
        } else {
            SPECTRE.ui?.toast(`${tool.name} requires input values`, 'warning');
        }
    },

    /**
     * Load recent commands from storage
     */
    loadRecentCommands() {
        try {
            const stored = localStorage.getItem('spectre_recent_commands');
            this.recentCommands = stored ? JSON.parse(stored) : [];
        } catch {
            this.recentCommands = [];
        }
    },

    /**
     * Save recent commands to storage
     */
    saveRecentCommands() {
        try {
            localStorage.setItem('spectre_recent_commands', JSON.stringify(this.recentCommands.slice(0, this.maxRecent)));
        } catch {}
    },

    /**
     * Add command to recent
     */
    addToRecent(commandId) {
        this.recentCommands = this.recentCommands.filter(id => id !== commandId);
        this.recentCommands.unshift(commandId);
        this.recentCommands = this.recentCommands.slice(0, this.maxRecent);
        this.saveRecentCommands();
    },

    /**
     * Inject CSS styles
     */
    injectStyles() {
        const style = document.createElement('style');
        style.id = 'spectre-command-palette-styles';
        style.textContent = `
            .command-palette-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
                z-index: 10000;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                padding-top: 15vh;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.15s ease, visibility 0.15s ease;
            }
            .command-palette-overlay.open {
                opacity: 1;
                visibility: visible;
            }
            .command-palette {
                background: var(--bg-primary);
                border: 1px solid var(--border-default);
                border-radius: 12px;
                width: 90%;
                max-width: 600px;
                max-height: 70vh;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                transform: scale(0.95) translateY(-10px);
                transition: transform 0.15s ease;
                overflow: hidden;
            }
            .command-palette-overlay.open .command-palette {
                transform: scale(1) translateY(0);
            }
            .command-palette-header {
                padding: 1rem;
                border-bottom: 1px solid var(--border-subtle);
            }
            .command-palette-input {
                width: 100%;
                background: var(--bg-tertiary);
                border: 1px solid var(--border-default);
                border-radius: 8px;
                padding: 0.75rem 1rem;
                font-size: 1rem;
                color: var(--text-primary);
                font-family: var(--font-display);
            }
            .command-palette-input:focus {
                outline: none;
                border-color: var(--accent-primary);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
            }
            .command-palette-input::placeholder {
                color: var(--text-muted);
            }
            .command-palette-results {
                max-height: calc(70vh - 80px);
                overflow-y: auto;
            }
            .command-palette-group {
                padding: 0.5rem 0;
            }
            .command-palette-group-title {
                padding: 0.5rem 1rem;
                font-size: 0.7rem;
                font-weight: 600;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .command-palette-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.65rem 1rem;
                cursor: pointer;
                transition: background 0.1s ease;
            }
            .command-palette-item:hover,
            .command-palette-item.selected {
                background: var(--bg-hover);
            }
            .command-palette-item.selected {
                background: rgba(59, 130, 246, 0.15);
            }
            .command-palette-item-icon {
                font-size: 1.1rem;
                width: 24px;
                text-align: center;
            }
            .command-palette-item-content {
                flex: 1;
                min-width: 0;
            }
            .command-palette-item-label {
                font-size: 0.9rem;
                color: var(--text-primary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .command-palette-item-description {
                font-size: 0.75rem;
                color: var(--text-muted);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .command-palette-item-shortcut {
                font-size: 0.7rem;
                padding: 0.2rem 0.4rem;
                background: var(--bg-tertiary);
                border: 1px solid var(--border-subtle);
                border-radius: 4px;
                color: var(--text-muted);
                font-family: var(--font-mono);
            }
            .command-palette-empty {
                padding: 2rem;
                text-align: center;
                color: var(--text-muted);
            }
            .command-palette-footer {
                padding: 0.5rem 1rem;
                border-top: 1px solid var(--border-subtle);
                display: flex;
                gap: 1rem;
                font-size: 0.7rem;
                color: var(--text-muted);
            }
            .command-palette-footer kbd {
                background: var(--bg-tertiary);
                padding: 0.15rem 0.35rem;
                border-radius: 3px;
                font-family: var(--font-mono);
            }
            .command-palette-highlight {
                color: var(--accent-primary);
                font-weight: 600;
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Create palette DOM element
     */
    createPaletteElement() {
        const overlay = document.createElement('div');
        overlay.id = 'commandPaletteOverlay';
        overlay.className = 'command-palette-overlay';
        overlay.innerHTML = `
            <div class="command-palette" onclick="event.stopPropagation()">
                <div class="command-palette-header">
                    <input type="text" class="command-palette-input" id="commandPaletteInput" 
                           placeholder="Type a command or search..." autocomplete="off" spellcheck="false">
                </div>
                <div class="command-palette-results" id="commandPaletteResults"></div>
                <div class="command-palette-footer">
                    <span><kbd>↑↓</kbd> Navigate</span>
                    <span><kbd>Enter</kbd> Select</span>
                    <span><kbd>Esc</kbd> Close</span>
                </div>
            </div>
        `;
        
        overlay.addEventListener('click', () => this.close());
        document.body.appendChild(overlay);

        // Input event listeners
        const input = document.getElementById('commandPaletteInput');
        input.addEventListener('input', (e) => this.handleInput(e.target.value));
        input.addEventListener('keydown', (e) => this.handleKeydown(e));
    },

    /**
     * Bind global keyboard shortcuts
     */
    bindGlobalShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+K or Cmd+K to open
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }
            // Escape to close
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    },

    /**
     * Toggle palette
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    },

    /**
     * Open palette
     */
    open() {
        this.isOpen = true;
        this.selectedIndex = 0;
        const overlay = document.getElementById('commandPaletteOverlay');
        const input = document.getElementById('commandPaletteInput');
        
        overlay.classList.add('open');
        input.value = '';
        input.focus();
        
        this.renderResults('');
    },

    /**
     * Close palette
     */
    close() {
        this.isOpen = false;
        const overlay = document.getElementById('commandPaletteOverlay');
        overlay.classList.remove('open');
    },

    /**
     * Handle input changes
     */
    handleInput(query) {
        this.selectedIndex = 0;
        this.renderResults(query);
    },

    /**
     * Handle keyboard navigation
     */
    handleKeydown(e) {
        const results = this.currentResults || [];
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, results.length - 1);
                this.updateSelection();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this.updateSelection();
                break;
            case 'Enter':
                e.preventDefault();
                if (results[this.selectedIndex]) {
                    this.executeCommand(results[this.selectedIndex]);
                }
                break;
            case 'Tab':
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex + 1) % results.length;
                this.updateSelection();
                break;
        }
    },

    /**
     * Update visual selection
     */
    updateSelection() {
        const items = document.querySelectorAll('.command-palette-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedIndex);
            if (index === this.selectedIndex) {
                item.scrollIntoView({ block: 'nearest' });
            }
        });
    },

    /**
     * Fuzzy search commands
     */
    searchCommands(query) {
        if (!query) {
            // Show recent commands first, then popular ones
            const recent = this.recentCommands
                .map(id => this.commands.find(c => c.id === id))
                .filter(Boolean);
            
            const popular = this.commands.filter(c => 
                ['search-run', 'workflow-person', 'export-json', 'settings', 'bulk-input', 'workspace-open'].includes(c.id)
            );
            
            // Combine recent and popular, remove duplicates
            const combined = [...recent];
            popular.forEach(cmd => {
                if (!combined.find(c => c.id === cmd.id)) {
                    combined.push(cmd);
                }
            });
            
            return combined.slice(0, 10);
        }

        const lowerQuery = query.toLowerCase();
        const words = lowerQuery.split(/\s+/);

        return this.commands
            .map(cmd => {
                const label = cmd.label.toLowerCase();
                const category = cmd.category.toLowerCase();
                const desc = (cmd.description || '').toLowerCase();
                
                let score = 0;
                
                // Exact match boost
                if (label.includes(lowerQuery)) score += 100;
                if (category.includes(lowerQuery)) score += 50;
                
                // Word matching
                words.forEach(word => {
                    if (label.includes(word)) score += 30;
                    if (category.includes(word)) score += 15;
                    if (desc.includes(word)) score += 10;
                });
                
                // Starts with boost
                if (label.startsWith(lowerQuery)) score += 50;
                
                return { ...cmd, score };
            })
            .filter(cmd => cmd.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 15);
    },

    /**
     * Highlight matching text
     */
    highlightMatch(text, query) {
        if (!query) return SPECTRE_UTILS.string.escapeHtml(text);
        
        const escaped = SPECTRE_UTILS.string.escapeHtml(text);
        const words = query.toLowerCase().split(/\s+/);
        
        let result = escaped;
        words.forEach(word => {
            if (word) {
                const regex = new RegExp(`(${word})`, 'gi');
                result = result.replace(regex, '<span class="command-palette-highlight">$1</span>');
            }
        });
        
        return result;
    },

    /**
     * Render search results
     */
    renderResults(query) {
        const resultsContainer = document.getElementById('commandPaletteResults');
        const results = this.searchCommands(query);
        this.currentResults = results;

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="command-palette-empty">
                    No commands found for "${SPECTRE_UTILS.string.escapeHtml(query)}"
                </div>
            `;
            return;
        }

        // Group by category
        const grouped = {};
        results.forEach(cmd => {
            if (!grouped[cmd.category]) {
                grouped[cmd.category] = [];
            }
            grouped[cmd.category].push(cmd);
        });

        let html = '';
        let globalIndex = 0;

        Object.entries(grouped).forEach(([category, cmds]) => {
            html += `
                <div class="command-palette-group">
                    <div class="command-palette-group-title">${SPECTRE_UTILS.string.escapeHtml(category)}</div>
                    ${cmds.map(cmd => {
                        const isSelected = globalIndex === this.selectedIndex;
                        const itemHtml = `
                            <div class="command-palette-item ${isSelected ? 'selected' : ''}" 
                                 data-index="${globalIndex}"
                                 onclick="SPECTRE_COMMAND_PALETTE.executeCommand(SPECTRE_COMMAND_PALETTE.currentResults[${globalIndex}])">
                                <span class="command-palette-item-icon">${cmd.icon}</span>
                                <div class="command-palette-item-content">
                                    <div class="command-palette-item-label">${this.highlightMatch(cmd.label, query)}</div>
                                    ${cmd.description ? `<div class="command-palette-item-description">${this.highlightMatch(cmd.description, query)}</div>` : ''}
                                </div>
                                ${cmd.shortcut ? `<span class="command-palette-item-shortcut">${cmd.shortcut}</span>` : ''}
                            </div>
                        `;
                        globalIndex++;
                        return itemHtml;
                    }).join('')}
                </div>
            `;
        });

        resultsContainer.innerHTML = html;

        // Add hover listeners
        resultsContainer.querySelectorAll('.command-palette-item').forEach((item, index) => {
            item.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this.updateSelection();
            });
        });
    },

    /**
     * Execute a command
     */
    executeCommand(command) {
        if (!command) return;
        
        this.addToRecent(command.id);
        this.close();
        
        try {
            command.action();
        } catch (err) {
            console.error('[SPECTRE] Command execution error:', err);
            SPECTRE.ui?.toast(`Error executing command: ${command.label}`, 'error');
        }
    }
};

// Initialize on DOM ready
if (typeof window !== 'undefined') {
    window.SPECTRE_COMMAND_PALETTE = SPECTRE_COMMAND_PALETTE;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SPECTRE_COMMAND_PALETTE.init());
    } else {
        SPECTRE_COMMAND_PALETTE.init();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPECTRE_COMMAND_PALETTE;
}
