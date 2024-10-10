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
 * Copyright (c) 2024 (original work) Open Assessment Technologies SA;
 */

/**
 * @typedef {Object} MimeObject
 * @property {string} mime - the common mime-type for this type, IANA-defined if possible
 * @property {string} label - description (localised)
 * @property {string[]} [equivalent] - list of equivalent mime-types (or file extensions) which can be concatenated to 'mime' value to provide a comprehensive accept list
 * @property {string[]} [extensionsLabels] - list of file extensions for UI display hint only
 */

export default {
    /**
     * Gets the list of defined mime-type objects
     * @param {function} __ a translation function ({string} -> {string}), by default an identity function
     * @returns {MimeObject[]}
     */
    getList(__ = text => text) {
        if (typeof __ !== 'function') {
            throw new TypeError('The parameter __ must be a function');
        }
        return [
            /**
             * TAO AUTHORABLE MIMETYPES
             */
            {
                mime: 'application/zip',
                label: __('ZIP archive'),
                equivalent: ['application/x-zip-compressed', '.zipx'],
                extensionsLabels: ['.zip']
            },
            {
                mime: 'text/plain',
                label: __('Plain text'),
                extensionsLabels: ['.txt']
            },
            {
                mime: 'application/pdf',
                label: __('PDF file'),
                extensionsLabels: ['.pdf']
            },
            {
                mime: 'image/jpeg',
                label: __('JPEG image'),
                equivalent: ['.jpe'],
                extensionsLabels: ['.jpg']
            },
            {
                mime: 'image/png',
                label: __('PNG image'),
                extensionsLabels: ['.png']
            },
            {
                mime: 'image/gif',
                label: __('GIF image'),
                extensionsLabels: ['.gif']
            },
            {
                mime: 'image/svg+xml',
                label: __('SVG image'),
                extensionsLabels: ['.svg']
            },
            {
                mime: 'audio/mpeg',
                label: __('MPEG audio'),
                equivalent: ['audio/mp3', '.mp3', '.mpga'],
                extensionsLabels: ['.mp3']
            },
            {
                mime: 'audio/x-ms-wma',
                label: __('Windows Media audio'),
                extensionsLabels: ['.wma']
            },
            {
                mime: 'audio/x-wav',
                label: __('WAV audio'),
                equivalent: ['audio/wav', 'audio/vnd.wav'],
                extensionsLabels: ['.wav']
            },
            {
                mime: 'video/mpeg',
                label: __('MPEG video'),
                extensionsLabels: ['.mpg']
            },
            {
                mime: 'video/mp4',
                label: __('MP4 video'),
                extensionsLabels: ['.mp4']
            },
            {
                mime: 'video/quicktime',
                label: __('Quicktime video'),
                equivalent: ['.qt']
            },
            {
                mime: 'video/x-ms-wmv',
                label: __('Windows Media video'),
                extensionsLabels: ['.wmv']
            },
            {
                mime: 'video/x-flv',
                label: __('Flash video'),
                equivalent: ['.flv'],
                extensionsLabels: ['.flv']
            },
            {
                mime: 'text/csv',
                label: __('CSV file'),
                equivalent: ['.csv'],
                extensionsLabels: ['.csv']
            },
            {
                mime: 'application/msword',
                label: __('Microsoft Word'),
                equivalent: [
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-word.document.macroEnabled.12',
                    'application/vnd.ms-word.template.macroEnabled.12',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
                    '.doc',
                    '.docx',
                    '.dot',
                    '.docm',
                    '.dotm',
                    '.dotx'
                ],
                extensionsLabels: ['.doc', '.docx']
            },
            {
                mime: 'application/vnd.ms-excel',
                label: __('Microsoft Excel'),
                equivalent: [
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
                    'application/vnd.ms-excel.sheet.macroEnabled.12',
                    '.xlsb',
                    '.xlsm'
                ],
                extensionsLabels: ['.xls', '.xlsx']
            },
            {
                mime: 'application/vnd.ms-powerpoint',
                label: __('Microsoft Powerpoint'),
                equivalent: [
                    'application/vnd.ms-powerpoint.slideshow.macroEnabled.12',
                    'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
                    'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    '.ppt',
                    '.pptm',
                    '.pptx',
                    '.ppsm',
                    '.ppsx'
                ],
                extensionsLabels: ['.ppt', '.pptx']
            },
            {
                mime: 'application/vnd.oasis.opendocument.text',
                label: __('OpenDocument text document'),
                equivalent: ['.odt'],
                extensionsLabels: ['.odt']
            },
            {
                mime: 'application/vnd.oasis.opendocument.spreadsheet',
                label: __('OpenDocument spreadsheet document'),
                equivalent: ['.ods'],
                extensionsLabels: ['.ods']
            },
            {
                mime: 'text/x-c',
                label: __('C++ file (.cpp)'),
                equivalent: ['.cpp'],
                extensionsLabels: ['.cpp']
            },
            {
                mime: 'text/x-csrc',
                label: __('C file'),
                equivalent: ['.c'],
                extensionsLabels: ['.c']
            },
            {
                mime: 'text/pascal',
                label: __('Pascal file (.pas)'),
                equivalent: ['.pas'],
                extensionsLabels: ['.pas']
            },
            {
                mime: 'video/avi',
                label: __('Audio Video Interleave'),
                extensionsLabels: ['.avi']
            },
            {
                mime: 'image/bmp',
                label: __('Bitmap image'),
                extensionsLabels: ['.bmp']
            },
            {
                mime: 'text/css',
                label: __('Cascading Style Sheets'),
                extensionsLabels: ['.css']
            },
            {
                mime: 'image/x-emf',
                label: __('Enhanced metafile'),
                equivalent: ['.emf'],
                extensionsLabels: ['.emf']
            },
            {
                mime: 'application/vnd.geogebra.file',
                label: __('Geogebra data file'),
                equivalent: ['.ggb'],
                extensionsLabels: ['.ggb']
            },
            {
                mime: 'text/x-h',
                label: __('Header file with extensionsLabels'),
                equivalent: ['.x-h', '.h'],
                extensionsLabels: ['.h']
            },
            {
                mime: 'application/winhlp',
                label: __('Windows help file'),
                equivalent: ['.hlp'],
                extensionsLabels: ['.hlp']
            },
            {
                mime: 'text/html',
                label: __('Hypertext markup language'),
                extensionsLabels: ['.html']
            },
            {
                mime: 'text/javascript',
                label: __('Javascript code'),
                equivalent: ['application/javascript'],
                extensionsLabels: ['.js', '.mjs']
            },
            {
                mime: 'application/vnd.ms-access',
                label: __('Database file'),
                equivalent: ['.mdb'],
                extensionsLabels: ['.mdb']
            },
            {
                mime: 'image/vnd.ms-modi',
                label: __('Microsoft Office Document Imaging'),
                equivalent: ['.mdi'],
                extensionsLabels: ['.mdi']
            },
            {
                /** @deprecated - mime not suitable for identifying this file type */
                mime: 'multipart/related',
                label: __('MIME encapsulation of aggregate HTML documents')
            },
            {
                /** @deprecated - mime not suitable for identifying this file type */
                mime: 'application/base64',
                label: __('Mind mapping software application (free mind open source)'),
                equivalent: ['application/x-freemind', '.mm'],
                extensionsLabels: ['.mm']
            },
            {
                mime: 'audio/x-m4a',
                label: __('MPEG-4 audio file'),
                extensionsLabels: ['.m4a']
            },
            {
                mime: 'video/x-sgi-movie',
                label: __('Storing digital video data on a computer game'),
                equivalent: ['.movie'],
                extensionsLabels: ['.movie']
            },
            {
                mime: 'application/vnd.ms-project',
                label: __('Microsoft Project file'),
                equivalent: ['.mpp'],
                extensionsLabels: ['.mpp']
            },
            {
                mime: 'application/vnd.oasis.opendocument.database',
                label: __('OpenDocument Database'),
                equivalent: ['.odb'],
                extensionsLabels: ['.odb']
            },
            {
                mime: 'application/vnd.oasis.opendocument.presentation',
                label: __('OpenDocument Presentation'),
                equivalent: ['.odp'],
                extensionsLabels: ['.odp']
            },
            {
                mime: 'application/vnd.oasis.opendocument.text-template',
                label: __('OpenDocument Text Template'),
                equivalent: ['.ott'],
                extensionsLabels: ['.ott']
            },
            {
                /** @deprecated - mime not suitable for identifying this file type */
                mime: 'application/octet-stream',
                label: __('Flowchart-based programming environment & TI Interactive Workbook'),
                equivalent: ['.rap', '.tii']
            },
            {
                mime: 'application/vnd.rn-realmedia',
                label: __('RealMedia file'),
                equivalent: ['.rm'],
                extensionsLabels: ['.rm']
            },
            {
                mime: 'application/rtf',
                label: __('Rich Text Format file'),
                equivalent: ['text/rtf', '.rtf'],
                extensionsLabels: ['.rtf']
            },
            {
                mime: 'application/vnd.sun.xml.writer.template',
                label: __('Document templates (Staroffice)'),
                equivalent: ['.stw'],
                extensionsLabels: ['.stw']
            },
            {
                mime: 'application/x-shockwave-flash',
                label: __('Adobe Flash file'),
                extensionsLabels: ['.swf']
            },
            {
                mime: 'application/x-sibelius-score',
                label: __('Sibelius music notation'),
                equivalent: ['.sib'],
                extensionsLabels: ['.sib']
            },
            {
                mime: 'application/x-tar',
                label: __('Compressed tar file'),
                extensionsLabels: ['.tar']
            },
            {
                mime: 'application/vnd.sun.xml.calc',
                label: __('Calc speadsheet (Staroffice)'),
                equivalent: ['.sxc'],
                extensionsLabels: ['.sxc']
            },
            {
                mime: 'application/vnd.sun.xml.writer',
                label: __('Text document file format (Staroffice)'),
                equivalent: ['.sxw'],
                extensionsLabels: ['.sxw']
            },
            {
                mime: 'application/x-tex',
                label: __('TeX file'),
                equivalent: ['text/x-tex', '.tex'],
                extensionsLabels: ['.tex']
            },
            {
                mime: 'image/tiff',
                label: __('Tagged image file'),
                extensionsLabels: ['.tiff']
            },
            {
                mime: 'application/vnd.visio',
                label: __('Microsoft Visio file'),
                equivalent: ['.vsd'],
                extensionsLabels: ['.vsd']
            },
            {
                mime: 'application/vnd.ms-works',
                label: __('Microsoft Works file'),
                equivalent: ['.wks', '.wps'],
                extensionsLabels: ['.wks']
            },
            {
                mime: 'image/x-wmf',
                label: __('Windows Media file (metafile)'),
                extensionsLabels: ['.wmf']
            },
            {
                mime: 'application/x-mswrite',
                label: __('Write Document'),
                equivalent: ['.wri'],
                extensionsLabels: ['.wri']
            },
            {
                mime: 'text/xml',
                label: __('XML file'),
                equivalent: ['application/xml'],
                extensionsLabels: ['.xml']
            },
            {
                mime: 'application/vnd.ms-xpsdocument',
                label: __('Microsoft XPS file'),
                equivalent: ['.xps'],
                extensionsLabels: ['.xps']
            },
            {
                mime: 'application/x-7z-compressed',
                label: __('7-zip archive'),
                equivalent: ['.7z'],
                extensionsLabels: ['.7z']
            },
            {
                mime: 'application/x-gzip',
                label: __('GZip Compressed Archive'),
                equivalent: ['application/gzip'],
                extensionsLabels: ['.gz']
            },
            {
                mime: 'application/gzip',
                label: __('GZip Compressed Archive'),
                equivalent: ['application/x-gzip'],
                extensionsLabels: ['.gz']
            },
            {
                mime: 'application/x-rar-compressed',
                label: __('RAR archive'),
                equivalent: ['application/x-rar', '.rar'],
                extensionsLabels: ['.rar']
            },
            {
                mime: 'application/x-compress',
                label: __('UNIX Compressed Archive File'),
                equivalent: ['.z'],
                extensionsLabels: ['.z']
            },
            // wildcard mimetypes
            {
                mime: 'image/*',
                label: __('all images')
            },
            {
                mime: 'video/*',
                label: __('all videos'),
                equivalent: ['.flv', '.mkv', '.3gp']
            },
            {
                mime: 'audio/*',
                label: __('all audios')
            },
            /**
             * EXTRA SUPPORT MIMETYPES
             */
            {
                mime: 'video/ogg',
                label: __('Ogg Vorbis video'),
                equivalent: ['video/ogv', 'application/ogg'],
                extensionsLabels: ['.ogv']
            },
            {
                mime: 'audio/ogg',
                label: __('Ogg Vorbis audio'),
                equivalent: ['application/ogg', '.oga'],
                extensionsLabels: ['.ogg']
            },
            {
                mime: 'video/webm',
                label: __('WebM video'),
                extensionsLabels: ['.webm']
            },
            {
                mime: 'audio/webm',
                label: __('WebM audio'),
                extensionsLabels: ['.webm']
            },
            {
                mime: 'audio/aac',
                label: __('AAC audio'),
                extensionsLabels: ['.aac']
            },
            {
                mime: 'audio/m4a',
                label: __('M4A audio'),
                equivalent: ['audio/mp4'],
                extensionsLabels: ['.m4a']
            },
            {
                mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                label: __('Microsoft Word'),
                extensionsLabels: ['.docx']
            },
            {
                mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
                label: __('Microsoft Word template'),
                extensionsLabels: ['.dotx']
            },
            {
                mime: 'application/vnd.ms-word.document.macroenabled.12',
                label: __('Microsoft Word'),
                extensionsLabels: ['.docm']
            },
            {
                mime: 'application/vnd.ms-word.template.macroenabled.12',
                label: __('Microsoft Word template'),
                extensionsLabels: ['.dotm']
            },
            {
                mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                label: __('Microsoft Excel'),
                extensionsLabels: ['.xlsx']
            },
            {
                mime: 'application/vnd.ms-excel.sheet.binary.macroenabled.12',
                label: __('Microsoft Excel binary format'),
                extensionsLabels: ['.xlsb']
            },
            {
                mime: 'application/vnd.ms-excel.sheet.macroenabled.12',
                label: __('Microsoft Excel'),
                extensionsLabels: ['.xlsm']
            },
            {
                mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                label: __('Microsoft Powerpoint'),
                extensionsLabels: ['.pptx']
            },
            {
                mime: 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
                label: __('Microsoft Powerpoint slideshow'),
                extensionsLabels: ['.ppsx']
            },
            {
                mime: 'application/vnd.ms-powerpoint.presentation.macroenabled.12',
                label: __('Microsoft Powerpoint'),
                extensionsLabels: ['.pptm']
            },
            {
                mime: 'application/vnd.ms-powerpoint.slideshow.macroenabled.12',
                label: __('Microsoft Powerpoint slideshow'),
                extensionsLabels: ['.ppsm']
            }
        ];
    }
};
