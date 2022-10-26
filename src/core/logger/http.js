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
 * Copyright (c) 2017-2019 (original work) Open Assessment Technologies SA;
 *
 */

/**
 * The logger sending data to the server.
 *
 * @author Aleh Hutnikau <hutnikau@1pt.com>
 */
import _ from 'lodash';
import $ from 'jquery';
import urlHelper from 'util/url';

const defaultConfig = {
    url: urlHelper.route('log', 'Log', 'tao'),
    level: 'warning',
    delay: 500 //milliseconds of delay to flush
};
let config = Object.assign({}, defaultConfig);
let logQueue = [];

/**
 * Push log message into log queue
 * @param {Object} message - log message
 */
function push(message) {
    logQueue.push(message);
}

/**
 * Flush the log messages store and retrieve the data
 */
function flush() {
    const messages = logQueue;
    logQueue = [];
    send(messages);
}

/**
 * Send log messages from the queue
 * @param {Array} messages - log messages
 */
function send(messages) {
    $.ajax({
        url: config.url,
        type: 'POST',
        cache: false,
        data: { messages: JSON.stringify(messages) },
        dataType: 'json',
        global: false,
        error() {
            _.forEach(flush, function (message) {
                push(message);
            });
        }
    });
}

let debouncedFlush = _.debounce(flush, defaultConfig.delay);

/**
 * @type {logger} the logger
 */
export default {
    setConfig(newConfig) {
        config = _.defaults(newConfig || {}, defaultConfig);
        if (_.isArray(config.url)) {
            config.url = urlHelper.route(...config.url);
        }
        debouncedFlush = _.debounce(flush, config.delay);
    },
    /**
     * log message
     * @param {Object} message - See core/logger/api::log() method
     */
    log(message) {
        if (this.checkMinLevel(config.level, message.level)) {
            push(message);
            debouncedFlush();
        }
    }
};
