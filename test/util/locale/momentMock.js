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
 * Copyright (c) 2021 Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'core/eventifier'
], function (eventifier) {
    'use strict';

    const mockValues = {};

    const momentMock = eventifier(function (...args) {
        momentMock.trigger('moment', ...args);
        return momentMockFactory(...args);
    });

    function momentMockFactory(...factoryArgs) {
        momentMock.trigger('factory', ...factoryArgs);

        return {
            format(...args) {
                momentMock.trigger('format', ...args);
                return mockValues.format;
            }
        };
    }

    return Object.assign(momentMock, {
        utc(...args) {
            momentMock.trigger('utc', ...args);
            return momentMockFactory(...args);
        },

        mockFormat(value) {
            mockValues.format = value;
        }
    });
});