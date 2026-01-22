/* ============================================
   SPECTRE - Bulk Input Processing Module
   Version: 2.1.0
   
   Process multiple inputs at once:
   - Paste lists of emails, usernames, IPs, etc.
   - Auto-detect input types
   - Batch API lookups
   - Export aggregated results
   - Progress tracking
   
   Dependencies: utils.js, ui.js, api-integrations.js
   ============================================ */

const SPECTRE_BULK = {

    // Configuration
    config: {
        maxItems: 100,
        batchSize: 5,
        delayBetweenBatches: 1000,
        supportedTypes: ['email', 'username', 'domain', 'ip', 'phone']
    },

    // State
    state: {
        items: [],
        results: [],
        processing: false,
        cancelled: false,
        progress: 0
    },

    /**
     * Initialize bulk processing module
     */
    init() {
        this.injectStyles();
        console.log('[SPECTRE] Bulk Processing initialized');
    },

    /**
     * Inject CSS styles
     */
    injectStyles() {
        if (document.getElementById('spectre-bulk-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'spectre-bulk-styles';
        style.textContent = `
            .bulk-input-container {
                margin-bottom: 1rem;
            }
            .bulk-textarea {
                width: 100%;
                min-height: 150px;
                background: var(--bg-tertiary);
                border: 1px solid var(--border-default);
                border-radius: 8px;
                padding: 0.75rem;
                font-family: var(--font-mono);
                font-size: 0.85rem;
                color: var(--text-primary);
                resize: vertical;
            }
            .bulk-textarea:focus {
                outline: none;
                border-color: var(--accent-primary);
            }
            .bulk-textarea::placeholder {
                color: var(--text-muted);
            }
            .bulk-stats {
                display: flex;
                gap: 1rem;
                margin: 0.75rem 0;
                font-size: 0.8rem;
            }
            .bulk-stat {
                display: flex;
                align-items: center;
                gap: 0.35rem;
                padding: 0.35rem 0.6rem;
                background: var(--bg-tertiary);
                border-radius: 6px;
            }
            .bulk-stat-value {
                font-weight: 600;
                color: var(--accent-primary);
            }
            .bulk-type-select {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin: 1rem 0;
            }
            .bulk-type-option {
                padding: 0.5rem 1rem;
                background: var(--bg-tertiary);
                border: 1px solid var(--border-default);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.15s ease;
                font-size: 0.85rem;
            }
            .bulk-type-option:hover {
                background: var(--bg-hover);
            }
            .bulk-type-option.selected {
                background: rgba(59, 130, 246, 0.15);
                border-color: var(--accent-primary);
                color: var(--accent-primary);
            }
            .bulk-progress-container {
                margin: 1rem 0;
            }
            .bulk-progress-bar {
                height: 8px;
                background: var(--bg-tertiary);
                border-radius: 4px;
                overflow: hidden;
            }
            .bulk-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
                transition: width 0.3s ease;
            }
            .bulk-progress-text {
                display: flex;
                justify-content: space-between;
                margin-top: 0.5rem;
                font-size: 0.75rem;
                color: var(--text-muted);
            }
            .bulk-results-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.8rem;
            }
            .bulk-results-table th,
            .bulk-results-table td {
                padding: 0.6rem;
                text-align: left;
                border-bottom: 1px solid var(--border-subtle);
            }
            .bulk-results-table th {
                background: var(--bg-tertiary);
                font-weight: 600;
                position: sticky;
                top: 0;
            }
            .bulk-results-table tr:hover {
                background: var(--bg-hover);
            }
            .bulk-result-status {
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
                padding: 0.2rem 0.5rem;
                border-radius: 4px;
                font-size: 0.7rem;
            }
            .bulk-result-status.success {
                background: rgba(34, 197, 94, 0.15);
                color: var(--accent-green);
            }
            .bulk-result-status.warning {
                background: rgba(245, 158, 11, 0.15);
                color: var(--accent-amber);
            }
            .bulk-result-status.error {
                background: rgba(239, 68, 68, 0.15);
                color: var(--accent-red);
            }
            .bulk-result-status.pending {
                background: var(--bg-tertiary);
                color: var(--text-muted);
            }
            .bulk-actions-row {
                display: flex;
                gap: 0.5rem;
            }
            .bulk-action-btn {
                padding: 0.25rem 0.5rem;
                background: var(--bg-tertiary);
                border: 1px solid var(--border-subtle);
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.7rem;
                transition: all 0.15s ease;
            }
            .bulk-action-btn:hover {
                background: var(--bg-hover);
                border-color: var(--border-default);
            }
            .bulk-results-scroll {
                max-height: 400px;
                overflow-y: auto;
            }
            .bulk-sample {
                font-size: 0.75rem;
                color: var(--text-muted);
                margin-top: 0.5rem;
            }
            .bulk-sample code {
                background: var(--bg-tertiary);
                padding: 0.15rem 0.35rem;
                border-radius: 3px;
                font-family: var(--font-mono);
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Show bulk input modal
     */
    showBulkInputModal() {
        const modalContent = `
            <div class="bulk-input-container">
                <textarea class="bulk-textarea" id="bulkInputText" 
                    placeholder="Paste your list here (one item per line)

Examples:
john@example.com
jane@test.org
bob@company.net

Or usernames:
johndoe
jane_smith
bob123"></textarea>
                
                <div class="bulk-sample">
                    Supported formats: emails, usernames, domains, IP addresses, phone numbers
                </div>
            </div>

            <div class="bulk-stats" id="bulkStats">
                <div class="bulk-stat">
                    <span>Lines:</span>
                    <span class="bulk-stat-value" id="bulkLineCount">0</span>
                </div>
                <div class="bulk-stat">
                    <span>Valid:</span>
                    <span class="bulk-stat-value" id="bulkValidCount">0</span>
                </div>
                <div class="bulk-stat">
                    <span>Type:</span>
                    <span class="bulk-stat-value" id="bulkDetectedType">-</span>
                </div>
            </div>

            <div class="bulk-type-select" id="bulkTypeSelect">
                <div class="bulk-type-option selected" data-type="auto" onclick="SPECTRE_BULK.selectType('auto')">
                    🔮 Auto-detect
                </div>
                <div class="bulk-type-option" data-type="email" onclick="SPECTRE_BULK.selectType('email')">
                    📧 Email
                </div>
                <div class="bulk-type-option" data-type="username" onclick="SPECTRE_BULK.selectType('username')">
                    👤 Username
                </div>
                <div class="bulk-type-option" data-type="domain" onclick="SPECTRE_BULK.selectType('domain')">
                    🌐 Domain
                </div>
                <div class="bulk-type-option" data-type="ip" onclick="SPECTRE_BULK.selectType('ip')">
                    🔌 IP Address
                </div>
            </div>

            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;">
                    <input type="checkbox" id="bulkApiLookup" checked>
                    Run API lookups (EmailRep, IPinfo)
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;">
                    <input type="checkbox" id="bulkGenerateUrls" checked>
                    Generate tool URLs
                </label>
            </div>
        `;

        SPECTRE_UI.showModal('📋 Bulk Input Processing', modalContent, [
            { text: 'Cancel', action: 'SPECTRE.ui.closeModal()' },
            { text: '🔍 Analyze', action: 'SPECTRE_BULK.analyzeInput()', primary: false },
            { text: '🚀 Process', action: 'SPECTRE_BULK.startProcessing()', primary: true }
        ]);

        // Add input listener
        setTimeout(() => {
            const textarea = document.getElementById('bulkInputText');
            if (textarea) {
                textarea.addEventListener('input', () => this.updateStats());
                textarea.focus();
            }
        }, 100);
    },

    /**
     * Update statistics display
     */
    updateStats() {
        const textarea = document.getElementById('bulkInputText');
        if (!textarea) return;

        const lines = textarea.value.split('\n').filter(l => l.trim());
        const parsed = this.parseInput(textarea.value);

        document.getElementById('bulkLineCount').textContent = lines.length;
        document.getElementById('bulkValidCount').textContent = parsed.items.length;
        document.getElementById('bulkDetectedType').textContent = parsed.detectedType || '-';
    },

    /**
     * Select input type
     */
    selectType(type) {
        document.querySelectorAll('.bulk-type-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.type === type);
        });
        this.selectedType = type === 'auto' ? null : type;
        this.updateStats();
    },

    /**
     * Parse input text
     */
    parseInput(text) {
        const lines = text.split('\n')
            .map(l => l.trim())
            .filter(l => l && !l.startsWith('#'));

        const items = [];
        const typeCounts = { email: 0, username: 0, domain: 0, ip: 0, phone: 0, unknown: 0 };

        lines.forEach(line => {
            const detection = this.detectType(line);
            if (detection.type !== 'unknown') {
                items.push({
                    value: line,
                    type: detection.type,
                    normalized: detection.normalized || line
                });
                typeCounts[detection.type]++;
            }
        });

        // Determine dominant type
        let detectedType = null;
        let maxCount = 0;
        Object.entries(typeCounts).forEach(([type, count]) => {
            if (count > maxCount && type !== 'unknown') {
                maxCount = count;
                detectedType = type;
            }
        });

        return {
            items,
            detectedType,
            typeCounts,
            total: lines.length
        };
    },

    /**
     * Detect input type
     */
    detectType(value) {
        // Force type if selected
        if (this.selectedType) {
            return { type: this.selectedType, normalized: value };
        }

        // Email
        if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
            return { type: 'email', normalized: value.toLowerCase() };
        }

        // IP address
        if (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value)) {
            return { type: 'ip', normalized: value };
        }

        // Domain
        if (/^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(value) && !value.includes('@')) {
            return { type: 'domain', normalized: value.toLowerCase() };
        }

        // Phone (simple check)
        const digits = value.replace(/\D/g, '');
        if (digits.length >= 10 && digits.length <= 15 && /^[\d\s\-\+\(\)\.]+$/.test(value)) {
            return { type: 'phone', normalized: digits };
        }

        // Username (alphanumeric with underscores/dots)
        if (/^[a-zA-Z0-9._-]{3,30}$/.test(value)) {
            return { type: 'username', normalized: value };
        }

        return { type: 'unknown', normalized: value };
    },

    /**
     * Analyze input without processing
     */
    analyzeInput() {
        const textarea = document.getElementById('bulkInputText');
        if (!textarea || !textarea.value.trim()) {
            SPECTRE_UI.toast('Please enter some data to analyze', 'warning');
            return;
        }

        const parsed = this.parseInput(textarea.value);
        
        if (parsed.items.length === 0) {
            SPECTRE_UI.toast('No valid items detected', 'warning');
            return;
        }

        // Show analysis results
        const typeBreakdown = Object.entries(parsed.typeCounts)
            .filter(([_, count]) => count > 0)
            .map(([type, count]) => `${type}: ${count}`)
            .join(', ');

        SPECTRE_UI.toast(`Found ${parsed.items.length} valid items (${typeBreakdown})`, 'success');
    },

    /**
     * Start processing
     */
    async startProcessing() {
        const textarea = document.getElementById('bulkInputText');
        if (!textarea || !textarea.value.trim()) {
            SPECTRE_UI.toast('Please enter some data to process', 'warning');
            return;
        }

        const parsed = this.parseInput(textarea.value);
        
        if (parsed.items.length === 0) {
            SPECTRE_UI.toast('No valid items to process', 'warning');
            return;
        }

        if (parsed.items.length > this.config.maxItems) {
            SPECTRE_UI.toast(`Maximum ${this.config.maxItems} items allowed`, 'warning');
            return;
        }

        const runApiLookup = document.getElementById('bulkApiLookup')?.checked ?? true;
        const generateUrls = document.getElementById('bulkGenerateUrls')?.checked ?? true;

        // Close input modal and show processing modal
        SPECTRE_UI.closeModal();
        
        this.state = {
            items: parsed.items,
            results: [],
            processing: true,
            cancelled: false,
            progress: 0
        };

        this.showProcessingModal();
        await this.processItems(runApiLookup, generateUrls);
    },

    /**
     * Show processing modal
     */
    showProcessingModal() {
        const modalContent = `
            <div class="bulk-progress-container">
                <div class="bulk-progress-bar">
                    <div class="bulk-progress-fill" id="bulkProgressFill" style="width: 0%"></div>
                </div>
                <div class="bulk-progress-text">
                    <span id="bulkProgressText">Processing 0 of ${this.state.items.length}...</span>
                    <span id="bulkProgressPercent">0%</span>
                </div>
            </div>

            <div class="bulk-results-scroll" id="bulkResultsContainer">
                <table class="bulk-results-table">
                    <thead>
                        <tr>
                            <th>Input</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Result</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="bulkResultsBody">
                        ${this.state.items.map((item, i) => `
                            <tr id="bulkRow${i}">
                                <td><code>${SPECTRE_UTILS.string.escapeHtml(SPECTRE_UTILS.string.truncate(item.value, 30))}</code></td>
                                <td>${item.type}</td>
                                <td><span class="bulk-result-status pending">⏳ Pending</span></td>
                                <td>-</td>
                                <td>-</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        SPECTRE_UI.showModal('🔄 Processing...', modalContent, [
            { text: '⛔ Cancel', action: 'SPECTRE_BULK.cancelProcessing()' }
        ]);
    },

    /**
     * Cancel processing
     */
    cancelProcessing() {
        this.state.cancelled = true;
        this.state.processing = false;
        SPECTRE_UI.toast('Processing cancelled', 'warning');
    },

    /**
     * Process items
     */
    async processItems(runApiLookup, generateUrls) {
        const total = this.state.items.length;

        for (let i = 0; i < total; i++) {
            if (this.state.cancelled) break;

            const item = this.state.items[i];
            const result = {
                input: item.value,
                type: item.type,
                status: 'success',
                data: {},
                urls: [],
                error: null
            };

            try {
                // Run API lookups if enabled
                if (runApiLookup && SPECTRE.api) {
                    result.data = await this.runApiLookup(item);
                }

                // Generate tool URLs if enabled
                if (generateUrls) {
                    result.urls = this.generateToolUrls(item);
                }

            } catch (err) {
                result.status = 'error';
                result.error = err.message;
            }

            this.state.results.push(result);
            this.updateRow(i, result);
            this.updateProgress(i + 1, total);

            // Small delay between items
            if (i < total - 1 && !this.state.cancelled) {
                await this.delay(200);
            }
        }

        this.state.processing = false;
        this.showCompletionModal();
    },

    /**
     * Run API lookup for an item
     */
    async runApiLookup(item) {
        const data = {};

        try {
            switch (item.type) {
                case 'email':
                    if (SPECTRE.api?.checkEmailRep) {
                        const emailResult = await SPECTRE.api.checkEmailRep(item.normalized);
                        if (emailResult) {
                            data.reputation = emailResult.reputation;
                            data.suspicious = emailResult.suspicious;
                            data.references = emailResult.references;
                        }
                    }
                    break;

                case 'ip':
                    if (SPECTRE.api?.checkIPInfo) {
                        const ipResult = await SPECTRE.api.checkIPInfo(item.normalized);
                        if (ipResult) {
                            data.country = ipResult.country;
                            data.city = ipResult.city;
                            data.org = ipResult.org;
                        }
                    }
                    break;

                case 'domain':
                    if (SPECTRE.api?.checkCertificates) {
                        const certResult = await SPECTRE.api.checkCertificates(item.normalized);
                        if (certResult) {
                            data.certificates = certResult.length;
                        }
                    }
                    break;
            }
        } catch (err) {
            console.warn('[SPECTRE] API lookup failed:', err);
        }

        return data;
    },

    /**
     * Generate tool URLs for an item
     */
    generateToolUrls(item) {
        const urls = [];
        const toolsDB = window.SPECTRE_TOOLS || {};
        const values = { [item.type]: item.normalized };

        // Find relevant tools
        Object.entries(toolsDB).forEach(([categoryId, category]) => {
            if (!category.tools) return;

            category.tools.forEach(tool => {
                // Check if tool uses this field
                const fieldPlaceholder = `{${item.type}}`;
                if (tool.url.includes(fieldPlaceholder)) {
                    const url = SPECTRE_UTILS.url.buildToolUrl(tool.url, values);
                    if (url) {
                        urls.push({
                            name: tool.name,
                            url: url,
                            category: category.name
                        });
                    }
                }
            });
        });

        return urls.slice(0, 10); // Limit to 10 URLs
    },

    /**
     * Update a result row
     */
    updateRow(index, result) {
        const row = document.getElementById(`bulkRow${index}`);
        if (!row) return;

        const cells = row.querySelectorAll('td');
        
        // Status cell
        const statusClass = result.status === 'success' ? 'success' : 
                           result.status === 'warning' ? 'warning' : 'error';
        const statusIcon = result.status === 'success' ? '✓' : 
                          result.status === 'warning' ? '⚠' : '✕';
        cells[2].innerHTML = `<span class="bulk-result-status ${statusClass}">${statusIcon} ${result.status}</span>`;

        // Result cell
        let resultText = '-';
        if (Object.keys(result.data).length > 0) {
            const parts = [];
            if (result.data.reputation) parts.push(`Rep: ${result.data.reputation}`);
            if (result.data.suspicious) parts.push('⚠️ Suspicious');
            if (result.data.country) parts.push(`📍 ${result.data.country}`);
            if (result.data.certificates) parts.push(`🔐 ${result.data.certificates} certs`);
            resultText = parts.join(' | ') || '-';
        }
        cells[3].innerHTML = `<span style="font-size: 0.75rem;">${SPECTRE_UTILS.string.escapeHtml(resultText)}</span>`;

        // Actions cell
        if (result.urls.length > 0) {
            cells[4].innerHTML = `
                <div class="bulk-actions-row">
                    <button class="bulk-action-btn" onclick="SPECTRE_BULK.openUrls(${index})" title="Open tools">
                        🔗 ${result.urls.length}
                    </button>
                    <button class="bulk-action-btn" onclick="SPECTRE_BULK.searchSingle(${index})" title="Full search">
                        🔍
                    </button>
                </div>
            `;
        }
    },

    /**
     * Update progress
     */
    updateProgress(current, total) {
        const percent = Math.round((current / total) * 100);
        
        const fill = document.getElementById('bulkProgressFill');
        const text = document.getElementById('bulkProgressText');
        const percentEl = document.getElementById('bulkProgressPercent');

        if (fill) fill.style.width = `${percent}%`;
        if (text) text.textContent = `Processing ${current} of ${total}...`;
        if (percentEl) percentEl.textContent = `${percent}%`;
    },

    /**
     * Show completion modal
     */
    showCompletionModal() {
        const successful = this.state.results.filter(r => r.status === 'success').length;
        const failed = this.state.results.filter(r => r.status === 'error').length;

        // Update modal buttons
        const modalFooter = document.querySelector('.modal-footer');
        if (modalFooter) {
            modalFooter.innerHTML = `
                <button class="btn" onclick="SPECTRE.ui.closeModal()">Close</button>
                <button class="btn" onclick="SPECTRE_BULK.exportResults('csv')">📊 Export CSV</button>
                <button class="btn" onclick="SPECTRE_BULK.exportResults('json')">📄 Export JSON</button>
                <button class="btn btn-primary" onclick="SPECTRE_BULK.openAllUrls()">🚀 Open All Tools</button>
            `;
        }

        // Update modal title
        const modalTitle = document.querySelector('.modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = `✅ Complete - ${successful} successful, ${failed} failed`;
        }

        SPECTRE_UI.toast(`Processed ${successful} items successfully`, 'success');
    },

    /**
     * Open URLs for a single item
     */
    openUrls(index) {
        const result = this.state.results[index];
        if (!result || !result.urls) return;

        result.urls.forEach((urlObj, i) => {
            setTimeout(() => {
                window.open(urlObj.url, '_blank');
            }, i * 300);
        });

        SPECTRE_UI.toast(`Opening ${result.urls.length} tools...`, 'info');
    },

    /**
     * Search single item in main interface
     */
    searchSingle(index) {
        const item = this.state.items[index];
        if (!item) return;

        SPECTRE_UI.closeModal();

        // Set the value in the appropriate field
        const fieldMap = {
            email: 'email',
            username: 'username',
            domain: 'domain',
            ip: 'ip',
            phone: 'phone'
        };

        const fieldId = fieldMap[item.type];
        if (fieldId) {
            const input = document.getElementById(fieldId);
            if (input) {
                input.value = item.value;
            }
        }

        // Trigger search
        SPECTRE.app?.renderAllTools();
        SPECTRE.ui?.showResults();
    },

    /**
     * Open all URLs from all results
     */
    openAllUrls() {
        const allUrls = [];
        this.state.results.forEach(result => {
            if (result.urls) {
                result.urls.forEach(u => allUrls.push(u.url));
            }
        });

        if (allUrls.length === 0) {
            SPECTRE_UI.toast('No URLs to open', 'warning');
            return;
        }

        if (allUrls.length > 20) {
            if (!confirm(`This will open ${allUrls.length} tabs. Continue?`)) {
                return;
            }
        }

        allUrls.forEach((url, i) => {
            setTimeout(() => {
                window.open(url, '_blank');
            }, i * 200);
        });

        SPECTRE_UI.toast(`Opening ${allUrls.length} tools...`, 'info');
    },

    /**
     * Export results
     */
    exportResults(format) {
        if (this.state.results.length === 0) {
            SPECTRE_UI.toast('No results to export', 'warning');
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        
        if (format === 'csv') {
            this.exportCSV(timestamp);
        } else {
            this.exportJSON(timestamp);
        }
    },

    /**
     * Export as CSV
     */
    exportCSV(timestamp) {
        const headers = ['Input', 'Type', 'Status', 'Reputation', 'Suspicious', 'Country', 'City', 'Org', 'Certificates', 'Tool Count'];
        const rows = this.state.results.map(r => [
            r.input,
            r.type,
            r.status,
            r.data.reputation || '',
            r.data.suspicious || '',
            r.data.country || '',
            r.data.city || '',
            r.data.org || '',
            r.data.certificates || '',
            r.urls?.length || 0
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.map(cell => 
            `"${String(cell).replace(/"/g, '""')}"`
        ).join(','))].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spectre-bulk-${timestamp}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        SPECTRE_UI.toast('CSV exported successfully', 'success');
    },

    /**
     * Export as JSON
     */
    exportJSON(timestamp) {
        const data = {
            exported: new Date().toISOString(),
            total: this.state.results.length,
            results: this.state.results
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spectre-bulk-${timestamp}.json`;
        a.click();
        URL.revokeObjectURL(url);

        SPECTRE_UI.toast('JSON exported successfully', 'success');
    },

    /**
     * Utility: delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Initialize on DOM ready
if (typeof window !== 'undefined') {
    window.SPECTRE_BULK = SPECTRE_BULK;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SPECTRE_BULK.init());
    } else {
        SPECTRE_BULK.init();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPECTRE_BULK;
}
