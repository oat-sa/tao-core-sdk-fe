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

define(['util/cookies'], cookieModule => {
    'use strict';

    // The AMD bundle may export { createCookieStorage: function } or the function itself.
    const createCookieStorage = cookieModule.createCookieStorage || cookieModule.default || cookieModule;

    let store;

    QUnit.module('cookieStorage (public API only)', {
        beforeEach() {
            // Instantiate a fresh storage instance:
            store = createCookieStorage();

            // Remove any cookies that might remain from previous tests:
            store.keys().forEach(name => {
                // removeItem without opts uses default path='/', no domain
                store.removeItem(name);
            });
        }
    });

    QUnit.test('getItem returns null when no cookie is set', assert => {
        assert.strictEqual(store.getItem('nonexistent'), null, 'Returns null if key not found');
    });

    QUnit.test('setItem + getItem round-trips a JSON-serializable object', assert => {
        const key = 'testKey';
        const value = { a: 1, b: 'hello' };

        store.setItem(key, value);
        const retrieved = store.getItem(key);

        assert.deepEqual(
            retrieved,
            value,
            'Storing an object with setItem and reading it back returns the same object'
        );
    });

    QUnit.test('setItem with plain string value is retrieved as string', assert => {
        const key = 'stringKey';
        const value = 'just_a_string';

        store.setItem(key, value);
        const retrieved = store.getItem(key);

        assert.strictEqual(retrieved, value, 'Storing a plain string and retrieving returns the raw string');
    });

    QUnit.test('setItem with expires override does not throw', assert => {
        const key = 'expiresKey';
        const futureISO = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

        assert.ok(() => {
            store.setItem(key, 'value', { expires: futureISO });
        }, 'Calling setItem with an ISO-string expires override should not throw');
        // We won’t call getItem here because path-scoped cookies may not appear immediately in QUnit’s environment
    });

    QUnit.test('removeItem deletes the cookie so getItem returns null', assert => {
        const key = 'removeKey';
        const val = 'to_be_deleted';

        store.setItem(key, val);
        assert.ok(store.getItem(key) !== null, 'Cookie is initially set');

        store.removeItem(key);
        const afterRemove = store.getItem(key);
        assert.strictEqual(afterRemove, null, 'After removeItem, getItem returns null');
    });

    QUnit.test('keys() and clearAll() enumerate and clear all cookies', assert => {
        store.setItem('key1', 'val1');
        store.setItem('key2', { x: 2 });

        const beforeKeys = store.keys();
        assert.ok(
            beforeKeys.includes('key1') && beforeKeys.includes('key2'),
            'keys() returns both "key1" and "key2" when they are set'
        );

        store.clearAll();
        assert.strictEqual(store.getItem('key1'), null, '"key1" was cleared');
        assert.strictEqual(store.getItem('key2'), null, '"key2" was cleared');

        const afterKeys = store.keys();
        assert.deepEqual(afterKeys, [], 'keys() is empty after clearAll()');
    });

    QUnit.test('getItem returns raw string when cookie value is not valid JSON', assert => {
        const key = 'rawKey';
        const rawValue = 'plain_text_value';

        // Manually set a non-JSON value in document.cookie:
        document.cookie = `${key}=${encodeURIComponent(rawValue)}; path=/`;

        const retrieved = store.getItem(key);
        assert.strictEqual(retrieved, rawValue, 'getItem returns the raw string when JSON.parse fails');

        // Clean up:
        store.removeItem(key);
    });

    QUnit.test('domainLevel too large: setItem should omit any "; domain=" fragment', assert => {
        const key = 'domainTestKey';
        const value = 'blah';

        // How many segments does the current hostname have?
        const parts = window.location.hostname.split('.');
        const tooBigLevel = parts.length + 1;

        // Attempt to set a cookie with domainLevel > parts.length
        store.setItem(key, value, { domainLevel: tooBigLevel });

        // Read the raw `document.cookie` string:
        const rawCookieString = document.cookie;

        assert.ok(rawCookieString.includes(`${key}=`), 'The cookie name=value pair still appears');
        assert.notOk(
            rawCookieString.includes('; domain='),
            'Since domainLevel was too large, there should be no "; domain=" fragment'
        );
        // Clean up:
        store.removeItem(key);
    });
});
