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
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */

/**
 * Watch a promise and raise a timeout if it takes more time than the expected amount of milliseconds.
 * If a timeout occurs, the promise is rejected with an Error containing the optional provided message,
 * and a `timeout property set to `true`.
 *
 * By default the timeout is set to 30 seconds.
 *
 * @example
 *  promiseTimeout(new Promise((resolve, reject) => {
 *      // ...
 *  }).then(() => {
 *      // ...
 *  }).catch(err => {
 *      if (err && err.timeout) {
 *          // ...
 *      } else {
 *          // ...
 *      }
 *  });
 *
 *  promiseTimeout(new Promise((resolve, reject) => {
 *      // ...
 *  }).then(() => {
 *      // ...
 *  }).catch(err => {
 *      if (err && err.timeout) {
 *          // ...
 *      } else {
 *          // ...
 *      }
 *  }, {
 *      timeout: 20000, // 20sec timout
 *      message: 'A timeout occurred!'
 *  });
 *
 * @param {Promise} promise - The main promise to watch
 * @param {Object} [config] - Setup the watcher
 * @param {Number} [config.timeout] - Grace period to give to the main promise to complete, in milliseconds
 * @param {String} [config.message] - Message of the error returned if the timeout occurred
 * @returns {Promise}
 */
function promiseTimeout(promise, {timeout = 30000, message = 'The process took too long!'} = {}) {
    return Promise.race([
        promise,
        new Promise((resolve, reject) => {
            window.setTimeout(() => {
                const err = new Error(message);
                err.timeout = true;
                reject(err);
            }, timeout);
        })
    ]);
}

export default promiseTimeout;
