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
 * Copyright (c) 2017 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define(['core/historyRouter', 'test/core/historyRouter/mock/controller'], function(historyRouterFactory, controller) {
    'use strict';

    const location = window.history.location || window.location;
    const port = location.port;
    const protocol = location.protocol;
    let domain = `${protocol}//${location.hostname}`;
    const testerUrl = location.href;

    const historyRouterApi = [
        { title: 'redirect' },
        { title: 'forward' },
        { title: 'replace' },
        { title: 'dispatch' },
        { title: 'pushState' }
    ];

    const errorsProvider = [
        {
            title: 'Null',
            state: null
        },
        {
            title: 'Empty state',
            state: {}
        },
        {
            title: 'Empty url',
            state: ''
        },
        {
            title: 'Empty url in state',
            state: { url: '' }
        }
    ];

    if (port && (('http:' === protocol && '80' !== port) || ('https:' === protocol && '443' !== port))) {
        domain += `:${port}`;
    }

    const pagesProvider = [
        {
            title: 'Index page',
            state: '/tao/Test/index',
            expected: `${domain}/tao/Test/index`
        },
        {
            title: 'User page',
            state: {
                url: '/tao/Test/user?id=foo#bar'
            },
            expected: `${domain}/tao/Test/user?id=foo#bar`
        },
        {
            title: 'Delivery page',
            state: {
                url: '/tao/Test/delivery?delivery=bar'
            },
            expected: `${domain}/tao/Test/delivery?delivery=bar`
        }
    ];

    QUnit.module('API', {
        beforeEach: function() {
            controller.removeAllListeners();
        },
        afterEach: function() {
            window.history.replaceState(null, '', testerUrl);
        }
    });

    QUnit.test('module', function(assert) {
        assert.expect(3);

        assert.equal(typeof historyRouterFactory, 'function', 'The historyRouter module exposes a function');
        assert.equal(typeof historyRouterFactory(), 'object', 'The historyRouter factory produces an object');
        assert.equal(
            historyRouterFactory(),
            historyRouterFactory(),
            'The historyRouter factory provides the same object on each call'
        );
    });

    QUnit.cases.init(historyRouterApi).test('instance API ', function(data, assert) {
        const instance = historyRouterFactory();
        assert.expect(1);
        assert.equal(
            typeof instance[data.title],
            'function',
            `The historyRouter instance exposes a "${data.title}" function`
        );
    });

    QUnit.module('States', {
        beforeEach: function() {
            controller.removeAllListeners();
        },
        afterEach: function() {
            window.history.replaceState(null, '', testerUrl);
        }
    });

    QUnit.cases.init(pagesProvider).test('pushState', function(data, assert) {
        const ready = assert.async();
        const instance = historyRouterFactory();

        assert.expect(1);

        instance
            .pushState(data.state)
            .then(function() {
                assert.equal(location.href, data.expected, 'The current page URL must comply to the target state');
                ready();
            })
            .catch(function() {
                assert.ok(false, 'Should not be rejected!');
                ready();
            });
    });

    QUnit.cases.init(pagesProvider).test('replace', function(data, assert) {
        const instance = historyRouterFactory();
        const ready = assert.async();

        assert.expect(1);

        instance
            .replace(data.state)
            .then(function() {
                assert.equal(location.href, data.expected, 'The current page URL must comply to the target state');
                ready();
            })
            .catch(function() {
                assert.ok(false, 'Should not be rejected!');
                ready();
            });
    });

    QUnit.test('forward', function(assert) {
        const ready = assert.async();
        const instance = historyRouterFactory();

        assert.expect(2);

        controller.on('started', function() {
            assert.ok(true, 'The controller has been started as expected');
        });

        instance
            .forward('/tao/Test/user')
            .then(function() {
                assert.equal(location.href, testerUrl, 'The current page URL must comply to the target state');
                ready();
            })
            .catch(function() {
                assert.ok(false, 'Should not be rejected!');
                ready();
            });
    });

    QUnit.test('redirect', function(assert) {
        const ready = assert.async();
        const instance = historyRouterFactory();
        const url1 = `${domain}/tao/Test/user`;
        const url2 = `${domain}/tao/Test/delivery`;

        assert.expect(3);

        instance
            .pushState(url1)
            .then(function() {
                assert.equal(location.href, url1, 'The url1 should be reached');

                return instance.redirect(url2).then(function() {
                    assert.equal(location.href, url2, 'The url2 should be reached');

                    window.history.back();

                    setTimeout(function() {
                        assert.equal(location.href, url1, 'The url1 should be restored');
                        ready();
                    }, 250);
                });
            })
            .catch(function() {
                assert.ok(false, 'Should not be rejected!');
                ready();
            });
    });

    QUnit.test('dispatch', function(assert) {
        const ready = assert.async();
        const instance = historyRouterFactory();
        const url1 = `${domain}/tao/Test/user`;
        const url2 = `${domain}/tao/Test/delivery`;

        assert.expect(3);

        instance
            .dispatch(url1, true)
            .then(function() {
                assert.equal(location.href, url1, 'The url1 should be reached');

                return instance.dispatch(url2, true).then(function() {
                    assert.equal(location.href, url2, 'The url2 should be reached');

                    instance.trigger('dispatch', url1);

                    setTimeout(function() {
                        assert.equal(location.href, url1, 'The url1 should be restored');
                        ready();
                    }, 250);
                });
            })
            .catch(function() {
                assert.ok(false, 'Should not be rejected!');
                ready();
            });
    });

    QUnit.cases.init(errorsProvider).test('dispatch', function(data, assert) {
        const instance = historyRouterFactory();
        const ready = assert.async();

        assert.expect(1);

        instance
            .dispatch(data.state)
            .then(function() {
                assert.ok(false, 'Should be rejected!');
                ready();
            })
            .catch(function() {
                assert.ok(true, 'Should be rejected!');
                ready();
            });
    });
});
