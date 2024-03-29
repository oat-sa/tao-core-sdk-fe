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
 * Copyright (c) 2015 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */
define(['jquery', 'lodash', 'core/polling'], function($, _, polling) {
    'use strict';

    QUnit.module('polling');

    QUnit.test('module', function(assert) {
        assert.expect(3);
        assert.equal(typeof polling, 'function', 'The polling module exposes a function');
        assert.equal(typeof polling(), 'object', 'The polling factory produces an object');
        assert.notStrictEqual(polling(), polling(), 'The polling factory provides a different object on each call');
    });

    const testReviewApi = [
        { name: 'async', title: 'async' },
        { name: 'next', title: 'next' },
        { name: 'start', title: 'start' },
        { name: 'stop', title: 'stop' },
        { name: 'setInterval', title: 'setInterval' },
        { name: 'getInterval', title: 'getInterval' },
        { name: 'setAction', title: 'setAction' },
        { name: 'getAction', title: 'getAction' },
        { name: 'setContext', title: 'setContext' },
        { name: 'getContext', title: 'getContext' },
        { name: 'getIteration', title: 'getIteration' },
        { name: 'setMax', title: 'setMax' },
        { name: 'getMax', title: 'getMax' },
        { name: 'is', title: 'is' }
    ];

    QUnit.cases.init(testReviewApi).test('instance API ', function(data, assert) {
        const instance = polling();
        assert.expect(1);
        assert.equal(
            typeof instance[data.name],
            'function',
            `The polling instance exposes a "${data.title}" function`
        );
    });

    QUnit.test('API', function(assert) {
        const instance = polling();
        const action = function() {};
        const interval = 250;
        const context = {};
        const max = 3;

        assert.expect(18);

        assert.equal(instance.getInterval(), 60000, 'The polling instance has set a default value for the interval');
        assert.equal(
            instance.getContext(),
            instance,
            'The polling instance has set a default value for the call context'
        );
        assert.equal(instance.getAction(), null, 'The polling instance has no action callback for now');

        assert.equal(instance.setInterval(interval), instance, 'The method setInterval returns the instance');
        assert.equal(instance.setContext(context), instance, 'The method setContext returns the instance');
        assert.equal(instance.setMax(max), instance, 'The method setMax returns the instance');
        assert.equal(instance.setAction(action), instance, 'The method setAction returns the instance');

        assert.equal(instance.getInterval(), interval, 'The polling instance has set the right value for the interval');
        assert.equal(
            instance.getContext(),
            context,
            'The polling instance has set the right value for the call context'
        );
        assert.equal(
            instance.getMax(),
            max,
            'The polling instance has set the right value for the max number of iterations'
        );
        assert.equal(instance.getAction(), action, 'The polling instance has set the right action callback');

        const instance2 = polling(action);
        assert.equal(instance2.getInterval(), 60000, 'The polling instance has set a default value for the interval');
        assert.equal(
            instance2.getContext(),
            instance2,
            'The polling instance has set a default value for the call context'
        );
        assert.equal(instance2.getAction(), action, 'The polling instance has set the right action callback');

        const instance3 = polling({
            action: action,
            interval: interval,
            context: context,
            max: max
        });
        assert.equal(
            instance3.getInterval(),
            interval,
            'The polling instance has set the right value for the interval'
        );
        assert.equal(
            instance3.getContext(),
            context,
            'The polling instance has set the right value for the call context'
        );
        assert.equal(
            instance3.getMax(),
            max,
            'The polling instance has set the right value for the max number of iterations'
        );
        assert.equal(instance3.getAction(), action, 'The polling instance has set the right action callback');
    });

    QUnit.test('events', function(assert) {
        const ready10 = assert.async();
        const ready9 = assert.async();
        const ready8 = assert.async();
        const ready7 = assert.async(3);
        const ready6 = assert.async();
        const ready5 = assert.async(2);
        const ready4 = assert.async(3);
        const ready3 = assert.async(2);
        const ready2 = assert.async();
        const ready1 = assert.async(4);
        const ready = assert.async();
        const instance = polling();

        const interval = 50;
        const context = {
            step: 0
        };

        const action = function() {
            let async;

            assert.equal(instance.is('processing'), true, 'The instance must be in state processing');

            switch (this.step++) {
                case 0:
                    async = instance.async();
                    setTimeout(function() {
                        async.resolve();
                    }, interval);
                    break;

                case 1:
                    async = instance.async();
                    setTimeout(function() {
                        async.reject();
                    }, interval);
                    break;

                case 2:
                    instance.stop();
                    break;

                case 3:
                    async = instance.async();
                    setTimeout(function() {
                        async.reject();
                    }, interval);
                    break;
            }
        };

        instance.on('custom', function() {
            assert.ok(true, 'The polling instance can handle custom events');
            ready();
        });

        instance.on('call', function() {
            assert.ok(
                true,
                `The polling instance triggers event when the action is called [step ${context.step}]`
            );
            ready1();
        });

        instance.on('resolved', function() {
            assert.equal(instance.is('processing'), false, 'The instance must not be in state processing');
            assert.equal(instance.is('pending'), true, 'The instance must be in state pending');
            assert.ok(
                true,
                `The polling instance triggers event when the action is validated in async mode [step ${context.step}]`
            );
            ready2();
        });

        instance.on('rejected', function() {
            if (4 !== context.step) {
                assert.equal(instance.is('processing'), false, 'The instance must not be in state processing');
                assert.equal(instance.is('stopped'), true, 'The instance must be in state stopped');
            }
            assert.ok(
                true,
                `The polling instance triggers event when the action is canceled in async mode [step ${context.step}]`
            );
            ready3();
        });

        instance.on('async', function(cb) {
            assert.ok(
                true,
                `The polling instance triggers event when the action is set to async mode [step ${context.step}]`
            );
            assert.equal(typeof cb, 'object', 'The first parameter of the async event is the resolve object');
            assert.ok(cb.resolve, 'The first parameter of the async event has a resolve method');
            assert.ok(cb.reject, 'The first parameter of the async event has a reject method');
            ready4();
        });

        instance.on('next', function() {
            assert.equal(instance.is('stopped'), false, 'The instance must not be in state stopped');
            assert.ok(
                true,
                `The polling instance triggers event when the action is triggered immediately [step ${context.step}]`
            );
            ready5();
        });

        instance.on('start', function() {
            assert.equal(instance.is('pending'), true, 'The instance must be in state pending');
            assert.equal(instance.is('stopped'), false, 'The instance must not be in state stopped');
            assert.ok(
                true,
                `The polling instance triggers event when the polling is started [step ${context.step}]`
            );
            ready6();
        });

        instance.on('stop', function() {
            assert.equal(instance.is('pending'), false, 'The instance must not be in state pending');
            assert.equal(instance.is('stopped'), true, 'The instance must be in state stopped');
            assert.ok(
                true,
                `The polling instance triggers event when the polling is stopped [step ${context.step}]`
            );
            ready7();

            if (2 === context.step || 3 === context.step) {
                instance.next();
            }
        });

        instance.on('setinterval', function(val) {
            assert.ok(true, 'The polling instance triggers event when the interval is changed');
            assert.equal(val, interval, 'The first parameter of the setinterval event is the changed value');
            ready8();
        });

        instance.on('setaction', function(val) {
            assert.ok(true, 'The polling instance triggers event when the action to call is changed');
            assert.equal(val, action, 'The first parameter of the setaction event is the changed value');
            ready9();
        });

        instance.on('setcontext', function(val) {
            assert.ok(true, 'The polling instance triggers event when the call context is changed');
            assert.equal(val, context, 'The first parameter of the setcontext event is the changed value');
            ready10();
        });

        assert.expect(48);

        instance.trigger('custom');

        instance.setInterval(interval);
        instance.setContext(context);
        instance.setAction(action);
        instance.start();
    });

    QUnit.test('limit', function(assert) {
        const ready1 = assert.async();
        const ready = assert.async(3);
        const instance = polling();
        const max = 3;
        const interval = 50;
        const context = {
            step: 0
        };

        const action = function() {
            this.step++;
            assert.equal(instance.getIteration(), this.step, `The iteration is counted #${  this.step}`);
            assert.ok(instance.getIteration() <= max, `The number of iterations is under the max #${  this.step}`);
            ready();
        };

        instance.on('stop', function() {
            assert.ok(true, 'The polling instance is stopped');
            ready1();
        });

        assert.expect(11);

        instance.setInterval(interval);
        instance.setContext(context);
        instance.setAction(action);
        instance.setMax(max);
        instance.start();

        assert.equal(instance.getMax(), max, 'The mex number of iteration is correct');

        const instance2 = polling({
            action: _.noop,
            max: 2
        });
        assert.equal(instance2.next(), instance2, 'The next() method returned the instance');
        assert.equal(instance2.next(), instance2, 'The next() method returned the instance');
        assert.equal(instance2.next(), instance2, 'The next() method returned the instance');
        instance2.stop();
    });

    QUnit.test('autoStart', function(assert) {
        const ready = assert.async();
        const instance = polling({
            action: function() {
                assert.ok(true, 'The instance has auto started the polling');
            },
            interval: 250,
            max: 1,
            autoStart: true
        });

        assert.expect(2);

        instance.on('stop', function() {
            assert.ok(true, 'The polling instance is stopped');
            ready();
        });
    });

    QUnit.test('next pending', function(assert) {
        const ready = assert.async();
        let count = 0;
        const instance = polling({
            action: function() {
                const async = this.async();

                assert.ok(true, 'The next() method has force an iteration');
                count++;

                setTimeout(function() {
                    async.resolve();

                    if (count >= 2) {
                        instance.stop();
                        ready();
                    }
                }, 250);
            },
            interval: 200
        });

        assert.expect(4);

        instance.next();
        assert.equal(count, 1, 'An iteration has been ran');
        instance.next();
        assert.equal(count, 1, 'No other iteration has been ran at this time');
    });
});
