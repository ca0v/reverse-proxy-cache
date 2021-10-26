import * as assert from "assert";
import * as sqlite from "sqlite3";
const sqlite3 = <any>(<any>sqlite).default;

describe("sqlite3 tests", () => {
  it("test if sqlite.Database exists", () => {
    assert.ok(
      !!sqlite3.Database,
      `Database exists on sqlite module ${JSON.stringify(sqlite3)}`
    );
  });
});
