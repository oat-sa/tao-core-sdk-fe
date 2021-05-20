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
 * Copyright (c) 2016-2021 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 *
 * @author Ivan Klimchuk <klimchuk@1pt.com>
 */
define([
    'module',
    'moment',
    'util/locale'
], function(module, moment, locale) {
    // All tests are grouped in one module because global state is changed during them
    QUnit.module('API');

    QUnit.test('util api, different locales', assert => {
        // American style
        locale.setConfig({
            decimalSeparator: '.',
            thousandsSeparator: ','
        });

        assert.equal(locale.getDecimalSeparator(), '.', 'Default decimal separator');
        assert.equal(locale.getThousandsSeparator(), ',', 'Default thousands separator');

        assert.ok(isNaN(locale.parseFloat('')), 'empty input');
        assert.equal(locale.parseFloat('6.123'), 6.123, 'the valid float value with dot as decimal separator');
        assert.equal(locale.parseFloat('6,123'), 6123.0, 'the valid float value with comma as thousands separator');
        assert.equal(
            locale.parseFloat('6,000.123'),
            6000.123,
            'the valid float value with dot as decimal separator and comma as thousands separator'
        );
        assert.equal(
            locale.parseFloat('.6'),
            0.6,
            'the valid float value with dot as decimal separator, no leading zero'
        );
        assert.equal(locale.parseFloat('-6.5'), -6.5, 'negative float using decimal separator');
        assert.equal(locale.parseFloat('-.6'), -0.6, 'negative float using decimal separator, no leading zero');
        assert.equal(locale.parseFloat('-6,789.5'), -6789.5, 'negative float using thousands and decimal separator');
        assert.equal(locale.parseFloat('314e-2'), 3.14, 'float with negative exponent notation');
        assert.equal(locale.parseFloat('0.0314E+2'), 3.14, 'float with positive exponent notation');
        assert.equal(
            locale.parseFloat('3.14more non-digit characters'),
            3.14,
            'float with invalid trailing characters'
        );

        assert.ok(isNaN(locale.parseInt('')), 'empty input');
        assert.equal(locale.parseInt('6000'), 6000, 'the valid integer value without separators');
        assert.equal(locale.parseInt('6.000'), 6, 'the valid integer value with dot as decimal separator');
        assert.equal(locale.parseInt('6,000'), 6000, 'the valid integer value with comma as thousands separator');
        assert.equal(
            locale.parseInt('6,000.123'),
            6000,
            'the valid integer value with dot as decimal separator and comma as thousands separator'
        );

        // Other style
        locale.setConfig({
            decimalSeparator: ',',
            thousandsSeparator: ''
        });

        assert.equal(locale.parseFloat('6.123'), 6.0, 'float value with invalid decimal separator');
        assert.equal(locale.parseFloat('6,123'), 6.123, 'the valid float value with comma as decimal separator');
        assert.equal(locale.parseFloat('6,000.123'), 6.0, 'the valid float value with comma as decimal separator');
        assert.equal(
            locale.parseFloat(',6'),
            0.6,
            'the valid float value with comma as decimal separator, no leading zero'
        );
        assert.equal(locale.parseFloat('-6,5'), -6.5, 'negative float using decimal separator');
        assert.equal(locale.parseFloat('-,6'), -0.6, 'negative float using decimal separator, no leading zero');
        assert.equal(locale.parseFloat('-6.789,5'), -6, 'negative float using invalid thousands separator');

        assert.equal(locale.parseInt('6000'), 6000, 'the valid integer value without separators');
        assert.equal(locale.parseInt('6.000'), 6, 'the valid integer value with dot as decimal separator');
        assert.equal(locale.parseInt('6,000'), 6, 'the valid integer value with comma as thousands separator');
        assert.equal(
            locale.parseInt('6,000.123'),
            6,
            'the valid integer value with dot as decimal separator and comma as thousands separator'
        );
    });

    QUnit.test('util/formatDateTime', assert => {
        const ready = assert.async();
        const expectedTimestamp = 1621641600;
        const expectedOptions = 'X';

        Promise.resolve()
            .then(() => {
                const expectedOutput = '05/21/2021';

                moment.off('.test');

                const promises = [
                    new Promise(resolve => {
                        moment.on('moment.test', (ts, options) => {
                            assert.ok(true, 'Local timezone applied!');
                            assert.equal(ts, expectedTimestamp, 'The expected timestamp has been supplied');
                            assert.equal(options, expectedOptions, 'The expected options have been supplied');
                            resolve();
                        });

                        moment.on('utc.test', (ts, options) => {
                            assert.ok(false, 'UTC timezone should not be applied!');
                            assert.equal(ts, expectedTimestamp, 'The expected timestamp has been supplied');
                            assert.equal(options, expectedOptions, 'The expected options have been supplied');
                            resolve();
                        });
                    }),
                    new Promise(resolve => {
                        moment.on('format.test', () => {
                            assert.ok(true, 'Local format applied');
                            resolve();
                        });
                    })
                ];

                moment.mockFormat(expectedOutput);
                assert.equal(locale.formatDateTime(expectedTimestamp), expectedOutput, 'Format date/time to locale using user timezone');

                return promises;
            })
            .then(() => {
                const expectedOutput = '05/22/2021';

                moment.off('.test');

                const promises = [
                    new Promise(resolve => {
                        moment.on('moment.test', (ts, options) => {
                            assert.ok(false, 'Local timezone should not be applied!');
                            assert.equal(ts, expectedTimestamp, 'The expected timestamp has been supplied');
                            assert.equal(options, expectedOptions, 'The expected options have been supplied');
                            resolve();
                        });

                        moment.on('utc.test', (ts, options) => {
                            assert.ok(true, 'UTC timezone applied!');
                            assert.equal(ts, expectedTimestamp, 'The expected timestamp has been supplied');
                            assert.equal(options, expectedOptions, 'The expected options have been supplied');
                            resolve();
                        });
                    }),
                    new Promise(resolve => {
                        moment.on('format.test', () => {
                            assert.ok(true, 'Local format applied');
                            resolve();
                        });
                    })
                ];

                moment.mockFormat(expectedOutput);
                assert.equal(locale.formatDateTime(expectedTimestamp, true), expectedOutput, 'Format date/time to locale using UTC timezone');

                return promises;
            })
            .catch(err => {
                assert.pushResult({
                    result: false,
                    message: err
                });
            })
            .then(ready);
    });
});
