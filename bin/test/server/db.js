"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const db_1 = require("../../server/db");
describe("server/db", () => {
    it("test 'exists' method", async () => {
        let cfg = {
            verbose: true,
            port: "8080",
            "proxy-pass": [],
            "reverse-proxy-db": "./unittest.sqlite"
        };
        let db = await db_1.Db.init(cfg);
        let isNull = await db.exists("key1");
        db.close();
        assert.ok(!isNull, "key1 not found");
    });
});
//# sourceMappingURL=db.js.map