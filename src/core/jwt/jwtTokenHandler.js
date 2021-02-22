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
 * Give and refresh JWT token
 * !!! The module uses native fetch request to refresh token.
 * !!! IE11 requires polyfill https://www.npmjs.com/package/whatwg-fetch
 * @module core/jwtTokenHandler
 * @author Tamas Besenyei <tamas@taotesting.com>
 */

import jwtTokenStoreFactory from 'core/jwt/jwtTokenStore';
import promiseQueue from 'core/promiseQueue';

/**
 * JWT token handler factory
 * @param {Object} options Options of JWT token handler
 * @param {String} options.serviceName Name of the service what JWT token belongs to
 * @param {String} options.refreshTokenUrl Url where handler could refresh JWT token
 * @param {Boolean} [options.useCredentials] refreshToken stored in cookie instead of store
 * @returns {Object} JWT Token handler instance
 */
const jwtTokenHandlerFactory = function jwtTokenHandlerFactory({
    serviceName = 'tao',
    refreshTokenUrl,
    accessTokenTTL,
    useCredentials = false
} = {}) {
    const tokenStorage = jwtTokenStoreFactory({
        namespace: serviceName,
        accessTokenTTL
    });

    /**
     * Action queue to avoid concurrent token updates
     * @type {Promise<any>}
     */
    const actionQueue = promiseQueue();

    /**
     * This is an "unsafe" refresh token, because it allows to call multiple time paralelly
     * It will refresh the token from provided API and saves it for later use
     * @returns {Promise<String>} Promise of new token
     */
    const unQueuedRefreshToken = () => {
        let body;
        let credentials;
        let flow;

        if (useCredentials) {
            credentials = 'include';
            flow = Promise.resolve();
        } else {
            flow = tokenStorage.getRefreshToken().then(refreshToken => {
                if (!refreshToken) {
                    throw new Error('Refresh token is not available');
                } else {
                    body = JSON.stringify({ refreshToken });
                }
            });
        }

        return flow.then(() => fetch(refreshTokenUrl, {
                method: 'POST',
                credentials,
                headers: {
                    'Content-Type': 'application/json'
                },
                body
        }))
            .then(response => {
                if (response.status === 200) {
                    return response.json();
                }
                const error = new Error('Unsuccessful token refresh');
                error.response = response;
                return Promise.reject(error);
            })
            .then(({ accessToken }) => tokenStorage.setAccessToken(accessToken).then(() => accessToken));
    };

    return {
        /**
         * service name of token handler
         */
        serviceName,

        /**
         * Get access token
         * @returns {Promise<String|null>} Promise of access token
         */
        getToken() {
            return actionQueue.serie(() => tokenStorage.getAccessToken().then(accessToken => {
                if (accessToken) {
                    return accessToken;
                }

                if (useCredentials) {
                    return unQueuedRefreshToken();
                }
                return tokenStorage.getRefreshToken().then(refreshToken => {
                    if (refreshToken) {
                        return unQueuedRefreshToken();
                    } else {
                        throw new Error('Token not available and cannot be refreshed');
                    }
                });
            }));
        },

        /**
         * Saves refresh token for later
         * @param {String} refreshToken
         * @returns {Promise<Boolean>} Promise of token is stored
         */
        storeRefreshToken(refreshToken) {
            if (useCredentials) {
                return Promise.resolve(false);
            }
            return actionQueue.serie(() => tokenStorage.setRefreshToken(refreshToken));
        },

        /**
         * Saves initial access token
         * @param {String} accessToken
         * @returns {Promise<Boolean>} Promise of token is stored
         */
        storeAccessToken(accessToken) {
            return actionQueue.serie(() => tokenStorage.setAccessToken(accessToken));
        },

        /**
         * Clear all tokens from store
         * @returns {Promise<Boolean>} Promise of store is cleared
         */
        clearStore() {
            return actionQueue.serie(() => tokenStorage.clear());
        },

        /**
         * Refresh access token
         * @returns {Promise<String>} Promise of new access token
         */
        refreshToken() {
            return actionQueue.serie(() => unQueuedRefreshToken());
        },

        /**
         * Set accessToken TTL
         * @param {Number} accessTokenTTL - accessToken TTL in ms
         */
        setAccessTokenTTL(accessTokenTTL) {
            tokenStorage.setAccessTokenTTL(accessTokenTTL);
        }
    };
};

export default jwtTokenHandlerFactory;
