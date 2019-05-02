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

const glob = require('glob');
const path = require('path');
const { runQunitPuppeteer, printResultSummary, printFailedTests } = require('node-qunit-puppeteer');
const webpack = require('webpack');
const webpackDevServer = require('webpack-dev-server');

const config = require('./webpack.config.test');
const { testDir, testOutputDir, outputDir } = require('./path');

const TESTNAME = process.argv[2] || '*';

const webpackConfig = config('development', TESTNAME);
const server = new webpackDevServer(webpack(webpackConfig), webpackConfig.devServer);

const HOST = '127.0.0.1' || process.env.HOST;
const PORT = '8082' || process.env.PORT;

let hasFailed = false;

server.listen(PORT, HOST, err => {
    if (err) {
        console.log(err);
        process.exit(-1);
    }

    Promise.all(
        glob.sync(path.join(testDir, '**', TESTNAME, '**', '*.html')).map(testFile => {
            const test = path.relative(testDir, testFile);
            const qunitArgs = {
                // Path to qunit tests suite
                targetUrl: `http://${HOST}:${PORT}/${test}`,
                // (optional, 30000 by default) global timeout for the tests suite
                timeout: 10000,
                // (optional, false by default) should the browser console be redirected or not
                redirectConsole: true
            };

            return runQunitPuppeteer(qunitArgs)
                .then(result => {
                    printResultSummary(result, console);

                    if (result.stats.failed > 0) {
                        printFailedTests(result, console);
                        hasFailed = true;
                    }
                })
                .catch(ex => {
                    console.error(ex);
                });
        })
    ).then(() => {
        process.exit(hasFailed ? -1 : 0);
    });
});
