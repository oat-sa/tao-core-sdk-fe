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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * This file contains path definitions for build scripts.
 */
import path from 'path';
const rootPath = path.resolve(__dirname, '..');

export const srcDir = path.resolve(rootPath, 'src');
export const testDir = path.resolve(rootPath, 'test');
export const outputDir = path.resolve(rootPath, 'dist');
export const testOutputDir = path.resolve(rootPath, 'test');
