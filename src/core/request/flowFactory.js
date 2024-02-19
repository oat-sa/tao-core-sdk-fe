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
 * Copyright (c) 2024 (original work) Open Assessment Technologies SA ;
 */
import ApiError from 'core/error/ApiError';
import NetworkError from 'core/error/NetworkError';
import TimeoutError from 'core/error/TimeoutError';

/**
 * @param {(url: string, options: object) => Promise<Response>} httpRequest
 * @param {string} url
 * @param {object} options - fetch request options that implements RequestInit (https://fetch.spec.whatwg.org/#requestinit)
 * @param {integer} [options.timeout] - (default: 5000) if timeout reached, the request will be rejected
 * @param {object} [options.jwtTokenHandler] - core/jwt/jwtTokenHandler instance that should be used during request
 * @param {boolean} [options.returnOriginalResponse] - the full original response should be returned instead of parsing internally (useful for HEAD requests or other empty-response-body requests)
 */
export default function httpRequestFlowFactory(httpRequest, url, options) {
    let flow = Promise.resolve();

    if (options.jwtTokenHandler) {
        flow = flow
            .then(options.jwtTokenHandler.getToken)
            .then(token => ({
                Authorization: `Bearer ${token}`
            }))
            .then(headers => {
                options.headers = Object.assign({}, options.headers, headers);
            });
    }

    flow = flow.then(() =>
        Promise.race([
            httpRequest(url, options),
            new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(new TimeoutError('Timeout', options.timeout));
                }, options.timeout);
            })
        ])
    );

    if (options.jwtTokenHandler) {
        flow = flow.then(response => {
            if (response.status === 401) {
                return options.jwtTokenHandler
                    .refreshToken()
                    .then(options.jwtTokenHandler.getToken)
                    .then(token => {
                        options.headers.Authorization = `Bearer ${token}`;
                        return httpRequest(url, options);
                    });
            }

            return Promise.resolve(response);
        });
    }

    /**
     * Stores the original response
     */
    let originalResponse;
    /**
     * Stores the response code
     */
    let responseCode;

    flow = flow
        .then(response => {
            originalResponse = response.clone();
            responseCode = response.status;

            if (options.returnOriginalResponse) {
                return originalResponse;
            }
            return response.json().catch(() => ({}));
        })
        .then(response => {
            if (responseCode === 204) {
                return null;
            }

            // successful request
            if ((responseCode >= 200 && responseCode < 300) || (response && response.success === true)) {
                return response;
            }

            // create error
            let err;
            if (response.errorCode) {
                err = new ApiError(
                    `${response.errorCode} : ${response.errorMsg || response.errorMessage || response.error}`,
                    response.errorCode,
                    originalResponse
                );
            } else {
                err = new NetworkError(
                    `${responseCode} : Request error`,
                    responseCode || 0,
                    originalResponse
                );
            }
            throw err;
        })
        .catch(err => {
            if (!err.type) {
                //offline, CORS, etc.
                return Promise.reject(new NetworkError(err.message, 0));
            }
            return Promise.reject(err);
        });

    return flow;
}