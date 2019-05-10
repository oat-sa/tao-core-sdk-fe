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
 *
 * FIXME I am an util, so please move me into the util folder
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import $ from 'jquery';

var ns = 'history';

/**
 * Browser history management
 * @exports core/history
 */
var history = {
    /**
     * Some browsers have the backspace button configured to run window.history.back(); we will fix this awefull behavior.
     * The strategy is to prevent backspace everywhere except in text and editable elements.
     */
    fixBrokenBrowsers: function fixBrokenBrowsers() {
        //to be completed if needed
        var enabledSelector = ['input', 'textarea', '[contenteditable=true]'].join(',');

        var preventBackSpace = function preventBackSpace(e) {
            return e.keyCode !== 8;
        };
        var preventBackSpacePropag = function preventBackSpacePropag(e) {
            if (e.keyCode === 8 && !e.target.readonly && !e.target.disbaled) {
                e.stopPropagation();
            }
            return true;
        };
        $(document).off('.' + ns);
        $(document).off('.' + ns, enabledSelector);

        $(document).on('keydown.' + ns, preventBackSpace);
        $(document).on('keypress.' + ns, preventBackSpace);
        $(document).on('keydown.' + ns, enabledSelector, preventBackSpacePropag);
        $(document).on('keypress.' + ns, enabledSelector, preventBackSpacePropag);
    }
};

export default history;
