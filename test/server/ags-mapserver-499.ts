import * as assert from "assert";
import * as http from "http";
import * as https from "https";
import * as querystring from "querystring";
import { HttpsGet } from "../../server/fun/http-get.js";
import { run, Server as ProxyServer } from "../../server.js";
import { IConfig } from "#@app/server/contracts.js";

describe("agol raw post", () => {
  it("access https://services7.arcgis.com/k0UprFPHKieFB9UY/arcgis/rest/services/Feature_Service_Test/FeatureServer via hosted server (POST)", async () => {
    const got = new HttpsGet();
    const cacheUrl = `https://services7.arcgis.com/k0UprFPHKieFB9UY/arcgis/rest/services/Feature_Service_Test/FeatureServer`;

    // TODO: use URLSearchParams instead
    const data = querystring.stringify({
      f: "json",
      token: "abc",
    });

    const response1 = await got.post(cacheUrl, {
      body: data,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": data.length,
      },
    });
    assert.strictEqual(response1.statusCode, 200);
    const body = JSON.parse(response1.body.toString());
    assert.strictEqual(body.error.code, 498);
  });

  it("access https://services7.arcgis.com/k0UprFPHKieFB9UY/arcgis/rest/services/Feature_Service_Test/FeatureServer via hosted server (POST)", (done) => {
    // this POST message does not work...the "got" library is not sending the token to the server
    // the c# code works using FormUrlEncodedContent, maybe replace "got" with https?
    const cacheUrl = `https://services7.arcgis.com/k0UprFPHKieFB9UY/arcgis/rest/services/Feature_Service_Test/FeatureServer`;

    const data = querystring.stringify({
      f: "json",
      token: "invalidtokenvalue",
    });

    let response = "";

    const req = https.request(
      {
        host: "services7.arcgis.com",
        port: 443,
        method: "POST",
        path: "/k0UprFPHKieFB9UY/arcgis/rest/services/Feature_Service_Test/FeatureServer",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": data.length,
        },
      },
      (res) => {
        res.on("data", (data) => {
          response += data;
          console.log("data", response);
        });
      }
    );

    req.on("close", () => {
      console.log("close", response);
      const result = JSON.parse(response);
      assert.equal(result.error.code, 498);
      done();
    });

    req.on("error", (err) => {
      console.log("error", err);
    });

    req.on("drain", () => {
      console.log("drain", response);
    });

    req.write(data, "utf-8", (err) => {
      console.log("error", err);
    });

    req.end();
  });
});

