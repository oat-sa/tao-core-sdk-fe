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

/**
 * Test the error types
 */
define(['core/error/types', 'core/error/UserError'], function (errorTypes, UserError) {
    'use strict';

    QUnit.module('UserError');

    QUnit.test('construct', assert => {
        assert.expect(4);

        const err = new UserError('This value is not a date', true);
        assert.equal(err.name, 'UserError');
        assert.equal(err.type, errorTypes.user);
        assert.equal(err.message, 'This value is not a date');
        assert.equal(err.recoverable, true);
    });

    QUnit.test('throw', assert => {
        assert.expect(1);

        assert.throws(
            () => {
                throw new UserError('The text is too long');
            },
            UserError,
            'Thrown error type is matching'
        );
    });
});
