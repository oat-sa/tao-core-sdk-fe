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
 * @author Martin Nicholson <martin@taotesting.com>
 */
import _ from 'lodash';
import module from 'module';
import tokenStoreFactory from 'core/tokenStore';
import promiseQueue from 'core/promiseQueue';

let clientConfigFetched = false;

const defaults = {
    maxSize: 6,
    tokenTimeLimit: 1000 * 60 * 24
};

/**
 * Stores the security token queue
 * @param {Object} [options]
 * @param {String} [options.maxSize]
 * @param {String} [options.tokenTimeLimit]
 * @param {String} [options.initialToken]
 * @returns {tokenHandler}
 */
export default function tokenHandlerFactory(options) {

    // Convert legacy parameter:
    if (_.isString(options)) {
        options = {
            initialToken: options
        };
    }
    options = _.defaults({}, options, _.omit(module.config(), 'tokens'), defaults);
    // Initialise storage for tokens:
    const tokenStore = tokenStoreFactory(options);

    /**
     * @typedef {Object} tokenHandler
     */
    return {
        /**
         * Gets the next security token from the token queue
         * If none are available, it can check the ClientConfig (once only per page)
         * Once the token is got, it is erased from the store (because they are single-use by design)
         *
         * @returns {Promise<String>} the token value
         */
        getToken() {
            const initialToken = options.initialToken;

            const getFirstTokenValue = () => (
                tokenStore.dequeue()
                    .then(currentToken => {
                        if (currentToken) {
                            return currentToken.value;
                        }
                        return null;
                    })
            );

            // If set, initialToken will be provided directly, without using store:
            if (initialToken) {
                options.initialToken = null;
                return Promise.resolve(initialToken);
            }

            // Some async checks before we go for the token:
            return tokenStore
                .expireOldTokens()
                .then(() => tokenStore.getSize())
                .then(queueSize => {
                    if (queueSize > 0) {
                        // Token available, use it
                        return getFirstTokenValue();
                    } else if (!clientConfigFetched) {
                        // Client Config allowed! (first and only time)
                        return this.getClientConfigTokens()
                            .then(getFirstTokenValue);
                    } else {
                        // No more token options, refresh needed
                        return Promise.reject(new Error('No tokens available. Please refresh the page.'));
                    }
                });
        },

        /**
         * Adds a new security token to the token queue
         * Internally, old tokens are deleted to keep queue within maximum pool size
         * @param {String} newToken
         * @returns {Promise<Boolean>} - resolves true if successful
         */
        setToken(newToken) {
            return tokenStore.enqueue(newToken);
        },

        /**
         * Extracts tokens from the Client Config which should be received on every page load
         * @returns {Promise<Boolean>} - resolves true when completed
         */
        getClientConfigTokens() {
            const {tokens} = module.config();
            const clientTokens = (tokens || []).map(serverToken => ({
                value: serverToken,
                receivedAt: Date.now()
            }));

            // Record that this function ran:
            clientConfigFetched = true;

            return Promise.resolve(clientTokens)
                .then(newTokens => {
                    // Add the fetched tokens to the store
                    // Uses a promiseQueue to ensure synchronous adding
                    const setTokenQueue = promiseQueue();

                    newTokens.forEach(token => setTokenQueue.serie(() => this.setToken(token)));

                    return setTokenQueue.serie(() => true);
                });
        },

        /**
         * Clears the token store
         * @returns {Promise<Boolean>} - resolves to true when cleared
         */
        clearStore() {
            return tokenStore.clear();
        },

        /**
         * Getter for the current queue length
         * @returns {Promise<Number>}
         */
        getQueueLength() {
            return tokenStore.getSize();
        },

        /**
         * Setter for maximum pool size
         * @param {Number} size
         */
        setMaxSize(size) {
            tokenStore.setMaxSize(size);
        }
    };
}
