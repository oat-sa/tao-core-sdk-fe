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
 * Copyright (c) 2016-19 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 * @author Martin Nicholson <martin@taotesting.com>
 */
define(['core/promise', 'core/tokenHandler', 'jquery.mockjax'], function(Promise, tokenHandlerFactory) {
    'use strict';

    QUnit.module('tokenHandler');

    QUnit.test('module', function(assert) {
        assert.expect(3);

        assert.equal(typeof tokenHandlerFactory, 'function', 'The tokenHandler module exposes a function');
        assert.equal(typeof tokenHandlerFactory(), 'object', 'The tokenHandler factory produces an object');
        assert.notStrictEqual(
            tokenHandlerFactory(),
            tokenHandlerFactory(),
            'The tokenHandler factory provides a different object on each call'
        );
    });

    QUnit.cases.init([
        {name: 'getToken'},
        {name: 'setToken'},
        {name: 'getClientConfigTokens'},
        {name: 'clearStore'},
        {name: 'getQueueLength'},
        {name: 'setMaxSize'}
    ]).test('instance API ', function(data, assert) {
        var instance = tokenHandlerFactory();
        assert.expect(1);
        assert.equal(
            typeof instance[data.name],
            'function',
            'The tokenHandler instance exposes a "' + data.name + '" function'
        );
    });

    QUnit.module('behaviour', {
        beforeEach: function() {
            this.cachedModuleConfig = requirejs.s.contexts._.config.config['core/tokenHandler'];
        },
        afterEach: function() {
            requirejs.s.contexts._.config.config['core/tokenHandler'] = this.cachedModuleConfig;
        }
    });

    QUnit.cases.init([{
        title: 'default, no delay',
        token: '42a0d04bbc519952',
        shouldExpire: false
    }, {
        title: 'with time limit, no delay, local config',
        options: {
            tokenTimeLimit: 100
        },
        token: 'b4cf23d4e0f4be32',
        shouldExpire: false
    }, {
        title: 'with time limit, no delay, platform config',
        moduleOptions: {
            tokenTimeLimit: 100
        },
        token: 'b4cf23d4e0f4be32',
        shouldExpire: false
    }, {
        title: 'with time limit, delay, local config',
        options: {
            tokenTimeLimit: 100
        },
        token: '68b29e61b6b79123',
        delay: 200,
        shouldExpire: true
    }, {
        title: 'with time limit, delay, platform config',
        moduleOptions: {
            tokenTimeLimit: 100
        },
        token: '68b29e61b6b79123',
        delay: 200,
        shouldExpire: true
    }, {
        title: 'without time limit, no delay, local config',
        options: {
            tokenTimeLimit: 0
        },
        token: '359db188e255d9c9',
        shouldExpire: false
    }, {
        title: 'without time limit, no delay, platform config',
        moduleOptions: {
            tokenTimeLimit: 0
        },
        token: '359db188e255d9c9',
        shouldExpire: false
    }, {
        title: 'without time limit, delay, local config',
        options: {
            tokenTimeLimit: 0
        },
        token: '22bca22ae34e0219',
        delay: 200,
        shouldExpire: false
    }, {
        title: 'without time limit, delay, platform config',
        moduleOptions: {
            tokenTimeLimit: 0
        },
        token: '22bca22ae34e0219',
        delay: 200,
        shouldExpire: false
    }]).test('set/get single token', function(data, assert) {
        var ready = assert.async();
        var tokenHandler;

        assert.expect(2);

        if (data.moduleOptions) {
            requirejs.s.contexts._.config.config['core/tokenHandler'] = data.moduleOptions;
        }
        tokenHandler = tokenHandlerFactory(data.options);

        tokenHandler
            .setToken(data.token)
            .then(function(result) {
                assert.ok(result, 'The setToken method returns true');

                return new Promise(function(resolve, reject) {
                    window.setTimeout(function() {
                        tokenHandler.getToken()
                            .then(resolve)
                            .catch(reject);
                    }, data.delay || 0);
                });
            })
            .then(function(returnedToken) {
                if (data.shouldExpire) {
                    assert.notEqual(returnedToken, data.token, 'The getToken method does not return the provided token');
                } else {
                    assert.equal(returnedToken, data.token, 'The getToken method returns the right token');
                }
            })
            .catch(function(err) {
                if (data.shouldExpire && err instanceof Error && err.message === 'No tokens available. Please refresh the page.') {
                    assert.ok(true, 'The token has expired as expected');
                } else {
                    return Promise.reject(err);
                }
            })
            .then(function() {
                return tokenHandler.clearStore();
            })
            .catch(function(err) {
                assert.ok(false, err.message);
            })
            .then(function() {
                ready();
            });
    });

    QUnit.test('getQueueLength', function(assert) {
        var ready = assert.async();
        var tokenHandler = tokenHandlerFactory({ maxSize: 5 });

        assert.expect(6);

        Promise.all([
            tokenHandler.setToken('token1'),
            tokenHandler.setToken('token2'),
            tokenHandler.setToken('token3'),
            tokenHandler.setToken('token4'),
            tokenHandler.setToken('token5')
        ])
            .then(function() {
                return tokenHandler.getQueueLength();
            })
            .then(function(length) {
                assert.equal(length, 5, 'The queue size is correct: 5');
                return tokenHandler.getToken().then(function() {
                    return tokenHandler.getQueueLength();
                });
            })
            .then(function(length) {
                assert.equal(length, 4, 'The queue size is correct: 4');
                return tokenHandler.getToken().then(function() {
                    return tokenHandler.getQueueLength();
                });
            })
            .then(function(length) {
                assert.equal(length, 3, 'The queue size is correct: 3');
                return tokenHandler.getToken().then(function() {
                    return tokenHandler.getQueueLength();
                });
            })
            .then(function(length) {
                assert.equal(length, 2, 'The queue size is correct: 2');
                return tokenHandler.getToken().then(function() {
                    return tokenHandler.getQueueLength();
                });
            })
            .then(function(length) {
                assert.equal(length, 1, 'The queue size is correct: 1');
                return tokenHandler.getToken().then(function() {
                    return tokenHandler.getQueueLength();
                });
            })
            .then(function(length) {
                assert.equal(length, 0, 'The queue size is correct: 0');

                ready();
            })
            .catch(function(err) {
                assert.ok(false, err.message);
                ready();
            });
    });

    QUnit.test('getClientConfigTokens', function(assert) {
        var ready = assert.async();
        var tokenHandler = tokenHandlerFactory();

        assert.expect(3);

        tokenHandler
            .getClientConfigTokens()
            .then(function(result) {
                assert.ok(result, 'The method returned true');

                return tokenHandler.getQueueLength();
            })
            .then(function(length) {
                assert.equal(length, 5, 'The queue size is correct: 5');

                return tokenHandler.getToken();
            })
            .then(function(token) {
                assert.equal(typeof token, 'string', 'A token string was fetched');

                return tokenHandler.clearStore();
            })
            .then(function() {
                ready();
            })
            .catch(function(err) {
                assert.ok(false, err.message);
                ready();
            });
    });
});
