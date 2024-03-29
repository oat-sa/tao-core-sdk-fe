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
 * Copyright (c) 2013-2019 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 *
 *
 */

/**
 * Parse and extract info from the current browser's URL.
 *
 * Be careful, îf you want to parse URLs that isn't the current one of relative to your window domain, use util/url.
 * For example a relative URL will have as host the current window's host.
 *
 * TODO move to util and see how it can be merged with util/url or a least rely on it for some parts.
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import _ from 'lodash';

const urlParts = ['hash', 'host', 'hostname', 'pathname', 'port', 'protocol', 'search'];

/**
 * Parse an URL and gives you access to its parts
 *
 * @deprecated - at least most parts - see individual methods
 * @see {URL} https://developer.mozilla.org/en-US/docs/Web/API/URL browser-native URL API
 * @see {url-polyfill} https://www.npmjs.com/package/url-polyfill  package to cover other browsers
 *
 * @exports urlParser
 * @constructor
 * @param {String} url
 */
function UrlParser(url) {
    this.url = url;

    //use the parser within the browser DOM engine
    //thanks to https://gist.github.com/jlong/2428561
    const detachedAnchor = document.createElement('a');
    detachedAnchor.href = url;
    this.data = _.pick(detachedAnchor, urlParts);
    this.params = UrlParser.extractParams(this.data.search);
}

/**
 * Get an object that represents query params from the search string
 * @deprecated
 * @memberOf UrlParser
 * @param {String} search
 * @returns {Object} key : value
 */
UrlParser.extractParams = function (search) {
    const params = {};
    search.replace(/^\?/, '').replace(/([^=&]+)=([^&]*)/g, function (m, key, value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
    });
    return params;
};

/**
 * Get a part of the url
 * @deprecated
 * @memberOf UrlParser
 * @param {string} what - in 'hash', 'host', 'hostname', 'pathname', 'port', 'protocol', 'search'
 * @returns {String|Boolean} the requested url part or false
 */
UrlParser.prototype.get = function (what) {
    return _.includes(urlParts, what) ? this.data[what] : false;
};

/**
 * Get an object that represents the URL's query params
 * @deprecated
 * @memberOf UrlParser
 * @returns {Object} key : value
 */
UrlParser.prototype.getParams = function () {
    return this.params;
};

/**
 * Replace  the parameter set
 * @deprecated
 * @memberOf UrlParser
 * @param {Object} params - of key:value
 */
UrlParser.prototype.setParams = function (params) {
    if (_.isObject(params)) {
        this.params = params;
    }
};

/**
 * Add a new parameter
 * @deprecated
 * @memberOf UrlParser
 * @param {String} key
 * @param {String} value
 */
UrlParser.prototype.addParam = function (key, value) {
    if (key) {
        this.params[key] = value;
    }
};

/**
 * Get each paths chunk
 * @memberOf UrlParser
 * @returns {Array} - the paths
 */
UrlParser.prototype.getPaths = function () {
    return this.data.pathname.replace(/^\/|\/$/g, '').split('/');
};

/**
 * Get the URL
 * @deprecated
 * @param {Array} [exclude] - url parts to exclude in hosts, params and hash
 * @returns {String} the url
 */
UrlParser.prototype.getUrl = function (exclude) {
    let url = '';
    exclude = exclude || [];
    if (this.data) {
        if (this.data.hostname && !_.includes(exclude, 'host')) {
            url += `${this.data.protocol ? this.data.protocol : 'http:'}//${this.data.hostname.replace(/\/$/, '')}`;

            //the value of the port seems to be different regardign the browser, so we prevent adding port if not usual
            if (this.data.port && this.data.port !== 80 && this.data.port !== '80' && this.data.port !== '0') {
                url += `:${this.data.port}`;
            }
        }
        if (!/\/$/.test(url) && !/^\//.test(this.data.pathname)) {
            url += '/';
        }
        url += this.data.pathname; //there is always a path

        if (this.params && !_.includes(exclude, 'params')) {
            url += '?';
            _.forEach(this.params, function (value, key) {
                url += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`;
            });
            url = url.substring(0, url.length - 1);
        }

        if (this.data.hash && !_.includes(exclude, 'hash')) {
            url += this.data.hash;
        }
    }
    return url;
};

/**
 * Get the URL without parameters, hash and file if
 * @deprecated
 * @returns {String} the url
 */
UrlParser.prototype.getBaseUrl = function () {
    let baseUrl = this.getUrl(['params', 'hash']);
    const paths = this.getPaths();
    const lastPart = paths[paths.length - 1];

    //remove if trailing path token is a file
    if (paths.length > 0 && /\.[a-z]+$/.test(lastPart)) {
        baseUrl = baseUrl.replace(lastPart, '').replace(/\/\/$/, '/');
    }

    return baseUrl;
};

/**
 * is the current URL in the same domain than the one in paramter
 * based on Cross Origin Resource Sharing rules.
 * @memberOf UrlParser
 * @param {String|UrlParser} [url=window.location] - to compare with
 * @returns {Boolean} true if same domain
 * @throws {TypeError} with wrong parameters
 */
UrlParser.prototype.sameDomain = function (url) {
    let parsedUrl;
    if (typeof url === 'undefined') {
        parsedUrl = new UrlParser(window.location);
    }
    if (typeof url === 'string') {
        parsedUrl = new UrlParser(url);
    }
    if (url instanceof UrlParser) {
        parsedUrl = url;
    }
    if (!(parsedUrl instanceof UrlParser)) {
        throw new TypeError('Invalid url format');
    }
    return (
        this.get('protocol') === 'data:' ||
        parsedUrl.get('protocol') === 'data:' ||
        (this.get('protocol') === parsedUrl.get('protocol') &&
            this.get('hostname') === parsedUrl.get('hostname') &&
            this.get('port') === parsedUrl.get('port'))
    );
};

/**
 * @deprecated badly named
 * @see {UrlParser.sameDomain} instead
 */
UrlParser.prototype.checkCORS = UrlParser.prototype.sameDomain;

export default UrlParser;
