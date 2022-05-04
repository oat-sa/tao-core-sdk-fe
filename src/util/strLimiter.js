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
 * Copyright (c) 2018-2022 Open Assessment Technologies SA
 */

/**
 * Limit a string by either word or character count
 *
 * @author dieter <dieter@taotesting.com>
 */

export default {
    /**
     * Limits a string by word count.
     *
     * @param {string} text
     * @param {number} limit
     * @returns {string}
     */
    limitByWordCount(text, limit) {
        /**
         * Removes the trailing spaces from a text.
         * @param {string} str
         * @returns {string}
         */
        const removeTrailing = str => str.replace(/(\s+)$/, '');

        /**
         * Cuts a plain text after the max number of words expressed by the variable `limit`.
         * @param {string} str
         * @returns {string}
         */
        const limitText = str => {
            const words = str.match(/([\s]*[\S]+)/g);
            const trailing = str.match(/(\s+)$/);
            if (!words) {
                return '';
            }
            const count = Math.max(0, limit);
            limit = Math.max(0, count - words.length);
            return words.slice(0, count).join('') + ((trailing && trailing[0]) || '');
        };

        /**
         * Limits the number of words in an HTML fragment, removing the extraneous ones.
         * @param {Node} fragment
         */
        const limitFragment = fragment => {
            [].slice.call(fragment.childNodes).forEach(node => {
                switch (node.nodeType) {
                    case Node.ELEMENT_NODE:
                        if (node.childNodes.length && node.textContent.trim()) {
                            limitFragment(node);

                            if (!node.textContent.trim()) {
                                node.remove();
                            }
                        }
                        break;

                    case Node.TEXT_NODE:
                        node.textContent = limitText(node.textContent);
                        break;
                }
            });
        };

        if (/<.*>/g.test(text)) {
            const fragment = document.createElement('div');
            fragment.innerHTML = text;
            limitFragment(fragment);
            return removeTrailing(fragment.innerHTML);
        }

        return removeTrailing(limitText(text));
    },

    /**
     * Limit a string by character count
     *
     * @param {string} str
     * @param {integer} maxCharCount
     * @returns {string|*}
     */
    limitByCharCount: function limitByCharCount(str, maxCharCount) {
        return str.substr(0, maxCharCount);
    }
};
