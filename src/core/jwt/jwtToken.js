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
 * Copyright (c) 2021-2024 (original work) Open Assessment Technologies SA ;
 */

/**
 * JWT token helper collection
 * This is only a minimal set of tools for the parts we currently need
 * @see https://tools.ietf.org/html/rfc7519
 * @module core/jwtToken
 */

/**
 * Decodes the payload (middle section) of a JWT token
 * @param {String} token - JWT token, 'xxxxx.yyyyy.zzzzz' format
 * @returns {Object} JWT payload
 */
export function parseJwtPayload(token) {
    try {
        let base64Payload = token.split('.')[1];
        base64Payload = base64Payload.replace(/-/g, '+'); // replace - with +
        base64Payload = base64Payload.replace(/_/g, '/'); // replace _ with /

        return JSON.parse(atob(base64Payload));
    } catch (e) {
        return null;
    }
}

/**
 * Calculates TTL of a token based on its claims
 * @param {Object} payload - parsed JWT object
 * @param {Number} payload.iat - "issued at time", as timestamp
 * @param {Number} payload.exp - "expiration", as timestamp
 * @returns {Number|null} TTL, in ms
 */
export function getJwtTTL(payload) {
    if (payload && payload.exp && payload.iat) {
        return (payload.exp - payload.iat) * 1000;
    }
    return null;
}
