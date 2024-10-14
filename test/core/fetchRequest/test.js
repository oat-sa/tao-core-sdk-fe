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
 * Copyright (c) 2020-21 (original work) Open Assessment Technologies SA ;
 */

define([
    'core/fetchRequest',
    'core/jwt/jwtTokenHandler',
    'fetch-mock',
    'core/error/ApiError',
    'core/error/NetworkError',
    'core/error/TimeoutError'
], (request, jwtTokenHandlerFactory, fetchMock, ApiError, NetworkError, TimeoutError) => {
    'use strict';

    // can mock url redefined
    fetchMock.config.overwriteRoutes = true;

    QUnit.module('Request', {
        beforeEach: function () {
            this.jwtTokenHandler = jwtTokenHandlerFactory({ refreshTokenUrl: '/refresh-token' });
        },
        afterEach: function (done) {
            fetchMock.restore();
            this.jwtTokenHandler.clearStore().then(done);
        }
    });

    QUnit.test('request returns with correct response', assert => {
        assert.expect(1);
        const done = assert.async();

        const mockResponse = { data: { ok: true } };
        fetchMock.mock('/foo', mockResponse);

        request('/foo').then(response => {
            assert.deepEqual(response, mockResponse);
            done();
        });
    });

    QUnit.test('request returns with correct response if success true', assert => {
        assert.expect(1);
        const done = assert.async();

        fetchMock.mock('/foo', new Response(JSON.stringify({ success: true, data: { ping: 123 } }), { status: 201 }));

        request('/foo').then(response => {
            assert.deepEqual(response.data, { ping: 123 });
            done();
        });
    });

    QUnit.test('request returns with correct response if 204 empty content', assert => {
        assert.expect(1);
        const done = assert.async();

        fetchMock.mock('/foo', new Response(null, { status: 204 }));

        request('/foo').then(response => {
            assert.equal(response, null);
            done();
        });
    });

    QUnit.test('request returns with correct response if status code is 2XX with response payload', assert => {
        assert.expect(1);
        const done = assert.async();

        fetchMock.mock('/foo', new Response(JSON.stringify({ success: true, data: { ping: 123 } }), { status: 206 }));

        request('/foo').then(response => {
            assert.deepEqual(response.data, { ping: 123 });
            done();
        });
    });

    QUnit.test('request returns with correct response if status code is 2XX with empty response payload', assert => {
        assert.expect(1);
        const done = assert.async();

        fetchMock.mock('/foo', new Response({}, { status: 202 }));

        request('/foo').then(response => {
            assert.deepEqual(response, {});
            done();
        });
    });

    QUnit.test('request returns with full original response if options.returnOriginalResponse passed', assert => {
        assert.expect(6);
        const done = assert.async();

        const payload = { success: true, data: { ping: 123 } };

        fetchMock.mock('/foo', {
            body: JSON.stringify(payload),
            status: 200
        });

        const options = { returnOriginalResponse: true };

        const expectedResponseHeaders = {
            'content-length': '36',
            'content-type': 'text/plain;charset=UTF-8'
        };

        request('/foo', options).then(response => {
            assert.ok(response.ok);
            assert.equal(response.status, 200);
            assert.equal(response.bodyUsed, false);
            // response.headers is Iterator
            for (const pair of response.headers) {
                assert.equal(expectedResponseHeaders[pair[0]], pair[1]);
            }
            response.json().then(responseData => {
                assert.deepEqual(responseData, payload);
                done();
            });
        });
    });

    QUnit.test('request returns with full original response to HEAD request if options.returnOriginalResponse passed', assert => {
        assert.expect(5);
        const done = assert.async();

        fetchMock.head('/foo', { body: '', status: 200 });

        const options = { method: 'HEAD', returnOriginalResponse: true };

        const expectedResponseHeaders = {
            'content-length': '0',
            'content-type': 'text/plain;charset=UTF-8'
        };

        request('/foo', options).then(response => {
            assert.ok(response.ok);
            assert.equal(response.status, 200);
            assert.equal(response.bodyUsed, false);
            // response.headers is Iterator
            for (const pair of response.headers) {
                assert.equal(expectedResponseHeaders[pair[0]], pair[1]);
            }
            done();
        });
    });

    QUnit.test('request returns with a correct error response', assert => {
        assert.expect(2);
        const done = assert.async();

        fetchMock.mock('/foo', 404);

        request('/foo').catch(error => {
            assert.equal(error.message, '404 : Request error');
            assert.equal(error.response.status, 404);
            done();
        });
    });

    QUnit.test('error response can be read', assert => {
        assert.expect(1);
        const done = assert.async();

        fetchMock.mock(
            '/foo',
            new Response(JSON.stringify({ success: false, errorCode: 'ABC123', errorMessage: 'Cannot trigger ABC' }), {
                status: 400
            })
        );

        request('/foo').catch(error => {
            error.response.json().then(err => {
                assert.equal(err.errorMessage, 'Cannot trigger ABC');
                done();
            });
        });
    });

    QUnit.test('request returns with a correct error response if success false', assert => {
        assert.expect(4);
        const done = assert.async();

        fetchMock.mock(
            '/foo',
            new Response(JSON.stringify({ success: false, errorCode: 'ABC123', errorMessage: 'Cannot trigger ABC' }), {
                status: 406
            })
        );

        request('/foo').catch(error => {
            assert.ok(error instanceof ApiError);
            assert.equal(error.message, 'ABC123 : Cannot trigger ABC');
            assert.equal(error.response.status, 406);
            assert.equal(error.errorCode, 'ABC123');
            done();
        });
    });

    QUnit.test('request sends an auth header', function (assert) {
        assert.expect(2);
        const done = assert.async();

        const mockResponse = { foo: 'bar' };
        const accessToken = 'someToken';
        const url = '/bar';

        fetchMock.mock(url, (uri, opts) => {
            assert.deepEqual(opts.headers, {
                Authorization: `Bearer ${accessToken}`
            });
            return mockResponse;
        });

        this.jwtTokenHandler
            .storeAccessToken(accessToken)
            .then(() => request(url, { jwtTokenHandler: this.jwtTokenHandler }))
            .then(response => {
                assert.deepEqual(response, mockResponse);
                done();
            });
    });

    QUnit.test('request refreshes the token when it does not exist', function (assert) {
        assert.expect(5);
        const done = assert.async();

        const mockResponse = { response: 2 };
        const refreshToken = 'refreshToken';
        const newAccessToken = 'newAccessToken';
        const url = '/api/request';

        fetchMock.mock('/refresh-token', (uri, opts) => {
            const data = JSON.parse(opts.body);
            assert.equal(opts.headers['Content-Type'], 'application/json');
            assert.equal(opts.method, 'POST');
            assert.deepEqual(data, { refreshToken });
            return JSON.stringify({ accessToken: newAccessToken });
        });

        fetchMock.mock(url, (uri, opts) => {
            assert.equal(opts.headers.Authorization, `Bearer ${newAccessToken}`);
            return JSON.stringify(mockResponse);
        });

        this.jwtTokenHandler
            .storeRefreshToken(refreshToken)
            .then(() => request(url, { jwtTokenHandler: this.jwtTokenHandler }))
            .then(response => {
                assert.deepEqual(response, mockResponse);
                done();
            });
    });

    QUnit.test('request refreshes the token when it is not valid', function (assert) {
        assert.expect(6);
        const done = assert.async();

        const mockResponse = { response: 2 };
        const refreshToken = 'refreshToken';
        const accessToken = 'invalidAccessToken';
        const newAccessToken = 'newAccessToken';
        const url = '/api/request';

        const setupSecondRequest = () => {
            fetchMock.mock(url, function (uri, opts) {
                assert.equal(opts.headers.Authorization, `Bearer ${newAccessToken}`);
                return JSON.stringify(mockResponse);
            });
        };

        fetchMock.mock(url, function (uri, opts) {
            assert.equal(opts.headers.Authorization, `Bearer ${accessToken}`);
            setupSecondRequest();
            return { status: 401 };
        });

        fetchMock.mock('/refresh-token', function (uri, opts) {
            const data = JSON.parse(opts.body);
            assert.equal(opts.method, 'POST');
            assert.equal(opts.headers['Content-Type'], 'application/json');
            assert.deepEqual(data, { refreshToken });
            return JSON.stringify({ accessToken: newAccessToken });
        });

        this.jwtTokenHandler
            .storeRefreshToken(refreshToken)
            .then(() => this.jwtTokenHandler.storeAccessToken(accessToken))
            .then(() => request(url, { jwtTokenHandler: this.jwtTokenHandler }))
            .then(response => {
                assert.deepEqual(response, mockResponse);
                done();
            });
    });

    QUnit.test('request returns with the correct error response if there are no tokens', function (assert) {
        assert.expect(1);
        assert.rejects(
            request('/foo', { jwtTokenHandler: this.jwtTokenHandler }),
            /Token not available and cannot be refreshed/
        );
    });

    QUnit.test(
        'request returns with the correct error response if token is not valid and cannot be refreshed',
        function (assert) {
            assert.expect(1);
            const done = assert.async();

            const accessToken = 'invalidAccessToken';

            fetchMock.mock('/', 401);

            this.jwtTokenHandler.storeAccessToken(accessToken).then(() => {
                assert.rejects(
                    request('/', { jwtTokenHandler: this.jwtTokenHandler }),
                    /Refresh token is not available/
                );
                done();
            });
        }
    );

    QUnit.test('request fails if token is refreshed and is still not valid', function (assert) {
        assert.expect(4);
        const done = assert.async();

        const refreshToken = 'refreshToken';
        const accessToken = 'invalidAccessToken';
        const newAccessToken = 'stillInvalidAccessToken';
        const url = '/api/request';

        fetchMock.mock(url, 401);
        fetchMock.mock('/refresh-token', JSON.stringify({ accessToken: newAccessToken }));

        this.jwtTokenHandler
            .storeRefreshToken(refreshToken)
            .then(() => this.jwtTokenHandler.storeAccessToken(accessToken))
            .then(() => request(url, { jwtTokenHandler: this.jwtTokenHandler }))
            .catch(error => {
                assert.ok(error instanceof NetworkError);
                assert.equal(error.message, '401 : Request error');
                assert.equal(error.response.status, 401);
                assert.equal(error.errorCode, 401);
                done();
            });
    });

    QUnit.test('request rejects if timeout reached', function (assert) {
        assert.expect(1);
        fetchMock.mock('/', new Promise(resolve => setTimeout(resolve, 2000)));

        assert.rejects(request('/', { timeout: 1000 }), TimeoutError);
    });
});
