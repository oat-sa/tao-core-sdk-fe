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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA
 *
 */

define(['core/error/types', 'core/error/ApiError'], function (errorTypes, ApiError) {
    'use strict';

    QUnit.module('ApiError');

    QUnit.test('construct', assert => {
        assert.expect(6);

        const response = { success: false, errorCode: 500 };
        const err = new ApiError('Server error', 500, response, true);
        assert.equal(err.name, 'ApiError');
        assert.equal(err.type, errorTypes.api);
        assert.equal(err.message, 'Server error');
        assert.equal(err.errorCode, 500);
        assert.deepEqual(err.response, response);
        assert.equal(err.recoverable, true);
    });

    QUnit.test('throw', assert => {
        assert.expect(1);

        assert.throws(
            () => {
                throw new ApiError('Invalid request', 412, { success: false, errorCode: 500 }, true, 'foo.js', 123);
            },
            ApiError,
            'Thrown error type is matching'
        );
    });
});
