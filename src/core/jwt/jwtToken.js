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
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA ;
 */

/**
 * JWT token helper collection
 * @module core/jwtToken
 */

/**
 * Decodes the payload (middle section) of a JWT token
 * @param {String} token - JWT token, xxxxx.yyyyy.zzzzz format
 * @returns {Object}
 */
export function parseJwtPayload(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

/**
 * Calculates TTL of a token based on its claims
 * @param {Object} payload - parsed JWT object
 * @param {Number} payload.iat - "issued at time" timestamp
 * @param {Number} payload.exp - "expiration" timestamp
 * @param {Number} defaultTTL - fallback TTL from configuration, in ms
 * @param {Number} latency - desired network latency to account for, in ms
 * @returns {Number} TTL, in ms
 */
export function getJwtTTL(payload, defaultTTL = 500000, latency = 10000) {
    let ttl = 0;
    if (payload && payload.exp && payload.iat) {
        ttl = (payload.exp - payload.iat) * 1000;
    } else {
        ttl = defaultTTL;
    }
    return ttl - latency;
}
