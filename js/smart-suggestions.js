/* ============================================
   SPECTRE - Smart Suggestions Module
   Version: 2.1.0
   
   Intelligent input analysis and recommendations:
   - Auto-detect input types (email, phone, crypto, etc.)
   - Pattern matching for VINs, IPs, domains
   - Recommend tools based on input patterns
   - Show similar/alternative tools
   - Field validation with helpful hints
   
   Dependencies: utils.js, tools-db.js, ui.js
   ============================================ */

/**
 * SPECTRE Smart Suggestions Namespace
 */
const SPECTRE_SUGGESTIONS = {

    /**
     * Pattern definitions for input detection
     */
    PATTERNS: {
        email: {
            regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            label: 'Email Address',
            icon: '📧',
            field: 'email',
            categories: ['email', 'breach', 'social'],
            description: 'Email detected - can check breaches, reputation, and account discovery'
        },
        phone: {
            regex: /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/,
            validate: (v) => v.replace(/\D/g, '').length >= 7 && v.replace(/\D/g, '').length <= 15,
            label: 'Phone Number',
            icon: '📱',
            field: 'phone',
            categories: ['phone'],
            description: 'Phone number detected - can perform reverse lookups'
        },
        ip: {
            regex: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
            label: 'IPv4 Address',
            icon: '🔌',
            field: 'ip',
            categories: ['ip'],
            description: 'IP address detected - can check geolocation, reputation, and services'
        },
        ipv6: {
            regex: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$/,
            label: 'IPv6 Address',
            icon: '🔌',
            field: 'ip',
            categories: ['ip'],
            description: 'IPv6 address detected'
        },
        domain: {
            regex: /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
            validate: (v) => !v.includes('@') && v.includes('.') && v.length > 3,
            label: 'Domain Name',
            icon: '🌐',
            field: 'domain',
            categories: ['domain', 'archive'],
            description: 'Domain detected - can check WHOIS, DNS, certificates, and archives'
        },
        url: {
            regex: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
            label: 'URL',
            icon: '🔗',
            field: 'domain',
            transform: (v) => {
                try {
                    return new URL(v).hostname;
                } catch {
                    return v;
                }
            },
            categories: ['domain', 'archive'],
            description: 'URL detected - will extract domain for lookups'
        },
        btc: {
            regex: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/,
            label: 'Bitcoin Address',
            icon: '₿',
            field: 'crypto',
            categories: ['crypto'],
            description: 'Bitcoin address detected - can track transactions and balance'
        },
        eth: {
            regex: /^0x[a-fA-F0-9]{40}$/,
            label: 'Ethereum Address',
            icon: 'Ξ',
            field: 'crypto',
            categories: ['crypto'],
            description: 'Ethereum address detected - can explore transactions'
        },
        vin: {
            regex: /^[A-HJ-NPR-Z0-9]{17}$/i,
            validate: (v) => {
                // VIN validation: no I, O, or Q
                const invalid = /[IOQ]/i;
                return !invalid.test(v) && v.length === 17;
            },
            label: 'Vehicle VIN',
            icon: '🚗',
            field: 'vin',
            categories: ['vehicle'],
            description: 'VIN detected - can check vehicle history and recalls'
        },
        ssn: {
            regex: /^\d{3}-?\d{2}-?\d{4}$/,
            label: 'SSN Pattern',
            icon: '⚠️',
            field: null, // Don't auto-fill
            categories: [],
            description: 'SSN pattern detected - use with extreme caution',
            warning: true
        },
        username: {
            regex: /^[a-zA-Z0-9_.-]{3,30}$/,
            validate: (v) => !v.includes('@') && !v.includes('.') && !v.includes(' '),
            label: 'Username',
            icon: '👤',
            field: 'username',
            categories: ['username', 'social'],
            description: 'Possible username - can check across social platforms'
        },
        macAddress: {
            regex: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
            label: 'MAC Address',
            icon: '📡',
            field: null,
            categories: [],
            description: 'MAC address detected - can look up manufacturer'
        },
        md5: {
            regex: /^[a-fA-F0-9]{32}$/,
            label: 'MD5 Hash',
            icon: '#️⃣',
            field: null,
            categories: ['hash'],
            description: 'MD5 hash detected - can search hash databases'
        },
        sha1: {
            regex: /^[a-fA-F0-9]{40}$/,
            label: 'SHA-1 Hash',
            icon: '#️⃣',
            field: null,
            categories: ['hash'],
            description: 'SHA-1 hash detected'
        },
        sha256: {
            regex: /^[a-fA-F0-9]{64}$/,
            label: 'SHA-256 Hash',
            icon: '#️⃣',
            field: null,
            categories: ['hash'],
            description: 'SHA-256 hash detected'
        },
        coordinates: {
            regex: /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/,
            label: 'GPS Coordinates',
            icon: '📍',
            field: null,
            categories: ['geolocation'],
            description: 'GPS coordinates detected - can map location'
        }
    },

    /**
     * Tool alternatives mapping
     * When one tool is down/paywalled, suggest these alternatives
     */
    ALTERNATIVES: {
        'TruePeopleSearch': ['FastPeopleSearch', 'ThatsThem', 'FamilyTreeNow'],
        'Spokeo': ['BeenVerified', 'Pipl', 'Nuwber'],
        'HaveIBeenPwned': ['DeHashed', 'LeakCheck', 'BreachDirectory'],
        'Shodan': ['Censys', 'ZoomEye', 'GreyNoise'],
        'VirusTotal': ['URLScan', 'AbuseIPDB', 'IPQualityScore'],
        'Hunter.io': ['Snov.io', 'Voila Norbert', 'FindThatEmail'],
        'Namechk': ['KnowEm', 'WhatsMyName', 'UserSearch'],
        'Google': ['DuckDuckGo', 'Bing', 'Yandex'],
        'TinEye': ['Google Lens', 'Yandex Images', 'Bing Visual Search'],
        'PimEyes': ['FaceCheck.ID', 'Search4faces'],
        'Maltego': ['SpiderFoot', 'theHarvester', 'Recon-ng']
    },

    /**
     * Field-based tool recommendations
     */
    FIELD_RECOMMENDATIONS: {
        email: {
            essential: ['Have I Been Pwned', 'EmailRep.io', 'Hunter.io'],
            expanded: ['Epieos', 'Holehe', 'IntelligenceX']
        },
        username: {
            essential: ['Namechk', 'WhatsMyName', 'Sherlock'],
            expanded: ['UserSearch', 'KnowEm', 'Maigret']
        },
        domain: {
            essential: ['WHOIS', 'crt.sh', 'DNSdumpster'],
            expanded: ['SecurityTrails', 'VirusTotal', 'BuiltWith', 'Shodan']
        },
        ip: {
            essential: ['IPinfo', 'AbuseIPDB', 'Shodan IP'],
            expanded: ['VirusTotal IP', 'GreyNoise', 'BGP Toolkit']
        },
        phone: {
            essential: ['TrueCaller', 'ThatsThem Phone', 'Carrier Lookup'],
            expanded: ['Spy Dialer', 'PhoneInfoga']
        },
        person: {
            essential: ['TruePeopleSearch', 'FastPeopleSearch', 'Google'],
            expanded: ['ThatsThem', 'Spokeo', 'FamilyTreeNow']
        }
    },

    // ==========================================
    // Input Detection
    // ==========================================

    /**
     * Detect the type of input value
     * @param {string} value - Input value to analyze
     * @returns {Object|null} Detection result or null
     */
    detectInputType(value) {
        if (!value || typeof value !== 'string') return null;
        
        const trimmed = value.trim();
        if (!trimmed) return null;

        // Check each pattern
        for (const [type, config] of Object.entries(this.PATTERNS)) {
            // Skip if basic regex doesn't match
            if (!config.regex.test(trimmed)) continue;

            // Additional validation if provided
            if (config.validate && !config.validate(trimmed)) continue;

            return {
                type,
                ...config,
                value: trimmed,
                transformedValue: config.transform ? config.transform(trimmed) : trimmed
            };
        }

        // Check if it looks like a name (First Last)
        const nameParts = trimmed.split(/\s+/);
        if (nameParts.length >= 2 && nameParts.every(p => /^[A-Za-z'-]+$/.test(p))) {
            return {
                type: 'name',
                label: 'Person Name',
                icon: '👤',
                field: 'firstName',
                secondaryField: 'lastName',
                categories: ['people', 'social', 'search'],
                description: 'Name detected - can search people databases',
                value: trimmed,
                firstName: nameParts[0],
                lastName: nameParts.slice(1).join(' ')
            };
        }

        // Default: treat as username if alphanumeric
        if (/^[a-zA-Z0-9_.-]+$/.test(trimmed) && trimmed.length >= 3) {
            return {
                type: 'username',
                label: 'Possible Username',
                icon: '👤',
                field: 'username',
                categories: ['username', 'social'],
                description: 'Could be a username - searching social platforms',
                value: trimmed,
                confidence: 'low'
            };
        }

        return null;
    },

    /**
     * Analyze multiple inputs and return best suggestions
     * @param {Object} values - Object with input values
     * @returns {Array} Array of suggestions
     */
    analyzeInputs(values) {
        const suggestions = [];
        const detectedTypes = new Set();

        Object.entries(values).forEach(([field, value]) => {
            if (!value) return;

            const detection = this.detectInputType(value);
            if (detection && !detectedTypes.has(detection.type)) {
                detectedTypes.add(detection.type);
                suggestions.push({
                    field,
                    ...detection,
                    recommendedTools: this.getRecommendedTools(detection.type)
                });
            }
        });

        return suggestions;
    },

    // ==========================================
    // Tool Recommendations
    // ==========================================

    /**
     * Get recommended tools for a detected type
     * @param {string} type - Detected input type
     * @returns {Object} Essential and expanded tool lists
     */
    getRecommendedTools(type) {
        // Map detection type to field recommendation key
        const typeToField = {
            'email': 'email',
            'phone': 'phone',
            'domain': 'domain',
            'url': 'domain',
            'ip': 'ip',
            'ipv6': 'ip',
            'username': 'username',
            'name': 'person',
            'btc': 'crypto',
            'eth': 'crypto'
        };

        const fieldKey = typeToField[type];
        if (!fieldKey) return { essential: [], expanded: [] };

        return this.FIELD_RECOMMENDATIONS[fieldKey] || { essential: [], expanded: [] };
    },

    /**
     * Get alternative tools when one is unavailable
     * @param {string} toolName - Tool name
     * @returns {Array} Alternative tool names
     */
    getAlternatives(toolName) {
        return this.ALTERNATIVES[toolName] || [];
    },

    /**
     * Find similar tools in the same category
     * @param {string} toolName - Tool name
     * @param {string} categoryId - Category ID
     * @returns {Array} Similar tools
     */
    getSimilarTools(toolName, categoryId) {
        const toolsDB = window.SPECTRE_TOOLS || {};
        const category = toolsDB[categoryId];
        
        if (!category || !category.tools) return [];

        return category.tools
            .filter(t => t.name !== toolName)
            .slice(0, 5)
            .map(t => ({
                name: t.name,
                badge: t.badge,
                desc: t.desc
            }));
    },

    // ==========================================
    // UI Integration
    // ==========================================

    /**
     * Render detection badge for an input
     * @param {Object} detection - Detection result
     * @returns {string} HTML
     */
    renderDetectionBadge(detection) {
        if (!detection) return '';

        const warningClass = detection.warning ? 'detection-warning' : '';
        
        return `
            <div class="detection-badge ${warningClass}" data-tooltip="${SPECTRE_UTILS.string.escapeHtml(detection.description)}">
                <span class="detection-icon">${detection.icon}</span>
                <span class="detection-label">${detection.label}</span>
            </div>
        `;
    },

    /**
     * Render suggestions panel
     * @param {Array} suggestions - Analysis suggestions
     * @returns {string} HTML
     */
    renderSuggestionsPanel(suggestions) {
        if (!suggestions || suggestions.length === 0) return '';

        return `
            <div class="suggestions-panel">
                <div class="suggestions-header">
                    <span>💡 Smart Suggestions</span>
                </div>
                ${suggestions.map(s => `
                    <div class="suggestion-item">
                        <div class="suggestion-type">
                            ${s.icon} ${s.label}
                        </div>
                        <div class="suggestion-desc">${s.description}</div>
                        ${s.recommendedTools.essential.length > 0 ? `
                            <div class="suggestion-tools">
                                <span class="suggestion-tools-label">Recommended:</span>
                                ${s.recommendedTools.essential.map(t => `<span class="tool-chip">${t}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * Render alternatives dropdown for a tool
     * @param {string} toolName - Tool name
     * @returns {string} HTML
     */
    renderAlternativesDropdown(toolName) {
        const alternatives = this.getAlternatives(toolName);
        
        if (alternatives.length === 0) return '';

        return `
            <div class="alternatives-dropdown">
                <button class="alternatives-trigger" data-tooltip="Show alternatives">
                    ⇄
                </button>
                <div class="alternatives-menu">
                    <div class="alternatives-title">Alternatives to ${toolName}</div>
                    ${alternatives.map(alt => `
                        <div class="alternative-item">${alt}</div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Show suggestions modal for current search
     */
    showSuggestionsModal() {
        const values = window.SPECTRE_APP?.gatherSearchValues('results') || {};
        const suggestions = this.analyzeInputs(values);

        if (suggestions.length === 0) {
            SPECTRE_UI.toast('Enter some search parameters to get suggestions', 'info');
            return;
        }

        const suggestionsHtml = suggestions.map(s => `
            <div class="suggestion-card">
                <div class="suggestion-header">
                    <span class="suggestion-icon">${s.icon}</span>
                    <span class="suggestion-type">${s.label}</span>
                    <span class="suggestion-value">${SPECTRE_UTILS.string.escapeHtml(SPECTRE_UTILS.string.truncate(s.value, 30))}</span>
                </div>
                <p class="suggestion-description">${s.description}</p>
                
                ${s.recommendedTools.essential.length > 0 ? `
                    <div class="tool-recommendation">
                        <div class="rec-title">🎯 Essential Tools</div>
                        <div class="rec-tools">
                            ${s.recommendedTools.essential.map(t => `<span class="tool-chip essential">${t}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${s.recommendedTools.expanded.length > 0 ? `
                    <div class="tool-recommendation">
                        <div class="rec-title">➕ Expanded Analysis</div>
                        <div class="rec-tools">
                            ${s.recommendedTools.expanded.map(t => `<span class="tool-chip">${t}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `).join('');

        SPECTRE_UI.showModal('💡 Smart Suggestions', `
            <style>
                .suggestion-card {
                    background: var(--bg-tertiary);
                    border-radius: 8px;
                    padding: 1rem;
                    margin-bottom: 1rem;
                }
                .suggestion-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                .suggestion-icon { font-size: 1.25rem; }
                .suggestion-type { font-weight: 500; }
                .suggestion-value {
                    font-family: var(--font-mono);
                    font-size: 0.8rem;
                    color: var(--accent-primary);
                    margin-left: auto;
                }
                .suggestion-description {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    margin-bottom: 0.75rem;
                }
                .tool-recommendation { margin-top: 0.75rem; }
                .rec-title {
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: var(--text-muted);
                    margin-bottom: 0.5rem;
                }
                .rec-tools { display: flex; flex-wrap: wrap; gap: 0.25rem; }
                .tool-chip {
                    background: var(--bg-secondary);
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                }
                .tool-chip.essential {
                    background: rgba(59, 130, 246, 0.2);
                    color: var(--accent-primary);
                }
            </style>

            <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                Based on your input, here are optimized tool recommendations:
            </p>

            ${suggestionsHtml}
        `, [{ text: 'Close', action: 'SPECTRE.ui.closeModal()' }]);
    },

    // ==========================================
    // Input Validation Hints
    // ==========================================

    /**
     * Get validation hint for a field
     * @param {string} field - Field name
     * @param {string} value - Current value
     * @returns {Object|null} Validation hint
     */
    getValidationHint(field, value) {
        if (!value) return null;

        const hints = {
            email: () => {
                if (!value.includes('@')) return { type: 'error', message: 'Missing @ symbol' };
                if (!this.PATTERNS.email.regex.test(value)) return { type: 'warning', message: 'Invalid email format' };
                return { type: 'success', message: 'Valid email' };
            },
            phone: () => {
                const digits = value.replace(/\D/g, '');
                if (digits.length < 7) return { type: 'warning', message: 'Phone number too short' };
                if (digits.length > 15) return { type: 'warning', message: 'Phone number too long' };
                return { type: 'success', message: `${digits.length} digits` };
            },
            domain: () => {
                if (value.includes('://')) return { type: 'info', message: 'URL detected - domain will be extracted' };
                if (!value.includes('.')) return { type: 'warning', message: 'Missing TLD (e.g., .com)' };
                return { type: 'success', message: 'Valid domain' };
            },
            ip: () => {
                if (this.PATTERNS.ip.regex.test(value)) return { type: 'success', message: 'Valid IPv4' };
                if (this.PATTERNS.ipv6.regex.test(value)) return { type: 'success', message: 'Valid IPv6' };
                return { type: 'warning', message: 'Invalid IP format' };
            },
            vin: () => {
                if (value.length !== 17) return { type: 'warning', message: `${value.length}/17 characters` };
                if (/[IOQ]/i.test(value)) return { type: 'error', message: 'VINs cannot contain I, O, or Q' };
                return { type: 'success', message: 'Valid VIN format' };
            },
            crypto: () => {
                if (this.PATTERNS.btc.regex.test(value)) return { type: 'success', message: 'Bitcoin address' };
                if (this.PATTERNS.eth.regex.test(value)) return { type: 'success', message: 'Ethereum address' };
                return { type: 'info', message: 'Unknown crypto format' };
            }
        };

        const hintFn = hints[field];
        return hintFn ? hintFn() : null;
    },

    /**
     * Render inline validation hint
     * @param {Object} hint - Hint object
     * @returns {string} HTML
     */
    renderValidationHint(hint) {
        if (!hint) return '';

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        return `
            <div class="validation-hint hint-${hint.type}">
                <span class="hint-icon">${icons[hint.type]}</span>
                <span class="hint-message">${hint.message}</span>
            </div>
        `;
    },

    // ==========================================
    // Auto-populate from Detection
    // ==========================================

    /**
     * Auto-populate fields based on smart search input
     * @param {string} input - Raw input from smart search
     * @returns {Object} Fields to populate
     */
    autoPopulate(input) {
        const detection = this.detectInputType(input);
        if (!detection) return {};

        const fields = {};

        // Handle name detection specially
        if (detection.type === 'name') {
            fields.firstName = detection.firstName;
            fields.lastName = detection.lastName;
            return fields;
        }

        // Use the detected field
        if (detection.field) {
            fields[detection.field] = detection.transformedValue || detection.value;
        }

        return fields;
    },

    // ==========================================
    // CSS Styles
    // ==========================================

    /**
     * Get CSS styles for suggestion components
     * @returns {string} CSS
     */
    getStyles() {
        return `
            .detection-badge {
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
                padding: 0.2rem 0.5rem;
                background: rgba(59, 130, 246, 0.15);
                color: var(--accent-primary);
                border-radius: 4px;
                font-size: 0.7rem;
            }
            .detection-badge.detection-warning {
                background: rgba(239, 68, 68, 0.15);
                color: var(--accent-red);
            }
            .suggestions-panel {
                background: var(--bg-tertiary);
                border-radius: 8px;
                padding: 0.75rem;
                margin-top: 0.5rem;
            }
            .suggestions-header {
                font-weight: 500;
                margin-bottom: 0.5rem;
                font-size: 0.85rem;
            }
            .suggestion-item {
                padding: 0.5rem;
                border-bottom: 1px solid var(--border-subtle);
            }
            .suggestion-item:last-child { border-bottom: none; }
            .suggestion-type { font-weight: 500; }
            .suggestion-desc { 
                font-size: 0.8rem; 
                color: var(--text-muted); 
                margin: 0.25rem 0;
            }
            .suggestion-tools { margin-top: 0.25rem; }
            .suggestion-tools-label {
                font-size: 0.7rem;
                color: var(--text-muted);
            }
            .validation-hint {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                font-size: 0.7rem;
                margin-top: 0.25rem;
            }
            .hint-success { color: var(--accent-green); }
            .hint-error { color: var(--accent-red); }
            .hint-warning { color: var(--accent-amber); }
            .hint-info { color: var(--text-muted); }
            .alternatives-dropdown {
                position: relative;
                display: inline-block;
            }
            .alternatives-trigger {
                background: none;
                border: none;
                cursor: pointer;
                opacity: 0.6;
            }
            .alternatives-trigger:hover { opacity: 1; }
            .alternatives-menu {
                position: absolute;
                top: 100%;
                right: 0;
                background: var(--bg-secondary);
                border: 1px solid var(--border-default);
                border-radius: 6px;
                padding: 0.5rem;
                min-width: 150px;
                display: none;
                z-index: 100;
            }
            .alternatives-dropdown:hover .alternatives-menu { display: block; }
            .alternatives-title {
                font-size: 0.7rem;
                color: var(--text-muted);
                margin-bottom: 0.25rem;
            }
            .alternative-item {
                padding: 0.25rem 0.5rem;
                font-size: 0.8rem;
                border-radius: 4px;
                cursor: pointer;
            }
            .alternative-item:hover { background: var(--bg-tertiary); }
        `;
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.SPECTRE_SUGGESTIONS = SPECTRE_SUGGESTIONS;
    
    // Inject styles
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const style = document.createElement('style');
            style.textContent = SPECTRE_SUGGESTIONS.getStyles();
            document.head.appendChild(style);
        });
    } else {
        const style = document.createElement('style');
        style.textContent = SPECTRE_SUGGESTIONS.getStyles();
        document.head.appendChild(style);
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPECTRE_SUGGESTIONS;
}
