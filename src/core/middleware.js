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
 * Copyright (c) 2017-2024 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
import _ from 'lodash';
import eventifier from './eventifier.js';

/**
 * Defines a middlewares chain handler.
 * It will manage a chain of middlewares that can interact with request responses.
 * Each middleware must return a promise.
 *
 * @returns {middlewareHandler} - The middlewares handler instance
 */
function middlewareFactory() {
    /**
     * The registered middlewares
     * @type {Object}
     */
    const middlewares = {};

    /**
     * @typedef {middlewareHandler}
     */
    const middlewareHandler = eventifier({
        /**
         * Add a middleware
         * @param {String} [command] The command queue in which add the middleware (default: 'all')
         * @param {...Function} [callback] A middleware callback. Must accept 2 parameters (request and response) and can return a promise.
         * @returns {proxy}
         */
        use(command, ...callback) {
            let queue = 'all';

            if (command && _.isString(command)) {
                queue = command;
            } else {
                callback = [command, ...callback];
            }

            const list = middlewares[queue] || [];
            middlewares[queue] = list;

            _.forEach(callback, function (cb) {
                if (_.isFunction(cb)) {
                    list.push(cb);

                    /**
                     * @event add
                     * @param {String} command
                     * @param {Function} callback
                     */
                    middlewareHandler.trigger('add', command, cb);
                }
            });
            return this;
        },

        /**
         * Applies the list of registered middlewares onto the received response
         * @param {Object} request - The request descriptor
         * @param {String} request.command - The name of the requested command
         * @param {Object} request.params - The map of provided parameters
         * @param {Object} response The response descriptor
         * @param {String} response.success The status of the response
         * @param {Object} [context] - An optional context object to apply on middlewares
         * @returns {Promise}
         */
        apply(request, response, context) {
            const stack = getMiddlewares(request.command);
            let pointer = 0;

            // apply each middleware in series, then resolve or reject the promise
            return new Promise(function (resolve, reject) {
                function next() {
                    const middleware = stack[pointer++];
                    if (middleware) {
                        Promise.resolve(middleware.call(context, request, response))
                            .then(function (res) {
                                if (res !== false) {
                                    next();
                                } else {
                                    resolve();
                                }
                            })
                            .catch(reject);
                    } else {
                        resolve();
                    }
                }

                next();
            })
                .then(function () {
                    // handle implicit error from response descriptor
                    if (response.success === false) {
                        return Promise.reject(response);
                    }

                    /**
                     * @event applied
                     * @param {Object} request - The request descriptor
                     * @param {Object} response The response descriptor
                     * @param {Object} context - The call context
                     */
                    middlewareHandler.trigger('applied', request, response, context);

                    return response;
                })
                .catch(function (err) {
                    /**
                     * @event failed
                     * @param {Object} request - The request descriptor
                     * @param {Object} response The response descriptor
                     * @param {Object} context - The call context
                     */
                    middlewareHandler.trigger('failed', request, response, context);

                    return Promise.reject(err);
                });
        }
    });

    /**
     * Gets the aggregated list of middlewares for a particular queue name
     * @param {String} queue - The name of the queue to get
     * @returns {Array}
     */
    function getMiddlewares(queue) {
        let list = middlewares[queue] || [];
        if (middlewares.all) {
            list = list.concat(middlewares.all);
        }
        return list;
    }

    return middlewareHandler;
}

export default middlewareFactory;
