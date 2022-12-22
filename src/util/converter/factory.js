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
 * Creates a text converter.
 * @param {converterProcessor[]} builtinProcessors - A list of built-in converter processors.
 * @param {object} [builtinConfig] - An optional default config object that may contain processor specific configuration.
 *                                   It will be forwarded to each call to the converter.
 * @returns {converter} - Returns the text converter, ready for use.
 * @export 'util/converter/factory'
 */
export default function converterFactory(builtinProcessors = [], builtinConfig = {}) {
    let processors = [];

    // find the index of the named processor
    /**
     * @typedef {object} converter
     */
    const converter = {
        /**
         * Converts a text with respect to the registered converter processors.
         * @param {string} text - The text to convert.
         * @param {object} [config] - An optional config object that may contain processor specific configuration.
         *                            It will be merged with the possible builtin config.
         * @returns {string} - Returns the converted text.
         */
        convert(text, config = {}) {
            const localConfig = Object.assign({}, builtinConfig, config);
            for (const processor of processors) {
                text = processor.convert.call(converter, text, localConfig);
            }

            return text;
        },

        /**
         * Registers a converter processor.
         * A processor is an object that contains both a `name`, which must be unique,
         * and a `convert()` function for converting the given text.
         * @param {converterProcessor} processor - The converter processor to register.
         * @returns {converter} - Chains the instance.
         * @throws {TypeError} - If the processor does not comply with the requirements.
         */
        register(processor) {
            validateProcessor(processor);

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
            return processors.findIndex(processor => processor.name === name) > -1;
        }
    };

    /**
     * Checks a converter processor is valid, and throws an error if not.
     * @param {converterProcessor} processor - The converter processor to validate.
     * @throws {TypeError} - If the processor does not comply with the requirements.
     */
    function validateProcessor(processor) {
        if ('object' !== typeof processor) {
            throw new TypeError('The given processor must be an object!');
        }

        if ('string' !== typeof processor.name || !processor.name) {
            throw new TypeError('A processor needs a name to identify it!');
        }

        if ('function' !== typeof processor.convert) {
            throw new TypeError('A processor needs a runtime function for converting the text!');
        }

        if (converter.isRegistered(processor.name)) {
            throw new TypeError(`The processor "${processor.name}" is already registered!`);
        }
    }

    for (const processor of builtinProcessors) {
        converter.register(processor);
    }

    return converter;
}
