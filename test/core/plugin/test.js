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
 * Plugi\'s test
 *
 * @author Sam <sam@taotesting.com>
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
define(['lodash', 'core/plugin', 'core/eventifier'], function(_, pluginFactory, eventifier) {
    'use strict';

    const mockProvider = {
        name: 'foo',
        init: _.noop
    };

    const defaultConfig = {
        a: false,
        b: 10
    };

    const mockHost = {
        on: _.noop,
        trigger: _.noop
    };

    QUnit.module('plugin');

    QUnit.test('module', function(assert) {
        assert.expect(3);

        assert.equal(typeof pluginFactory, 'function', 'The plugin module exposes a function');
        assert.equal(typeof pluginFactory(mockProvider), 'function', 'The plugin factory produces a function');
        assert.notStrictEqual(
            pluginFactory(mockProvider),
            pluginFactory(mockProvider),
            'The plugin factory provides a different object on each call'
        );
    });

    QUnit.test('provider format', function(assert) {
        assert.expect(4);

        assert.throws(
            function() {
                pluginFactory();
            },
            TypeError,
            'A provider should be an object'
        );

        assert.throws(
            function() {
                pluginFactory({});
            },
            TypeError,
            'A plugin provider should have a name'
        );

        assert.throws(
            function() {
                pluginFactory({ name: '' });
            },
            TypeError,
            'A plugin provider should have a valid name'
        );

        assert.throws(
            function() {
                pluginFactory({ name: 'foo' });
            },
            TypeError,
            'A plugin provider should have a init function'
        );

        pluginFactory({
            name: 'foo',
            init: _.noop
        });
    });

    QUnit.test('instantiation', function(assert) {
        assert.expect(21);

        const myPlugin = pluginFactory(mockProvider, defaultConfig);

        assert.throws(
            function() {
                myPlugin();
            },
            TypeError,
            'A plugin is instanciated with an host'
        );

        assert.throws(
            function() {
                myPlugin({});
            },
            TypeError,
            'A plugin is instanciated with an eventified host'
        );

        assert.equal(typeof myPlugin(mockHost), 'object', 'My plugin factory produce a plugin instance object');
        assert.notStrictEqual(
            myPlugin(mockHost),
            myPlugin(mockHost),
            'My plugin factory provides different object on each call'
        );

        const plugin = myPlugin(mockHost);
        assert.equal(typeof plugin.init, 'function', 'The plugin instance has also the default function init');
        assert.equal(
            typeof plugin.getAreaBroker,
            'function',
            'The plugin instance has also the default function getAreaBroker'
        );
        assert.equal(typeof plugin.finish, 'function', 'The plugin instance has also the default function finish');
        assert.equal(typeof plugin.render, 'function', 'The plugin instance has also the default function render');
        assert.equal(typeof plugin.destroy, 'function', 'The plugin instance has also the default function destroy');
        assert.equal(typeof plugin.show, 'function', 'The plugin instance has also the default function show');
        assert.equal(typeof plugin.hide, 'function', 'The plugin instance has also the default function hide');
        assert.equal(typeof plugin.enable, 'function', 'The plugin instance has also the default function enable');
        assert.equal(typeof plugin.disable, 'function', 'The plugin instance has also the default function disable');
        assert.equal(typeof plugin.setState, 'function', 'The plugin instance has also the default function setState');
        assert.equal(typeof plugin.getState, 'function', 'The plugin instance has also the default function getState');
        assert.equal(
            typeof plugin.getConfig,
            'function',
            'The plugin instance has also the default function getConfig'
        );
        assert.equal(
            typeof plugin.setConfig,
            'function',
            'The plugin instance has also the default function setConfig'
        );
        assert.equal(typeof plugin.getName, 'function', 'The plugin instance has also the default function getName');
        assert.equal(typeof plugin.getHost, 'function', 'The plugin instance has also the default function getHost');
        assert.equal(
            typeof plugin.getContent,
            'function',
            'The plugin instance has also the default function getContent'
        );
        assert.equal(
            typeof plugin.setContent,
            'function',
            'The plugin instance has also the default function setContent'
        );
    });

    QUnit.test('config', function(assert) {
        assert.expect(8);

        const myPlugin = pluginFactory(mockProvider, defaultConfig);
        const myAreaBroker = {};
        const instanceConfig = { c: 'c' };
        const plugin = myPlugin(mockHost, myAreaBroker, instanceConfig);

        assert.equal(typeof plugin, 'object', 'My plugin factory produce a plugin instance object');

        const config1 = plugin.getConfig();
        assert.equal(config1.a, defaultConfig.a, 'instance1 inherits the default config "a"');
        assert.equal(config1.b, defaultConfig.b, 'instance1 inherit the default config "b"');
        assert.equal(config1.c, instanceConfig.c, 'instance1 inherit the default config "c"');

        const areaBroker = plugin.getAreaBroker();
        assert.equal(areaBroker, myAreaBroker, 'instance1 inherit the provided areaBroker');

        const config2 = {
            a: true,
            b: 999
        };

        plugin.setConfig(config2);
        assert.equal(plugin.getConfig().a, config2.a, 'instance2 has new config value "a"');
        assert.equal(plugin.getConfig().b, config2.b, 'instance2 has new config value "b"');

        plugin.setConfig('foo', 'bar');
        assert.equal(plugin.getConfig().foo, 'bar', 'instance2 has new config value "foo"');
    });

    QUnit.test('methods', function(assert) {
        assert.expect(13);

        const samplePluginImpl = {
            name: 'samplePluginImpl',
            install: function() {
                assert.ok(true, 'called install');
                assert.equal(this.getHost(), mockHost, 'instance1 has a host when install() is called');
            },
            init: function() {
                const config = this.getConfig();
                assert.ok(true, 'called init');

                assert.equal(config.a, defaultConfig.a, 'instance1 inherits the default config');
                assert.equal(config.b, defaultConfig.b, 'instance1 inherit the default config');
            },
            render: function() {
                assert.ok(true, 'called render');
            },
            finish: function() {
                assert.ok(true, 'called finish');
            },
            destroy: function() {
                assert.ok(true, 'called destory');
            },
            show: function() {
                assert.ok(true, 'called show');
            },
            hide: function() {
                assert.ok(true, 'called hide');
            },
            enable: function() {
                assert.ok(true, 'called enable');
            },
            disable: function() {
                assert.ok(true, 'called disable');
            }
        };

        const myPlugin = pluginFactory(samplePluginImpl, defaultConfig);

        assert.equal(typeof myPlugin(mockHost), 'object', 'My plugin factory produce a plugin instance object');

        const instance1 = myPlugin(mockHost);
        instance1.install();
        instance1.init();
        instance1.render();
        instance1.hide();
        instance1.show();
        instance1.disable();
        instance1.enable();
        instance1.finish();
        instance1.destroy();
    });

    QUnit.test('state', function(assert) {
        const ready = assert.async();
        assert.expect(14);

        const myPlugin = pluginFactory(mockProvider);

        assert.equal(typeof myPlugin(mockHost), 'object', 'My plugin factory produce a plugin instance object');

        const instance1 = myPlugin(mockHost);

        assert.throws(
            function() {
                instance1.setState({}, false);
            },
            TypeError,
            'The state must have a valid name'
        );

        //Custom state : active
        assert.strictEqual(instance1.getState('active'), false, 'no state set by default');
        instance1.setState('active', true);
        assert.strictEqual(instance1.getState('active'), true, 'active state set');
        instance1.setState('active', false);
        assert.strictEqual(instance1.getState('active'), false, 'no state set by default');

        //Built-in state init:
        assert.strictEqual(instance1.getState('init'), false, 'init state = false by default');
        instance1.init().then(function() {
            assert.strictEqual(instance1.getState('init'), true, 'init state set');

            //Built-in visible state
            assert.strictEqual(instance1.getState('visible'), false, 'visible state = false by default');
            instance1.show().then(function() {
                assert.strictEqual(instance1.getState('visible'), true, 'visible state set');
                instance1.hide().then(function() {
                    assert.strictEqual(instance1.getState('visible'), false, 'visible turns to false');
                });
            });

            //Built-in enabled state
            assert.strictEqual(instance1.getState('enabled'), false, 'enabled state = false by default');
            instance1.enable().then(function() {
                assert.strictEqual(instance1.getState('enabled'), true, 'enabled state set');
                instance1.disable().then(function() {
                    assert.strictEqual(instance1.getState('enabled'), false, 'enabled turns to false');
                });
            });

            //Built-in init state
            setTimeout(function() {
                instance1.destroy().then(function() {
                    assert.strictEqual(instance1.getState('init'), false, 'destoyed state set');
                    ready();
                });
            }, 10);
        });
    });

    QUnit.test('host name alias', function(assert) {
        assert.expect(3);

        const myPlugin = pluginFactory(mockProvider, {
            hostName: 'fooStopper'
        });
        const plugin = myPlugin(mockHost);

        assert.equal(typeof plugin, 'object', 'My plugin factory produce a plugin instance object');
        assert.equal(typeof plugin.getFooStopper, 'function', 'Getter with alias has been created');
        assert.deepEqual(plugin.getFooStopper(), mockHost, 'The host alias returns the host');
    });

    QUnit.test('host binding', function(assert) {
        assert.expect(4);
        const value1 = 'xxx';
        const host = {
            prop1: 123,
            method1: function() {
                return value1;
            },
            on: _.noop,
            trigger: _.noop
        };

        const samplePluginImpl = {
            name: 'hostPlugin',
            init: function() {
                assert.ok(true, 'called init');

                assert.deepEqual(this.getHost(), host, 'The plugin has access to the test runner');
                assert.strictEqual(this.getHost().method1(), value1, 'called root component method');
            }
        };

        const myPlugin = pluginFactory(samplePluginImpl);

        const instance1 = myPlugin(host);
        instance1.init();
        assert.strictEqual(instance1.getHost(), host, 'root component is set');
    });

    QUnit.test('root component event', function(assert) {
        const ready = assert.async();
        assert.expect(6);

        const eventParams = ['ABC', true, 12345];
        const myPlugin = pluginFactory({
            name: 'pluginA',
            init: function() {
                this.trigger('someEvent', eventParams[0], eventParams[1], eventParams[2]);
            }
        });

        const instance1 = myPlugin(
            eventifier()
                .on('plugin-init.pluginA', function (plugin) {
                    assert.ok(true, 'root component knows knows that pluginA has been initialized');
                    assert.deepEqual(plugin, instance1, 'The given plugin instance is correct');
                    ready();
                })
                .on('plugin-someEvent.pluginA', function (plugin, arg1, arg2, arg3) {
                    assert.ok(true, 'someEvent triggered and forwarded to root component');
                    assert.strictEqual(eventParams[0], arg1, 'event param ok');
                    assert.strictEqual(eventParams[1], arg2, 'event param ok');
                    assert.strictEqual(eventParams[2], arg3, 'event param ok');
                })
        );
        instance1.init();
    });

    QUnit.test('get plugin name', function(assert) {
        const ready = assert.async();
        assert.expect(3);

        const name = 'foo-plugin';

        const samplePluginImpl = {
            name: name,
            init: function() {
                assert.ok(true, 'called init');
                assert.equal(this.getName(), name, 'The name matches');
                ready();
            }
        };

        const myPlugin = pluginFactory(samplePluginImpl);

        const instance1 = myPlugin(mockHost);
        assert.equal(instance1.getName(), name, 'The name matches');
        instance1.init();
    });

    QUnit.test('plugin content', function(assert) {
        const ready = assert.async();
        assert.expect(4);

        const name = 'foo-plugin';
        const content1 = { foo: 'bar' };
        const content2 = { foo: 'moo' };

        const myPlugin = pluginFactory({
            name: name,
            init: function(data) {
                assert.deepEqual(data, content1, 'The given content is correct');
                assert.deepEqual(this.getContent(), content1, 'The given content is set');
            }
        });

        const instance1 = myPlugin(mockHost);
        instance1.init(content1).then(function() {
            assert.deepEqual(instance1.setContent(content2), instance1, 'The method set content chains');
            assert.deepEqual(instance1.getContent(), content2, 'The given content is up to date');
            ready();
        });
    });
});
