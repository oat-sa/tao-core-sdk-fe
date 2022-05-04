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
        title: 'plain text',
        input: 'Lorem ipsum dolor sit amet',
        unlimited: 'Lorem ipsum dolor sit amet',
        limited: 'Lorem ipsum'
    }, {
        title: 'plain text with long spaces',
        input: '  Lorem    ipsum   dolor  sit   amet  ',
        unlimited: '  Lorem    ipsum   dolor  sit   amet',
        limited: '  Lorem    ipsum'
    }, {
        title: 'simple HTML',
        input: '<p>Lorem ipsum dolor sit amet</p>',
        unlimited: '<p>Lorem ipsum dolor sit amet</p>',
        limited: '<p>Lorem ipsum</p>'
    }, {
        title: 'glued HTML',
        input: '<p> Lorem </p><p> ipsum <br></p><p> dolor </p><p> sit </p><p> amet </p>',
        unlimited: '<p> Lorem </p><p> ipsum <br></p><p> dolor </p><p> sit </p><p> amet </p>',
        limited: '<p> Lorem </p><p> ipsum <br></p>'
    }]).test('limitByWordCount ', (data, assert) => {
        assert.equal(strLimiter.limitByWordCount(data.input, 5), data.unlimited, 'Limited by 5 words');
        assert.equal(strLimiter.limitByWordCount(data.input, 10), data.unlimited, 'Limited by 10 words');
        assert.equal(strLimiter.limitByWordCount(data.input, 2), data.limited, 'Limited by 2 words');
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
