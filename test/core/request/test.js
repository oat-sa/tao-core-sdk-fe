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
 * Test the module core/request
 *
 * @author Martin Nicholson <martin@taotesting.com>
 */
define(['jquery', 'lodash', 'core/request', 'core/promise', 'core/tokenHandler', 'jquery.mockjax'], function(
    $,
    _,
    request,
    Promise,
    tokenHandlerFactory
) {
    'use strict';

    var errors;
    var responses = {
        '//200': [
            {
                success: true,
                data: { foo: 'bar' }
            },
            'OK',
            {
                status: 200
            }
        ],

        '//200/error/1': [
            {
                success: false,
                errorCode: 1,
                errorMessage: 'oops'
            },
            'OK',
            {
                status: 200
            }
        ],

        '//200/error/2': [
            {
                success: false,
                errorCode: 2,
                errorMsg: 'woops'
            },
            'OK',
            {
                status: 200
            }
        ],

        '//200/error/fallback': [
            {
                success: false
            },
            'OK',
            {
                status: 200
            }
        ],
        '//202': [
            {
                success: false
            },
            'Accepted',
            {
                status: 202
            }
        ],

        '//403': [
            {
                success: false,
                errorCode: 403,
                errorMsg: 'Authentication Error'
            },
            'Error',
            {
                status: 403
            }
        ],

        '//500': [
            {
                success: false,
                errorCode: 500,
                errorMsg: 'Internal Server Error'
            },
            'Error',
            {
                status: 500
            }
        ],

        '//204': [null, 'No Content', { status: 204 }]
    };

    var standardMockResponse = function(settings, caseData, context) {
        var response = _.cloneDeep(responses[settings.url][0]);
        var content;
        if (response) {
            content = response.data || {};
            if (caseData.headers) {
                content.requestHeaders = settings.headers;
            }
            if (response.success === false) {
                context.responseText = JSON.stringify(response);
            } else {
                context.responseText = JSON.stringify({
                    success: true,
                    content: content
                });
            }
        }
    };

    QUnit.module('API');

    QUnit.test('module', function(assert) {
        assert.expect(1);

        assert.equal(typeof request, 'function', 'The module exposes a function');
    });

    // prevent the AJAX mocks to pollute the logs
    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    // restore AJAX method after each test
    QUnit.testDone(function() {
        $.mockjax.clear();
    });

    QUnit.module('request');

    QUnit.test('bad request call: no url', function(assert) {
        var caseData = {
            err: new TypeError('At least give a URL...')
        };

        assert.expect(1);

        assert.throws(
            function() {
                request(caseData);
            },
            caseData.err,
            'The correct error is thrown 1'
        );
    });

    QUnit.cases
        .init([
            {
                title: '200 got content',
                url: '//200',
                noToken: true,
                content: { foo: 'bar' }
            },
            {
                title: '200 with custom header',
                url: '//200',
                headers: { 'x-foo': 'bar' },
                noToken: true,
                content: { foo: 'bar', requestHeaders: { 'x-foo': 'bar' } }
            }
        ])
        .test('tokenless request with ', function(caseData, assert) {
            var ready = assert.async();
            var tokenHandler = tokenHandlerFactory();

            // mock the endpoints:
            $.mockjax([
                {
                    url: /^\/\/200.*$/,
                    status: 200,
                    response: function(settings) {
                        return standardMockResponse(settings, caseData, this);
                    }
                }
            ]);

            tokenHandler
                .clearStore()
                .then(function() {
                    return tokenHandler.setToken('token1');
                })
                .then(function() {
                    var result = request(caseData);

                    assert.expect(2);

                    assert.ok(result instanceof Promise, 'The request function returns a promise');

                    result
                        .then(function(response) {
                            assert.deepEqual(response.content, caseData.content, 'The given result is correct');

                            ready();
                        })
                        .catch(function() {
                            assert.ok(false, 'Should not reject');
                            ready();
                        });
                });
        });

    QUnit.cases
        .init([
            {
                title: '200 got content',
                url: '//200',
                content: { foo: 'bar' }
            },
            {
                title: '200 with custom header',
                url: '//200',
                headers: { 'x-foo': 'bar' },
                content: { foo: 'bar', requestHeaders: { 'x-foo': 'bar', 'X-CSRF-Token': 'token1' } }
            }
        ])
        .test('tokenised request with ', function(caseData, assert) {
            var ready = assert.async();
            var tokenHandler = tokenHandlerFactory();

            // mock the endpoints:
            $.mockjax([
                {
                    url: /^\/\/200.*$/,
                    status: 200,
                    headers: {
                        // respond with:
                        'X-CSRF-Token': 'token2'
                    },
                    response: function(settings) {
                        return standardMockResponse(settings, caseData, this);
                    }
                }
            ]);

            tokenHandler
                .clearStore()
                .then(function() {
                    return tokenHandler.setToken('token1');
                })
                .then(function() {
                    var result = request(caseData);

                    assert.expect(3);

                    assert.ok(result instanceof Promise, 'The request function returns a promise');

                    result
                        .then(function(response) {
                            assert.deepEqual(response.content, caseData.content, 'The given result is correct');

                            tokenHandler.getToken().then(function(storedToken) {
                                assert.equal(storedToken, 'token2', 'The token was updated with the next in sequence');
                                ready();
                            });
                        })
                        .catch(function() {
                            assert.ok(false, 'Should not reject');
                            ready();
                        });
                });
        });

    QUnit.test('tokenised request with multiple tokens available', function(assert) {
        var data = {
            url: '//200',
            content: { foo: 'bar' }
        };

        var ready = assert.async();
        var tokenHandler = tokenHandlerFactory();

        // mock the endpoints:
        $.mockjax([
            {
                url: /^\/\/200.*$/,
                status: 200,
                headers: {
                    // respond with:
                    'X-CSRF-Token': 'token3'
                },
                response: function(settings) {
                    return standardMockResponse(settings, data, this);
                }
            }
        ]);

        tokenHandler
            .clearStore()
            .then(function() {
                return tokenHandler.setToken('token1');
            })
            .then(function() {
                return tokenHandler.setToken('token2');
            })
            .then(function() {
                var result = request(data);

                assert.expect(2);

                assert.ok(result instanceof Promise, 'The request function returns a promise');

                result
                    .then(function() {
                        tokenHandler.getToken().then(function(storedToken) {
                            assert.equal(storedToken, 'token2', 'The next token is the second original token');
                            ready();
                        });
                    })
                    .catch(function() {
                        assert.ok(false, 'Should not reject');
                        ready();
                    });
            });
    });

    QUnit.test('empty response [204]', function(assert) {
        var data = {
            title: '204 no content',
            url: '//204'
        };

        var ready = assert.async();
        var tokenHandler = tokenHandlerFactory();

        // mock the endpoints:
        $.mockjax([
            {
                url: '//204',
                status: 204,
                headers: {
                    'X-CSRF-Token': 'token2'
                }
            }
        ]);

        tokenHandler
            .clearStore()
            .then(function() {
                return tokenHandler.setToken('token1');
            })
            .then(function() {
                var result = request(data);

                assert.expect(2);

                assert.ok(result instanceof Promise, 'The request function returns a promise');

                result
                    .then(function(response) {
                        if (_.isUndefined(data.content)) {
                            assert.ok(_.isUndefined(response), 'No content encountered in empty response');
                        }
                        ready();
                    })
                    .catch(function() {
                        assert.ok(false, 'Should not reject');
                        ready();
                    });
            });
    });

    QUnit.cases
        .init([
            {
                title: '500 error',
                url: '//500',
                reject: true,
                err: new Error('500 : Server Error')
            },
            {
                title: 'disconnected',
                url: '//offline',
                reject: true,
                err: new Error('0 : timeout'),
                reuseToken: true
            }

        ])
        .test('request failure with ', function(caseData, assert) {
            var ready = assert.async();
            var tokenHandler = tokenHandlerFactory();

            // mock the endpoints:
            $.mockjax([
                {
                    url: '//500',
                    status: 500,
                    statusText: 'Server Error'
                },
                {
                    url: '//offline',
                    status: 0,
                    responseTime: 100,
                    isTimeout: true
                }
            ]);

            tokenHandler
                .clearStore()
                .then(function() {
                    return tokenHandler.setToken('token1');
                })
                .then(function() {
                    var result = request(caseData);

                    assert.expect(4);

                    assert.ok(result instanceof Promise, 'The request function returns a promise');

                    result
                        .then(function() {
                            assert.ok(false, "Should reject, but hasn't");
                            ready();
                        })
                        .catch(function(err) {
                            assert.equal(err.name, caseData.err.name, 'Reject error is the one expected');
                            assert.equal(err.message, caseData.err.message, 'Reject error is correct');

                            tokenHandler.getToken().then(function(storedToken) {
                                if (caseData.reuseToken) {
                                    assert.equal(storedToken, 'token1', 'The token was re-enqueued');
                                } else {
                                    assert.equal(storedToken, null, 'The token store is now empty');
                                }
                                ready();
                            });
                        });
                });
        });

    QUnit.cases
        .init([
            {
                title: '200 error 1',
                url: '//200/error/1'
            },
            {
                title: '200 error 2',
                url: '//200/error/2'
            },
            {
                title: '200 error fallback',
                url: '//200/error/fallback'
            }
        ])
        .test('request with success: false ', function(caseData, assert) {
            var ready = assert.async();
            var tokenHandler = tokenHandlerFactory();

            // mock the endpoints:
            $.mockjax([
                {
                    url: /^\/\/200.*$/,
                    status: 200,
                    headers: {
                        // respond with:
                        'X-CSRF-Token': 'token2'
                    },
                    response: function(settings) {
                        return standardMockResponse(settings, caseData, this);
                    }
                }
            ]);

            tokenHandler
                .clearStore()
                .then(function() {
                    return tokenHandler.setToken('token1');
                })
                .then(function() {
                    var result = request(caseData);

                    assert.expect(3);

                    assert.ok(result instanceof Promise, 'The request function returns a promise');

                    result
                        .then(function(response) {
                            assert.deepEqual(response, responses[caseData.url][0], 'The given result is correct');

                            tokenHandler.getToken().then(function(storedToken) {
                                assert.equal(storedToken, 'token2', 'The token was updated with the next in sequence');
                                ready();
                            });
                        })
                        .catch(function() {
                            assert.ok(false, 'Should not reject');
                            ready();
                        });
                });
        });


    QUnit.module('errors');

    errors = {
        '//nothing': {
            code: 0,
            sent: false,
            source: 'network',
            message: '0 : timeout'
        },
        '//202': {
            code: 202,
            sent: true,
            source: 'request',
            message: 'The server has sent an empty response'
        },
        '//403': {
            code: 403,
            sent: true,
            source: 'network',
            message: '403 : Authentication Error'
        },
        '//500': {
            code: 500,
            sent: true,
            source: 'request',
            message: '500 : Internal Server Error'
        }
    };

    QUnit.cases
        .init([
            {
                title: 'no response',
                url: '//nothing'
            },
            {
                title: '403 response',
                url: '//403'
            },
            {
                title: '2xx catch-all',
                url: '//202'
            }
        ])
        .test('error-throwing cases ', function(caseData, assert) {
            var ready = assert.async();
            var tokenHandler = tokenHandlerFactory();

            // mock the endpoints:
            $.mockjax([
                {
                    url: '//nothing',
                    responseTime: 500,
                    isTimeout: true
                },
                {
                    url: '//403',
                    status: 403,
                    statusText: 'Authentication Error',
                    response: function(settings) {
                        return standardMockResponse(settings, caseData, this);
                    }
                },
                {
                    url: '//202',
                    status: 202,
                    response: function(settings) {
                        return standardMockResponse(settings, caseData, this);
                    }
                }
            ]);

            tokenHandler
                .clearStore()
                .then(function() {
                    return tokenHandler.setToken('token1');
                })
                .then(function() {
                    var result = request(caseData);

                    assert.expect(5);

                    assert.ok(result instanceof Promise, 'The request function returns a promise');

                    result
                        .then(function() {
                            assert.ok(false, 'Should not resolve, but did!');
                            ready();
                        })
                        .catch(function(error) {
                            var expected = errors[caseData.url];
                            assert.equal(error.code, expected.code, 'The correct error code');
                            assert.equal(error.sent, expected.sent, 'The correct error sent status');
                            assert.equal(error.source, expected.source, 'The correct error source');
                            assert.equal(error.message, expected.message, 'The correct error message');
                            ready();
                        });
                });
        });
});
