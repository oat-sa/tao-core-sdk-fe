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
 * Copyright (c) 2019-2021 (original work) Open Assessment Technologies SA ;
 */

/**
 * @author Tamas Besenyei <tamas@taotesting.com>
 */

define(['jquery', 'core/jwt/jwtTokenHandler', 'fetch-mock'], ($, jwtTokenHandlerFactory, fetchMock) => {
    'use strict';

    QUnit.module('factory');

    QUnit.test('module', assert => {
        assert.expect(1);
        assert.ok(typeof jwtTokenHandlerFactory === 'function', 'the module exposes a function');
    });

    QUnit.test('instantiate', assert => {
        assert.expect(2);
        assert.ok(typeof jwtTokenHandlerFactory() === 'object', 'the factory produces an object');
        assert.notEqual(
            jwtTokenHandlerFactory(),
            jwtTokenHandlerFactory(),
            'the factory produces a different object at each call'
        );
    });

    QUnit.module('API', {
        beforeEach: function () {
            this.handler = jwtTokenHandlerFactory({ refreshTokenUrl: '/refreshUrl' });
        },
        afterEach: function (assert) {
            const done = assert.async();
            fetchMock.restore();
            this.handler.clearStore().then(done);
        }
    });

    QUnit.test('get service name', function (assert) {
        assert.expect(2);

        // default
        assert.strictEqual(this.handler.serviceName, 'tao', 'default service name is tao');

        const handler = jwtTokenHandlerFactory({ serviceName: 'foo' });
        assert.strictEqual(handler.serviceName, 'foo', 'return with the provided service name');
    });

    QUnit.test('get access token', function (assert) {
        assert.expect(2);

        const done = assert.async();

        const token = 'some token';

        this.handler.storeAccessToken(token).then(setResult => {
            assert.equal(setResult, true, 'token is set');

            this.handler.getToken().then(storedToken => {
                assert.equal(storedToken, token, 'get back stored access token');
                done();
            });
        });
    });

    QUnit.test('clear', function (assert) {
        assert.expect(4);

        const done = assert.async();

        Promise.all([
            this.handler.storeAccessToken('some token'),
            this.handler.storeRefreshToken('some refresh token')
        ]).then(([setAccessTokenResult, setRefreshTokenResult]) => {
            assert.equal(setAccessTokenResult, true, 'access token is set');
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

    QUnit.test('refresh token on empty store', function (assert) {
        assert.expect(1);

        assert.rejects(
            this.handler.refreshToken(),
            /Refresh token is not available/i,
            'refresh token should fail if refresh token is not set'
        );
    });

    QUnit.test('refresh token', function (assert) {
        assert.expect(4);

        const done = assert.async();

        const accessToken = 'some access token';
        const refreshToken = 'some refresh token';

        fetchMock.mock('/refreshUrl', function (url, opts) {
            const data = JSON.parse(opts.body);
            assert.equal(data.refreshToken, refreshToken, 'refresh token is sent to the api');
            return JSON.stringify({ accessToken });
        });

        this.handler.storeRefreshToken(refreshToken).then(setTokenResult => {
            assert.equal(setTokenResult, true, 'refresh token is set');
            this.handler.getToken().then(refreshedAccessToken => {
                assert.equal(refreshedAccessToken, accessToken, 'get refreshed access token');

                this.handler.getToken().then(storedAccessToken => {
                    assert.equal(storedAccessToken, accessToken, 'get access token from store without refresh');
                    done();
                });
            });
        });
    });

    QUnit.test('refresh token with parameters', function (assert) {
        assert.expect(5);

        const done = assert.async();

        const refreshTokenParameters = {
            foo: 'bar'
        };

        this.handler = jwtTokenHandlerFactory({ refreshTokenUrl: '/refreshUrl', refreshTokenParameters });

        const accessToken = 'some access token';
        const refreshToken = 'some refresh token';

        fetchMock.mock('/refreshUrl', function (url, opts) {
            const data = JSON.parse(opts.body);
            assert.equal(data.refreshToken, refreshToken, 'refresh token is sent to the api');
            assert.equal(data.foo, refreshTokenParameters.foo, 'refreshTokenParameters are sent');
            return JSON.stringify({ accessToken });
        });

        this.handler.storeRefreshToken(refreshToken).then(setTokenResult => {
            assert.equal(setTokenResult, true, 'refresh token is set');
            this.handler.getToken().then(refreshedAccessToken => {
                assert.equal(refreshedAccessToken, accessToken, 'get refreshed access token');

                this.handler.getToken().then(storedAccessToken => {
                    assert.equal(storedAccessToken, accessToken, 'get access token from store without refresh');
                    done();
                });
            });
        });
    });

    QUnit.test('unsuccessful refresh token', function (assert) {
        assert.expect(5);

        const done = assert.async();

        const error = 'some backend error';
        const refreshToken = 'some refresh token';

        fetchMock.mock('/refreshUrl', function (url, opts) {
            const data = JSON.parse(opts.body);
            assert.equal(data.refreshToken, refreshToken, 'refresh token is sent to the api');
            return new Response(JSON.stringify({ error }), { status: 401 });
        });

        this.handler.storeRefreshToken(refreshToken).then(setTokenResult => {
            assert.equal(setTokenResult, true, 'refresh token is set');
            this.handler
                .refreshToken()
                .catch(e => {
                    assert.equal(e instanceof Error, true, 'rejects with error');
                    assert.equal(e.response instanceof Response, true, 'passes response');
                    return e.response.json();
                })
                .then(errorResponse => {
                    assert.equal(errorResponse.error, error, 'should get back api error message');
                    done();
                });
        });
    });

    QUnit.test('unsuccessful get token if refresh fails', function (assert) {
        assert.expect(5);

        const done = assert.async();

        const error = 'some backend error';
        const refreshToken = 'some refresh token';

        fetchMock.mock('/refreshUrl', function (url, opts) {
            const data = JSON.parse(opts.body);
            assert.equal(data.refreshToken, refreshToken, 'refresh token is sent to the api');
            return new Response(JSON.stringify({ error }), { status: 401 });
        });

        this.handler.storeRefreshToken(refreshToken).then(setTokenResult => {
            assert.equal(setTokenResult, true, 'refresh token is set');
            this.handler
                .getToken()
                .catch(e => {
                    assert.equal(e instanceof Error, true, 'rejects with error');
                    assert.equal(e.response instanceof Response, true, 'passes response');
                    return e.response.json();
                })
                .then(errorResponse => {
                    assert.equal(errorResponse.error, error, 'should get back api error message');
                    done();
                });
        });
    });

    QUnit.module('Concurrency', {
        beforeEach: function () {
            this.handler = jwtTokenHandlerFactory({ refreshTokenUrl: '/refreshUrl' });
        },
        afterEach: function (assert) {
            const done = assert.async();
            fetchMock.restore();
            this.handler.clearStore().then(done);
        }
    });

    QUnit.test('queue get token if other get is in progress', function (assert) {
        assert.expect(4);

        const done = assert.async();

        const accessToken = 'some access token';
        const refreshToken = 'some refresh token';

        fetchMock.mock('/refreshUrl', function (url, opts) {
            const data = JSON.parse(opts.body);
            assert.equal(data.refreshToken, refreshToken, 'refresh token is sent to the api');
            return JSON.stringify({ accessToken });
        });

        this.handler.storeRefreshToken(refreshToken).then(setTokenResult => {
            assert.equal(setTokenResult, true, 'refresh token is set');

            const firstGetTokenPromise = this.handler.getToken().then(refreshedAccessToken => {
                assert.equal(refreshedAccessToken, accessToken, 'get refreshed access token');
            });

            const secondGetTokenPromise = this.handler.getToken().then(storedAccessToken => {
                assert.equal(storedAccessToken, accessToken, 'get access token from store without refresh');
            });

            Promise.all([firstGetTokenPromise, secondGetTokenPromise]).then(done);
        });
    });

    QUnit.test('queue get token if refresh token is in progress', function (assert) {
        assert.expect(4);

        const done = assert.async();

        const accessToken = 'some access token';
        const refreshToken = 'some refresh token';

        fetchMock.mock('/refreshUrl', function (url, opts) {
            const data = JSON.parse(opts.body);
            assert.equal(data.refreshToken, refreshToken, 'refresh token is sent to the api');
            return JSON.stringify({ accessToken });
        });

        this.handler.storeRefreshToken(refreshToken).then(setTokenResult => {
            assert.equal(setTokenResult, true, 'refresh token is set');

            const refreshTokenPromise = this.handler.refreshToken().then(refreshedAccessToken => {
                assert.equal(refreshedAccessToken, accessToken, 'get refreshed access token');
            });

            const getTokenPromise = this.handler.getToken().then(storedAccessToken => {
                assert.equal(storedAccessToken, accessToken, 'get access token from store without refresh');
            });

            Promise.all([refreshTokenPromise, getTokenPromise]).then(done);
        });
    });

    QUnit.test('queue refresh token if another refresh token is in progress', function (assert) {
        assert.expect(5);

        const done = assert.async();

        const accessToken1 = 'some access token 1';
        const accessToken2 = 'some access token 2';
        const refreshToken = 'some refresh token';

        const setupSecondRequest = () => {
            fetchMock.restore();
            fetchMock.mock('/refreshUrl', function (url, opts) {
                const data = JSON.parse(opts.body);
                assert.equal(data.refreshToken, refreshToken, 'refresh token is sent to the api');
                return JSON.stringify({ accessToken: accessToken2 });
            });
        };

        fetchMock.mock('/refreshUrl', function (url, opts) {
            const data = JSON.parse(opts.body);
            assert.equal(data.refreshToken, refreshToken, 'refresh token is sent to the api');
            setupSecondRequest();
            return JSON.stringify({ accessToken: accessToken1 });
        });

        this.handler.storeRefreshToken(refreshToken).then(setTokenResult => {
            assert.equal(setTokenResult, true, 'refresh token is set');

            const refreshTokenPromise1 = this.handler.refreshToken().then(refreshedAccessToken => {
                assert.equal(refreshedAccessToken, accessToken1, 'get refreshed access token');
            });

            const refreshTokenPromise2 = this.handler.refreshToken().then(storedAccessToken => {
                assert.equal(storedAccessToken, accessToken2, 'get access token from store without refresh');
            });

            Promise.all([refreshTokenPromise1, refreshTokenPromise2]).then(done);
        });
    });

    QUnit.module('useCredential', {
        beforeEach: function () {
            this.handler = jwtTokenHandlerFactory({ refreshTokenUrl: '/refreshUrl', useCredentials: true });
        },
        afterEach: function (assert) {
            const done = assert.async();
            fetchMock.restore();
            this.handler.clearStore().then(done);
        }
    });

    QUnit.test('refresh token', function (assert) {
        assert.expect(4);

        const done = assert.async();

        const accessToken = 'some access token';

        fetchMock.mock('/refreshUrl', function (url, opts) {
            assert.equal(opts.credentials, 'include', 'credentials are sent to the api');
            assert.equal(typeof opts.body, 'undefined', 'body is undefined');
            return JSON.stringify({ accessToken });
        });

        this.handler.getToken().then(refreshedAccessToken => {
            assert.equal(refreshedAccessToken, accessToken, 'get refreshed access token');

            this.handler.getToken().then(storedAccessToken => {
                assert.equal(storedAccessToken, accessToken, 'get access token from store without refresh');
                done();
            });
        });
    });

    QUnit.test('refresh token with parameters', function (assert) {
        assert.expect(4);

        const done = assert.async();

        const refreshTokenParameters = {
            deliveryExecutionId: 'abc-123-def'
        };

        this.handler = jwtTokenHandlerFactory({
            refreshTokenUrl: '/refreshUrl',
            useCredentials: true,
            refreshTokenParameters
        });

        const accessToken = 'some access token';

        fetchMock.mock('/refreshUrl', function (url, opts) {
            const data = JSON.parse(opts.body);
            assert.equal(opts.credentials, 'include', 'credentials are sent to the api');
            assert.equal(
                data.deliveryExecutionId,
                refreshTokenParameters.deliveryExecutionId,
                'refreshTokenParameters are sent'
            );
            return JSON.stringify({ accessToken });
        });

        this.handler.getToken().then(refreshedAccessToken => {
            assert.equal(refreshedAccessToken, accessToken, 'get refreshed access token');

            this.handler.getToken().then(storedAccessToken => {
                assert.equal(storedAccessToken, accessToken, 'get access token from store without refresh');
                done();
            });
        });
    });

    QUnit.test('cannot set refresh token', function (assert) {
        assert.expect(1);

        const done = assert.async();

        this.handler.storeRefreshToken('refreshToken').then(setTokenResult => {
            assert.equal(setTokenResult, false, 'refresh token is not set');
            done();
        });
    });

    QUnit.module('TTL', {
        beforeEach: function () {
            this.handler = jwtTokenHandlerFactory({ refreshTokenUrl: '/refreshUrl', accessTokenTTL: 500 });
        },
        afterEach: function (assert) {
            const done = assert.async();
            fetchMock.restore();
            this.handler.clearStore().then(done);
        }
    });

    QUnit.test('get accessToken with TTL', function (assert) {
        assert.expect(4);

        const done = assert.async();

        const accessToken = 'some access token';
        const refreshToken = 'some refresh token';
        const refreshedAccessToken = 'some new access token';

        fetchMock.mock('/refreshUrl', function (url, opts) {
            const data = JSON.parse(opts.body);
            assert.equal(data.refreshToken, refreshToken, 'refresh token is sent to the api');
            return JSON.stringify({ accessToken: refreshedAccessToken });
        });

        Promise.all([this.handler.storeRefreshToken(refreshToken), this.handler.storeAccessToken(accessToken)]).then(
            setTokenResults => {
                assert.deepEqual(setTokenResults, [true, true], 'tokens are set');
                this.handler
                    .getToken()
                    .then(storedAccessToken => {
                        assert.equal(storedAccessToken, accessToken, 'get same accessToken before TTL');
                        return new Promise(resolve => setTimeout(resolve, 500));
                    })
                    .then(this.handler.getToken)
                    .then(storedAccessToken => {
                        assert.equal(storedAccessToken, refreshedAccessToken, 'token will be refreshed after ttl');
                        done();
                    });
            }
        );
    });

    QUnit.test('set accessTokenTTL after initialization of store', function (assert) {
        assert.expect(4);

        const done = assert.async();

        const accessToken = 'some access token';
        const refreshToken = 'some refresh token';
        const refreshedAccessToken = 'some new access token';

        fetchMock.mock('/refreshUrl', function (url, opts) {
            const data = JSON.parse(opts.body);
            assert.equal(data.refreshToken, refreshToken, 'refresh token is sent to the api');
            return JSON.stringify({ accessToken: refreshedAccessToken });
        });

        Promise.all([this.handler.storeRefreshToken(refreshToken), this.handler.storeAccessToken(accessToken)]).then(
            setTokenResults => {
                assert.deepEqual(setTokenResults, [true, true], 'tokens are set');
                this.handler
                    .getToken()
                    .then(storedAccessToken => {
                        assert.equal(storedAccessToken, accessToken, 'get same accessToken before TTL');
                        this.handler.setAccessTokenTTL(100);
                        return new Promise(resolve => setTimeout(resolve, 100));
                    })
                    .then(this.handler.getToken)
                    .then(storedAccessToken => {
                        assert.equal(storedAccessToken, refreshedAccessToken, 'token will be refreshed after ttl');
                        done();
                    });
            }
        );
    });
});
