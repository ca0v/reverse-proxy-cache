"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Http = void 0;
const stringify_1 = require("./fun/stringify");
const lowercase_1 = require("./fun/lowercase");
const http_get_1 = require("./fun/http-get");
let got = new http_get_1.HttpsGet();
function asBody(data) {
    return typeof data === "string" ? data : Buffer.from(data);
}
class Http {
    constructor(cache) {
        this.cache = cache;
    }
    async invokeDelete(url, req, res) {
        console.assert(req.method === "DELETE");
        return this.invoke(url, req, res);
    }
    async invokeOptions(url, req, res) {
        console.assert(req.method === "OPTIONS");
        return this.invoke(url, req, res);
    }
    async invokeGet(url, req, res) {
        console.assert(req.method === "GET");
        return this.invoke(url, req, res);
    }
    async invokePut(url, req, res) {
        console.assert(req.method === "PUT");
        return this.invoke(url, req, res);
    }
    async invoke(proxyInfo, req, res) {
        stringify_1.verbose("invoke proxy info: ", proxyInfo);
        let cacheKey = stringify_1.stringify({
            method: req.method,
            url: proxyInfo.key || proxyInfo.url || req.url || "",
        });
        let requestHeaders = lowercase_1.lowercase(req.headers);
        stringify_1.verbose(`inbound request headers: ${JSON.stringify(requestHeaders)}`);
        let origin = requestHeaders.origin;
        let host = requestHeaders.host;
        if (proxyInfo.readFromCache) {
            let cachedata = await this.cache.exists(cacheKey);
            if (!!cachedata) {
                let result = stringify_1.unstringify(cachedata);
                const resultHeaders = lowercase_1.lowercase(result.headers);
                // Set to true if you need the website to include cookies
                resultHeaders["access-control-allow-credentials"] = "true";
                resultHeaders["access-control-allow-origin"] = origin || host || "*";
                resultHeaders["access-control-allow-methods"] = req.method;
                // it is not encoded as it may have been originally
                delete resultHeaders["content-encoding"];
                delete resultHeaders["content-length"];
                stringify_1.verbose(`request headers:\n${JSON.stringify(requestHeaders)}`);
                stringify_1.verbose(`response headers:\n${JSON.stringify(resultHeaders)}`);
                if (true) {
                    // Website you wish to allow to connect
                    res.setHeader("Access-Control-Allow-Origin", resultHeaders.origin || "*");
                    // Request headers you wish to allow
                    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
                }
                res.writeHead(result.statusCode, result.statusMessage, resultHeaders);
                const originalBody = result.body;
                const processedBody = this.runProcessors(proxyInfo, originalBody);
                const responseData = asBody(processedBody);
                if (processedBody != responseData) {
                    stringify_1.verbose("RESPONSE BODY DATA\n", responseData);
                }
                res.write(responseData);
                res.end();
                return;
            }
        }
        try {
            delete requestHeaders["user-agent"];
            delete requestHeaders.host;
            delete requestHeaders.connection;
            requestHeaders["accept-encoding"] = ""; // prevents gzip errors
            requestHeaders["accept-content-encoding"] = ""; // prevents gzip errors
            requestHeaders["cache-control"] = "no-cache, no-store, must-revalidate"; // prevent 304 (maybe?)
            stringify_1.verbose(`outbound request headers: ${JSON.stringify(requestHeaders)}`);
            let result = await got.get(proxyInfo.url, {
                rejectUnauthorized: false,
                method: req.method,
                headers: requestHeaders,
            });
            let resultHeaders = lowercase_1.lowercase(result.headers);
            stringify_1.verbose(`inbound response headers: ${JSON.stringify(resultHeaders)}`);
            let outboundHeader = {
                "access-control-allow-credentials": "true",
                "access-control-allow-origin": origin || "*",
                "access-control-allow-methods": req.method,
                "access-control-allow-headers": resultHeaders["access-control-allow-headers"] || "*",
                "content-type": resultHeaders["content-type"] || "reverse-proxy/unknown",
            };
            stringify_1.verbose(`outbound response headers: ${JSON.stringify(outboundHeader, null, " ")}`);
            res.writeHead(result.statusCode || 200, outboundHeader);
            let processedBody = this.runProcessors(proxyInfo, result.body);
            res.write(asBody(processedBody));
            res.end();
            if (proxyInfo.writeToCache) {
                this.cache.add(cacheKey, stringify_1.stringify({
                    statusCode: result.statusCode,
                    statusMessage: result.statusMessage,
                    headers: lowercase_1.lowercase(resultHeaders),
                    body: result.body,
                }));
            }
        }
        catch (ex) {
            console.error("failure to invoke", ex);
            this.failure(ex, res);
        }
    }
    runProcessors(proxyInfo, body) {
        let finalBody = body;
        if (!!proxyInfo.processors) {
            proxyInfo.processors.forEach((processor) => {
                if (!processor.processResponse)
                    return;
                stringify_1.verbose(`RUNNING PROCESSOR ${processor.name}`);
                finalBody = processor.processResponse(proxyInfo.url, finalBody, {
                    proxyPass: proxyInfo.proxyPass,
                });
                if (body != finalBody) {
                    body = finalBody;
                    stringify_1.verbose(`Processor ${processor.name} modified body\n: ${body}`);
                }
            });
        }
        return finalBody;
    }
    failure(ex, res) {
        res.writeHead(500, {
            "content-type": "text/plain",
            body: ex,
        });
        res.end();
    }
    async invokePost(url, req, res) {
        console.assert(req.method === "POST");
        let cacheKey = {
            url: url.key || url.url || req.url || "",
            method: req.method,
            request: "",
        };
        return new Promise((good, bad) => {
            // collect the request body
            req
                .on("error", (err) => {
                stringify_1.verbose("invokePost.error");
                bad(err);
            })
                .on("data", (chunk) => {
                stringify_1.verbose("invokePost.data");
                cacheKey.request += chunk;
            })
                // check the cache, invoke if missing
                .on("end", async () => {
                stringify_1.verbose("invokePost.end");
                try {
                    if (url.readFromCache) {
                        let cachedata = await this.cache.exists(stringify_1.stringify(cacheKey));
                        // found in cache, response with cached data
                        if (!!cachedata) {
                            let value = stringify_1.unstringify(cachedata);
                            res.writeHead(value.statusCode || 200, value.statusMessage, value.headers);
                            value.body = this.runProcessors(url, value.body);
                            res.write(value.body);
                            res.end();
                            good(value.body);
                            return;
                        }
                    }
                    // invoke actual service, cache the response
                    const reqHeader = lowercase_1.lowercase(req.headers);
                    const reqData = cacheKey.request; // query string format
                    let value = await got.post(url.url, {
                        rejectUnauthorized: false,
                        body: reqData,
                        headers: {
                            "content-type": reqHeader["content-type"] || "plain-text",
                            "content-length": reqHeader["content-length"] || reqData.length,
                        },
                    });
                    let valueHeaders = lowercase_1.lowercase(value.headers);
                    res.writeHead(value.statusCode || 200, value.statusMessage, valueHeaders);
                    value.body = this.runProcessors(url, value.body);
                    res.write(value.body);
                    res.end();
                    if (url.writeToCache) {
                        this.cache.add(stringify_1.stringify(cacheKey), stringify_1.stringify({
                            statusCode: value.statusCode,
                            statusMessage: value.statusMessage,
                            body: value.body,
                            headers: valueHeaders,
                        }));
                    }
                    good(value.body);
                    return;
                }
                catch (ex) {
                    stringify_1.verbose("failed to proxy POST request: ", ex);
                    res.end();
                    bad(ex);
                }
            });
        });
    }
}
exports.Http = Http;
//# sourceMappingURL=http.js.map