"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const search_and_replace_1 = require("../../cache-processor/search-and-replace");
describe("cache-processor/search-and-replace", () => {
    it("tests processResponse", () => {
        const response = search_and_replace_1.processResponse("", "foofoobarbar", {
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
//# sourceMappingURL=search-and-replace.js.map