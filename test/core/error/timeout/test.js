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

define(['core/error/types', 'core/error/TimeoutError'], function (errorTypes, TimeoutError) {
    'use strict';

    QUnit.module('TimeoutError');

    QUnit.test('construct', assert => {
        assert.expect(5);

        const err = new TimeoutError('Submition timeout', 30, true);

        assert.equal(err.name, 'TimeoutError');
        assert.equal(err.type, errorTypes.timeout);
        assert.equal(err.message, 'Submition timeout');
        assert.equal(err.timeout, 30);
        assert.equal(err.recoverable, true);
    });

    QUnit.test('throw', assert => {
        assert.expect(1);

        assert.throws(
            () => {
                throw new TimeoutError('Unable to import');
            },
            TimeoutError,
            'Thrown error type is matching'
        );
    });
});
