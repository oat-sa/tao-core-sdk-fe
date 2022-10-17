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
 * Copyright (c) 2014-2019 Open Assessment Technologies SA ;
 */
/**
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import categories from 'core/mimetype/categories.json';
import extensions from 'core/mimetype/extensions.json';

/**
 * Helps you to retrieve file type and categories based on a file mime type
 * @exports core/mimetype
 */
const mimetypeHelper = {
    /**
     * Gets the MIME type of a resource.
     *
     * @param {String} url - The URL of the resource to get type of
     * @param {Function} [callback] - An optional function called when the response is received.
     *                                This callback must accept 2 arguments:
     *                                the first is the potential error if the request failed,
     *                                the second is the MIME type if the request succeed.
     * @returns {mimetype}
     */
    getResourceType(url, callback) {
        $.ajax({
            type: 'HEAD',
            async: true,
            url: url,
            success(message, text, jqXHR) {
                const mime = jqXHR.getResponseHeader('Content-Type');
                if (callback) {
                    callback(null, mime);
                }
            },

            error(jqXHR) {
                const error = jqXHR.status || 404;
                if (callback) {
                    callback(error);
                }
            }
        });
        return this;
    },

    /**
     * Get the type from a mimeType regarding the mimeMapping above
     * @param {Object} file - the file
     * @param {String} [file.mime] - the mime type
     * @param {String} [file.name] - the file name
     * @returns {String} the type
     */
    getFileType(file) {
        let type;
        const mime = file.mime;

        if (mime) {
            //lookup for exact mime
            type = _.findKey(categories, {
                mimes: [mime]
            });

            //then check  with star
            if (!type) {
                type = _.findKey(categories, {
                    mimes: [mime.replace(/\/.*$/, '/*')]
                });
            }
        }

        //try by extension
        if (!type) {
            const ext = getFileExtension(file.name);
            if (ext) {
                type = _.findKey(categories, {
                    extensions: [ext]
                });
            }
        }

        return type;
    },

    /**
     * Check if a given mime type matches some filters
     * @param {String} type - the mime type
     * @param {String[]} validTypes - the validTypes
     * @returns {String} category
     */
    match(type, validTypes) {
        // Under rare circumstances a browser may report the mime type
        // with quotes (e.g. "application/foo" instead of application/foo)
        const checkType = type.replace(/^["']+|['"]+$/g, '');

        const starType = checkType.replace(/\/.*$/, '/*');

        return _.contains(validTypes, checkType) || _.contains(validTypes, starType);
    },

    /**
     * Get the category of a type
     * @param {String} type
     * @returns {String} category
     */
    getCategory(type) {
        if (categories[type]) {
            return categories[type].category;
        }
    },

    /**
     * Get mime type from a File object
     * It first based the detection on the standard type File.type property
     * If the returned type is empty or in a generic application/octet-stream, it will use its extension.
     * If the extension is unknown, the property File.type is returned anyway.
     *
     * @param {File} file
     * @returns {String} the mime type
     */
    getMimeType(file) {
        const type = file.type;
        const category = mimetypeHelper.getFileType({
            name: file.name,
            mime: type
        });

        if (type && !type.match(/invalid/) && category !== 'generic') {
            return type;
        } else {
            const ext = getFileExtension(file.name);
            if (ext && extensions[ext]) {
                return extensions[ext];
            }
        }
        return type;
    }
};

/**
 * Get the file extension from the file name
 *
 * @param {String} fileName
 * @returns {String}
 */
function getFileExtension(fileName) {
    const extMatch = fileName.match(/\.([0-9a-z]+)(?:[?#]|$)/i);
    if (extMatch && extMatch.length > 1) {
        return extMatch[1];
    }
}

export default mimetypeHelper;
