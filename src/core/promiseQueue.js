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
 * Copyright (c) 2017-2019 Open Assessment Technologies SA
 */

/**
 * A promise queue to fil the gap... (to run them in series for example)
 *
 * @example Ensure b starts once a is finished
 * var a = function a (){
 *   return new Promise(function(resolve){
 *      setTimeout(resolve, 150);
 *   });
 * };
 * var b = function b (){
 *   return new Promise(function(resolve){
 *      setTimeout(resolve, 25);
 *   });
 * };
 *
 * var queue = promiseQueueFactory();
 * queue.serie(a);
 * queue.serie(b);
 *
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import _ from 'lodash';
import Promise from 'core/promise';
import eventifier from 'core/eventifier';
import uuid from 'core/uuid';

/**
 * Creates a new promise queue
 * @returns {promiseQueue}
 */
export default function promiseQueueFactory() {
    //where we keep the pending promises
    let queue = {};

    function getId() {
        const id = `promise-${uuid(6)}`;
        if (typeof queue[id] === 'undefined') {
            return id;
        }
        return getId();
    }

    /**
     * @typedef {promiseQueue}
     */
    return {
        /**
         * Just add another promise to the queue
         * @param {Promise} promise
         * @returns {promiseQueue} chains
         */
        add(promise) {
            queue[getId()] = promise;
            return this;
        },

        /**
         * Get the queue values
         * @returns {Promise[]} the array of promises in the queue
         */
        getValues() {
            return _.values(queue);
        },

        /**
         * Empty the queue
         * @returns {promiseQueue} chains
         */
        clear() {
            queue = {};
            return this;
        },

        /**
         * Run the given promise at the end of the queue,
         * @param {Function} promiseFn - a function that returns a promise
         * @returns {Promise}
         */
        serie(promiseFn) {
            const id = getId();

            //the actual queue to execute before running the given promise
            const currentQueue = this.getValues();

            //use an emitter to notify the promise fulfillment, internally.
            const emitter = eventifier();

            //add a waiting promise into the queue (for others who are calling the queue)
            queue[id] = new Promise(function (resolve) {
                emitter.on('fulfilled', resolve);
            });

            //wait for the queue,
            //then run the given promise
            //and resolve the waiting promise (for others)
            return Promise.all(currentQueue)
                .then(function () {
                    if (_.isFunction(promiseFn)) {
                        return promiseFn();
                    }
                })
                .then(function (data) {
                    emitter.trigger('fulfilled');
                    delete queue[id];
                    return data;
                })
                .catch(function (err) {
                    queue = {};
                    throw err;
                });
        }
    };
}
