"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const proxy_1 = require("../../server/proxy");
describe("tests proxy", () => {
    it("tests proxy", () => {
        let cfg = {
            port: "3002",
            "reverse-proxy-db": "unittest.sqlite",
            verbose: true,
            "proxy-pass": [
                {
                    about: "mock-foo-bar",
                    baseUri: "/mock/foo/bar",
                    "cache-processor": "ignore-callback-querystring",
                    proxyUri: "//mock-foo-bar"
                },
                {
                    about: "mock-foo",
                    baseUri: "/mock/foo",
                    "cache-processor": "ignore-callback-querystring",
                    proxyUri: "//mock-foo"
                },
                {
                    about: "mock-bar",
                    baseUri: "/mock/bar",
                    "cache-processor": "ignore-callback-querystring",
                    proxyUri: "//mock-bar"
                }
            ]
        };
        let proxy = new proxy_1.Proxy(cfg);
        assert.equal(proxy.proxy("/mock/foo/it").url, "//mock-foo/it");
        assert.equal(proxy.proxy("/mock/bar/it").url, "//mock-bar/it");
        assert.equal(proxy.proxy("/mock/foo/bar/it").url, "//mock-foo-bar/it");
    });
});
//# sourceMappingURL=proxy.js.map