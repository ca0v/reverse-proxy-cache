import { parseArgs } from "../parseArgs";
import * as assert from "assert";
import { asConfig } from "../server/fun/asConfig";

function parse(args: string) {
  return asConfig(args.split(" "));
}

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

  it("test asConfig", () => {
    const config = parse("");
    const cache = config["reverse-proxy-cache"];
    assert.strictEqual(cache.port, "3002", "port");
    assert.strictEqual(
      cache["reverse-proxy-db"],
      "reverse-proxy-cache.sqlite",
      "db"
    );
    assert.strictEqual(cache.verbose, false, "verbose");
  });

  it("test asConfig port 5555", () => {
    const config = parse("--port 5555");
    const cache = config["reverse-proxy-cache"];
    assert.strictEqual(cache.port, "5555", "port modified");
  });

  it("test asConfig db.sqlite", () => {
    const config = parse("--db db.sqlite");
    const cache = config["reverse-proxy-cache"];
    assert.strictEqual(cache["reverse-proxy-db"], "db.sqlite", "db modified");
  });

  it("test asConfig db.sqlite", () => {
    const config = parse("--verbose");
    const cache = config["reverse-proxy-cache"];
    assert.strictEqual(cache.verbose, true, "verbose");
  });

  it("test asConfig offline", () => {
    const config = parse("--offline");
    const cache = config["reverse-proxy-cache"];
    assert.strictEqual(cache.offline, true, "offline");
  });
});
