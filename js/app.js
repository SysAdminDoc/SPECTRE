/* ============================================
   SPECTRE - Application Module
   Version: 2.0.0 (Modular)
   
   Core application logic:
   - State management
   - Search execution
   - Results rendering
   - Tool filtering
   - Category management
   
   Dependencies: utils.js, storage.js, ui.js, tools-db.js
   ============================================ */

/**
 * SPECTRE Application Namespace
 */
const SPECTRE_APP = {

    /**
     * Application State
     */
    state: {
        mode: 'landing',           // 'landing' or 'results'
        filter: 'free',            // Badge filter: 'all', 'free', 'freemium', 'paid', 'cli'
        textFilter: '',            // Text search filter
        selectedCategory: 'all',   // Selected category
        checkedTools: new Set(),   // Tools marked as checked
        generatedLinks: [],        // Generated link objects
        allToolElements: []        // Cached tool DOM elements
    },

    /**
     * Get tools database
     */
    get toolsDB() {
        return window.SPECTRE_TOOLS || {};
    },

    // ==========================================
    // Search & Navigation
    // ==========================================

    /**
     * Execute main search
     * @param {string} mode - Search mode: 'normal' or 'lucky'
     */
    runSearch(mode = 'normal') {
        // Gather values from landing page inputs
        const values = this.gatherSearchValues('landing');
        
        // Check if any values provided
        const hasInput = Object.values(values).some(v => v && v.trim());
        if (!hasInput) {
            SPECTRE_UI.toast('Please enter at least one search parameter', 'warning');
            return;
        }

        // Save to history
        SPECTRE_STORAGE.addToHistory(values);

        // Copy values to results page inputs
        this.populateResultsInputs(values);

        // Switch to results mode
        this.switchToResults();

        // Render tools
        this.renderAllTools(mode);

        // Update UI
        SPECTRE_UI.renderHistory();
    },

    /**
     * Gather search values from inputs
     * @param {string} source - 'landing' or 'results'
     * @returns {Object} Search values
     */
    gatherSearchValues(source = 'results') {
        const prefix = source === 'landing' ? 'q' : '';
        
        const getValue = (id) => {
            const el = document.getElementById(prefix + id) || document.getElementById(id);
            return el ? el.value.trim() : '';
        };

        const first = getValue('First') || getValue('firstName') || getValue('first');
        const last = getValue('Last') || getValue('lastName') || getValue('last');

        return {
            first,
            last,
            First: SPECTRE_UTILS.string.capitalize(first),
            Last: SPECTRE_UTILS.string.capitalize(last),
            firstName: first,
            lastName: last,
            username: getValue('Username') || getValue('username'),
            email: getValue('Email') || getValue('email'),
            phone: getValue('Phone') || getValue('phone'),
            phoneClean: SPECTRE_UTILS.string.cleanPhone(getValue('Phone') || getValue('phone')),
            city: getValue('City') || getValue('city'),
            state: (getValue('State') || getValue('state')).toUpperCase(),
            domain: getValue('Domain') || getValue('domain'),
            ip: getValue('IP') || getValue('ip'),
            company: getValue('Company') || getValue('company'),
            streetAddress: getValue('Street') || getValue('streetAddress'),
            zip: getValue('Zip') || getValue('zip'),
            imageUrl: getValue('ImageUrl') || getValue('imageUrl'),
            vin: getValue('VIN') || getValue('vin'),
            crypto: getValue('Crypto') || getValue('crypto'),
            country: getValue('Country') || getValue('country') || 'US'
        };
    },

    /**
     * Populate results page inputs from values
     * @param {Object} values - Search values
     */
    populateResultsInputs(values) {
        const setInput = (id, value) => {
            const el = document.getElementById(id);
            if (el && value) el.value = value;
        };

        setInput('firstName', values.first);
        setInput('lastName', values.last);
        setInput('username', values.username);
        setInput('email', values.email);
        setInput('phone', values.phone);
        setInput('city', values.city);
        setInput('state', values.state);
        setInput('domain', values.domain);
        setInput('ip', values.ip);
        setInput('company', values.company);
        setInput('streetAddress', values.streetAddress);
        setInput('zip', values.zip);
        setInput('imageUrl', values.imageUrl);
        setInput('vin', values.vin);
        setInput('crypto', values.crypto);
        setInput('country', values.country);
    },

    /**
     * Switch to results view
     */
    switchToResults() {
        this.state.mode = 'results';
        
        const landing = document.getElementById('landingPage');
        const results = document.getElementById('resultsPage');
        
        if (landing) {
            landing.classList.add('fade-out');
            setTimeout(() => {
                landing.style.display = 'none';
                landing.classList.remove('fade-out');
            }, 300);
        }
        
        if (results) {
            results.classList.add('active');
            document.body.classList.add('results-mode');
        }
    },

    /**
     * Return to landing page
     */
    goHome() {
        this.state.mode = 'landing';
        
        const landing = document.getElementById('landingPage');
        const results = document.getElementById('resultsPage');
        
        if (results) {
            results.classList.remove('active');
        }
        
        if (landing) {
            landing.style.display = '';
            document.body.classList.remove('results-mode');
        }

        // Focus main search
        const mainInput = document.getElementById('mainSearchInput');
        if (mainInput) mainInput.focus();
    },

    // ==========================================
    // Tool Rendering
    // ==========================================

    /**
     * Render all tools based on current search values
     * @param {string} mode - 'normal' or 'lucky'
     */
    renderAllTools(mode = 'normal') {
        const grid = document.getElementById('resultsGrid');
        if (!grid) return;

        // Clear previous results
        grid.innerHTML = '';
        this.state.generatedLinks = [];
        let totalActive = 0;

        // Gather current values
        const values = this.gatherSearchValues('results');

        // Process each category
        Object.entries(this.toolsDB).forEach(([categoryId, category]) => {
            // Filter by selected category
            if (this.state.selectedCategory !== 'all' && 
                this.state.selectedCategory !== categoryId) {
                return;
            }

            // Create category card
            const card = document.createElement('div');
            card.className = 'category-card';
            card.dataset.category = categoryId;

            let activeInCategory = 0;
            let visibleInCategory = 0;

            // Process tools
            const toolsHtml = (category.tools || []).map((tool, index) => {
                // Build URL from template
                const url = SPECTRE_UTILS.url.buildFromTemplate(tool.url, values);
                
                // Skip if URL couldn't be built (missing required fields)
                if (!url) return '';

                activeInCategory++;
                totalActive++;

                // Track generated link
                this.state.generatedLinks.push({
                    id: `${categoryId}-${index}`,
                    name: tool.name,
                    url: url,
                    badge: tool.badge,
                    category: category.name,
                    desc: tool.desc
                });

                // Check visibility based on current filter
                const visible = this.state.filter === 'all' || tool.badge === this.state.filter;
                if (visible) visibleInCategory++;

                // Check if favorited
                const isFavorited = SPECTRE_STORAGE.isFavorite(tool.name);
                const isChecked = this.state.checkedTools.has(`${categoryId}-${index}`);

                return `
                    <div class="tool-item ${visible ? '' : 'filter-hidden'} ${isChecked ? 'checked' : ''}" 
                         data-tool-id="${categoryId}-${index}"
                         data-badge="${tool.badge}">
                        <div class="tool-checkbox ${isChecked ? 'checked' : ''}" 
                             onclick="SPECTRE.app.toggleCheck('${categoryId}-${index}')"
                             data-tooltip="Mark as checked">
                            ${isChecked ? '✓' : ''}
                        </div>
                        <div class="tool-info">
                            <a href="${SPECTRE_UTILS.string.escapeHtml(url)}" 
                               class="tool-name" 
                               target="_blank" 
                               rel="noopener noreferrer"
                               onclick="SPECTRE.app.toggleCheck('${categoryId}-${index}')"
                               data-tooltip="Open ${tool.name}">
                                ${SPECTRE_UTILS.string.escapeHtml(tool.name)}
                            </a>
                            ${tool.desc ? `<div class="tool-desc">${SPECTRE_UTILS.string.escapeHtml(tool.desc)}</div>` : ''}
                        </div>
                        <div class="tool-badges">
                            <span class="badge badge-${tool.badge}" 
                                  data-tooltip="${this.getBadgeTooltip(tool.badge)}">
                                ${tool.badge}
                            </span>
                        </div>
                        <div class="tool-actions">
                            <button class="tool-action ${isFavorited ? 'favorited' : ''}" 
                                    onclick="SPECTRE.app.toggleFavorite('${categoryId}', ${index})"
                                    data-tooltip="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
                                ⭐
                            </button>
                            <button class="tool-action" 
                                    onclick="SPECTRE.app.copyToolUrl('${SPECTRE_UTILS.string.escapeHtml(url)}')"
                                    data-tooltip="Copy URL">
                                📋
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            // Skip empty categories
            if (activeInCategory === 0) return;

            // Build category card
            card.innerHTML = `
                <div class="category-header" 
                     onclick="SPECTRE.app.toggleCategory(this)"
                     data-tooltip="${SPECTRE_UTILS.string.escapeHtml(category.desc || category.name)}">
                    <div class="category-title">
                        <span class="category-icon">${category.icon || '📁'}</span>
                        <span class="category-name">${SPECTRE_UTILS.string.escapeHtml(category.name)}</span>
                        <span class="category-count active" data-tooltip="${activeInCategory} tools available">
                            ${activeInCategory}
                        </span>
                    </div>
                    <span class="category-toggle" data-tooltip="Click to expand/collapse">▼</span>
                </div>
                <div class="tool-list">${toolsHtml}</div>
            `;

            // Hide if no visible tools after filter
            if (visibleInCategory === 0) {
                card.classList.add('filter-hidden');
            }

            card.classList.add('has-results');
            grid.appendChild(card);
        });

        // Update statistics
        this.updateStats(totalActive);

        // Show empty state if no results
        if (totalActive === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-icon">🔍</div>
                    <div class="empty-title">No matching tools</div>
                    <div class="empty-text">
                        Enter search criteria above to see available OSINT tools. 
                        Try adding a name, username, email, domain, or other parameters.
                    </div>
                </div>
            `;
        }

        // Lucky mode - open first result
        if (mode === 'lucky' && this.state.generatedLinks.length > 0) {
            const firstActive = this.state.generatedLinks.find(l => {
                if (this.state.filter === 'all') return true;
                return l.badge === this.state.filter;
            });
            
            if (firstActive) {
                window.open(firstActive.url, '_blank');
                SPECTRE_UI.toast(`Opening ${firstActive.name}`, 'success');
            }
        }

        // Cache tool elements
        this.state.allToolElements = document.querySelectorAll('.tool-item');
    },

    /**
     * Get badge tooltip text
     * @param {string} badge - Badge type
     * @returns {string} Tooltip text
     */
    getBadgeTooltip(badge) {
        const tooltips = {
            'free': 'Completely free to use, no payment required',
            'freemium': 'Free tier available, premium features require payment',
            'paid': 'Requires payment or subscription to use',
            'cli': 'Command-line tool - requires terminal and installation'
        };
        return tooltips[badge] || badge;
    },

    /**
     * Update statistics display
     * @param {number} totalActive - Total active tools
     */
    updateStats(totalActive) {
        const activeEl = document.getElementById('activeCount');
        const checkedEl = document.getElementById('checkedCount');
        const visibleEl = document.getElementById('visibleCount');

        if (activeEl) activeEl.textContent = totalActive;
        if (checkedEl) checkedEl.textContent = this.state.checkedTools.size;
        
        this.updateVisibleCount();
        this.updateProgress();
    },

    /**
     * Update visible count based on current filter
     */
    updateVisibleCount() {
        const visible = document.querySelectorAll('.tool-item:not(.filter-hidden)').length;
        const visibleEl = document.getElementById('visibleCount');
        if (visibleEl) visibleEl.textContent = visible;
    },

    /**
     * Update progress bar
     */
    updateProgress() {
        const active = parseInt(document.getElementById('activeCount')?.textContent) || 0;
        const checked = this.state.checkedTools.size;
        const percent = active > 0 ? Math.round((checked / active) * 100) : 0;
        
        const fill = document.getElementById('progressFill');
        if (fill) fill.style.width = `${percent}%`;
    },

    // ==========================================
    // Filtering
    // ==========================================

    /**
     * Set badge filter
     * @param {string} filter - Filter type
     */
    setFilter(filter) {
        this.state.filter = filter;
        
        // Update filter pill active states
        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.classList.toggle('active', pill.dataset.filter === filter);
        });

        this.applyFilters();
    },

    /**
     * Apply all active filters
     */
    applyFilters() {
        let visibleCount = 0;

        document.querySelectorAll('.tool-item').forEach(item => {
            const badge = item.dataset.badge;
            const name = item.querySelector('.tool-name')?.textContent.toLowerCase() || '';
            const desc = item.querySelector('.tool-desc')?.textContent.toLowerCase() || '';
            
            // Text filter match
            const textMatch = this.state.textFilter === '' || 
                              name.includes(this.state.textFilter) ||
                              desc.includes(this.state.textFilter);

            // Badge filter match
            let badgeMatch = false;
            switch (this.state.filter) {
                case 'all':
                    badgeMatch = true;
                    break;
                default:
                    badgeMatch = badge === this.state.filter;
            }

            const shouldShow = textMatch && badgeMatch;
            item.classList.toggle('filter-hidden', !shouldShow);
            
            if (shouldShow) visibleCount++;
        });

        // Hide empty categories
        document.querySelectorAll('.category-card').forEach(card => {
            const visibleTools = card.querySelectorAll('.tool-item:not(.filter-hidden)');
            card.classList.toggle('filter-hidden', visibleTools.length === 0);
        });

        // Update visible count
        const visibleEl = document.getElementById('visibleCount');
        if (visibleEl) visibleEl.textContent = visibleCount;
    },

    /**
     * Filter tools by text search
     * @param {string} text - Search text
     */
    filterToolsByText(text) {
        this.state.textFilter = text.toLowerCase().trim();
        this.applyFilters();
    },

    // ==========================================
    // Tool Actions
    // ==========================================

    /**
     * Toggle category expand/collapse
     * @param {HTMLElement} header - Category header element
     */
    toggleCategory(header) {
        const card = header.closest('.category-card');
        if (card) card.classList.toggle('collapsed');
    },

    /**
     * Toggle tool checked state
     * @param {string} toolId - Tool ID
     */
    toggleCheck(toolId) {
        if (this.state.checkedTools.has(toolId)) {
            this.state.checkedTools.delete(toolId);
        } else {
            this.state.checkedTools.add(toolId);
        }

        // Update UI
        const item = document.querySelector(`[data-tool-id="${toolId}"]`);
        const checkbox = item?.querySelector('.tool-checkbox');
        
        if (item) item.classList.toggle('checked');
        if (checkbox) {
            checkbox.classList.toggle('checked');
            checkbox.textContent = this.state.checkedTools.has(toolId) ? '✓' : '';
        }

        // Update stats
        const checkedEl = document.getElementById('checkedCount');
        if (checkedEl) checkedEl.textContent = this.state.checkedTools.size;
        
        this.updateProgress();
    },

    /**
     * Toggle tool favorite status
     * @param {string} categoryId - Category ID
     * @param {number} index - Tool index
     */
    toggleFavorite(categoryId, index) {
        const tool = this.toolsDB[categoryId]?.tools?.[index];
        if (!tool) return;

        const isFavorited = SPECTRE_STORAGE.isFavorite(tool.name);
        
        if (isFavorited) {
            SPECTRE_STORAGE.removeFavorite(tool.name);
            SPECTRE_UI.toast(`Removed ${tool.name} from favorites`, 'info');
        } else {
            SPECTRE_STORAGE.addFavorite(tool, categoryId);
            SPECTRE_UI.toast(`Added ${tool.name} to favorites`, 'success');
        }

        // Update button state
        const btn = document.querySelector(`[data-tool-id="${categoryId}-${index}"] .tool-action`);
        if (btn) btn.classList.toggle('favorited');

        // Update sidebar
        SPECTRE_UI.renderFavorites();
    },

    /**
     * Copy tool URL to clipboard
     * @param {string} url - URL to copy
     */
    async copyToolUrl(url) {
        const success = await SPECTRE_UTILS.clipboard.copy(url);
        SPECTRE_UI.toast(success ? 'URL copied to clipboard' : 'Failed to copy', success ? 'success' : 'error');
    },

    /**
     * Expand all categories
     */
    expandAll() {
        document.querySelectorAll('.category-card').forEach(card => {
            card.classList.remove('collapsed');
        });
    },

    /**
     * Collapse all categories
     */
    collapseAll() {
        document.querySelectorAll('.category-card').forEach(card => {
            card.classList.add('collapsed');
        });
    },

    /**
     * Open all visible links
     */
    openAllLinks() {
        const links = this.state.generatedLinks.filter(link => {
            if (this.state.filter === 'all') return !this.state.checkedTools.has(link.id);
            return link.badge === this.state.filter && !this.state.checkedTools.has(link.id);
        });

        if (links.length === 0) {
            SPECTRE_UI.toast('No links to open', 'warning');
            return;
        }

        if (links.length > 10 && !confirm(`Open ${links.length} tabs? This may be resource intensive.`)) {
            return;
        }

        links.forEach((link, index) => {
            setTimeout(() => {
                window.open(link.url, '_blank');
                this.toggleCheck(link.id);
            }, index * 200);
        });

        SPECTRE_UI.toast(`Opening ${links.length} tools...`, 'info');
    },

    /**
     * Copy all links to clipboard
     */
    copyAllLinks() {
        SPECTRE_EXPORT.copyAllLinks();
    },

    /**
     * Clear all inputs and reset
     */
    clearAll() {
        // Clear all inputs except country
        document.querySelectorAll('input').forEach(input => {
            if (!['country', 'qCountry'].includes(input.id)) {
                input.value = '';
            }
        });

        // Reset state
        this.state.checkedTools.clear();
        this.state.generatedLinks = [];
        this.state.textFilter = '';
        
        const toolSearch = document.getElementById('toolSearch');
        if (toolSearch) toolSearch.value = '';

        this.validateInputHighlight();
        this.renderAllTools();
        
        SPECTRE_UI.toast('All fields cleared', 'info');
    },

    // ==========================================
    // Category Selection
    // ==========================================

    /**
     * Select a category
     * @param {string} category - Category ID or 'all'
     */
    selectCategory(category) {
        this.state.selectedCategory = category;
        
        document.querySelectorAll('.cat-pill').forEach(pill => {
            pill.classList.toggle('active', pill.dataset.cat === category);
        });
    },

    // ==========================================
    // Presets
    // ==========================================

    /**
     * Apply a search preset
     * @param {string} preset - Preset name
     */
    applyPreset(preset) {
        const presetMap = {
            'person': 'people',
            'social': 'social',
            'technical': 'domain',
            'business': 'business'
        };

        this.state.selectedCategory = presetMap[preset] || 'all';
        SPECTRE_UI.closeAllDropdowns();
        this.renderAllTools();
        SPECTRE_UI.toast(`Applied ${preset} preset`, 'info');
    },

    // ==========================================
    // History Management
    // ==========================================

    /**
     * Load a history entry
     * @param {number} index - History index
     */
    loadHistoryEntry(index) {
        const entry = SPECTRE_STORAGE.getHistoryEntry(index);
        if (!entry) return;

        const v = entry.values;
        
        // Populate results inputs
        this.populateResultsInputs(v);
        
        this.validateInputHighlight();
        this.renderAllTools();
        
        SPECTRE_UI.toast('Search loaded', 'info');
    },

    // ==========================================
    // Input Validation
    // ==========================================

    /**
     * Validate and highlight inputs
     */
    validateInputHighlight() {
        document.querySelectorAll('.input-pill input, .quick-field input, .adv-input input').forEach(input => {
            const hasValue = input.value.trim().length > 0;
            input.closest('.input-pill, .quick-field, .adv-input')?.classList.toggle('has-value', hasValue);
        });
    },

    // ==========================================
    // Smart Search Detection
    // ==========================================

    /**
     * Handle smart search input from main search bar
     * @param {string} value - Input value
     */
    handleSmartSearch(value) {
        if (!value) return;
        
        const trimmed = value.trim();
        const type = SPECTRE_UTILS.detect.inputType(trimmed);

        switch (type) {
            case 'email':
                document.getElementById('qEmail').value = trimmed;
                break;
            case 'phone':
                document.getElementById('qPhone').value = trimmed;
                break;
            case 'domain':
                document.getElementById('qDomain').value = trimmed;
                break;
            case 'ip':
                document.getElementById('qIP').value = trimmed;
                break;
            case 'username':
                document.getElementById('qUsername').value = trimmed;
                break;
            case 'name':
            default:
                const parts = trimmed.split(/\s+/);
                document.getElementById('qFirst').value = parts[0] || '';
                document.getElementById('qLast').value = parts.slice(1).join(' ') || '';
                break;
        }

        this.runSearch();
    }
};

// Export for global access
if (typeof window !== 'undefined') {
    window.SPECTRE_APP = SPECTRE_APP;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPECTRE_APP;
}
