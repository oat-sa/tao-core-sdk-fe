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
 * Copyright (c) 2022 (original work) Open Assessment Technologies SA ;
 */

import errorTypes from 'core/error/types';
import NetworkError from 'core/error/NetworkError';

/**
 * Token expiration error
 */
//eslint-disable-next-line
export default class TokenError extends NetworkError {
    /**
     * Instantiate an error
     * @param {string} message - the error message
     * @param {Object} [response] - the full response object if any
     * @param {boolean} [recoverable=true] - can the user recover after having such error ?
     * @param {...} params - additional error parameters (line, etc.)
     */
    constructor(message, response, recoverable = true, ...params) {
        super(message, 401, response, recoverable, ...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, TokenError);
        }

        this.name = 'TokenError';
        this.type = errorTypes.token;
    }
}
