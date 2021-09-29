"use strict";
/***
 * Accesses pbf and preserves the data and headers
 * https://basemaps.arcgis.com/v1/arcgis/rest/services/World_Basemap/VectorTileServer/tile/{z}/{y}/{x}.pbf
 */
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const http_get_1 = require("../../server/fun/http-get");
const server_1 = require("../../server");
const fs_1 = require("fs");
const path_1 = require("path");
const tile000 = fs_1.readFileSync(path_1.normalize("./test/data/tile.0.0.0.pbf"));
describe("http get a pbf into cache", () => {
    const got = new http_get_1.HttpsGet();
    const proxyPort = 3004;
    const config = {
        "reverse-proxy-cache": {
            verbose: true,
            port: `${proxyPort}`,
            "reverse-proxy-db": "unittest.sqlite",
            "proxy-pass": [
                {
                    about: "test auth against agol",
                    baseUri: "/mock/arcgis/rest/services/Feature_Service_Test/VectorTileServer",
                    proxyUri: "https://basemaps.arcgis.com/v1/arcgis/rest/services/World_Basemap/VectorTileServer",
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
    it("loads pbf", async () => {
        const [x, y, z] = [0, 0, 0];
        const cacheUrl = `http://localhost:3004/mock/arcgis/rest/services/Feature_Service_Test/VectorTileServer/tile/${z}/${y}/${x}.pbf?v=1`;
        const response1 = await got.get(cacheUrl);
        assert.strictEqual(response1.statusCode, 200, "statusCode");
        const body = response1.body;
        assert.strictEqual(body.length, tile000.length, "body length");
        for (let i = 0; i < tile000.length; i++) {
            assert.strictEqual(body[i], tile000[i], `tile[${i}]`);
        }
    });
});
//# sourceMappingURL=ags-pbf.js.map