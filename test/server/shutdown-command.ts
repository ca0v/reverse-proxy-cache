import { Server } from "../../server.js";
import { HttpsGet } from "../../server/fun/http-get.js";
import * as assert from "assert";

describe("tests the /system/shutdown command", () => {
  it("ensures invalid system request does not stop the server", async () => {
    const proxy = new Server({
      "reverse-proxy-cache": {
        port: "3002",
        verbose: true,
        "reverse-proxy-db": "ca0v.sqlite",
        "proxy-pass": [],
      },
    });
    await proxy.start();
    const got = new HttpsGet();
    let response = await got.get("http://localhost:3002/system?delete=500");
    response = await got.get("http://localhost:3002/system?shut");
    assert.equal(response.statusCode, 500, "statusCode");
    assert.equal(
      response.body,
      "no configuration found for this endpoint",
      "body"
    );
    assert.equal(
      response.statusMessage,
      "Internal Server Error",
      "statusMessage: unable to process request"
    );
    await got.get("http://localhost:3002/system?delete=500");
    proxy.stop(); // already stopped
  });

  it("starts and stops the proxy", async () => {
    const proxy = new Server({
      "reverse-proxy-cache": {
        port: "3002",
        verbose: true,
        "reverse-proxy-db": "ca0v.sqlite",
        "proxy-pass": [],
      },
    });
    await proxy.start();
    const got = new HttpsGet();
    let response = await got.get("http://localhost:3002/system?delete=500");
    response = await got.get("http://localhost:3002/system?shutdown");
    assert.equal(response.statusCode, 200, "system/shutdown 200");
    const data = response.body;
    assert.equal(data, "shutdown");
    try {
      await got.get("http://localhost:3002/system?delete=500");
      throw "expected ECONNREFUSED exception";
    } catch (ex) {
      assert.ok((ex + "").startsWith("Error: connect ECONNREFUSED"), ex + "");
    }
    try {
      proxy.stop(); // already stopped
      throw "should already be stopped";
    } catch (ex) {
      assert.ok(
        (ex + "").startsWith("Error: SQLITE_MISUSE: Database is closed"),
        ex + ""
      );
    }
  });
});