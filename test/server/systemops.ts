import type { IConfig } from "../../server/contracts.js";
import { run, Server as ProxyServer } from "../../server.js";
import * as assert from "assert";
import { HttpsGet } from "../../server/fun/http-get.js";
import { verbose } from "../../server/fun/stringify.js";

const got = new HttpsGet();
const proxyPort = 3004;

async function getFromMock(query: string) {
  const response = await got.get(`http://localhost:${proxyPort}${query}`);
  return response;
}

async function addMockData(request: {
  method: string;
  url: string;
  data: string;
}) {
  return await got.post(`http://localhost:${proxyPort}/system?mock=add`, {
    body: JSON.stringify(request),
  });
}

async function postRegisterProxy(data: {
  about: string;
  baseUri: string;
  proxyUri: string;
}) {
  const response = await got.post(
    `http://localhost:${proxyPort}/system?proxy=add`,
    {
      body: JSON.stringify(data),
    }
  );
  if (response.statusCode >= 400)
    throw `${response.statusCode}:${response.statusMessage}`;
  return JSON.parse(response.body) as {};
}

describe("hits the /system endpoint", () => {
  const config: IConfig = {
    "reverse-proxy-cache": {
      verbose: true,
      port: `${proxyPort}`,
      "reverse-proxy-db": "ca0v.sqlite",
      "proxy-pass": [
        {
          baseUri: "/mock/test/MapIcons/",
          proxyUri:
            "https://usgvncalix02.acme.com/ips_112/client/images/mapdrawer/mapicons/",
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

    const request = {
      method: "GET",
      url: "https://usgvncalix02.acme.com/ips_112/client/images/mapdrawer/mapicons/README.md",
      data: mockData,
    };
    const response1 = await addMockData(request);
    verbose("response1", response1.body);

    assert.strictEqual(
      response1.statusCode,
      200,
      "mock request was successful"
    );

    const response2 = await getFromMock("/mock/test/MapIcons/README.md");
    verbose("response2", response2.body);

    assert.strictEqual(response2.body, mockData, "the mock data was written");
  });

  it("creates a mock entry using a mock url", async () => {
    const mockData = "this data was written from a unit test";

    const response1 = await addMockData({
      method: "GET",
      url: `/mock/test/MapIcons/README2.md`,
      data: mockData,
    });

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

  it("creates a new proxy entry", async () => {
    const status = await postRegisterProxy({
      about: "Register a proxy for unit test",
      baseUri: "/mock/acme/",
      proxyUri: "https://bogus.acme.com/",
    });

    assert.ok(status, JSON.stringify(status));

    await addMockData({
      method: "GET",
      url: "https://bogus.acme.com/README.md",
      data: "README",
    });

    const readme = await getFromMock("/mock/acme/README.md");
    assert.equal(readme.body, "README");
  });
});
