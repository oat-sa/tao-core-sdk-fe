/*/**
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
 * Copyright (c) 2022 (original work) Open Assessment Technologies SA ;
 */
define(['util/converter'], function (converter) {
    'use strict';

    QUnit.module('converter');

    QUnit.test('module', function (assert) {
        assert.equal(typeof converter, 'object', 'The module exposes an object');
    });

    QUnit.cases
        .init([
            { title: 'convert' },
            { title: 'register' },
            { title: 'unregister' },
            { title: 'clear' },
            { title: 'isRegistered' }
        ])
        .test('has API ', function (data, assert) {
            assert.equal(typeof converter[data.title], 'function', `The converter exposes a "${data.title}" function`);
        });

    QUnit.test('allows to replace the list of ambiguous signs', function (assert) {
        const ambiguousSymbols = {
            i: '1',
            e: '3',
            a: '4'
        };
        const text = '０this is a test０';
        const expected = '０th1s 1s 4 t3st０';

        assert.equal(
            converter.convert(text, { ambiguousSymbols }),
            expected,
            'The text is converted using the provided list only'
        );
    });

    QUnit.cases
        .init([
            { title: '42', expected: '42' },
            { title: '４２', expected: '42' },
            { title: '4２', expected: '42' },
            { title: '４2', expected: '42' },
            { title: 'this is a test', expected: 'this is a test' },
            { title: '42 is the answer', expected: '42 is the answer' },
            { title: '４２ is the answer', expected: '42 is the answer' },
            { title: 'the answer is ４２', expected: 'the answer is 42' },
            {
                title: 'japanese １２３４５６７８９０ ascii 1234567890',
                expected: 'japanese 1234567890 ascii 1234567890'
            }
        ])
        .test('converts ', function (data, assert) {
            assert.strictEqual(
                converter.convert(data.title),
                data.expected,
                `The converter converts "${data.title}" into ${data.expected}`
            );
        });
});
