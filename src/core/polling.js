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
 * Copyright (c) 2015-2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * Defines a polling manager with flow control: schedules action to run periodically.
 * Ensures each polling step is done before scheduling the next one, even if the action is asynchronous.
 * Handles synchronous as wells as asynchronous actions.
 * The scheduling can be paused/resumed any time, or the next schedule can be forced to occurs immediately.
 *
 * @example <caption>Simple synchronous polling</caption>
 * // direct assignment
 * var poll = polling({
 *     action: function() {
 *         // something to do at interval
 *
 *         // you can stop the polling immediately at this point is needed, using:
 *         // this.stop();
 *     },
 *     interval: 50,   // each action will occur 50 ms after the last step
 *     autoStart: true // start immediately
 * });
 *
 * // explicit assignment
 * var poll = polling();
 *
 * poll.setAction(function() {
 *     // something to do at interval
 * });
 *
 * // each action will occur 50 ms after the last step
 * poll.setInterval(50);
 *
 * // start the polling
 * poll.start();
 *
 * // stop after a period of time
 * setTimeout(function() {
 *     poll.stop();
 * }, 1000);
 *
 * @example <caption>Asynchronous polling</caption>
 * // direct assignment
 * var poll = polling({
 *     action: function() {
 *         // get into asynchronous mode
 *         var async = this.async();
 *
 *         // defer the next schedule
 *         setTimeout(function() {
 *             if (needToContinue) {
 *                 // continue the polling
 *                 async.resolve();
 *             } else {
 *                 // stop immediately the polling
 *                 async.reject();
 *             }
 *         }, 100);
 *     },
 *     interval: 50,   // each action will occur 50 ms after the last step
 *     autoStart: true // start immediately
 * });
 *
 * // explicit assignment
 * var poll = polling();
 *
 * // you can also change the 'this' of each action
 * var anObject = { foo: 'bar' };
 * poll.setContext(anObject);
 *
 * poll.setAction(function(p) {
 *     // get into asynchronous mode,
 *     // but as the context is not the polling manager
 *     // you need to use the argument
 *     var async = p.async();
 *
 *     // defer the next schedule
 *     setTimeout(function() {
 *         if (needToContinue) {
 *             // continue the polling
 *             async.resolve();
 *         } else {
 *             // stop immediately the polling
 *             async.reject();
 *         }
 *     }, 100);
 * });
 *
 * // each action will occur 50 ms after the last step
 * poll.setInterval(50);
 *
 * // start the polling
 * poll.start();
 *
 * // stop after a period of time
 * setTimeout(function() {
 *     poll.stop();
 * }, 1000);
 *
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */

import _ from 'lodash';
import Promise from 'core/promise';
import eventifier from 'core/eventifier';

/**
 * The default value of the polling interval
 * @type {Number}
 * @private
 */
const _defaultInterval = 60 * 1000;

/**
 * Create a polling manager for a particular action
 * @param {Object|Function} [config] - A config object, or the action called on each iteration
 * @param {Function} [config.action] - The callback action called on each iteration, the polling instance is provided as first argument
 * @param {Number|String} [config.interval] - The minimal time between two iterations
 * @param {Number|String} [config.max] - Set a max number of iterations, after what the polling is stopped.
 * @param {Boolean} [config.autoStart] - Whether or not the polling should start immediately
 * @param {Object} [config.context] - An optional context to apply on each action call
 * @param {number} pollingInterval - The minimal time between two iterations (to be set when the first parameter is a function)
 * @returns {polling}
 */
