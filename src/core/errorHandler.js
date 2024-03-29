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
 * Copyright (c) 2015-2019 (original work) Open Assessment Technlogies SA (under the project TAO-PRODUCT);
 *
 */

/**
 * Enables you to manage errors.
 * The error handler is context based, you throw errors in a context and
 * then you can listen either a context or all errors.
 *
 * @example <caption>Listen for your context errors</caption>
 * errorHandler.listen('a-context', function(err){
 *      console.error(err);
 * });
 * @example <caption>Throw errors to the context</caption>
 * errorHandler.throw('a-conext', new Error('Something went wrong'));
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import _ from 'lodash';

/**
 * The error handler
 */
const errorHandler = {
    /**
     * Keep contexts
     */
    _contexts: {},

    /**
     * Get a context by it's name and create it if it doesn't exists
     * @param {String} name - the context name
     * @returns {Object|undefined} the handling context
     */
    getContext(name) {
        if (_.isString(name) && name.length) {
            this._contexts[name] = this._contexts[name] || {
                typedHandlers: {},
                globalHandler: null
            };
            return this._contexts[name];
        }
    },

    /**
     * Listen for errors
     * @param {String} name - the context name
     * @param {String} [type] - to listen by type of errors (it uses Error.name)
     * @param {Function} handler - the error handler, it has the error in parameter
     */
    listen(name, type, handler) {
        const context = this.getContext(name);
        if (context) {
            if (_.isFunction(type) && !handler) {
                handler = type;
            }
            if (_.isFunction(handler)) {
                if (_.isString(type) && !_.isEmpty(type)) {
                    context.typedHandlers[type] = handler;
                } else {
                    context.globalHandler = handler;
                }
            }
        }
    },

    /**
     * Throw an error in this context
     * @param {String} name - the context name
     * @param {Error} err - the error with a message
     * @returns {boolean|undefined}
     */
    throw(name, err) {
        const context = this.getContext(name);
        if (context) {
            if (_.isString(err)) {
                err = new Error(err);
            }
            if (_.isFunction(context.typedHandlers[err.name])) {
                context.typedHandlers[err.name](err);
            }
            if (_.isFunction(context.globalHandler)) {
                context.globalHandler(err);
            }
            return false;
        }
    },

    /**
     * Reset an error context
     * @param {String} name - the context name
     */
    reset(name) {
        if (this._contexts[name]) {
            this._contexts = _.omit(this._contexts, name);
        }
    }
};

/**
 * @exports core/errorHandler
 */
export default errorHandler;
