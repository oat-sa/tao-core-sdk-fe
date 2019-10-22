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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA;
 */

/**
 * Common HTTP request wrapper to get data from TAO.
 * This suppose the endpoint to match the following criteria :
 *   - Restful endpoint
 *   - contentType : application/json; charset=UTF-8
 *   - headers : contains 'X-CSRF-Token' value when needed
 *   - the responseBody:
 *      { success : true, data : [the results]}
 *      { success : false, data : {Exception}, message : 'Something went wrong' }
 *      { success : false, code : X, message : 'Something went wrong' }
 *   - 204 for empty content
 *   - 403 if CSRF token validation fails
 *
 * @author Martin Nicholson <martin@taotesting.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import __ from 'i18n';
import module from 'module';
import context from 'context';
import promiseQueue from 'core/promiseQueue';
import tokenHandlerFactory from 'core/tokenHandler';
import loggerFactory from 'core/logger';

const tokenHeaderName = 'X-CSRF-Token';

const tokenHandler = tokenHandlerFactory();

const queue = promiseQueue();

const logger = loggerFactory('core/request');

/**
 * Create a new error based on the given response
 * @param {Object} response - the server body response as plain object
 * @param {String} fallbackMessage - the error message in case the response isn't correct
 * @param {Number} httpCode - the response HTTP code
 * @param {Boolean} httpSent - the sent status
 * @returns {Error} the new error
 */
const createError = (response, fallbackMessage, httpCode, httpSent) => {
    let err;
    if (response && response.errorCode) {
        err = new Error(`${response.errorCode} : ${response.errorMsg || response.errorMessage || response.error}`);
    } else {
        err = new Error(fallbackMessage);
    }
    err.response = response;
    err.sent = httpSent;
    err.source = response.source || 'request';

    if (_.isNumber(httpCode)) {
        err.code = httpCode;
    }
    return err;
};

/**
 * Request content from a TAO endpoint
 * @param {Object} options
 * @param {String} options.url - the endpoint full url
 * @param {String} [options.method='GET'] - the HTTP method
 * @param {Object} [options.data] - additional parameters (if method is 'POST')
 * @param {Object} [options.headers] - the HTTP headers
 * @param {String} [options.contentType] - what kind of data we're sending - usually 'json'
 * @param {String} [options.dataType] - what kind of data expected in response
 * @param {Boolean} [options.noToken=false] - by default, a token is always sent. If noToken=true, disables the token requirement
 * @param {Boolean} [options.background] - if true, the request should be done in the background, which in practice does not trigger the global handlers like ajaxStart or ajaxStop
 * @param {Boolean} [options.sequential] - if true, the request must join a queue to be run sequentially
 * @param {Number}  [options.timeout] - timeout in seconds for the AJAX request
 * @param {Object} [options.jwtTokenHandler] - JWT token handler instance
 * @param {string} [options.logLevel] - Minimum log level for request
 * @returns {Promise} resolves with response, or reject if something went wrong
 */
