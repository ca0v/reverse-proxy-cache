import * as assert from "assert";
import { lowercase } from "../../server/fun/lowercase.js";

describe("server/lowercase", () => {
  it("test 'lowercase' method", () => {
    let v = lowercase(<{ a: string }>(<any>{ A: "a" }));
    assert.equal(v.a, "a");
  });
});
