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
 * Copyright (c) 2018 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 *
 */
define(['core/router', 'context'], function(router, context) {
    'use strict';

    QUnit.module('API');

    QUnit.test('router', function(assert) {
        assert.equal(typeof router, 'object', 'The router module exposes and object');
    });

    QUnit.cases.init([{
        title: 'dispatch'
    }, {
        title: 'dispatchUrl'
    }, {
        title: 'parseMvcUrl'
    }, {
        title: 'loadRouteBundle'
    }, {
        title: 'loadRoute'
    }]).test('router has the method ', function(data, assert) {
        assert.equal(typeof router[data.title], 'function', 'The router object expose the method ' + data.title);
    });

    QUnit.module('Parse URl', {
        beforeEach: function setup(assert) {
            context.bundle = false;
        }
    });

    QUnit.cases.init([{
        title: 'url path',
        url: '/taoItems/Items/editItem',
        route: {
            extension: 'taoItems',
            module: 'Items',
            action: 'editItem',
            params: {}
        }
    }, {
        title: 'fully qualified url',
        url: 'https://taoce.taocloud.org/taoQtiTest/Runner/getItem',
        route: {
            extension: 'taoQtiTest',
            module: 'Runner',
            action: 'getItem',
            params: {}
        }
    }, {
        title: 'url path with encoded parameters',
        url: '/tao/Main/index?structure=delivery&ext=taoDeliveryRdf&section=manage_delivery_assembly&uri=http%3A%2F%2Ftaoce.taocloud.org%2Ftao.rdf%23i1538125384200365',
        route: {
            extension: 'tao',
            module: 'Main',
            action: 'index',
            params: {
                structure: 'delivery',
                ext: 'taoDeliveryRdf',
                section: 'manage_delivery_assembly',
                uri: 'http://taoce.taocloud.org/tao.rdf#i1538125384200365'
            }
        }
    }, {
        title: 'url without an MVC path',
        url: 'https://taoce.taocloud.org/login.php',
        route: null
    }, {
        title: 'and invalid value',
        url: 12,
        route: null
    }]).test('parse : ', function(data, assert) {
        var route = router.parseMvcUrl(data.url);
        assert.deepEqual(route, data.route, 'The given url has been parsed as expected');
    });

    QUnit.cases.init([{
        title: 'extenstion bundle',
        route: {
            extension: 'taoItems'
        },
        bundle: true,
        resolve: 'taoItems.min.js'
    }, {
        title: 'another extenstion bundle',
        route: {
            extension: 'taoTests'
        },
        bundle: true,
        resolve: 'taoTests.min.js'
    }, {
        title: 'no bundle in debug mode',
        route: {
            extension: 'taoItems'
        },
        bundle: false
    }, {
        title: 'tao is considerd loaded bundle',
        route: {
            extension: 'tao'
        },
        bundle: true
    }, {
        title: 'no route no bundle',
        route: {},
        bundle: true
    }]).test('Load route bundle : ', function(data, assert) {
        var ready = assert.async();
        context.bundle = data.bundle;

        assert.expect(1);

        router
            .loadRouteBundle(data.route)
            .then(function(result) {
                assert.equal(result, data.resolve, 'The correct bundle is loaded');
                ready();
            })
            .catch(function(err) {
                assert.ok(false, err.message);
                ready();
            });
    });

    QUnit.cases.init([{
        title: 'tao routes',
        route: {
            extension: 'tao'
        },
        resolve: {
            Main: {
                'actions': {
                    'index': 'controller/main',
                    'login': 'controller/login',
                    'test': 'test/core/router/data/taoController'
                }
            }
        }
    }, {
        title: 'no route no module',
        route: {}
    }, {
        title: 'extenstion bundle',
        route: {
            extension: 'taoItems'
        },
        resolve: {
            Item: {
                'actions': {
                    'editItems': 'controller/items/edit',
                    'test': 'test/core/router/data/taoItemsController'
                }
            }

        }
    }]).test('Load route : ', function(data, assert) {
        var ready = assert.async();
        context.bundle = data.bundle;

        assert.expect(1);

        router
            .loadRoute(data.route)
            .then(function(result) {
                assert.deepEqual(result, data.resolve, 'The correct route module is loaded');
                ready();
            })
            .catch(function(err) {
                assert.ok(false, err.message);
                ready();
            });
    });

    QUnit.test('dispatch', function(assert) {
        var ready = assert.async();
        assert.expect(2);

        assert.ok(!window.controllerStarted, 'The controllerStarted global doesnt exist');

        router.dispatch([
            '/tao/Main/test',
            '/taoItems/Item/test'
        ]).then(function() {

            //The global value is set by the controller start
            assert.deepEqual(window.controllerStarted, {
                tao: true,
                taoItems: true
            }, 'The controllerStarted global value has been set');

            ready();

        }).catch(function(err) {
            assert.ok(false, err.message);
            ready();
        });
    });
});
