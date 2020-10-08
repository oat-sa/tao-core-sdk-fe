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
 * Copyright (c) 2018 (original work) Open Assessment Technologies SA
 *
 */

/**
 * Test the digest module
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
define(['core/digest'], function(digest) {
    'use strict';

    const hello = new Uint8Array([72, 101, 108, 108, 111]); // "Hello" in binary
    const blob = new Blob([hello], { type: 'text/plain' });
    const file = new File([hello], 'hello.txt',  { type: 'text/plain' });

    QUnit.module('API');

    QUnit.test('module', assert => {
        assert.equal(typeof digest, 'function', 'The module exposes an function');
    });

    QUnit.module('Behavior');

    QUnit.test('valid inputs', assert => {
        assert.throws(
            () => digest(),
            TypeError,
            'An input string is required'
        );

        assert.throws(
            () => digest({}),
            TypeError,
            'An input string is required'
        );

        assert.throws(
            () => digest(null),
            TypeError,
            'A valid input is required'
        );

        assert.throws(
            () => digest('foo', 'MD5'),
            TypeError,
            'A valid algorithm is required'
        );

        //Do not throw
        digest('foo');
    });

    QUnit.cases
        .init([
            {
                title: 'short text SHA-1',
                input: 'lorem',
                algo: 'SHA-1',
                output: 'b58e92fff5246645f772bfe7a60272f356c0151a'
            },
            {
                title: 'short text default algo (SHA-256)',
                input: 'lorem',
                output: '3400bb495c3f8c4c3483a44c6bc1a92e9d94406db75a6f27dbccc11c76450d8a'
            },
            {
                title: 'short text lower case algo',
                input: 'lorem',
                algo: 'sha-256',
                output: '3400bb495c3f8c4c3483a44c6bc1a92e9d94406db75a6f27dbccc11c76450d8a'
            },
            {
                title: 'long text SHA-256',
                input: 'Earum nobis nulla veniam aut sapiente vel. Voluptate praesentium sed et beatae',
                algo: 'SHA-256',
                output: '2dc12c750a45d5bd7b51ec9186a4be0e07e70b11218efe471d4677b66034b303'
            },
            {
                title: 'long text SHA-512',
                input: 'Earum nobis nulla veniam aut sapiente vel. Voluptate praesentium sed et beatae',
                algo: 'SHA-512',
                output:
                    '00d7c8367e02fb59989bb05fa86421d7afbbf397b0babc2d2f2fb02da9ec65092e782242ac47a912de2d9e6979c543c1b42a93f2ca258a07f0095e67d28571e6'
            },
            {
                title: 'sha256 from blob',
                input: blob,
                algo: 'SHA-256',
                output: '185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969'
            },
            {
                title: 'sha256 from file',
                input: file,
                algo: 'SHA-256',
                output: '185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969'
            },
            {
                title: 'sha256 from ArrayBuffer',
                input: hello.buffer,
                algo: 'SHA-256',
                output: '6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d'
            },
            {
                title: 'sha256 from Uint8Array',
                input: hello,
                algo: 'SHA-256',
                output: '185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969'
            },
        ])
        .test('digest', function(data, assert) {
            var ready = assert.async();

            assert.expect(1);

            digest(data.input, data.algo)
                .then(function(hash) {
                    assert.equal(hash, data.output, 'The generated hash matches');
                    ready();
                })
                .catch(function(err) {
                    assert.ok(false, err.message);
                    ready();
                });
        });
});
