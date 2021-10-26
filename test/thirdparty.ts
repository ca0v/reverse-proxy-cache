import * as assert from "assert";
import * as sqlite from "sqlite3";
import { Database } from "sqlite";

let sqlite3 = sqlite;
sqlite3 = (<any>sqlite).default;

describe("sqlite tests", () => {
  it("test if sqlite.Database exists", () => {
    assert.ok(
      !!Database,
      `Database exists on sqlite module ${JSON.stringify(sqlite)}`
    );
  });
});

describe("sqlite3 tests", () => {
  it("test if sqlite3.Database exists", () => {
    assert.ok(
      !!sqlite3.Database,
      `Database exists on sqlite module ${JSON.stringify(sqlite3)}`
    );
  });
});
