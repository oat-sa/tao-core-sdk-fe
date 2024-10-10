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
 * Copyright (c) 2013-2024 Open Assessment Technologies SA (under the project TAO-PRODUCT);
 */
/**
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 * @requires jquery
 * @requires lodash
 * @requires handlebars
 * @requires core/encoder/encoders
 */
import $ from 'jquery';
import _ from 'lodash';
import Handlebars from 'handlebars';
import Encoders from './encoder/encoders';
import Filters from './filter/filters';

/**
 * Get the value of a property defined by the path into the object
 * @param {Object} obj - the object to locate property into
 * @param {string} path - the property path
 * @returns {*}
 */
const locate = function locate(obj, path) {
    const nodes = path.split('.');
    const size = nodes.length;
    let i = 1;
    let result;

    if (size >= 1) {
        result = obj[nodes[0]];
        if (typeof result !== 'undefined') {
            for (i = 1; i < size; i++) {
                result = result[nodes[i]];
                if (typeof result === 'undefined') {
                    break;
                }
            }
        }
    }
    return result;
};

/**
 * Set the value of a property defined by the path into the object
 * @param {Object} obj - the object to locate property into
 * @param {string} path - the property path
 * @param {string|boolean|number} value - the value to assign
 */
const update = function update(obj, path, value) {
    const nodes = path.split('.');
    const size = nodes.length;
    let i;
    for (i = 0; i < size; i++) {
        if (i === size - 1) {
            obj[nodes[i]] = value;
            return;
        } else {
            if (!obj[nodes[i]]) {
                if (i + 1 < size && /^\d$/.test(nodes[i + 1])) {
                    obj[nodes[i]] = [];
                } else {
                    obj[nodes[i]] = {};
                }
            }
            obj = obj[nodes[i]];
        }
    }
};

/**
 * Removes the property from the object
 * @param {Object} obj - the object to locate property into
 * @param {string} path - the property path
 */
const remove = function remove(obj, path) {
    const nodes = path.split('.');
    const size = nodes.length;
    let i;
    for (i = 0; i < size; i++) {
        if (i === size - 1) {
            if (_.isArray(obj)) {
                obj.splice(parseInt(nodes[i], 10), 1);
            } else {
                delete obj[nodes[i]];
            }
            return;
        } else {
            obj = obj[nodes[i]];
        }
    }
};

/**
 * Sort a property array in the object
 * regarding the ordered defined into the nodes (using the data-bind-index attribute).
 * @param {Object} obj - the object to locate property into
 * @param {string} path - the property path
 * @param {jQueryElement} $node - the element that contains the items
 * @param {Boolean} [retry=false] - if we are in fault tolerancy context, to prevent deep recursivity
 */
const order = function order(obj, path, $node, retry) {
    const values = locate(obj, path);
    let changed = false;
    if (_.isArray(values)) {
        $node.children('[data-bind-index]').each(function (position) {
            const $item = $(this);
            const index = parseInt($item.data('bind-index'), 10);
            if (values[index]) {
                values[index].index = position;
                changed = changed || position !== index;
            } else {
                //fault tolerancy in case of removal that do not trigger the right event
                if (!retry) {
                    _.delay(function () {
                        order(obj, path, $node, true);
                    }, 100);
                }
                return false;
            }
        });

        if (changed === true) {
            values.sort(function (a, b) {
                return a.index - b.index;
            });
        }
    }
};

/**
 * Synchronize indexes of a property array in the object
 * regarding the ordered defined into the nodes (using the data-bind-index attribute).
 * @param {Object} obj - the object to locate property into
 * @param {string} path - the property path
 * @param {jQueryElement} $node - the element that contains the items
 */
const resyncIndexes = function resyncIndexes(obj, path, $node) {
    const values = locate(obj, path);
    if (_.isArray(values)) {
        _.forEach(values, function (value, position) {
            values[position].index = position;
            if ($node) {
                $node
                    .children('[data-bind-index]')
                    .eq(position)
                    .attr('data-bind-index', position.toString())
                    .data('bind-index', position.toString());
            }
        });
    }
};

/**
 * For radio and checkbox, the element that listen for events is the group and not the single node.
 * It enables you to get the right element(s).
 *
 * @param {jQueryElement} $node
 * @param {jQueryElement} $container
 * @returns {jQueryElement}
 */
