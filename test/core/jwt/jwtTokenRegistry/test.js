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

define(["core/jwt/jwtTokenRegistry"], jwtTokenRegistry => {
    "use strict";

    QUnit.module("Register");

    QUnit.test("be able to register and request handler", assert => {
        assert.expect(2);

        const serviceName = "foo service";
        const tokenHandlerMock = { serviceName };

        jwtTokenRegistry.register(tokenHandlerMock);

        assert.strictEqual(
            jwtTokenRegistry.has(serviceName),
            true,
            "stored handler exist"
        );
        assert.strictEqual(
            jwtTokenRegistry.get(serviceName),
            tokenHandlerMock,
            "stored handler can be requested back"
        );

        jwtTokenRegistry.unregister(serviceName);
    });

    QUnit.test(
        "second register for the same service name will override the first one",
        assert => {
            assert.expect(3);

            const serviceName = "bar service";
            const tokenHandlerMock1 = { serviceName };
            const tokenHandlerMock2 = { serviceName };

            jwtTokenRegistry.register(tokenHandlerMock1);
            jwtTokenRegistry.register(tokenHandlerMock2);

            assert.strictEqual(
                jwtTokenRegistry.has(serviceName),
                true,
                "stored handler exist"
            );
            assert.notEqual(
                jwtTokenRegistry.get(serviceName),
                tokenHandlerMock1,
                "previously stored handler is overwritten"
            );
            assert.strictEqual(
                jwtTokenRegistry.get(serviceName),
                tokenHandlerMock2,
                "lastly stored handler can be requested back"
            );

            jwtTokenRegistry.unregister(serviceName);
        }
    );

    QUnit.test(
        "multiple service handlers can be registered for different service name",
        assert => {
            assert.expect(4);

            const serviceName1 = "service1";
            const tokenHandler1 = { serviceName: serviceName1 };
            const serviceName2 = "service2";
            const tokenHandler2 = { serviceName: serviceName2 };

            jwtTokenRegistry.register(tokenHandler1);
            jwtTokenRegistry.register(tokenHandler2);

            assert.strictEqual(
                jwtTokenRegistry.has(serviceName1),
                true,
                "handler of service1 exist"
            );
            assert.strictEqual(
                jwtTokenRegistry.has(serviceName1),
                true,
                "handler of service2 exist"
            );

            assert.strictEqual(
                jwtTokenRegistry.get(serviceName1),
                tokenHandler1,
                "handler of service1 can be requested back"
            );
            assert.strictEqual(
                jwtTokenRegistry.get(serviceName2),
                tokenHandler2,
                "handler of service2 can be requested back"
            );

            jwtTokenRegistry.unregister(serviceName1);
            jwtTokenRegistry.unregister(serviceName2);
        }
    );

    QUnit.test("unregistered handler is not available anymore", assert => {
        const serviceName = 'baz';
        const tokenHandler = {serviceName};

        jwtTokenRegistry.register(tokenHandler);
        jwtTokenRegistry.unregister(serviceName);

        assert.strictEqual(jwtTokenRegistry.has(serviceName), false, 'handler for service should not exist');
        assert.strictEqual(jwtTokenRegistry.get(serviceName), void 0, 'get undefined for unexist service');
    });
});
