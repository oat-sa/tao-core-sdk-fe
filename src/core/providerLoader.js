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
 * Loads providers, and feeds a registry if provided
 *
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import _ from 'lodash';
import moduleLoaderFactory from 'core/moduleLoader';

/**
 * Checks a provider object
 * @param {object} provider
 * @returns {Boolean}
 */
function validateProvider(provider) {
    return (
        _.isPlainObject(provider) &&
        _.isFunction(provider.init) &&
        _.isString(provider.name) &&
        !_.isEmpty(provider.name)
    );
}

/**
 * Creates a loader with the list of required providers
 * @param {String: Object[]} requiredProviders - A list of mandatory providers, where the key is the category and the value are an array of providers
 * @returns {loader} the provider loader
 * @throws TypeError if something is not well formatted
 */
export default function providerLoader(requiredProviders) {
    return moduleLoaderFactory(requiredProviders, validateProvider, {
        /**
         * Get the resolved provider list.
         * Load needs to be called before to have the dynamic providers.
         * @param {String} [category] - to get the providers for a given category, if not set, we get everything
         * @returns {Function[]} the providers
         */
        getProviders(category) {
            return this.getModules(category);
        }
    });
}
