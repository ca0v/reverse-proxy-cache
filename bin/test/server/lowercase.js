"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const lowercase_1 = require("../../server/fun/lowercase");
describe("server/lowercase", () => {
    it("test 'lowercase' method", () => {
        let v = lowercase_1.lowercase({ A: 'a' });
        assert.equal(v.a, "a");
    });
});
//# sourceMappingURL=lowercase.js.map