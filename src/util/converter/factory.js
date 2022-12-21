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
 * Copyright (c) 2022 (original work) Open Assessment Technologies SA ;
 */

import _ from 'lodash';

/**
 * Defines a converter processor runtime.
 * @callback converterProcessorRuntime
 * @param {string} text - The text to convert.
 * @param {object} [config] - An optional config object that may contain processor specific configuration.
 * @returns {string} - Returns the converted text.
 */

/**
 * Defines a converter processor.
 * @typedef {object} converterProcessor
 * @property {string} name - The name of the converter processor. It needs to be unique within the collection.
 * @property {converterProcessorRuntime} convert - The processor runtime that will actually convert the text.
 */

/**
 * Checks a converter processor is valid.
 * @param {converterProcessor} processor - The converter processor to validate.
 * @returns {boolean} - Returns `true` if the converter processor is valid ; returns `false` otherwise.
 */
function validateProcessor(processor) {
    if (!_.isPlainObject(processor)) {
        return false;
    }

    if ('string' !== typeof processor.name || !processor.name) {
        return false;
    }

    return 'function' === typeof processor.convert;
}

/**
 * Creates a text converter.
 * @param {converterProcessor[]} builtinProcessors - A list of built-in converter processors.
 * @returns {converter} - Returns the text converter, ready for use.
 */
export default function converterFactory(builtinProcessors = []) {
    let processors = [];

    // find the index of the named processor
    const findProcessor = name => processors.findIndex(processor => processor.name === name);

    /**
     * @typedef {object} converter
     */
    const converter = {
        /**
         * Converts a text with respect to the registered converter processors.
         * @param {string} text - The text to convert.
         * @param {object} [config] - An optional config object that may contain processor specific configuration.
         * @returns {string} - Returns the converted text.
         */
        convert(text, config = {}) {
            for (const processor of processors) {
                text = processor.convert.call(converter, text, config);
            }

            return text;
        },

        /**
         * Registers a converter processor.
         * @param {converterProcessor} processor - The converter processor to register.
         * @returns {converter} - Chains the instance.
         */
        register(processor) {
            if (!validateProcessor(processor)) {
                throw new TypeError('The given processor is not valid!');
            }

            if (findProcessor(processor.name) > -1) {
                throw new TypeError(`The processor "${name}" is already registered!`);
            }

            processors.push(processor);

            return this;
        },

        /**
         * Unregisters a converter processor.
         * @param {string|converterProcessor} name - The name of the processor to remove.
         * @returns {converter} - Chains the instance.
         */
        unregister(name) {
            if ('object' === typeof name) {
                name = name.name;
            }

            processors = processors.filter(processor => processor.name !== name);

            return this;
        },

        /**
         * Removes all converter processors.
         * @returns {converter} - Chains the instance.
         */
        clear() {
            processors = [];

            return this;
        },

        /**
         * Tells whether a converter processor is registered or not.
         * @param {string} name - The name of the processor to check.
         * @returns {boolean} - Returns `true` if the converter processor is registered ; returns `false` otherwise.
         */
        isRegistered(name) {
            return findProcessor(name) > -1;
        }
    };

    for (const processor of builtinProcessors) {
        converter.register(processor);
    }

    return converter;
}
