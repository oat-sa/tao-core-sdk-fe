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
 * Give and refresh JWT token
 * @module core/jwtTokenHandler
 * @author Tamas Besenyei <tamas@taotesting.com>
 */

import jwtTokenStoreFactory from 'core/jwtTokenStore';
import coreRequest from 'core/request';
import promiseQueue from 'core/promiseQueue';

/**
 * Default options for factory
 * @type {Object}
 */
const defaultOptions = {
    serviceName: 'tao'
};

/**
 * JWT token handler factory
 * @param {Object} options Options of JWT token handler
 * @param {String} options.serviceName Name of the service what JWT token belongs to
 * @param {String} options.refreshTokenUrl Url where handler could refresh JWT token
 */
const jwtTokenHandlerFactory = function jwtTokenHandlerFactory(options = {}) {
    options = { ...defaultOptions, ...options };

    const { serviceName, refreshTokenUrl } = options;

    const tokenStorage = jwtTokenStoreFactory({
        namespace: serviceName
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
    const unQueuedRefreshToken = () =>
        new Promise((resolve, reject) => {
            tokenStorage.getRefreshToken().then(refreshToken => {
                if (!refreshToken) {
                    reject(new Error('Refresh token is not available'));
                } else {
                    coreRequest({
                        url: refreshTokenUrl,
                        method: 'POST',
                        data: JSON.stringify({ refreshToken }),
                        dataType: 'json',
                        contentType: 'application/json',
                        noToken: true,
                        timeout: 3 // in seconds
                    })
                        .then(({ accessToken }) => {
                            tokenStorage.setAccessToken(accessToken).then(() => {
                                resolve(accessToken);
                            });
                        })
                        .catch(error => {
                            reject(error);
                        });
                }
            });
        });

    return {
        /**
         * Get access token
         * @returns {Promise<String|null>} Promise of access token
         */
        getToken() {
            const getTokenPromiseCreator = () =>
                new Promise((resolve, reject) => {
                    tokenStorage.getAccessToken().then(accessToken => {
                        if (accessToken) {
                            resolve(accessToken);
                        } else {
                            tokenStorage.getRefreshToken().then(refreshToken => {
                                if (refreshToken) {
                                    unQueuedRefreshToken()
                                        .then(token => {
                                            resolve(token);
                                        })
                                        .catch(reject);
                                } else {
                                    reject(new Error('Token not available and cannot be refreshed'));
                                }
                            });
                        }
                    });
                });

            return actionQueue.serie(getTokenPromiseCreator);
        },

        /**
         * Saves refresh token for later
         * @param {String} refreshToken
         * @returns {Promise<Boolean>} Promise of token is stored
         */
        storeRefreshToken(refreshToken) {
            return actionQueue.serie(() => {
                return tokenStorage.setRefreshToken(refreshToken);
            });
        },

        /**
         * Saves initial access token
         * @param {String} accessToken
         * @returns {Promise<Boolean>} Promise of token is stored
         */
        storeAccessToken(accessToken) {
            return actionQueue.serie(() => {
                return tokenStorage.setAccessToken(accessToken);
            });
        },

        /**
         * Clear all tokens from store
         * @returns {Promise<Boolean>} Promise of store is cleared
         */
        clearStore() {
            return actionQueue.serie(() => {
                return tokenStorage.clear();
            });
        },

        /**
         * Refresh access token
         * @returns {Promise<String>} Promise of new access token
         */
        refreshToken() {
            return actionQueue.serie(() => unQueuedRefreshToken());
        }
    };
};

export default jwtTokenHandlerFactory;
