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
 * @author Tamas Besenyei <tamas@taotesting.com>
 */

define(['core/bearerTokenStore'], bearerTokenStoreFactory => {
    'use strict';

    QUnit.module('factory');

    QUnit.test('module', assert => {
        assert.expect(1);
        assert.ok(typeof bearerTokenStoreFactory === 'function', 'the module exposes a function');
    });

    QUnit.test('instantiate', assert => {
        assert.expect(2);
        assert.ok(typeof bearerTokenStoreFactory() === 'object', 'the factory produces an object');
        assert.notEqual(
            bearerTokenStoreFactory(),
            bearerTokenStoreFactory(),
            'the factory produces a different object at each call'
        );
    });

    QUnit.module('API', {
        beforeEach: function() {
            this.storage = bearerTokenStoreFactory();
        },
        afterEach: function(assert) {
            const done = assert.async();
            this.storage.clear().then(done);
        }
    });

    const exampleTokens = ['foo', 'bar', 'baz'];

    QUnit.cases.init(exampleTokens).test('set access token', function(token, assert) {
        assert.expect(1);
        const done = assert.async();

        this.storage.setAccessToken(token).then(() => {
            this.storage.getAccessToken().then(storedToken => {
                assert.equal(token, storedToken, 'get back stored access token');
                done();
            });
        });
    });

    QUnit.cases.init(exampleTokens).test('set refresh token', function(token, assert) {
        assert.expect(1);
        const done = assert.async();

        this.storage.setRefreshToken(token).then(() => {
            this.storage.getRefreshToken().then(storedToken => {
                assert.equal(token, storedToken, 'get back stored refresh token');
                done();
            });
        });
    });

    QUnit.test('set tokens', function(assert) {
        assert.expect(2);
        const done = assert.async();

        const accessToken = 'some access token';
        const refreshToken = 'some refresh token';

        Promise.all([this.storage.setTokens(accessToken, refreshToken)]).then(() => {
            Promise.all([this.storage.getAccessToken(), this.storage.getRefreshToken()]).then(
                ([storedAccessToken, storedRefreshToken]) => {
                    assert.equal(storedAccessToken, accessToken, 'get back stored access token');
                    assert.equal(storedRefreshToken, refreshToken, 'get back stored refresh token');
                    done();
                }
            );
        });
    });

    QUnit.test('clear access token', function(assert) {
        assert.expect(1);
        const done = assert.async();

        this.storage.setAccessToken('some accessToken').then(() => {
            this.storage.clearAccessToken().then(() => {
                this.storage.getAccessToken().then(storedToken => {
                    assert.equal(storedToken, null, 'access token is cleared');
                    done();
                });
            });
        });
    });

    QUnit.test('clear refresh token', function(assert) {
        assert.expect(1);
        const done = assert.async();

        this.storage.setRefreshToken('some refreshToken').then(() => {
            this.storage.clearRefreshToken().then(() => {
                this.storage.getRefreshToken().then(storedToken => {
                    assert.equal(storedToken, null, 'refresh token is cleared');
                    done();
                });
            });
        });
    });

    QUnit.test('clear tokens', function(assert) {
        assert.expect(2);
        const done = assert.async();

        this.storage.setRefreshToken('some access token', 'some refresh token').then(() => {
            this.storage.clear().then(() => {
                Promise.all([this.storage.getAccessToken(), this.storage.getRefreshToken()]).then(
                    ([storedAccessToken, storedRefreshToken]) => {
                        assert.equal(storedAccessToken, null, 'access token is cleared');
                        assert.equal(storedRefreshToken, null, 'refresh token is cleared');
                        done();
                    }
                );
            });
        });
    });

    QUnit.module('Same namespace', {
        beforeEach: function() {
            this.storage1 = bearerTokenStoreFactory({ namespace: 'namespace' });
            this.storage2 = bearerTokenStoreFactory({ namespace: 'namespace' });
        },
        afterEach: function(assert) {
            const done = assert.async();
            Promise.all([this.storage1.clear(), this.storage2.clear()]).then(done);
        }
    });

    QUnit.test('stores could access to same tokens', function(assert) {
        assert.expect(2);
        const done = assert.async();

        const accessToken = 'some access token';
        const refreshToken = 'some refresh token';

        this.storage1.setTokens(accessToken, refreshToken).then(() => {
            Promise.all([this.storage2.getAccessToken(), this.storage2.getRefreshToken()]).then(
                ([storedAccessToken, storedRefreshToken]) => {
                    assert.equal(storedAccessToken, accessToken, 'get back stored access token');
                    assert.equal(storedRefreshToken, refreshToken, 'get back stored refresh token');
                    done();
                }
            );
        });
    });

    QUnit.test('store will be empty if other store will be cleared', function(assert) {
        assert.expect(2);
        const done = assert.async();

        const accessToken = 'some access token';
        const refreshToken = 'some refresh token';

        this.storage1.setTokens(accessToken, refreshToken).then(() => {
            this.storage2.clear().then(() => {
                Promise.all([this.storage1.getAccessToken(), this.storage1.getRefreshToken()]).then(
                    ([storedAccessToken, storedRefreshToken]) => {
                        assert.equal(storedAccessToken, null, 'could not get back cleared access token');
                        assert.equal(storedRefreshToken, null, 'could not get back cleared refresh token');
                        done();
                    }
                );
            });
        });
    });

    QUnit.module('Different namespace', {
        beforeEach: function() {
            this.storage1 = bearerTokenStoreFactory({ namespace: 'namespace1' });
            this.storage2 = bearerTokenStoreFactory({ namespace: 'namespace2' });
        },
        afterEach: function(assert) {
            const done = assert.async();
            Promise.all([this.storage1.clear(), this.storage2.clear()]).then(done);
        }
    });

    QUnit.test('stores could not access to same tokens', function(assert) {
        assert.expect(4);
        const done = assert.async();

        const accessToken1 = 'access token 1';
        const refreshToken1 = 'refresh token 1';
        const accessToken2 = 'access token 2';
        const refreshToken2 = 'refresh token 2';

        Promise.all([
            this.storage1.setTokens(accessToken1, refreshToken1),
            this.storage2.setTokens(accessToken2, refreshToken2)
        ]).then(() => {
            Promise.all([
                this.storage1.getAccessToken(),
                this.storage1.getRefreshToken(),
                this.storage2.getAccessToken(),
                this.storage2.getRefreshToken()
            ]).then(([storedAccessToken1, storedRefreshToken1, storedAccessToken2, storedRefreshToken2]) => {
                assert.equal(storedAccessToken1, accessToken1, 'get back stored access token from storage1');
                assert.equal(storedRefreshToken1, refreshToken1, 'get back stored refresh token from storage1');
                assert.equal(storedAccessToken2, accessToken2, 'get back stored access token from storage2');
                assert.equal(storedRefreshToken2, refreshToken2, 'get back stored refresh token from storage2');
                done();
            });
        });
    });

    QUnit.test('store content will be kept if other store will be cleared', function(assert) {
        assert.expect(2);
        const done = assert.async();

        const accessToken = 'some access token';
        const refreshToken = 'some refresh token';

        this.storage1.setTokens(accessToken, refreshToken).then(() => {
            this.storage2.clear().then(() => {
                Promise.all([this.storage1.getAccessToken(), this.storage1.getRefreshToken()]).then(
                    ([storedAccessToken, storedRefreshToken]) => {
                        assert.equal(storedAccessToken, accessToken, 'get back stored access token');
                        assert.equal(storedRefreshToken, refreshToken, 'get back stored refresh token');
                        done();
                    }
                );
            });
        });
    });
});
