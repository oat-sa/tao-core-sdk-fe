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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 *
 *
 */
define(['jquery', 'util/browser'], function ($, browser) {
    'use strict';

    QUnit.module('API');

    QUnit.test('eventifier', function (assert) {
        assert.expect(1);

        assert.ok(typeof browser.isIOs === 'function', 'the isIOs method is exposed');
    });

    let initialPlatform;
    let initialMaxTouchPoints;
    QUnit.module('Methods', {
        beforeEach() {
            initialPlatform = window.navigator.platform;
            initialMaxTouchPoints = window.navigator.maxTouchPoints;
        },
        afterEach() {
            Object.defineProperty(window.navigator, 'platform', {
                get: () => initialPlatform,
                configurable: true
            });
            Object.defineProperty(window.navigator, 'maxTouchPoints', {
                get: () => initialMaxTouchPoints,
                configurable: true
            });
            delete window.MSStream;
        }
    });

    QUnit.cases
        .init([
            { title: 'test runtime', result: false },
            {
                title: 'iphone',
                result: true,
                platform: 'iPhone'
            },
            {
                title: 'ipad',
                result: true,
                platform: 'MacIntel',
                maxTouchPoints: 2
            },
            {
                title: 'macOs',
                result: false,
                platform: 'MacIntel',
                maxTouchPoints: 0
            },
            {
                title: 'ie11 on gmail',
                result: false,
                msstream: true
            }
        ])
        .test('isIOs', function (data, assert) {
            if (typeof data.platform !== 'undefined') {
                Object.defineProperty(window.navigator, 'platform', {
                    get: () => data.platform,
                    configurable: true
                });
            }
            if (typeof data.maxTouchPoints !== 'undefined') {
                Object.defineProperty(window.navigator, 'maxTouchPoints', {
                    get: () => data.maxTouchPoints,
                    configurable: true
                });
            }
            if (typeof data.msstream !== 'undefined') {
                window.MSStream = data.msstream;
            }

            assert.expect(1);

            assert.equal(browser.isIOs(), data.result);
        });
});
