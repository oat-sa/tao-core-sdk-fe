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
 * Copyright (c) 2013-2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */

/**
 * Util object to manipulate bytes
 * @exports util/bytes
 */
var bytesUtil = {
    /**
     * Get Human Readable Size
     * @param {Number} bytes - the number of bytes
     * @returns {String} the size converted
     */
    hrSize: function hrSize(bytes) {
        var units = ['B', 'kB', 'MB', 'GB', 'TB'];
        var unit = 0;
        var thresh = 1024;
        bytes = bytes || 0;
        while (bytes >= thresh) {
            bytes /= thresh;
            unit++;
        }
        return bytes.toFixed(2) + units[unit];
    }
};

export default bytesUtil;
