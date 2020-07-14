"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const sqlite3 = require("sqlite3");
describe("sqlite3 tests", () => {
    it("test if sqlite.Database exists", () => {
        assert.ok(!!sqlite3.Database, `Database exists on sqlite module ${JSON.stringify(sqlite3)}`);
    });
});
//# sourceMappingURL=thirdparty.js.map