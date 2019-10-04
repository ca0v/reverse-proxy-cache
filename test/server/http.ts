import * as node_http from "http";
import * as assert from "assert";
import { Http } from "../../server/Http";
import { IDb } from "@app/server/db";
import { EchoServer } from "../echo-server";
import * as querystring from "querystring";

function rightOf(v: string, pattern: string) {
    let i = v.indexOf(pattern);
    return i === -1 ? "" : v.substring(i + 1);
}
function promisify<T>(value: T) {
    return new Promise<T>(good => good(value));
}

describe("tests http", () => {
    it("api", () => {
        assert.ok(Http.prototype.invokeDelete);
        assert.ok(Http.prototype.invokeGet);
        assert.ok(Http.prototype.invokeOptions);
        assert.ok(Http.prototype.invokePost);
        assert.ok(Http.prototype.invokePut);
    });

    it("tests invoke", done => {
        let db: IDb = {
            exists: (url: string) => promisify(url),
            add: (url: string, res: string) => {}
        };

        let echo = new EchoServer({ port: 3003 });
        echo.start();

        let http = new Http(db);

        let server = node_http.createServer((req, res) => {
            let url = rightOf(req.url + "", "?");
            let query = querystring.parse(url || "");

            http.invokeGet(
                {
                    url: `http://localhost:3003/echo?${querystring.stringify(query)}`
                },
                req,
                res
            );
        });

        server.listen(3004);

        node_http
            .get("http://localhost:3004/echo?foo=bar&bar=foo", res => {
                let data = ""; // what if it is binary data?
                res.on("data", chunk => {
                    data += chunk;
                }).on("end", () => {
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
            .on("error", err => done(err));
    });
});
