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

define(['core/error/types', 'core/error/AuthError'], function (errorTypes, AuthError) {
    'use strict';

    QUnit.module('AuthError');

    QUnit.test('construct', assert => {
        assert.expect(4);

        const err = new AuthError('Token pool reading error', false);
        assert.equal(err.name, 'AuthError');
        assert.equal(err.type, errorTypes.auth);
        assert.equal(err.message, 'Token pool reading error');
        assert.equal(err.recoverable, false);
    });

    QUnit.test('throw', assert => {
        assert.expect(1);

        assert.throws(
            () => {
                throw new AuthError('Wrong key');
            },
            AuthError,
            'Thrown error type is matching'
        );
    });
});
