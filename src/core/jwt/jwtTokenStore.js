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
 * Copyright (c) 2019-2021 (original work) Open Assessment Technologies SA ;
 */

/**
 * Implementation of store for JWT token
 * @module core/jwtTokenStore
 * @author Tamas Besenyei <tamas@taotesting.com>
 */

import store from 'core/store';
import { parseJwtPayload, getJwtTTL } from 'core/jwt/jwtToken';

/**
 * @param {Object} options - Factory options
 * @param {string} options.namespace - Namespace of the store
 * @param {Number} options.accessTokenTTL - TTL of accessToken in ms
 * @param {Boolean} options.usePerTokenTTL if true, accessToken TTL should be extractable from JWT payload, and accessTokenTTL will be used as fallback
 * @returns {Object} Store API
 */
const jwtTokenStoreFactory = function jwtTokenStoreFactory({
    namespace = 'global',
    accessTokenTTL: accessTokenTTLParam = 0,
    usePerTokenTTL = false
} = {}) {
    const storeName = `jwt.${namespace}`;
    const accessTokenName = 'accessToken';
    const refreshTokenName = 'refreshToken';

    let defaultAccessTokenTTL = accessTokenTTLParam;
    let accessTokenStoredAt = 0;
    let currentAccessTokenTTL = 0;

    /**
     * Do not change token stores, because of security reason.
     */

    const getAccessTokenStore = () => store(storeName, store.backends.memory);
    const getRefreshTokenStore = () => store(storeName, store.backends.sessionStorage);

    return {
        /**
         * Set access token to the store
         * @param {string} token
         * @returns {Promise<Boolean>} token successfully set
         */
        setAccessToken(token) {
            if (usePerTokenTTL) {
                const tokenPayload = parseJwtPayload(token);
                currentAccessTokenTTL = getJwtTTL(tokenPayload) || defaultAccessTokenTTL;
            }
            accessTokenStoredAt = Date.now();
            return getAccessTokenStore().then(storage => storage.setItem(accessTokenName, token));
        },

        /**
         * Get stored access token
         * @returns {Promise<string|null>} stored access token
         */
        getAccessToken() {
            let expiryTime = 0;

            if (usePerTokenTTL && currentAccessTokenTTL) {
                expiryTime = accessTokenStoredAt + currentAccessTokenTTL;
            } else if (defaultAccessTokenTTL) {
                expiryTime = accessTokenStoredAt + defaultAccessTokenTTL;
            }

            if (expiryTime && expiryTime < Date.now()) {
                return Promise.resolve(null);
            }
            return getAccessTokenStore().then(storage => storage.getItem(accessTokenName));
        },

        /**
         * Set refresh token
         * @param {string} token
         * @returns {Promise<Boolean>} token successfully set
         */
        setRefreshToken(token) {
            return getRefreshTokenStore().then(storage => storage.setItem(refreshTokenName, token));
        },

        /**
         * Get stored refresh token
         * @returns {Promise<string|null>} stored refresh token
         */
        getRefreshToken() {
            return getRefreshTokenStore().then(storage => storage.getItem(refreshTokenName));
        },

        /**
         * Store access and refresh token
         * @param {string} accessToken
         * @param {string} refreshToken
         * @returns {Promise<Boolean>} Tokens successfully set
         */
        setTokens(accessToken, refreshToken) {
            return Promise.all([this.setAccessToken(accessToken), this.setRefreshToken(refreshToken)]).then(() => true);
        },

        /**
         * Clear access token from store
         * @returns {Promise<Boolean>} token successfully cleared
         */
        clearAccessToken() {
            return getAccessTokenStore().then(storage => storage.clear());
        },

        /**
         * Clear refresh token from store
         * @returns {Promise<Boolean>} token successfully cleared
         */
        clearRefreshToken() {
            return getRefreshTokenStore().then(storage => storage.clear());
        },

        /**
         * Clear the whole storage
         * @returns {Promise<Boolean>} tokens successfully cleared
         */
        clear() {
            return Promise.all([this.clearAccessToken(), this.clearRefreshToken()]).then(() => true);
        },

        /**
         * Set a new TTL value for accessToken
         * @param {Number} newAccessTokenTTL - accessToken TTL in ms
         * @returns {void}
         */
        setAccessTokenTTL(newAccessTokenTTL) {
            defaultAccessTokenTTL = newAccessTokenTTL;
        }
    };
};

export default jwtTokenStoreFactory;
