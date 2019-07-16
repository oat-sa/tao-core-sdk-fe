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

define(['jquery', 'core/bearerTokenHandler', 'jquery.mockjax'], ($, bearerTokenHandlerFactory) => {
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

    // prevent the AJAX mocks to pollute the logs
    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    QUnit.module('API', {
        beforeEach: function() {
            this.handler = bearerTokenHandlerFactory({ refreshTokenUrl: '//refreshUrl' });
        },
        afterEach: function() {
            this.handler.clearStore();
            $.mockjax.clear();
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
        assert.expect(4);

        const done = assert.async();

        const bearerToken = 'some bearer token';
        const refreshToken = 'some refresh token';

        $.mockjax([
            {
                url: /^\/\/refreshUrl$/,
                status: 200,
                response: function(request) {
                    const data = JSON.parse(request.data);
                    assert.equal(data.refreshToken, refreshToken, 'refresh token is sent to the api');
                    this.responseText = JSON.stringify({ accessToken: bearerToken });
                }
            }
        ]);

        this.handler.storeRefreshToken(refreshToken).then(setTokenResult => {
            assert.equal(setTokenResult, true, 'refresh token is set');
            this.handler.getToken().then(refreshedBearerToken => {
                assert.equal(refreshedBearerToken, bearerToken, 'get refreshed bearer token');

                this.handler.getToken().then(storedBearerToken => {
                    assert.equal(storedBearerToken, bearerToken, 'get bearer token from store without refresh');
                    done();
                });
            });
        });
    });

    QUnit.module('Concurrency', {
        beforeEach: function() {
            this.handler = bearerTokenHandlerFactory({ refreshTokenUrl: '//refreshUrl' });
        },
        afterEach: function() {
            this.handler.clearStore();
            $.mockjax.clear();
        }
    });

    QUnit.test('queue get token if other get is in progress', function(assert) {
        assert.expect(4);

        const done = assert.async();

        const bearerToken = 'some bearer token';
        const refreshToken = 'some refresh token';

        $.mockjax([
            {
                url: /^\/\/refreshUrl$/,
                status: 200,
                response: function(request) {
                    const data = JSON.parse(request.data);
                    assert.equal(data.refreshToken, refreshToken, 'refresh token is sent to the api');
                    this.responseText = JSON.stringify({ accessToken: bearerToken });
                }
            }
        ]);

        this.handler.storeRefreshToken(refreshToken).then(setTokenResult => {
            assert.equal(setTokenResult, true, 'refresh token is set');

            const firstGetTokenPromise = this.handler.getToken().then(refreshedBearerToken => {
                assert.equal(refreshedBearerToken, bearerToken, 'get refreshed bearer token');
            });

            const secondGetTokenPromise = this.handler.getToken().then(storedBearerToken => {
                assert.equal(storedBearerToken, bearerToken, 'get bearer token from store without refresh');
            });

            Promise.all([firstGetTokenPromise, secondGetTokenPromise]).then(done);
        });
    });

    QUnit.test('queue get token if refresh token is in progress', function(assert) {
        assert.expect(4);

        const done = assert.async();

        const bearerToken = 'some bearer token';
        const refreshToken = 'some refresh token';

        $.mockjax([
            {
                url: /^\/\/refreshUrl$/,
                status: 200,
                response: function(request) {
                    const data = JSON.parse(request.data);
                    assert.equal(data.refreshToken, refreshToken, 'refresh token is sent to the api');
                    this.responseText = JSON.stringify({ accessToken: bearerToken });
                }
            }
        ]);

        this.handler.storeRefreshToken(refreshToken).then(setTokenResult => {
            assert.equal(setTokenResult, true, 'refresh token is set');

            const refreshTokenPromise = this.handler.refreshToken().then(refreshedBearerToken => {
                assert.equal(refreshedBearerToken, bearerToken, 'get refreshed bearer token');
            });

            const getTokenPromise = this.handler.getToken().then(storedBearerToken => {
                assert.equal(storedBearerToken, bearerToken, 'get bearer token from store without refresh');
            });

            Promise.all([refreshTokenPromise, getTokenPromise]).then(done);
        });
    });

    QUnit.test('queue refresh token if another refresh token is in progress', function(assert) {
        assert.expect(5);

        const done = assert.async();

        const bearerToken1 = 'some bearer token 1';
        const bearerToken2 = 'some bearer token 2';
        const refreshToken = 'some refresh token';

        const setupSecondRequest = () => {
            $.mockjax.clear();
            $.mockjax([
                {
                    url: /^\/\/refreshUrl$/,
                    status: 200,
                    response: function(request) {
                        const data = JSON.parse(request.data);
                        assert.equal(data.refreshToken, refreshToken, 'refresh token is sent to the api');
                        this.responseText = JSON.stringify({ accessToken: bearerToken2 });
                        setupSecondRequest();
                    }
                }
            ]);
        };

        $.mockjax([
            {
                url: /^\/\/refreshUrl$/,
                status: 200,
                response: function(request) {
                    const data = JSON.parse(request.data);
                    assert.equal(data.refreshToken, refreshToken, 'refresh token is sent to the api');
                    this.responseText = JSON.stringify({ accessToken: bearerToken1 });
                    setupSecondRequest();
                }
            }
        ]);

        this.handler.storeRefreshToken(refreshToken).then(setTokenResult => {
            assert.equal(setTokenResult, true, 'refresh token is set');

            const refreshTokenPromise1 = this.handler.refreshToken().then(refreshedBearerToken => {
                assert.equal(refreshedBearerToken, bearerToken1, 'get refreshed bearer token');
            });

            const refreshTokenPromise2 = this.handler.refreshToken().then(storedBearerToken => {
                assert.equal(storedBearerToken, bearerToken2, 'get bearer token from store without refresh');
            });

            Promise.all([refreshTokenPromise1, refreshTokenPromise2]).then(done);
        });
    });
});
