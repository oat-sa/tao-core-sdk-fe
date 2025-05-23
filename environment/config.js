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
 * Copyright (c) 2019-2024 (original work) Open Assessment Technologies SA ;
 */

define(function() {
    requirejs.config({
        baseUrl: '/',
        paths: Object.assign(
            {},
            {
                css: '/node_modules/require-css/css',
                json: '/node_modules/requirejs-plugins/src/json',
                text: '/node_modules/requirejs-plugins/lib/text',

                'qunit-parameterize': '/environment/qunit2-parameterize',
                'jquery.simulate': '/node_modules/jquery-simulate/jquery.simulate',
                qunit: '/node_modules/qunit/qunit',
                test: '/test',

                core: '/dist/core',
                util: '/dist/util',

                'jquery.mockjax': '/node_modules/jquery-mockjax/dist/jquery.mockjax',
                'idb-wrapper': '/node_modules/idb-wrapper/idbstore',
                'fetch-mock': '/node_modules/fetch-mock/es5/client-bundle',
                'xhr-mock': '/node_modules/xhr-mock/dist/xhr-mock',

                jquery: '/node_modules/jquery/jquery',
                lodash: '/node_modules/lodash/lodash',
                moment: '/node_modules/moment/min/moment-with-locales',
                handlebars: '/node_modules/handlebars/dist/handlebars.amd'
            }
        ),
        shim: {
            'jquery.simulate': {
                deps: ['jquery']
            },
            'qunit-parameterize': {
                deps: ['qunit/qunit']
            }
        },
        waitSeconds: 15
    });

    define('qunitLibs', ['qunit/qunit', 'css!qunit/qunit.css']);
    define('qunitEnv', ['qunitLibs', 'qunit-parameterize']);

    define('context', ['module'], function(module) {
        return module.config();
    });

    define('i18n', [], () => text => text);
});
