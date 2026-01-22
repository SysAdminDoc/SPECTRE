/* ============================================
   SPECTRE - Case Manager Module
   Version: 2.1.0
   
   Full investigation/case management system:
   - Create named investigations
   - Save multiple searches to a case
   - Add notes and findings to each tool result
   - Mark tools as useful/dead end/needs follow-up
   - Export entire case as a report
   - Timeline tracking
   
   Dependencies: utils.js, storage.js, ui.js
   ============================================ */

/**
 * SPECTRE Case Manager Namespace
 */
const SPECTRE_CASES = {

    /**
     * Storage Keys
     */
    KEYS: {
        CASES: 'spectre-cases',
        ACTIVE_CASE: 'spectre-active-case'
    },

    /**
     * Configuration
     */
    CONFIG: {
        MAX_CASES: 50,
        MAX_FINDINGS_PER_CASE: 500,
        TOOL_STATUSES: ['unchecked', 'useful', 'dead-end', 'follow-up', 'in-progress']
    },

    /**
     * Status Display Config
     */
    STATUS_CONFIG: {
        'unchecked': { icon: '⬜', label: 'Unchecked', color: 'var(--text-muted)' },
        'useful': { icon: '✅', label: 'Useful', color: 'var(--accent-green)' },
        'dead-end': { icon: '❌', label: 'Dead End', color: 'var(--accent-red)' },
        'follow-up': { icon: '🔔', label: 'Follow Up', color: 'var(--accent-amber)' },
        'in-progress': { icon: '🔄', label: 'In Progress', color: 'var(--accent-primary)' }
    },

    /**
     * In-memory cache
     */
    _cache: {
        cases: null,
        activeCase: null
    },

    // ==========================================
    // Initialization
    // ==========================================

    /**
     * Initialize case manager
     */
    init() {
        this._cache.cases = this.getAllCases();
        this._cache.activeCase = this.getActiveCase();
        
        console.log('[SPECTRE Cases] Initialized:', {
            totalCases: this._cache.cases.length,
            activeCase: this._cache.activeCase?.name || 'None'
        });
    },

    // ==========================================
    // Case CRUD Operations
    // ==========================================

    /**
     * Get all cases
     * @returns {Array} All cases
     */
    getAllCases() {
        if (this._cache.cases) return this._cache.cases;
        return SPECTRE_STORAGE.get(this.KEYS.CASES, []);
    },

    /**
     * Get a case by ID
     * @param {string} caseId - Case ID
     * @returns {Object|null} Case object or null
     */
    getCase(caseId) {
        const cases = this.getAllCases();
        return cases.find(c => c.id === caseId) || null;
    },

    /**
     * Get active case
     * @returns {Object|null} Active case or null
     */
    getActiveCase() {
        if (this._cache.activeCase !== null) return this._cache.activeCase;
        const activeCaseId = SPECTRE_STORAGE.get(this.KEYS.ACTIVE_CASE, null);
        return activeCaseId ? this.getCase(activeCaseId) : null;
    },

    /**
     * Create a new case/investigation
     * @param {Object} caseData - Case data
     * @returns {Object} Created case
     */
    createCase(caseData) {
        const cases = this.getAllCases();
        
        const newCase = {
            id: SPECTRE_UTILS.string.uniqueId('case'),
            name: caseData.name || 'Untitled Investigation',
            description: caseData.description || '',
            tags: caseData.tags || [],
            status: 'active', // active, closed, archived
            priority: caseData.priority || 'medium', // low, medium, high, critical
            createdAt: Date.now(),
            updatedAt: Date.now(),
            searches: [],      // Array of search snapshots
            findings: [],      // Array of tool findings with notes
            toolStatuses: {},  // { toolId: status }
            notes: [],         // General case notes
            timeline: [        // Activity timeline
                {
                    type: 'created',
                    timestamp: Date.now(),
                    description: 'Investigation created'
                }
            ],
            metadata: {
                subject: caseData.subject || {},  // Person/entity being investigated
                assignee: caseData.assignee || '',
                dueDate: caseData.dueDate || null
            }
        };

        cases.unshift(newCase);

        // Enforce max cases limit
        while (cases.length > this.CONFIG.MAX_CASES) {
            cases.pop();
        }

        this._cache.cases = cases;
        SPECTRE_STORAGE.set(this.KEYS.CASES, cases);

        return newCase;
    },

    /**
     * Update an existing case
     * @param {string} caseId - Case ID
     * @param {Object} updates - Updates to apply
     * @returns {Object|null} Updated case or null
     */
    updateCase(caseId, updates) {
        const cases = this.getAllCases();
        const index = cases.findIndex(c => c.id === caseId);
        
        if (index === -1) return null;

        // Merge updates
        cases[index] = {
            ...cases[index],
            ...updates,
            updatedAt: Date.now()
        };

        this._cache.cases = cases;
        SPECTRE_STORAGE.set(this.KEYS.CASES, cases);

        // Update active case cache if needed
        if (this._cache.activeCase?.id === caseId) {
            this._cache.activeCase = cases[index];
        }

        return cases[index];
    },

    /**
     * Delete a case
     * @param {string} caseId - Case ID
     * @returns {boolean} Success
     */
    deleteCase(caseId) {
        const cases = this.getAllCases();
        const index = cases.findIndex(c => c.id === caseId);
        
        if (index === -1) return false;

        cases.splice(index, 1);
        this._cache.cases = cases;
        SPECTRE_STORAGE.set(this.KEYS.CASES, cases);

        // Clear active case if deleted
        if (this._cache.activeCase?.id === caseId) {
            this.setActiveCase(null);
        }

        return true;
    },

    /**
     * Set the active case
     * @param {string|null} caseId - Case ID or null to clear
     */
    setActiveCase(caseId) {
        if (caseId === null) {
            this._cache.activeCase = null;
            SPECTRE_STORAGE.remove(this.KEYS.ACTIVE_CASE);
        } else {
            const caseObj = this.getCase(caseId);
            if (caseObj) {
                this._cache.activeCase = caseObj;
                SPECTRE_STORAGE.set(this.KEYS.ACTIVE_CASE, caseId);
            }
        }
    },

    // ==========================================
    // Search Management
    // ==========================================

    /**
     * Save current search to active case
     * @param {Object} searchValues - Search parameter values
     * @param {Array} generatedLinks - Generated tool links
     * @returns {Object|null} Search snapshot or null if no active case
     */
    saveSearchToCase(searchValues, generatedLinks) {
        const activeCase = this.getActiveCase();
        if (!activeCase) return null;

        const searchSnapshot = {
            id: SPECTRE_UTILS.string.uniqueId('search'),
            timestamp: Date.now(),
            values: { ...searchValues },
            toolCount: generatedLinks.length,
            links: generatedLinks.map(l => ({
                id: l.id,
                name: l.name,
                url: l.url,
                badge: l.badge,
                category: l.category
            }))
        };

        activeCase.searches.push(searchSnapshot);
        
        // Add to timeline
        this.addTimelineEvent(activeCase.id, 'search', 
            `Search saved: ${this.formatSearchSummary(searchValues)}`);

        this.updateCase(activeCase.id, { searches: activeCase.searches });

        return searchSnapshot;
    },

    /**
     * Format search values into a summary string
     * @param {Object} values - Search values
     * @returns {string} Summary
     */
    formatSearchSummary(values) {
        const parts = [];
        if (values.first && values.last) parts.push(`${values.first} ${values.last}`);
        else if (values.first) parts.push(values.first);
        if (values.username) parts.push(`@${values.username}`);
        if (values.email) parts.push(values.email);
        if (values.domain) parts.push(values.domain);
        if (values.phone) parts.push(values.phone);
        if (values.ip) parts.push(values.ip);
        return parts.join(', ') || 'Unknown';
    },

    // ==========================================
    // Tool Status & Findings
    // ==========================================

    /**
     * Set status for a tool within a case
     * @param {string} caseId - Case ID
     * @param {string} toolId - Tool ID (categoryId-index)
     * @param {string} status - Status value
     * @returns {boolean} Success
     */
    setToolStatus(caseId, toolId, status) {
        if (!this.CONFIG.TOOL_STATUSES.includes(status)) return false;

        const caseObj = this.getCase(caseId);
        if (!caseObj) return false;

        caseObj.toolStatuses[toolId] = status;
        
        this.addTimelineEvent(caseId, 'status', 
            `Tool marked as ${this.STATUS_CONFIG[status].label}`);

        this.updateCase(caseId, { toolStatuses: caseObj.toolStatuses });
        return true;
    },

    /**
     * Get tool status for active case
     * @param {string} toolId - Tool ID
     * @returns {string} Status
     */
    getToolStatus(toolId) {
        const activeCase = this.getActiveCase();
        if (!activeCase) return 'unchecked';
        return activeCase.toolStatuses[toolId] || 'unchecked';
    },

    /**
     * Add a finding to a case
     * @param {string} caseId - Case ID
     * @param {Object} finding - Finding data
     * @returns {Object|null} Created finding
     */
    addFinding(caseId, finding) {
        const caseObj = this.getCase(caseId);
        if (!caseObj) return null;

        const newFinding = {
            id: SPECTRE_UTILS.string.uniqueId('finding'),
            timestamp: Date.now(),
            toolId: finding.toolId || null,
            toolName: finding.toolName || '',
            toolUrl: finding.toolUrl || '',
            category: finding.category || '',
            title: finding.title || 'Untitled Finding',
            content: finding.content || '',
            importance: finding.importance || 'medium', // low, medium, high, critical
            tags: finding.tags || [],
            attachments: finding.attachments || []  // Future: screenshots, files
        };

        caseObj.findings.push(newFinding);

        // Enforce limit
        while (caseObj.findings.length > this.CONFIG.MAX_FINDINGS_PER_CASE) {
            caseObj.findings.shift();
        }

        this.addTimelineEvent(caseId, 'finding', 
            `Finding added: ${newFinding.title}`);

        this.updateCase(caseId, { findings: caseObj.findings });

        return newFinding;
    },

    /**
     * Update a finding
     * @param {string} caseId - Case ID
     * @param {string} findingId - Finding ID
     * @param {Object} updates - Updates
     * @returns {Object|null} Updated finding
     */
    updateFinding(caseId, findingId, updates) {
        const caseObj = this.getCase(caseId);
        if (!caseObj) return null;

        const index = caseObj.findings.findIndex(f => f.id === findingId);
        if (index === -1) return null;

        caseObj.findings[index] = {
            ...caseObj.findings[index],
            ...updates,
            updatedAt: Date.now()
        };

        this.updateCase(caseId, { findings: caseObj.findings });
        return caseObj.findings[index];
    },

    /**
     * Delete a finding
     * @param {string} caseId - Case ID
     * @param {string} findingId - Finding ID
     * @returns {boolean} Success
     */
    deleteFinding(caseId, findingId) {
        const caseObj = this.getCase(caseId);
        if (!caseObj) return false;

        const index = caseObj.findings.findIndex(f => f.id === findingId);
        if (index === -1) return false;

        caseObj.findings.splice(index, 1);
        this.updateCase(caseId, { findings: caseObj.findings });
        return true;
    },

    // ==========================================
    // Notes Management
    // ==========================================

    /**
     * Add a note to a case
     * @param {string} caseId - Case ID
     * @param {string} content - Note content
     * @returns {Object|null} Created note
     */
    addNote(caseId, content) {
        const caseObj = this.getCase(caseId);
        if (!caseObj) return null;

        const note = {
            id: SPECTRE_UTILS.string.uniqueId('note'),
            timestamp: Date.now(),
            content: content
        };

        caseObj.notes.push(note);
        
        this.addTimelineEvent(caseId, 'note', 'Note added');
        this.updateCase(caseId, { notes: caseObj.notes });

        return note;
    },

    /**
     * Delete a note
     * @param {string} caseId - Case ID
     * @param {string} noteId - Note ID
     * @returns {boolean} Success
     */
    deleteNote(caseId, noteId) {
        const caseObj = this.getCase(caseId);
        if (!caseObj) return false;

        const index = caseObj.notes.findIndex(n => n.id === noteId);
        if (index === -1) return false;

        caseObj.notes.splice(index, 1);
        this.updateCase(caseId, { notes: caseObj.notes });
        return true;
    },

    // ==========================================
    // Timeline
    // ==========================================

    /**
     * Add event to case timeline
     * @param {string} caseId - Case ID
     * @param {string} type - Event type
     * @param {string} description - Event description
     */
    addTimelineEvent(caseId, type, description) {
        const caseObj = this.getCase(caseId);
        if (!caseObj) return;

        caseObj.timeline.push({
            type,
            timestamp: Date.now(),
            description
        });

        // Keep timeline manageable (last 200 events)
        if (caseObj.timeline.length > 200) {
            caseObj.timeline = caseObj.timeline.slice(-200);
        }
    },

    // ==========================================
    // Export
    // ==========================================

    /**
     * Export a case as a comprehensive report
     * @param {string} caseId - Case ID
     * @param {string} format - Export format: 'json', 'markdown', 'html'
     * @returns {Object} Export data with content and filename
     */
    exportCase(caseId, format = 'json') {
        const caseObj = this.getCase(caseId);
        if (!caseObj) return null;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const safeName = SPECTRE_UTILS.string.slugify(caseObj.name);

        switch (format) {
            case 'json':
                return {
                    content: JSON.stringify(caseObj, null, 2),
                    filename: `spectre-case-${safeName}-${timestamp}.json`,
                    mimeType: 'application/json'
                };

            case 'markdown':
                return {
                    content: this.caseToMarkdown(caseObj),
                    filename: `spectre-case-${safeName}-${timestamp}.md`,
                    mimeType: 'text/markdown'
                };

            case 'html':
                return {
                    content: this.caseToHTML(caseObj),
                    filename: `spectre-case-${safeName}-${timestamp}.html`,
                    mimeType: 'text/html'
                };

            default:
                return null;
        }
    },

    /**
     * Convert case to Markdown report
     * @param {Object} caseObj - Case object
     * @returns {string} Markdown content
     */
    caseToMarkdown(caseObj) {
        let md = `# Investigation: ${caseObj.name}\n\n`;
        md += `**Status:** ${caseObj.status} | **Priority:** ${caseObj.priority}\n`;
        md += `**Created:** ${new Date(caseObj.createdAt).toLocaleString()}\n`;
        md += `**Last Updated:** ${new Date(caseObj.updatedAt).toLocaleString()}\n\n`;

        if (caseObj.description) {
            md += `## Description\n\n${caseObj.description}\n\n`;
        }

        if (caseObj.tags.length > 0) {
            md += `**Tags:** ${caseObj.tags.join(', ')}\n\n`;
        }

        // Subject/Target
        if (Object.keys(caseObj.metadata.subject).length > 0) {
            md += `## Subject Information\n\n`;
            Object.entries(caseObj.metadata.subject).forEach(([key, value]) => {
                if (value) md += `- **${key}:** ${value}\n`;
            });
            md += '\n';
        }

        // Findings
        if (caseObj.findings.length > 0) {
            md += `## Findings (${caseObj.findings.length})\n\n`;
            
            // Group by importance
            const byImportance = { critical: [], high: [], medium: [], low: [] };
            caseObj.findings.forEach(f => {
                byImportance[f.importance]?.push(f) || byImportance.medium.push(f);
            });

            ['critical', 'high', 'medium', 'low'].forEach(importance => {
                if (byImportance[importance].length > 0) {
                    md += `### ${importance.charAt(0).toUpperCase() + importance.slice(1)} Priority\n\n`;
                    byImportance[importance].forEach(f => {
                        md += `#### ${f.title}\n`;
                        md += `*${new Date(f.timestamp).toLocaleString()}*`;
                        if (f.toolName) md += ` | Tool: ${f.toolName}`;
                        md += '\n\n';
                        md += `${f.content}\n\n`;
                        if (f.toolUrl) md += `🔗 [Open Tool](${f.toolUrl})\n\n`;
                    });
                }
            });
        }

        // Searches
        if (caseObj.searches.length > 0) {
            md += `## Search History (${caseObj.searches.length})\n\n`;
            caseObj.searches.forEach((search, i) => {
                md += `### Search ${i + 1} - ${new Date(search.timestamp).toLocaleString()}\n`;
                md += `**Parameters:** ${this.formatSearchSummary(search.values)}\n`;
                md += `**Tools Generated:** ${search.toolCount}\n\n`;
            });
        }

        // Notes
        if (caseObj.notes.length > 0) {
            md += `## Notes\n\n`;
            caseObj.notes.forEach(note => {
                md += `**${new Date(note.timestamp).toLocaleString()}**\n`;
                md += `${note.content}\n\n---\n\n`;
            });
        }

        // Tool Status Summary
        const statusCounts = {};
        Object.values(caseObj.toolStatuses).forEach(status => {
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        if (Object.keys(statusCounts).length > 0) {
            md += `## Tool Status Summary\n\n`;
            Object.entries(statusCounts).forEach(([status, count]) => {
                const config = this.STATUS_CONFIG[status];
                md += `- ${config.icon} ${config.label}: ${count}\n`;
            });
            md += '\n';
        }

        md += `---\n\n*Exported from SPECTRE OSINT Platform*\n`;

        return md;
    },

    /**
     * Convert case to HTML report
     * @param {Object} caseObj - Case object
     * @returns {string} HTML content
     */
    caseToHTML(caseObj) {
        const statusCounts = {};
        Object.values(caseObj.toolStatuses).forEach(status => {
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Investigation: ${SPECTRE_UTILS.string.escapeHtml(caseObj.name)}</title>
    <style>
        :root {
            --bg: #0d0e10;
            --bg-card: #1a1c1f;
            --border: #32363a;
            --text: #f0f2f4;
            --text-muted: #9ca3af;
            --accent: #3b82f6;
            --green: #10b981;
            --amber: #f59e0b;
            --red: #ef4444;
            --purple: #8b5cf6;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
            padding: 2rem;
        }
        .container { max-width: 1000px; margin: 0 auto; }
        header {
            padding: 2rem;
            background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1));
            border-radius: 12px;
            border: 1px solid var(--border);
            margin-bottom: 2rem;
        }
        h1 {
            font-size: 1.75rem;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }
        .meta { color: var(--text-muted); font-size: 0.875rem; }
        .badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            margin-right: 0.5rem;
        }
        .badge-active { background: rgba(16,185,129,0.15); color: var(--green); }
        .badge-closed { background: rgba(107,114,128,0.15); color: var(--text-muted); }
        .badge-high { background: rgba(239,68,68,0.15); color: var(--red); }
        .badge-medium { background: rgba(245,158,11,0.15); color: var(--amber); }
        .badge-low { background: rgba(59,130,246,0.15); color: var(--accent); }
        .badge-critical { background: rgba(239,68,68,0.3); color: #ff6b6b; }
        section {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        h2 {
            font-size: 1.1rem;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--border);
        }
        .finding {
            padding: 1rem;
            background: rgba(0,0,0,0.2);
            border-radius: 8px;
            margin-bottom: 1rem;
        }
        .finding h3 { font-size: 1rem; margin-bottom: 0.5rem; }
        .finding .meta { margin-bottom: 0.75rem; }
        .finding p { color: var(--text-secondary); }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
        }
        .stat {
            background: rgba(0,0,0,0.2);
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
        }
        .stat-value { font-size: 1.5rem; font-weight: 600; }
        .stat-label { font-size: 0.75rem; color: var(--text-muted); }
        footer {
            text-align: center;
            padding: 2rem;
            color: var(--text-muted);
            font-size: 0.8rem;
        }
        a { color: var(--accent); text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📁 ${SPECTRE_UTILS.string.escapeHtml(caseObj.name)}</h1>
            <p class="meta">
                <span class="badge badge-${caseObj.status}">${caseObj.status}</span>
                <span class="badge badge-${caseObj.priority}">${caseObj.priority} priority</span>
            </p>
            <p class="meta" style="margin-top: 0.5rem;">
                Created: ${new Date(caseObj.createdAt).toLocaleString()} | 
                Updated: ${new Date(caseObj.updatedAt).toLocaleString()}
            </p>
            ${caseObj.description ? `<p style="margin-top: 1rem; color: var(--text-secondary);">${SPECTRE_UTILS.string.escapeHtml(caseObj.description)}</p>` : ''}
        </header>

        <section>
            <h2>📊 Summary</h2>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">${caseObj.searches.length}</div>
                    <div class="stat-label">Searches</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${caseObj.findings.length}</div>
                    <div class="stat-label">Findings</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${Object.keys(caseObj.toolStatuses).length}</div>
                    <div class="stat-label">Tools Reviewed</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${statusCounts['useful'] || 0}</div>
                    <div class="stat-label">Useful Tools</div>
                </div>
            </div>
        </section>

        ${caseObj.findings.length > 0 ? `
        <section>
            <h2>🔍 Key Findings</h2>
            ${caseObj.findings.map(f => `
                <div class="finding">
                    <h3>${SPECTRE_UTILS.string.escapeHtml(f.title)}</h3>
                    <p class="meta">
                        <span class="badge badge-${f.importance}">${f.importance}</span>
                        ${f.toolName ? `Tool: ${SPECTRE_UTILS.string.escapeHtml(f.toolName)}` : ''} |
                        ${new Date(f.timestamp).toLocaleString()}
                    </p>
                    <p>${SPECTRE_UTILS.string.escapeHtml(f.content)}</p>
                    ${f.toolUrl ? `<p style="margin-top: 0.5rem;"><a href="${SPECTRE_UTILS.string.escapeHtml(f.toolUrl)}" target="_blank">Open Tool →</a></p>` : ''}
                </div>
            `).join('')}
        </section>
        ` : ''}

        ${caseObj.notes.length > 0 ? `
        <section>
            <h2>📝 Notes</h2>
            ${caseObj.notes.map(n => `
                <div class="finding">
                    <p class="meta">${new Date(n.timestamp).toLocaleString()}</p>
                    <p>${SPECTRE_UTILS.string.escapeHtml(n.content)}</p>
                </div>
            `).join('')}
        </section>
        ` : ''}

        <footer>
            <p>Generated by <a href="#">SPECTRE OSINT Platform</a> on ${new Date().toLocaleString()}</p>
        </footer>
    </div>
</body>
</html>`;
    },

    // ==========================================
    // UI Integration
    // ==========================================

    /**
     * Show case manager modal
     */
    showCaseManagerModal() {
        const cases = this.getAllCases();
        const activeCase = this.getActiveCase();

        const casesHtml = cases.length > 0 
            ? cases.map(c => `
                <div class="case-item ${c.id === activeCase?.id ? 'active' : ''}" data-case-id="${c.id}">
                    <div class="case-info" onclick="SPECTRE.cases.setActiveCase('${c.id}'); SPECTRE.cases.showCaseManagerModal();">
                        <div class="case-name">${SPECTRE_UTILS.string.escapeHtml(c.name)}</div>
                        <div class="case-meta">
                            ${c.findings.length} findings • ${c.searches.length} searches • 
                            ${SPECTRE_UTILS.date.relativeTime(c.updatedAt)}
                        </div>
                    </div>
                    <div class="case-actions">
                        <button class="btn btn-xs" onclick="SPECTRE.cases.showCaseDetail('${c.id}')" data-tooltip="View details">📋</button>
                        <button class="btn btn-xs" onclick="SPECTRE.cases.confirmDeleteCase('${c.id}')" data-tooltip="Delete">🗑️</button>
                    </div>
                </div>
            `).join('')
            : '<div class="empty-state">No investigations yet. Create one to start tracking your research.</div>';

        SPECTRE_UI.showModal('📁 Case Manager', `
            <style>
                .case-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem;
                    background: var(--bg-tertiary);
                    border-radius: 8px;
                    margin-bottom: 0.5rem;
                    cursor: pointer;
                    border: 2px solid transparent;
                    transition: all 0.15s ease;
                }
                .case-item:hover { background: var(--bg-secondary); }
                .case-item.active { border-color: var(--accent-primary); }
                .case-name { font-weight: 500; }
                .case-meta { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; }
                .case-actions { display: flex; gap: 0.25rem; }
                .empty-state {
                    text-align: center;
                    padding: 2rem;
                    color: var(--text-muted);
                }
                .active-case-banner {
                    background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1));
                    border: 1px solid var(--accent-primary);
                    border-radius: 8px;
                    padding: 0.75rem;
                    margin-bottom: 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
            </style>

            ${activeCase ? `
                <div class="active-case-banner">
                    <div>
                        <strong>Active:</strong> ${SPECTRE_UTILS.string.escapeHtml(activeCase.name)}
                    </div>
                    <button class="btn btn-xs" onclick="SPECTRE.cases.setActiveCase(null); SPECTRE.cases.showCaseManagerModal();">
                        Clear
                    </button>
                </div>
            ` : ''}

            <div style="margin-bottom: 1rem;">
                <button class="btn btn-primary" onclick="SPECTRE.cases.showCreateCaseModal()" style="width: 100%;">
                    ➕ New Investigation
                </button>
            </div>

            <div class="cases-list" style="max-height: 400px; overflow-y: auto;">
                ${casesHtml}
            </div>
        `, [{ text: 'Close', action: 'SPECTRE.ui.closeModal()' }]);
    },

    /**
     * Show create case modal
     */
    showCreateCaseModal() {
        SPECTRE_UI.showModal('➕ New Investigation', `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Investigation Name *</label>
                    <input type="text" id="newCaseName" class="form-input" placeholder="e.g., John Doe Background Check" style="width: 100%;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Description</label>
                    <textarea id="newCaseDesc" class="form-input" placeholder="Brief description of the investigation..." rows="3" style="width: 100%; resize: vertical;"></textarea>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Priority</label>
                    <select id="newCasePriority" class="select" style="width: 100%;">
                        <option value="low">🟢 Low</option>
                        <option value="medium" selected>🟡 Medium</option>
                        <option value="high">🟠 High</option>
                        <option value="critical">🔴 Critical</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Tags (comma-separated)</label>
                    <input type="text" id="newCaseTags" class="form-input" placeholder="background-check, corporate, fraud" style="width: 100%;">
                </div>
            </div>
        `, [
            { text: 'Cancel', action: 'SPECTRE.cases.showCaseManagerModal()' },
            { text: 'Create', class: 'btn-primary', action: 'SPECTRE.cases.createCaseFromModal()' }
        ]);

        // Focus name input
        setTimeout(() => document.getElementById('newCaseName')?.focus(), 100);
    },

    /**
     * Create case from modal inputs
     */
    createCaseFromModal() {
        const name = document.getElementById('newCaseName')?.value.trim();
        const description = document.getElementById('newCaseDesc')?.value.trim();
        const priority = document.getElementById('newCasePriority')?.value;
        const tagsInput = document.getElementById('newCaseTags')?.value.trim();

        if (!name) {
            SPECTRE_UI.toast('Please enter an investigation name', 'warning');
            return;
        }

        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

        const newCase = this.createCase({ name, description, priority, tags });
        this.setActiveCase(newCase.id);

        SPECTRE_UI.toast(`Investigation "${name}" created`, 'success');
        this.showCaseManagerModal();
    },

    /**
     * Confirm case deletion
     * @param {string} caseId - Case ID
     */
    confirmDeleteCase(caseId) {
        const caseObj = this.getCase(caseId);
        if (!caseObj) return;

        if (confirm(`Delete investigation "${caseObj.name}"? This cannot be undone.`)) {
            this.deleteCase(caseId);
            SPECTRE_UI.toast('Investigation deleted', 'info');
            this.showCaseManagerModal();
        }
    },

    /**
     * Show case detail view
     * @param {string} caseId - Case ID
     */
    showCaseDetail(caseId) {
        const caseObj = this.getCase(caseId);
        if (!caseObj) return;

        const statusCounts = {};
        Object.values(caseObj.toolStatuses).forEach(status => {
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        SPECTRE_UI.showModal(`📁 ${SPECTRE_UTILS.string.escapeHtml(caseObj.name)}`, `
            <style>
                .detail-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem; }
                .detail-tab { padding: 0.5rem 1rem; cursor: pointer; border-radius: 6px 6px 0 0; }
                .detail-tab.active { background: var(--accent-primary); color: white; }
                .detail-content { max-height: 400px; overflow-y: auto; }
                .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-bottom: 1rem; }
                .stat-box { background: var(--bg-tertiary); padding: 0.75rem; border-radius: 8px; text-align: center; }
                .stat-value { font-size: 1.25rem; font-weight: 600; }
                .stat-label { font-size: 0.7rem; color: var(--text-muted); }
                .finding-item { background: var(--bg-tertiary); padding: 0.75rem; border-radius: 6px; margin-bottom: 0.5rem; }
                .finding-title { font-weight: 500; margin-bottom: 0.25rem; }
                .finding-content { font-size: 0.85rem; color: var(--text-secondary); }
            </style>

            <div class="stat-grid">
                <div class="stat-box">
                    <div class="stat-value">${caseObj.searches.length}</div>
                    <div class="stat-label">Searches</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${caseObj.findings.length}</div>
                    <div class="stat-label">Findings</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${statusCounts['useful'] || 0}</div>
                    <div class="stat-label">Useful</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${statusCounts['follow-up'] || 0}</div>
                    <div class="stat-label">Follow-up</div>
                </div>
            </div>

            ${caseObj.description ? `<p style="margin-bottom: 1rem; color: var(--text-secondary);">${SPECTRE_UTILS.string.escapeHtml(caseObj.description)}</p>` : ''}

            <div class="detail-content">
                ${caseObj.findings.length > 0 ? `
                    <h4 style="margin-bottom: 0.5rem;">Recent Findings</h4>
                    ${caseObj.findings.slice(-5).reverse().map(f => `
                        <div class="finding-item">
                            <div class="finding-title">${SPECTRE_UTILS.string.escapeHtml(f.title)}</div>
                            <div class="finding-content">${SPECTRE_UTILS.string.escapeHtml(SPECTRE_UTILS.string.truncate(f.content, 100))}</div>
                        </div>
                    `).join('')}
                ` : '<p style="color: var(--text-muted);">No findings yet.</p>'}
            </div>
        `, [
            { text: 'Back', action: 'SPECTRE.cases.showCaseManagerModal()' },
            { text: 'Export', action: `SPECTRE.cases.exportCaseUI('${caseId}')` },
            { text: 'Set Active', class: 'btn-primary', action: `SPECTRE.cases.setActiveCase('${caseId}'); SPECTRE.ui.closeModal(); SPECTRE.ui.toast('Case activated', 'success');` }
        ]);
    },

    /**
     * Export case UI handler
     * @param {string} caseId - Case ID
     */
    exportCaseUI(caseId) {
        const format = prompt('Export format: json, markdown, or html', 'markdown');
        if (!format) return;

        const exportData = this.exportCase(caseId, format.toLowerCase());
        if (exportData) {
            SPECTRE_EXPORT.downloadFile(exportData.content, exportData.filename, exportData.mimeType);
            SPECTRE_UI.toast('Case exported', 'success');
        } else {
            SPECTRE_UI.toast('Export failed', 'error');
        }
    },

    /**
     * Quick-add finding from tool (for results page integration)
     * @param {string} toolId - Tool ID
     * @param {string} toolName - Tool name
     * @param {string} toolUrl - Tool URL
     * @param {string} category - Tool category
     */
    quickAddFinding(toolId, toolName, toolUrl, category) {
        const activeCase = this.getActiveCase();
        if (!activeCase) {
            SPECTRE_UI.toast('No active investigation. Open Case Manager to create one.', 'warning');
            return;
        }

        const content = prompt(`Add finding from ${toolName}:\n\nWhat did you discover?`);
        if (!content) return;

        const title = prompt('Finding title:', `Finding from ${toolName}`);
        if (!title) return;

        this.addFinding(activeCase.id, {
            toolId,
            toolName,
            toolUrl,
            category,
            title,
            content,
            importance: 'medium'
        });

        SPECTRE_UI.toast('Finding added to investigation', 'success');
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.SPECTRE_CASES = SPECTRE_CASES;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SPECTRE_CASES.init());
    } else {
        SPECTRE_CASES.init();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPECTRE_CASES;
}
