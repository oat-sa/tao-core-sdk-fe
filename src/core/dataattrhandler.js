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
 * @requires jquery
 * @requires lodash
 */
import $ from 'jquery';
import _ from 'lodash';

const defaults = {
    container: false,
    listenerEvent: 'click',
    useTarget: true,
    bubbled: false
};

const letDefaultOn = [':radio', ':checkbox'];

/**
 * Some elements (listed in letDefaultOn) need the usual action to be triggered, check that
 * @param {jQuery} $elt
 * @returns {boolean}
 */
function shouldPreventDefault($elt) {
    return !$elt.is(letDefaultOn.join(','));
}

/**
 * This callback is used either to perform actions on data-attr element
 * @callback dataAttrCallback
 * @params {jQuery} $elt - the element that contains the data-attr
 * @params {jQuery} $target - the element targeted by the data-attr
 */

/**
 * The DataAttrHandler helps you to listen events from data attribute elements
 * and bound a jQuery plugin behavior.
 * @exports core/dataattrhandler
 *
 * @constructor
 * @param {string} attrName - the name of the attribute, ie. `toggle` for `data-toggle`
 * @param {Object} options - the handler options
 * @param {string} options.namespace - the jQuery plugin namespace
 * @param {jQuery|boolean} [options.container = false] - the root context to listen in
 * @param {string} [options.listenerEvent = 'click'] - the event to listen on
 * @param {boolean} [options.preventDefault = true] - to prevent the default event to be fired
 * @param {string} [options.inner] - a selector inside the element to bind the event to
 * @param {boolean} [options.useTarget = true] - if the content of the data-attr is as target or not
 * @param {boolean} [options.bubbled = false] - handle the event if bubbled from a child
 */
function DataAttrHandler(attrName, options) {
    this.options = _.defaults(options, defaults);
    let selector = `[data-${attrName}]`;

    //check namespace
    if (!_.has(this.options, 'namespace') || !_.isString(this.options.namespace)) {
        return $.error('The plugin data namespace option is required');
    }

    if (this.options.container && this.options.container.selector) {
        selector = `${this.options.container.selector} ${selector}`;
    }

    if (this.options.inner) {
        selector += ` ${this.options.inner}`;
    }

    //listen for events on selector (the listening works even though the DOM changes).
    $(document)
        .off(this.options.listenerEvent, selector)
        .on(this.options.listenerEvent, selector, e => {
            let $elt = $(e.target);
            if (this.options.bubbled === true || $elt.is(selector)) {
                let $outer;

                if (typeof $elt.data(attrName) === 'undefined' && (this.options.inner || this.options.bubbled)) {
                    $outer = $elt;
                    $elt = $elt.parents(`[data-${attrName}]`);
                }

                let $target;
                if (this.options.useTarget === true) {
                    $target = DataAttrHandler.getTarget(attrName, $elt);
                } else if (this.options.inner) {
                    $target = $outer;
                }

                //check if the plugin is already bound to the element
                if (!$elt.data(this.options.namespace)) {
                    if (typeof this.createPlugin === 'function') {
                        this.createPlugin($elt, $target);
                    }

                    //for radio bind also the method call to the group...
                    if ($elt.is(':radio') && $elt.attr('name')) {
                        $(`:radio[name="${$elt.attr('name')}"]`)
                            .not($elt)
                            .on(this.options.listenerEvent, ev => {
                                if (typeof this.callPluginMethod === 'function') {
                                    this.callPluginMethod($elt, $target);
                                }
                                if (shouldPreventDefault($elt)) {
                                    ev.preventDefault();
                                }
                            });
                    }
                }

                //call the method bound to this event
                if (typeof this.callPluginMethod === 'function') {
                    this.callPluginMethod($elt, $target);
                } /*else {
                    //if there is no action to call we top listening (init plugin only)
                    $(document).off(self.options.listenerEvent, selector);
                }*/

                if (shouldPreventDefault($elt)) {
                    e.preventDefault();
                }
            }
        });
}

/**
 * Add the callback used to initialise the plugin,
 * the cb will be executed only once
 * @param {dataAttrCallback} cb - callback
 * @returns {DataAttrHandler} for chaining
 */
DataAttrHandler.prototype.init = function init(cb) {
    this.createPlugin = cb;

    return this;
};

/**
 * Add the callback used to trigger an action each time the event is fired.
 * @param {dataAttrCallback} cb - callback
 * @returns {DataAttrHandler} for chaining
 */
DataAttrHandler.prototype.trigger = function trigger(cb) {
    this.callPluginMethod = cb;

    return this;
};

/**
 * Loads the target element from the data-attr (and fallback to href or a named attribute).
 * The value of the data-attr is a CSS selector, it will be applied directly or with $elt as context.
 *
 * @param {String} attrName - the name of the attribute, ie. `toggle` for `data-toggle`
 * @param {jQuery} $elt - the element that holds the data attr
 * @returns {jQuery} the target
 */
DataAttrHandler.getTarget = function getTarget(attrName, $elt) {
    const relativeRegex = /^(\+|>|~|:parent|<)/;
    let $target = [];
    const targetSelector = $elt.attr(`data-${attrName}`) || $elt.attr('href') || $elt.attr('attrName');
    if (!_.isEmpty(targetSelector)) {
        //try to contextualize from the current element before selcting globally
        const matches = relativeRegex.exec(targetSelector);
        if (matches !== null) {
            const selector = targetSelector.replace(relativeRegex, '');
            if (matches[0] === ':parent' || matches[0] === '<') {
                $target = $elt.parents(selector);
            } else if (matches[0] === '~') {
                $target = $elt.siblings(selector);
            } else if (matches[0] === '+') {
                $target = $elt.next(selector);
            } else {
                $target = $(selector, $elt);
            }
        } else {
            $target = $(targetSelector);
        }
    }
    return $target;
};

//expose the handler
export default DataAttrHandler;
