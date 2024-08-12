/**
 * UUID generator
 *
 * This is a modified version of Robert Kieffer's Math.uuid
 * from http://www.broofa.com/2008/09/javascript-uuid-function/
 *
 * It differs in three ways from the original work:
 * - uuid is no longer attached to the Math object
 * - script is now written in require.js style
 * - alternative implementations have been removed
 *
 * Additionally the usage examples have been adapted to reflect these changes.
 *
 * Original credits:
 * Math.uuid.js (v1.4)
 * http://www.broofa.com
 * mailto:robert@broofa.com
 *
 * Copyright (c) 2010 Robert Kieffer
 * Dual licensed under the MIT and GPL licenses.
 *
 */

// Private array of chars to use
const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

/**
 * Generate a random uuid
 *
 * USAGE: uuid(length, radix)
 *   length - the desired number of characters
 *   radix  - the number of allowable values for each character.
 *
 * EXAMPLES:
 *   // No arguments  - returns RFC4122, version 4 ID
 *   >>> uuid()
 *   "92329D39-6F5C-4520-ABFC-AAB64544E172"
 *
 *   // One argument - returns ID of the specified length
 *   >>> uuid(15)     // 15 character ID (default base=62)
 *   "VcydxgltxrVZSTV"
 *
 *   // Two arguments - returns ID of the specified length, and radix. (Radix must be <= 62)
 *   >>> uuid(8, 2)  // 8 character ID (base=2)
 *   "01001010"
 *   >>> uuid(8, 10) // 8 character ID (base=10)
 *   "47473046"
 *   >>> uuid(8, 16) // 8 character ID (base=16)
 *   "098F4D35"
 *
 * @param {number} len
 * @param {number} radix
 * @returns {*}
 * @private
 */
function uuid(len, radix) {
    const chars = CHARS;
    const id = [];
    radix = radix || chars.length;

    // Compact form
    if (len) {
        for (let i = 0; i < len; i++) {
            id[i] = chars[0 | (Math.random() * radix)];
        }
    // rfc4122 form
    } else {
        // rfc4122 requires these characters
        // eslint-disable-next-line
        id[8] = id[13] = id[18] = id[23] = '-';
        id[14] = '4';

        // Fill in random data.  At i === 19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (let i = 0; i < 36; i++) {
            if (!id[i]) {
                const r = 0 | (Math.random() * 16);
                id[i] = chars[i === 19 ? (r & 0x3) | 0x8 : r];
            }
        }
    }

    return id.join('');
}
export default uuid;
