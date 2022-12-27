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

/**
 * Default mapping from ambiguous characters to ASCII.
 * @type {object}
 */
const defaultMapping = {
    '０': '0',
    '１': '1',
    '２': '2',
    '３': '3',
    '４': '4',
    '５': '5',
    '６': '6',
    '７': '7',
    '８': '8',
    '９': '9',
    '−': '-',
    '‐':'-',
    '―':'-',
    '-':'-'
};

/**
 * Converter processor to register with the converter produce by 'util/converter/factory'.
 *
 * Processor that converts ambiguous unicode symbols into plain ASCII equivalent.
 *
 * @export 'util/converter/ambiguousSymbols'
 */
export default {
    name: 'ambiguousSymbols',

    /**
     * Converts ambiguous unicode symbols into plain ASCII equivalent.
     * @param {string} text - The text to convert.
     * @param {object} [config] - An optional config object that may contain processor specific configuration.
     * @param {object} [config.ambiguousSymbols] - A specific mapping of ambiguous symbols to plain ASCII chars.
     *                                           If omitted the default list will be taken.
     * @returns {string} - Returns the converted text.
     */
    convert(text, { ambiguousSymbols } = {}) {
        let mapping = ambiguousSymbols;

        if ('object' !== typeof mapping) {
            mapping = defaultMapping;
        }

        let result = '';
        for (const char of text) {
            result += mapping[char] || char;
        }

        return result;
    }
};