function pollingFactory(config, pollingInterval = _defaultInterval) {
    let timer, promise, interval, max, iter, action, context, autoStart;
    const state = {};

    /**
     * Defines the polling manager
     * @type {Object}
     */
    const polling = {
        /**
         * Gets the current action into asynchronous mode.
         * The next iteration won't be executed until the resolve method has been called.
         * However if the reject method is called, the polling is then stopped!
         * @returns {Object} Returns a promise resolver that provides resolve() and reject() methods
         */
        async() {
            const resolver = {};

            // create a promise and extract the control callbacks
            promise = new Promise(function (resolve, reject) {
                resolver.resolve = resolve;
                resolver.reject = reject;
            });

            // directly install the pending actions
            promise
                .then(function () {
                    promise = null;
                    state.processing = false;

                    // next iteration only if allowed
                    if (!state.stopped) {
                        startTimer();
                    }

                    /**
                     * Notifies the polling continues
                     * @event polling#resolved
                     */
                    polling.trigger('resolved');
                })
                .catch(function () {
                    promise = null;
                    state.processing = false;

                    // breaks the polling
                    polling.stop();

                    /**
                     * Notifies the polling has been halted
                     * @event polling#rejected
                     */
                    polling.trigger('rejected');
                });

            /**
             * Notifies the current action is asynchronous
             * @event polling#async
             * @param {Object} resolver
             * @param {Function} resolver.resolve
             * @param {Function} resolver.reject
             */
            polling.trigger('async', resolver);

            return resolver;
        },

        /**
         * Forces the next iteration to be executed now, unless it is already running.
         * If the polling has been stopped, start it again.
         * @returns {polling}
         */
        next() {
            var _next;

            // reset the counter if the polling is stopped
            if (state.stopped) {
                iter = 0;
            }

            // ensure the scheduling if off
            stopTimer();

            // prevent more iterations than needed to be ran
            if (max && iter >= max) {
                return this;
            }

            // the next() method can be called either to force a next iteration or to start immediately the action
            // so we need to ensure the schedule is not blocked
            state.stopped = false;

            if (!promise) {
                /**
                 * Notifies the action
                 * @event polling#next
                 * @param {polling} polling
                 */
                this.trigger('next');

                iteration();
            } else {
                // as a promise is still pending, ensure a call to next() will be processed after
                _next = this.next.bind(this);
                promise.then(_next).catch(_next);
            }
            return this;
        },

        /**
         * Starts the polling if it is not currently running
         * @returns {polling}
         */
        start() {
            if (!timer) {
                iter = 0;
                startTimer();

                /**
                 * Notifies the start
                 * @event polling#start
                 */
                this.trigger('start');
            }
            return this;
        },

        /**
         * Stops the polling if it is currently running
         * @returns {polling}
         */
        stop() {
            stopTimer();

            /**
             * Notifies the stop
             * @event polling#stop
             */
            this.trigger('stop');

            return this;
        },

        /**
         * Sets the minimum time interval between two actions
         * @param {Number|String} value
         * @returns {polling}
         */
        setInterval(value) {
            interval = Math.abs(parseInt(value, 10) || _defaultInterval);

            /**
             * Notifies the interval change
             * @event polling#setinterval
             * @param {Number} interval
             */
            this.trigger('setinterval', interval);

            return this;
        },

        /**
         * Gets the minimum time interval between two actions
         * @returns {Number}
         */
        getInterval() {
            return interval;
        },

        /**
         * Sets the polling action
         * @param {Function} fn
         * @returns {polling}
         */
        setAction(fn) {
            action = fn;

            /**
             * Notifies the action change
             * @event polling#setaction
             * @param {Function} action
             */
            this.trigger('setaction', action);

            return this;
        },

        /**
         * Gets the polling action
         * @returns {Function}
         */
        getAction() {
            return action;
        },

        /**
         * Sets the context applied on each action call
         * @param {Object} ctx
         * @returns {polling}
         */
        setContext(ctx) {
            context = ctx || this;

            /**
             * Notifies the context change
             * @event polling#setcontext
             * @param {Object} context
             */
            this.trigger('setcontext', ctx);

            return this;
        },

        /**
         * Gets the context applied on each action call
         * @returns {Object}
         */
        getContext() {
            return context;
        },

        /**
         * Sets the max number of polling occurrences
         * @param {Number} value
         * @returns {polling}
         */
        setMax(value) {
            max = Math.abs(parseInt(value, 10) || 0);
            return this;
        },

        /**
         * Gets the max number of polling occurrences
         * @returns {Number}
         */
        getMax() {
            return max;
        },

        /**
         * Gets the number of ran iterations
         * @returns {Number}
         */
        getIteration() {
            return iter || 0;
        },

        /**
         * Checks if the manager is in a particular state
         * @param {String} stateName The name of the state to check. Possible values are:
         * - stopped: the polling manager is stopped, and won't process action until restart
         * - pending: the polling manager has scheduled an action an is waiting for it processing
         * - processing: the polling manager is currently processing an action and wait for its completion
         * @returns {Boolean}
         */
        is: function is(stateName) {
            return !!state[stateName];
        }
    };

    /**
     * Fires a new timer
     */
    function startTimer() {
        timer = setTimeout(iteration, interval);
        state.stopped = false;
        state.pending = true;
    }

    /**
     * Stops the current timer
     */
    function stopTimer() {
        clearTimeout(timer);
        timer = null;
        state.stopped = true;
        state.pending = false;
    }

    /**
     * Runs an iteration of the polling loop
     */
    function iteration() {
        // prevent more iterations than needed to be ran
        if (max && iter >= max) {
            // breaks the polling
            polling.stop();
            return;
        }

        // count the iteration
        iter = (iter || 0) + 1;
        state.processing = true;
        state.pending = false;

        /**
         * Notifies the action is about to be called
         * @event polling#call
         */
        polling.trigger('call');

        // process the action in the right context
        action.call(context, polling);

        // next iteration in synchronous mode
        if (!promise && !state.stopped) {
            state.processing = false;
            startTimer();
        }
    }

    eventifier(polling);

    // some defaults
    interval = _defaultInterval;
    context = polling;
    action = null;
    state.stopped = true;
    autoStart = false;
    iter = 0;

    // maybe only the action is provided
    if (_.isFunction(config)) {
        polling.setAction(config);
        config = null;
    }

    // loads the config
    if (_.isObject(config)) {
        polling.setAction(config.action);
        polling.setInterval(config.interval || pollingInterval);
        polling.setContext(config.context);
        polling.setMax(config.max);
        autoStart = !!config.autoStart;
    }

    if (autoStart) {
        polling.start();
    }

    return polling;
}

export default pollingFactory;
