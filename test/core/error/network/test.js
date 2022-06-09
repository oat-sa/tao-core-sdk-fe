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

define(['core/error/types', 'core/error/NetworkError'], function (errorTypes, NetworkError) {
    'use strict';

    QUnit.module('NetworkError');

    QUnit.test('construct', assert => {
        assert.expect(6);

        const err = new NetworkError('No connection', 0, null, true);
        assert.equal(err.name, 'NetworkError');
        assert.equal(err.type, errorTypes.network);
        assert.equal(err.message, 'No connection');
        assert.equal(err.errorCode, 0);
        assert.equal(err.response, null);
        assert.equal(err.recoverable, true);
    });

    QUnit.test('throw', assert => {
        assert.expect(1);

        assert.throws(
            () => {
                throw new NetworkError('Port closed during the connection');
            },
            NetworkError,
            'Thrown error type is matching'
        );
    });
});
