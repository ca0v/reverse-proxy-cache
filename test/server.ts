import * as assert from "assert";
import { run, Server as ProxyServer } from "../server";

import * as got from "got";
import { EchoServer } from "./EchoServer";
import { IConfig } from "../server/IConfig";
import { verbose } from "../server/stringify";

let echoPort = 3003;// + Math.round(200 * Math.random());
let proxyPort = echoPort + 1;

let config: IConfig = {
    "reverse-proxy-cache":
    {
        "port": `${proxyPort}`,
        "reverse-proxy-db": "unittest.sqlite",
        "proxy-pass": [
            {
                "about": "proxy back to echo server, no cache",
                "proxyUri": `http://localhost:${echoPort}/echo`,
                "baseUri": "/mock/nocache/echo",
                "no-cache": true,
            },
            {
                "about": "proxy back to echo server, use caching",
                "proxyUri": `http://localhost:${echoPort}/echo`,
                "baseUri": "/mock/cache/echo",
            },
            {
                "about": "caches calendar.html",
                "proxyUri": "http://js.arcgis.com/3.29/dijit/templates/",
                "baseUri": "/mock/ags/3.29/dijit/templates/",
                "no-cache": true,
            },
            {
                "about": "proxy xstyle",
                "proxyUri": "https://js.arcgis.com/3.29/xstyle/",
                "baseUri": "/mock/ags/3.29/xstyle/",
                "no-cache": true,
            }
        ]
    }
};

describe("tests proxy server", () => {

    let proxy: ProxyServer;
    let echo: EchoServer;

    // start proxy and echo server
    before(async () => {

        // start the proxy server
        proxy = await run(config);

        // start a server to proxy
        echo = new EchoServer({ port: echoPort });
        echo.start();

    });

    // shutdown servers
    after(() => {
        proxy.stop();
        echo.stop();
    });

    it("tests https GET against proxy", async () => {
        let testUrl = `http://localhost:${proxyPort}/mock/ags/3.29/xstyle/css.js`;
        let body = (await got.get(testUrl)).body;
        console.log("xstyle.js", body);
        assert.ok(body, "html returned");
    });

    it("tests http GET against proxy", async () => {
        let testUrl = `http://localhost:${proxyPort}/mock/ags/3.29/dijit/templates/Calendar.html`;
        let body = (await got.get(testUrl)).body;
        console.log("calendar.html", body);
        assert.ok(body, "html returned");
    });
    
    it("tests 'offline' mode", async () => {
        echo.stop();
        try {
            await got.get(`http://localhost:${echoPort}/echo`, {
                "timeout": 100
            });
        } catch (ex) {
            // this is good
            verbose(`SUCCESS: ${ex}`);
            assert.equal(ex, "TimeoutError: Timeout awaiting 'request' for 100ms");
            echo.start();
            let response = await got.get(`http://localhost:${echoPort}/echo`);
            assert.equal(response.body, "", "received body");
        } finally {
            echo.start();
        }
    }).timeout(5000);

    it("tests POST against cache proxy", async () => {
        echo.start();
        let key = `hello ${Math.random()}`;
        // make an echo request
        let response = await got.post(`http://localhost:${proxyPort}/mock/cache/echo`, {
            "body": key
        });
        assert.equal(response.body, key);
        // stop echo server
        echo.stop();
        try {
            response = await got.post(`http://localhost:${proxyPort}/mock/cache/echo`, {
                "body": key
            });
            assert.equal(response.body, key);
        } finally {
            echo.start();
        }
    });

    it("tests POST against nocache proxy", async () => {
        let key = `hello ${Math.random()}`;
        // make an echo request
        echo.start();
        let response = await got.post(`http://localhost:${proxyPort}/mock/nocache/echo`, {
            "body": key
        });
        assert.equal(response.body, key);

        // stop echo server, should cause failure
        echo.stop();
        // this request should be failing!  got.post does not reject the promise9
        await got.post(`http://localhost:${proxyPort}/mock/nocache/echo`, {
            "body": key,
            timeout: 100
        }).catch(err => {
            // this is good
            verbose(`SUCCESS: ${err}`);
        }).then(response => {
            // this is bad
            verbose("response", response);
            assert.ok(!response, "response is null (got.post is not failing when server is down?)");
        }).finally(() => {
            echo.start();
        });
        return 0;
    }).timeout(60 * 1000);

    it("wait one minute before shutting down servers", done => {
        setTimeout(() => done(), 60 * 1000);
     }).timeout(120 * 1000);
});
