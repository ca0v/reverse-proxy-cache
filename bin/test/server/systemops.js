"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("../../server");
const assert = require("assert");
const http_get_1 = require("../../server/fun/http-get");
const stringify_1 = require("../../server/fun/stringify");
describe("hits the /system endpoint", () => {
    const got = new http_get_1.HttpsGet();
    const proxyPort = 3004;
    const config = {
        "reverse-proxy-cache": {
            verbose: true,
            port: `${proxyPort}`,
            "reverse-proxy-db": "ca0v.sqlite",
            "proxy-pass": [
                {
                    baseUri: "/mock/test/MapIcons/",
                    proxyUri: "https://usgvncalix02.infor.com/ips_112/client/images/mapdrawer/mapicons/",
                    about: "used to test image caching",
                },
            ],
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
        const cacheUrl = `http://localhost:${proxyPort}/system?delete=504`;
        const response1 = await got.get(cacheUrl);
        assert.strictEqual(response1.statusCode, 200);
        assert.strictEqual(response1.body, "deleting where status code is 504");
    });
    it("creates a mock entry", async () => {
        const mockData = "this data was written from a unit test";
        const response1 = await got.post(`http://localhost:${proxyPort}/system?mock=add`, {
            body: JSON.stringify({
                method: "GET",
                url: "https://usgvncalix02.infor.com/ips_112/client/images/mapdrawer/mapicons/README.md",
                data: mockData,
            }),
        });
        assert.strictEqual(response1.statusCode, 200, "mock request was successful");
        const response2 = await got.get(`http://localhost:${proxyPort}/mock/test/MapIcons/README.md`);
        stringify_1.verbose("RESPONSE BODY", response2.body);
        assert.strictEqual(response2.body, mockData, "the mock data was written");
    });
});
//# sourceMappingURL=systemops.js.map