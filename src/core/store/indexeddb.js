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
 * IndexedDB backend of the client store
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import _ from 'lodash';
import Promise from 'core/promise';
import IDBStore from 'idb-wrapper';
import uuid from 'lib/uuid';

/**
 * Prefix all databases
 * @type {String}
 */
const prefix = 'tao-store-';

/**
 * Access to the index of known stores.
 * This index is needed to maintain the list of stores created by TAO, in order to apply an auto clean up.
 * @type {Promise}
 */
let knownStores;

/**
 * The name of the store that contains the index of known stores.
 * @type {String}
 */
const knownStoresName = 'index';

/**
 * The name of the store that contains the store id
 * @type {String}
 */
const idStoreName = 'id';

/**
 * Check if we're using the v2 of IndexedDB
 * @type {Boolean}
 */
const isIndexedDB2 = typeof IDBObjectStore !== 'undefined' && 'getAll' in IDBObjectStore.prototype;

/**
 * Opens a store
 * @param {string} storeName
 * @returns {Promise} with store instance in resolve
 */
function openStore(storeName) {
    return new Promise(function (resolve, reject) {
        const store = new IDBStore({
            dbVersion: 1,
            storeName: storeName,
            storePrefix: prefix,
            keyPath: 'key',
            autoIncrement: true,
            onStoreReady() {
                // auto closes when the changed version reflects a DB deletion
                store.db.onversionchange = function onversionchange(e) {
                    if (!e || !e.newVersion) {
                        store.db.close();
                    }
                };
                resolve(store);
            },
            onError: reject
        });
    });
}

/**
 * Sets an entry into a particular store
 * @param {object} store
 * @param {string} key
 * @param {*} value
 * @returns {Promise}
 */
function setEntry(store, key, value) {
    return new Promise(function (resolve, reject) {
        const entry = {
            key: key,
            value: value
        };
        function success(returnKey) {
            resolve(returnKey === key);
        }
        store.put(entry, success, reject);
    });
}

/**
 * Gets an entry from a particular store
 * @param {object} store
 * @param {string} key
 * @returns {Promise}
 */
function getEntry(store, key) {
    return new Promise(function (resolve, reject) {
        function success(entry) {
            if (!entry || typeof entry.value === 'undefined') {
                return resolve(entry);
            }

            resolve(entry.value);
        }
        store.get(key, success, reject);
    });
}

/**
 * Get entries from a store
 * @param {object} store
 * @returns {Promise<Object>} entries
 */
function getEntries(store) {
    return new Promise(function (resolve, reject) {
        function success(entries) {
            if (!_.isArray(entries)) {
                return resolve({});
            }

            resolve(
                _.reduce(
                    entries,
                    function (acc, entry) {
                        if (entry.key && entry.value) {
                            acc[entry.key] = entry.value;
                        }
                        return acc;
                    },
                    {}
                )
            );
        }
        store.getAll(success, reject);
    });
}

/**
 * Remove an entry from a particular store
 * @param {object} store
 * @param {string} key
 * @returns {Promise}
 */
function removeEntry(store, key) {
    return new Promise(function (resolve, reject) {
        function success(result) {
            resolve(result !== false);
        }
        store.remove(key, success, reject);
    });
}

/**
 * Gets access to the store that contains the index of known stores.
 * @returns {Promise}
 */
function getKnownStores() {
    if (!knownStores) {
        knownStores = openStore(knownStoresName);
    }
    return knownStores;
}

/**
 * Adds a store into the index of known stores.
 * @param {String} storeName
 * @returns {Promise}
 */
function registerStore(storeName) {
    return getKnownStores().then(function (store) {
        return setEntry(store, storeName, {
            name: storeName,
            lastOpen: Date.now()
        });
    });
}

/**
 * Removes a store from the index of known stores.
 * @param {String} storeName
 * @returns {Promise}
 */
function unregisterStore(storeName) {
    return getKnownStores().then(function (store) {
        return removeEntry(store, storeName);
    });
}

/**
 * Deletes a store, then removes it from the index of known stores.
 * @param {object} store
 * @param {string} storeName
 * @returns {Promise}
 */
function deleteStore(store, storeName) {
    return new Promise(function (resolve, reject) {
        function success() {
            unregisterStore(storeName)
                .then(function () {
                    resolve(true);
                })
                .catch(reject);
        }
        //with old implementation, deleting a store is
        //either unsupported or buggy
        if (isIndexedDB2) {
            store.deleteDatabase(success, reject);
        } else {
            store.clear(success, reject);
        }
    });
}

/**
 * Open and access a store
 * @param {String} storeName - the store name to open
 * @returns {Object} the store backend
 * @throws {TypeError} without a storeName
 */
