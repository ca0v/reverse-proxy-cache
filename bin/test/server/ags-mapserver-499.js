"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const https = require("https");
const querystring = require("querystring");
// this is failing with the following response:
// Invalid request <br>Usage: https://usalvwdgis1.infor.com:6443/arcgis/tokens?request=gettoken&username=username&password=password&<br>Usage: https://usalvwdgis1.infor.com:6443/arcgis/tokens/generateToken?username=username&password=password&<br>Usage: https://usalvwdgis1.infor.com:6443/arcgis/tokens/gettoken.html<br>
// when using sampleserver5 I get ETIMEOUT although service works from the browser.
describe("server/ags", () => {
    it("access a secure service", async () => {
        return new Promise((good, bad) => {
            const data = JSON.stringify({
                f: "json",
                username: "user1",
                password: "user1",
                request: "gettoken",
                client: "referer",
                referer: "https://www.arcgis.com",
                expiration: 60,
            });
            const request = https.request({
                rejectUnauthorized: false,
                hostname: "sampleserver6.arcgisonline.com",
                method: "POST",
                port: 443,
                path: "/arcgis/tokens/generateToken",
            }, (res) => {
                res.on("data", (d) => {
                    console.log(d.toString());
                    good(d);
                });
            });
            request.on("error", (err) => {
                console.error(err);
                bad(err);
            });
            console.log(data);
            request.write(data);
            request.end();
        });
    });
    it("generate a token from https://www.arcgis.com/sharing/oauth2/token", async () => {
        return new Promise((good, bad) => {
            // frustrated trying to generate a token via generateToken, trying oauth2 in hopes to actually get a usable result (not sure ags supports oauth2 so need generateToken to work as well)
            // returns EPROTO 8576:error:1408F10B:SSL routines:ssl3_get_record:wrong version number (fixed port to 443 resolved this)
            // {"error":{"code":400,"error":"invalid_request","error_description":"client_id not specified","message":"client_id not specified","details":[]}}
            // works when switching from json to x-www-form-urlencoded
            // this works from browser: http://localhost:3002/mock/proxy/arcgis/sharing/oauth2/token?client_id=C6dEwUsTigxRzuWs&client_secret=9e0233c26bb94ee8a1f392e3ecb1b04c&grant_type=client_credentials
            const data = querystring.stringify({
                f: "json",
                client_id: "C6dEwUsTigxRzuWs",
                client_secret: "9e0233c26bb94ee8a1f392e3ecb1b04c",
                grant_type: "client_credentials",
            });
            const request = https.request({
                rejectUnauthorized: true,
                hostname: "www.arcgis.com",
                method: "POST",
                port: 443,
                path: "/sharing/oauth2/token",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Content-Length": data.length,
                },
            }, (res) => {
                res.on("data", (d) => {
                    const data = JSON.parse(d);
                    !data.error ? good(data) : bad(data);
                });
            });
            request.on("error", (err) => {
                bad(err);
            });
            console.log(data);
            request.write(data);
            request.end();
        });
    });
    it("generate a token from http://localhost:3002/mock/proxy/arcgis/sharing/oauth2/token", async () => {
        return new Promise((good, bad) => {
            // frustrated trying to generate a token via generateToken, trying oauth2 in hopes to actually get a usable result (not sure ags supports oauth2 so need generateToken to work as well)
            // returns EPROTO 8576:error:1408F10B:SSL routines:ssl3_get_record:wrong version number (fixed port to 443 resolved this)
            // {"error":{"code":400,"error":"invalid_request","error_description":"client_id not specified","message":"client_id not specified","details":[]}}
            // works when switching from json to x-www-form-urlencoded
            // this works from browser: http://localhost:3002/mock/proxy/arcgis/sharing/oauth2/token?client_id=C6dEwUsTigxRzuWs&client_secret=9e0233c26bb94ee8a1f392e3ecb1b04c&grant_type=client_credentials
            const data = querystring.stringify({
                f: "json",
                client_id: "C6dEwUsTigxRzuWs",
                client_secret: "9e0233c26bb94ee8a1f392e3ecb1b04c",
                grant_type: "client_credentials",
            });
            const request = http.request({
                hostname: "localhost",
                method: "POST",
                port: 3002,
                path: "/mock/proxy/arcgis/sharing/oauth2/token",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Content-Length": data.length,
                },
            }, (res) => {
                res.on("data", (d) => {
                    const data = JSON.parse(d);
                    !data.error ? good(data) : bad(data);
                });
            });
            request.on("error", (err) => {
                bad(err);
            });
            console.log(data);
            request.write(data);
            request.end();
        });
    });
});
//# sourceMappingURL=ags-mapserver-499.js.map