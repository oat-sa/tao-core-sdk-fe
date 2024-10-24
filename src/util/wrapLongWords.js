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
 * Copyright (c) 2015-2024 (original work) Open Assessment Technologies SA ;
 *
 */

/**
 *
 * @author dieter <dieter@taotesting.com>
 */
import regexEscape from './regexEscape.js';

/**
 * Builds a chunked term from a too long one.
 *
 * Internet Explorer will not insert a line-break before a period or a colon (and possibly other characters),
 * even when they're preceded by a space. To address this chunks starting with one of the problematic characters
 * will have this removed, and it will be appended to the previous chunk.
 *
 * @param {string} longWord
 * @param {RegExp} chunkExp
 * @returns {string}
 */
function getCutTerm(longWord, chunkExp) {
    const cutTerms = longWord.match(chunkExp);
    let i = cutTerms.length;
    let oldFirst = '';
    let newFirst = '';
    const offenders = ['.', ':', ';'];

    while (i--) {
        newFirst = cutTerms[i].charAt(0);
        if (offenders.indexOf(newFirst) > -1) {
            cutTerms[i] = cutTerms[i].substr(1);
        }
        if (offenders.indexOf(oldFirst) > -1) {
            cutTerms[i] = cutTerms[i] + oldFirst;
        }
        oldFirst = newFirst;
    }
    return cutTerms.join(' ');
}

/**
 * Wrap very long strings after n characters
 *
 * @param {string} str
 * @param {number} threshold number of characters to break after
 * @returns {string}
 */
function wrapLongWords(str, threshold) {
    // add whitespaces to provoke line breaks before HTML tags
    str = str.toString().replace(/([\w])</g, '$1 <');

    const chunkExp = new RegExp(`.{1,${threshold}}`, 'g');
    const longWords = str.match(new RegExp(`[\\S]{${threshold},}`, 'g')) || [];
    let i = longWords.length;

    while (i--) {
        const cut = getCutTerm(longWords[i], chunkExp);
        str = str.replace(new RegExp(regexEscape(longWords[i]), 'g'), cut);
    }

    return str;
}

export default wrapLongWords;
