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
 * Copyright (c) 2016-2019 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 */
import _ from 'lodash';
import boolean from 'core/encoder/boolean';
import number from 'core/encoder/number';
import float from 'core/encoder/float';
import time from 'core/encoder/time';
import array2str from 'core/encoder/array2str';
import str2array from 'core/encoder/str2array';
import entity from 'core/encoder/entity';

/**
 * Extract the argument in parenthesis from a function name:  "foo(a,b)" return [a,b]
 * @param {string} name - the declaration : array(a,b)
 * @returns {array} of extracted args
 */
function extractArgs(name) {
    let args = [];
    if (name.indexOf('(') > -1) {
        const matches = /\((.+?)\)/.exec(name);
        if (matches && matches.length >= 1) {
            args = matches[1].split(',');
        }
    }
    return args;
}

/**
 * Extract the name from a function declaration:   "foo(a,b)" return foo
 * @param {string} name - the declaration : foo(a,b)
 * @returns {string} the name
 */
function extractName(name) {
    if (name.indexOf('(') > -1) {
        return name.substr(0, name.indexOf('('));
    }
    return name;
}

/**
 * Provides multi sources encoding decoding
 * @exports core/encoder/encoders
 */
const encoders = {
    number: number,
    float: float,
    time: time,
    boolean: boolean,
    array2str: array2str,
    str2array: str2array,
    entity: entity,

    register(name, encode, decode) {
        if (!_.isString(name)) {
            throw new Error('An encoder must have a valid name');
        }
        if (!_.isFunction(encode)) {
            throw new Error('Encode must be a function');
        }
        if (!_.isFunction(decode)) {
            throw new Error('Decode must be a function');
        }
        this[name] = { encode, decode };
    },

    encode(name, value) {
        name = extractName(name);
        if (this[name]) {
            const encoder = this[name];
            const args = [value, ...extractArgs(name)];
            return encoder.encode(...args);
        }
        return value;
    },

    decode(name, value) {
        name = extractName(name);
        if (this[name]) {
            const decoder = this[name];
            const args = [value, ...extractArgs(name)];
            return decoder.decode(...args);
        }
        return value;
    }
};

export default encoders;
