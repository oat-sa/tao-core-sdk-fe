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
 * Copyright (c) 2018-2024 (original work) Open Assessment Technologies SA
 *
 */

/**
 * Authentication provider against the local storage.
 * To be implemented.
 *
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */

//get the native implementation of the CryptoSubtle
const subtle = window.crypto.subtle;
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
    return [...new Uint8Array(buffer)].map(val => `00${val.toString(16)}`.slice(-2)).join('');
}

/**
 * Create a hash/checksum from a given string, blob or buffer
 * @param {string|Blob|ArrayBuffer|Uint8Array} data - the data to hash
 * @param {string} [selectedAlgorithm] - hashing algorithm
 * @returns {Promise<String>} resolves with the hash of the string
 * @throws {TypeError} if the algorithm is not available or the input string is missing
 */
export default function digest(data, selectedAlgorithm = 'SHA-256') {
    let algorithm = selectedAlgorithm.toUpperCase();
    if (!supportedAlgorithms.includes(algorithm)) {
        throw new TypeError(`Unsupported digest algorithm : ${algorithm}`);
    }

    let dataPromise;
    if (data instanceof Uint8Array) {
        dataPromise = Promise.resolve(data);
    } else if (data instanceof ArrayBuffer) {
        dataPromise = Promise.resolve(new Uint8Array([data]));
    } else if (data instanceof Blob) {
        dataPromise = new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener('loadend', () => resolve(reader.result));
            reader.addEventListener('abort', reject);
            reader.addEventListener('error', reject);
            reader.readAsArrayBuffer(data);
        });
    } else if (typeof data === 'string') {
        dataPromise = Promise.resolve(new TextEncoder().encode(data));
    } else {
        throw new TypeError(`Unsupported data type to digest with ${algorithm}`);
    }

    return dataPromise.then(rawData => subtle.digest(algorithm, rawData)).then(buffer => bufferToHexString(buffer));
}
