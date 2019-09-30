import * as assert from "assert";
import { Db } from "../../server/db";
import { IConfig } from "@app/server/IConfig";

describe("server/db", () => {
    it("test 'exists' method", () => {
        let cfg: IConfig = {
            "reverse-proxy-cache": {
                "port": "8080",
                "proxy-pass": [],
                "reverse-proxy-db": "./test.sqlite"
            }
        };
        return Db.init(cfg).then(db => {
            db.exists("key1").then(isNull => assert.ok(!isNull, "key1 not found"));
        });
    });
});