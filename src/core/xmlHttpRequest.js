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
 * Copyright (c) 2020-2024 (original work) Open Assessment Technologies SA ;
 */
import httpRequestFlowFactory from './request/flowFactory';

const XHR_READY_STATE_OPENED = 1;
const XHR_READY_STATE_HEADERS_RECEIVED = 2;
const XHR_READY_STATE_DONE = 4;

/**
 * XHR implementation of Fetch API
 * @param {string} url
 * @param {Object} options - fetch request options that implements RequestInit (https://fetch.spec.whatwg.org/#requestinit)
 * @param {Function} [options.onUploadProgress]
 * @param {Function} [options.onDownloadProgress]
 * @returns {Promise<Response>}
 */
function xhr(url, options) {
    return new Promise(resolve => {
        const request = new XMLHttpRequest();
        let responseBody = null;
        const responseHeaders = new Headers();

        if (typeof options.onUploadProgress === 'function') {
            request.upload.addEventListener('progress', options.onUploadProgress);
        }
        if (typeof options.onDownloadProgress === 'function') {
            request.addEventListener('progress', options.onDownloadProgress);
        }
        request.addEventListener('readystatechange', () => {
            switch (request.readyState) {
                case XHR_READY_STATE_OPENED:
                    // eslint-disable-next-line no-case-declarations
                    for (const header in options.headers) {
                        request.setRequestHeader(header, options.headers[header]);
                    }
                    break;
                case XHR_READY_STATE_HEADERS_RECEIVED:
                    request.getAllResponseHeaders().trim().split(/[\r\n]+/).forEach((line) => {
                        const parts = line.split(': ');
                        const header = parts.shift();
                        const value = parts.join(': ');
                        if (header) {
                            responseHeaders.append(header, value);
                        }
                    });
                    break;
                case XHR_READY_STATE_DONE:
                    responseBody = request.response;
                    // Response with null body status cannot have body
                    if ([101, 204, 205, 304].includes(request.status)) {
                        responseBody = null;
                    }
                    if (request.responseType === 'json') {
                        responseBody = JSON.stringify(request.response);
                    }
                    // eslint-disable-next-line no-case-declarations
                    const response = new Response(responseBody, {
                        status: request.status,
                        statusText: request.statusText,
                        headers: responseHeaders
                    });
                    resolve(response);
                    break;
            }
        });

        request.open(options.method || 'GET', url, true);
        request.send(options.body);
    });
}

/**
 * Creates an HTTP request to the url based on the provided parameters
 * Request is based on fetch API with XMLHttpRequest under the hood,
 * so behaviour and parameters are the same, except:
 *   - every response where response code is not 2xx will be rejected and
 *   - every response will be parsed as json.
 * @param {string} url - url that should be requested
 * @param {object} options - fetch request options that implements RequestInit (https://fetch.spec.whatwg.org/#requestinit)
 * @param {integer} [options.timeout] - (default: 5000) if timeout reached, the request will be rejected
 * @param {object} [options.jwtTokenHandler] - core/jwt/jwtTokenHandler instance that should be used during request
 * @param {boolean} [options.returnOriginalResponse] - the full original response should be returned instead of parsing internally (useful for HEAD requests or other empty-response-body requests)
 * @param {Function} [options.onUploadProgress]
 * @param {Function} [options.onDownloadProgress]
 * @returns {Promise<Response>} resolves with http Response object
 */
const requestFactory = (url, options) => {
    options = Object.assign(
        {
            timeout: 5000
        },
        options
    );

    return httpRequestFlowFactory(xhr, url, options);
};

export default requestFactory;
