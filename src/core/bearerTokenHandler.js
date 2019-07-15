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

    const actionQueue = promiseQueue();

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
            const getTokenPromise = new Promise((resolve, reject) => {
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
            });

            return actionQueue.serie(() => getTokenPromise);
        },

        storeRefreshToken(refreshToken) {
            return actionQueue.serie(() => {
                return tokenStorage.setRefreshToken(refreshToken);
            });
        },

        storeBearerToken(bearerToken) {
            return actionQueue.serie(() => {
                return tokenStorage.setAccessToken(bearerToken);
            });
        },

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
