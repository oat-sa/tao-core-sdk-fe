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

export const cookieStorage = {
    /**
     * Retrieves a cookie value by key.
     * Parses the value from JSON if present.
     *
     * @param {string} key - The cookie key.
     * @returns {any|null} - The parsed cookie value, or null if not found.
     */
    getItem(key) {
        const cookie = document.cookie.split('; ').find(row => row.startsWith(`${key}=`));

        return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
    },

    /**
     * Sets a persistent cookie with a JSON-serializable value.
     *
     * @param {string} key - The cookie key.
     * @param {any} value - The value to store (will be JSON-stringified).
     * @param {Object} [options={}] - Optional cookie attributes.
     * @param {string} [options.path='/'] - Cookie path scope (default is '/').
     * @param {string} [options.domain] - Domain scope for the cookie.
     * @param {Date} [options.expires] - Expiration date (default is 10 years from now).
     */
    setItem(key, value, options = {}) {
        const {
            path = '/',
            domain,
            expires = (() => {
                const date = new Date();
                date.setFullYear(date.getFullYear() + 10);
                return date;
            })()
        } = options;

        const domainPart = domain ? `; domain=${domain}` : '';
        const encodedValue = encodeURIComponent(JSON.stringify(value));

        document.cookie = `${key}=${encodedValue}; expires=${expires.toUTCString()}; path=${path}${domainPart}`;
    },

    /**
     * Deletes a cookie by key.
     *
     * Note: The cookie will only be removed if the `path` and `domain`
     * match those used when it was originally set.
     *
     * @param {string} key - The cookie key to delete.
     * @param {Object} [options={}] - Optional cookie attributes.
     * @param {string} [options.path='/'] - Path scope used when the cookie was set.
     * @param {string} [options.domain] - Domain scope used when the cookie was set.
     */
    removeItem(key, options = {}) {
        const { path = '/', domain } = options;

        const domainPart = domain ? `; domain=${domain}` : '';
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domainPart}`;
    }
};
