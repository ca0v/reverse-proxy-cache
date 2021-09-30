import type { IConfig } from "../../server/contracts";
import { run, Server as ProxyServer } from "../../server";
import * as assert from "assert";
import { HttpsGet } from "../../server/fun/http-get";
import { verbose } from "../../server/fun/stringify";
import * as querystring from "querystring";

describe("hits the /system endpoint", () => {
  const got = new HttpsGet();
  const proxyPort = 3004;

  const config: IConfig = {
    "reverse-proxy-cache": {
      verbose: true,
      port: `${proxyPort}`,
      "reverse-proxy-db": "ca0v.sqlite",
      "proxy-pass": [
        {
          baseUri: "/mock/test/MapIcons/",
          proxyUri:
            "https://usgvncalix02.infor.com/ips_112/client/images/mapdrawer/mapicons/",
          about: "used to test image caching",
        },
      ],
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
    const cacheUrl = `http://localhost:${proxyPort}/system?delete=504`;
    const response1 = await got.get(cacheUrl);
    assert.strictEqual(response1.statusCode, 200);
    assert.strictEqual(response1.body, "deleting where status code is 504");
  });

  it("creates a mock entry using source urls", async () => {
    const mockData = "this data was written from a unit test";

    const response1 = await got.post(
      `http://localhost:${proxyPort}/system?mock=add`,
      {
        body: JSON.stringify({
          method: "GET",
          url: "https://usgvncalix02.infor.com/ips_112/client/images/mapdrawer/mapicons/README.md",
          data: mockData,
        }),
      }
    );

    assert.strictEqual(
      response1.statusCode,
      200,
      "mock request was successful"
    );

    const response2 = await got.get(
      `http://localhost:${proxyPort}/mock/test/MapIcons/README.md`
    );

    verbose("RESPONSE BODY", response2.body);
    assert.strictEqual(response2.body, mockData, "the mock data was written");
  });

  it("creates a mock entry using a mock url", async () => {
    const mockData = "this data was written from a unit test";

    const response1 = await got.post(
      `http://localhost:${proxyPort}/system?mock=add`,
      {
        body: JSON.stringify({
          method: "GET",
          url: `/mock/test/MapIcons/README2.md`,
          data: mockData,
        }),
      }
    );

    assert.strictEqual(
      response1.statusCode,
      200,
      "mock request was successful"
    );

    const response2 = await got.get(
      `http://localhost:${proxyPort}/mock/test/MapIcons/README2.md`
    );

    verbose("RESPONSE BODY", response2.body);
    assert.strictEqual(response2.body, mockData, "the mock data was written");
  });
});
