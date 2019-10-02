import * as assert from "assert";
import run = require("../server");

import * as http from "http";
import * as got from "got";

class EchoServer {
    private server: http.Server | null = null;

    constructor(private options: { port: number }) {

    }

    start() {
        this.server = http.createServer(async (req, res) => {
            req.on("end", () => {
                res.end();

            }).on("data", data => {
                res.write(data);
            });
        });
        this.server.listen(this.options.port);
    }

    stop() {
        if (!this.server) return;
        this.server.close();
        this.server = null;
    }
}

describe("server", () => {
    
    it("ensures it exports a function", () => {
        assert.equal(typeof run, "function");
    });

    it("tests 'get'", async () => {

        let echoPort = 3001 + Math.round(200 * Math.random());
        let proxyPort = echoPort + 1;

        // start the proxy server
        let proxy = await run({
            "reverse-proxy-cache":
            {
                "port": `${proxyPort}`,
                "reverse-proxy-db": "unittest.sqlite",
                "proxy-pass": [
                    {
                        "about": "proxy back to echo server",
                        "proxyUri": `http://localhost:${echoPort}/echo`,
                        "baseUri": "/mock/echo",
                        "no-cache": true,
                    }
                ]
            }
        });
        try {
            // start a server to proxy
            let echo = new EchoServer({ port: echoPort });
            echo.start();
            try {
                let key = `hello ${Math.random()}`;
                // make an echo request
                let response = await got.post(`http://localhost:${proxyPort}/mock/echo`, {
                    "body": key
                });
                assert.equal(response.body, key);
                // stop echo server
                echo.stop();
                response = await got.post(`http://localhost:${proxyPort}/mock/echo`, {
                    "body": key
                });
                assert.equal(response.body, key);
                // stop the proxy server
                proxy.stop();
            } catch (ex) {
                echo.stop();
                throw ex;
            }
        } catch (ex) {
            proxy.stop();
            throw ex;
        }
    });
})