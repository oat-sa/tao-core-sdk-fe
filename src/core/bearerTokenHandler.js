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
 * Give and refresh Bearer token
 * @author Tamas Besenyei <tamas@taotesting.com>
 */

import bearerTokenStoreFactory from 'core/bearerTokenStore';
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
 * Bearer token handler factory
 * @param {Object} options Options of bearer token handler
 * @param {string} options[serviceName] Name of the service what Bearer token belongs to
 */
export default function bearerTokenHandlerFactory(options = {}) {
    options = { ...defaultOptions, ...options };

    const { serviceName, refreshTokenUrl } = options;

    const tokenStorage = bearerTokenStoreFactory({
        namespace: serviceName
    });

    /**
     * Action queue to avoid concurrent token updates
     */
    const actionQueue = promiseQueue();

    /**
     * This is an "unsafe" refresh token, because it allows to call multiple time paralelly
     * It will refresh the token from provided API and saves it for later use
     * @returns {Promise<string>} Promise of new token
     */
    const unQueuedRefreshToken = () =>
        new Promise((resolve, reject) => {
            tokenStorage.getRefreshToken().then(refreshToken => {
                if (!refreshToken) {
                    reject(new Error('Refresh token is not available'));
                } else {
                    coreRequest({
                        url: refreshTokenUrl,
                        method: 'GET',
                        data: JSON.stringify({ refreshToken }),
                        dataType: 'json',
                        contentType: 'application/json',
                        noToken: true,
                        timeout: 3000
                    }).then(({ accessToken }) => {
                        tokenStorage.setAccessToken(accessToken).then(() => {
                            resolve(accessToken);
                        });
                    });
                }
            });
        });

    return {
        /**
         * Get Bearer token
         * @returns {Promise<string|null>} Promise of Bearer token
         */
        getToken() {
            return actionQueue.serie(
                () =>
                    new Promise((resolve, reject) => {
                        tokenStorage.getAccessToken().then(accessToken => {
                            if (accessToken) {
                                resolve(accessToken);
                            } else {
                                tokenStorage.getRefreshToken().then(refreshToken => {
                                    if (refreshToken) {
                                        unQueuedRefreshToken().then(token => {
                                            resolve(token);
                                        });
                                    } else {
                                        reject(new Error('Token not available and cannot be refreshed'));
                                    }
                                });
                            }
                        });
                    })
            );
        },

        /**
         * Saves refresh token for later
         * @param {string} refreshToken
         * @returns {Promise<Boolean>} Promise of token store
         */
        storeRefreshToken(refreshToken) {
            return actionQueue.serie(() => {
                return tokenStorage.setRefreshToken(refreshToken);
            });
        },

        /**
         * Saves initial bearer token
         * @param {string} bearerToken
         * @returns {Promise<Boolean>} Promise of token store
         */
        storeBearerToken(bearerToken) {
            return actionQueue.serie(() => {
                return tokenStorage.setAccessToken(bearerToken);
            });
        },

        /**
         * Clear store with all tokens
         * @returns {Promise<Boolean>} Promise of store clear
         */
        clearStore() {
            return actionQueue.serie(() => {
                return tokenStorage.clear();
            });
        },

        /**
         * Refresh Bearer token
         * @returns {Promise<string>} Promise of new Bearer token
         */
        refreshToken() {
            return actionQueue.serie(() => unQueuedRefreshToken());
        }
    };
}