const toBind = function toBind($node, $container) {
    if ($node[0].type && $node[0].name) {
        if ($node[0].type === 'radio' || $node[0].type === 'checkbox') {
            return $(`[name='${$node[0].name}']`, $container);
        }
    }
    return $node;
};

/**
 * Unbind event registered using <i>this._bind</i> function.
 * @param {jQueryElement} $node - the node to bind
 * @param {jQueryElement} $container - the node container
 * @param {String} eventName - the name of the event to bind
 * @private
 */
const _unbind = function _unbind($node, $container, eventName) {
    if ($node.length > 0) {
        const bounds = $._data($node[0], 'events');
        if (
            bounds &&
            _(bounds[eventName])
                .filter({ namespace: 'internalbinder' })
                .size() > 0
        ) {
            toBind($node, $container).off(`${eventName}.internalbinder`);
        }
    }
};

/**
 * Bind wrapper to ensure the event is bound only once using a namespace
 * @param {jQueryElement} $node - the node to bind
 * @param {jQueryElement} $container - the node container
 * @param {String} eventName - the name of the event to bind
 * @param {Function} cb - a jQuery event handler
 */
const _bindOnce = function _bindOnce($node, $container, eventName, cb) {
    _unbind($node, $container, eventName);
    if ($node.length > 0) {
        const bounds = $._data($node[0], 'events');
        if (
            !bounds ||
            _(bounds[eventName])
                .filter({ namespace: 'internalbinder' })
                .size() < 1
        ) {
            toBind($node, $container).on(`${eventName}.internalbinder`, function (e, ...args) {
                if ($(this).is(e.target)) {
                    cb(...args);
                }
            });
        }
    }
};

/**
 * Constructor, define the model and the DOM container to bind
 * @exports core/DataBinder
 * @constructs
 * @param {jQueryElement} $container
 * @param {Object} model
 * @param {Object} options - to be documented
 */
const DataBinder = function DataBinder($container, model, options) {
    const self = this;
    this.$container = $container;
    this.model = model || {};
    this.encoders = _.clone(Encoders);
    this.filters = _.clone(Filters);

    if (options) {
        if (_.isPlainObject(options.encoders)) {
            _.forEach(options.encoders, function (encoder, name) {
                self.encoders.register(name, encoder.encode, encoder.decode);
            });
        }
        if (_.isPlainObject(options.filters)) {
            _.forEach(options.filters, function (filter, name) {
                self.filters.register(name, filter);
            });
        }
        this.templates = options.templates || {};
    }
};

/**
 * Assign value and listen for change on a particular node.
 * @memberOf DataBinder
 * @private
 * @param {jQueryElement} $node - the elements to bind
 * @param {string} path - the path to the model value to bind
 * @param {Object} model - the model bound
 * @param {boolean} [domFirst = false] - if the node content must be assigned to the model value first
 */
DataBinder.prototype._bindNode = function _bindNode($node, path, model, domFirst) {
    if (!$node.data('bound')) {
        if (domFirst === true || typeof locate(model, path) === "undefined") {
            update(model, path, this._getNodeValue($node));
        }

        this._setNodeValue($node, locate(model, path));

        this._listenUpdates($node, path, model);
        this._listenRemoves($node, path, model);

        $node.data('bound', path);
    }
};

/**
 * Bind array value to a node.
 * @memberOf DataBinder
 * @private
 * @param {jQueryElement} $node - the elements to bind
 * @param {string} path - the path to the model value to bind
 * @param {Object} model - the model bound
 * @param {boolean} [domFirst = false] - if the node content must be assigned to the model value first
 */
DataBinder.prototype._bindArrayNode = function _bindArrayNode($node, path, model, domFirst) {
    const self = this;
    let template;
    let values;

    if (!$node.data('bound')) {
        values = locate(model, path);

        //the item content is either defined by an external template or as the node content
        if ($node.data('bind-tmpl')) {
            template = self.templates[$node.data('bind-tmpl')];

            //fallback to inner template
            if (typeof template !== 'function' && $($node.data('bind-tmpl')).length > 0) {
                template = Handlebars.compile($($node.data('bind-tmpl')).html());
            }
        } else {
            template = Handlebars.compile($node.html());
        }

        if (!values || !_.isArray(values)) {
            //create the array in the model if not exists
            update(model, path, []);
        } else if ($node.data('bind-filter')) {
            //apply filtering
            values = this.filters.filter($node.data('bind-filter'), values);
        }

        $node.empty();

        _.forEach(values, function (value, index) {
            value.index = index; //the model as an index property, used for reordering
            const $newNode = $(template(value).trim());
            $newNode
                .appendTo($node)
                .filter(':first')
                .attr('data-bind-index', index); //we add the index to the 1st inserted node to keep it in sync

            //bind the content of the inserted nodes
            self.bind($newNode, self.model, `${path}.${index}.`, domFirst);

            //listen for removal on the item node
            self._listenRemoves($newNode, `${path}.${index}`, self.model);
        });

        //listen for reordering and item addition on the list node
        self._listenUpdates($node, path, model);
        self._listenAdds($node, path, model);

        $node.data('bound', path);
    }
};

