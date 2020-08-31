"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_http = require("http");
const assert = require("assert");
const Http_1 = require("../../server/Http");
const echo_server_1 = require("../echo-server");
const querystring = require("querystring");
function rightOf(v, pattern) {
    let i = v.indexOf(pattern);
    return i === -1 ? "" : v.substring(i + 1);
}
function promisify(value) {
    return new Promise((good) => good(value));
}
const echoPort = 3003;
const proxyPort = 1 + echoPort;
describe("tests http", () => {
    let echo;
    // start proxy and echo server
    before(async () => {
        // start a server to proxy
        echo = new echo_server_1.EchoServer({ port: echoPort });
        echo.start();
    });
    // shutdown servers
    after(() => {
        echo.stop();
    });
    it("api", () => {
        assert.ok(Http_1.Http.prototype.invokeDelete);
        assert.ok(Http_1.Http.prototype.invokeGet);
        assert.ok(Http_1.Http.prototype.invokeOptions);
        assert.ok(Http_1.Http.prototype.invokePost);
        assert.ok(Http_1.Http.prototype.invokePut);
    });
    false &&
        it("tests echo", (done) => {
            const request = node_http.get(`http://localhost:${echoPort}/echo?foo=bar`, (res) => {
                let data = "";
                assert.equal("echo/text", res.headers["content-type"]);
                res.on("data", (chunk) => {
                    data += chunk;
                });
                res.on("end", () => {
                    done();
                });
            });
        });
    it("tests invoke", (done) => {
        let db = {
            exists: (url) => promisify(url),
            add: (url, res) => { },
        };
        let http = new Http_1.Http(db);
        let server = node_http.createServer((req, res) => {
            let url = rightOf(req.url + "", "?");
            let query = querystring.parse(url || "");
            http.invokeGet({
                url: `http://localhost:${echoPort}/echo?${querystring.stringify(query)}`,
            }, req, res);
        });
        server.listen(proxyPort);
        const response = node_http
            .get(`http://localhost:${proxyPort}/echo?foo=bar&bar=foo`, (res) => {
            assert.equal(res.headers["content-type"], "echo/text", "content type is echo/text");
            let data = ""; // what if it is binary data?
            res.on("data", (chunk) => {
                data += chunk;
            }).on("end", () => {
                try {
                    assert.ok(data);
                    assert.equal(data, "echo()", "empty echo response");
                    done();
                }
                catch (ex) {
                    done(ex);
                }
                finally {
                    server.close();
                    echo.stop();
                }
            });
        })
            .on("error", (err) => done(err));
    });
});
//# sourceMappingURL=http.js.map