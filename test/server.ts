import * as assert from "assert";
import run = require("../server");

describe("server", () => {
    it("ensures it exports a function", () => {
        assert.equal(typeof run, "function");
    });
})