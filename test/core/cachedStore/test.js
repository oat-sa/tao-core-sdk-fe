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
define(['core/store', 'core/cachedStore'], function(store, cachedStore) {
    'use strict';

    QUnit.module('cachedStore');

    QUnit.test('module', function(assert) {
        assert.expect(1);

        assert.equal(typeof cachedStore, 'function', 'The cachedStore module exposes a function');
    });

    QUnit.test('factory', function(assert) {
        const ready = assert.async();
        assert.expect(3);

        const name = 'test1';

        cachedStore(name).then(function(storage1) {
            assert.equal(typeof storage1, 'object', 'An instance of the cachedStore accessor has been created');

            cachedStore(name).then(function(storage2) {
                assert.equal(
                    typeof storage2,
                    'object',
                    'Another instance of the cachedStore accessor has been created'
                );
                assert.notEqual(storage1, storage2, 'The factory creates a new instance on each build');

                ready();
            });
        });
    });

    QUnit.test('data', function(assert) {
        const ready = assert.async();
        assert.expect(11);

        const name = 'test2';
        const expectedName1 = 'foo';
        const expectedName2 = 'bob';
        const expectedValue1 = 'bar';
        const expectedValue2 = 'fake';

        cachedStore(name).then(function(storage) {
            assert.equal(typeof storage, 'object', 'An instance of the cachedStore accessor has been created');

            storage.setItem(expectedName1, expectedValue1).then(function() {
                assert.ok(true, 'The value1 has been set');

                storage.setItem(expectedName2, expectedValue2).then(function() {
                    assert.ok(true, 'The value2 has been set');

                    const value1 = storage.getItem(expectedName1);
                    assert.equal(value1, expectedValue1, 'The got value1 is correct');

                    const value2 = storage.getItem(expectedName2);
                    assert.equal(value2, expectedValue2, 'The got value2 is correct');

                    storage.removeItem(expectedName1).then(function() {
                        assert.ok(true, 'The value1 has been removed');

                        assert.equal(storage.getItem(expectedName1), void 0, 'The value1 is erased');

                        assert.equal(storage.getItem(expectedName2), expectedValue2, 'The value2 is still there');

                        storage.clear().then(function() {
                            assert.ok(true, 'The data is erased');

                            assert.equal(storage.getItem(expectedName1), void 0, 'The value1 is erased');

                            assert.equal(storage.getItem(expectedName2), void 0, 'The value2 is erased');

                            ready();
                        });
                    });
                });
            });
        });
    });

    QUnit.test('persistence', function(assert) {
        const ready = assert.async();
        assert.expect(6);

        const name = 'test3';
        const expectedName = 'foo';
        const expectedValue = 'bar';

        cachedStore(name).then(function(storage1) {
            assert.equal(typeof storage1, 'object', 'An instance of the cachedStore accessor has been created');

            storage1.setItem(expectedName, expectedValue).then(function() {
                assert.ok(true, 'The value has been set');

                cachedStore(name).then(function(storage2) {
                    assert.equal(
                        typeof storage2,
                        'object',
                        'Another instance of the cachedStore accessor has been created'
                    );

                    assert.equal(storage2.getItem(expectedName), expectedValue, 'The got value is correct');

                    storage2.removeStore().then(function() {
                        cachedStore(name).then(function(storage3) {
                            assert.equal(
                                typeof storage3,
                                'object',
                                'Another instance of the cachedStore accessor has been created'
                            );

                            const value = storage3.getItem(expectedName);
                            assert.equal(typeof value, 'undefined', 'The got value is correct');

                            ready();
                        });
                    });
                });
            });
        });
    });
});