describe("agol", () => {
  const got = new HttpsGet();
  const proxyPort = 3004;

  const config: IConfig = {
    "reverse-proxy-cache": {
      verbose: true,
      port: `${proxyPort}`,
      "reverse-proxy-db": "unittest.sqlite",
      "proxy-pass": [
        {
          about: "test auth against agol",
          baseUri:
            "/mock/arcgis/rest/services/Feature_Service_Test/FeatureServer",
          proxyUri:
            "https://services7.arcgis.com/k0UprFPHKieFB9UY/arcgis/rest/services/Feature_Service_Test/FeatureServer",
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

  it("access https://services7.arcgis.com/k0UprFPHKieFB9UY/arcgis/rest/services/Feature_Service_Test/FeatureServer via hosted server (GET)", async () => {
    const cacheUrl = `https://services7.arcgis.com/k0UprFPHKieFB9UY/arcgis/rest/services/Feature_Service_Test/FeatureServer?f=json&token=abc`;
    const response1 = await got.get(cacheUrl);
    assert.strictEqual(response1.statusCode, 200);
    const body = JSON.parse(response1.body.toString());
    assert.strictEqual(body.error.code, 498);
  });

  it("access /mock/arcgis/rest/services/Feature_Service_Test/FeatureServer via hosted server (POST)", async () => {
    const cacheUrl = `http://localhost:${proxyPort}/mock/arcgis/rest/services/Feature_Service_Test/FeatureServer`;
    const data = querystring.stringify({ f: "json", token: "abc" });
    const response1 = await got.post(cacheUrl, {
      body: data,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": data.length,
      },
    });
    assert.strictEqual(response1.statusCode, 200);
    const body = JSON.parse(response1.body.toString());
    assert.strictEqual(body.error.code, 498);
  });

  it("access /mock/arcgis/rest/services/Feature_Service_Test/FeatureServer (GET)", async () => {
    const cacheUrl = `http://localhost:${proxyPort}/mock/arcgis/rest/services/Feature_Service_Test/FeatureServer?f=json&token=abc`;
    const response1 = await got.get(cacheUrl);
    assert.strictEqual(response1.statusCode, 200);
    const body = JSON.parse(response1.body.toString());
    assert.strictEqual(body.error.code, 498);
  });

  it("access /mock/arcgis/rest/services/Feature_Service_Test/FeatureServer (POST)", async () => {
    const cacheUrl = `http://localhost:${proxyPort}/mock/arcgis/rest/services/Feature_Service_Test/FeatureServer`;
    const data = querystring.stringify({
      f: "json",
      token: "abc",
    });

    const response1 = await got.post(cacheUrl, {
      body: data,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": data.length,
      },
    });
    assert.strictEqual(response1.statusCode, 200);
    const body = JSON.parse(response1.body.toString());
    assert.strictEqual(body.error.code, 498);
  });
});

// this is failing with the following response:
// Invalid request <br>Usage: https://usalvwdgis1.infor.com:6443/arcgis/tokens?request=gettoken&username=username&password=password&<br>Usage: https://usalvwdgis1.infor.com:6443/arcgis/tokens/generateToken?username=username&password=password&<br>Usage: https://usalvwdgis1.infor.com:6443/arcgis/tokens/gettoken.html<br>
// when using sampleserver5 I get ETIMEOUT although service works from the browser.
describe("server/ags", () => {
  const proxyPort = 3004;

  const config: IConfig = {
    "reverse-proxy-cache": {
      verbose: true,
      port: `${proxyPort}`,
      "reverse-proxy-db": "unittest.sqlite",
      "proxy-pass": [
        {
          about: "test auth ags",
          baseUri: "/mock/proxy/arcgis/sharing/oauth2/token",
          proxyUri: "https://www.arcgis.com/sharing/oauth2/token",
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

  it("access a secure service", async () => {
    return new Promise((good, bad) => {
      const data = JSON.stringify({
        f: "json",
        username: "user1",
        password: "user1",
        request: "gettoken",
        client: "referer",
        referer: "https://www.arcgis.com",
        expiration: 60,
      });

      const request = https.request(
        {
          rejectUnauthorized: false,
          hostname: "sampleserver6.arcgisonline.com",
          method: "POST",
          port: 443,
          path: "/arcgis/tokens/generateToken",
        },
        (res) => {
          res.on("data", (d) => {
            console.log(d.toString());
            good(d);
          });
        }
      );

      request.on("error", (err) => {
        console.error(err);
        bad(err);
      });

      console.log(data);
      request.write(data);
      request.end();
    });
  });

  it("generate a token from https://www.arcgis.com/sharing/oauth2/token", async () => {
    return new Promise((good, bad) => {
      // frustrated trying to generate a token via generateToken, trying oauth2 in hopes to actually get a usable result (not sure ags supports oauth2 so need generateToken to work as well)
      // returns EPROTO 8576:error:1408F10B:SSL routines:ssl3_get_record:wrong version number (fixed port to 443 resolved this)
      // {"error":{"code":400,"error":"invalid_request","error_description":"client_id not specified","message":"client_id not specified","details":[]}}
      // works when switching from json to x-www-form-urlencoded
      // this works from browser: http://localhost:3002/mock/proxy/arcgis/sharing/oauth2/token?client_id=C6dEwUsTigxRzuWs&client_secret=9e0233c26bb94ee8a1f392e3ecb1b04c&grant_type=client_credentials
      const data = querystring.stringify({
        f: "json",
        client_id: "C6dEwUsTigxRzuWs",
        client_secret: "9e0233c26bb94ee8a1f392e3ecb1b04c",
        grant_type: "client_credentials",
      });

      const request = https.request(
        {
          rejectUnauthorized: true,
          hostname: "www.arcgis.com",
          method: "POST",
          port: 443,
          path: "/sharing/oauth2/token",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": data.length,
          },
        },
        (res) => {
          res.on("data", (d) => {
            const data = JSON.parse(d);
            !data.error ? good(data) : bad(data);
          });
        }
      );

      request.on("error", (err) => {
        bad(err);
      });

      console.log(data);
      request.write(data);
      request.end();
    });
  });

  it("generate a token from http://localhost:{proxyPort}/mock/proxy/arcgis/sharing/oauth2/token", async () => {
    return new Promise((good, bad) => {
      const data = querystring.stringify({
        f: "json",
        client_id: "C6dEwUsTigxRzuWs",
        client_secret: "9e0233c26bb94ee8a1f392e3ecb1b04c",
        grant_type: "client_credentials",
      });

      const request = http.request(
        {
          hostname: "localhost",
          method: "POST",
          port: proxyPort,
          path: "/mock/proxy/arcgis/sharing/oauth2/token",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": data.length,
          },
        },
        (res) => {
          res.on("data", (d) => {
            const data = JSON.parse(d);
            !data.error ? good(data) : bad(data);
          });
        }
      );

      request.on("error", (err) => {
        bad(err);
      });

      console.log(data);
      request.write(data);
      request.end();
    });
  });
});
