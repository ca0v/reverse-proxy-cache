import type { IConfig } from "../../server/contracts";
import { run, Server as ProxyServer } from "../../server";
import * as assert from "assert";
import { HttpsGet } from "../../server/fun/http-get";

describe("hits the /system endpoint", () => {
    const got = new HttpsGet();
    const proxyPort = 3004;

    const config: IConfig = {
        "reverse-proxy-cache": {
            verbose: true,
            port: `${proxyPort}`,
            "reverse-proxy-db": "ca0v.sqlite",
            "proxy-pass": [],
        },
    };
    let proxy: ProxyServer | void;

    // start proxy and echo server
    before(async () => {
        // start the proxy server
        proxy = await run(config);
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
