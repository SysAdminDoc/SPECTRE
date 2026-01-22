/* ============================================
   SPECTRE - Results Workspace Module
   Version: 2.1.0
   
   Split-pane workspace for viewing tool results:
   - Left panel: tool list with status
   - Right panel: iframe preview
   - Notes panel for findings
   - Screenshot capture
   - Evidence collection
   
   Dependencies: utils.js, ui.js, case-manager.js
   ============================================ */

const SPECTRE_WORKSPACE = {

    // State
    state: {
        isOpen: false,
        activeToolIndex: 0,
        tools: [],
        notes: {},
        splitRatio: 0.35,
        currentUrl: null
    },

    // Configuration
    config: {
        minPanelWidth: 250,
        defaultNoteHeight: 150
    },

    /**
     * Initialize workspace
     */
    init() {
        this.injectStyles();
        this.createWorkspaceElement();
        this.bindEvents();
        console.log('[SPECTRE] Workspace initialized');
    },

    /**
     * Inject CSS styles
     */
    injectStyles() {
        if (document.getElementById('spectre-workspace-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'spectre-workspace-styles';
        style.textContent = `
            .workspace-overlay {
                position: fixed;
                inset: 0;
                background: var(--bg-primary);
                z-index: 9999;
                display: none;
                flex-direction: column;
            }
            .workspace-overlay.open {
                display: flex;
            }
            .workspace-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.75rem 1rem;
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-default);
            }
            .workspace-header-left {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            .workspace-title {
                font-size: 1rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .workspace-nav {
                display: flex;
                gap: 0.5rem;
            }
            .workspace-nav-btn {
                padding: 0.4rem 0.75rem;
                background: var(--bg-tertiary);
                border: 1px solid var(--border-default);
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.8rem;
                transition: all 0.15s ease;
            }
            .workspace-nav-btn:hover {
                background: var(--bg-hover);
            }
            .workspace-nav-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .workspace-header-actions {
                display: flex;
                gap: 0.5rem;
            }
            .workspace-body {
                flex: 1;
                display: flex;
                overflow: hidden;
            }
            .workspace-sidebar {
                width: 35%;
                min-width: 250px;
                max-width: 500px;
                background: var(--bg-secondary);
                border-right: 1px solid var(--border-default);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .workspace-sidebar-header {
                padding: 0.75rem;
                border-bottom: 1px solid var(--border-subtle);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .workspace-sidebar-title {
                font-size: 0.85rem;
                font-weight: 500;
            }
            .workspace-tool-count {
                font-size: 0.75rem;
                color: var(--text-muted);
                background: var(--bg-tertiary);
                padding: 0.2rem 0.5rem;
                border-radius: 4px;
            }
            .workspace-tool-list {
                flex: 1;
                overflow-y: auto;
            }
            .workspace-tool-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.6rem 0.75rem;
                cursor: pointer;
                border-bottom: 1px solid var(--border-subtle);
                transition: background 0.1s ease;
            }
            .workspace-tool-item:hover {
                background: var(--bg-hover);
            }
            .workspace-tool-item.active {
                background: rgba(59, 130, 246, 0.1);
                border-left: 3px solid var(--accent-primary);
            }
            .workspace-tool-status {
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
            }
            .workspace-tool-info {
                flex: 1;
                min-width: 0;
            }
            .workspace-tool-name {
                font-size: 0.85rem;
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .workspace-tool-category {
                font-size: 0.7rem;
                color: var(--text-muted);
            }
            .workspace-tool-actions {
                display: flex;
                gap: 0.25rem;
                opacity: 0;
                transition: opacity 0.15s ease;
            }
            .workspace-tool-item:hover .workspace-tool-actions {
                opacity: 1;
            }
            .workspace-tool-action {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--bg-tertiary);
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.75rem;
            }
            .workspace-tool-action:hover {
                background: var(--bg-hover);
            }
            .workspace-main {
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .workspace-iframe-container {
                flex: 1;
                position: relative;
                background: var(--bg-tertiary);
            }
            .workspace-iframe {
                width: 100%;
                height: 100%;
                border: none;
                background: white;
            }
            .workspace-iframe-placeholder {
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: var(--text-muted);
                gap: 1rem;
            }
            .workspace-iframe-placeholder-icon {
                font-size: 3rem;
                opacity: 0.5;
            }
            .workspace-iframe-blocked {
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: var(--bg-tertiary);
                color: var(--text-secondary);
                gap: 1rem;
                padding: 2rem;
                text-align: center;
            }
            .workspace-iframe-blocked-icon {
                font-size: 2.5rem;
            }
            .workspace-iframe-blocked p {
                max-width: 400px;
                line-height: 1.5;
            }
            .workspace-notes {
                height: 150px;
                border-top: 1px solid var(--border-default);
                display: flex;
                flex-direction: column;
            }
            .workspace-notes-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.5rem 0.75rem;
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-subtle);
            }
            .workspace-notes-title {
                font-size: 0.8rem;
                font-weight: 500;
            }
            .workspace-notes-actions {
                display: flex;
                gap: 0.5rem;
            }
            .workspace-notes-textarea {
                flex: 1;
                width: 100%;
                padding: 0.75rem;
                background: var(--bg-primary);
                border: none;
                color: var(--text-primary);
                font-family: var(--font-display);
                font-size: 0.85rem;
                resize: none;
            }
            .workspace-notes-textarea:focus {
                outline: none;
            }
            .workspace-notes-textarea::placeholder {
                color: var(--text-muted);
            }
            .workspace-url-bar {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 0.75rem;
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-subtle);
            }
            .workspace-url-input {
                flex: 1;
                padding: 0.4rem 0.6rem;
                background: var(--bg-tertiary);
                border: 1px solid var(--border-default);
                border-radius: 4px;
                color: var(--text-primary);
                font-family: var(--font-mono);
                font-size: 0.75rem;
            }
            .workspace-url-input:focus {
                outline: none;
                border-color: var(--accent-primary);
            }
            .workspace-url-btn {
                padding: 0.4rem 0.6rem;
                background: var(--bg-tertiary);
                border: 1px solid var(--border-default);
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.75rem;
            }
            .workspace-url-btn:hover {
                background: var(--bg-hover);
            }
            .workspace-filter {
                padding: 0.5rem 0.75rem;
            }
            .workspace-filter-input {
                width: 100%;
                padding: 0.4rem 0.6rem;
                background: var(--bg-tertiary);
                border: 1px solid var(--border-default);
                border-radius: 4px;
                color: var(--text-primary);
                font-size: 0.8rem;
            }
            .workspace-filter-input:focus {
                outline: none;
                border-color: var(--accent-primary);
            }
            .workspace-status-bar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.4rem 0.75rem;
                background: var(--bg-secondary);
                border-top: 1px solid var(--border-default);
                font-size: 0.75rem;
                color: var(--text-muted);
            }
            .workspace-status-left {
                display: flex;
                gap: 1rem;
            }
            .workspace-divider {
                width: 4px;
                background: var(--border-default);
                cursor: col-resize;
                transition: background 0.15s ease;
            }
            .workspace-divider:hover {
                background: var(--accent-primary);
            }
            .workspace-loading {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.5);
            }
            .workspace-loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid var(--border-default);
                border-top-color: var(--accent-primary);
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            .workspace-tool-item.checked .workspace-tool-status {
                color: var(--accent-green);
            }
            .workspace-tool-item.useful .workspace-tool-status {
                color: var(--accent-primary);
            }
            .workspace-tool-item.dead-end .workspace-tool-status {
                color: var(--accent-red);
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Create workspace DOM element
     */
    createWorkspaceElement() {
        const overlay = document.createElement('div');
        overlay.id = 'workspaceOverlay';
        overlay.className = 'workspace-overlay';
        overlay.innerHTML = `
            <div class="workspace-header">
                <div class="workspace-header-left">
                    <div class="workspace-title">
                        <span>🖥️</span>
                        <span>Results Workspace</span>
                    </div>
                    <div class="workspace-nav">
                        <button class="workspace-nav-btn" onclick="SPECTRE_WORKSPACE.previousTool()" id="workspacePrevBtn">
                            ← Previous
                        </button>
                        <button class="workspace-nav-btn" onclick="SPECTRE_WORKSPACE.nextTool()" id="workspaceNextBtn">
                            Next →
                        </button>
                    </div>
                </div>
                <div class="workspace-header-actions">
                    <button class="workspace-nav-btn" onclick="SPECTRE_WORKSPACE.openInNewTab()" title="Open in new tab">
                        ↗️ New Tab
                    </button>
                    <button class="workspace-nav-btn" onclick="SPECTRE_WORKSPACE.copyCurrentUrl()" title="Copy URL">
                        📋 Copy URL
                    </button>
                    <button class="workspace-nav-btn" onclick="SPECTRE_WORKSPACE.markTool('useful')" title="Mark as useful">
                        👍 Useful
                    </button>
                    <button class="workspace-nav-btn" onclick="SPECTRE_WORKSPACE.markTool('dead-end')" title="Mark as dead end">
                        👎 Dead End
                    </button>
                    <button class="workspace-nav-btn" onclick="SPECTRE_WORKSPACE.addFinding()" title="Add finding to case">
                        📝 Add Finding
                    </button>
                    <button class="workspace-nav-btn" onclick="SPECTRE_WORKSPACE.closeWorkspace()" title="Close workspace">
                        ✕ Close
                    </button>
                </div>
            </div>
            
            <div class="workspace-body">
                <div class="workspace-sidebar" id="workspaceSidebar">
                    <div class="workspace-sidebar-header">
                        <span class="workspace-sidebar-title">Tools</span>
                        <span class="workspace-tool-count" id="workspaceToolCount">0 tools</span>
                    </div>
                    <div class="workspace-filter">
                        <input type="text" class="workspace-filter-input" id="workspaceFilter" 
                               placeholder="Filter tools..." oninput="SPECTRE_WORKSPACE.filterTools(this.value)">
                    </div>
                    <div class="workspace-tool-list" id="workspaceToolList"></div>
                </div>
                
                <div class="workspace-divider" id="workspaceDivider"></div>
                
                <div class="workspace-main">
                    <div class="workspace-url-bar">
                        <input type="text" class="workspace-url-input" id="workspaceUrlInput" readonly>
                        <button class="workspace-url-btn" onclick="SPECTRE_WORKSPACE.refreshIframe()">↻ Refresh</button>
                    </div>
                    <div class="workspace-iframe-container" id="workspaceIframeContainer">
                        <div class="workspace-iframe-placeholder" id="workspacePlaceholder">
                            <div class="workspace-iframe-placeholder-icon">🔍</div>
                            <p>Select a tool from the list to preview</p>
                        </div>
                        <div class="workspace-iframe-blocked" id="workspaceBlocked" style="display: none;">
                            <div class="workspace-iframe-blocked-icon">🚫</div>
                            <p><strong>This site blocks iframe embedding.</strong></p>
                            <p>Click "New Tab" to view it in a separate window.</p>
                            <button class="workspace-nav-btn" onclick="SPECTRE_WORKSPACE.openInNewTab()">
                                ↗️ Open in New Tab
                            </button>
                        </div>
                        <iframe class="workspace-iframe" id="workspaceIframe" 
                                style="display: none;" 
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
                        <div class="workspace-loading" id="workspaceLoading" style="display: none;">
                            <div class="workspace-loading-spinner"></div>
                        </div>
                    </div>
                    <div class="workspace-notes">
                        <div class="workspace-notes-header">
                            <span class="workspace-notes-title">📝 Notes for this tool</span>
                            <div class="workspace-notes-actions">
                                <button class="workspace-url-btn" onclick="SPECTRE_WORKSPACE.saveNote()">💾 Save</button>
                            </div>
                        </div>
                        <textarea class="workspace-notes-textarea" id="workspaceNotesInput" 
                                  placeholder="Add notes about findings from this tool..."></textarea>
                    </div>
                </div>
            </div>
            
            <div class="workspace-status-bar">
                <div class="workspace-status-left">
                    <span id="workspaceStatusTool">No tool selected</span>
                    <span id="workspaceStatusProgress">0 / 0 checked</span>
                </div>
                <div>
                    <span>Press <kbd>←</kbd> <kbd>→</kbd> to navigate, <kbd>Esc</kbd> to close</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    },

    /**
     * Bind keyboard and resize events
     */
    bindEvents() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.state.isOpen) return;

            switch (e.key) {
                case 'Escape':
                    this.closeWorkspace();
                    break;
                case 'ArrowLeft':
                    if (!e.target.matches('input, textarea')) {
                        e.preventDefault();
                        this.previousTool();
                    }
                    break;
                case 'ArrowRight':
                    if (!e.target.matches('input, textarea')) {
                        e.preventDefault();
                        this.nextTool();
                    }
                    break;
            }
        });

        // Resize divider
        const divider = document.getElementById('workspaceDivider');
        if (divider) {
            let isResizing = false;
            
            divider.addEventListener('mousedown', (e) => {
                isResizing = true;
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                
                const sidebar = document.getElementById('workspaceSidebar');
                const container = document.querySelector('.workspace-body');
                if (!sidebar || !container) return;

                const containerRect = container.getBoundingClientRect();
                const newWidth = e.clientX - containerRect.left;
                
                if (newWidth >= this.config.minPanelWidth && newWidth <= containerRect.width - this.config.minPanelWidth) {
                    sidebar.style.width = `${newWidth}px`;
                    this.state.splitRatio = newWidth / containerRect.width;
                }
            });

            document.addEventListener('mouseup', () => {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            });
        }

        // Auto-save notes on input
        const notesInput = document.getElementById('workspaceNotesInput');
        if (notesInput) {
            notesInput.addEventListener('input', () => {
                this.saveNote(true); // Silent save
            });
        }
    },

    /**
     * Open workspace with current tools
     */
    openWorkspace() {
        // Gather active tools from current search
        const tools = this.gatherActiveTools();
        
        if (tools.length === 0) {
            SPECTRE_UI.toast('No active tools to display. Run a search first.', 'warning');
            return;
        }

        this.state.tools = tools;
        this.state.isOpen = true;
        this.state.activeToolIndex = 0;

        const overlay = document.getElementById('workspaceOverlay');
        overlay.classList.add('open');

        this.renderToolList();
        this.updateToolCount();
        
        // Select first tool
        this.selectTool(0);

        SPECTRE_UI.toast(`Workspace opened with ${tools.length} tools`, 'info');
    },

    /**
     * Close workspace
     */
    closeWorkspace() {
        this.state.isOpen = false;
        const overlay = document.getElementById('workspaceOverlay');
        overlay.classList.remove('open');
        
        // Clear iframe
        const iframe = document.getElementById('workspaceIframe');
        if (iframe) {
            iframe.src = 'about:blank';
            iframe.style.display = 'none';
        }
    },

    /**
     * Gather active tools from current search results
     */
    gatherActiveTools() {
        const tools = [];
        const values = SPECTRE.app?.gatherSearchValues('results') || {};
        const toolsDB = window.SPECTRE_TOOLS || {};

        Object.entries(toolsDB).forEach(([categoryId, category]) => {
            if (!category.tools) return;

            category.tools.forEach(tool => {
                const url = SPECTRE_UTILS.url.buildToolUrl(tool.url, values);
                if (url) {
                    tools.push({
                        name: tool.name,
                        url: url,
                        category: category.name,
                        categoryIcon: category.icon || '🔧',
                        badge: tool.badge,
                        status: 'unchecked',
                        notes: this.state.notes[tool.name] || ''
                    });
                }
            });
        });

        return tools;
    },

    /**
     * Render tool list
     */
    renderToolList(filter = '') {
        const container = document.getElementById('workspaceToolList');
        if (!container) return;

        const lowerFilter = filter.toLowerCase();
        const filteredTools = this.state.tools.filter(tool => 
            !filter || 
            tool.name.toLowerCase().includes(lowerFilter) ||
            tool.category.toLowerCase().includes(lowerFilter)
        );

        container.innerHTML = filteredTools.map((tool, index) => {
            const actualIndex = this.state.tools.indexOf(tool);
            const isActive = actualIndex === this.state.activeToolIndex;
            const statusIcon = this.getStatusIcon(tool.status);
            
            return `
                <div class="workspace-tool-item ${isActive ? 'active' : ''} ${tool.status}" 
                     data-index="${actualIndex}"
                     onclick="SPECTRE_WORKSPACE.selectTool(${actualIndex})">
                    <span class="workspace-tool-status">${statusIcon}</span>
                    <div class="workspace-tool-info">
                        <div class="workspace-tool-name">${SPECTRE_UTILS.string.escapeHtml(tool.name)}</div>
                        <div class="workspace-tool-category">${tool.categoryIcon} ${tool.category}</div>
                    </div>
                    <div class="workspace-tool-actions">
                        <button class="workspace-tool-action" onclick="event.stopPropagation(); SPECTRE_WORKSPACE.quickOpen(${actualIndex})" title="Open in new tab">
                            ↗️
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Get status icon
     */
    getStatusIcon(status) {
        const icons = {
            'unchecked': '⬜',
            'checked': '✅',
            'useful': '👍',
            'dead-end': '👎',
            'follow-up': '📌'
        };
        return icons[status] || '⬜';
    },

    /**
     * Filter tools
     */
    filterTools(value) {
        this.renderToolList(value);
    },

    /**
     * Select a tool
     */
    selectTool(index) {
        if (index < 0 || index >= this.state.tools.length) return;

        // Save current notes before switching
        this.saveNote(true);

        this.state.activeToolIndex = index;
        const tool = this.state.tools[index];
        this.state.currentUrl = tool.url;

        // Update UI
        this.renderToolList(document.getElementById('workspaceFilter')?.value || '');
        this.updateNavButtons();
        this.updateStatusBar();

        // Load tool
        this.loadTool(tool);

        // Load notes for this tool
        const notesInput = document.getElementById('workspaceNotesInput');
        if (notesInput) {
            notesInput.value = tool.notes || '';
        }

        // Update URL bar
        const urlInput = document.getElementById('workspaceUrlInput');
        if (urlInput) {
            urlInput.value = tool.url;
        }
    },

    /**
     * Load tool in iframe
     */
    loadTool(tool) {
        const iframe = document.getElementById('workspaceIframe');
        const placeholder = document.getElementById('workspacePlaceholder');
        const blocked = document.getElementById('workspaceBlocked');
        const loading = document.getElementById('workspaceLoading');

        // Show loading
        placeholder.style.display = 'none';
        blocked.style.display = 'none';
        iframe.style.display = 'none';
        loading.style.display = 'flex';

        // Sites that typically block iframes
        const blockedDomains = [
            'google.com', 'facebook.com', 'twitter.com', 'x.com', 'linkedin.com',
            'instagram.com', 'tiktok.com', 'youtube.com', 'github.com',
            'reddit.com', 'amazon.com', 'ebay.com', 'bing.com',
            'duckduckgo.com', 'yandex.com', 'baidu.com'
        ];

        try {
            const urlObj = new URL(tool.url);
            const domain = urlObj.hostname.replace('www.', '');
            
            const isBlocked = blockedDomains.some(d => domain.includes(d));

            if (isBlocked) {
                loading.style.display = 'none';
                blocked.style.display = 'flex';
                return;
            }

            // Try to load
            iframe.onload = () => {
                loading.style.display = 'none';
                iframe.style.display = 'block';
                
                // Mark as checked
                if (tool.status === 'unchecked') {
                    tool.status = 'checked';
                    this.renderToolList(document.getElementById('workspaceFilter')?.value || '');
                    this.updateStatusBar();
                }
            };

            iframe.onerror = () => {
                loading.style.display = 'none';
                blocked.style.display = 'flex';
            };

            iframe.src = tool.url;

            // Timeout for blocked sites
            setTimeout(() => {
                if (loading.style.display === 'flex') {
                    loading.style.display = 'none';
                    blocked.style.display = 'flex';
                }
            }, 10000);

        } catch (err) {
            loading.style.display = 'none';
            blocked.style.display = 'flex';
        }
    },

    /**
     * Update navigation buttons
     */
    updateNavButtons() {
        const prevBtn = document.getElementById('workspacePrevBtn');
        const nextBtn = document.getElementById('workspaceNextBtn');
        
        if (prevBtn) prevBtn.disabled = this.state.activeToolIndex === 0;
        if (nextBtn) nextBtn.disabled = this.state.activeToolIndex >= this.state.tools.length - 1;
    },

    /**
     * Update status bar
     */
    updateStatusBar() {
        const tool = this.state.tools[this.state.activeToolIndex];
        const checked = this.state.tools.filter(t => t.status !== 'unchecked').length;

        document.getElementById('workspaceStatusTool').textContent = 
            tool ? `${tool.categoryIcon} ${tool.name}` : 'No tool selected';
        document.getElementById('workspaceStatusProgress').textContent = 
            `${checked} / ${this.state.tools.length} checked`;
    },

    /**
     * Update tool count
     */
    updateToolCount() {
        const countEl = document.getElementById('workspaceToolCount');
        if (countEl) {
            countEl.textContent = `${this.state.tools.length} tools`;
        }
    },

    /**
     * Navigate to previous tool
     */
    previousTool() {
        if (this.state.activeToolIndex > 0) {
            this.selectTool(this.state.activeToolIndex - 1);
        }
    },

    /**
     * Navigate to next tool
     */
    nextTool() {
        if (this.state.activeToolIndex < this.state.tools.length - 1) {
            this.selectTool(this.state.activeToolIndex + 1);
        }
    },

    /**
     * Quick open tool in new tab
     */
    quickOpen(index) {
        const tool = this.state.tools[index];
        if (tool) {
            window.open(tool.url, '_blank');
        }
    },

    /**
     * Open current tool in new tab
     */
    openInNewTab() {
        const tool = this.state.tools[this.state.activeToolIndex];
        if (tool) {
            window.open(tool.url, '_blank');
            SPECTRE_UI.toast('Opened in new tab', 'info');
        }
    },

    /**
     * Copy current URL
     */
    copyCurrentUrl() {
        const tool = this.state.tools[this.state.activeToolIndex];
        if (tool) {
            navigator.clipboard.writeText(tool.url).then(() => {
                SPECTRE_UI.toast('URL copied to clipboard', 'success');
            });
        }
    },

    /**
     * Refresh iframe
     */
    refreshIframe() {
        const tool = this.state.tools[this.state.activeToolIndex];
        if (tool) {
            this.loadTool(tool);
        }
    },

    /**
     * Mark tool with status
     */
    markTool(status) {
        const tool = this.state.tools[this.state.activeToolIndex];
        if (tool) {
            tool.status = status;
            this.renderToolList(document.getElementById('workspaceFilter')?.value || '');
            this.updateStatusBar();
            SPECTRE_UI.toast(`Marked as ${status}`, 'success');
        }
    },

    /**
     * Save note for current tool
     */
    saveNote(silent = false) {
        const tool = this.state.tools[this.state.activeToolIndex];
        const notesInput = document.getElementById('workspaceNotesInput');
        
        if (tool && notesInput) {
            tool.notes = notesInput.value;
            this.state.notes[tool.name] = notesInput.value;
            
            if (!silent) {
                SPECTRE_UI.toast('Note saved', 'success');
            }
        }
    },

    /**
     * Add finding to active case
     */
    addFinding() {
        const tool = this.state.tools[this.state.activeToolIndex];
        if (!tool) return;

        if (!SPECTRE.cases) {
            SPECTRE_UI.toast('Case Manager not available', 'warning');
            return;
        }

        const activeCase = SPECTRE.cases.getActiveCase();
        if (!activeCase) {
            SPECTRE_UI.toast('No active case. Create one first.', 'warning');
            return;
        }

        const notesInput = document.getElementById('workspaceNotesInput');
        const notes = notesInput?.value || '';

        // Show finding modal
        SPECTRE_UI.showModal('📝 Add Finding', `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Source</label>
                    <input type="text" class="form-input" id="findingSource" value="${SPECTRE_UTILS.string.escapeHtml(tool.name)}" readonly style="width: 100%;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Finding</label>
                    <textarea class="bulk-textarea" id="findingContent" placeholder="Describe what you found..." style="min-height: 100px;">${SPECTRE_UTILS.string.escapeHtml(notes)}</textarea>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Importance</label>
                    <select class="form-input" id="findingImportance" style="width: 100%;">
                        <option value="low">Low</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">URL</label>
                    <input type="text" class="form-input" id="findingUrl" value="${SPECTRE_UTILS.string.escapeHtml(tool.url)}" style="width: 100%;">
                </div>
            </div>
        `, [
            { text: 'Cancel', action: 'SPECTRE.ui.closeModal()' },
            { text: '💾 Save Finding', action: 'SPECTRE_WORKSPACE.saveFinding()', primary: true }
        ]);
    },

    /**
     * Save finding to case
     */
    saveFinding() {
        const content = document.getElementById('findingContent')?.value;
        const importance = document.getElementById('findingImportance')?.value || 'medium';
        const source = document.getElementById('findingSource')?.value;
        const url = document.getElementById('findingUrl')?.value;

        if (!content?.trim()) {
            SPECTRE_UI.toast('Please enter finding content', 'warning');
            return;
        }

        if (SPECTRE.cases) {
            SPECTRE.cases.addFinding({
                content: content.trim(),
                importance,
                source,
                url
            });
            
            SPECTRE_UI.closeModal();
            SPECTRE_UI.toast('Finding added to case', 'success');
        }
    }
};

// Initialize on DOM ready
if (typeof window !== 'undefined') {
    window.SPECTRE_WORKSPACE = SPECTRE_WORKSPACE;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SPECTRE_WORKSPACE.init());
    } else {
        SPECTRE_WORKSPACE.init();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPECTRE_WORKSPACE;
}
