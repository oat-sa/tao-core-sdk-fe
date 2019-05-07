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

requirejs.config({
    baseUrl: '/',
    paths: {
        css: 'node_modules/require-css/css.min',
        'qunit-parameterize': '/environment/qunit2-parameterize',
        qunit: '/node_modules/qunit/qunit',
        test: '/test',

        core: '/dist/core',
        lib: '/dist/lib',
        
        jquery: '/node_modules/jquery/dist/jquery.min',
        lodash: '/node_modules/lodash/lodash',
        moment: '/node_modules/moment/moment',
        handlebars: '/node_modules/handlebars/dist/handlebars.amd.min'
    },
    waitSeconds: 15
});

define('qunitLibs', ['qunit/qunit', 'css!qunit/qunit.css']);
define('qunitEnv', ['qunitLibs'], function() {
    require(['qunit-parameterize']);
});
