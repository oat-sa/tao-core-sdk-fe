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
 * @author Tamas Besenyei <tamas@taotesting.com>
 */

define([], function() {
    let apiConfig = {};

    const request = function request(options) {
        const { url } = options;

        return new Promise((resolve, reject) => {
            const api = apiConfig[url];

            if (api) {
                resolve(api(options));
            } else {
                reject(new Error('API does not exists'));
            }
        });
    };

    request.reset = function reset() {
        apiConfig = {};
    };

    request.setup = function setup(newApiConfig) {
        apiConfig = { ...apiConfig, ...newApiConfig };
    };

    return request;
});
