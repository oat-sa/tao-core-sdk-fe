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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * Enables to register token handlers to a service name
 */

/**
 * @type {Map<string, JWTTokenHandler>} registry
 */
const registry = new Map();

export default {
    /**
     * Register a token handler for a service
     * @param {JWTTokenHandler} tokenHandler - token handler instance
     */
    register(tokenHandler) {
        registry.set(tokenHandler.serviceName, tokenHandler);
    },

    /**
     * Request a token handler based on service
     * @param {string} serviceName - name of the token handler's service
     * @returns {JWTTokenHandler} token handler of the service
     */
    get(serviceName = 'tao') {
        return registry.get(serviceName);
    },

    /**
     * Unregister a token handler for a service
     * @param {string} serviceName - name of the token handler's service
     */
    unregister(serviceName = 'tao') {
        registry.delete(serviceName);
    },

    /**
     * Check token handler is registered for the given service name
     * @param {string} serviceName - name of the token handler's service
     * @returns {boolean} Is token handler registered for the given service name or not
     */
    has(serviceName = 'tao') {
        return registry.has(serviceName);
    }
};
