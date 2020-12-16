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

export default Object.freeze({
    // the server API is not successful: 500, 412, 403, etc.
    api: 'api',

    // any network error: CORS, offline, etc.
    network: 'network',

    // timeout error: an action cannot be performed in the given time
    timeout: 'timeout',

    // authentication: internal error about authentication (token pool issue, etc.)
    auth: 'auth',

    // errors due to user's input: wrong data range, etc.
    user: 'user',

    // rendering error: an interface, a component fails to render
    rendering: 'rendering'
});