/**
 * Assign value and listen for change on a particular node.
 * @memberOf DataBinder
 * @private
 * @param {jQueryElement} $node - the elements to bind
 * @param {string} path - the path to the model value to bind
 * @param {Object} model - the model bound
 * @param {boolean} [domFirst = false] - if the node content must be assigned to the model value first
 */
DataBinder.prototype._bindRmNode = function _bindRmNode($node, path, model, domFirst) {
    if (!$node.data('bound')) {
        this._listenUpdates($node, path, model);

        if (domFirst === true) {
            $node.trigger('change');
        }

        $node.data('bound', path);
    }
};

/**
 * Listen for updates on a particular node. (listening the 'change' event)
 * @memberOf DataBinder
 * @private
 * @param {jQueryElement} $node - the elements to bind
 * @param {string} path - the path to the model value to bind
 * @param {Object} model - the model bound
 * @fires DataBinder#update.binder
 * @fires DataBinder#change.binder
 */
DataBinder.prototype._listenUpdates = function _listenUpdates($node, path, model) {
    const self = this;
    _bindOnce($node, this.$container, 'change', function () {
        if ($node.is('[data-bind-each]')) {
            //sort the model, sync the indexes and rebind the content
            order(model, path, $node);
            resyncIndexes(model, path, $node);

            $node.data('bind-each', path);
            self._rebind($node);

            /**
             * The model has been sorted
             * @event DataBinder#order.binder
             * @param {Object} model - the up to date model
             */
            self.$container.trigger('order.binder', [self.model]);
        } else if ($node.is('[data-bind-rm]')) {
            //remove the model element if the node value is true
            const value = self._getNodeValue($node);
            if (value === true) {
                remove(model, path);
            }

            /**
             * The model has been updated
             * @event DataBinder#update.binder
             * @param {Object} model - the up to date model
             */
            self.$container.trigger('delete.binder', [self.model]);
        } else {
            //update the model with the node value
            update(model, path, self._getNodeValue($node));

            //if we remove an element of an array, we need to resync indexes and bindings
            self._resyncIndexOnceRm($node, path);

            /**
             * The model has been updated
             * @event DataBinder#update.binder
             * @param {Object} model - the up to date model
             */
            self.$container.trigger('update.binder', [self.model]);
        }

        /**
         * The model has changed (update, add or remove)
         * @event DataBinder#change.binder
         * @param {Object} model - the up to date model
         */
        self.$container.trigger('change.binder', [self.model]);
    });
};

/**
 * Listen for node removal on a bound array. (listening the 'remove' event)
 * @memberOf DataBinder
 * @private
 * @param {jQueryElement} $node - the elements to bind
 * @param {string} path - the path to the model value to bind
 * @param {Object} model - the model bound
 * @fires DataBinder#delete.binder
 * @fires DataBinder#change.binder
 */
DataBinder.prototype._listenRemoves = function _listenRemoves($node, path, model) {
    const self = this;
    _bindOnce($node, this.$container, 'delete', function (undoable) {
        if (undoable === true) {
            //can be linked tp the ui/deleter

            self._resyncIndexOnceRm($node, path, undoable);

            $node.parent().one('deleted.deleter', function () {
                doRemoval();
            });

            if ($node.is('[data-bind-index]')) {
                $node.one('undo.deleter', function () {
                    const $parentNode = $node.parent().closest('[data-bind-each]');
                    const parentPath = path.replace(/\.[0-9]+$/, '');
                    resyncIndexes(self.model, parentPath, $parentNode);
                    //we need to rebind the model to the new paths
                    const re = new RegExp(`${$parentNode.data('bind-each')}$`); // only in the end of the string
                    self._rebind($parentNode, parentPath.replace(re, ''));
                });
            }
        } else {
            doRemoval();
            self._resyncIndexOnceRm($node, path);
        }

        function doRemoval() {
            remove(model, path);

            /**
             * A property of the model is removed
             * @event DataBinder#delete.binder
             * @param {Object} model - the up-to-date model
             */
            self.$container.trigger('delete.binder', [self.model]).trigger('change.binder', [self.model]);
        }
    });
};

