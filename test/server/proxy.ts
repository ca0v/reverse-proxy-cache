import * as assert from "assert";
import { Proxy } from "../../server/Proxy";
describe("tests Proxy", () => {
    it("tests 'proxy' method", () => {
        let proxy = new Proxy({
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
        });

        assert.equal(proxy.proxy("/mock/ags/foo").url, "https://usalvwdgis1.infor.com:6443/arcgis/foo");
    })
})