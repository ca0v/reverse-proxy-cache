import * as assert from "assert";
import { processResponse } from "../../cache-processor/search-and-replace";

describe("cache-processor/search-and-replace", () => {
    it("tests processResponse", () => {
        const response = processResponse("", "foofoobarbar", {
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
