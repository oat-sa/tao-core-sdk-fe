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

import errorTypes from './types.js';

/**
 * Error when an action times out
 */
//eslint-disable-next-line
export default class TimeoutError extends Error {

    /**
     * Instantiate an error
     * @param {string} message - the error message
     * @param {number} timeout - the timeout value
     * @param {boolean} [recoverable=true] - can the user recover after having such error ?
     * @param {...} params - additional error parameters (line, etc.)
     */
    constructor(message, timeout, recoverable = true, ...params) {
        super(message, ...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, TimeoutError);
        }

        this.name = 'TimeoutError';
        this.message = message;
        this.timeout = timeout;
        this.recoverable = !!recoverable;
        this.type = errorTypes.timeout;
    }
}
