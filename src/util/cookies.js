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
 * Factory for creating a cookie‐based storage utility. Each instance
 * can be initialized with its own default options, but you may override
 * path, domainLevel, or expires on a per‐method call as needed.
 *
 * @param {Object} [defaultOpts={}]
 * @param {string} [defaultOpts.path='/'] - Default cookie path.
 * @param {number} [defaultOpts.domainLevel] - Default number of hostname segments to include in `domain=`.
 * @param {string|number|Date} [defaultOpts.expires] - Default expiration (Date, ISO string, or timestamp). Defaults to +10 years.
 *
 * @returns {Object} An object with methods:
 *   - getItem(key)
 *   - setItem(key, value, [opts])
 *   - removeItem(key, [opts])
 *   - keys()
 *   - clearAll([opts])
 */
export function createCookieStorage(defaultOpts = {}) {
    /**
     * @private
     * Take the last `n` segments of window.location.hostname,
     * or return null if there aren’t enough segments.
     * E.g. hostname="foo.bar.example.com", level=2 → "example.com"
     * @param {number} level
     * @returns {string|null}
     */
    function pickDomain(level) {
        const parts = window.location.hostname.split('.');
        if (parts.length < level) return null;
        return parts.slice(-level).join('.');
    }

    /**
     * @private
     * Normalize an `expires` option that may be:
     *   • a Date instance
     *   • a parsable string/number
     *   • missing/undefined
     * Defaults to “10 years from now” if no `expires` was provided.
     *
     * @param {Date|string|number|null|undefined} expires
     * @returns {Date}
     */
    function normalizeExpires(expires) {
        if (expires instanceof Date) {
            return expires;
        }
        if (expires) {
            return new Date(expires);
        }
        const d = new Date();
        d.setFullYear(d.getFullYear() + 10);
        return d;
    }

    /**
     * @private
     * Build the cookie‐option string (expires, path, domain) from:
     *   1) the factory’s default options
     *   2) any per‐call overrides provided in `opts`
     *
     * @param {Object} [opts={}]
     * @param {string} [opts.path]             - Cookie path override.
     * @param {number} [opts.domainLevel]      - If provided, take last N segments of hostname.
     * @param {string|number|Date} [opts.expires] - Expiration override. Defaults to factory’s default or +10 years.
     *
     * @returns {string} A string like "; expires=Thu, 01 Jan 2035 12:00:00 GMT; path=/; domain=example.com"
     */
    function buildOptionString(opts = {}) {
        // 1. Determine the path: prefer opts.path, fall back to defaultOpts.path, then “/”
        const path = opts.path != null ? opts.path : defaultOpts.path != null ? defaultOpts.path : '/';

        // 2. Determine domainLevel: prefer opts.domainLevel, fall back to defaultOpts.domainLevel
        //    (if neither is a number, domainLevel will be undefined)
        const domainLevelCandidate = opts.domainLevel != null ? opts.domainLevel : defaultOpts.domainLevel;
        const domain = typeof domainLevelCandidate === 'number' ? pickDomain(domainLevelCandidate) : '';

        // 3. Determine the “expires” source: prefer opts.expires, fall back to defaultOpts.expires
        //    (if neither is provided, expireSource will be undefined, and normalizeExpires will treat it as “10 years from now”)
        const expiresSource = opts.expires != null ? opts.expires : defaultOpts.expires;
        const expiresDate = normalizeExpires(expiresSource);

        // 4. Build the string fragments
        const expiresPart = `; expires=${expiresDate.toUTCString()}`;
        const pathPart = `; path=${path}`;
        const domainPart = domain ? `; domain=${domain}` : '';

        return `${expiresPart}${pathPart}${domainPart}`;
    }

    return {
        /**
         * Retrieve a cookie value by key.
         * If the stored value is valid JSON, returns the parsed object;
         * otherwise returns the raw string.
         *
         * @param {string} key - The cookie key to read.
         * @returns {any|null} - Parsed object/string or null if not found.
         */
        getItem(key) {
            const all = document.cookie.split('; ');
            const match = all.find(row => row.startsWith(`${key}=`));
            if (!match) return null;
            const rawValue = decodeURIComponent(match.split('=')[1]);
            try {
                return JSON.parse(rawValue);
            } catch (err) {
                return rawValue;
            }
        },

        /**
         * Set a persistent cookie with a JSON‐serialized value.
         *
         * @param {string} key    - The cookie key to write.
         * @param {any} value     - Any JSON‐serializable value (will be stringified).
         * @param {Object} [opts] - Optional overrides:
         *   @param {string} [opts.path]           - Cookie path override.
         *   @param {number} [opts.domainLevel]    - Number of hostname segments for `domain=`.
         *   @param {string|number|Date} [opts.expires] - Expiration override.
         */
        setItem(key, value, opts = {}) {
            const jsonString = JSON.stringify(value);
            const encodedValue = encodeURIComponent(jsonString);
            const optionString = buildOptionString(opts);
            document.cookie = `${key}=${encodedValue}${optionString}`;
        },

        /**
         * Remove a cookie by setting its expiry to the past.
         * Must match the same `path` and `domain` used when it was created.
         *
         * @param {string} key - The cookie key to delete.
         * @param {Object} [opts] - Optional overrides:
         *   @param {string} [opts.path]         - Cookie path override.
         *   @param {number} [opts.domainLevel]  - Hostname segments for `domain=` override.
         */
        removeItem(key, opts = {}) {
            const past = new Date(0).toUTCString(); // “Thu, 01 Jan 1970 00:00:00 GMT”
            // Reuse `buildOptionString` logic but swap in the past date
            const override = { ...opts, expires: past };
            const optionString = buildOptionString(override);
            // Write an empty value and force expiry in the past
            document.cookie = `${key}=;${optionString}`;
        },

        /**
         * List all cookie names currently set (for debugging or clearAll).
         *
         * @returns {string[]} - Array of cookie keys (empty array if no cookies).
         */
        keys() {
            if (!document.cookie.length) return [];
            return document.cookie.split('; ').map(pair => pair.split('=')[0]);
        },

        /**
         * Remove all cookies currently set (respecting factory defaults and any overrides).
         * Uses `removeItem` on each key.
         *
         * @param {Object} [opts] - Optional overrides group(same shape as removeItem opts).
         */
        clearAll(opts = {}) {
            this.keys().forEach(keyName => this.removeItem(keyName, opts));
        }
    };
}
