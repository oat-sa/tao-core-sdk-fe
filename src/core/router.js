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
 * Copyright (c) 2014-2019 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 */

/**
 * Dispatch modules based on an URL.
 * The Url has the form (scheme://fqdn)/extension/controller/action(?queryParams)
 * the query path composed of the 3 chunks is mandatory
 *
 * The disptach triggers the load of the extension bundle (in production mode)
 * and the module extension/controllers/routes.js, if not already.
 *
 * Then based on the content of the routes.js file, we load the controllers.
 * A controller module needs to return an object with a start method, which will be executed.
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import _ from 'lodash';
import context from 'context';
import UrlParser from 'util/urlParser';
import loggerFactory from 'core/logger';
import Promise from 'core/promise';

const logger = loggerFactory('router');

/**
 * The router helps you to execute a controller when an URL maps a defined route.
 *
 * The routes are defined by extension, into the module {extension}/controller/routes
 * @see http://forge.taotesting.com/projects/tao/wiki/Front_js
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 * @exports router
 */
const router = {
    /**
     * Routing dispatching: execute the controller for the given URL.
     * If more than one URL is provided, we try to dispatch until a valid routing if found
     * (used mainly for forward/redirects).
     *
     * @param {Array|String} urls - the urls to try to dispatch
     * @param {Function} cb - a callback executed once dispatched
     * @returns {Promise}
     */
    dispatch(urls, cb) {
        if (!_.isArray(urls)) {
            urls = [urls];
        }

        return Promise.all(urls.map(url => this.dispatchUrl(url)))
            .then(function () {
                if (_.isFunction(cb)) {
                    cb();
                }
            })
            .catch(function (err) {
                logger.error(err);
            });
    },

    /**
     * Parse an URL and extract MVC route
     * @param {String} url - the URL to parse
     * @returns {Object} the route structure
     */
    parseMvcUrl(url) {
        let route = null;

        if (_.isString(url) && !_.isEmpty(url)) {
            const parser = new UrlParser(url);
            const paths = parser.getPaths();
            if (paths.length >= 3) {
                route = {
                    action: paths[paths.length - 1],
                    module: paths[paths.length - 2],
                    extension: paths[paths.length - 3],
                    params: parser.getParams()
                };
            }
        }
        return route;
    },

    /**
     * If in production mode, we load the extension bundle
     * @param {Object} route
     * @param {String} route.extension
     * @returns {Promise} once loaded
     */
    loadRouteBundle(route) {
        //only for bundle mode and route which are not TAO (self contained)
        if (route && route.extension && context.bundle && route.extension !== 'tao') {
            return new Promise(function (resolve) {
                const routeBundle = `${route.extension}/loader/${route.extension}.min`;

                window.require([routeBundle], resolve, function (err) {
                    //do not break in case of error, module loading will take over
                    logger.warn(`Unable to load ${routeBundle} : ${err.message}`);

                    resolve();
                });
            });
        }
        return Promise.resolve();
    },

    /**
     * Loads the extension routes
     *
     * @param {Object} route
     * @param {String} route.extension
     * @returns {Promise<Object>} resolves with the routes data
     */
    loadRoute(route) {
        if (route && route.extension) {
            return new Promise(function (resolve, reject) {
                const routeModule =
                    route.extension === 'tao' ? 'controller/routes' : `${route.extension}/controller/routes`;

                //loads the routing for the current extensino
                window.require([routeModule], resolve, reject);
            });
        }
        return Promise.resolve();
    },

    /**
     * Dispatch the given URL :
     *  - get the URL route
     *  - load the route bundle
     *  - load the routes routing
     *  - load the route's controllers
     *  - execute the start method of those controllers
     * @param {String} url - the
     * @returns {Promise}
     */
    dispatchUrl(url) {
        //parse the URL
        const route = this.parseMvcUrl(url);

        logger.debug(`Dispatch URL ${url}`);

        return this.loadRouteBundle(route)
            .then(() => this.loadRoute(route))
            .then(function (routes) {
                let dependencies = [];
                let styles = [];
                const moduleConfig = {};
                function mapStyle(style) {
                    return `css!${route.extension}Css/${style}`;
                }
                if (routes && routes[route.module]) {
                    //get the dependencies for the current context
                    const moduleRoutes = routes[route.module];

                    //resolve controller dependencies
                    if (moduleRoutes.deps) {
                        dependencies = dependencies.concat(moduleRoutes.deps);
                    }
                    if (moduleRoutes.css) {
                        styles = _.isArray(moduleRoutes.css) ? moduleRoutes.css : [moduleRoutes.css];
                        dependencies = dependencies.concat(_.map(styles, mapStyle));
                    }

                    //resolve actions dependencies
                    if ((moduleRoutes.actions && moduleRoutes.actions[route.action]) || moduleRoutes[route.action]) {
                        const action = moduleRoutes.actions[route.action] || moduleRoutes[route.action];
                        if (_.isString(action) || _.isArray(action)) {
                            dependencies = dependencies.concat(action);
                        }
                        if (action.deps) {
                            dependencies = dependencies.concat(action.deps);
                        }
                        if (action.css) {
                            styles = _.isArray(action.css) ? action.css : [action.css];
                            dependencies = dependencies.concat(_.map(styles, mapStyle));
                        }
                    }

                    //alias controller/ to extension/controller
                    dependencies = _.map(dependencies, function (dep) {
                        return /^controller/.test(dep) && route.extension !== 'tao' ? `${route.extension}/${dep}` : dep;
                    });

                    //URL parameters are given by default to the required module (through module.confid())
                    if (!_.isEmpty(route.params)) {
                        _.forEach(dependencies, function (dependency) {
                            //inject parameters using the curent requirejs contex. This rely on a private api...
                            moduleConfig[dependency] = _.merge(
                                _.clone(window.requirejs.s.contexts._.config.config[dependency] || {}),
                                route.params
                            );
                        });
                        window.requirejs.config({ config: moduleConfig });
                    }
                }
                return dependencies;
            })
            .then(function (dependencies) {
                if (dependencies && dependencies.length) {
                    logger.debug(`Load controllers : ${dependencies.join(', ')}`);

                    //loads module and action's dependencies and start the controllers.
                    return new Promise(function (resolve, reject) {
                        window.require(
                            dependencies,
                            function (...args) {
                                _.forEach(args, function (dependency) {
                                    if (dependency && _.isFunction(dependency.start)) {
                                        dependency.start();
                                    }
                                });

                                logger.debug(`${args.length} controllers started`);
                                resolve();
                            },
                            reject
                        );
                    });
                }
            });
    }
};

export default router;
