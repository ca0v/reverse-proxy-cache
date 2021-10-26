import * as assert from "assert";
import { processor } from "../../cache-processor/search-and-replace.js";

describe("cache-processor/search-and-replace", () => {
  it("tests processResponse", () => {
    const response = processor.processResponse("", "foofoobarbar", {
      proxyPass: {
        about: "",
        baseUri: "",
        proxyUri: "",
        "search-and-replace": { foo: "bar", bar: "X" },
      },
    });
    assert.strictEqual(response, "XXXX");
  });
});
