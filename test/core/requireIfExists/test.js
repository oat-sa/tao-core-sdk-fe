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
 * Copyright (c) 2016 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */
define(['core/requireIfExists'], function(requireIfExists) {
    'use strict';

    QUnit.module('requireIfExists');

    QUnit.test('module', function(assert) {
        assert.expect(1);

        assert.equal(typeof requireIfExists, 'function', 'The requireIfExists module exposes a function');
    });

    QUnit.test('exist', function(assert) {
        var ready = assert.async();
        assert.expect(1);

        requireIfExists('core/promise').then(function(Promise) {
            assert.notEqual(typeof Promise, 'undefined', 'The core/promise module has been loaded');
            ready();
        });
    });

    QUnit.test('not exist', function(assert) {
        var ready = assert.async();
        assert.expect(1);

        requireIfExists('not/exist').then(function(dummy) {
            assert.strictEqual(dummy, null, 'The not/exist module has been faked');
            ready();
        });
    });
});
