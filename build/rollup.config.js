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

import path from 'path';
import glob from 'glob';
import alias from 'rollup-plugin-alias';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import commonJS from 'rollup-plugin-commonjs';

const { srcDir, outputDir } = require('./path');

const inputs = glob.sync(path.join(srcDir, '**', '*.js'));
const inputGlobalNames = inputs.reduce((memo, input) => {
    const moduleName = path.relative(srcDir, input).replace(/\.js$/, '');
    return { ...memo, [moduleName]: moduleName };
}, {});

const localExternals = inputs.map(input =>
    path
        .relative(srcDir, input)
        .replace(/\\/g, '/')
        .replace(/\.js$/, '')
);

export default inputs.map(input => {
    const name = path.relative(srcDir, input).replace(/\.js$/, '');
    const dir = path.dirname(path.relative(srcDir, input));

    return {
        input,
        output: {
            dir: path.join(outputDir, dir),
            format: 'umd',
            name,
            globals: {
                jquery: '$',
                lodash: '_',
                context: 'context',
                module: 'module',
                moment: 'moment',
                i18n: '__',
                async: 'async',
                handlebars: 'handlebars',
                'idb-wrapper': 'IDBStore',
                'lib/uuid': 'lib/uuid',
                'lib/decimal/decimal': 'lib/decimal/decimal',
                'lib/expr-eval/expr-eval': 'lib/expr-eval/expr-eval',
                'webcrypto-shim': 'webcrypto-shim',
                ...inputGlobalNames
            }
        },
        external: [
            ...localExternals,
            'async',
            'context',
            'handlebars',
            'i18n',
            'jquery',
            'jquery.fileDownload',
            'lib/decimal/decimal',
            'lib/expr-eval/expr-eval',
            'lib/uuid',
            'lodash',
            'module',
            'moment'
        ],
        plugins: [
            resolve(),
            commonJS(),
            alias({
                resolve: ['.js', '.json'],
                core: path.resolve(srcDir, 'core'),
                util: path.resolve(srcDir, 'util')
            }),
            json({
                preferConst: false
            })
        ]
    };
});
