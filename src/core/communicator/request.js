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
 * Copyright (c) 2017-2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * A communicator provider that communicate only through `send` request.
 * It uses the poll provider but never starts the polling...
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import _ from 'lodash';
import pollProvider from './poll';

/**
 * 'request' provider for {@link core/communicator}
 * @extends {core/communicator/poll} never start nor stop the polling
 */
const requestProvider = _.defaults({

    /**
     * the provider name
     */
    name: 'request',

    /**
     * @returns {Promise}
     */
    destroy: function destroy() {
        this.throttledSend = null;
        this.messagesQueue = null;

        return Promise.resolve();
    },

    /**
     * @returns {Promise}
     */
    open: function open() {
        return Promise.resolve();
    },

    /**
     * @returns {Promise}
     */
    close: function close() {
        return Promise.resolve();
    },

    /**
     * Sends a messages through the communication implementation
     * @param {String} channel - The name of the communication channel to use
     * @param {Object} message - The message to send
     * @returns {Promise}
     */
    send: function send(channel, message) {
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

        this.request();

        return promise;
    }
}, pollProvider );

export default requestProvider;
