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
 * Copyright (c) 2016 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */
define(['lodash', 'core/promise', 'core/communicator'], function(_, Promise, communicator) {
    'use strict';

    QUnit.module('communicator factory', {
        beforeEach: function() {
            communicator.registerProvider('mock', { init: _.noop });
        },
        afterEach: function() {
            communicator.clearProviders();
        }
    });

    QUnit.test('module', function(assert) {
        assert.expect(5);
        assert.equal(typeof communicator, 'function', 'The communicator module exposes a function');
        assert.equal(typeof communicator('mock'), 'object', 'The communicator factory produces an object');
        assert.notStrictEqual(
            communicator('mock'),
            communicator('mock'),
            'The communicator factory provides a different object on each call'
        );
        assert.equal(
            typeof communicator.registerProvider,
            'function',
            'The instance module exposes a function registerProvider()'
        );
        assert.equal(
            typeof communicator.getProvider,
            'function',
            'The instance module exposes a function getProvider()'
        );
    });

    const communicatorApi = [
        { name: 'init', title: 'init' },
        { name: 'destroy', title: 'destroy' },

        { name: 'open', title: 'open' },
        { name: 'close', title: 'close' },

        { name: 'send', title: 'send' },
        { name: 'channel', title: 'channel' },

        { name: 'getConfig', title: 'getConfig' },
        { name: 'setState', title: 'setState' },
        { name: 'getState', title: 'getState' },

        { name: 'trigger', title: 'trigger' },
        { name: 'before', title: 'before' },
        { name: 'on', title: 'on' },
        { name: 'after', title: 'after' }
    ];

    QUnit.cases.init(communicatorApi).test('api', function(data, assert) {
        const instance = communicator('mock');
        assert.equal(
            typeof instance[data.name],
            'function',
            `The communicator instance exposes a "${data.name}" function`
        );
    });

    QUnit.module('provider', {
        beforeEach: function() {
            communicator.clearProviders();
        }
    });

    QUnit.test('init()', function(assert) {
        const ready = assert.async();
        assert.expect(5);

        const expectedContextValue = 'yo!';

        communicator.registerProvider('foo', {
            init: function() {
                assert.equal(this.bar, expectedContextValue, 'The init method is executed on the instance context');
                return Promise.resolve();
            }
        });

        const instance = communicator('foo')
            .on('init', function() {
                assert.ok(true, 'The communicator has fired the "init" event');
            })
            .on('ready', function() {
                assert.ok(true, 'The communicator has fired the "ready" event');
            });

        instance.bar = expectedContextValue;

        instance.init().then(function() {
            assert.ok(true, 'The communicator is initialized');
            assert.ok(instance.getState('ready'), 'The communicator is ready');

            // Double init to check direct resolve (only the first init() must delegate to the provider and fire events)
            // if more asserts are done at this point, there is an issue
            instance.init().then(function() {
                ready();
            });
        });
    });

    QUnit.test('destroy()', function(assert) {
        const ready = assert.async();
        assert.expect(5);

        const expectedContextValue = 'yo!';

        communicator.registerProvider('foo', {
            init: function() {
                return Promise.resolve();
            },

            destroy: function() {
                assert.ok(true, 'The communicator has delegated the destroy');
                assert.equal(this.bar, expectedContextValue, 'The destroy method is executed on the instance context');
                return Promise.resolve();
            }
        });

        const instance = communicator('foo')
            .on('destroy', function() {
                assert.ok(true, 'The communicator has fired the "destroy" event');
            })
            .on('destroyed', function() {
                assert.ok(true, 'The communicator has fired the "destroyed" event');
            });

        instance.bar = expectedContextValue;

        instance.init().then(function() {
            instance.destroy().then(function() {
                assert.ok(true, 'The communicator is destroyed');
                ready();
            });
        });
    });

    QUnit.test('open()', function(assert) {
        const ready = assert.async();
        assert.expect(6);

        const expectedContextValue = 'yo!';

        communicator.registerProvider('foo', {
            init: function() {
                return Promise.resolve();
            },

            open: function() {
                assert.ok(true, 'The communicator has delegated the open');
                assert.equal(this.bar, expectedContextValue, 'The open method is executed on the instance context');
                return Promise.resolve();
            }
        });

        const instance = communicator('foo')
            .on('open', function() {
                assert.ok(true, 'The communicator has fired the "open" event');
            })
            .on('opened', function() {
                assert.ok(true, 'The communicator has fired the "opened" event');
            });

        instance.bar = expectedContextValue;

        instance.init().then(function() {
            instance.open().then(function() {
                assert.ok(true, 'The communicator is open');
                assert.ok(instance.getState('open'), 'The communicator is in "open" state');

                // Double open to check direct resolve (only the first open() must delegate to the provider and fire events)
                // if more asserts are done at this point, there is an issue
                instance.open().then(function() {
                    ready();
                });
            });
        });
    });

    QUnit.test('close()', function(assert) {
        const ready = assert.async();
        assert.expect(15);

        const expectedContextValue = 'yo!';

        communicator.registerProvider('foo', {
            init: function() {
                return Promise.resolve();
            },

            destroy: function() {
                return Promise.resolve();
            },

            open: function() {
                return Promise.resolve();
            },

            close: function() {
                assert.ok(true, 'The communicator has delegated the close');
                assert.equal(this.bar, expectedContextValue, 'The close method is executed on the instance context');
                return Promise.resolve();
            }
        });

        const instance = communicator('foo')
            .on('close', function() {
                assert.ok(true, 'The communicator has fired the "close" event');
            })
            .on('closed', function() {
                assert.ok(true, 'The communicator has fired the "closed" event');
            });

        instance.bar = expectedContextValue;

        instance.init().then(function() {
            instance.open().then(function() {
                assert.ok(true, 'The communicator is open');
                assert.ok(instance.getState('open'), 'The communicator is in "open" state');

                instance.close().then(function() {
                    assert.ok(true, 'The communicator is closed');
                    assert.ok(!instance.getState('open'), 'The communicator is not in "open" state');

                    instance.open().then(function() {
                        assert.ok(true, 'The communicator is open');
                        assert.ok(instance.getState('open'), 'The communicator is in "open" state');

                        // Check the auto-close when destroying
                        instance.destroy().then(function() {
                            assert.ok(true, 'The communicator is destroyed');
                            ready();
                        });
                    });
                });
            });
        });
    });

    QUnit.test('send()', function(assert) {
        const ready = assert.async();
        const expectedChannel = 'foo';
        const expectedMessage = 'bar';
        const expectedResponse = 'ok';

        assert.expect(15);

        communicator.registerProvider('foo', {
            init: function() {
                return Promise.resolve();
            },

            open: function() {
                return Promise.resolve();
            },

            send: function(channel, message) {
                assert.ok(true, 'The communicator has delegated the send');
                assert.equal(channel, expectedChannel, 'The right channel has been used');
                assert.equal(message, expectedMessage, 'The right message has been sent');
                return Promise.resolve(expectedResponse);
            }
        });

        const instance = communicator('foo')
            .on('send', function(promise, channel, message) {
                assert.ok(true, 'The communicator has fired the "send" event');
                assert.ok(promise instanceof Promise, 'The promise is provided');
                assert.equal(channel, expectedChannel, 'The right channel is provided');
                assert.equal(message, expectedMessage, 'The right message is provided');
            })
            .on('sent', function(channel, message, response) {
                assert.ok(true, 'The communicator has fired the "sent" event');
                assert.equal(channel, expectedChannel, 'The right channel is provided');
                assert.equal(message, expectedMessage, 'The right message is provided');
                assert.equal(response, expectedResponse, 'The right response is provided');
            });

        instance.send(expectedChannel, expectedMessage).catch(function() {
            assert.ok(true, 'The communicator cannot send a message while the instance is not initialized');
        });

        instance.init().then(function() {
            instance.send(expectedChannel, expectedMessage).catch(function() {
                assert.ok(true, 'The communicator cannot send a message while the connection is not open');
            });

            instance.open().then(function() {
                instance.send(expectedChannel, expectedMessage).then(function(response) {
                    assert.ok(true, 'The message has been sent');
                    assert.equal(response, expectedResponse, 'The expected response has been receive');
                    ready();
                });
            });
        });
    });

    QUnit.test('channel()', function(assert) {
        const ready = assert.async();
        const expectedMessage = 'Hello';

        assert.expect(4);

        communicator.registerProvider('foo', { init: _.noop });

        const instance = communicator('foo');

        assert.throws(function() {
            instance.channel(null, _.noop);
        }, 'A channel must have a name');

        assert.throws(function() {
            instance.channel('foo', null);
        }, 'A channel must have a handler');

        instance.channel('bar', function(message) {
            assert.ok(true, 'The message has been received');
            assert.equal(message, expectedMessage, 'The right message has been received');
            ready();
        });

        instance.trigger('message', 'bar', expectedMessage);
    });

    QUnit.test('getConfig()', function(assert) {
        const ready = assert.async();
        assert.expect(1);

        const config = {
            timeout: 15000,
            moo: 'norz'
        };

        communicator.registerProvider('foo', {
            init: function() {
                const myConfig = this.getConfig();
                assert.deepEqual(myConfig, config, 'The retrieved config is the right one');
                return Promise.resolve();
            }
        });

        const instance = communicator('foo', config);
        instance.init().then(function() {
            ready();
        });
    });

    QUnit.test('setState()', function(assert) {
        const ready = assert.async();
        assert.expect(4);

        communicator.registerProvider('foo', {
            init: function() {
                return Promise.resolve();
            }
        });

        const instance = communicator('foo');
        instance.init().then(function() {
            assert.ok(!instance.getState('foo'), 'The state "foo" is not set');

            instance.setState('foo');
            assert.ok(instance.getState('foo'), 'The state "foo" is set');

            instance.setState('foo', false);
            assert.ok(!instance.getState('foo'), 'The state "foo" is not set');

            instance.setState('foo', true);
            assert.ok(instance.getState('foo'), 'The state "foo" is set');

            ready();
        });
    });
});
