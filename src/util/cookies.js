/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2025 Open Assessment Technologies SA;
 *
 * Cookie-based storage utility.
 * Supports JSON-serializable values and persistent cookies.
 */

const cookieStorage = {
    /**
     * @private
     * Take the last `n` segments of window.location.hostname, or return null if there aren’t enough segments.
     * E.g. hostname="foo.bar.example.com", level=2 → "example.com"
     * @param {number} level
     * @returns {string|null}
     */
    _pickDomain(level) {
        const parts = window.location.hostname.split('.');
        if (parts.length < level) return null;
        return parts.slice(-level).join('.');
    },

    /**
     * @private
     * Given an `expires` option that may be:
     *   • a Date instance
     *   • a parsable string/number
     *   • missing/undefined
     * Normalize to a Date that represents the correct expiration.
     * Defaults to “10 years from now” if no `expires` was provided.
     *
     * @param {Date|string|number|null|undefined} expires
     * @returns {Date}
     */
    _normalizeExpires(expires) {
        if (expires instanceof Date) {
            return expires;
        }
        if (expires) {
            return new Date(expires);
        }
        const d = new Date();
        d.setFullYear(d.getFullYear() + 10);
        return d;
    },

    /**
     * @private
     * Build a cookie‐option string (expires, path, domain) from the given overrides.
     * Options:
     *   • opts.path         → defaults to '/'
     *   • opts.domainLevel  → if provided, take last N segments of hostname
     *   • opts.expires      → normalized via _normalizeExpires
     *
     * @param {Object} [opts]
     * @param {string} [opts.path]             - Cookie path (default "/").
     * @param {number} [opts.domainLevel]      - Domains to include (last N segments of window.location.hostname).
     * @param {string|number|Date} [opts.expires] - Expiration (Date, ISO string, or timestamp). Defaults to +10 years.
     * @returns {string}    A string like "; expires=Thu, 01 Jan 2035 12:00:00 GMT; path=/; domain=example.com"
     */
    _buildOptionString(opts = {}) {
        const path = opts.path ? opts.path : '/';
        const domain = typeof opts.domainLevel === 'number' ? this._pickDomain(opts.domainLevel) : null;
        const expiresDate = this._normalizeExpires(opts.expires);
        const expiresPart = `; expires=${expiresDate.toUTCString()}`;
        const pathPart = `; path=${path}`;
        const domainPart = domain ? `; domain=${domain}` : '';
        return `${expiresPart}${pathPart}${domainPart}`;
    },

    /**
     * Retrieve a cookie value by key.
     * If the stored value is valid JSON, returns the parsed object; otherwise returns the raw string.
     *
     * @param {string} key        - The cookie key to read.
     * @returns {any|null}        - The parsed object or string, or null if not found.
     */
    getItem(key) {
        const all = document.cookie.split('; ');
        const match = all.find(row => row.startsWith(`${key}=`));
        if (!match) return null;

        const rawValue = decodeURIComponent(match.split('=')[1]);
        try {
            return JSON.parse(rawValue);
        } catch (error) {
            return rawValue;
        }
    },

    /**
     * Set a persistent cookie with a JSON-serialized value.
     *
     * @param {string} key        - The cookie key to write.
     * @param {any} value         - Any JSON‐serializable value (will be stringified).
     * @param {Object} [opts]     - Optional overrides:
     *   @param {string} [opts.path]           - Cookie path (default "/").
     *   @param {number} [opts.domainLevel]    - Number of hostname segments to include in `domain=`.
     *   @param {string|number|Date} [opts.expires] - Expiration (Date / ISO string / timestamp). Defaults to +10 years.
     */
    setItem(key, value, opts = {}) {
        const jsonString = JSON.stringify(value);
        const encodedValue = encodeURIComponent(jsonString);
        const optionString = this._buildOptionString(opts);
        document.cookie = `${key}=${encodedValue}${optionString}`;
    },

    /**
     * Remove a cookie by setting its expiry to the past.
     * Must match the same `path` and `domain` used when it was created.
     *
     * @param {string} key      - The cookie key to delete.
     * @param {Object} [opts]
     *   @param {string} [opts.path]         - Cookie path (default "/").
     *   @param {number} [opts.domainLevel]  - Number of hostname segments to match `domain=`.
     */
    removeItem(key, opts = {}) {
        const past = new Date(0).toUTCString(); // "Thu, 01 Jan 1970 00:00:00 GMT"
        const path = opts.path ? opts.path : '/';
        const domain = typeof opts.domainLevel === 'number' ? this._pickDomain(opts.domainLevel) : null;

        const pathPart = `; path=${path}`;
        const domainPart = domain ? `; domain=${domain}` : '';
        document.cookie = `${key}=; expires=${past}${pathPart}${domainPart}`;
    },

    /**
     * List all cookie‐names currently set (for debugging or clearAll).
     *
     * @returns {string[]}    - Array of cookie keys (empty array if no cookies).
     */
    keys() {
        if (!document.cookie.length) {
            return [];
        }
        return document.cookie.split('; ').map(pair => pair.split('=')[0]);
    },

    /**
     * Remove all cookies currently set (respecting path and domain).
     * Uses `removeItem` on each key.
     *
     * @param {Object} [opts]
     *   @param {string} [opts.path]         - Cookie path (default "/").
     *   @param {number} [opts.domainLevel]  - Number of hostname segments to match `domain=`.
     */
    clearAll(opts = {}) {
        this.keys().forEach(keyName => this.removeItem(keyName, opts));
    }
};

export default cookieStorage;
