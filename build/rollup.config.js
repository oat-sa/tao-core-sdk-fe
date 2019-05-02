import path from 'path';
import glob from 'glob';
import alias from 'rollup-plugin-alias';
import json from 'rollup-plugin-json';
// import {uglify} from 'rollup-plugin-uglify';

const inputs = glob.sync(path.join(__dirname, '..', 'src', '**', '*.js'));
const localExternals = inputs.map(input => `${input.replace(/^.*?src\//, '').replace(/\.js/, '')}`);


module.exports = inputs.map(input => {
    const name = path.parse(input).name.replace(/\.js/, '');
    const dir = path.parse(input).dir.replace(/^.*?src/, '');
    
    return {
        input,
        output: {
            dir: path.join(__dirname, '..', 'dist', dir),
            format: 'umd',
            name
        },
        external: [
            'jquery',
            'lodash',
            'handlebars',
            'moment',
            'i18n',
            'async',
            'jquery.fileDownload',
            'module',
            'context',
            'lib/uuid',
            'lib/polyfill/es6-promise',
            'lib/polyfill/es6-collections',
            'lib/polyfill/webcrypto-shim',
            'lib/store/idbstore',
            'lib/decimal/decimal',
            'lib/expr-eval/expr-eval',
            'ui/feedback',
        ].concat(localExternals),
        plugins: [
            alias({
                resolve: ['.js', '.json', '.css', '.tpl'],
                core: path.join(__dirname, '..', 'src', 'core'),
                util: path.join(__dirname, '..', 'src', 'util')
              }),
            json({
                preferConst: false
            }),
            //   uglify()
        ]
    };
});