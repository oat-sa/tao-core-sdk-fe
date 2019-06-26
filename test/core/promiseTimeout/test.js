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
define(['core/promiseTimeout'], function(promiseTimeout) {
    'use strict';

    QUnit.module('promiseTimeout');

    QUnit.test('module', function(assert) {
        var promise = Promise.resolve();
        assert.expect(3);

        assert.equal(typeof promiseTimeout, 'function', 'The module exports a function');
        assert.equal(promiseTimeout(promise) instanceof Promise, true, 'The factory returns a promise');
        assert.notEqual(promiseTimeout(promise), promise, 'The factory creates a new promise on each call');
    });

    QUnit.test('resolved promise', function(assert) {
        var ready = assert.async();
        assert.expect(1);

        promiseTimeout(Promise.resolve())
            .then(function() {
                assert.ok(true, 'The promise is resolved');
            })
            .catch(function() {
                assert.ok(false, 'The promise should resolve');
            })
            .then(ready);
    });

    QUnit.test('rejected promise', function(assert) {
        var ready = assert.async();
        var error = new Error('This is a test');
        assert.expect(3);

        promiseTimeout(Promise.reject(error))
            .then(function() {
                assert.ok(false, 'The promise should not resolve');
            })
            .catch(function(err) {
                assert.ok(true, 'The promise should not resolve');
                assert.equal(err, error, 'The expected error is thrown');
                assert.ok(!err.timeout, 'No timeout occurred');
            })
            .then(ready);
    });

    QUnit.test('long promise resolve', function(assert) {
        var ready = assert.async();
        assert.expect(1);

        promiseTimeout(new Promise(function(resolve) {
            setTimeout(resolve, 100);
        }), {timeout: 200})
            .then(function() {
                assert.ok(true, 'The promise is resolved');
            })
            .catch(function() {
                assert.ok(false, 'The promise should resolve');
            })
            .then(ready);
    });

    QUnit.test('long rejected promise', function(assert) {
        var ready = assert.async();
        var error = new Error('This is a test');
        assert.expect(3);

        promiseTimeout(new Promise(function(resolve, reject) {
            setTimeout(function() {
                reject(error);
            }, 100);
        }), {timeout: 200})
            .then(function() {
                assert.ok(false, 'The promise should not resolve');
            })
            .catch(function(err) {
                assert.ok(true, 'The promise should not resolve');
                assert.equal(err, error, 'The expected error is thrown');
                assert.ok(!err.timeout, 'No timeout occurred');
            })
            .then(ready);
    });

    QUnit.test('timeout of rejected promise', function(assert) {
        var ready = assert.async();
        var error = new Error('This is a test');
        var message = 'A timeout occurred';
        assert.expect(3);

        promiseTimeout(new Promise(function(resolve, reject) {
            setTimeout(function() {
                reject(error);
            }, 500);
        }), {timeout: 200, message: message})
            .then(function() {
                assert.ok(false, 'The promise should not resolve');
            })
            .catch(function(err) {
                assert.ok(true, 'The promise should not resolve');
                assert.equal(err.message, message, 'The expected message is attached');
                assert.ok(err.timeout, 'A timeout occurred');
            })
            .then(ready);
    });

    QUnit.test('timeout of resolved promise', function(assert) {
        var ready = assert.async();
        var message = 'A timeout occurred';
        assert.expect(3);

        promiseTimeout(new Promise(function(resolve) {
            setTimeout(resolve, 500);
        }), {timeout: 200, message: message})
            .then(function() {
                assert.ok(false, 'The promise should not resolve');
            })
            .catch(function(err) {
                assert.ok(true, 'The promise should not resolve');
                assert.equal(err.message, message, 'The expected message is attached');
                assert.ok(err.timeout, 'A timeout occurred');
            })
            .then(ready);
    });
});