export default function request(options) {
    // Allow external config to override user option
    if (module.config().noToken) {
        options.noToken = true;
    }

    if (_.isEmpty(options.url)) {
        throw new TypeError('At least give a URL...');
    }

    // Request logger
    const requestLogger = logger.child({ url: options.url });
    const { logLevel } = options;
    if (logLevel) {
        requestLogger.level(logLevel);
    }

    /**
     * Function wrapper which allows the contents to be run now, or added to a queue
     * @returns {Promise} resolves with response, or rejects if something went wrong
     */
    const runRequest = () => {
        let tempToken;

        /**
         * Fetches a security token and appends it to headers, if required
         * Also saves the retrieved token in a temporary constiable, in case we need to re-enqueue it
         * @returns {Promise<Object>} - resolves with headers object
         */
        const computeCSRFTokenHeader = () => {
            if (options.noToken) {
                return Promise.resolve({});
            }
            return tokenHandler.getToken().then(token => {
                tempToken = token;

                return { [tokenHeaderName]: token || 'none' };
            });
        };

        /**
         * Fetches a JWT token if token handler is provided
         * @returns {Promise<Object>} promise of JWT token header
         */
        const computeJWTTokenHeader = () => {
            const { jwtTokenHandler } = options;
            if (jwtTokenHandler) {
                return jwtTokenHandler.getToken().then(token => ({
                    Authorization: `Bearer ${token}`
                }));
            }
            return Promise.resolve({});
        };

        /**
         * Extends header object with token headers
         * @returns {Promise<Object>} Promise of headers object
         */
        const computeHeaders = () => Promise.all([computeCSRFTokenHeader(), computeJWTTokenHeader()]).then(
            ([csrfTokenHeader, jwtTokenHeader]) => Object.assign({}, options.headers, csrfTokenHeader, jwtTokenHeader)
        );

        /**
         * Replaces the locally-stored tempToken into the tokenStore
         * Unsets the local copy
         * @returns {Promise} - resolves when done
         */
        const reEnqueueTempToken = () => {
            if (tempToken) {
                requestLogger.debug('re-enqueueing %s token %s', tokenHeaderName, tempToken);
                return tokenHandler.setToken(tempToken).then(() => {
                    tempToken = null;
                });
            }
            return Promise.resolve();
        };

        /**
         * Extracts returned security token from headers and adds it to store
         * @param {Object} xhr
         * @returns {Promise} - resolves when done
         */
        const setTokenFromXhr = xhr => {
            if (_.isFunction(xhr.getResponseHeader)) {
                const token = xhr.getResponseHeader(tokenHeaderName);
                requestLogger.debug('received %s header %s', tokenHeaderName, token);

                if (token) {
                    return tokenHandler.setToken(token);
                }
            }
            return Promise.resolve();
        };

        /**
         * Contains the request already tried to refresh the invalid access token
         */
        let isAccessTokenRefreshTried = false;
        return computeHeaders().then(
            customHeaders => new Promise((resolve, reject) => {
                const noop = void 0;

                const ajaxParameters = {
                    url: options.url,
                    method: options.method || 'GET',
                    headers: customHeaders,
                    data: options.data,
                    contentType: options.contentType || noop,
                    dataType: options.dataType || 'json',
                    async: true,
                    timeout: options.timeout * 1000 || context.timeout * 1000 || 0,
                    beforeSend() {
                        if (!_.isEmpty(customHeaders)) {
                            requestLogger.debug(
                                'sending %s header %s',
                                tokenHeaderName,
                                customHeaders && customHeaders[tokenHeaderName]
                            );
                        }
                    },
                    global: !options.background //TODO fix this with TT-260
                };

                const onDone = (response, status, xhr) => {
                    setTokenFromXhr(xhr)
                            .then(() => {
                                if (
                                    xhr.status === 204 ||
                                    (response && response.errorCode === 204) ||
                                    status === 'nocontent'
                                ) {
                                    // no content, so resolve with empty data.
                                    return resolve();
                                }

                                // handle case where token expired or invalid
                                if (xhr.status === 403 || (response && response.errorCode === 403)) {
                                    return reject(
                                        createError(
                                            response,
                                            `${xhr.status} : ${xhr.statusText}`,
                                            xhr.status,
                                            xhr.readyState > 0
                                        )
                                    );
                                }

                                if (xhr.status === 200 || (response && response.success === true)) {
                                    // there's some data
                                    return resolve(response);
                                }

                                //the server has handled the error
                                reject(
                                    createError(
                                        response,
                                        __('The server has sent an empty response'),
                                        xhr.status,
                                        xhr.readyState > 0
                                    )
                                );
                            })
                            .catch(error => {
                                requestLogger.error(error);
                                reject(createError(response, error, xhr.status, xhr.readyState > 0));
                            });
                };

                const onFail = (xhr, textStatus, errorThrown) => {
                    let response;

                    const jwtTokenHandler = options.jwtTokenHandler;
                    /**
                         * if access token expired then
                         * get new token
                         * update header with new token
                         * retry request
                         *  */
                    if (xhr.status === 401 && !isAccessTokenRefreshTried && jwtTokenHandler) {
                        isAccessTokenRefreshTried = true;
                        jwtTokenHandler
                                .refreshToken()
                                .then(computeJWTTokenHeader)
                                .then(jwtTokenHeaders => {
                                    Object.assign(ajaxParameters.headers, jwtTokenHeaders);
                                    $.ajax(ajaxParameters)
                                        .done(onDone)
                                        .fail(onFail);
                                })
                                // if refresh token was not success, fail with original error
                                .catch(() => {
                                    onFail(xhr, textStatus, errorThrown);
                                });
                        return;
                    }
                    try {
                        response = JSON.parse(xhr.responseText);
                    } catch (parseErr) {
                        response = {};
                    }

                    const responseExtras = {
                        success: false,
                        source: 'network',
                        cause: options.url,
                        purpose: 'proxy',
                        context: this,
                        code: xhr.status,
                        sent: xhr.readyState > 0,
                        type: 'error',
                        textStatus: textStatus,
                        message: errorThrown || __('An error occurred!')
                    };

                    const enhancedResponse = Object.assign({}, responseExtras, response);

                    // if the request failed because the browser is offline,
                    // we need to recycle the used request token
                    let tokenHandlerPromise;
                    if (enhancedResponse.code === 0) {
                        tokenHandlerPromise = reEnqueueTempToken();
                    } else {
                        tokenHandlerPromise = setTokenFromXhr(xhr);
                    }

                    tokenHandlerPromise
                            .then(() => {
                                reject(
                                    createError(
                                        enhancedResponse,
                                        `${xhr.status} : ${xhr.statusText}`,
                                        xhr.status,
                                        xhr.readyState > 0
                                    )
                                );
                            })
                            .catch(error => {
                                requestLogger.error(error);
                                reject(createError(enhancedResponse, error, xhr.status, xhr.readyState > 0));
                            });
                };

                $.ajax(ajaxParameters)
                        .done(onDone)
                        .fail(onFail);
            })
        );
    };

    // Decide how to launch the request based on certain params:
    return tokenHandler.getQueueLength().then(queueLength => {
        if (options.noToken === true) {
            // no token protection, run the request
            return runRequest();
        } else if (options.sequential || queueLength === 1) {
            // limited tokens, sequential queue must be used
            return queue.serie(runRequest);
        } else {
            // tokens ready
            return runRequest();
        }
    });
}
