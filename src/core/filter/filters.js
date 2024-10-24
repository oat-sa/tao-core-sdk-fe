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
 * Copyright (c) 2013-2024 (original work) Open Assessment Technologies SA ;
 */

import _ from 'lodash';

const Filters = {
    register: function (name, filter) {
        if (!_.isString(name)) {
            throw new Error('An filter must have a valid name');
        }
        if (!_.isFunction(filter)) {
            throw new Error('Filter must be a function');
        }
        this[name] = filter;
    },

    filter: function (name, value) {
        if (this[name] && _.isArray(value)) {
            return _.filter(value, this[name]);
        }
        return value;
    }
};

export default Filters;
