/* ============================================
   SPECTRE - Export Module
   Version: 2.0.0 (Modular)
   
   Handles exporting search results in various formats:
   - JSON
   - CSV
   - Markdown
   - HTML Report
   
   Dependencies: utils.js, ui.js
   ============================================ */

/**
 * SPECTRE Export Namespace
 */
const SPECTRE_EXPORT = {

    /**
     * Export results in specified format
     * @param {string} format - Export format: 'json', 'csv', 'markdown', 'html'
     */
    exportAs(format) {
        // Get current state from app
        const state = window.SPECTRE?.app?.state || {};
        const links = state.generatedLinks || [];
        const filter = state.filter || 'all';

        // Filter links based on current filter
        const data = links.filter(link => {
            if (filter === 'all' || filter === 'active') return true;
            return link.badge === filter;
        });

        if (data.length === 0) {
            SPECTRE_UI.toast('No results to export', 'warning');
            return;
        }

        // Get current search values for metadata
        const searchValues = this.getCurrentSearchValues();

        let content, filename, mimeType;

        switch (format) {
            case 'json':
                ({ content, filename, mimeType } = this.toJSON(data, searchValues));
                break;
            case 'csv':
                ({ content, filename, mimeType } = this.toCSV(data));
                break;
            case 'markdown':
                ({ content, filename, mimeType } = this.toMarkdown(data, searchValues));
                break;
            case 'html':
                ({ content, filename, mimeType } = this.toHTML(data, searchValues));
                break;
            default:
                SPECTRE_UI.toast('Unknown export format', 'error');
                return;
        }

        // Download file
        this.downloadFile(content, filename, mimeType);

        // Close dropdown and show success
        SPECTRE_UI.closeAllDropdowns();
        SPECTRE_UI.toast(`Exported ${data.length} tools as ${format.toUpperCase()}`, 'success');
    },

    /**
     * Get current search values from inputs
     * @returns {Object} Search values
     */
    getCurrentSearchValues() {
        return {
            firstName: document.getElementById('firstName')?.value || '',
            lastName: document.getElementById('lastName')?.value || '',
            username: document.getElementById('username')?.value || '',
            email: document.getElementById('email')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            domain: document.getElementById('domain')?.value || '',
            ip: document.getElementById('ip')?.value || '',
            company: document.getElementById('company')?.value || ''
        };
    },

    /**
     * Export as JSON
     * @param {Array} data - Links data
     * @param {Object} searchValues - Search parameters
     * @returns {Object} Export data
     */
    toJSON(data, searchValues) {
        const exportData = {
            meta: {
                tool: 'SPECTRE OSINT Platform',
                version: '2.0.0',
                exportedAt: new Date().toISOString(),
                searchParameters: searchValues,
                totalResults: data.length
            },
            results: data.map(d => ({
                name: d.name,
                category: d.category,
                url: d.url,
                type: d.badge,
                description: d.desc || ''
            }))
        };

        return {
            content: JSON.stringify(exportData, null, 2),
            filename: `spectre-results-${this.getTimestamp()}.json`,
            mimeType: 'application/json'
        };
    },

    /**
     * Export as CSV
     * @param {Array} data - Links data
     * @returns {Object} Export data
     */
    toCSV(data) {
        // CSV header
        const header = ['Name', 'Category', 'URL', 'Type', 'Description'];
        
        // CSV rows
        const rows = data.map(d => [
            this.escapeCSV(d.name),
            this.escapeCSV(d.category),
            this.escapeCSV(d.url),
            this.escapeCSV(d.badge),
            this.escapeCSV(d.desc || '')
        ]);

        // Combine
        const content = [
            header.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        return {
            content,
            filename: `spectre-results-${this.getTimestamp()}.csv`,
            mimeType: 'text/csv;charset=utf-8'
        };
    },

    /**
     * Escape value for CSV
     * @param {string} value - Value to escape
     * @returns {string} Escaped value
     */
    escapeCSV(value) {
        if (!value) return '""';
        const str = String(value);
        // Escape quotes and wrap in quotes if contains special chars
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    },

    /**
     * Export as Markdown
     * @param {Array} data - Links data
     * @param {Object} searchValues - Search parameters
     * @returns {Object} Export data
     */
    toMarkdown(data, searchValues) {
        // Build search summary
        const searchParts = [];
        if (searchValues.firstName || searchValues.lastName) {
            searchParts.push(`**Name:** ${searchValues.firstName} ${searchValues.lastName}`.trim());
        }
        if (searchValues.username) searchParts.push(`**Username:** ${searchValues.username}`);
        if (searchValues.email) searchParts.push(`**Email:** ${searchValues.email}`);
        if (searchValues.phone) searchParts.push(`**Phone:** ${searchValues.phone}`);
        if (searchValues.domain) searchParts.push(`**Domain:** ${searchValues.domain}`);
        if (searchValues.ip) searchParts.push(`**IP:** ${searchValues.ip}`);
        if (searchValues.company) searchParts.push(`**Company:** ${searchValues.company}`);

        // Group by category
        const grouped = {};
        data.forEach(d => {
            if (!grouped[d.category]) grouped[d.category] = [];
            grouped[d.category].push(d);
        });

        // Build markdown
        let md = `# SPECTRE OSINT Results\n\n`;
        md += `**Generated:** ${new Date().toLocaleString()}\n\n`;
        
        if (searchParts.length > 0) {
            md += `## Search Parameters\n\n`;
            md += searchParts.join(' | ') + '\n\n';
        }

        md += `## Results (${data.length} tools)\n\n`;

        // Add categorized results
        Object.entries(grouped).forEach(([category, tools]) => {
            md += `### ${category} (${tools.length})\n\n`;
            tools.forEach(tool => {
                const badge = this.getBadgeEmoji(tool.badge);
                md += `- ${badge} [${tool.name}](${tool.url})`;
                if (tool.desc) md += ` - ${tool.desc}`;
                md += '\n';
            });
            md += '\n';
        });

        md += `---\n\n*Exported from [SPECTRE OSINT Platform](https://github.com/spectre-osint)*\n`;

        return {
            content: md,
            filename: `spectre-results-${this.getTimestamp()}.md`,
            mimeType: 'text/markdown;charset=utf-8'
        };
    },

    /**
     * Export as HTML Report
     * @param {Array} data - Links data
     * @param {Object} searchValues - Search parameters
     * @returns {Object} Export data
     */
    toHTML(data, searchValues) {
        // Group by category
        const grouped = {};
        data.forEach(d => {
            if (!grouped[d.category]) grouped[d.category] = [];
            grouped[d.category].push(d);
        });

        // Build search summary
        const searchSummary = [];
        if (searchValues.firstName || searchValues.lastName) {
            searchSummary.push(`Name: ${searchValues.firstName} ${searchValues.lastName}`.trim());
        }
        if (searchValues.username) searchSummary.push(`Username: ${searchValues.username}`);
        if (searchValues.email) searchSummary.push(`Email: ${searchValues.email}`);
        if (searchValues.domain) searchSummary.push(`Domain: ${searchValues.domain}`);

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SPECTRE OSINT Report</title>
    <style>
        :root {
            --bg: #0d0e10;
            --bg-card: #1e2023;
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
            text-align: center;
            padding: 2rem;
            margin-bottom: 2rem;
            background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1));
            border-radius: 12px;
            border: 1px solid var(--border);
        }
        h1 {
            font-size: 2rem;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }
        .meta { color: var(--text-muted); font-size: 0.875rem; }
        .search-params {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            justify-content: center;
            margin-top: 1rem;
        }
        .param {
            background: var(--bg-card);
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.875rem;
        }
        .category {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            margin-bottom: 1.5rem;
            overflow: hidden;
        }
        .category-header {
            padding: 1rem 1.25rem;
            background: rgba(255,255,255,0.02);
            border-bottom: 1px solid var(--border);
            font-weight: 600;
        }
        .category-header span { opacity: 0.6; font-weight: 400; }
        .tools { padding: 0.5rem; }
        .tool {
            display: flex;
            align-items: center;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            transition: background 0.15s;
        }
        .tool:hover { background: rgba(255,255,255,0.03); }
        .tool-name {
            flex: 1;
            font-weight: 500;
        }
        .tool-name a {
            color: var(--accent);
            text-decoration: none;
        }
        .tool-name a:hover { text-decoration: underline; }
        .tool-desc {
            flex: 2;
            color: var(--text-muted);
            font-size: 0.8rem;
            padding: 0 1rem;
        }
        .badge {
            font-size: 0.7rem;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            text-transform: uppercase;
            font-weight: 600;
        }
        .badge-free { background: rgba(16,185,129,0.15); color: var(--green); }
        .badge-freemium { background: rgba(245,158,11,0.15); color: var(--amber); }
        .badge-paid { background: rgba(239,68,68,0.15); color: var(--red); }
        .badge-cli { background: rgba(139,92,246,0.15); color: var(--purple); }
        footer {
            text-align: center;
            padding: 2rem;
            color: var(--text-muted);
            font-size: 0.8rem;
        }
        footer a { color: var(--accent); }
        @media (max-width: 600px) {
            body { padding: 1rem; }
            .tool { flex-wrap: wrap; }
            .tool-desc { order: 3; width: 100%; padding: 0.5rem 0 0 0; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>👁️ SPECTRE OSINT Report</h1>
            <p class="meta">Generated: ${new Date().toLocaleString()} • ${data.length} tools</p>
            ${searchSummary.length > 0 ? `
                <div class="search-params">
                    ${searchSummary.map(s => `<span class="param">${SPECTRE_UTILS.string.escapeHtml(s)}</span>`).join('')}
                </div>
            ` : ''}
        </header>

        ${Object.entries(grouped).map(([category, tools]) => `
            <section class="category">
                <div class="category-header">
                    ${SPECTRE_UTILS.string.escapeHtml(category)} <span>(${tools.length})</span>
                </div>
                <div class="tools">
                    ${tools.map(tool => `
                        <div class="tool">
                            <div class="tool-name">
                                <a href="${SPECTRE_UTILS.string.escapeHtml(tool.url)}" target="_blank" rel="noopener">
                                    ${SPECTRE_UTILS.string.escapeHtml(tool.name)}
                                </a>
                            </div>
                            <div class="tool-desc">${SPECTRE_UTILS.string.escapeHtml(tool.desc || '')}</div>
                            <span class="badge badge-${tool.badge}">${tool.badge}</span>
                        </div>
                    `).join('')}
                </div>
            </section>
        `).join('')}

        <footer>
            <p>Generated by <a href="https://github.com/spectre-osint" target="_blank">SPECTRE OSINT Platform</a></p>
        </footer>
    </div>
</body>
</html>`;

        return {
            content: html,
            filename: `spectre-report-${this.getTimestamp()}.html`,
            mimeType: 'text/html;charset=utf-8'
        };
    },

    /**
     * Get badge emoji for markdown
     * @param {string} badge - Badge type
     * @returns {string} Emoji
     */
    getBadgeEmoji(badge) {
        const emojis = {
            free: '🟢',
            freemium: '🟡',
            paid: '🔴',
            cli: '🟣'
        };
        return emojis[badge] || '⚪';
    },

    /**
     * Get timestamp for filename
     * @returns {string} Timestamp string
     */
    getTimestamp() {
        return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    },

    /**
     * Download file to user's device
     * @param {string} content - File content
     * @param {string} filename - File name
     * @param {string} mimeType - MIME type
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Cleanup
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    },

    /**
     * Copy all links to clipboard
     */
    async copyAllLinks() {
        const state = window.SPECTRE?.app?.state || {};
        const links = state.generatedLinks || [];
        const filter = state.filter || 'all';

        const data = links.filter(link => {
            if (filter === 'all' || filter === 'active') return true;
            return link.badge === filter;
        });

        if (data.length === 0) {
            SPECTRE_UI.toast('No links to copy', 'warning');
            return;
        }

        const text = data.map(l => `${l.name}: ${l.url}`).join('\n');
        
        const success = await SPECTRE_UTILS.clipboard.copy(text);
        
        if (success) {
            SPECTRE_UI.toast(`Copied ${data.length} URLs`, 'success');
        } else {
            SPECTRE_UI.toast('Failed to copy', 'error');
        }
    }
};

// Export for global access
if (typeof window !== 'undefined') {
    window.SPECTRE_EXPORT = SPECTRE_EXPORT;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPECTRE_EXPORT;
}
