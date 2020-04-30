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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */

/**
 * Request is based on fetch, so behaviour and parameters are the same, except
 * every response where response code is not 2xx will be rejected and
 * every response will be parsed as json.
 * It is extended with the following parameters:
 *  - timeout         : request will be rejected, when the timout will be reached  (default: 5000)
 *  - jwtTokenHandler : jwt token handler, that should be used for the request
 */

const requestFactory = (url, options) => {
    options = Object.assign(
        {
            timeout: 5000
        },
        options
    );

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

    flow = flow.then(() => Promise.race([
        fetch(url, options),
        new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('Timeout')), options.timeout);
        })
    ]));

    if (options.jwtTokenHandler) {
        flow = flow.then(response => {
            if (response.status === 401) {
                return options.jwtTokenHandler
                    .refreshToken()
                    .then(options.jwtTokenHandler.getToken)
                    .then(token => ({
                        Authorization: `Bearer ${token}`
                    }))
                    .then(headers => Object.assign({}, options, { headers }))
                    .then(newOptions => fetch(url, newOptions));
            }

            return Promise.resolve(response);
        });
    }

    let originalResponse;
    let responseCode;

    flow = flow.then(response => {
        originalResponse = response;
        responseCode = response.status;
        return response.json().catch(() => ({}));
    })
    .then(response => {
        // successful request
        if (responseCode === 200 || response.success === true) {
            return response;
        }

        if (responseCode === 204) {
            return null;
        }

        // create error
        let err;
        if (response.errorCode) {
            err = new Error(`${response.errorCode} : ${response.errorMsg || response.errorMessage || response.error}`);
        } else {
            err = new Error(`${responseCode} : Request error`);
        }
        err.response = originalResponse;
        throw err;
    });

    return flow;
};

export default requestFactory;
