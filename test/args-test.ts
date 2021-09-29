import { parseArgs } from "../parseArgs";
import * as assert from "assert";

describe("test cli options", () => {
  it("test add", () => {
    const args = parseArgs("node.exe some/path add".split(" "));
    assert.strictEqual(
      args.package,
      "package.json",
      "defaults to reading package.json"
    );
    assert.strictEqual(args.target, "https://site.com");
    assert.strictEqual(args.path, "/proxy/site");
  });

  it("test add with package", () => {
    const args = parseArgs(
      "node.exe some/path add --package foo.json".split(" ")
    );
    assert.strictEqual(args.package, "foo.json", "package specified");
    assert.strictEqual(args.target, "https://site.com");
    assert.strictEqual(args.path, "/proxy/site");
  });
});
