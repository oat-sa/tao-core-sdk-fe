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
 * Copyright (c) 2022 (original work) Open Assessment Technologies SA
 *
 */

define(['core/error/types', 'core/error/TokenError'], function (errorTypes, TokenError) {
    'use strict';

    QUnit.module('TokenError');

    QUnit.test('construct with minimal params', assert => {
        assert.expect(6);

        const err = new TokenError('Token expired');
        assert.equal(err.name, 'TokenError');
        assert.equal(err.type, errorTypes.token);
        assert.equal(err.message, 'Token expired');
        assert.equal(err.errorCode, 401);
        assert.equal(err.response, null);
        assert.equal(err.recoverable, false);
    });

    QUnit.test('construct with passed params', assert => {
        assert.expect(6);

        const response = {};
        const err = new TokenError('Unexpected error', response);
        assert.equal(err.name, 'TokenError');
        assert.equal(err.type, errorTypes.token);
        assert.equal(err.message, 'Unexpected error');
        assert.equal(err.errorCode, 401);
        assert.equal(err.response, response);
        assert.equal(err.recoverable, false);
    });

    QUnit.test('throw', assert => {
        assert.expect(1);

        assert.throws(
            () => {
                throw new TokenError('Refresh token unsuccessful');
            },
            TokenError,
            'Thrown error type is matching'
        );
    });
});
