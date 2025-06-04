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

    // The AMD bundle may export { default: function } or the function itself.
    const cookieStorage = cookieStorageModule.default || cookieStorageModule;

    // Bind “private” helpers so that `this` points at cookieStorage inside them.
    const pickDomain = cookieStorage._pickDomain.bind(cookieStorage);
    const normalizeExpires = cookieStorage._normalizeExpires.bind(cookieStorage);
    const buildOptionString = cookieStorage._buildOptionString.bind(cookieStorage);

    QUnit.module('cookieStorage (complete coverage)', {
        beforeEach() {
            // Wipe any cookies that our tests might create.
            ['testKey', 'dateKey', 'isoKey', 'removeKey', 'key1', 'key2', 'rawKey'].forEach(name => {
                // We call without extra opts; removeItem will default to path='/' and no domain.
                cookieStorage.removeItem(name);
            });
        }
    });

    QUnit.test('_normalizeExpires: with a Date instance', assert => {
        const base = new Date(2025, 0, 1, 0, 0, 0);
        const result = normalizeExpires(base);
        assert.ok(result instanceof Date, 'Result must be a Date');
        assert.strictEqual(
            result.valueOf(),
            base.valueOf(),
            'If passed a Date instance, the same timestamp is returned'
        );
    });

    QUnit.test('_normalizeExpires: with an ISO‐string / timestamp', assert => {
        // Give an ISO string
        const isoString = '2030-12-31T23:59:59Z';
        const fromIso = normalizeExpires(isoString);
        assert.ok(fromIso instanceof Date, 'ISO string → a Date');
        assert.strictEqual(
            fromIso.toISOString(),
            new Date(isoString).toISOString(),
            'Parsed ISO string yields exact same Date'
        );

        // Give a numeric timestamp (milliseconds)
        const nowMs = Date.now();
        const future = nowMs + 1000 * 60 * 60 * 24;
        const fromNum = normalizeExpires(future);
        assert.ok(fromNum instanceof Date, 'Numeric timestamp → a Date');
        assert.strictEqual(
            fromNum.valueOf(),
            new Date(future).valueOf(),
            'Parsed numeric timestamp yields correct Date'
        );
    });

    QUnit.test('_normalizeExpires: with no argument or null → “10 years from now”', assert => {
        // Immediately before calling:
        const before = new Date();
        // If we pass nothing, it should default to now + 10 years
        const result = normalizeExpires(undefined);
        const after = new Date();

        assert.ok(result instanceof Date, 'Missing argument → still returns a Date');
        // Check year difference of exactly 10. We allow a one‐millisecond difference on boundary.
        const expectedYear = new Date().getFullYear() + 10;
        assert.strictEqual(result.getFullYear(), expectedYear, 'Year is 10 years ahead');
        // Ensure it’s ≥ (before + 10 years) and ≤ (after + 10 years + a few ms)
        const minAllowed = new Date(before.setFullYear(before.getFullYear() + 10)).valueOf();
        const maxAllowed = new Date(after.setFullYear(after.getFullYear() + 10)).valueOf() + 5;

        assert.ok(
            result.valueOf() >= minAllowed && result.valueOf() <= maxAllowed,
            'Timestamp sits between (before +10y) and (after +10y + small)'
        );
    });

    QUnit.test('_pickDomain: returns last N hostname segments or null if fewer segments than requested', assert => {
        // We do not override window.location.hostname; just test logic on the existing hostname.
        const hostname = window.location.hostname || 'localhost';
        const parts = hostname.split('.');
        // If we ask for level = parts.length, we should get the full hostname back.
        const full = pickDomain(parts.length);
        assert.strictEqual(
            full,
            parts.slice(-parts.length).join('.'),
            'Asking for exactly all segments returns the entire hostname'
        );

        // If we ask for level = 1, we get only the last segment
        const oneSeg = pickDomain(1);
        assert.strictEqual(oneSeg, parts.slice(-1)[0], 'Asking for one segment yields the last piece');

        // If we ask for a level larger than the number of segments, we get null
        const tooMany = pickDomain(parts.length + 1);
        assert.strictEqual(tooMany, null, 'level > number of parts yields null');
    });

    QUnit.test(
        '_buildOptionString: default (empty opts) → must at least include path="/" and an expires= string',
        assert => {
            // Call with no opts object
            const str = buildOptionString();
            assert.ok(str.includes('; path=/'), 'Default opts include path=/');
            assert.ok(str.match(/; expires=.* GMT/), 'Default opts include a valid expires=… GMT');
            // Domain is omitted, so there should be no “; domain=” substring
            assert.notOk(str.includes('; domain='), 'No domain= substring when domainLevel is not provided');
        }
    );

    QUnit.test('_buildOptionString: with path + domainLevel + ISO expires', assert => {
        // Whenever you call buildOptionString with domainLevel=1, that tries to pick
        // exactly the last hostname segment (e.g. “localhost” in a typical QUnit runner).
        const futureIso = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
        const opts = {
            path: '/foo',
            domainLevel: 1,
            expires: futureIso
        };
        const str = buildOptionString(opts);

        assert.ok(str.includes(`; path=/foo`), 'Includes the custom path=/foo');
        // Because we asked for domainLevel=1, it should embed “; domain=…” with exactly the last hostname segment
        const lastSegment = hostname => hostname.split('.').slice(-1)[0];
        const expectedDomain = lastSegment(window.location.hostname);
        assert.ok(
            str.includes(`; domain=${expectedDomain}`),
            `Includes the domain= part (last hostname segment = ${expectedDomain})`
        );
        // And the expires part should match exactly the toUTCString of the “futureIso”
        const expectedExpires = new Date(futureIso).toUTCString();
        assert.ok(str.includes(`; expires=${expectedExpires}`), `Includes the expires part "${expectedExpires}"`);
    });

    QUnit.test('getItem/setItem: round‐trip JSON‐serializable values', assert => {
        const key = 'testKey';
        const value = { a: 1, b: 'hello' };

        cookieStorage.setItem(key, value);
        const retrieved = cookieStorage.getItem(key);

        assert.deepEqual(retrieved, value, 'Storing an object and retrieving it returns the same object');
    });

    QUnit.test('getItem: returns raw string if cookie value is not JSON', assert => {
        const key = 'rawKey';
        const plainVal = 'just_plain';
        // Manually insert a plain‐string cookie (no JSON.stringify)
        document.cookie = `${key}=${encodeURIComponent(plainVal)}; path=/`;
        const retrieved = cookieStorage.getItem(key);
        assert.strictEqual(retrieved, plainVal, 'If JSON.parse fails, getItem returns the raw string');
        // Clean up
        cookieStorage.removeItem(key);
    });

    QUnit.test('removeItem: deleting a cookie makes getItem return null', assert => {
        const key = 'removeKey';
        const val = 'to_be_deleted';

        cookieStorage.setItem(key, val);
        assert.ok(cookieStorage.getItem(key) !== null, 'Cookie was initially set');

        cookieStorage.removeItem(key);
        const afterRemove = cookieStorage.getItem(key);
        assert.strictEqual(afterRemove, null, 'After removeItem, getItem yields null');
    });

    QUnit.test('keys() and clearAll(): enumerates and clears all cookies', assert => {
        cookieStorage.setItem('key1', 'val1');
        cookieStorage.setItem('key2', { x: 2 });

        const beforeKeys = cookieStorage.keys();
        assert.ok(
            beforeKeys.includes('key1') && beforeKeys.includes('key2'),
            'keys() returns all currently set cookie names'
        );

        cookieStorage.clearAll();
        assert.strictEqual(cookieStorage.getItem('key1'), null, 'key1 was cleared');
        assert.strictEqual(cookieStorage.getItem('key2'), null, 'key2 was cleared');

        const afterKeys = cookieStorage.keys();
        assert.deepEqual(afterKeys, [], 'keys() returns [] after clearAll()');
    });
});
