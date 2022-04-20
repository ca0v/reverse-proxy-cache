import * as assert from "assert";
import { queryHandler } from "#@app/server/handlers/queryHandler.js";

describe("query handler tests", () => {
  it("run query", async () => {
    await queryHandler("--query", ..."select count(1) from cache".split(" "));
  });
});
