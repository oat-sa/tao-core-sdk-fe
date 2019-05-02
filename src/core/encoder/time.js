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
 * Copyright (c) 2013-2019 (original work) Open Assessment Technologies SA ;
 */

import moment from 'moment';
    
var format = "HH:mm:ss";
    
export default {
    
    encode : function(modelValue){
        
        //seconds to hh:mm:ss
        var seconds = parseInt(modelValue, 10);
        if(isNaN(seconds)){
            seconds = 0;
        }
        var time = moment.duration(seconds, 'seconds');
        var h = time.get('hours') >= 10 ? time.get('hours') : '0' + time.get('hours');
        var m = time.get('minutes') >= 10 ? time.get('minutes') : '0' + time.get('minutes');
        var s = time.get('seconds') >= 10 ? time.get('seconds') : '0' + time.get('seconds');
        return  h + ':' + m + ':' + s;
    },
    
    decode : function(nodeValue){
        //hh:mm:ss to seconds
        var time  =  moment(nodeValue, format);
        return time.seconds() + (time.minutes() * 60) + (time.hours() * 3600);
    }
};
