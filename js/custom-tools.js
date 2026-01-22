/* ============================================
   SPECTRE - Custom Tools Module
   Version: 2.1.0
   
   Power user tool for adding custom OSINT tools:
   - Simple form-based tool creation
   - URL template with placeholders
   - Import/export custom tool collections
   - Sync with localStorage
   - Community tool sharing support
   
   Dependencies: utils.js, storage.js, ui.js, tools-db.js
   ============================================ */

/**
 * SPECTRE Custom Tools Namespace
 */
const SPECTRE_CUSTOM_TOOLS = {

    /**
     * Storage Keys
     */
    KEYS: {
        CUSTOM_TOOLS: 'spectre-custom-tools',
        CUSTOM_CATEGORIES: 'spectre-custom-categories'
    },

    /**
     * Configuration
     */
    CONFIG: {
        MAX_CUSTOM_TOOLS: 200,
        MAX_CUSTOM_CATEGORIES: 20,
        AVAILABLE_BADGES: ['free', 'freemium', 'paid', 'cli', 'custom'],
        AVAILABLE_FIELDS: [
            { id: 'firstName', label: 'First Name', placeholder: '{first}' },
            { id: 'lastName', label: 'Last Name', placeholder: '{last}' },
            { id: 'username', label: 'Username', placeholder: '{username}' },
            { id: 'email', label: 'Email', placeholder: '{email}' },
            { id: 'phone', label: 'Phone', placeholder: '{phone}' },
            { id: 'phoneClean', label: 'Phone (digits only)', placeholder: '{phoneClean}' },
            { id: 'domain', label: 'Domain', placeholder: '{domain}' },
            { id: 'ip', label: 'IP Address', placeholder: '{ip}' },
            { id: 'company', label: 'Company', placeholder: '{company}' },
            { id: 'city', label: 'City', placeholder: '{city}' },
            { id: 'state', label: 'State', placeholder: '{state}' },
            { id: 'zip', label: 'ZIP Code', placeholder: '{zip}' },
            { id: 'country', label: 'Country', placeholder: '{country}' },
            { id: 'streetAddress', label: 'Street Address', placeholder: '{streetAddress}' },
            { id: 'imageUrl', label: 'Image URL', placeholder: '{imageUrl}' },
            { id: 'vin', label: 'VIN', placeholder: '{vin}' },
            { id: 'crypto', label: 'Crypto Address', placeholder: '{crypto}' }
        ]
    },

    /**
     * In-memory cache
     */
    _cache: {
        tools: null,
        categories: null
    },

    // ==========================================
    // Initialization
    // ==========================================

    /**
     * Initialize custom tools module
     */
    init() {
        this._cache.tools = this.getCustomTools();
        this._cache.categories = this.getCustomCategories();
        
        // Merge custom tools into main tools DB
        this.mergeIntoToolsDB();
        
        console.log('[SPECTRE Custom Tools] Initialized:', {
            customTools: this._cache.tools.length,
            customCategories: this._cache.categories.length
        });
    },

    // ==========================================
    // Custom Tools CRUD
    // ==========================================

    /**
     * Get all custom tools
     * @returns {Array} Custom tools array
     */
    getCustomTools() {
        if (this._cache.tools) return this._cache.tools;
        return SPECTRE_STORAGE.get(this.KEYS.CUSTOM_TOOLS, []);
    },

    /**
     * Get a custom tool by ID
     * @param {string} toolId - Tool ID
     * @returns {Object|null} Tool or null
     */
    getCustomTool(toolId) {
        const tools = this.getCustomTools();
        return tools.find(t => t.id === toolId) || null;
    },

    /**
     * Add a new custom tool
     * @param {Object} toolData - Tool configuration
     * @returns {Object} Created tool
     */
    addCustomTool(toolData) {
        const tools = this.getCustomTools();

        // Validate URL template
        if (!this.validateUrlTemplate(toolData.url)) {
            throw new Error('Invalid URL template. Must include at least one placeholder like {username}');
        }

        // Detect fields from URL if not provided
        const detectedFields = toolData.fields || this.detectFieldsFromUrl(toolData.url);

        const newTool = {
            id: SPECTRE_UTILS.string.uniqueId('custom-tool'),
            name: toolData.name || 'Untitled Tool',
            url: toolData.url,
            badge: toolData.badge || 'custom',
            fields: detectedFields,
            desc: toolData.desc || '',
            category: toolData.category || 'custom',
            isCustom: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            metadata: {
                author: toolData.author || '',
                website: toolData.website || '',
                notes: toolData.notes || ''
            }
        };

        tools.push(newTool);

        // Enforce limit
        while (tools.length > this.CONFIG.MAX_CUSTOM_TOOLS) {
            tools.shift();
        }

        this._cache.tools = tools;
        SPECTRE_STORAGE.set(this.KEYS.CUSTOM_TOOLS, tools);

        // Re-merge into tools DB
        this.mergeIntoToolsDB();

        return newTool;
    },

    /**
     * Update a custom tool
     * @param {string} toolId - Tool ID
     * @param {Object} updates - Updates
     * @returns {Object|null} Updated tool
     */
    updateCustomTool(toolId, updates) {
        const tools = this.getCustomTools();
        const index = tools.findIndex(t => t.id === toolId);
        
        if (index === -1) return null;

        // If URL changed, re-detect fields
        if (updates.url && updates.url !== tools[index].url) {
            updates.fields = updates.fields || this.detectFieldsFromUrl(updates.url);
        }

        tools[index] = {
            ...tools[index],
            ...updates,
            updatedAt: Date.now()
        };

        this._cache.tools = tools;
        SPECTRE_STORAGE.set(this.KEYS.CUSTOM_TOOLS, tools);
        this.mergeIntoToolsDB();

        return tools[index];
    },

    /**
     * Delete a custom tool
     * @param {string} toolId - Tool ID
     * @returns {boolean} Success
     */
    deleteCustomTool(toolId) {
        const tools = this.getCustomTools();
        const index = tools.findIndex(t => t.id === toolId);
        
        if (index === -1) return false;

        tools.splice(index, 1);
        this._cache.tools = tools;
        SPECTRE_STORAGE.set(this.KEYS.CUSTOM_TOOLS, tools);
        this.mergeIntoToolsDB();

        return true;
    },

    // ==========================================
    // Custom Categories
    // ==========================================

    /**
     * Get all custom categories
     * @returns {Array} Custom categories
     */
    getCustomCategories() {
        if (this._cache.categories) return this._cache.categories;
        return SPECTRE_STORAGE.get(this.KEYS.CUSTOM_CATEGORIES, []);
    },

    /**
     * Add a custom category
     * @param {Object} categoryData - Category configuration
     * @returns {Object} Created category
     */
    addCustomCategory(categoryData) {
        const categories = this.getCustomCategories();

        const newCategory = {
            id: SPECTRE_UTILS.string.slugify(categoryData.name) || SPECTRE_UTILS.string.uniqueId('cat'),
            name: categoryData.name || 'Custom Category',
            icon: categoryData.icon || '📁',
            desc: categoryData.desc || 'Custom tool category',
            isCustom: true,
            createdAt: Date.now()
        };

        // Check for duplicate ID
        if (categories.some(c => c.id === newCategory.id)) {
            newCategory.id = SPECTRE_UTILS.string.uniqueId('cat');
        }

        categories.push(newCategory);

        // Enforce limit
        while (categories.length > this.CONFIG.MAX_CUSTOM_CATEGORIES) {
            categories.shift();
        }

        this._cache.categories = categories;
        SPECTRE_STORAGE.set(this.KEYS.CUSTOM_CATEGORIES, categories);
        this.mergeIntoToolsDB();

        return newCategory;
    },

    /**
     * Delete a custom category
     * @param {string} categoryId - Category ID
     * @returns {boolean} Success
     */
    deleteCustomCategory(categoryId) {
        const categories = this.getCustomCategories();
        const index = categories.findIndex(c => c.id === categoryId);
        
        if (index === -1) return false;

        categories.splice(index, 1);
        this._cache.categories = categories;
        SPECTRE_STORAGE.set(this.KEYS.CUSTOM_CATEGORIES, categories);

        // Move tools from deleted category to 'custom'
        const tools = this.getCustomTools();
        tools.forEach(tool => {
            if (tool.category === categoryId) {
                tool.category = 'custom';
            }
        });
        this._cache.tools = tools;
        SPECTRE_STORAGE.set(this.KEYS.CUSTOM_TOOLS, tools);

        this.mergeIntoToolsDB();

        return true;
    },

    // ==========================================
    // Tools DB Integration
    // ==========================================

    /**
     * Merge custom tools and categories into the main SPECTRE_TOOLS object
     */
    mergeIntoToolsDB() {
        if (!window.SPECTRE_TOOLS) return;

        const customTools = this.getCustomTools();
        const customCategories = this.getCustomCategories();

        // Remove previously added custom categories
        Object.keys(window.SPECTRE_TOOLS).forEach(key => {
            if (window.SPECTRE_TOOLS[key].isCustom) {
                delete window.SPECTRE_TOOLS[key];
            }
        });

        // Also clean custom tools from existing categories
        Object.keys(window.SPECTRE_TOOLS).forEach(key => {
            if (window.SPECTRE_TOOLS[key].tools) {
                window.SPECTRE_TOOLS[key].tools = window.SPECTRE_TOOLS[key].tools.filter(t => !t.isCustom);
            }
        });

        // Add custom categories
        customCategories.forEach(cat => {
            window.SPECTRE_TOOLS[cat.id] = {
                name: cat.name,
                icon: cat.icon,
                desc: cat.desc,
                isCustom: true,
                tools: []
            };
        });

        // Ensure 'custom' category exists
        if (!window.SPECTRE_TOOLS.custom) {
            window.SPECTRE_TOOLS.custom = {
                name: 'Custom Tools',
                icon: '🛠️',
                desc: 'User-added custom tools',
                isCustom: true,
                tools: []
            };
        }

        // Add custom tools to their categories
        customTools.forEach(tool => {
            const categoryId = tool.category || 'custom';
            
            // Ensure category exists
            if (!window.SPECTRE_TOOLS[categoryId]) {
                window.SPECTRE_TOOLS[categoryId] = {
                    name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
                    icon: '📁',
                    desc: 'Custom category',
                    isCustom: true,
                    tools: []
                };
            }

            window.SPECTRE_TOOLS[categoryId].tools.push({
                name: tool.name,
                url: tool.url,
                badge: tool.badge,
                fields: tool.fields,
                desc: tool.desc,
                isCustom: true,
                customId: tool.id
            });
        });
    },

    // ==========================================
    // URL Validation & Field Detection
    // ==========================================

    /**
     * Validate URL template
     * @param {string} url - URL template
     * @returns {boolean} Is valid
     */
    validateUrlTemplate(url) {
        if (!url) return false;
        
        // Must be a valid URL structure
        try {
            // Replace placeholders temporarily
            const testUrl = url.replace(/\{(\w+)\}/g, 'test');
            new URL(testUrl);
        } catch {
            return false;
        }

        // Should have at least one placeholder OR be a static tool
        return true;
    },

    /**
     * Detect fields from URL template
     * @param {string} url - URL template
     * @returns {Array} Field names
     */
    detectFieldsFromUrl(url) {
        const matches = url.match(/\{(\w+)\}/g) || [];
        const fields = matches.map(m => m.slice(1, -1));
        
        // Map to standard field names
        const fieldMap = {
            'first': 'firstName',
            'last': 'lastName',
            'First': 'firstName',
            'Last': 'lastName',
            'user': 'username',
            'name': 'firstName',
            'phone': 'phone',
            'phoneClean': 'phone'
        };

        return [...new Set(fields.map(f => fieldMap[f] || f))];
    },

    /**
     * Get available placeholder reference
     * @returns {string} HTML reference
     */
    getPlaceholderReference() {
        return this.CONFIG.AVAILABLE_FIELDS.map(f => 
            `<code>${f.placeholder}</code> - ${f.label}`
        ).join('<br>');
    },

    // ==========================================
    // Import/Export
    // ==========================================

    /**
     * Export all custom tools as JSON
     * @returns {Object} Export data
     */
    exportCustomTools() {
        return {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            tools: this.getCustomTools(),
            categories: this.getCustomCategories()
        };
    },

    /**
     * Import custom tools from JSON
     * @param {Object} data - Import data
     * @param {Object} options - Import options
     * @returns {Object} Import results
     */
    importCustomTools(data, options = { merge: true }) {
        const results = {
            toolsImported: 0,
            categoriesImported: 0,
            errors: []
        };

        try {
            // Import categories first
            if (data.categories && Array.isArray(data.categories)) {
                const existingCategories = options.merge ? this.getCustomCategories() : [];
                
                data.categories.forEach(cat => {
                    // Skip if exists and merging
                    if (options.merge && existingCategories.some(c => c.id === cat.id)) {
                        return;
                    }
                    
                    try {
                        this.addCustomCategory(cat);
                        results.categoriesImported++;
                    } catch (e) {
                        results.errors.push(`Category ${cat.name}: ${e.message}`);
                    }
                });
            }

            // Import tools
            if (data.tools && Array.isArray(data.tools)) {
                const existingTools = options.merge ? this.getCustomTools() : [];

                // If not merging, clear existing
                if (!options.merge) {
                    this._cache.tools = [];
                    SPECTRE_STORAGE.set(this.KEYS.CUSTOM_TOOLS, []);
                }

                data.tools.forEach(tool => {
                    // Skip if exists and merging (by URL)
                    if (options.merge && existingTools.some(t => t.url === tool.url)) {
                        return;
                    }

                    try {
                        this.addCustomTool(tool);
                        results.toolsImported++;
                    } catch (e) {
                        results.errors.push(`Tool ${tool.name}: ${e.message}`);
                    }
                });
            }

        } catch (e) {
            results.errors.push(`Import error: ${e.message}`);
        }

        return results;
    },

    /**
     * Download export file
     */
    downloadExport() {
        const data = this.exportCustomTools();
        const content = JSON.stringify(data, null, 2);
        const filename = `spectre-custom-tools-${new Date().toISOString().slice(0, 10)}.json`;
        
        SPECTRE_EXPORT.downloadFile(content, filename, 'application/json');
        SPECTRE_UI.toast(`Exported ${data.tools.length} custom tools`, 'success');
    },

    // ==========================================
    // UI Integration
    // ==========================================

    /**
     * Show custom tools manager modal
     */
    showCustomToolsModal() {
        const tools = this.getCustomTools();
        const categories = this.getCustomCategories();

        const toolsHtml = tools.length > 0
            ? tools.map(t => `
                <div class="custom-tool-item" data-tool-id="${t.id}">
                    <div class="tool-info">
                        <div class="tool-name">
                            ${SPECTRE_UTILS.string.escapeHtml(t.name)}
                            <span class="badge badge-${t.badge}">${t.badge}</span>
                        </div>
                        <div class="tool-url">${SPECTRE_UTILS.string.escapeHtml(SPECTRE_UTILS.string.truncate(t.url, 50))}</div>
                    </div>
                    <div class="tool-actions">
                        <button class="btn btn-xs" onclick="SPECTRE.customTools.showEditToolModal('${t.id}')" data-tooltip="Edit">✏️</button>
                        <button class="btn btn-xs" onclick="SPECTRE.customTools.confirmDeleteTool('${t.id}')" data-tooltip="Delete">🗑️</button>
                    </div>
                </div>
            `).join('')
            : '<div class="empty-state">No custom tools yet. Add your own OSINT tools!</div>';

        SPECTRE_UI.showModal('🛠️ Custom Tools', `
            <style>
                .custom-tool-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem;
                    background: var(--bg-tertiary);
                    border-radius: 8px;
                    margin-bottom: 0.5rem;
                }
                .custom-tool-item:hover { background: var(--bg-secondary); }
                .tool-name { font-weight: 500; display: flex; align-items: center; gap: 0.5rem; }
                .tool-url { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; font-family: var(--font-mono); }
                .tool-actions { display: flex; gap: 0.25rem; }
                .empty-state { text-align: center; padding: 2rem; color: var(--text-muted); }
                .action-bar { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
                .tools-list { max-height: 350px; overflow-y: auto; }
                .stats-bar {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    padding: 0.75rem;
                    background: var(--bg-tertiary);
                    border-radius: 8px;
                    font-size: 0.85rem;
                }
            </style>

            <div class="stats-bar">
                <span>🛠️ <strong>${tools.length}</strong> custom tools</span>
                <span>📁 <strong>${categories.length}</strong> custom categories</span>
            </div>

            <div class="action-bar">
                <button class="btn btn-primary" onclick="SPECTRE.customTools.showAddToolModal()">
                    ➕ Add Tool
                </button>
                <button class="btn" onclick="SPECTRE.customTools.showAddCategoryModal()">
                    📁 Add Category
                </button>
                <button class="btn" onclick="SPECTRE.customTools.downloadExport()">
                    📤 Export
                </button>
                <button class="btn" onclick="SPECTRE.customTools.showImportModal()">
                    📥 Import
                </button>
            </div>

            <div class="tools-list">
                ${toolsHtml}
            </div>
        `, [{ text: 'Close', action: 'SPECTRE.ui.closeModal()' }]);
    },

    /**
     * Show add tool modal
     */
    showAddToolModal() {
        const categories = [
            ...this.getCustomCategories(),
            { id: 'custom', name: 'Custom Tools' }
        ];

        const categoryOptions = categories.map(c => 
            `<option value="${c.id}">${SPECTRE_UTILS.string.escapeHtml(c.name)}</option>`
        ).join('');

        const badgeOptions = this.CONFIG.AVAILABLE_BADGES.map(b =>
            `<option value="${b}">${b}</option>`
        ).join('');

        SPECTRE_UI.showModal('➕ Add Custom Tool', `
            <style>
                .form-group { margin-bottom: 1rem; }
                .form-label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
                .form-help { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; }
                .placeholder-ref {
                    background: var(--bg-tertiary);
                    padding: 0.75rem;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    max-height: 150px;
                    overflow-y: auto;
                    line-height: 1.6;
                }
                .placeholder-ref code {
                    background: var(--bg-primary);
                    padding: 0.1rem 0.4rem;
                    border-radius: 3px;
                    font-family: var(--font-mono);
                }
            </style>

            <div class="form-group">
                <label class="form-label">Tool Name *</label>
                <input type="text" id="customToolName" class="form-input" placeholder="e.g., Custom Search Tool" style="width: 100%;">
            </div>

            <div class="form-group">
                <label class="form-label">URL Template *</label>
                <input type="text" id="customToolUrl" class="form-input" placeholder="https://example.com/search?q={username}" style="width: 100%;">
                <p class="form-help">Use placeholders like {username}, {email}, {domain} in the URL</p>
            </div>

            <div class="form-group">
                <label class="form-label">Available Placeholders</label>
                <div class="placeholder-ref">
                    ${this.getPlaceholderReference()}
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select id="customToolCategory" class="select" style="width: 100%;">
                        ${categoryOptions}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Badge</label>
                    <select id="customToolBadge" class="select" style="width: 100%;">
                        ${badgeOptions}
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea id="customToolDesc" class="form-input" placeholder="Brief description of what this tool does..." rows="2" style="width: 100%; resize: vertical;"></textarea>
            </div>
        `, [
            { text: 'Cancel', action: 'SPECTRE.customTools.showCustomToolsModal()' },
            { text: 'Add Tool', class: 'btn-primary', action: 'SPECTRE.customTools.addToolFromModal()' }
        ]);

        setTimeout(() => document.getElementById('customToolName')?.focus(), 100);
    },

    /**
     * Add tool from modal inputs
     */
    addToolFromModal() {
        const name = document.getElementById('customToolName')?.value.trim();
        const url = document.getElementById('customToolUrl')?.value.trim();
        const category = document.getElementById('customToolCategory')?.value;
        const badge = document.getElementById('customToolBadge')?.value;
        const desc = document.getElementById('customToolDesc')?.value.trim();

        if (!name) {
            SPECTRE_UI.toast('Please enter a tool name', 'warning');
            return;
        }

        if (!url) {
            SPECTRE_UI.toast('Please enter a URL template', 'warning');
            return;
        }

        try {
            this.addCustomTool({ name, url, category, badge, desc });
            SPECTRE_UI.toast(`Tool "${name}" added`, 'success');
            this.showCustomToolsModal();
        } catch (e) {
            SPECTRE_UI.toast(e.message, 'error');
        }
    },

    /**
     * Show edit tool modal
     * @param {string} toolId - Tool ID
     */
    showEditToolModal(toolId) {
        const tool = this.getCustomTool(toolId);
        if (!tool) return;

        const categories = [
            ...this.getCustomCategories(),
            { id: 'custom', name: 'Custom Tools' }
        ];

        const categoryOptions = categories.map(c => 
            `<option value="${c.id}" ${c.id === tool.category ? 'selected' : ''}>${SPECTRE_UTILS.string.escapeHtml(c.name)}</option>`
        ).join('');

        const badgeOptions = this.CONFIG.AVAILABLE_BADGES.map(b =>
            `<option value="${b}" ${b === tool.badge ? 'selected' : ''}>${b}</option>`
        ).join('');

        SPECTRE_UI.showModal('✏️ Edit Tool', `
            <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Tool Name *</label>
                <input type="text" id="editToolName" class="form-input" value="${SPECTRE_UTILS.string.escapeHtml(tool.name)}" style="width: 100%;">
            </div>

            <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">URL Template *</label>
                <input type="text" id="editToolUrl" class="form-input" value="${SPECTRE_UTILS.string.escapeHtml(tool.url)}" style="width: 100%;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Category</label>
                    <select id="editToolCategory" class="select" style="width: 100%;">
                        ${categoryOptions}
                    </select>
                </div>

                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Badge</label>
                    <select id="editToolBadge" class="select" style="width: 100%;">
                        ${badgeOptions}
                    </select>
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Description</label>
                <textarea id="editToolDesc" class="form-input" rows="2" style="width: 100%; resize: vertical;">${SPECTRE_UTILS.string.escapeHtml(tool.desc || '')}</textarea>
            </div>
        `, [
            { text: 'Cancel', action: 'SPECTRE.customTools.showCustomToolsModal()' },
            { text: 'Save', class: 'btn-primary', action: `SPECTRE.customTools.updateToolFromModal('${toolId}')` }
        ]);
    },

    /**
     * Update tool from modal
     * @param {string} toolId - Tool ID
     */
    updateToolFromModal(toolId) {
        const name = document.getElementById('editToolName')?.value.trim();
        const url = document.getElementById('editToolUrl')?.value.trim();
        const category = document.getElementById('editToolCategory')?.value;
        const badge = document.getElementById('editToolBadge')?.value;
        const desc = document.getElementById('editToolDesc')?.value.trim();

        if (!name || !url) {
            SPECTRE_UI.toast('Name and URL are required', 'warning');
            return;
        }

        this.updateCustomTool(toolId, { name, url, category, badge, desc });
        SPECTRE_UI.toast('Tool updated', 'success');
        this.showCustomToolsModal();
    },

    /**
     * Confirm tool deletion
     * @param {string} toolId - Tool ID
     */
    confirmDeleteTool(toolId) {
        const tool = this.getCustomTool(toolId);
        if (!tool) return;

        if (confirm(`Delete "${tool.name}"? This cannot be undone.`)) {
            this.deleteCustomTool(toolId);
            SPECTRE_UI.toast('Tool deleted', 'info');
            this.showCustomToolsModal();
        }
    },

    /**
     * Show add category modal
     */
    showAddCategoryModal() {
        SPECTRE_UI.showModal('📁 Add Category', `
            <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Category Name *</label>
                <input type="text" id="newCategoryName" class="form-input" placeholder="e.g., My Custom Tools" style="width: 100%;">
            </div>

            <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Icon (emoji)</label>
                <input type="text" id="newCategoryIcon" class="form-input" placeholder="📁" maxlength="4" style="width: 100px;">
            </div>

            <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Description</label>
                <input type="text" id="newCategoryDesc" class="form-input" placeholder="Tools for..." style="width: 100%;">
            </div>
        `, [
            { text: 'Cancel', action: 'SPECTRE.customTools.showCustomToolsModal()' },
            { text: 'Add', class: 'btn-primary', action: 'SPECTRE.customTools.addCategoryFromModal()' }
        ]);

        setTimeout(() => document.getElementById('newCategoryName')?.focus(), 100);
    },

    /**
     * Add category from modal
     */
    addCategoryFromModal() {
        const name = document.getElementById('newCategoryName')?.value.trim();
        const icon = document.getElementById('newCategoryIcon')?.value.trim() || '📁';
        const desc = document.getElementById('newCategoryDesc')?.value.trim();

        if (!name) {
            SPECTRE_UI.toast('Please enter a category name', 'warning');
            return;
        }

        this.addCustomCategory({ name, icon, desc });
        SPECTRE_UI.toast(`Category "${name}" created`, 'success');
        this.showCustomToolsModal();
    },

    /**
     * Show import modal
     */
    showImportModal() {
        SPECTRE_UI.showModal('📥 Import Tools', `
            <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                Import custom tools from a JSON file exported from SPECTRE or shared by others.
            </p>

            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Select File</label>
                <input type="file" id="importToolsFile" accept=".json" class="form-input" style="width: 100%;">
            </div>

            <div style="margin-bottom: 1rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                    <input type="checkbox" id="importMerge" checked>
                    <span>Merge with existing tools (uncheck to replace)</span>
                </label>
            </div>

            <div style="padding: 0.75rem; background: var(--bg-tertiary); border-radius: 6px; font-size: 0.8rem; color: var(--text-muted);">
                ⚠️ Only import files from trusted sources. Tools can contain URLs that will be opened in your browser.
            </div>
        `, [
            { text: 'Cancel', action: 'SPECTRE.customTools.showCustomToolsModal()' },
            { text: 'Import', class: 'btn-primary', action: 'SPECTRE.customTools.importFromModal()' }
        ]);
    },

    /**
     * Import from modal file input
     */
    async importFromModal() {
        const fileInput = document.getElementById('importToolsFile');
        const mergeCheckbox = document.getElementById('importMerge');

        if (!fileInput?.files?.length) {
            SPECTRE_UI.toast('Please select a file', 'warning');
            return;
        }

        const file = fileInput.files[0];
        const merge = mergeCheckbox?.checked ?? true;

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            const results = this.importCustomTools(data, { merge });
            
            if (results.errors.length > 0) {
                console.warn('[SPECTRE Custom Tools] Import errors:', results.errors);
            }

            SPECTRE_UI.toast(
                `Imported ${results.toolsImported} tools, ${results.categoriesImported} categories`, 
                results.errors.length > 0 ? 'warning' : 'success'
            );

            this.showCustomToolsModal();

        } catch (e) {
            SPECTRE_UI.toast('Import failed: Invalid file format', 'error');
        }
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.SPECTRE_CUSTOM_TOOLS = SPECTRE_CUSTOM_TOOLS;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SPECTRE_CUSTOM_TOOLS.init());
    } else {
        SPECTRE_CUSTOM_TOOLS.init();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPECTRE_CUSTOM_TOOLS;
}
