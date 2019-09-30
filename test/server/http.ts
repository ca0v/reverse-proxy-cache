import * as assert from "assert";
import { Http } from "../../server/Http";
import { Db } from "@app/server/db";
import { Proxy } from "@app/server/proxy";

describe("tests http", () => {
    it("api", () => {
        assert.ok(Http.prototype.invokeDelete);
        assert.ok(Http.prototype.invokeGet);
        assert.ok(Http.prototype.invokeOptions);
        assert.ok(Http.prototype.invokePost);
        assert.ok(Http.prototype.invokePut);

        let cfg = {
            "reverse-proxy-cache": {
                "port": "3002",
                "reverse-proxy-db": "unittest.sqlite",
                "proxy-pass": [
                    {
                        "about": "requests to /mock redirect to https://usalvwdgis1.infor.com:6443",
                        "baseUri": "/mock/ags",
                        "cache-processor": "ignore-callback-querystring",
                        "proxyUri": "https://usalvwdgis1.infor.com:6443/arcgis"
                    }
                ]
            }
        };

        Db.init(cfg).then(cache => {
            let proxy = new Proxy(cfg);
            let http = new Http(cache, proxy);
            // cannot test without setting up a server?  Might as well setup client-side tests for the server module?
        });
    });
});