/**
 * Listen for node addition on a bound array. (listening the 'add' event)
 * @memberOf DataBinder
 * @private
 * @param {jQueryElement} $node - the elements to bind
 * @param {string} path - the path to the model value to bind
 * @fires DataBinder#add.binder
 * @fires DataBinder#change.binder
 */
DataBinder.prototype._listenAdds = function _listenAdds($node, path) {
    const self = this;
    _bindOnce($node, this.$container, 'add', function (content, data) {
        const size = $node.children('[data-bind-index]').length;
        $node
            .children()
            .not('[data-bind-index]')
            .each(function () {
                //got the inserted node
                const $newNode = $(this);
                const realPath = `${path}.${size}`;
                $newNode.attr('data-bind-index', size);

                if (data) {
                    //if data is given through the event, we use it ti create the value
                    //(if the same value is set through the dom, it will override it cf. domFirst)
                    update(self.model, realPath, data);
                }

                //bind the node, and it's content using the domFirst approach (to create the related model)
                self.bind($newNode, self.model, `${realPath}.`, true);
                self._listenRemoves($newNode, realPath, self.model);
            });

        /**
         * The model contains a new property
         * @event DataBinder#add.binder
         * @param {Object} model - the up-to-date model
         */
        self.$container.trigger('add.binder', [self.model]).trigger('change.binder', [self.model]);

        //rethrow on the node
        $node.trigger('add.binder', [content, data]);
    });
};

/**
 * Used to resynchronize the items of a `each` binding once one of them was removed
 * @memberOf DataBinder
 * @private
 * @param {jQueryElement} $node - the elements to bind
 * @param {string} path - the path to the model value to bind
 * @param {boolean} undoable - is node hidden temporary?
 */
DataBinder.prototype._resyncIndexOnceRm = function _resyncIndexOnceRm($node, path, undoable) {
    const self = this;

    if ($node.is('[data-bind-index]')) {
        const removedIndex = parseInt($node.data('bind-index'), 10);
        const $parentNode = $node.parent().closest('[data-bind-each]');
        const parentPath = path.replace(/\.[0-9]+$/, '');

        resyncIndexes(self.model, parentPath);

        if ($parentNode.children('[data-bind-index]').length - 1 !== removedIndex) {
            //if removed not the last element
            //we need to rebind after sync because the path are not valid anymore
            $parentNode
                .children('[data-bind-index]')
                .filter(`:gt(${removedIndex})`)
                .each(function () {
                    const $item = $(this);
                    const newIndex = parseInt($item.data('bind-index'), 10) - 1;
                    //we also update the indexes
                    $item.attr('data-bind-index', newIndex).data('bind-index', newIndex.toString());
                });
        }
        if (undoable) {
            // do not have 2 elements with the same index
            // will be changed on undo action
            $node.attr('data-bind-index', '-1' ).data('bind-index', '-1');
        }

        //we need to rebind the model to the new paths
        const re = new RegExp(`${$parentNode.data('bind-each')}$`); // only in the end of the string
        self._rebind($parentNode, parentPath.replace(re, ''));
    }
};

/**
 * Set the value into a node.
 * If an encoder is defined in the node, the encode method is called.
 * @memberOf DataBinder
 * @private
 * @param {jQueryElement} $node - the node that accept the value
 * @param {string|boolean|number} value - the value to set
 */
DataBinder.prototype._setNodeValue = function _setNodeValue($node, value) {
    const self = this;
    if (typeof value !== 'undefined') {
        //decode value
        if ($node.data('bind-encoder')) {
            value = this.encoders.encode($node.data('bind-encoder'), value);
        }

        //assign value
        if (_.includes(['INPUT', 'SELECT', 'TEXTAREA'], $node[0].nodeName)) {
            if ($node.is(":text, input[type='hidden'], textarea, select")) {
                $node.val(value).trigger('change');
            } else if ($node.is(':radio, :checkbox')) {
                toBind($node, self.$container).each(function () {
                    const $elt = $(this);
                    $elt.prop('checked', $elt.val() === value);
                });
            }
        } else if ($node.hasClass('button-group')) {
            $node.find('[data-bind-value]').each(function () {
                const $elt = $(this);
                if ($elt.data('bind-value').toString() === value) {
                    $elt.addClass('active');
                } else {
                    $elt.removeClass('active');
                }
            });
        } else if ($node.data('bind-html') === true) {
            $node.html(value);
        } else {
            $node.text(value);
        }
    }
};

