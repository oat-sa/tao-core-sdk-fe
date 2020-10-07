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
 * Copyright (c) 2018-2020 (original work) Open Assessment Technologies SA
 *
 */

/**
 * Authentication provider against the local storage.
 * To be implemented.
 *
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import 'webcrypto-shim';
import { TextEncoder } from 'fastestsmallesttextencoderdecoder';

//get the native implementation of the CryptoSubtle
const subtle = window.crypto.subtle || window.crypto.webkitSubtle;
const supportedAlgorithms = [
    'SHA-1', //considered as not safe anymore
    'SHA-256',
    'SHA-384',
    'SHA-512'
];

/**
 * Encode a buffer to an hexadecimal string
 * @param {number[]|ArrayBuffer} buffer
 * @returns {string} the hex representation of the buffer
 */
function bufferToHexString(buffer) {
    return [...new Uint8Array(buffer)]
        .map(val => `00${val.toString(16)}`.slice(-2))
        .join('');
}

/**
 * Create a hash/checksum from a given string
 * @param {string} utf8String - the string to hash
 * @param {string} [selectedAlgorithm] - hashing algorithm
 * @returns {Promise<String>} resolves with the hash of the string
 * @throws {TypeError} if the algorithm is not available or the input string is missing
 */
export default function digest(utf8String, selectedAlgorithm = 'SHA-256') {
    let algorithm = selectedAlgorithm.toUpperCase();
    if (!supportedAlgorithms.includes(algorithm)) {
        throw new TypeError(`Unsupported digest algorithm : ${algorithm}`);
    }
    if (typeof utf8String !== 'string') {
        throw new TypeError(`Please encode a string, not a ${typeof utf8String}`);
    }

    return subtle.digest(algorithm, new TextEncoder('utf-8').encode(utf8String)).then(function(buffer) {
        return bufferToHexString(buffer);
    });
}
