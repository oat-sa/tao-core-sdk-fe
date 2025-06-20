/*
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
 * Copyright (c) 2015-2019 (original work) Open Assessment Technologies SA ;
 *
 */

/**
 *
 * @author dieter <dieter@taotesting.com>
 */

const _reQuot = /"/g;
const _reApos = /'/g;

/**
 * Encodes an HTML string to be safely displayed without code interpretation
 *
 * @param {String} html
 * @returns {String}
 */
function encodeHTML(html) {
    // @see http://tinyurl.com/ko75kph
    return document.createElement('a').appendChild(document.createTextNode(html)).parentNode.innerHTML;
}

/**
 * Encodes an HTML string to be safely use inside an attribute
 *
 * @param {String} html
 * @returns {String}
 */
function encodeAttribute(html) {
    // use replaces chain instead of unified replace with map for performances reasons
    // @see http://jsperf.com/htmlencoderegex/68
    return encodeHTML(html).replace(_reQuot, '&quot;').replace(_reApos, '&apos;');
}

/**
 * Encodes a Unicode string to Base64.
 * Borrowed from MDN: https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
 * @param {String} str
 * @returns {String}
 */
function encodeBase64(str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(
        encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(match, p1) {
            return String.fromCharCode(`0x${p1}`);
        })
    );
}

/**
 * Decodes a Base64 string to Unicode string.
 * Borrowed from MDN: https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
 * @param {String} str
 * @returns {String}
 */
function decodeBase64(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(
        Array.prototype.map
            .call(atob(str), c => {
                const num = `00${c.charCodeAt(0).toString(16)}`;
                return `%${num.slice(-2)}`;
            })
            .join('')
    );
}

/**
 * Generate hash from text using SHA-256
 * @param {String} text
 * @returns {Promise<String>}
 */
async function stringToSha256(text) {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export default {
    html: encodeHTML,
    attribute: encodeAttribute,
    encodeBase64: encodeBase64,
    decodeBase64: decodeBase64,
    stringToSha256: stringToSha256
};
