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
 * Copyright (c) 2013-2024 (original work) Open Assessment Technologies SA ;
 */

import $ from 'jquery';
import _ from 'lodash';
import DataBinder from './databinder';

export default {
    takeControl($container, options) {
        const control = {};
        let model = {};
        const binderOpts = _.pick(options, ['encoders', 'filters', 'templates']);

        if (options.get) {
            control.get = function get(cb) {
                $.getJSON(options.get).done(function (data) {
                    if (data) {
                        model = data;
                        new DataBinder($container, model, binderOpts).bind();
                        if (typeof cb === 'function') {
                            cb(model);
                        }
                    }
                });
                return this;
            };
        }
        if (options.save) {
            control.save = function save(cb, errBack) {
                let allowSave = true;
                if (typeof options.beforeSave === 'function') {
                    allowSave = !!options.beforeSave(model);
                }
                if (allowSave === true) {
                    $.post(
                        options.save,
                        { model: JSON.stringify(model) },
                        function (data) {
                            if (data) {
                                if (typeof cb === 'function') {
                                    cb(data);
                                }
                            }
                        },
                        'json'
                    ).fail(function () {
                        if (typeof errBack === 'function') {
                            errBack();
                        }
                    });
                }
                return this;
            };
        }

        return control;
    }
};
