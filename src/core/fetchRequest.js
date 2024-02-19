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
import httpRequestFlowFactory from 'core/request/flowFactory';

/**
 * !!! IE11 requires polyfill https://www.npmjs.com/package/whatwg-fetch
 * Creates an HTTP request to the url based on the provided parameters
 * Request is based on fetch, so behaviour and parameters are the same, except
 *   - every response where response code is not 2xx will be rejected and
 *   - every response will be parsed as json.
 * @param {string} url - url that should be requested
 * @param {object} options - fetch request options that implements RequestInit (https://fetch.spec.whatwg.org/#requestinit)
 * @param {integer} [options.timeout] - (default: 5000) if timeout reached, the request will be rejected
 * @param {object} [options.jwtTokenHandler] - core/jwt/jwtTokenHandler instance that should be used during request
 * @param {boolean} [options.returnOriginalResponse] - the full original response should be returned instead of parsing internally (useful for HEAD requests or other empty-response-body requests)
 * @returns {Promise<Response>} resolves with http Response object
 */
const requestFactory = (url, options) => {
    options = Object.assign(
        {
            timeout: 5000
        },
        options
    );

    return httpRequestFlowFactory(fetch, url, options);
};

export default requestFactory;
