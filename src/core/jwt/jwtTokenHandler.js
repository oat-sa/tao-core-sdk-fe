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
 * Copyright (c) 2019-2022 (original work) Open Assessment Technologies SA ;
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
import TokenError from 'core/error/TokenError';

/**
 * JWT token handler factory
 * @param {Object} options Options of JWT token handler
 * @param {String} options.serviceName Name of the service what JWT token belongs to
 * @param {String} options.refreshTokenUrl Url where handler could refresh JWT token
 * @param {Number} [options.accessTokenTTL] Set accessToken TTL in ms for token store
 * @param {Boolean} [options.usePerTokenTTL] if true, accessToken TTL should be extractable from JWT payload, and accessTokenTTL will be used as fallback
 * @param {Boolean} [options.useCredentials] refreshToken stored in cookie instead of store
 * @param {String} [options.refreshTokenHeaderName] the name of the header to send the refresh token value in
 * @param {Object} [options.refreshTokenParameters] Parameters that should be send in refreshToken call
 * @param {Boolean} [options.oauth2RequestFormat] use oauth2 request format
 * @returns {Object} JWT Token handler instance
 */
const jwtTokenHandlerFactory = function jwtTokenHandlerFactory({
    serviceName = 'tao',
    refreshTokenUrl,
    accessTokenTTL,
    usePerTokenTTL = false,
    refreshTokenParameters,
    refreshTokenHeaderName = 'refresh-token',
    useCredentials = false,
    oauth2RequestFormat = false
} = {}) {
    const tokenStorage = jwtTokenStoreFactory({
        namespace: serviceName,
        accessTokenTTL,
        usePerTokenTTL
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
        const headers = {};
        let refreshTokenId;
        let parameters;
        let credentials;
        let flow;

        if (refreshTokenParameters) {
            parameters = Object.assign({}, refreshTokenParameters);
            refreshTokenId = parameters.refreshTokenId && decodeURIComponent(parameters.refreshTokenId);
        }

        if (useCredentials) {
            credentials = 'include';
            flow =
                (refreshTokenId &&
                    tokenStorage.getRefreshToken(refreshTokenId).then(refreshToken => {
                        if (refreshToken) {
                            headers[refreshTokenHeaderName] = refreshToken;
                        }
                    })) ||
                Promise.resolve();
        } else {
            flow = tokenStorage.getRefreshToken().then(refreshToken => {
                if (!refreshToken) {
                    throw new Error('Refresh token is not available');
                }
                if (oauth2RequestFormat) {
                    parameters = Object.assign({}, parameters, { refresh_token: refreshToken });
                } else {
                    parameters = Object.assign({}, parameters, { refreshToken });
                }
            });
        }

        return flow
            .then(() => {
                let body;
                if (oauth2RequestFormat) {
                    body = new FormData();
                    Object.keys(parameters).forEach(key => {
                        body.append(key, parameters[key]);
                    });
                } else {
                    if (parameters) {
                        body = JSON.stringify(parameters);
                    }

                    headers['Content-Type'] = 'application/json';
                }
                return fetch(refreshTokenUrl, {
                    method: 'POST',
                    credentials,
                    headers,
                    body
                });
            })
            .then(response => {
                if (response.status === 200) {
                    return response.json();
                }
                if(response.status === 401){
                    const error = new TokenError('Refresh-token expired', response);
                    return Promise.reject(error);
                }

                let error = new Error('Unsuccessful token refresh');
                error.response = response;
                return Promise.reject(error);
            })
            .then(response => {
                let accessToken, refreshToken, refreshTokenReference, expiresIn;

                if (oauth2RequestFormat) {
                    accessToken = response.access_token;
                    refreshToken = response.refresh_token;
                    expiresIn = response.expires_in;
                } else {
                    accessToken = response.accessToken;
                    refreshToken = response.refreshToken;
                    refreshTokenReference = response.refreshTokenId;
                }

                if (expiresIn) {
                    tokenStorage.setAccessTokenTTL(expiresIn * 1000);
                }

                if (accessToken && refreshToken) {
                    return tokenStorage.setTokens(accessToken, refreshToken).then(() => accessToken);
                }

                return tokenStorage.setAccessToken(accessToken)
                    .then(() => {
                        if (refreshTokenReference) {
                            return tokenStorage.setRefreshToken(refreshTokenReference, refreshTokenId);
                        }
                    })
                    .then(() => accessToken)
                    .catch(() => accessToken);
            });
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
         * Returns the refresh token from the token storage
         * @returns {Promise<String|null>} Promise that returns the token
         */
        getRefreshToken() {
            return tokenStorage.getRefreshToken();
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
         * @param {Number} newAccessTokenTTL - accessToken TTL in ms
         */
        setAccessTokenTTL(newAccessTokenTTL) {
            tokenStorage.setAccessTokenTTL(newAccessTokenTTL);
        }
    };
};

export default jwtTokenHandlerFactory;
