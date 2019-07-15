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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * @author Tamas Besenyei <tamas@taotesting.com>
 */

define(['core/bearerTokenHandler', 'core/request'], (bearerTokenHandlerFactory, mockedRequest) => {
    'use strict';

    QUnit.module('factory');

    QUnit.test('module', assert => {
        assert.expect(1);
        assert.ok(typeof bearerTokenHandlerFactory === 'function', 'the module exposes a function');
    });

    QUnit.test('instantiate', assert => {
        assert.expect(2);
        assert.ok(typeof bearerTokenHandlerFactory() === 'object', 'the factory produces an object');
        assert.notEqual(
            bearerTokenHandlerFactory(),
            bearerTokenHandlerFactory(),
            'the factory produces a different object at each call'
        );
    });

    QUnit.module('API', {
        beforeEach: function() {
            this.handler = bearerTokenHandlerFactory({ refreshTokenUrl: 'refreshUrl' });
        },
        afterEach: function() {
            this.handler.clearStore();
            mockedRequest.reset();
        }
    });

    QUnit.test('get bearer token', function(assert) {
        assert.expect(2);

        const done = assert.async();

        const token = 'some token';

        this.handler.storeBearerToken(token).then(setResult => {
            assert.equal(setResult, true, 'token is set');

            this.handler.getToken().then(storedToken => {
                assert.equal(storedToken, token, 'get back stored bearer token');
                done();
            });
        });
    });

    QUnit.test('clear', function(assert) {
        assert.expect(4);

        const done = assert.async();

        Promise.all([
            this.handler.storeBearerToken('some token'),
            this.handler.storeRefreshToken('some refresh token')
        ]).then(([setBearerTokenResult, setRefreshTokenResult]) => {
            assert.equal(setBearerTokenResult, true, 'token is set');
            assert.equal(setRefreshTokenResult, true, 'refresh token is set');
            this.handler.clearStore().then(clearResult => {
                assert.equal(clearResult, true, 'store cleared successfully');
                assert.rejects(
                    this.handler.getToken(),
                    /Token not available and cannot be refreshed/i,
                    'get token fails if store is empty'
                );
                done();
            });
        });
    });

    QUnit.test('refresh token on empty store', function(assert) {
        assert.expect(1);

        assert.rejects(
            this.handler.refreshToken(),
            /Refresh token is not available/i,
            'refresh token should fail if refresh token is not set'
        );
    });

    QUnit.test('refresh token', function(assert) {
        assert.expect(3);

        const done = assert.async();

        const bearerToken = 'some bearer token';
        const refreshToken = 'some refresh token';

        mockedRequest.setup({
            refreshUrl: request => {
                const data = JSON.parse(request.data);
                assert.equal(data.refreshToken, refreshToken, 'refresh token is sent to the api');
                return new Promise(resolve => {
                    setTimeout(resolve({ accessToken: bearerToken }), 100);
                });
            }
        });

        this.handler.storeRefreshToken(refreshToken).then(setTokenResult => {
            assert.equal(setTokenResult, true, 'refresh token is set');
            this.handler.getToken().then(storedBearerToken => {
                assert.equal(storedBearerToken, bearerToken, 'get refreshed bearer token');
                done();
            });
        });
    });
});
