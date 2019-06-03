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
 * Copyright (c) 2016-2019 (original work) Open Assessment Technologies SA;
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
 * CAUTION! By default this request does NOT have a token attached (for backwards compatibility reasons)
 * If you need a token on a request, you must set noToken=false
 * OR directly use the 'core/request' module, which DOES attach a token by default
 *
 * @author Martin Nicholson <martin@taotesting.com>
 */
import _ from 'lodash';
import coreRequest from 'core/request';

/**
 * A wrapper for the core module which requests content from a TAO endpoint
 *
 * @param {String} url - the endpoint full url
 * @param {Object} [data] - additional parameters
 * @param {String} [method='GET'] - the HTTP method
 * @param {Object} [headers] - the HTTP header
 * @param {Boolean} [background] - tells if the request should be done in the background, which in practice does not trigger the global handlers like ajaxStart or ajaxStop
 * @param {Boolean} [noToken=true] - the default is a request with no token, set this to false to require a token
 * @returns {Promise} that resolves with data or reject if something went wrong
 */
export default function request(url, data, method, headers, background, noToken) {
    return coreRequest({
        url: url,
        data: data,
        method: method,
        headers: headers,
        background: background,
        noToken: noToken === false ? false : true
    }).then(function(response) {
        if (_.isUndefined(response)) { // in case 204 empty content
            return Promise.resolve();
        } else if (response.success) {
            return Promise.resolve(response.data);
        }
        else {
            return Promise.reject(response); // in case success:false different types of response
        }
    })
    .catch(function(error) {
        return Promise.reject(error);
    });
}
