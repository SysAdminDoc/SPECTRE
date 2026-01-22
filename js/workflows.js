/* ============================================
   SPECTRE - Workflows Module
   Version: 2.1.0
   
   Tool chain and workflow automation:
   - Predefined sequences for common tasks
   - Custom workflow creation
   - Sequential or parallel tool opening
   - Progress tracking
   - Workflow templates
   
   Dependencies: utils.js, storage.js, ui.js, tools-db.js
   ============================================ */

/**
 * SPECTRE Workflows Namespace
 */
const SPECTRE_WORKFLOWS = {

    /**
     * Storage Keys
     */
    KEYS: {
        CUSTOM_WORKFLOWS: 'spectre-workflows',
        WORKFLOW_HISTORY: 'spectre-workflow-history'
    },

    /**
     * Configuration
     */
    CONFIG: {
        MAX_CUSTOM_WORKFLOWS: 50,
        MAX_HISTORY: 100,
        // Delay between opening tabs (ms)
        TAB_DELAY: 300,
        // Maximum tabs to open at once
        MAX_TABS_BATCH: 10,
        // Pause between batches (ms)
        BATCH_PAUSE: 2000
    },

    /**
     * Predefined workflow templates
     */
    TEMPLATES: {
        'person-full': {
            id: 'person-full',
            name: 'Full Person Workup',
            icon: '👤',
            description: 'Comprehensive person investigation: people search → social media → breaches → images',
            requiredFields: ['firstName', 'lastName'],
            optionalFields: ['username', 'email'],
            categories: ['people', 'social', 'username', 'email', 'breach', 'image'],
            steps: [
                { phase: 'People Search', categories: ['people'], description: 'Search public records and people databases' },
                { phase: 'Social Media', categories: ['social', 'username'], description: 'Check social media profiles' },
                { phase: 'Email/Breach', categories: ['email', 'breach'], description: 'Check email and data breaches' },
                { phase: 'Images', categories: ['image'], description: 'Reverse image search' }
            ]
        },
        'domain-recon': {
            id: 'domain-recon',
            name: 'Domain Reconnaissance',
            icon: '🌐',
            description: 'Full domain analysis: WHOIS → DNS → certificates → technology → archives',
            requiredFields: ['domain'],
            categories: ['domain', 'archive'],
            steps: [
                { phase: 'WHOIS & DNS', categories: ['domain'], description: 'Registration and DNS records' },
                { phase: 'Archives', categories: ['archive'], description: 'Historical snapshots' }
            ]
        },
        'ip-analysis': {
            id: 'ip-analysis',
            name: 'IP Analysis',
            icon: '🔌',
            description: 'Comprehensive IP investigation: geolocation → reputation → ports → abuse reports',
            requiredFields: ['ip'],
            categories: ['ip'],
            steps: [
                { phase: 'IP Intelligence', categories: ['ip'], description: 'Geolocation, reputation, and services' }
            ]
        },
        'email-osint': {
            id: 'email-osint',
            name: 'Email OSINT',
            icon: '📧',
            description: 'Email investigation: verification → breaches → account discovery',
            requiredFields: ['email'],
            categories: ['email', 'breach'],
            steps: [
                { phase: 'Email Intel', categories: ['email'], description: 'Verification and reputation' },
                { phase: 'Breach Check', categories: ['breach'], description: 'Data breach exposure' }
            ]
        },
        'username-enum': {
            id: 'username-enum',
            name: 'Username Enumeration',
            icon: '🔎',
            description: 'Check username across 400+ platforms',
            requiredFields: ['username'],
            categories: ['username', 'social'],
            steps: [
                { phase: 'Username Search', categories: ['username'], description: 'Cross-platform username check' },
                { phase: 'Social Profiles', categories: ['social'], description: 'Direct profile links' }
            ]
        },
        'business-intel': {
            id: 'business-intel',
            name: 'Business Intelligence',
            icon: '🏢',
            description: 'Corporate research: filings → ownership → employees → technology',
            requiredFields: ['company'],
            optionalFields: ['domain'],
            categories: ['business', 'domain'],
            steps: [
                { phase: 'Corporate Records', categories: ['business'], description: 'Filings and ownership' },
                { phase: 'Digital Footprint', categories: ['domain'], description: 'Website and technology' }
            ]
        }
    },

    /**
     * In-memory cache
     */
    _cache: {
        workflows: null
    },

    /**
     * Active workflow state
     */
    _activeWorkflow: null,

    // ==========================================
    // Initialization
    // ==========================================

    /**
     * Initialize workflows module
     */
    init() {
        this._cache.workflows = this.getCustomWorkflows();
        console.log('[SPECTRE Workflows] Initialized:', {
            templates: Object.keys(this.TEMPLATES).length,
            custom: this._cache.workflows.length
        });
    },

    // ==========================================
    // Workflow CRUD
    // ==========================================

    /**
     * Get all custom workflows
     * @returns {Array} Custom workflows
     */
    getCustomWorkflows() {
        if (this._cache.workflows) return this._cache.workflows;
        return SPECTRE_STORAGE.get(this.KEYS.CUSTOM_WORKFLOWS, []);
    },

    /**
     * Get all workflows (templates + custom)
     * @returns {Array} All workflows
     */
    getAllWorkflows() {
        const templates = Object.values(this.TEMPLATES).map(t => ({ ...t, isTemplate: true }));
        const custom = this.getCustomWorkflows().map(w => ({ ...w, isCustom: true }));
        return [...templates, ...custom];
    },

    /**
     * Get workflow by ID
     * @param {string} workflowId - Workflow ID
     * @returns {Object|null} Workflow or null
     */
    getWorkflow(workflowId) {
        // Check templates first
        if (this.TEMPLATES[workflowId]) {
            return { ...this.TEMPLATES[workflowId], isTemplate: true };
        }
        
        // Check custom
        const custom = this.getCustomWorkflows();
        const found = custom.find(w => w.id === workflowId);
        return found ? { ...found, isCustom: true } : null;
    },

    /**
     * Create a custom workflow
     * @param {Object} workflowData - Workflow configuration
     * @returns {Object} Created workflow
     */
    createWorkflow(workflowData) {
        const workflows = this.getCustomWorkflows();

        const newWorkflow = {
            id: SPECTRE_UTILS.string.uniqueId('workflow'),
            name: workflowData.name || 'Custom Workflow',
            icon: workflowData.icon || '⚡',
            description: workflowData.description || '',
            requiredFields: workflowData.requiredFields || [],
            optionalFields: workflowData.optionalFields || [],
            categories: workflowData.categories || [],
            specificTools: workflowData.specificTools || [], // Array of tool names
            steps: workflowData.steps || [],
            settings: {
                openMode: workflowData.openMode || 'sequential', // 'sequential', 'parallel', 'batch'
                tabDelay: workflowData.tabDelay || this.CONFIG.TAB_DELAY,
                batchSize: workflowData.batchSize || this.CONFIG.MAX_TABS_BATCH,
                filterBadge: workflowData.filterBadge || 'all' // 'all', 'free', 'freemium', etc.
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
            runCount: 0
        };

        workflows.push(newWorkflow);

        // Enforce limit
        while (workflows.length > this.CONFIG.MAX_CUSTOM_WORKFLOWS) {
            workflows.shift();
        }

        this._cache.workflows = workflows;
        SPECTRE_STORAGE.set(this.KEYS.CUSTOM_WORKFLOWS, workflows);

        return newWorkflow;
    },

    /**
     * Update a custom workflow
     * @param {string} workflowId - Workflow ID
     * @param {Object} updates - Updates
     * @returns {Object|null} Updated workflow
     */
    updateWorkflow(workflowId, updates) {
        const workflows = this.getCustomWorkflows();
        const index = workflows.findIndex(w => w.id === workflowId);
        
        if (index === -1) return null;

        workflows[index] = {
            ...workflows[index],
            ...updates,
            updatedAt: Date.now()
        };

        this._cache.workflows = workflows;
        SPECTRE_STORAGE.set(this.KEYS.CUSTOM_WORKFLOWS, workflows);

        return workflows[index];
    },

    /**
     * Delete a custom workflow
     * @param {string} workflowId - Workflow ID
     * @returns {boolean} Success
     */
    deleteWorkflow(workflowId) {
        const workflows = this.getCustomWorkflows();
        const index = workflows.findIndex(w => w.id === workflowId);
        
        if (index === -1) return false;

        workflows.splice(index, 1);
        this._cache.workflows = workflows;
        SPECTRE_STORAGE.set(this.KEYS.CUSTOM_WORKFLOWS, workflows);

        return true;
    },

    // ==========================================
    // Workflow Execution
    // ==========================================

    /**
     * Run a workflow
     * @param {string} workflowId - Workflow ID
     * @param {Object} values - Search values
     * @param {Object} options - Execution options
     * @returns {Promise<Object>} Execution result
     */
    async runWorkflow(workflowId, values = null, options = {}) {
        const workflow = this.getWorkflow(workflowId);
        if (!workflow) {
            SPECTRE_UI.toast('Workflow not found', 'error');
            return { success: false, error: 'Workflow not found' };
        }

        // Get current search values if not provided
        if (!values && window.SPECTRE_APP) {
            values = SPECTRE_APP.gatherSearchValues('results');
        }

        // Validate required fields
        const missingFields = workflow.requiredFields.filter(f => !values[f]);
        if (missingFields.length > 0) {
            SPECTRE_UI.toast(`Missing required fields: ${missingFields.join(', ')}`, 'warning');
            return { success: false, error: 'Missing fields', missingFields };
        }

        // Gather tools to run
        const tools = this.gatherWorkflowTools(workflow, values);
        
        if (tools.length === 0) {
            SPECTRE_UI.toast('No tools match the workflow criteria', 'warning');
            return { success: false, error: 'No matching tools' };
        }

        // Confirm if many tabs
        if (tools.length > 10 && !options.skipConfirm) {
            const confirmed = confirm(
                `This workflow will open ${tools.length} tabs.\n\n` +
                `Tools will be opened in batches of ${this.CONFIG.MAX_TABS_BATCH} with pauses.\n\n` +
                `Continue?`
            );
            if (!confirmed) {
                return { success: false, error: 'Cancelled by user' };
            }
        }

        // Set active workflow
        this._activeWorkflow = {
            workflow,
            values,
            tools,
            progress: 0,
            started: Date.now()
        };

        // Show progress modal
        this.showProgressModal(workflow, tools.length);

        // Execute based on mode
        const settings = workflow.settings || {};
        const mode = settings.openMode || 'sequential';

        try {
            let result;
            switch (mode) {
                case 'parallel':
                    result = await this.executeParallel(tools, settings);
                    break;
                case 'batch':
                    result = await this.executeBatch(tools, settings);
                    break;
                case 'sequential':
                default:
                    result = await this.executeSequential(tools, settings);
                    break;
            }

            // Update run count for custom workflows
            if (!workflow.isTemplate) {
                this.updateWorkflow(workflowId, { runCount: (workflow.runCount || 0) + 1 });
            }

            // Log to history
            this.logWorkflowRun(workflow, result);

            // Clear active workflow
            this._activeWorkflow = null;
            SPECTRE_UI.closeModal();

            SPECTRE_UI.toast(`Workflow complete: ${result.opened}/${tools.length} tools opened`, 'success');
            return { success: true, ...result };

        } catch (err) {
            this._activeWorkflow = null;
            SPECTRE_UI.closeModal();
            SPECTRE_UI.toast('Workflow failed: ' + err.message, 'error');
            return { success: false, error: err.message };
        }
    },

    /**
     * Gather tools for workflow execution
     * @param {Object} workflow - Workflow definition
     * @param {Object} values - Search values
     * @returns {Array} Tools with generated URLs
     */
    gatherWorkflowTools(workflow, values) {
        const toolsDB = window.SPECTRE_TOOLS || {};
        const tools = [];

        // Get badge filter
        const filterBadge = workflow.settings?.filterBadge || 'all';

        // If specific tools are defined, use those
        if (workflow.specificTools && workflow.specificTools.length > 0) {
            Object.entries(toolsDB).forEach(([categoryId, category]) => {
                (category.tools || []).forEach((tool, index) => {
                    if (workflow.specificTools.includes(tool.name)) {
                        const url = SPECTRE_UTILS.url.buildFromTemplate(tool.url, values);
                        if (url) {
                            tools.push({
                                id: `${categoryId}-${index}`,
                                name: tool.name,
                                url: url,
                                badge: tool.badge,
                                category: category.name
                            });
                        }
                    }
                });
            });
        } else {
            // Use categories
            const categories = workflow.categories || [];
            
            categories.forEach(categoryId => {
                const category = toolsDB[categoryId];
                if (!category || !category.tools) return;

                category.tools.forEach((tool, index) => {
                    // Apply badge filter
                    if (filterBadge !== 'all' && tool.badge !== filterBadge) return;

                    const url = SPECTRE_UTILS.url.buildFromTemplate(tool.url, values);
                    if (url) {
                        tools.push({
                            id: `${categoryId}-${index}`,
                            name: tool.name,
                            url: url,
                            badge: tool.badge,
                            category: category.name
                        });
                    }
                });
            });
        }

        return tools;
    },

    /**
     * Execute workflow sequentially (one tab at a time)
     * @param {Array} tools - Tools to open
     * @param {Object} settings - Execution settings
     * @returns {Promise<Object>} Result
     */
    async executeSequential(tools, settings) {
        const delay = settings.tabDelay || this.CONFIG.TAB_DELAY;
        let opened = 0;
        let failed = 0;

        for (let i = 0; i < tools.length; i++) {
            const tool = tools[i];
            
            try {
                window.open(tool.url, '_blank');
                opened++;
                this.updateProgress(i + 1, tools.length, tool.name);
            } catch {
                failed++;
            }

            // Delay between tabs
            if (i < tools.length - 1) {
                await SPECTRE_UTILS.sleep(delay);
            }
        }

        return { opened, failed, total: tools.length };
    },

    /**
     * Execute workflow in parallel (all at once)
     * @param {Array} tools - Tools to open
     * @param {Object} settings - Execution settings
     * @returns {Promise<Object>} Result
     */
    async executeParallel(tools, settings) {
        let opened = 0;
        let failed = 0;

        tools.forEach((tool, i) => {
            try {
                window.open(tool.url, '_blank');
                opened++;
            } catch {
                failed++;
            }
        });

        this.updateProgress(tools.length, tools.length, 'All tabs opened');
        return { opened, failed, total: tools.length };
    },

    /**
     * Execute workflow in batches
     * @param {Array} tools - Tools to open
     * @param {Object} settings - Execution settings
     * @returns {Promise<Object>} Result
     */
    async executeBatch(tools, settings) {
        const batchSize = settings.batchSize || this.CONFIG.MAX_TABS_BATCH;
        const batchPause = this.CONFIG.BATCH_PAUSE;
        let opened = 0;
        let failed = 0;

        // Split into batches
        const batches = [];
        for (let i = 0; i < tools.length; i += batchSize) {
            batches.push(tools.slice(i, i + batchSize));
        }

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            
            // Open batch
            batch.forEach(tool => {
                try {
                    window.open(tool.url, '_blank');
                    opened++;
                } catch {
                    failed++;
                }
            });

            this.updateProgress(
                Math.min((batchIndex + 1) * batchSize, tools.length),
                tools.length,
                `Batch ${batchIndex + 1}/${batches.length}`
            );

            // Pause between batches
            if (batchIndex < batches.length - 1) {
                await SPECTRE_UTILS.sleep(batchPause);
            }
        }

        return { opened, failed, total: tools.length };
    },

    /**
     * Update progress display
     * @param {number} current - Current progress
     * @param {number} total - Total items
     * @param {string} label - Current item label
     */
    updateProgress(current, total, label) {
        if (this._activeWorkflow) {
            this._activeWorkflow.progress = current;
        }

        const percent = Math.round((current / total) * 100);
        const progressFill = document.getElementById('workflowProgressFill');
        const progressText = document.getElementById('workflowProgressText');
        const progressLabel = document.getElementById('workflowProgressLabel');

        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressText) progressText.textContent = `${current}/${total} (${percent}%)`;
        if (progressLabel) progressLabel.textContent = label;
    },

    /**
     * Show progress modal
     * @param {Object} workflow - Workflow being executed
     * @param {number} toolCount - Number of tools
     */
    showProgressModal(workflow, toolCount) {
        SPECTRE_UI.showModal(`⚡ Running: ${workflow.name}`, `
            <style>
                .workflow-progress { margin: 1rem 0; }
                .progress-bar {
                    background: var(--bg-tertiary);
                    border-radius: 8px;
                    height: 24px;
                    overflow: hidden;
                }
                .progress-fill {
                    background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
                    height: 100%;
                    width: 0%;
                    transition: width 0.3s ease;
                }
                .progress-info {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 0.5rem;
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                }
                .progress-label {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    margin-top: 0.25rem;
                }
            </style>

            <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                ${workflow.description || 'Executing workflow...'}
            </p>

            <div class="workflow-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="workflowProgressFill"></div>
                </div>
                <div class="progress-info">
                    <span id="workflowProgressText">0/${toolCount} (0%)</span>
                    <span>Opening tools...</span>
                </div>
                <div class="progress-label" id="workflowProgressLabel">Starting...</div>
            </div>

            <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 1rem;">
                ⚠️ Please don't close this window until the workflow completes.
            </p>
        `, []);
    },

    /**
     * Log workflow run to history
     * @param {Object} workflow - Workflow that ran
     * @param {Object} result - Execution result
     */
    logWorkflowRun(workflow, result) {
        const history = SPECTRE_STORAGE.get(this.KEYS.WORKFLOW_HISTORY, []);
        
        history.unshift({
            workflowId: workflow.id,
            workflowName: workflow.name,
            timestamp: Date.now(),
            result: {
                opened: result.opened,
                failed: result.failed,
                total: result.total
            }
        });

        // Limit history size
        while (history.length > this.CONFIG.MAX_HISTORY) {
            history.pop();
        }

        SPECTRE_STORAGE.set(this.KEYS.WORKFLOW_HISTORY, history);
    },

    // ==========================================
    // UI Integration
    // ==========================================

    /**
     * Show workflows manager modal
     */
    showWorkflowsModal() {
        const workflows = this.getAllWorkflows();
        const templates = workflows.filter(w => w.isTemplate);
        const custom = workflows.filter(w => w.isCustom);

        const renderWorkflowCard = (w) => `
            <div class="workflow-card" data-workflow-id="${w.id}">
                <div class="workflow-info">
                    <div class="workflow-icon">${w.icon || '⚡'}</div>
                    <div class="workflow-details">
                        <div class="workflow-name">${SPECTRE_UTILS.string.escapeHtml(w.name)}</div>
                        <div class="workflow-desc">${SPECTRE_UTILS.string.escapeHtml(w.description || '')}</div>
                        <div class="workflow-meta">
                            Requires: ${w.requiredFields?.join(', ') || 'None'}
                            ${w.runCount ? `• Runs: ${w.runCount}` : ''}
                        </div>
                    </div>
                </div>
                <div class="workflow-actions">
                    <button class="btn btn-primary btn-sm" onclick="SPECTRE.workflows.runWorkflow('${w.id}')" data-tooltip="Run this workflow">
                        ▶️ Run
                    </button>
                    ${w.isCustom ? `
                        <button class="btn btn-sm" onclick="SPECTRE.workflows.showEditWorkflowModal('${w.id}')" data-tooltip="Edit">✏️</button>
                        <button class="btn btn-sm" onclick="SPECTRE.workflows.confirmDeleteWorkflow('${w.id}')" data-tooltip="Delete">🗑️</button>
                    ` : ''}
                </div>
            </div>
        `;

        SPECTRE_UI.showModal('⚡ Workflows', `
            <style>
                .workflow-section { margin-bottom: 1.5rem; }
                .workflow-section-title {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    margin-bottom: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .workflow-card {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem;
                    background: var(--bg-tertiary);
                    border-radius: 8px;
                    margin-bottom: 0.5rem;
                }
                .workflow-card:hover { background: var(--bg-secondary); }
                .workflow-info { display: flex; gap: 0.75rem; align-items: flex-start; flex: 1; }
                .workflow-icon { font-size: 1.5rem; }
                .workflow-name { font-weight: 500; }
                .workflow-desc { font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem; }
                .workflow-meta { font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem; }
                .workflow-actions { display: flex; gap: 0.25rem; }
                .workflows-list { max-height: 400px; overflow-y: auto; }
            </style>

            <div style="margin-bottom: 1rem;">
                <button class="btn btn-primary" onclick="SPECTRE.workflows.showCreateWorkflowModal()">
                    ➕ Create Workflow
                </button>
            </div>

            <div class="workflows-list">
                <div class="workflow-section">
                    <div class="workflow-section-title">📋 Templates</div>
                    ${templates.map(renderWorkflowCard).join('')}
                </div>

                ${custom.length > 0 ? `
                    <div class="workflow-section">
                        <div class="workflow-section-title">🛠️ Custom Workflows</div>
                        ${custom.map(renderWorkflowCard).join('')}
                    </div>
                ` : ''}
            </div>
        `, [{ text: 'Close', action: 'SPECTRE.ui.closeModal()' }]);
    },

    /**
     * Show create workflow modal
     */
    showCreateWorkflowModal() {
        const toolsDB = window.SPECTRE_TOOLS || {};
        const categoryOptions = Object.entries(toolsDB).map(([id, cat]) => 
            `<label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <input type="checkbox" name="workflowCategory" value="${id}">
                ${cat.icon || '📁'} ${SPECTRE_UTILS.string.escapeHtml(cat.name)}
            </label>`
        ).join('');

        const fieldOptions = ['firstName', 'lastName', 'username', 'email', 'phone', 'domain', 'ip', 'company'].map(f =>
            `<label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <input type="checkbox" name="workflowField" value="${f}">
                ${f}
            </label>`
        ).join('');

        SPECTRE_UI.showModal('➕ Create Workflow', `
            <style>
                .form-section { margin-bottom: 1.25rem; }
                .form-section-title { font-weight: 500; margin-bottom: 0.5rem; }
                .checkbox-grid { 
                    display: grid; 
                    grid-template-columns: repeat(2, 1fr); 
                    gap: 0.25rem;
                    max-height: 150px;
                    overflow-y: auto;
                    padding: 0.5rem;
                    background: var(--bg-tertiary);
                    border-radius: 6px;
                }
            </style>

            <div class="form-section">
                <div class="form-section-title">Workflow Name *</div>
                <input type="text" id="newWorkflowName" class="form-input" placeholder="e.g., Quick Person Check" style="width: 100%;">
            </div>

            <div class="form-section">
                <div class="form-section-title">Description</div>
                <textarea id="newWorkflowDesc" class="form-input" placeholder="What does this workflow do?" rows="2" style="width: 100%;"></textarea>
            </div>

            <div class="form-section">
                <div class="form-section-title">Icon (emoji)</div>
                <input type="text" id="newWorkflowIcon" class="form-input" placeholder="⚡" maxlength="4" style="width: 80px;">
            </div>

            <div class="form-section">
                <div class="form-section-title">Required Fields</div>
                <div class="checkbox-grid">
                    ${fieldOptions}
                </div>
            </div>

            <div class="form-section">
                <div class="form-section-title">Categories to Include</div>
                <div class="checkbox-grid">
                    ${categoryOptions}
                </div>
            </div>

            <div class="form-section">
                <div class="form-section-title">Open Mode</div>
                <select id="newWorkflowMode" class="select" style="width: 100%;">
                    <option value="sequential">Sequential (one at a time)</option>
                    <option value="batch">Batch (groups of 10)</option>
                    <option value="parallel">Parallel (all at once)</option>
                </select>
            </div>

            <div class="form-section">
                <div class="form-section-title">Badge Filter</div>
                <select id="newWorkflowBadge" class="select" style="width: 100%;">
                    <option value="all">All Tools</option>
                    <option value="free">Free Only</option>
                    <option value="freemium">Freemium</option>
                </select>
            </div>
        `, [
            { text: 'Cancel', action: 'SPECTRE.workflows.showWorkflowsModal()' },
            { text: 'Create', class: 'btn-primary', action: 'SPECTRE.workflows.createWorkflowFromModal()' }
        ]);
    },

    /**
     * Create workflow from modal
     */
    createWorkflowFromModal() {
        const name = document.getElementById('newWorkflowName')?.value.trim();
        const description = document.getElementById('newWorkflowDesc')?.value.trim();
        const icon = document.getElementById('newWorkflowIcon')?.value.trim() || '⚡';
        const openMode = document.getElementById('newWorkflowMode')?.value || 'sequential';
        const filterBadge = document.getElementById('newWorkflowBadge')?.value || 'all';

        const requiredFields = Array.from(document.querySelectorAll('input[name="workflowField"]:checked'))
            .map(cb => cb.value);
        const categories = Array.from(document.querySelectorAll('input[name="workflowCategory"]:checked'))
            .map(cb => cb.value);

        if (!name) {
            SPECTRE_UI.toast('Please enter a workflow name', 'warning');
            return;
        }

        if (categories.length === 0) {
            SPECTRE_UI.toast('Please select at least one category', 'warning');
            return;
        }

        this.createWorkflow({
            name,
            description,
            icon,
            requiredFields,
            categories,
            openMode,
            filterBadge
        });

        SPECTRE_UI.toast(`Workflow "${name}" created`, 'success');
        this.showWorkflowsModal();
    },

    /**
     * Confirm workflow deletion
     * @param {string} workflowId - Workflow ID
     */
    confirmDeleteWorkflow(workflowId) {
        const workflow = this.getWorkflow(workflowId);
        if (!workflow || workflow.isTemplate) return;

        if (confirm(`Delete workflow "${workflow.name}"?`)) {
            this.deleteWorkflow(workflowId);
            SPECTRE_UI.toast('Workflow deleted', 'info');
            this.showWorkflowsModal();
        }
    },

    /**
     * Show quick workflow picker (for toolbar integration)
     */
    showQuickPicker() {
        const workflows = this.getAllWorkflows();
        
        const html = workflows.map(w => `
            <button class="workflow-quick-btn" onclick="SPECTRE.workflows.runWorkflow('${w.id}'); SPECTRE.ui.closeAllDropdowns();">
                ${w.icon || '⚡'} ${SPECTRE_UTILS.string.escapeHtml(w.name)}
            </button>
        `).join('');

        return html;
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.SPECTRE_WORKFLOWS = SPECTRE_WORKFLOWS;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SPECTRE_WORKFLOWS.init());
    } else {
        SPECTRE_WORKFLOWS.init();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPECTRE_WORKFLOWS;
}
