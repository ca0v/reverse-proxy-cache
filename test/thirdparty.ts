import * as assert from "assert";
import * as sqlite3 from "sqlite3";

describe("sqlite3 tests", () => {
    it("test if sqlite.Database exists", () => {
        assert.ok(!!sqlite3.Database, `Database exists on sqlite module ${JSON.stringify(sqlite3)}`);
    })
})