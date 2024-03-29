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
import Promise from 'core/promise';
import providerRegistry from 'core/providerRegistry';
import delegator from 'core/delegator';
import eventifier from 'core/eventifier';

/**
 * Some default config values
 * @type {Object}
 * @private
 */
const defaults = {
    timeout: 30 * 1000
};

/**
 * Creates a communicator implementation.
 * The communicator relies on a provider to execute the actions.
 * Most of the delegated methods must return promises.
 *
 * Some standard channels are reserved, and must be implemented by the providers:
 * - error: to carry on error purpose messages
 * - malformed: to carry on malformed received messages
 *
 * @param {String} providerName - The name of the provider instance,
 *                                which MUST be defined before through a `.registerProvider()` call.
 * @param {Object} [config] - Optional config set
 * @param {String} [config.service] - The address of the remote service to request
 * @param {Number} [config.timeout] - The communication timeout, in milliseconds (default: 30000)
 * @param {Object} [config.requestParams] - Extra params to override the defaults of the request
 * @param {Object} [config.requestParams.jwtTokenHandler] - core/jwtTokenHandler instance to be used for JWT authentication
 * @returns {communicator}
 */
function communicatorFactory(providerName, config) {
    /**
     * The communicator config set
     * @type {Object}
     */
    const extendedConfig = _(config || {})
        .defaults(defaults)
        .value();

    /**
     * The function used to delegate the calls from the API to the provider.
     * @type {Function}
     */
    let delegate;

    /**
     * The current states of the communicator
     * @type {Object}
     */
    let states = {};

    /**
     * The selected communication provider
     * @type {Object}
     */
    const provider = communicatorFactory.getProvider(providerName);

    /**
     * The communicator implementation
     * Creates the implementation by setting an API and delegating calls to the provider
     * @type {Object}
     */
    const communicator = eventifier({
        /**
         * Initializes the communication implementation.
         * Sets the `ready` state.
         * @returns {Promise} The delegated provider's method must return a promise
         * @fires init
         * @fires ready
         */
        init() {
            if (this.getState('ready')) {
                return Promise.resolve();
            }

            return delegate('init').then(() => {
                this.setState('ready').trigger('ready');
            });
        },

        /**
         * Tears down the communication implementation.
         * Clears the states.
         * @returns {Promise} The delegated provider's method must return a promise
         * @fires destroy
         * @fires destroyed
         */
        destroy() {
            let stepPromise;

            if (this.getState('open')) {
                stepPromise = this.close();
            } else {
                stepPromise = Promise.resolve();
            }

            return stepPromise
                .then(() => delegate('destroy'))
                .then(() => {
                    this.trigger('destroyed');
                    states = {};
                });
        },

        /**
         * Opens the connection.
         * Sets the `open` state.
         * @returns {Promise} The delegated provider's method must return a promise
         * @fires open
         * @fires opened
         */
        open() {
            if (this.getState('open')) {
                return Promise.resolve();
            }

            return delegate('open').then(() => {
                this.setState('open').trigger('opened');
            });
        },

        /**
         * Closes the connection.
         * Clears the `open` state.
         * @returns {Promise} The delegated provider's method must return a promise
         * @fires close
         * @fires closed
         */
        close() {
            return delegate('close').then(() => {
                this.setState('open', false).trigger('closed');
            });
        },

        /**
         * Sends an messages through the communication implementation.
         * @param {String} channel - The name of the communication channel to use
         * @param {Object} message - The message to send
         * @returns {Promise} The delegated provider's method must return a promise
         * @fires send
         * @fires sent
         */
        send(channel, message) {
            if (!this.getState('open')) {
                return Promise.reject();
            }

            return delegate('send', channel, message).then(response => {
                this.trigger('sent', channel, message, response);
                return response;
            });
        },

        /**
         * Registers a listener on a particular channel
         * @param {String} name - The name of the channel to listen
         * @param {Function} handler - The listener callback
         * @returns {communicator}
         * @throws TypeError if the name is missing or the handler is not a callback
         */
        channel(name, handler) {
            if (!_.isString(name) || name.length <= 0) {
                throw new TypeError('A channel must have a name');
            }

            if (!_.isFunction(handler)) {
                throw new TypeError('A handler must be attached to a channel');
            }

            this.on(`channel-${name}`, handler);

            return this;
        },

        /**
         * Gets the implementation config set
         * @returns {Object}
         */
        getConfig() {
            return extendedConfig;
        },

        /**
         * Sets a state
         * @param {String} name - The name of the state to set
         * @param {Boolean} [state] - The state itself (default: true)
         * @returns {communicator}
         */
        setState(name, state) {
            if (_.isUndefined(state)) {
                state = true;
            }
            states[name] = !!state;
            return this;
        },

        /**
         * Gets a state
         * @param {String} name - The name of the state to get
         * @returns {Boolean}
         */
        getState(name) {
            return !!states[name];
        }
    });

    // all messages comes through a message event, then each is dispatched to the right channel
    communicator.on('message', function (channel, message) {
        this.trigger(`channel-${channel}`, message);
    });

    // use a delegate function to make a bridge between API and provider
    delegate = delegator(communicator, provider, { name: 'communicator' });

    return communicator;
}

export default providerRegistry(communicatorFactory);
