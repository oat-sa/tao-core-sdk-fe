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

define(['core/error/types', 'core/error/RenderingError'], function (errorTypes, RenderingError) {
    'use strict';

    QUnit.module('RenderingError');

    QUnit.test('construct', assert => {
        assert.expect(4);

        const err = new RenderingError('Fail to render an item due to inconsitent model.', true);
        assert.equal(err.name, 'RenderingError');
        assert.equal(err.type, errorTypes.rendering);
        assert.equal(err.message, 'Fail to render an item due to inconsitent model.');
        assert.equal(err.recoverable, true);
    });

    QUnit.test('throw', assert => {
        assert.expect(1);

        assert.throws(
            () => {
                throw new RenderingError('No mount point');
            },
            RenderingError,
            'Thrown error type is matching'
        );
    });
});