function indexDbBackend(storeName) {
    //keep a ref of the running store
    let innerStore;

    /**
     * Get the store
     * @returns {Promise} with store instance in resolve
     */
    function getStore() {
        if (!innerStore) {
            innerStore = openStore(storeName).then(function (store) {
                return registerStore(storeName).then(function () {
                    return Promise.resolve(store);
                });
            });
        }
        return innerStore;
    }

    //keep a ref to the promise actually writing
    let writePromise;

    /**
     * Ensure write promises are executed in series
     * @param {Function} getWritingPromise - the function that run the promise
     * @returns {Promise} the original one
     */
    function ensureSerie(getWritingPromise) {
        //first promise, keep the ref
        if (!writePromise) {
            writePromise = getWritingPromise();
            return writePromise;
        }

        //create a wrapping promise
        return new Promise(function (resolve, reject) {
            //run the current request
            function runWrite() {
                const p = getWritingPromise();
                writePromise = p; //and keep the ref
                p.then(resolve).catch(reject);
            }

            //wait the previous to resolve or fail and run the current one
            writePromise.then(runWrite).catch(runWrite);
        });
    }

    if (_.isEmpty(storeName) || !_.isString(storeName)) {
        throw new TypeError('The store name is required');
    }

    /**
     * The store
     */
    return {
        /**
         * Get an item with the given key
         * @param {String} key
         * @returns {Promise} with the result in resolve, undefined if nothing
         */
        getItem(key) {
            return ensureSerie(function getWritingPromise() {
                return getStore().then(function (store) {
                    return getEntry(store, key);
                });
            });
        },

        /**
         * Set an item with the given key
         * @param {String} key - the item key
         * @param {*} value - the item value
         * @returns {Promise} with true in resolve if added/updated
         */
        setItem(key, value) {
            return ensureSerie(function getWritingPromise() {
                return getStore().then(function (store) {
                    return setEntry(store, key, value);
                });
            });
        },

        /**
         * Remove an item with the given key
         * @param {String} key - the item key
         * @returns {Promise} with true in resolve if removed
         */
        removeItem(key) {
            return ensureSerie(function getWritingPromise() {
                return getStore().then(function (store) {
                    return removeEntry(store, key);
                });
            });
        },

        /**
         * Get all store items
         * @returns {Promise<Object>} with a collection of items
         */
        getItems() {
            return ensureSerie(function getWritingPromise() {
                return getStore().then(function (store) {
                    return getEntries(store);
                });
            });
        },

        /**
         * Clear the current store
         * @returns {Promise} with true in resolve once cleared
         */
        clear() {
            return ensureSerie(function getWritingPromise() {
                return getStore().then(function (store) {
                    return new Promise(function (resolve, reject) {
                        var success = function success() {
                            resolve(true);
                        };
                        store.clear(success, reject);
                    });
                });
            });
        },

        /**
         * Delete the database related to the current store
         * @returns {Promise} with true in resolve once cleared
         */
        removeStore() {
            return ensureSerie(function getWritingPromise() {
                return getStore().then(function (store) {
                    return deleteStore(store, storeName);
                });
            });
        }
    };
}

/**
 * Removes all storage
 * @param {Function} [validate] - An optional callback that validates the store to delete
 * @returns {Promise} with true in resolve once cleaned
 */
indexDbBackend.removeAll = function removeAll(validate) {
    if (!_.isFunction(validate)) {
        validate = null;
    }
    return getKnownStores().then(function (store) {
        return new Promise(function (resolve, reject) {
            function cleanUp(entries) {
                const all = [];
                _.forEach(entries, function (entry) {
                    const storeName = entry && entry.key;
                    if (storeName) {
                        all.push(
                            openStore(storeName).then(function (storeToRemove) {
                                if (!validate || validate(storeName, entry.value)) {
                                    return deleteStore(storeToRemove, storeName);
                                }
                            })
                        );
                    }
                });

                Promise.all(all).then(resolve).catch(reject);
            }
            store.getAll(cleanUp, reject);
        });
    });
};

/**
 * Get all storage
 * @param {Function} [validate] - An optional callback that validates the store to delete
 * @returns {Promise} with true in resolve once cleaned
 */
indexDbBackend.getAll = function getAll(validate) {
    if (!_.isFunction(validate)) {
        validate = function valid() {
            return true;
        };
    }
    return getKnownStores().then(function (store) {
        return new Promise(function (resolve, reject) {
            store.getAll(function (entries) {
                const storeNames = _(entries)
                    .filter(function (entry) {
                        return entry && entry.key && validate(entry.key, entry.value);
                    })
                    .map(function (entry) {
                        return entry.key;
                    })
                    .value();

                return resolve(storeNames);
            }, reject);
        });
    });
};

/**
 * Get the identifier of the storage
 * @returns {Promise} that resolves with the store identifier
 */
indexDbBackend.getStoreIdentifier = function getStoreIdentifier() {
    return openStore(idStoreName).then(function (store) {
        return getEntry(store, idStoreName).then(function (id) {
            if (!_.isEmpty(id)) {
                return id;
            }
            id = uuid();

            return setEntry(store, idStoreName, id).then(function () {
                return id;
            });
        });
    });
};

export default indexDbBackend;
