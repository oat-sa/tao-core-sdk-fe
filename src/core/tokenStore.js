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
 * Copyright (c) 2019 Open Assessment Technologies SA
 */

/**
 * Store for tokens in memory as a FIFO queue
 * Modeled on taoQtiTest/views/js/runner/proxy/cache/itemStore.js
 *
 * @author Martin Nicholson <martin@taotesting.com>
 */
import _ from 'lodash';
import store from 'core/store';

/**
 * @typedef {Object} token - A token object
 * @property {String} value - Long alphanumeric string
 * @property {Number} receivedAt - Creation timestamp
 */

/**
 * The default number of tokens to store
 */
const defaultConfig = {
    maxSize: 6,
    tokenTimeLimit: 1000 * 60 * 24
};

/**
 * Create a token store
 * @param {Object} [options]
 * @param {Number} [options.maxSize = 6] - the store limit
 * @param {Number} [options.tokenTimeLimit] - time in milliseconds each token remains valid for
 * @returns {tokenStore}
 */
export default function tokenStoreFactory(options) {
    const config = _.defaults(options || {}, defaultConfig);

    // In memory storage
    // For security reasons, this is preferred over the indexeddb or localStorage implementations
    const getStore = () => store('tokenStore.tokens', store.backends.memory);

    /**
     * @typedef tokenStore
     */
    return {
        /**
         * Get the oldest token from the queue
         * Remove its store entry as well
         *
         * @returns {Promise<Object>} the token object
         */
        dequeue() {
            return this.getIndex()
                .then(latestIndex => {
                    const key = _.first(latestIndex);
                    if (!key) {
                        return Promise.resolve();
                    }

                    return getStore()
                        .then(storage => storage.getItem(key))
                        .then(token => this.remove(key).then(() => token));
                });
        },

        /**
         * Add a new token object to the queue
         * Add an entry to the store as well
         *
         * @param {token} token - the token object
         * @param {String} token.value - long alphanumeric string
         * @param {Number} token.receivedAt - timestamp
         * @returns {Promise<Boolean>} - true if added
         */
        enqueue(token) {
            // Handle legacy param type:
            if (_.isString(token)) {
                token = {
                    value: token,
                    receivedAt: Date.now()
                };
            }
            return getStore()
                .then(storage => storage.setItem(token.value, token))
                .then(updated => {
                    if (updated) {
                        return this.enforceMaxSize()
                            .then(() => true);
                    }
                    return false;
                });
        },

        /**
         * Generate a new (chronologically-sorted) index from the store contents
         * (because it would not be unique if stored in the module)
         *
         * @returns {Promise<Array>}
         */
        getIndex() {
            return this.getTokens()
                .then(tokens => (
                    Object.values(tokens)
                        .sort((t1, t2) => t1.receivedAt - t2.receivedAt)
                        .map(token => token.value)
                ));
        },

        /**
         * Check whether the given token is in the store
         *
         * @param {String} key - token string
         * @returns {Promise<Boolean>}
         */
        has(key) {
            return this.getIndex()
                .then(latestIndex => latestIndex.includes(key));
        },

        /**
         * Remove the token from the queue and the store
         *
         * @param {String} key - token string
         * @returns {Promise<Boolean>} resolves once removed
         */
        remove(key) {
            return this.has(key)
                .then(result => {
                    if (result) {
                        return getStore()
                            .then(storage => storage.removeItem(key));
                    }
                    return false;
                });
        },

        /**
         * Empty the queue and store
         * @returns {Promise}
         */
        clear() {
            return getStore()
                .then(storage => storage.clear());
        },

        /**
         * Gets all tokens in the store
         * @returns {Promise<Array>} - token objects
         */
        getTokens() {
            return getStore()
                .then(storage => storage.getItems());
        },

        /**
         * Gets the current size of the store
         * @returns {Promise<Number>}
         */
        getSize() {
            return this.getIndex()
                .then(latestIndex => latestIndex.length);
        },

        /**
         * Setter for maximum pool size
         * @param {Number} size
         */
        setMaxSize(size) {
            if (_.isNumber(size) && size > 0 && size !== config.maxSize) {
                config.maxSize = size;
                this.enforceMaxSize();
            }
        },

        /**
         * Removes oldest tokens, if the pool is above its size limit
         * (Could happen if maxSize is reduced during the life of the tokenStore)
         * @returns {Promise} - resolves when done
         */
        enforceMaxSize() {
            return this.getIndex()
                .then(latestIndex => {
                    const excess = latestIndex.length - config.maxSize;
                    if (excess > 0) {
                        const keysToRemove = latestIndex.slice(0, excess);
                        return Promise.all(
                            keysToRemove.map(key => this.remove(key))
                        );
                    }
                    return true;
                });
        },

        /**
         * Checks one token and removes it from the store if expired.
         * If the timeLimit is lesser than or equal to 0, no time limit is applied.
         * @param {token} token - the token object
         * @returns {Promise<Boolean>}
         */
        checkExpiry(token) {
            const {tokenTimeLimit} = config;
            if (tokenTimeLimit > 0 && Date.now() - token.receivedAt > tokenTimeLimit) {
                return this.remove(token.value);
            }
            return Promise.resolve(true);
        },

        /**
         * Checks all the tokens in the store to see if they expired
         * @returns {Promise<Boolean>} - resolves to true
         */
        expireOldTokens() {
            return this.getTokens()
                // Check each token's expiry, synchronously:
                .then(tokens => (
                    Object.values(tokens)
                        .reduce(
                            (previousPromise, nextToken) => (
                                previousPromise.then(() => this.checkExpiry(nextToken))
                            ),
                            Promise.resolve()
                        )
                ))
                // All done
                .then(() => true);
        }
    };
}
