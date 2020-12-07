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

import errorTypes from 'core/error/types';

/**
 * Error in rendering
 */
//eslint-disable-next-line
export default class RenderingError extends Error {

    /**
     * Instantiate an error
     * @param {string} message]- the error message
     * @param {Boolean} [recoverable] - can the user recover after having such error ?
     * @param {...} params - additional error parameters (line, etc.)
     */
    constructor(message, recoverable = true, ...params) {
        super(message, ...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, RenderingError);
        }

        this.name = 'RenderingError';
        this.message = message;
        this.recoverable = !!recoverable;
        this.type = errorTypes.rendering;
    }
}
