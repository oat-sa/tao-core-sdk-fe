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
 * Copyright (c) 2016-2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */

import _ from 'lodash';
import pollingFactory from 'core/polling';
import Promise from 'core/promise';
import coreRequest from 'core/request';

/**
 * Some default config values
 * @type {Object}
 * @private
 */
const defaults = {
    timeout: 30 * 1000,
    interval: 30 * 1000,
    throttle: 1000
};

/**
 * Defines a communication implementation based on remote service polling.
 *
 * The remote service must accept JSON payload using this format:
 * ```
 * [{
 *      channel: "a channel's name",
 *      message: {a: "message", with: "some data"}
 * }, {
 *      ...
 * ]
 * ```
 *
 * The remote service must respond using JSON notation like this:
 * ```
 * {
 *      responses: [
 *          "some responses",
 *          "indexed with the same order as the request"
 *      ],
 *      messages: [{
 *          channel: "a channel's name",
 *          message: {a: "message", with: "some data"}
 *      }, {
 *          ...
 *      }]
 * }
 * ```
 *
 * A security token can be added, in the header `X-CSRF-Token` for the request and response.
 *
 * Business logic errors can be implemented using the `error` *channel*.
 * Network errors are handled by the AJAX implementation, and are forwarded to the `error` *event*.
 * Additional network error handling can be achieve by the rejected send promises.
 *
 * Malformed messages will be issued through the `malformed` channel
 *
 * @param {String} config.service - The address of the remote service to request
 * @param {Number} [config.timeout] - The communication timeout, in milliseconds (default: 30000)
 * @param {Number} [config.interval] - The poll interval, in milliseconds (default: 30000)
 * @param {Number} [config.throttle] - Gather several calls to send() by throttle period, in milliseconds (default: 1000)
 * @param {String} [config.token] - An optional initial security token
 * @param {Object} [config.requestParams] - Extra params to override the defaults of the request
 * @param {Object} [config.requestParams.jwtTokenHandler] - core/jwtTokenHandler instance to be used for JWT authentication
 * @type {Object}
 */
const pollProvider = {
    /**
     * The provider name
     */
    name: 'poll',

    /**
     * Initializes the communication implementation
     * @returns {Promise}
     */
    init() {
        const config = _.defaults(this.getConfig(), defaults);

        // validate the config
        if (!config.service) {
            // a remote service is needed to build a long poll communication
            return Promise.reject(new Error('You must provide a service URL'));
        }

        // there is no message in the queue at this moment
        this.messagesQueue = [];

        this.request = function request() {
            return new Promise(resolve => {
                // split promises and their related messages
                const promises = [];
                const req = _.map(this.messagesQueue, function (msg) {
                    promises.push(msg.promise);
                    return {
                        channel: msg.channel,
                        message: msg.message
                    };
                });
                const defaultRequestParams = {
                    url: config.service,
                    method: 'POST',
                    headers: {},
                    data: JSON.stringify(req),
                    dataType: 'json',
                    contentType: 'application/json',
                    sequential: true,
                    noToken: false,
                    timeout: config.timeout
                };
                const extendedRequestParams = Object.assign({}, defaultRequestParams, config.requestParams);

                // then reset the list of pending messages
                this.messagesQueue = [];

                coreRequest(extendedRequestParams)
                    .then(response => {
                        // resolve each message promises
                        _.forEach(promises, function (promise, idx) {
                            promise.resolve(response.responses && response.responses[idx]);
                        });

                        if (!this.polling.is('stopped')) {
                            // receive server messages
                            _.forEach(response.messages, msg => {
                                if (msg.channel) {
                                    this.trigger('message', msg.channel, msg.message);
                                } else {
                                    this.trigger('message', 'malformed', msg);
                                }
                            });
                        }

                        this.trigger('receive', response);

                        resolve();
                    })
                    .catch(error => {
                        error.source = 'network';
                        error.purpose = 'communicator';

                        // reject all message promises
                        _.forEach(promises, function (promise) {
                            promise.reject(error);
                        });

                        this.trigger('error', error);

                        resolve();
                    });
            });
        };

        // prepare the polling of the remote service
        // it will be started by the open() method
        const callRequest = () => this.request();
        this.polling = pollingFactory({
            interval: config.interval,
            autoStart: false,
            action() {
                const async = this.async();
                callRequest().then(function () {
                    async.resolve();
                });
            }
        });

        // adjust the message sending by throttle periods
        this.throttledSend = _.throttle(() => {
            this.polling.next();
        }, config.throttle);

        return Promise.resolve();
    },

    /**
     * Tears down the communication implementation
     * @returns {Promise}
     */
    destroy() {
        let stopped;

        if (this.polling) {
            stopped = new Promise(resolve => {
                this.polling.off('stop.api').on('stop.api', resolve).stop();
            });
        } else {
            stopped = Promise.resolve();
        }

        return stopped.then(() => {
            this.polling = null;
            this.throttledSend = null;
            this.messagesQueue = null;
        });
    },

    /**
     * Opens the connection with the remote service.
     * @returns {Promise}
     */
    open() {
        if (this.polling) {
            return new Promise(resolve => {
                this.polling.off('next.api').on('next.api', resolve).start().next();
            });
        }
        return Promise.reject(new Error('The communicator has not been properly initialized'));
    },

    /**
     * Closes the connection with the remote service.
     * @returns {Promise}
     */
    close() {
        if (this.polling) {
            return new Promise(resolve => {
                this.polling.off('stop.api').on('stop.api', resolve).stop();
            });
        }
        return Promise.reject(new Error('The communicator has not been properly initialized'));
    },

    /**
     * Sends messages through the communication implementation
     * @param {String} channel - The name of the communication channel to use
     * @param {Object} message - The message to send
     * @returns {Promise}
     */
    send(channel, message) {
        // queue the message, it will be sent soon
        const pending = {
            channel: channel,
            message: message
        };
        const promise = new Promise(function (resolve, reject) {
            pending.promise = {
                resolve: resolve,
                reject: reject
            };
        });
        this.messagesQueue.push(pending);

        // force a send in the next throttle period
        this.throttledSend();

        return promise;
    }
};

export default pollProvider;
