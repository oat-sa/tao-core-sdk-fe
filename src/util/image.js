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
 * Copyright (c) 2014-2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */

/**
 * Image manipulation utility library
 * @exports image 
 */
export default {

    /**
     * Get the size of an image before displaying it.
     * @param {String} src - the image source url
     * @param {Number} [timeout = 2] - image load timeout in secs
     * @param {ImageSizeCallback} cb - called with the image size
     */
    getSize : function(src, timeout, cb){
        var timeoutId;
        var img = document.createElement('img');

        //params interchange
        if(typeof(timeout) === 'function'){
            cb = timeout;
            timeout = 2;
        }

        img.onload = function(){
            if(timeoutId){
                clearTimeout(timeoutId);

                /**
                 * @callback ImageSizeCallback
                 * @param {Object|Null} [size] - null if the image can't be loaded
                 * @param {Number} size.width
                 * @param {Number} size.height
                 */ 
                cb({
                    width   : img.naturalWidth || img.width,
                    height  : img.naturalHeight || img.height
                });
            }
        };    
        img.onerror = function(){
            if(timeoutId){
                clearTimeout(timeoutId);
                cb(null);
            }
        };
        timeoutId = setTimeout(function(){
            cb(null);
        }, timeout * 1000);
        img.src = src;
    }
};
