import { HttpsGet } from "../server/fun/http-get.js";
import { ok, equal, fail } from "assert";
import { run, Server as ProxyServer } from "../server.js";
import { IConfig } from "#@app/server/contracts.js";

const got = new HttpsGet();
const proxyPort = 3004;

const config: IConfig = {
  "reverse-proxy-cache": {
    verbose: true,
    port: `${proxyPort}`,
    isBinaryMimeType: ["image/"],
    "reverse-proxy-db": "unittest.sqlite",
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

describe("Tests invalid url", () => {
  it("Tests invalid url", async () => {
    let cacheUrl = `http://localhost:${proxyPort}/mock/test/MapIcons/Invalid.png`;
    try {
      const response = await got.get(cacheUrl);
      fail("expected failure");
    } catch (ex) {
      ok((ex + "").includes("ECONNREFUSED"));
    }
  });
});

describe("download-image tests", () => {
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

  it("downloads a picture through the proxy", async () => {
    let cacheUrl = `http://localhost:${proxyPort}/mock/test/MapIcons/AbandonedVehicle.png`;
    let response1 = await got.get(cacheUrl);
    ok(
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => {
        equal(v, response1.body[i], `image header ${i}`);
        return v === response1.body[i];
      }),
      "PNG header is correct"
    );

    equal(
      response1.body.length,
      4580,
      "cache response size matches actual size"
    );
  });
});
