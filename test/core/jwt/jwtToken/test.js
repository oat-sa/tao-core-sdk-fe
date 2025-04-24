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
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA ;
 */

define(['core/jwt/jwtToken'], jwtToken => {
    'use strict';

    const { parseJwtPayload, getJwtTTL } = jwtToken;

    QUnit.module('factory');

    QUnit.test('module', assert => {
        assert.expect(2);
        assert.ok(typeof parseJwtPayload === 'function', 'the module exposes a parseJwtPayload function');
        assert.ok(typeof getJwtTTL === 'function', 'the module exposes a getJwtTTL function');
    });

    QUnit.module('parseJwtPayload');

    QUnit.test('parses payload object from full token', assert => {
        assert.expect(4);
        const token =
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2MjA2NTM1NDgsImV4cCI6MTYyMDY1NDc2MiwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoiIn0.3j-2RN4OVgDYUVxP9VIaOnpkno8I4LDDzouSzgAdUsw';
        const result = parseJwtPayload(token);
        assert.ok(typeof result === 'object', 'parsed payload is an object');
        assert.equal(result.iat, 1620653548, 'iat correctly parsed');
        assert.equal(result.exp, 1620654762, 'exp correctly parsed');
        assert.equal(result.aud, 'www.example.com', 'aud correctly parsed');
    });

    QUnit.test('parses payload object from full token with non-ASCII characters ❤️ ñ å ę 🔥', assert => {
        assert.expect(4);
        const token =
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpw7FlIEpXVCBCdWlsZGVyIOKdpO-4j_CflKUiLCJpYXQiOjE2MjA2NTM1NDgsImV4cCI6MTYyMDY1NDc2MiwiYXVkIjoid3d3LsSZeMOlbXBsZS5jb20iLCJzdWIiOiIifQ.g9h9kvy39vauIwM4S2i8jSuG0uRIVq0XpH9glMPoxN8';
        const result = parseJwtPayload(token);
        assert.ok(typeof result === 'object', 'parsed payload is an object');
        assert.equal(result.iss, 'Onliñe JWT Builder ❤️🔥', 'iat correctly parsed');
        assert.equal(result.aud, 'www.ęxåmple.com', 'aud correctly parsed');
    });

    QUnit.test('returns null for bad or missing token', assert => {
        assert.expect(2);
        const badtoken = 'xxxxx.yyyyy.zzzzz';
        assert.equal(parseJwtPayload(badtoken), null, 'invalid token returns null');
        assert.equal(parseJwtPayload(), null, 'missing token returns null');
    });

    QUnit.test('parses payload object from full token with unsupported characters', assert => {
        assert.expect(2);
        const token = 'eyJhbGciOiJIUzI1NiJ9.eyJmb28iOiI_In0.qXbg9lEnmvDekuDfNqiAdqYb3Yx1iTLw7RyUGoz5I9w';
        const result = parseJwtPayload(token);
        assert.ok(typeof result === 'object', 'parsed payload is an object');
        assert.equal(result.foo, '?');
    });

    QUnit.module('getJwtTTL');

    const time1 = 1620651921250;
    const time2 = 1620651922000;
    const jwtPayload1 = { iat: time1, exp: time2 }; // 750 seconds apart
    const jwtPayload2 = { iat: time1 };
    const jwtPayload3 = { exp: time2 };

    QUnit.cases
        .init([
            { payload: jwtPayload1, expectedTTL: 750000 },
            { payload: jwtPayload2, expectedTTL: null },
            { payload: jwtPayload3, expectedTTL: null },
            { payload: void 0, expectedTTL: null }
        ])
        .test('returns correct TTL', function (data, assert) {
            assert.expect(1);
            assert.equal(getJwtTTL(data.payload, data.defaultTTL), data.expectedTTL, JSON.stringify(data));
        });
});
