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
 * Copyright (c) 2025 Open Assessment Technologies SA;
 */

define(['util/cookies'], function (cookieStorage) {
    'use strict';

    QUnit.module('cookieStorage', {
        beforeEach: function () {
            cookieStorage.removeItem('testKey');
            cookieStorage.removeItem('nonexistent');
            cookieStorage.removeItem('customKey');
            cookieStorage.removeItem('toBeRemoved');
        }
    });

    QUnit.test('getItem returns null when cookie is not set', function (assert) {
        assert.strictEqual(cookieStorage.getItem('nonexistent'), null, 'Returns null for missing key');
    });

    QUnit.test('setItem sets and getItem retrieves the correct value', function (assert) {
        const key = 'testKey';
        const value = { a: 1, b: 'hello' };

        cookieStorage.setItem(key, value);
        const raw = cookieStorage.getItem(key);
        const parsed = JSON.parse(raw);

        assert.deepEqual(parsed, value, 'Retrieved value matches stored object');
    });

    QUnit.test('setItem supports custom path, domain and expires', function (assert) {
        const key = 'customKey';
        const value = 'custom';
        const path = '/custom';
        const domain = location.hostname;
        const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // +1 day

        // The test is only verifying that no error occurs with custom options
        try {
            cookieStorage.setItem(key, value, { path, domain, expires });
            assert.ok(true, 'Cookie was set without errors using custom options');
        } catch (e) {
            assert.ok(false, `Error occurred while setting cookie: ${e.message}`);
        }
    });

    QUnit.test('removeItem deletes the cookie', function (assert) {
        const key = 'toBeRemoved';
        const value = 'bye';

        cookieStorage.setItem(key, value);
        assert.ok(cookieStorage.getItem(key), 'Cookie is set');

        cookieStorage.removeItem(key);
        const removed = cookieStorage.getItem(key);

        assert.strictEqual(removed, null, 'Cookie is removed');
    });
});
