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
 * Copyright (c) 2022 (original work) Open Assessment Technologies SA ;
 */
define(['util/converter/factory'], function (converterFactory) {
    'use strict';

    QUnit.module('converter factory');

    QUnit.test('module', function (assert) {
        assert.equal(typeof converterFactory, 'function', 'The module exposes a function');
        assert.equal(typeof converterFactory(), 'object', 'The factory produces an object');
        assert.notStrictEqual(
            converterFactory(),
            converterFactory(),
            'The factory provides a different function on each call'
        );
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
            const converter = converterFactory();

            assert.equal(typeof converter[data.title], 'function', `The converter exposes a "${data.title}" function`);
        });

    QUnit.test('registers a converter processor', function (assert) {
        const converter = converterFactory();

        const processor = {
            name: 'test',
            convert() {}
        };

        assert.strictEqual(converter.isRegistered('test'), false, 'The processor is not yet registered');
        assert.strictEqual(converter.register(processor), converter, 'The register API is chainable');
        assert.strictEqual(converter.isRegistered('test'), true, 'The processor is now registered');
    });

    QUnit.test('validates a converter processor', function (assert) {
        const converter = converterFactory();

        const processor = {
            name: 'test',
            convert() {}
        };

        assert.throws(() => converter.register(true), 'A processor is a plain object');
        assert.throws(() => converter.register({ convert() {} }), 'A processor needs a name');
        assert.throws(() => converter.register({ name: '', convert() {} }), 'The processor name cannot be empty');
        assert.throws(() => converter.register({ name: true, convert() {} }), 'The processor name must be a string');
        assert.throws(() => converter.register({ name: 'test' }), 'A processor needs a runtime');
        assert.throws(
            () => converter.register({ name: 'test', convert: true }),
            'The processor runtime must be a function'
        );

        converter.register(processor);
        assert.throws(() => converter.register(processor), 'The processor cannot be registered twice');
    });

    QUnit.test('unregisters a converter processor', function (assert) {
        const converter = converterFactory();

        const processor1 = {
            name: 'test',
            convert() {}
        };
        const processor2 = {
            name: 'foo',
            convert() {}
        };

        converter.register(processor1);
        converter.register(processor2);

        assert.strictEqual(converter.isRegistered('test'), true, 'The processor "test" is registered');
        assert.strictEqual(converter.isRegistered('foo'), true, 'The processor "foo" is registered');
        assert.strictEqual(converter.unregister(processor1), converter, 'A processor can be removed by reference');
        assert.strictEqual(converter.isRegistered('test'), false, 'The processor "test" has been unregistered');
        assert.strictEqual(converter.isRegistered('foo'), true, 'The processor "foo" is still registered');
        assert.strictEqual(converter.unregister(processor2.name), converter, 'A processor can be removed by name');
        assert.strictEqual(converter.isRegistered('foo'), false, 'The processor "foo" has been unregistered');
    });

    QUnit.test('clears the list of processors', function (assert) {
        const converter = converterFactory();

        const processor1 = {
            name: 'test',
            convert() {}
        };
        const processor2 = {
            name: 'foo',
            convert() {}
        };

        converter.register(processor1);
        converter.register(processor2);

        assert.strictEqual(converter.isRegistered('test'), true, 'The processor "test" is registered');
        assert.strictEqual(converter.isRegistered('foo'), true, 'The processor "foo" is registered');
        assert.strictEqual(converter.clear(), converter, 'The clear API is chainable');
        assert.strictEqual(converter.isRegistered('test'), false, 'The processor "test" has been unregistered');
        assert.strictEqual(converter.isRegistered('foo'), false, 'The processor "foo" has been unregistered');
    });

    QUnit.test('registers built-in processors', function (assert) {
        const processor1 = {
            name: 'test',
            convert() {}
        };
        const processor2 = {
            name: 'foo',
            convert() {}
        };
        const converter = converterFactory([processor1, processor2]);

        assert.strictEqual(converter.isRegistered('test'), true, 'The processor "test" is registered');
        assert.strictEqual(converter.isRegistered('foo'), true, 'The processor "foo" is registered');
    });

    QUnit.test('returns text if no processor is registered', function (assert) {
        const converter = converterFactory();
        const text = '1234 this is a test!';

        assert.strictEqual(converter.convert(text), text, 'The text is returned intact');
    });

    QUnit.test('converts text with respect to the processors', function (assert) {
        const text = '12,34 this is a test!';
        const converter = converterFactory([
            {
                name: 'comma',
                convert(str) {
                    return str.replace(/,+/g, '.');
                }
            }
        ]);

        assert.strictEqual(converter.convert(text), '12.34 this is a test!', 'The text is converted');
    });

    QUnit.test('does not converts the text if the processors cannot apply', function (assert) {
        const text = 'this is a test!';
        const converter = converterFactory([
            {
                name: 'comma',
                convert(str) {
                    return str.replace(/,+/g, '.');
                }
            }
        ]);

        assert.strictEqual(converter.convert(text), 'this is a test!', 'The text is converted');
    });

    QUnit.test('converts text applying each processor in order', function (assert) {
        const text = '12,34 this is a test!';
        const converter = converterFactory([
            {
                name: 'comma',
                convert(str) {
                    return str.replace(/,+/g, '');
                }
            },
            {
                name: 'number',
                convert(str) {
                    return str.replace(/\d+/, '');
                }
            }
        ]);

        assert.strictEqual(converter.convert(text), ' this is a test!', 'The text is converted');
    });

    QUnit.test('forward builtin config to the processors', function (assert) {
        const text = '12,34 this is a test!';
        const converter = converterFactory(
            [
                {
                    name: 'comma',
                    convert(str, { separator = '.' } = {}) {
                        return str.replace(/,+/g, separator);
                    }
                }
            ],
            { separator: ':' }
        );

        assert.strictEqual(converter.convert(text), '12:34 this is a test!', 'The text is converted');
    });

    QUnit.test('forward runtime config to the processors', function (assert) {
        const text = '12,34 this is a test!';
        const converter = converterFactory([
            {
                name: 'comma',
                convert(str, { separator = '.' } = {}) {
                    return str.replace(/,+/g, separator);
                }
            }
        ]);

        assert.strictEqual(
            converter.convert(text, { separator: ':' }),
            '12:34 this is a test!',
            'The text is converted'
        );
    });

    QUnit.test('merge builtin and runtime config', function (assert) {
        const text = '12,34 this is a test!';
        const converter = converterFactory(
            [
                {
                    name: 'comma',
                    convert(str, { separator = '.' } = {}) {
                        return str.replace(/,+/g, separator);
                    }
                }
            ],
            { separator: ':' }
        );

        assert.strictEqual(
            converter.convert(text, { separator: '-' }),
            '12-34 this is a test!',
            'The text is converted'
        );
    });
});
