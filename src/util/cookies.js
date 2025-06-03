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
 *
 * @param {Object} [opt] - Optional overrides
 * @param {string} [opt.path="/"] - Cookie path
 * @param {number|string|Date} [opt.expires] - Expiration (Date, ISO string, or timestamp). Defaults to +10 years.
 * @param {number} [opt.domainLevel] - How many hostname segments to include in `; domain=`
 *                               (e.g. level=2 on "foo.bar.example.com" → "bar.example.com")
 * @returns {Object} - Cookie storage interface with methods: getItem, setItem, removeItem, keys, clearAll
 */

export default function initCookieStorage(opt = {}) {
    // Helper: take last `level` segments of window.location.hostname
    function getDomainByHostname(level) {
        const parts = window.location.hostname.split('.');
        if (parts.length < level) return null;
        return parts.slice(-level).join('.');
    }

    // Determine expiration Date object
    let expiresDate;
    if (opt.expires instanceof Date) {
        expiresDate = opt.expires;
    } else if (opt.expires) {
        expiresDate = new Date(opt.expires);
    } else {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 10);
        expiresDate = d;
    }

    const options = {
        path: opt.path || '/',
        domain: opt.domainLevel ? getDomainByHostname(opt.domainLevel) : null,
        expires: expiresDate
    };

    // Serialize the path/domain/expiry into a string fragment
    function serializeOptions() {
        const domainPart = options.domain ? `; domain=${options.domain}` : '';
        const pathPart = `; path=${options.path}`;
        const expiresPart = `; expires=${options.expires.toUTCString()}`;
        return `${expiresPart}${pathPart}${domainPart}`;
    }

    return {
        /**
         * Retrieve a cookie value by key.
         * If the stored value is valid JSON, returns the parsed object;
         * otherwise returns the raw string.
         *
         * @param {string} key - The cookie key.
         * @returns {any|null} - The parsed value, or null if not found.
         */
        getItem(key) {
            const match = document.cookie.split('; ').find(row => row.startsWith(`${key}=`));
            if (!match) return null;

            const rawValue = decodeURIComponent(match.split('=')[1]);
            try {
                return JSON.parse(rawValue);
            } catch (_err) {
                return rawValue;
            }
        },

        /**
         * Set a persistent cookie with a JSON-serialized value.
         *
         * @param {string} key - The cookie key.
         * @param {any} value - The value to store (will be JSON-stringified).
         */
        setItem(key, value) {
            const encodedValue = encodeURIComponent(JSON.stringify(value));
            document.cookie = `${key}=${encodedValue}${serializeOptions()}`;
        },

        /**
         * Remove a cookie by setting its expiry in the past.
         * Must match the same `path` and `domain`.
         *
         * @param {string} key - The cookie key to delete.
         */
        removeItem(key) {
            const domainPart = options.domain ? `; domain=${options.domain}` : '';
            const pathPart = `; path=${options.path}`;
            document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT${pathPart}${domainPart}`;
        },

        /**
         * List all cookie keys currently set (for debugging or clearAll).
         *
         * @returns {string[]} - Array of cookie keys.
         */
        keys() {
            return document.cookie.length ? document.cookie.split('; ').map(pair => pair.split('=')[0]) : [];
        },

        /**
         * Remove all cookies (respecting path and domain).
         * Uses `removeItem` for each key.
         */
        clearAll() {
            this.keys().forEach(k => this.removeItem(k));
        }
    };
}
