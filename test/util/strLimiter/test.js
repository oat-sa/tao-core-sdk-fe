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
 * Copyright (c) 2018-2022 Open Assessment Technologies SA
 */
define(['util/strLimiter'], function(strLimiter) {
    'use strict';

    QUnit.module('strLimiter');

    QUnit.cases.init([{
        title: 'input already at the limit',
        limit: 5,
        input: 'Lorem ipsum dolor sit amet',
        expected: 'Lorem ipsum dolor sit amet'
    }, {
        title: 'input below the limit',
        limit: 10,
        input: 'Lorem ipsum dolor sit amet',
        expected: 'Lorem ipsum dolor sit amet'
    }, {
        title: 'input above the limit',
        limit: 2,
        input: 'Lorem ipsum dolor sit amet',
        expected: 'Lorem ipsum'
    }, {
        title: 'input already at the limit - with long spaces',
        limit: 5,
        input: 'Lorem    ipsum   dolor  sit   amet',
        expected: 'Lorem    ipsum   dolor  sit   amet'
    }, {
        title: 'input below the limit - with long spaces',
        limit: 10,
        input: 'Lorem    ipsum   dolor  sit   amet',
        expected: 'Lorem    ipsum   dolor  sit   amet'
    }, {
        title: 'input above the limit - with long spaces',
        limit: 2,
        input: 'Lorem    ipsum   dolor  sit   amet',
        expected: 'Lorem    ipsum'
    }]).test('limitByWordCount ', (data, assert) => {
        assert.equal(strLimiter.limitByWordCount(data.input, data.limit), data.expected, `Limit by ${data.limit} words`);
    });

    QUnit.cases.init([{
        title: 'input already at the limit',
        limit: 26,
        input: 'Lorem ipsum dolor sit amet',
        expected: 'Lorem ipsum dolor sit amet'
    }, {
        title: 'input below the limit',
        limit: 100,
        input: 'Lorem ipsum dolor sit amet',
        expected: 'Lorem ipsum dolor sit amet'
    }, {
        title: 'input above the limit',
        limit: 11,
        input: 'Lorem ipsum dolor sit amet',
        expected: 'Lorem ipsum'
    }]).test('limitByCharCount ', (data, assert) => {
        assert.equal(strLimiter.limitByCharCount(data.input, data.limit), data.expected, `Limit by ${data.limit} characters`);
    });
});
