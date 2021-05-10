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
        const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2MjA2NTM1NDgsImV4cCI6MTYyMDY1NDc2MiwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoiIn0.3j-2RN4OVgDYUVxP9VIaOnpkno8I4LDDzouSzgAdUsw';
        const result = parseJwtPayload(token);
        assert.ok(typeof result === 'object');
        assert.equal(result.iat, 1620653548);
        assert.equal(result.exp, 1620654762);
        assert.equal(result.aud, 'www.example.com', 'audience correctly parsed');
    });


    QUnit.module('getJwtTTL');

    const time1 = 1620651921250;
    const time2 = 1620651922000;
    const jwtPayload1 = { iat: time1, exp: time2 };
    const jwtPayload2 = { exp: time2 };

    QUnit.cases.init([
        { payload: jwtPayload1, defaultTTL: void 0, latency: void 0, expectedTTL: 740000 },
        { payload: jwtPayload1, defaultTTL: void 0, latency: 10000, expectedTTL: 740000 },
        { payload: jwtPayload1, defaultTTL: void 0, latency: 20000, expectedTTL: 730000 },
        { payload: jwtPayload2, defaultTTL: void 0, latency: void 0, expectedTTL: 490000 },
        { payload: jwtPayload2, defaultTTL: void 0, latency: 10000, expectedTTL: 490000 },
        { payload: jwtPayload2, defaultTTL: void 0, latency: 20000, expectedTTL: 480000 },
        { payload: jwtPayload2, defaultTTL: 300000, latency: void 0, expectedTTL: 290000 },
        { payload: jwtPayload2, defaultTTL: 300000, latency: 100000, expectedTTL: 200000 },
        { payload: null, defaultTTL: 300000, latency: void 0, expectedTTL: 290000 },
    ]).test('returns correct TTL', function(data, assert) {
        assert.expect(1);
        assert.equal(getJwtTTL(data.payload, data.defaultTTL, data.latency), data.expectedTTL, JSON.stringify(data));
    });
});
