import * as node_http from "http";
import * as assert from "assert";
import { Http } from "../../server/Http.js";
import { IDb } from "@app/server/db.js";
import { EchoServer } from "../echo-server.js";
import * as querystring from "querystring";

function rightOf(v: string, pattern: string) {
  let i = v.indexOf(pattern);
  return i === -1 ? "" : v.substring(i + 1);
}
function promisify<T>(value: T) {
  return new Promise<T>((good) => good(value));
}

const echoPort = 3003;
const proxyPort = 1 + echoPort;

describe("tests http", () => {
  let echo: EchoServer;

  // start proxy and echo server
  before(async () => {
    // start a server to proxy
    echo = new EchoServer({ port: echoPort });
    echo.start();
  });

  // shutdown servers
  after(() => {
    echo.stop();
  });

  it("api", () => {
    assert.ok(Http.prototype.invokeDelete);
    assert.ok(Http.prototype.invokeGet);
    assert.ok(Http.prototype.invokeOptions);
    assert.ok(Http.prototype.invokePost);
    assert.ok(Http.prototype.invokePut);
  });

  false &&
    it("tests echo", (done) => {
      const request = node_http.get(
        `http://localhost:${echoPort}/echo?foo=bar`,
        (res) => {
          let data = "";
          assert.equal("echo/text", res.headers["content-type"]);
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            done();
          });
        }
      );
    });

  it("tests invoke", (done) => {
    let db: IDb = {
      exists: (url: string) => promisify(url),
      add: (url: string, res: string) => {},
    };

    let http = new Http(db);

    let server = node_http.createServer((req, res) => {
      let url = rightOf(req.url + "", "?");
      let query = querystring.parse(url || "");

      http.invokeGet(
        {
          url: `http://localhost:${echoPort}/echo?${querystring.stringify(
            query
          )}`,
        },
        req,
        res
      );
    });

    server.listen(proxyPort);

    const response = node_http
      .get(`http://localhost:${proxyPort}/echo?foo=bar&bar=foo`, (res) => {
        assert.equal(
          res.headers["content-type"],
          "echo/text",
          "content type is echo/text"
        );
        let data = ""; // what if it is binary data?
        res
          .on("data", (chunk) => {
            data += chunk;
          })
          .on("end", () => {
            try {
              assert.ok(data);
              assert.equal(data, "echo()", "empty echo response");
              done();
            } catch (ex) {
              done(ex);
            } finally {
              server.close();
              echo.stop();
            }
          });
      })
      .on("error", (err) => done(err));
  });
});
