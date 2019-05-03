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

const path = require('path');
const glob = require('glob');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const { testDir, outputDir, testOutputDir } = require('./path');

module.exports = (mode = 'development', testName) => {
    // if no specific test defined, run all of them
    if (typeof testName !== 'string') {
        testName = '*';
    }

    // collect tests
    const tests = glob.sync(path.join(testDir, '**', testName, '**', '*.js')).reduce((memo, test) => {
        const testDirName = path.dirname(path.relative(testDir, test));
        const testFileName = path.basename(test, '.js');
        memo[`${testDirName}/${testFileName}`] = test;
        return memo;
    }, {});

    // is there any tests
    if (Object.keys(tests).length === 0) {
        console.error('No tests were found!');
        process.exit();
    }

    return {
        entry: tests,
        mode,
        output: {
            path: testOutputDir
        },
        module: {
            rules: [
                {
                    test: /qunit/,
                    use: [{ loader: 'file-loader' }]
                }
            ]
        },
        externals: ['vertx', 'lib/store/idbstore', 'fs'],
        plugins: [].concat(
            Object.keys(tests).map(
                test =>
                    new HtmlWebpackPlugin({
                        filename: `${path.dirname(test)}/test.html`,
                        template: path.join(testDir, path.dirname(test), 'test.html'),
                        inject: false
                    })
            )
        ),
        resolve: {
            alias: {
                core: path.resolve(outputDir, 'core'),
                es5lib: path.resolve(outputDir, 'es5lib'),
                'lib/uuid': path.resolve(outputDir, 'es5lib', 'uuid'),
                module: path.resolve(__dirname, 'module'),
                'qunit-parameterize': path.resolve(__dirname, '..', 'qunit', 'qunit2-parameterize.js')
            }
        },
        devServer: {
            contentBase: [testOutputDir, outputDir],
            watchContentBase: true,
            compress: false,
            publicPath: '/',
            hot: false,
            host: '0.0.0.0',
            disableHostCheck: true,
            stats: false
        }
    };
};
