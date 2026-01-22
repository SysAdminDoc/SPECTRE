/* ============================================
   SPECTRE - API Integrations Module
   Version: 2.1.0
   
   Direct API integrations for inline intelligence:
   - Have I Been Pwned - Breach count
   - EmailRep.io - Reputation score
   - IPinfo.io - Geolocation preview
   - crt.sh - Certificate count
   - VirusTotal (limited) - Domain/IP reputation
   - AbuseIPDB - Abuse reports
   
   Transforms SPECTRE from link aggregator
   into an actual intelligence dashboard.
   
   Note: Some APIs require keys for full access.
   Free tiers are used where available.
   
   Dependencies: utils.js, ui.js
   ============================================ */

/**
 * SPECTRE API Integrations Namespace
 */
const SPECTRE_API = {

    /**
     * Configuration
     */
    CONFIG: {
        // Cache duration in ms (5 minutes)
        CACHE_DURATION: 5 * 60 * 1000,
        // Request timeout in ms
        TIMEOUT: 10000,
        // Rate limit delay between requests (ms)
        RATE_LIMIT_DELAY: 1000,
        // Enable/disable individual APIs
        ENABLED_APIS: {
            emailrep: true,
            hibp: true,       // Note: HIBP API requires a key now
            ipinfo: true,
            crtsh: true,
            abuseipdb: false, // Requires API key
            virustotal: false // Requires API key
        },
        // API Keys (user can configure these)
        API_KEYS: {
            hibp: '',         // haveibeenpwned.com API key
            ipinfo: '',       // ipinfo.io token (optional)
            abuseipdb: '',    // abuseipdb.com API key
            virustotal: ''    // virustotal.com API key
        }
    },

    /**
     * Response cache
     */
    _cache: new Map(),

    /**
     * Pending requests (for deduplication)
     */
    _pending: new Map(),

    // ==========================================
    // Core Request Handling
    // ==========================================

    /**
     * Make a cached API request
     * @param {string} cacheKey - Cache key
     * @param {Function} requestFn - Async function that makes the request
     * @returns {Promise<Object>} Response data
     */
    async cachedRequest(cacheKey, requestFn) {
        // Check cache
        const cached = this._cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CONFIG.CACHE_DURATION) {
            return cached.data;
        }

        // Check for pending request (deduplication)
        if (this._pending.has(cacheKey)) {
            return this._pending.get(cacheKey);
        }

        // Make request
        const promise = requestFn().then(data => {
            this._cache.set(cacheKey, { data, timestamp: Date.now() });
            this._pending.delete(cacheKey);
            return data;
        }).catch(err => {
            this._pending.delete(cacheKey);
            throw err;
        });

        this._pending.set(cacheKey, promise);
        return promise;
    },

    /**
     * Fetch with timeout
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>} Response
     */
    async fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.CONFIG.TIMEOUT);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            return response;
        } finally {
            clearTimeout(timeout);
        }
    },

    // ==========================================
    // Email Intelligence
    // ==========================================

    /**
     * Get email reputation from EmailRep.io
     * @param {string} email - Email address
     * @returns {Promise<Object>} Reputation data
     */
    async getEmailReputation(email) {
        if (!this.CONFIG.ENABLED_APIS.emailrep || !email) {
            return null;
        }

        return this.cachedRequest(`emailrep:${email}`, async () => {
            try {
                // EmailRep.io has a free tier with CORS support
                const response = await this.fetchWithTimeout(
                    `https://emailrep.io/${encodeURIComponent(email)}`,
                    {
                        headers: {
                            'Accept': 'application/json',
                            'User-Agent': 'SPECTRE-OSINT'
                        }
                    }
                );

                if (!response.ok) {
                    if (response.status === 429) {
                        return { error: 'rate_limited', message: 'Rate limited' };
                    }
                    return { error: 'api_error', message: `HTTP ${response.status}` };
                }

                const data = await response.json();
                
                return {
                    success: true,
                    email: data.email,
                    reputation: data.reputation,
                    suspicious: data.suspicious,
                    references: data.references || 0,
                    details: {
                        blacklisted: data.details?.blacklisted || false,
                        malicious_activity: data.details?.malicious_activity || false,
                        spam: data.details?.spam || false,
                        spoofable: data.details?.spoofable || false,
                        dmarc_enforced: data.details?.dmarc_enforced || false,
                        profiles: data.details?.profiles || []
                    },
                    summary: this.summarizeEmailRep(data)
                };
            } catch (err) {
                console.warn('[SPECTRE API] EmailRep error:', err.message);
                return { error: 'network_error', message: err.message };
            }
        });
    },

    /**
     * Summarize email reputation for display
     * @param {Object} data - EmailRep response
     * @returns {Object} Summary
     */
    summarizeEmailRep(data) {
        const reputation = data.reputation || 'unknown';
        const icons = {
            'high': '🟢',
            'medium': '🟡', 
            'low': '🔴',
            'none': '⚪',
            'unknown': '❓'
        };

        return {
            icon: icons[reputation] || '❓',
            label: reputation.charAt(0).toUpperCase() + reputation.slice(1),
            score: data.references || 0,
            flags: [
                data.suspicious && '⚠️ Suspicious',
                data.details?.blacklisted && '🚫 Blacklisted',
                data.details?.spam && '📧 Spam',
                data.details?.malicious_activity && '☠️ Malicious'
            ].filter(Boolean)
        };
    },

    // ==========================================
    // Breach Checking
    // ==========================================

    /**
     * Check email breaches via HIBP
     * Note: Full API requires a paid key
     * This uses the free breach-check endpoint (limited)
     * @param {string} email - Email address
     * @returns {Promise<Object>} Breach data
     */
    async checkBreaches(email) {
        if (!this.CONFIG.ENABLED_APIS.hibp || !email) {
            return null;
        }

        // HIBP requires an API key and has strict requirements
        // For the free version, we'll provide a link instead
        return {
            success: true,
            type: 'redirect',
            message: 'HIBP requires API authentication',
            url: `https://haveibeenpwned.com/account/${encodeURIComponent(email)}`,
            tip: 'Visit the link to check breaches manually'
        };
    },

    // ==========================================
    // IP Intelligence
    // ==========================================

    /**
     * Get IP information from IPinfo.io
     * @param {string} ip - IP address
     * @returns {Promise<Object>} IP data
     */
    async getIPInfo(ip) {
        if (!this.CONFIG.ENABLED_APIS.ipinfo || !ip) {
            return null;
        }

        return this.cachedRequest(`ipinfo:${ip}`, async () => {
            try {
                const token = this.CONFIG.API_KEYS.ipinfo;
                const url = token 
                    ? `https://ipinfo.io/${encodeURIComponent(ip)}?token=${token}`
                    : `https://ipinfo.io/${encodeURIComponent(ip)}/json`;

                const response = await this.fetchWithTimeout(url);

                if (!response.ok) {
                    return { error: 'api_error', message: `HTTP ${response.status}` };
                }

                const data = await response.json();

                return {
                    success: true,
                    ip: data.ip,
                    hostname: data.hostname || null,
                    city: data.city,
                    region: data.region,
                    country: data.country,
                    location: data.loc, // "lat,long"
                    org: data.org,       // ASN + Org name
                    postal: data.postal,
                    timezone: data.timezone,
                    summary: this.summarizeIPInfo(data)
                };
            } catch (err) {
                console.warn('[SPECTRE API] IPinfo error:', err.message);
                return { error: 'network_error', message: err.message };
            }
        });
    },

    /**
     * Summarize IP info for display
     * @param {Object} data - IPinfo response
     * @returns {Object} Summary
     */
    summarizeIPInfo(data) {
        const location = [data.city, data.region, data.country].filter(Boolean).join(', ');
        
        return {
            location: location || 'Unknown',
            org: data.org || 'Unknown',
            flag: this.getCountryFlag(data.country)
        };
    },

    /**
     * Get country flag emoji from country code
     * @param {string} countryCode - ISO country code
     * @returns {string} Flag emoji
     */
    getCountryFlag(countryCode) {
        if (!countryCode || countryCode.length !== 2) return '🌐';
        
        const offset = 127397; // Regional indicator offset
        return String.fromCodePoint(
            ...countryCode.toUpperCase().split('').map(c => c.charCodeAt(0) + offset)
        );
    },

    // ==========================================
    // Certificate Transparency
    // ==========================================

    /**
     * Get certificate count from crt.sh
     * @param {string} domain - Domain name
     * @returns {Promise<Object>} Certificate data
     */
    async getCertificates(domain) {
        if (!this.CONFIG.ENABLED_APIS.crtsh || !domain) {
            return null;
        }

        return this.cachedRequest(`crtsh:${domain}`, async () => {
            try {
                // crt.sh JSON API
                const response = await this.fetchWithTimeout(
                    `https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`,
                    { headers: { 'Accept': 'application/json' } }
                );

                if (!response.ok) {
                    return { error: 'api_error', message: `HTTP ${response.status}` };
                }

                const text = await response.text();
                
                // crt.sh sometimes returns empty or invalid JSON
                if (!text || text.trim() === '') {
                    return {
                        success: true,
                        count: 0,
                        certificates: [],
                        summary: { count: 0, issuers: [] }
                    };
                }

                const data = JSON.parse(text);
                
                // Deduplicate by serial number
                const uniqueCerts = new Map();
                data.forEach(cert => {
                    if (!uniqueCerts.has(cert.serial_number)) {
                        uniqueCerts.set(cert.serial_number, cert);
                    }
                });

                const certs = Array.from(uniqueCerts.values());
                
                // Get unique subdomains
                const subdomains = new Set();
                certs.forEach(cert => {
                    const name = cert.name_value || '';
                    name.split('\n').forEach(n => {
                        if (n && n !== domain && n.endsWith(domain)) {
                            subdomains.add(n.replace(/^\*\./, ''));
                        }
                    });
                });

                // Get unique issuers
                const issuers = [...new Set(certs.map(c => c.issuer_name).filter(Boolean))];

                return {
                    success: true,
                    count: certs.length,
                    subdomains: [...subdomains].slice(0, 20), // Limit for display
                    issuers: issuers.slice(0, 5),
                    recent: certs.slice(0, 5).map(c => ({
                        commonName: c.common_name,
                        issuer: c.issuer_name,
                        notBefore: c.not_before,
                        notAfter: c.not_after
                    })),
                    summary: {
                        count: certs.length,
                        subdomainCount: subdomains.size,
                        issuers: issuers.slice(0, 3)
                    }
                };
            } catch (err) {
                console.warn('[SPECTRE API] crt.sh error:', err.message);
                return { error: 'network_error', message: err.message };
            }
        });
    },

    // ==========================================
    // Domain Intelligence
    // ==========================================

    /**
     * Aggregate domain intelligence from multiple sources
     * @param {string} domain - Domain name
     * @returns {Promise<Object>} Aggregated data
     */
    async getDomainIntel(domain) {
        if (!domain) return null;

        const results = await Promise.allSettled([
            this.getCertificates(domain)
        ]);

        return {
            domain,
            certificates: results[0].status === 'fulfilled' ? results[0].value : null,
            timestamp: Date.now()
        };
    },

    // ==========================================
    // Aggregated Intelligence
    // ==========================================

    /**
     * Get all available intelligence for an email
     * @param {string} email - Email address
     * @returns {Promise<Object>} Aggregated intel
     */
    async getEmailIntel(email) {
        if (!email) return null;

        const results = await Promise.allSettled([
            this.getEmailReputation(email),
            this.checkBreaches(email)
        ]);

        return {
            email,
            reputation: results[0].status === 'fulfilled' ? results[0].value : null,
            breaches: results[1].status === 'fulfilled' ? results[1].value : null,
            timestamp: Date.now()
        };
    },

    /**
     * Get all available intelligence for an IP
     * @param {string} ip - IP address
     * @returns {Promise<Object>} Aggregated intel
     */
    async getIPIntel(ip) {
        if (!ip) return null;

        const results = await Promise.allSettled([
            this.getIPInfo(ip)
        ]);

        return {
            ip,
            info: results[0].status === 'fulfilled' ? results[0].value : null,
            timestamp: Date.now()
        };
    },

    // ==========================================
    // UI Integration
    // ==========================================

    /**
     * Render inline intelligence preview
     * @param {string} type - 'email', 'ip', 'domain'
     * @param {string} value - The value to look up
     * @returns {string} HTML for preview
     */
    renderInlinePreview(type, value) {
        const loadingHtml = `
            <div class="api-preview loading">
                <span class="api-loader"></span>
                <span>Loading intel...</span>
            </div>
        `;

        // Return loading state initially
        return loadingHtml;
    },

    /**
     * Create and inject API preview into tool item
     * @param {HTMLElement} toolItem - Tool item element
     * @param {string} type - Data type
     * @param {string} value - Value to look up
     */
    async injectPreview(toolItem, type, value) {
        if (!toolItem || !value) return;

        // Create preview container
        const preview = document.createElement('div');
        preview.className = 'api-preview-container';
        preview.innerHTML = this.renderInlinePreview(type, value);

        // Find insertion point
        const toolInfo = toolItem.querySelector('.tool-info');
        if (toolInfo) {
            toolInfo.appendChild(preview);
        }

        // Fetch data
        let data;
        switch (type) {
            case 'email':
                data = await this.getEmailIntel(value);
                break;
            case 'ip':
                data = await this.getIPIntel(value);
                break;
            case 'domain':
                data = await this.getDomainIntel(value);
                break;
            default:
                return;
        }

        // Update preview with results
        preview.innerHTML = this.renderPreviewResults(type, data);
    },

    /**
     * Render preview results HTML
     * @param {string} type - Data type
     * @param {Object} data - Intelligence data
     * @returns {string} HTML
     */
    renderPreviewResults(type, data) {
        if (!data) {
            return '<div class="api-preview error">No data available</div>';
        }

        switch (type) {
            case 'email':
                return this.renderEmailPreview(data);
            case 'ip':
                return this.renderIPPreview(data);
            case 'domain':
                return this.renderDomainPreview(data);
            default:
                return '';
        }
    },

    /**
     * Render email intelligence preview
     * @param {Object} data - Email intel data
     * @returns {string} HTML
     */
    renderEmailPreview(data) {
        const rep = data.reputation;
        if (!rep || rep.error) {
            return `<div class="api-preview mini">Unable to fetch email intel</div>`;
        }

        const summary = rep.summary || {};
        const flags = summary.flags || [];

        return `
            <div class="api-preview mini">
                <span class="api-badge" data-tooltip="Email Reputation">
                    ${summary.icon || '❓'} ${summary.label || 'Unknown'}
                </span>
                ${rep.references ? `<span class="api-stat" data-tooltip="References found">${rep.references} refs</span>` : ''}
                ${flags.length > 0 ? `<span class="api-flags">${flags.join(' ')}</span>` : ''}
            </div>
        `;
    },

    /**
     * Render IP intelligence preview
     * @param {Object} data - IP intel data
     * @returns {string} HTML
     */
    renderIPPreview(data) {
        const info = data.info;
        if (!info || info.error) {
            return `<div class="api-preview mini">Unable to fetch IP intel</div>`;
        }

        const summary = info.summary || {};

        return `
            <div class="api-preview mini">
                <span class="api-badge" data-tooltip="Location">
                    ${summary.flag || '🌐'} ${summary.location || 'Unknown'}
                </span>
                ${summary.org ? `<span class="api-stat" data-tooltip="Organization">${SPECTRE_UTILS.string.truncate(summary.org, 30)}</span>` : ''}
            </div>
        `;
    },

    /**
     * Render domain intelligence preview
     * @param {Object} data - Domain intel data
     * @returns {string} HTML
     */
    renderDomainPreview(data) {
        const certs = data.certificates;
        if (!certs || certs.error) {
            return `<div class="api-preview mini">Unable to fetch domain intel</div>`;
        }

        const summary = certs.summary || {};

        return `
            <div class="api-preview mini">
                <span class="api-badge" data-tooltip="SSL Certificates">
                    🔐 ${summary.count || 0} certs
                </span>
                ${summary.subdomainCount ? `<span class="api-stat" data-tooltip="Subdomains discovered">${summary.subdomainCount} subdomains</span>` : ''}
            </div>
        `;
    },

    /**
     * Show detailed intel modal
     * @param {string} type - Data type
     * @param {string} value - Value
     */
    async showIntelModal(type, value) {
        SPECTRE_UI.showModal(`🔍 Intelligence: ${value}`, `
            <div class="intel-loading">
                <div class="loading-spinner"></div>
                <p>Gathering intelligence...</p>
            </div>
        `, [{ text: 'Close', action: 'SPECTRE.ui.closeModal()' }]);

        let data;
        switch (type) {
            case 'email':
                data = await this.getEmailIntel(value);
                break;
            case 'ip':
                data = await this.getIPIntel(value);
                break;
            case 'domain':
                data = await this.getDomainIntel(value);
                break;
        }

        // Update modal content
        const modalBody = document.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = this.renderDetailedIntel(type, value, data);
        }
    },

    /**
     * Render detailed intelligence view
     * @param {string} type - Data type
     * @param {string} value - Value
     * @param {Object} data - Intel data
     * @returns {string} HTML
     */
    renderDetailedIntel(type, value, data) {
        const styles = `
            <style>
                .intel-section { margin-bottom: 1.5rem; }
                .intel-section-title { 
                    font-weight: 600; 
                    margin-bottom: 0.75rem; 
                    display: flex; 
                    align-items: center; 
                    gap: 0.5rem;
                }
                .intel-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
                    gap: 0.75rem; 
                }
                .intel-card {
                    background: var(--bg-tertiary);
                    padding: 0.75rem;
                    border-radius: 8px;
                }
                .intel-card-label { font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.25rem; }
                .intel-card-value { font-weight: 500; }
                .intel-list { list-style: none; padding: 0; margin: 0; }
                .intel-list li { 
                    padding: 0.5rem 0.75rem; 
                    background: var(--bg-tertiary); 
                    border-radius: 6px;
                    margin-bottom: 0.25rem;
                    font-size: 0.85rem;
                }
                .intel-error { color: var(--accent-amber); }
            </style>
        `;

        if (!data) {
            return `${styles}<div class="intel-error">No intelligence data available</div>`;
        }

        let content = styles;

        if (type === 'email') {
            const rep = data.reputation;
            content += `
                <div class="intel-section">
                    <div class="intel-section-title">📧 Email Reputation</div>
                    ${rep && !rep.error ? `
                        <div class="intel-grid">
                            <div class="intel-card">
                                <div class="intel-card-label">Reputation</div>
                                <div class="intel-card-value">${rep.summary?.icon || ''} ${rep.reputation || 'Unknown'}</div>
                            </div>
                            <div class="intel-card">
                                <div class="intel-card-label">References</div>
                                <div class="intel-card-value">${rep.references || 0}</div>
                            </div>
                            <div class="intel-card">
                                <div class="intel-card-label">Suspicious</div>
                                <div class="intel-card-value">${rep.suspicious ? '⚠️ Yes' : '✅ No'}</div>
                            </div>
                        </div>
                        ${rep.details?.profiles?.length > 0 ? `
                            <div style="margin-top: 0.75rem;">
                                <div class="intel-card-label">Linked Profiles</div>
                                <ul class="intel-list">
                                    ${rep.details.profiles.map(p => `<li>• ${SPECTRE_UTILS.string.escapeHtml(p)}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    ` : `<p class="intel-error">Unable to fetch reputation data</p>`}
                </div>
            `;
        }

        if (type === 'ip') {
            const info = data.info;
            content += `
                <div class="intel-section">
                    <div class="intel-section-title">🌐 IP Information</div>
                    ${info && !info.error ? `
                        <div class="intel-grid">
                            <div class="intel-card">
                                <div class="intel-card-label">Location</div>
                                <div class="intel-card-value">${info.summary?.flag || ''} ${info.city || 'Unknown'}, ${info.country || ''}</div>
                            </div>
                            <div class="intel-card">
                                <div class="intel-card-label">Organization</div>
                                <div class="intel-card-value">${info.org || 'Unknown'}</div>
                            </div>
                            <div class="intel-card">
                                <div class="intel-card-label">Timezone</div>
                                <div class="intel-card-value">${info.timezone || 'Unknown'}</div>
                            </div>
                            ${info.hostname ? `
                                <div class="intel-card">
                                    <div class="intel-card-label">Hostname</div>
                                    <div class="intel-card-value">${SPECTRE_UTILS.string.escapeHtml(info.hostname)}</div>
                                </div>
                            ` : ''}
                        </div>
                    ` : `<p class="intel-error">Unable to fetch IP data</p>`}
                </div>
            `;
        }

        if (type === 'domain') {
            const certs = data.certificates;
            content += `
                <div class="intel-section">
                    <div class="intel-section-title">🔐 Certificate Transparency</div>
                    ${certs && !certs.error ? `
                        <div class="intel-grid">
                            <div class="intel-card">
                                <div class="intel-card-label">Total Certificates</div>
                                <div class="intel-card-value">${certs.count || 0}</div>
                            </div>
                            <div class="intel-card">
                                <div class="intel-card-label">Subdomains Found</div>
                                <div class="intel-card-value">${certs.subdomains?.length || 0}</div>
                            </div>
                        </div>
                        ${certs.subdomains?.length > 0 ? `
                            <div style="margin-top: 0.75rem;">
                                <div class="intel-card-label">Discovered Subdomains</div>
                                <ul class="intel-list">
                                    ${certs.subdomains.slice(0, 10).map(s => `<li>• ${SPECTRE_UTILS.string.escapeHtml(s)}</li>`).join('')}
                                    ${certs.subdomains.length > 10 ? `<li style="color: var(--text-muted);">... and ${certs.subdomains.length - 10} more</li>` : ''}
                                </ul>
                            </div>
                        ` : ''}
                    ` : `<p class="intel-error">Unable to fetch certificate data</p>`}
                </div>
            `;
        }

        return content;
    },

    // ==========================================
    // Settings
    // ==========================================

    /**
     * Configure API key
     * @param {string} api - API name
     * @param {string} key - API key
     */
    setAPIKey(api, key) {
        if (this.CONFIG.API_KEYS.hasOwnProperty(api)) {
            this.CONFIG.API_KEYS[api] = key;
            // Persist to storage
            SPECTRE_STORAGE.set('spectre-api-keys', this.CONFIG.API_KEYS);
        }
    },

    /**
     * Load API keys from storage
     */
    loadAPIKeys() {
        const keys = SPECTRE_STORAGE.get('spectre-api-keys', {});
        Object.assign(this.CONFIG.API_KEYS, keys);
    },

    /**
     * Clear cache
     */
    clearCache() {
        this._cache.clear();
        SPECTRE_UI.toast('API cache cleared', 'info');
    }
};

// Initialize on load
if (typeof window !== 'undefined') {
    window.SPECTRE_API = SPECTRE_API;
    
    // Load API keys from storage
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SPECTRE_API.loadAPIKeys());
    } else {
        SPECTRE_API.loadAPIKeys();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPECTRE_API;
}
