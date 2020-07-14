"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_get_1 = require("../server/fun/http-get");
const assert = require("assert");
const server_1 = require("../server");
const got = new http_get_1.HttpsGet();
const proxyPort = 3004;
const config = {
    "reverse-proxy-cache": {
        verbose: true,
        port: `${proxyPort}`,
        "reverse-proxy-db": "unittest.sqlite",
        "proxy-pass": [
            {
                "baseUri": "/mock/test/MapIcons/",
                "proxyUri": "https://usgvncalix01.infor.com/IPS112/client/images/MapDrawer/MapIcons/",
                "about": "used to test image caching"
            }
        ]
    }
};
describe("download-image tests", () => {
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
    it("downloads a picture through the proxy", async () => {
        let actualUrl = "https://usgvncalix01.infor.com/IPS112/client/images/MapDrawer/MapIcons/AbandonedVehicle.png";
        let response1 = await got.get(actualUrl, {
            rejectUnauthorized: false,
        });
        console.log(response1.body.length);
        // why 
        // assert.equal(response1.body.length, 4580, "response body is correct size");
        assert([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => v === response1.body[i]), "PNG header is correct");
        let cacheUrl = `http://localhost:${proxyPort}/mock/test/MapIcons/AbandonedVehicle.png`;
        let response2 = await got.get(cacheUrl);
        console.log(response2.body.length);
        assert.equal(response1.body.length, response2.body.length, "cache response size matches actual size");
    });
});
//# sourceMappingURL=download-image.js.map