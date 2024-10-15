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
 * Copyright (c) 2013-2024 (original work) Open Assessment Technologies SA ;
 */

/**
 * Used to register jquery plugins
 *
 * !!! Prefer component to jQuery plugins !!!
 *
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 * @requires jquery
 * @requires lodash
 */
import $ from 'jquery';
import _ from 'lodash';

/**
 * Abstract plugin used to provide common behavior to the plugins
 */
const basePlugin = {
    /**
     * Set options of the plugin
     *
     * @example $('selector').pluginName('options', { key: value });
     * @param  {String} dataNs - the data namespace
     * @param  {String} ns - the event namespace
     * @param  {Object} options - the options to set
     * @returns {jQuery}
     */
    options(dataNs, ns, options) {
        return this.each(function () {
            const $elt = $(this);
            const currentOptions = $elt.data(dataNs);
            if (currentOptions) {
                $elt.data(dataNs, _.merge(currentOptions, options));
            }
        });
    },

    /**
     * Disable the component.
     *
     * It can be called prior to the plugin initilization.
     *
     * Called the jQuery way once registered by the Pluginifier.
     * @example $('selector').pluginName('disable');
     * @param  {String} dataNs - the data namespace
     * @param  {String} ns - the event namespace
     * @returns {jQuery}
     * @fires  basePlugin#disable.ns
     */
    disable(dataNs, ns) {
        return this.each(function () {
            const $elt = $(this);
            const options = $elt.data(dataNs);
            if (options) {
                $elt.addClass(options.disableClass || 'disabled').trigger(`disable.${ns}`);
            }
        });
    },

    /**
     * Enable the component.
     *
     * Called the jQuery way once registered by the Pluginifier.
     * @example $('selector').pluginName('enable');
     * @param  {String} dataNs - the data namespace
     * @param  {String} ns - the event namespace
     * @returns {jQuery}
     * @fires  basePlugin#enable.ns
     */
    enable(dataNs, ns) {
        return this.each(function () {
            const $elt = $(this);
            const options = $elt.data(dataNs);
            if (options) {
                $elt.removeClass(options.disableClass || 'disabled').trigger(`enable.${ns}`);
            }
        });
    }
};

/**
 * Helps you to create a jQuery plugin, the Cards way
 * @exports core/pluginifer
 */
const Pluginifier = {
    /**
     * Register a new jQuery plugin, the Cards way
     * @param {string} pluginName - the name of the plugin to register. ie $('selector').pluginName();
     * @param {Object} plugin - the plugin as a plain object
     * @param {Function} plugin.init - the entry point of the plugin is always an init method
     * @param {Object} [config] - plugin configuration
     * @param {String} [config.ns = pluginName] - plugin namespace (used for events and data-attr)
     * @param {String} [config.dataNs = ui.pluginName] - plugin namespace (used for events and data-attr)
     * @param {Array<String>} [config.expose] - list of methods to expose
     * @returns {*}
     */
    register(pluginName, plugin, config) {
        config = config || {};
        const ns = config.ns || pluginName.toLowerCase();
        const dataNs = config.dataNs || `ui.${ns}`;
        const expose = config.expose || [];

        //checks
        if (_.isFunction($.fn[pluginName])) {
            return $.error(`A plugin named ${pluginName} is already registered`);
        }
        if (!_.isPlainObject(plugin) || !_.isFunction(plugin.init)) {
            return $.error('The object to register as a jQuery plugin must be a plain object with an `init` method.');
        }

        //configure and augments the plugin
        _.assign(
            plugin,
            _.transform(basePlugin, function (result, prop, key) {
                if (_.isFunction(prop)) {
                    result[key] = _.partial(basePlugin[key], dataNs, ns);
                }
            })
        );

        //set up public methods to wrap privates the jquery way
        _.forEach(expose, function (toExposeName) {
            let privateMethod = toExposeName;
            let publicMethod = toExposeName;
            if (!/^_/.test(expose)) {
                privateMethod = `_${privateMethod}`;
            } else {
                publicMethod = publicMethod.replace(/^_/, '');
            }

            //do not override if exists
            if (_.isFunction(plugin[privateMethod]) && !_.isFunction(plugin[publicMethod])) {
                plugin[publicMethod] = function (...args) {
                    let returnValue;
                    this.each(function () {
                        //call plugin._method($element, [remainingArgs...]);
                        returnValue = plugin[privateMethod]($(this), ...args);
                    });
                    return returnValue || this;
                };
            }
        });

        // map $('selector').pluginName() to plugin.init
        // map $('selector').pluginName('method', params) to plugin.method(params) to plugin._method($elt, params);
        // disable direct call to private (starting with _) methods
        $.fn[pluginName] = function (method, ...args) {
            if (plugin[method]) {
                if (/^_/.test(method)) {
                    $.error(`Trying to call a private method \`${method}\``);
                } else {
                    return plugin[method].apply(this, args);
                }
            } else if (typeof method === 'object' || !method) {
                return plugin.init.call(this, method, ...args);
            }
            $.error(`Method ${method} does not exist on plugin`);
        };
    }
};

export default Pluginifier;
