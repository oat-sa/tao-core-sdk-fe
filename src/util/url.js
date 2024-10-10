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
 * Copyright (c) 2015-2024 (original work) Open Assessment Technologies SA;
 *
 */

/**
 * Utility library that helps you to manipulate URLs.
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import _ from 'lodash';
import context from 'context';

const parsers = {
    absolute: /^(?:[a-z]+:)?\/\//i,
    base64: /^data:[^/]+\/[^;]+(;charset=[\w]+)?;base64,/,
    query: /(?:^|&)([^&=]*)=?([^&]*)/g,
    url: /^(?:([^:/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:/?#]*)(?::(\d*))?))?((((?:[^?#/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/
};

/**
 * The Url util
 * @exports util/url
 */
const urlUtil = {
    /*
     * The parse method is a adaptation of parseUri from
     * Steven Levithan <stevenlevithan.com> under the MIT License
     */

    /**
     * Parse the given URL and create an object with each URL chunks.
     *
     * BE CAREFUL! This util is different from UrlParser.
     * This one works only from the given string, when UrlParser work from window.location.
     * It means UrlParser will resolve the host of a relative URL using the host of the current window.
     *
     * @param {String} url - the URL to parse
     * @returns {Object} parsedUrl with the properties available in key below and query that contains query string key/values.
     */
    parse(url) {
        const keys = [
            'source',
            'protocol',
            'authority',
            'userInfo',
            'user',
            'password',
            'host',
            'port',
            'relative',
            'path',
            'directory',
            'file',
            'queryString',
            'hash'
        ];

        const parsed = Object.create({
            toString: function () {
                return this.source;
            }
        });

        parsed.base64 = parsers.base64.test(url);

        if (parsed.base64) {
            parsed.source = url;
        } else {
            const matches = parsers.url.exec(url);
            let i = keys.length;
            while (i--) {
                parsed[keys[i]] = matches[i] || '';
            }
            parsed.query = {};
            parsed.queryString.replace(parsers.query, function ($0, $1, $2) {
                if ($1) {
                    parsed.query[$1] = $2;
                }
            });
        }
        return parsed;
    },

    /**
     * Check whether an URL is absolute
     * @param {String|Object} url - the url to check. It can be a parsed URL (result of {@link util/url#parse})
     * @returns {Boolean|undefined} true if the url is absolute, or undefined if the URL cannot be checked
     */
    isAbsolute(url) {
        //url from parse
        if (typeof url === 'object' && Object.prototype.hasOwnProperty.call(url, 'source')) {
            return url.source !== url.relative;
        }
        if (typeof url === 'string') {
            return parsers.absolute.test(url);
        }
    },

    /**
     * Check whether an URL is relative
     * @param {String|Object} url - the url to check. It can be a parsed URL (result of {@link util/url#parse})
     * @returns {Boolean|undefined} true if the url is relative, or undefined if the URL cannot be checked
     */
    isRelative(url) {
        const absolute = this.isAbsolute(url);
        if (typeof absolute === 'boolean') {
            return !absolute;
        }
    },

    /**
     * Check whether an URL is encoded in base64
     * @param {String|Object} url - the url to check. It can be a parsed URL (result of {@link util/url#parse})
     * @returns {Boolean|undefined} true if the url is base64, or undefined if the URL cannot be checked
     */
    isBase64(url) {
        if (typeof url === 'object' && Object.prototype.hasOwnProperty.call(url, 'source')) {
            return url.base64;
        }
        if (typeof url === 'string') {
            return parsers.base64.test(url);
        }
    },

    /**
     * Determine whether encoding is required to match XML standards for attributes
     * @param {String} uri
     * @returns {String}
     */
    encodeAsXmlAttr(uri) {
        return /[<>&']+/.test(uri) ? encodeURIComponent(uri) : uri;
    },

    /**
     * Build a URL.
     * It does not take case about baseURL.
     *
     * @param {String|Array} path - the URL path. Clean concat if an array (no dupe slashes)
     * @param {Object} [params] - params to add to the URL
     * @returns {String} the URL
     */
    build(path, params) {
        let url;

        if (path) {
            if (_.isString(path)) {
                url = path;
            }
            if (_.isArray(path)) {
                url = '';
                _.forEach(path, function (chunk) {
                    if (/\/$/.test(url) && /^\//.test(chunk)) {
                        url += chunk.substr(1);
                    } else if (url !== '' && !/\/$/.test(url) && !/^\//.test(chunk)) {
                        url += `/${chunk}`;
                    } else {
                        url += chunk;
                    }
                });
            }
            if (_.isPlainObject(params)) {
                const hasQueryString = url.indexOf('?') > -1;
                const queryString = _.reduce(
                    params,
                    function (acc, value, key) {
                        if (!_.isEmpty(acc) || hasQueryString) {
                            acc += '&';
                        }
                        if (typeof value === 'object' && !_.isArray(value)) {
                            _.forOwn(value, function (parameterValue, parameterName) {
                                acc += `${encodeURIComponent(key)}[${encodeURIComponent(
                                    parameterName
                                )}]=${encodeURIComponent(parameterValue)}&`;
                            });
                        } else {
                            acc += `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
                        }
                        return acc;
                    },
                    ''
                );
                if (!_.isEmpty(queryString)) {
                    if (!hasQueryString) {
                        url += '?';
                    }
                    url += queryString;
                }
            }
        }

        return url;
    },

    /**
     * Get the URL from a TAO controller route
     * @param {String} action - The controller's action
     * @param {String} controller - The controller's name
     * @param {String} extension - The controller's extension
     * @param {Object} [params] - params to add to the URL
     * @param {String} [rootUrl] - to change the root url, otherwise taken from context
     * @returns {String} the url
     *
     * @throws {TypeError} if one of the required parameter is missing or empty
     */
    route(action, controller, extension, params, rootUrl) {
        const routeParts = [extension, controller, action];

        if (
            _.some(routeParts, function (value) {
                return _.isEmpty(value) || !_.isString(value);
            })
        ) {
            throw new TypeError('All parts are required to build an URL');
        }

        rootUrl = rootUrl || (context && context['root_url']);

        return this.build([rootUrl].concat(routeParts), params);
    }
};

export default urlUtil;
