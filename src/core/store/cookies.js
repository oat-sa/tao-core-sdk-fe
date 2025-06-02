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
 * Cookie-based storage utility
 * Supports JSON-serializable values and persistent cookies
 */

export const cookieStorage = {
    /**
     * Get a cookie value by key and parse it from JSON if possible.
     * @param {string} key
     * @returns {any|null}
     */
    /**
     * get cookie value by key
     * @param {string} key
     * @returns {string|null}
     */
    getItem(key) {
        const cookie = document.cookie.split('; ').find(row => row.startsWith(`${key}=`));
        return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
    },

    /**
     * Set a cookie with a JSON-serializable value.
     * @param {string} key
     * @param {any} value
     * @param {Object} [options]
     * @param {string} [options.path='/']
     * @param {string} [options.domain]
     */
    setItem(key, value, options = {}) {
        const path = options.path || '/';
        const domain = options.domain ? `; domain=${options.domain}` : '';
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 10);
        const stringValue = encodeURIComponent(JSON.stringify(value));

        document.cookie = `${key}=${stringValue}; expires=${expires.toUTCString()}; path=${path}${domain}`;
    },
    /**
     * Delete a cookie by key.
     * @param {string} key
     * @param {Object} [options]
     * @param {string} [options.path='/']
     * @param {string} [options.domain]
     */
    removeItem(key, options = {}) {
        const path = options.path || '/';
        const domain = options.domain ? `; domain=${options.domain}` : '';
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${domain}`;
    }
};
