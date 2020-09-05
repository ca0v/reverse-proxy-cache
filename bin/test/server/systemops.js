"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("../../server");
const assert = require("assert");
const http_get_1 = require("../../server/fun/http-get");
describe("hits the /system endpoint", () => {
    const got = new http_get_1.HttpsGet();
    const proxyPort = 3004;
    const config = {
        "reverse-proxy-cache": {
            verbose: true,
            port: `${proxyPort}`,
            "reverse-proxy-db": "ca0v.sqlite",
            "proxy-pass": [],
        },
    };
    let proxy;
    // start proxy and echo server
    before(async () => {
        // start the proxy server
        proxy = await server_1.run(config);
    });
    // shutdown servers
    after(() => {
        proxy && proxy.stop();
    });
    it("deletes all 504 entries", async () => {
        const cacheUrl = `http://localhost:3004/system?delete=504`;
        const response1 = await got.get(cacheUrl);
        assert.strictEqual(response1.statusCode, 200);
        assert.strictEqual(response1.body, "deleted where status code is 504");
    });
});
//# sourceMappingURL=systemops.js.map