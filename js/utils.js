/* ============================================
   SPECTRE - Utilities Module
   Version: 2.0.0 (Modular)
   
   Pure utility functions with no side effects.
   No dependencies on other SPECTRE modules.
   ============================================ */

/**
 * SPECTRE Utilities Namespace
 */
const SPECTRE_UTILS = {
    
    /**
     * String Utilities
     */
    string: {
        /**
         * Capitalize first letter of a string
         * @param {string} str - Input string
         * @returns {string} Capitalized string
         */
        capitalize(str) {
            if (!str || typeof str !== 'string') return '';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        },

        /**
         * Convert string to title case
         * @param {string} str - Input string
         * @returns {string} Title cased string
         */
        titleCase(str) {
            if (!str || typeof str !== 'string') return '';
            return str.replace(/\w\S*/g, (txt) => 
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            );
        },

        /**
         * Clean and normalize a phone number (remove non-digits)
         * @param {string} phone - Phone number string
         * @returns {string} Cleaned phone number
         */
        cleanPhone(phone) {
            if (!phone) return '';
            return phone.replace(/\D/g, '');
        },

        /**
         * Truncate string with ellipsis
         * @param {string} str - Input string
         * @param {number} length - Max length
         * @returns {string} Truncated string
         */
        truncate(str, length = 50) {
            if (!str || str.length <= length) return str || '';
            return str.substring(0, length) + '...';
        },

        /**
         * Escape HTML special characters
         * @param {string} str - Input string
         * @returns {string} Escaped string
         */
        escapeHtml(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },

        /**
         * Generate a simple unique ID
         * @param {string} prefix - Optional prefix
         * @returns {string} Unique ID
         */
        uniqueId(prefix = 'id') {
            return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        },

        /**
         * Slugify a string (URL-safe)
         * @param {string} str - Input string
         * @returns {string} URL-safe slug
         */
        slugify(str) {
            if (!str) return '';
            return str
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }
    },

    /**
     * URL Utilities
     */
    url: {
        /**
         * Build a URL with template placeholders replaced
         * @param {string} template - URL template with {placeholder} syntax
         * @param {Object} values - Object with values to substitute
         * @returns {string|null} Built URL or null if missing required fields
         */
        buildFromTemplate(template, values) {
            if (!template || !values) return null;
            
            let url = template;
            let hasAllFields = true;
            
            // Find all placeholders in the URL
            const placeholders = template.match(/\{(\w+)\}/g) || [];
            
            placeholders.forEach(placeholder => {
                const key = placeholder.slice(1, -1); // Remove { and }
                const value = this.getValueForKey(key, values);
                
                if (value) {
                    url = url.replace(placeholder, encodeURIComponent(value));
                } else {
                    hasAllFields = false;
                }
            });
            
            return hasAllFields ? url : null;
        },

        /**
         * Get value for a template key, handling variations
         * @param {string} key - Template key
         * @param {Object} values - Values object
         * @returns {string|null} Value or null
         */
        getValueForKey(key, values) {
            // Direct match
            if (values[key]) return values[key];
            
            // Handle case variations
            const keyLower = key.toLowerCase();
            
            // Common mappings
            const mappings = {
                'first': values.first || values.firstName,
                'last': values.last || values.lastName,
                'First': SPECTRE_UTILS.string.capitalize(values.first || values.firstName || ''),
                'Last': SPECTRE_UTILS.string.capitalize(values.last || values.lastName || ''),
                'firstname': values.first || values.firstName,
                'lastname': values.last || values.lastName,
                'username': values.username,
                'email': values.email,
                'phone': values.phone,
                'phoneclean': SPECTRE_UTILS.string.cleanPhone(values.phone),
                'phoneClean': SPECTRE_UTILS.string.cleanPhone(values.phone),
                'domain': values.domain,
                'ip': values.ip,
                'city': values.city,
                'state': values.state,
                'zip': values.zip,
                'country': values.country || 'US',
                'company': values.company,
                'streetaddress': values.streetAddress || values.street,
                'imageurl': values.imageUrl,
                'vin': values.vin,
                'crypto': values.crypto
            };
            
            return mappings[key] || mappings[keyLower] || null;
        },

        /**
         * Check if a URL is valid
         * @param {string} url - URL to validate
         * @returns {boolean} Is valid URL
         */
        isValid(url) {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        },

        /**
         * Extract domain from URL
         * @param {string} url - URL string
         * @returns {string} Domain or empty string
         */
        extractDomain(url) {
            try {
                return new URL(url).hostname;
            } catch {
                return '';
            }
        }
    },

    /**
     * Date/Time Utilities
     */
    date: {
        /**
         * Format a timestamp as relative time
         * @param {number} timestamp - Unix timestamp
         * @returns {string} Relative time string
         */
        relativeTime(timestamp) {
            const now = Date.now();
            const diff = now - timestamp;
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            
            if (seconds < 60) return 'just now';
            if (minutes < 60) return `${minutes}m ago`;
            if (hours < 24) return `${hours}h ago`;
            if (days < 7) return `${days}d ago`;
            
            return new Date(timestamp).toLocaleDateString();
        },

        /**
         * Format date for display
         * @param {Date|number} date - Date object or timestamp
         * @param {Object} options - Intl.DateTimeFormat options
         * @returns {string} Formatted date string
         */
        format(date, options = {}) {
            const d = date instanceof Date ? date : new Date(date);
            return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                ...options
            }).format(d);
        },

        /**
         * Get ISO string for current time
         * @returns {string} ISO date string
         */
        nowISO() {
            return new Date().toISOString();
        }
    },

    /**
     * Detection Utilities
     */
    detect: {
        /**
         * Detect the type of input from a string
         * @param {string} value - Input value
         * @returns {string} Type: 'email', 'phone', 'domain', 'ip', 'username', or 'name'
         */
        inputType(value) {
            if (!value) return 'unknown';
            const trimmed = value.trim();
            
            // Email detection
            if (trimmed.includes('@') && trimmed.includes('.')) {
                return 'email';
            }
            
            // Phone detection (7+ digits)
            if (/^\d{7,}$/.test(trimmed.replace(/\D/g, ''))) {
                return 'phone';
            }
            
            // IP address detection
            if (/^(\d{1,3}\.){3}\d{1,3}$/.test(trimmed)) {
                return 'ip';
            }
            
            // IPv6 detection
            if (trimmed.includes(':') && /^[a-f0-9:]+$/i.test(trimmed)) {
                return 'ip';
            }
            
            // Domain detection (has dots, no spaces, not email)
            if (trimmed.includes('.') && !trimmed.includes(' ') && !trimmed.includes('@')) {
                return 'domain';
            }
            
            // Username detection (single word, alphanumeric + underscore/dash)
            if (/^[a-z0-9_.-]+$/i.test(trimmed) && !trimmed.includes(' ')) {
                return 'username';
            }
            
            // Default to name (contains spaces)
            return 'name';
        },

        /**
         * Check if device is mobile
         * @returns {boolean} Is mobile device
         */
        isMobile() {
            return window.innerWidth < 768 || 
                   /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },

        /**
         * Check if browser supports a feature
         * @param {string} feature - Feature to check
         * @returns {boolean} Is supported
         */
        supports(feature) {
            const features = {
                'localStorage': () => {
                    try {
                        localStorage.setItem('test', 'test');
                        localStorage.removeItem('test');
                        return true;
                    } catch {
                        return false;
                    }
                },
                'clipboard': () => !!navigator.clipboard,
                'share': () => !!navigator.share,
                'webgl': () => {
                    try {
                        const canvas = document.createElement('canvas');
                        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
                    } catch {
                        return false;
                    }
                }
            };
            
            return features[feature] ? features[feature]() : false;
        }
    },

    /**
     * Array/Object Utilities
     */
    collection: {
        /**
         * Group array items by a key
         * @param {Array} array - Array to group
         * @param {string|Function} key - Key to group by
         * @returns {Object} Grouped object
         */
        groupBy(array, key) {
            return array.reduce((result, item) => {
                const groupKey = typeof key === 'function' ? key(item) : item[key];
                (result[groupKey] = result[groupKey] || []).push(item);
                return result;
            }, {});
        },

        /**
         * Deep clone an object
         * @param {Object} obj - Object to clone
         * @returns {Object} Cloned object
         */
        deepClone(obj) {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Date) return new Date(obj.getTime());
            if (Array.isArray(obj)) return obj.map(item => this.deepClone(item));
            
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        },

        /**
         * Remove duplicates from array
         * @param {Array} array - Array with possible duplicates
         * @param {string} key - Optional key for object arrays
         * @returns {Array} Deduplicated array
         */
        unique(array, key = null) {
            if (key) {
                const seen = new Set();
                return array.filter(item => {
                    const val = item[key];
                    if (seen.has(val)) return false;
                    seen.add(val);
                    return true;
                });
            }
            return [...new Set(array)];
        },

        /**
         * Sort array of objects by key
         * @param {Array} array - Array to sort
         * @param {string} key - Key to sort by
         * @param {boolean} ascending - Sort direction
         * @returns {Array} Sorted array
         */
        sortBy(array, key, ascending = true) {
            return [...array].sort((a, b) => {
                const valA = a[key];
                const valB = b[key];
                const comparison = valA < valB ? -1 : valA > valB ? 1 : 0;
                return ascending ? comparison : -comparison;
            });
        }
    },

    /**
     * DOM Utilities
     */
    dom: {
        /**
         * Query element with error handling
         * @param {string} selector - CSS selector
         * @param {Element} parent - Parent element (default: document)
         * @returns {Element|null} Found element or null
         */
        $(selector, parent = document) {
            return parent.querySelector(selector);
        },

        /**
         * Query all elements
         * @param {string} selector - CSS selector
         * @param {Element} parent - Parent element (default: document)
         * @returns {NodeList} Found elements
         */
        $$(selector, parent = document) {
            return parent.querySelectorAll(selector);
        },

        /**
         * Create element with attributes
         * @param {string} tag - Tag name
         * @param {Object} attrs - Attributes object
         * @param {string|Element} content - Inner content
         * @returns {Element} Created element
         */
        create(tag, attrs = {}, content = '') {
            const el = document.createElement(tag);
            
            Object.entries(attrs).forEach(([key, value]) => {
                if (key === 'class' || key === 'className') {
                    el.className = value;
                } else if (key === 'data') {
                    Object.entries(value).forEach(([dataKey, dataVal]) => {
                        el.dataset[dataKey] = dataVal;
                    });
                } else if (key.startsWith('on') && typeof value === 'function') {
                    el.addEventListener(key.slice(2).toLowerCase(), value);
                } else {
                    el.setAttribute(key, value);
                }
            });
            
            if (content) {
                if (typeof content === 'string') {
                    el.innerHTML = content;
                } else {
                    el.appendChild(content);
                }
            }
            
            return el;
        },

        /**
         * Safely set element text content
         * @param {Element|string} element - Element or selector
         * @param {string} text - Text content
         */
        setText(element, text) {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (el) el.textContent = text;
        },

        /**
         * Safely set element HTML content
         * @param {Element|string} element - Element or selector
         * @param {string} html - HTML content
         */
        setHtml(element, html) {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (el) el.innerHTML = html;
        },

        /**
         * Toggle class on element
         * @param {Element|string} element - Element or selector
         * @param {string} className - Class to toggle
         * @param {boolean} force - Force add/remove
         */
        toggleClass(element, className, force) {
            const el = typeof element === 'string' ? this.$(element) : element;
            if (el) el.classList.toggle(className, force);
        },

        /**
         * Check if element matches selector
         * @param {Element} element - Element to check
         * @param {string} selector - CSS selector
         * @returns {boolean} Matches selector
         */
        matches(element, selector) {
            return element && element.matches && element.matches(selector);
        }
    },

    /**
     * Clipboard Utilities
     */
    clipboard: {
        /**
         * Copy text to clipboard
         * @param {string} text - Text to copy
         * @returns {Promise<boolean>} Success status
         */
        async copy(text) {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                    return true;
                }
                
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (err) {
                console.error('Clipboard copy failed:', err);
                return false;
            }
        },

        /**
         * Read text from clipboard
         * @returns {Promise<string>} Clipboard text
         */
        async read() {
            try {
                if (navigator.clipboard && navigator.clipboard.readText) {
                    return await navigator.clipboard.readText();
                }
                return '';
            } catch (err) {
                console.error('Clipboard read failed:', err);
                return '';
            }
        }
    },

    /**
     * Debounce function execution
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function execution
     * @param {Function} func - Function to throttle
     * @param {number} limit - Limit in ms
     * @returns {Function} Throttled function
     */
    throttle(func, limit = 300) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Sleep/delay function
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} Promise that resolves after delay
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Export for global access
if (typeof window !== 'undefined') {
    window.SPECTRE_UTILS = SPECTRE_UTILS;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPECTRE_UTILS;
}
