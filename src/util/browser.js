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
 * Copyright (c) 2022  (original work) Open Assessment Technologies SA;
 *
 *
 */
export default {
    /**
     * Check if the current runtime is on iOS
     * ! Please use this method as a last resort, always prefer feature detection
     * @returns {boolean} true if the current runtime looks like iOS
     */
    isIOs() {
        return (
            (/iPad|iPhone|iPod/.test(window.navigator.platform) ||
                (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)) &&
            !window.MSStream
        );
    }
};
