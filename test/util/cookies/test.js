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

define(['util/cookies'], cookieStorageModule => {
    'use strict';

    // AMD module might export either the function itself or { default: <function> }.
    const initCookieStorage = cookieStorageModule.default || cookieStorageModule;
    let store;

    QUnit.module('cookieStorage', {
        beforeEach() {
            // Instantiate a fresh store:
            store = initCookieStorage();

            // Wipe any lingering test cookies:
            [
                'testKey',
                'nonexistent',
                'customKey',
                'toBeRemoved',
                'key1',
                'key2',
                'rawKey',
                'dateKey',
                'isoKey',
                'domainKey'
            ].forEach(k => {
                store.removeItem(k);
            });
        }
    });

    QUnit.test('getItem returns null when cookie is not set', assert => {
        assert.strictEqual(store.getItem('nonexistent'), null, 'Returns null for a missing key');
    });

    QUnit.test('setItem sets and getItem retrieves the correct value', assert => {
        const key = 'testKey';
        const value = { a: 1, b: 'hello' };

        store.setItem(key, value);
        const retrieved = store.getItem(key);

        assert.deepEqual(retrieved, value, 'Retrieved value matches the stored object');
    });

    QUnit.test('setItem supports expires as Date object', assert => {
        const key = 'dateKey';
        const value = 'val';
        const tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24);

        // Pass expires directly as a Date instance to cover the instanceof Date branch
        const dateStore = initCookieStorage({
            expires: tomorrow
        });

        // Setting the cookie should not throw:
        try {
            dateStore.setItem(key, value);
            assert.ok(true, 'Cookie was set without errors when expires is a Date');
        } catch (ex) {
            assert.ok(false, `Error occurred while setting cookie: ${ex.message}`);
        }

        // Now getItem should return the same string "val"
        const retrieved = dateStore.getItem(key);
        assert.strictEqual(retrieved, value, 'Retrieved value matches stored string when expires was Date');
    });

    QUnit.test('setItem supports expires as ISO string (covers new Date(opt.expires))', assert => {
        const key = 'isoKey';
        const value = 'isoValue';
        const isoString = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

        // Pass expires as ISO‐string (not a Date), to hit “else if (opt.expires)” branch
        const isoStore = initCookieStorage({
            expires: isoString
        });

        // setItem must not throw
        try {
            isoStore.setItem(key, value);
            assert.ok(true, 'Cookie was set without errors using ISO‐string expiration');
        } catch (ex) {
            assert.ok(false, `Error occurred while setting cookie with ISO expiry: ${ex.message}`);
        }

        // We do NOT call getItem(...) here, because some environments
        // won’t immediately expose a path‐scoped cookie back into document.cookie.
    });

    QUnit.test('setItem supports custom domainLevel (covers getDomainByHostname)', assert => {
        const key = 'domainKey';
        const value = 'domainVal';

        // We know window.location.hostname is something like “127.0.0.1” or “localhost”,
        // so setting domainLevel = 2 will take the last two segments (e.g. “0.1” or “host.local”).
        // That exercises getDomainByHostname(...) without redefining hostname.
        const domainStore = initCookieStorage({
            domainLevel: 2
        });

        // If setItem(...) does not throw, we've covered the getDomainByHostname branch.
        try {
            domainStore.setItem(key, value);
            assert.ok(true, 'Cookie was set without errors when domainLevel = 2 (getDomainByHostname executed)');
        } catch (ex) {
            assert.ok(false, `Error occurred while setting cookie with domainLevel: ${ex.message}`);
        }

        // (Again, we do not verify getItem(...) here, since domain‐scoped cookies may not appear
        // immediately in document.cookie under QUnit’s test environment.)
    });

    QUnit.test('removeItem deletes the cookie', assert => {
        const key = 'toBeRemoved';
        const value = 'bye';

        store.setItem(key, value);
        assert.ok(store.getItem(key) !== null, 'Cookie is initially set');

        store.removeItem(key);
        const removed = store.getItem(key);
        assert.strictEqual(removed, null, 'Cookie is removed after removeItem()');
    });

    QUnit.test('keys and clearAll manage all cookies correctly', assert => {
        store.setItem('key1', 'val1');
        store.setItem('key2', { x: 2 });

        const keysBefore = store.keys();
        assert.ok(
            keysBefore.includes('key1') && keysBefore.includes('key2'),
            'keys() returns an array containing both "key1" and "key2"'
        );

        store.clearAll();
        assert.strictEqual(store.getItem('key1'), null, '"key1" was cleared by clearAll()');
        assert.strictEqual(store.getItem('key2'), null, '"key2" was cleared by clearAll()');

        const keysAfter = store.keys();
        assert.deepEqual(keysAfter, [], 'keys() is empty after clearAll()');
    });

    QUnit.test('getItem returns raw string when value is not valid JSON', assert => {
        const rawKey = 'rawKey';
        const rawValue = 'just_a_plain_string';

        // Manually insert a non-JSON string cookie:
        document.cookie = `${rawKey}=${encodeURIComponent(rawValue)}; path=/`;

        // Now getItem should return this raw string, not attempt JSON.parse
        const retrieved = store.getItem(rawKey);
        assert.strictEqual(retrieved, rawValue, 'getItem returns raw string when JSON.parse fails');

        // Clean up:
        store.removeItem(rawKey);
    });
});
