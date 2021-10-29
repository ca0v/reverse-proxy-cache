import * as assert from "assert";
import { Db } from "../../server/db.js";
import { ReverseProxyCache } from "#@app/server/contracts.js";

describe("server/db", () => {
  it("test 'exists' method", async () => {
    let cfg: ReverseProxyCache = {
      verbose: true,
      port: "8080",
      "proxy-pass": [],
      "reverse-proxy-db": "./unittest.sqlite",
    };
    let db = await Db.init(cfg);
    let isNull = await db.exists("key1");
    db.close();
    assert.ok(!isNull, "key1 not found");
  });
});
