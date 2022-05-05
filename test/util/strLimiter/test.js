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
define(['util/strLimiter'], function (strLimiter) {
    'use strict';

    QUnit.module('strLimiter');

    QUnit.cases
        .init([
            {
                title: 'plain text',
                input: 'Lorem ipsum dolor sit amet',
                unlimited: 'Lorem ipsum dolor sit amet',
                limited: 'Lorem ipsum'
            },
            {
                title: 'plain text with long spaces',
                input: '  Lorem    ipsum   dolor  sit   amet  ',
                unlimited: '  Lorem    ipsum   dolor  sit   amet',
                limited: '  Lorem    ipsum'
            },
            {
                title: 'simple HTML',
                input: '<p>Lorem ipsum dolor sit amet</p>',
                unlimited: '<p>Lorem ipsum dolor sit amet</p>',
                limited: '<p>Lorem ipsum</p>'
            },
            {
                title: 'glued HTML',
                input: '<p> Lorem </p><p> ipsum <br></p><p> dolor </p><p> sit </p><p> amet </p>',
                unlimited: '<p> Lorem </p><p> ipsum <br></p><p> dolor </p><p> sit </p><p> amet </p>',
                limited: '<p> Lorem </p><p> ipsum <br></p>'
            }
        ])
        .test('limitByWordCount ', (data, assert) => {
            assert.equal(strLimiter.limitByWordCount(data.input, 5), data.unlimited, 'Limited by 5 words');
            assert.equal(strLimiter.limitByWordCount(data.input, 10), data.unlimited, 'Limited by 10 words');
            assert.equal(strLimiter.limitByWordCount(data.input, 2), data.limited, 'Limited by 2 words');
            assert.equal(strLimiter.limitByWordCount(data.input, 0), '', 'Limited by 0 words');
            assert.equal(strLimiter.limitByWordCount(data.input, -2), '', 'Limited by negative value');
        });

    QUnit.cases
        .init([
            {
                title: 'plain text',
                length: 26,
                limit: 11,
                input: 'Lorem ipsum dolor sit amet',
                unlimited: 'Lorem ipsum dolor sit amet',
                limited: 'Lorem ipsum'
            },
            {
                title: 'plain text with long spaces',
                length: 38,
                limit: 19,
                input: '  Lorem    ipsum   dolor  sit   amet  ',
                unlimited: '  Lorem    ipsum   dolor  sit   amet  ',
                limited: '  Lorem    ipsum   '
            },
            {
                title: 'plain text with entities',
                length: 36,
                limit: 14,
                input: 'Lorem &nbsp;&nbsp; ipsum &nbsp; dolor &eacute; sit &agrave; amet',
                unlimited: 'Lorem &nbsp;&nbsp; ipsum &nbsp; dolor &eacute; sit &agrave; amet',
                limited: 'Lorem &nbsp;&nbsp; ipsum'
            },
            {
                title: 'simple HTML',
                length: 26,
                limit: 11,
                input: '<p>Lorem ipsum dolor sit amet</p>',
                unlimited: '<p>Lorem ipsum dolor sit amet</p>',
                limited: '<p>Lorem ipsum</p>'
            },
            {
                title: 'glued HTML',
                length: 32,
                limit: 14,
                input: '<p> Lorem </p><p> ipsum <br></p><p> dolor </p><p> sit </p><p> amet </p>',
                unlimited: '<p> Lorem </p><p> ipsum <br></p><p> dolor </p><p> sit </p><p> amet </p>',
                limited: '<p> Lorem </p><p> ipsum <br></p>'
            },
            {
                title: 'simple HTML with entities',
                length: 36,
                limit: 14,
                input: '<p>Lorem &nbsp;&nbsp; ipsum &nbsp; dolor &nbsp; sit &nbsp; amet</p>',
                unlimited: '<p>Lorem &nbsp;&nbsp; ipsum &nbsp; dolor &nbsp; sit &nbsp; amet</p>',
                limited: '<p>Lorem &nbsp;&nbsp; ipsum</p>'
            }
        ])
        .test('limitByCharCount ', (data, assert) => {
            assert.equal(
                strLimiter.limitByCharCount(data.input, data.length),
                data.unlimited,
                `Limit by ${data.length} characters`
            );
            assert.equal(strLimiter.limitByCharCount(data.input, 100), data.unlimited, `Limit by 100 characters`);
            assert.equal(
                strLimiter.limitByCharCount(data.input, data.limit),
                data.limited,
                `Limit by ${data.limit} characters`
            );
            assert.equal(strLimiter.limitByCharCount(data.input, 0), '', 'Limit by 0 characters');
            assert.equal(strLimiter.limitByCharCount(data.input, -2), '', 'Limit by  negative value');
        });
});
