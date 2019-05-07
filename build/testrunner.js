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
const promiseLimit = require('promise-limit');
const HttpServer = require('http-server');
const fs = require('fs');

const { testDir } = require('./path');

const TESTNAME = process.argv[2] || '*';

const HOST = '127.0.0.1' || process.env.HOST;
const PORT = '8082' || process.env.PORT;

let hasFailed = false;
const limit = promiseLimit(5);

new HttpServer.createServer({
    before: [
        function(req, res) {
            if (req.method === 'POST') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                fs.readFile(path.join(__dirname, '..', req.url), (err, data) => {
                    if (err) throw err;
                    res.end(data.toString());
                  });
            } else {
                res.emit('next');
            }
        }
    ]
}).listen(PORT, HOST, err => {
    if (err) {
        console.log(err);
        process.exit(-1);
    }
    Promise.all(
        glob.sync(path.join(testDir, '**', TESTNAME, '**', '*.html')).map(testFile => {
            const test = path.relative(testDir, testFile);
            const qunitArgs = {
                // Path to qunit tests suite
                targetUrl: `http://${HOST}:${PORT}/test/${test}`,
                // (optional, 30000 by default) global timeout for the tests suite
                timeout: 30000,
                // (optional, false by default) should the browser console be redirected or not
                redirectConsole: true
            };

            return limit(() =>
                runQunitPuppeteer(qunitArgs)
                    .then(result => {
                        printResultSummary(result, console);

                        if (result.stats.failed > 0) {
                            printFailedTests(result, console);
                            hasFailed = true;
                        }
                    })
                    .catch(ex => {
                        console.error(testFile);
                        console.error(ex);
                    })
            );
        })
    ).then(() => {
        process.exit(hasFailed ? -1 : 0);
    });
});
