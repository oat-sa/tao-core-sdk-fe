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
 * Copyright (c) 2019 Open Assessment Technologies SA ;
 */
/**
 * Test of tao/core/tokenStore
 *
 * @author Martin Nicholson <martin@taotesting.com>
 */
define(['lodash', 'core/promise', 'core/tokenStore'], function(_, Promise, tokenStoreFactory) {
    'use strict';

    // Define some dummy tokens with unique values & dates:
    var now = Date.now();
    var token1 = {
        value: 'my1stcooltoken12345',
        receivedAt: now + 10
    };
    var key1 = token1.value;

    var token2 = {
        value: 'my2ndcooltoken12345',
        receivedAt: now + 20
    };
    var key2 = token2.value;

    var token3 = {
        value: 'my3rdcooltoken12345',
        receivedAt: now + 30
    };
    var key3 = token3.value;

    var token4 = {
        value: 'my4thcooltoken12345',
        receivedAt: now + 40000000 // don't expire during test
    };
    var key4 = token4.value;

    QUnit.module('API');

    QUnit.test('module', function(assert) {
        assert.expect(1);

        assert.equal(typeof tokenStoreFactory, 'function', 'The module exposes a function');
    });

    QUnit.test('factory', function(assert) {
        assert.expect(2);

        assert.equal(typeof tokenStoreFactory(), 'object', 'The factory creates an object');
        assert.notDeepEqual(tokenStoreFactory(), tokenStoreFactory(), 'The factory creates a new object');
    });

    QUnit.test('instance', function(assert) {
        var tokenStore;
        assert.expect(7);

        tokenStore = tokenStoreFactory();

        assert.equal(typeof tokenStore.dequeue, 'function', 'The store exposes the method dequeue');
        assert.equal(typeof tokenStore.has, 'function', 'The store exposes the method has');
        assert.equal(typeof tokenStore.enqueue, 'function', 'The store exposes the method enqueue');
        assert.equal(typeof tokenStore.remove, 'function', 'The store exposes the method remove');
        assert.equal(typeof tokenStore.clear, 'function', 'The store exposes the method clear');
        assert.equal(typeof tokenStore.getSize, 'function', 'The store exposes the method getSize');
        assert.equal(typeof tokenStore.getTokens, 'function', 'The store exposes the method getTokens');
    });

    QUnit.module('behavior');

    QUnit.test('basic access, enqueue/dequeue/has', function(assert) {
        var ready = assert.async();
        var tokenStore;

        assert.expect(6);

        tokenStore = tokenStoreFactory();
        assert.equal(typeof tokenStore, 'object', 'The store is an object');

        tokenStore
            .clear()
            .then(function() {
                return tokenStore.has(key1);
            })
            .then(function(result) {
                assert.equal(result, false, 'The store does not contain token 1');
                return tokenStore.dequeue();
            })
            .then(function(value) {
                assert.equal(typeof value, 'undefined', 'The empty store returns undefined token');
                return tokenStore.enqueue(token1);
            })
            .then(function(assigned) {
                assert.ok(assigned, 'The value assignment is done');
                return tokenStore.has(key1);
            })
            .then(function(result) {
                assert.equal(result, true, 'The store contains token 1');
                return tokenStore.dequeue();
            })
            .then(function(value) {
                assert.deepEqual(value, token1, 'The store gives the correct token');
                ready();
            })
            .catch(function(err) {
                assert.ok(false, err.message);
                ready();
            });
    });

    QUnit.test('limited size', function(assert) {
        var ready = assert.async();
        var tokenStore;

        assert.expect(12);

        tokenStore = tokenStoreFactory({ maxSize: 3 });
        assert.equal(typeof tokenStore, 'object', 'The store is an object');

        tokenStore
            .clear()
            .then(function() {
                return tokenStore.enqueue(token1);
            })
            .then(function() {
                return tokenStore.getTokens();
            })
            .then(function(tokens) {
                assert.ok(key1 in tokens, 'The store contains token 1');
            })
            .then(function() {
                return tokenStore.enqueue(token2);
            })
            .then(function() {
                return tokenStore.getTokens();
            })
            .then(function(tokens) {
                assert.ok(key1 in tokens, 'The store contains token 1');
                assert.ok(key2 in tokens, 'The store contains token 2');
            })
            .then(function() {
                return tokenStore.enqueue(token3);
            })
            .then(function() {
                return tokenStore.getTokens();
            })
            .then(function(tokens) {
                assert.ok(key1 in tokens, 'The store contains token 1');
                assert.ok(key2 in tokens, 'The store contains token 2');
                assert.ok(key3 in tokens, 'The store contains token 3');
                return tokenStore.enqueue(token4);
            })
            .then(function() {
                return tokenStore.getSize();
            })
            .then(function(size) {
                assert.equal(size, 3, 'The store size is correct');
            })
            .then(function() {
                return tokenStore.getTokens();
            })
            .then(function(tokens) {
                assert.equal(false, key1 in tokens, 'The store no longer contains token 1');
                assert.ok(key2 in tokens, 'The store contains token 2');
                assert.ok(key3 in tokens, 'The store contains token 3');
                assert.ok(key4 in tokens, 'The store contains token 4');

                ready();
            })
            .catch(function(err) {
                assert.ok(false, err.message);
                ready();
            });
    });

    QUnit.test('remove', function(assert) {
        var ready = assert.async();
        var tokenStore;

        assert.expect(10);

        tokenStore = tokenStoreFactory({ maxSize: 3 });

        tokenStore
            .clear()
            .then(function() {
                return Promise.all([
                    tokenStore.enqueue(token1),
                    tokenStore.enqueue(token2),
                    tokenStore.enqueue(token3)
                ]);
            })
            .then(function() {
                assert.ok(tokenStore.has(key1), 'The store contains the given token');
                assert.ok(tokenStore.has(key2), 'The store contains the given token');
                assert.ok(tokenStore.has(key3), 'The store contains the given token');
            })
            .then(function() {
                return tokenStore.remove(key3);
            })
            .then(function(removed) {
                assert.ok(removed, 'The removal went well');
                return tokenStore.has(key3);
            })
            .then(function(result) {
                assert.ok(!result, 'The token was removed from the store');
            })
            .then(function() {
                return tokenStore.has('zoobizoob');
            })
            .then(function(result) {
                assert.ok(!result, 'The token does not exist');
                return tokenStore.remove('zoobizoob');
            })
            .then(function(removed) {
                assert.ok(!removed, 'Nothing to remove');
            })
            .then(function() {
                return tokenStore.enqueue(token4);
            })
            .then(function() {
                return tokenStore.getTokens();
            })
            .then(function(tokens) {
                assert.ok(key1 in tokens, 'The store contains token 1');
                assert.ok(key2 in tokens, 'The store contains token 2');
                assert.ok(key4 in tokens, 'The store contains token 4');

                ready();
            })
            .catch(function(err) {
                assert.ok(false, err.message);
                ready();
            });
    });

    QUnit.test('clear', function(assert) {
        var ready = assert.async();
        var tokenStore;

        assert.expect(7);

        tokenStore = tokenStoreFactory({});

        Promise.all([tokenStore.enqueue(token1), tokenStore.enqueue(token2), tokenStore.enqueue(token3)])
            .then(function() {
                assert.ok(tokenStore.has(key1), 'The store contains the given token');
                assert.ok(tokenStore.has(key2), 'The store contains the given token');
                assert.ok(tokenStore.has(key3), 'The store contains the given token');
            })
            .then(function() {
                return tokenStore.clear();
            })
            .then(function(cleared) {
                assert.ok(cleared, 'The clear went well');
                return tokenStore.getTokens();
            })
            .then(function(tokens) {
                assert.equal(false, key1 in tokens, 'The store does not contain token 2');
                assert.equal(false, key2 in tokens, 'The store does not contain token 3');
                assert.equal(false, key3 in tokens, 'The store does not contain token 4');

                ready();
            })
            .catch(function(err) {
                assert.ok(false, err.message);
                ready();
            });
    });

    QUnit.test('getSize/isEmpty', function(assert) {
        var ready = assert.async();
        var tokenStore;

        assert.expect(3);

        tokenStore = tokenStoreFactory({});

        tokenStore
            .clear()
            .then(function() {
                return Promise.all([
                    tokenStore.enqueue(token1),
                    tokenStore.enqueue(token2),
                    tokenStore.enqueue(token3)
                ]);
            })
            .then(function() {
                return tokenStore.getSize();
            })
            .then(function(size) {
                assert.equal(size, 3, 'The store size is correct: 3');
                return tokenStore.clear();
            })
            .then(function(cleared) {
                assert.ok(cleared, 'The clear went well');
                return tokenStore.getSize();
            })
            .then(function(size) {
                assert.equal(size, 0, 'The store size is correct: 0');

                ready();
            })
            .catch(function(err) {
                assert.ok(false, err.message);
                ready();
            });
    });

    QUnit.test('getTokens', function(assert) {
        var ready = assert.async();
        var tokenStore;

        assert.expect(3);

        tokenStore = tokenStoreFactory({});

        Promise.all([tokenStore.enqueue(token1), tokenStore.enqueue(token2), tokenStore.enqueue(token3)])
            .then(function() {
                return tokenStore.getTokens();
            })
            .then(function(tokens) {
                assert.equal(typeof tokens, 'object', 'An object is retrieved');
                assert.deepEqual(_.values(tokens), [token1, token2, token3], 'The correct set of tokens are retrieved');
            })
            .then(function() {
                tokenStore.clear();
            })
            .then(function() {
                return tokenStore.getTokens();
            })
            .then(function(tokens) {
                assert.deepEqual(tokens, {}, 'Empty set of tokens is retrieved');

                ready();
            })
            .catch(function(err) {
                assert.ok(false, err.message);
                ready();
            });
    });

    QUnit.test('getIndex', function(assert) {
        var ready = assert.async();
        var tokenStore;

        assert.expect(3);

        tokenStore = tokenStoreFactory({});

        Promise.all([tokenStore.enqueue(token1), tokenStore.enqueue(token2), tokenStore.enqueue(token3)])
            .then(function() {
                return tokenStore.getIndex();
            })
            .then(function(index) {
                assert.ok(index instanceof Array, 'An array is retrieved');
                assert.deepEqual(index, [key1, key2, key3], 'The generated index is correct');
            })
            .then(function() {
                tokenStore.clear();
            })
            .then(function() {
                return tokenStore.getIndex();
            })
            .then(function(tokens) {
                assert.deepEqual(tokens, [], 'The generated index is empty');

                ready();
            })
            .catch(function(err) {
                assert.ok(false, err.message);
                ready();
            });
    });

    QUnit.cases.init([{
        title: 'with time limit',
        options: {
            tokenTimeLimit: 100
        },
        shouldExpire: true
    }, {
        title: 'without time limit',
        options: {
            tokenTimeLimit: 0
        },
        shouldExpire: false
    }]).test('expireOldTokens ', function(data, assert) {
        var ready = assert.async();
        var tokenStore;

        assert.expect(2);

        tokenStore = tokenStoreFactory(data.options);

        tokenStore
            .clear()
            .then(function() {
                return Promise.all([
                    tokenStore.enqueue(token1),
                    tokenStore.enqueue(token2),
                    tokenStore.enqueue(token3),
                    tokenStore.enqueue(token4)
                ]);
            })
            .then(function() {
                return tokenStore.getSize();
            })
            .then(function(size) {
                assert.equal(size, 4, 'The store size is correct: 4');

                return new Promise(function(resolve) {
                    setTimeout(resolve, 200);
                });
            })
            .then(function() {
                return tokenStore.expireOldTokens();
            })
            .then(function() {
                return tokenStore.getSize();
            })
            .then(function(size) {
                if (data.shouldExpire) {
                    assert.equal(size, 1, 'A single token remains after small time delay');
                } else {
                    assert.equal(size, 4, 'No token have expired');
                }
                ready();
            })
            .catch(function(err) {
                assert.ok(false, err.message);
                ready();
            });
    });
});