/**
 * Set the value from a node.
 * If an encoder is defined in the node, the decode method is called.
 * @memberOf DataBinder
 * @private
 * @param {jQueryElement} $node - the node to get the value from
 * @returns {string|boolean|number} value - the value to set
 */
DataBinder.prototype._getNodeValue = function _getNodeValue($node) {
    const self = this;
    let value;
    if (_.includes(['INPUT', 'SELECT', 'TEXTAREA'], $node[0].nodeName)) {
        if ($node.is(":text, input[type='hidden'], textarea, select")) {
            value = $node.val();
        } else if ($node.is(':radio, :checkbox')) {
            value = toBind($node, self.$container).filter(':checked').val();
        } else if ($node.hasClass('button-group')) {
            $node.find('[data-bind-value]').each(function () {
                const $elt = $(this);
                if ($elt.hasClass('active')) {
                    value = $elt.data('bind-value').toString();
                }
            });
        }
    } else if ($node.data('bind-html') === true) {
        value = $node.html();
    } else {
        value = $node.text();
    }

    //decode value
    if ($node.data('bind-encoder')) {
        value = this.encoders.decode($node.data('bind-encoder'), value);
    }

    return value;
};

/**
 * Start the binding!
 * @memberOf DataBinder
 * @public
 * @param {jQueryElement} $elt - the container of the elements to bind (also itself boundable)
 * @param {Object} model - the model to bind
 * @param {string} [prefix = ''] - a prefix into the model path, used internally on rebound
 * @param {boolean} [domFirst = false] - if the node content must be assigned to the model value first
 */
DataBinder.prototype.bind = function bind($elt, model, prefix, domFirst) {
    const self = this;

    /**
     * Find dataAttrName
     * @param {JQeryElement} $boundElt
     * @param {string} dataAttrName
     * @param {string} binding
     */
    const bindElements = function bindElements($boundElt, dataAttrName, binding) {
        const selector = `[data-${dataAttrName}]`;
        $boundElt
            .find(selector)
            .addBack()
            .filter(selector)
            .each(function () {
                const $node = $(this);
                const path = prefix + $node.data(dataAttrName);
                self[binding]($node, path, model, domFirst);
            });
    };

    $elt = $elt || this.$container;
    model = model || this.model;
    prefix = prefix || '';
    domFirst = domFirst || false;

    //Array binding
    bindElements($elt, 'bind-each', '_bindArrayNode');

    //Remove binding, if bound value === true, then path is removed from the model
    bindElements($elt, 'bind-rm', '_bindRmNode');

    //simple binding (the container can also bound something in addition to children)
    bindElements($elt, 'bind', '_bindNode');
};

/**
 * Rebind, after ordering for instance.
 * @memberOf DataBinder
 * @private
 * @param {jQueryElement} $elt - the container of the elements to bind (also itself boundable)
 * @param {string} [prefix = ''] - a prefix into the model path, used internally on rebound
 */
DataBinder.prototype._rebind = function _rebind($elt, prefix) {
    const self = this;
    prefix = prefix || '';

    if ($elt.is('[data-bind-each]')) {
        const path = prefix + $elt.data('bind-each');
        const values = locate(self.model, path);

        _.forEach(values, function (value, index) {
            const $childNode = $elt.children(`[data-bind-index="${index}"]`);

            self._rebind($childNode, `${path}.${index}.`);

            self._listenRemoves($childNode, `${path}.${index}`, self.model);
        });

        //listen for reordering and item addition on the list node
        if (typeof values !== 'undefined') {
            self._listenUpdates($elt, path, self.model);
            self._listenAdds($elt, path, self.model);
        }
    } else {
        $elt.find('[data-bind]').each(function () {
            const $node = $(this);
            const boundPath = prefix + $node.data('bind');

            self._listenUpdates($node, boundPath, self.model);
            self._listenRemoves($node, boundPath, self.model);
        });
        $elt.find('[data-bind-each]')
            .not(function () {
                return $(this).closest('[data-bind-index]').get(0) !== $elt.get(0); // only first level to have proper path
            })
            .each(function () {
                self._rebind($(this), prefix);
            });
    }
};

//only the DataBinder is exposed
export default DataBinder;
