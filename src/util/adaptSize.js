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
 * Copyright (c) 2015-2024 (original work) Open Assessment Technologies SA ;
 */

import $ from 'jquery';
import capitalize from './capitalize.js';

/**
 * Adapts the size of several elements
 */
const adaptSize = (function () {
    /**
     * The actual resize function
     *
     * @param {jQueryElements} $elements
     * @param {Object} dimensions
     * @private
     */
    function _resize($elements, dimensions) {
        // This whole function is based on calculating the largest height/width.
        // Therefor the elements need to have style.height/width to be removed
        // otherwise we could never track when something is actually getting smaller than before.
        $elements.each(function () {
            for (const dimension in dimensions) {
                if (Object.prototype.hasOwnProperty.call(dimensions, dimension)) {
                    $(this)[dimension]('auto');
                }
            }
        });

        $elements.each(function () {
            for (const dimension in dimensions) {
                if (Object.prototype.hasOwnProperty.call(dimensions, dimension)) {
                    dimensions[dimension] = Math.max(
                        Math.floor(dimensions[dimension] || 0),
                        $(this)[`outer${capitalize(dimension)}`]()
                    );
                }
            }
        });

        $elements.css(dimensions);
    }

    return {
        /**
         * Adapt the width of multiple elements to the widest one
         *
         * @param {jQueryElements} $elements
         * @param {Integer|undefined} [minWidth] default: 0
         */
        width($elements, minWidth) {
            _resize($elements, { width: minWidth });
        },

        /**
         * Adapt the height of multiple elements to the highest one
         *
         * @param {jQueryElements} $elements
         * @param {Integer|undefined}[minHeight] default: 0
         */
        height($elements, minHeight) {
            _resize($elements, { height: minHeight });
        },

        /**
         * Adapt the width/height of multiple elements to the widest/highest one
         *
         * @param {jQueryElements} $elements
         * @param {Integer|undefined} [minWidth] default: 0
         * @param {Integer|undefined} [minHeight] default: 0
         */
        both($elements, minWidth, minHeight) {
            _resize($elements, { height: minHeight, width: minWidth });
        },

        /**
         * Set height to auto on a set of elements
         *
         * @param {jQueryElements} $elements
         */
        resetHeight($elements) {
            $elements.height('auto');
        }
    };
})();

export default adaptSize;
