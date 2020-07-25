import http, { OutgoingHttpHeaders } from "http";
import { IDb } from "./db";
import { stringify, unstringify, verbose } from "./fun/stringify";
import { ProxyInfo } from "./proxy";
import { lowercase } from "./fun/lowercase";
import { HttpsGet } from "./fun/http-get";

let got = new HttpsGet();

function asBody(data: string | Array<number>) {
    return typeof data === "string" ? data : Buffer.from(data);
}

export class Http {
    constructor(private cache: IDb) {}

    public async invokeDelete(
        url: ProxyInfo,
        req: http.IncomingMessage,
        res: http.ServerResponse
    ) {
        console.assert(req.method === "DELETE");
        return this.invoke(url, req, res);
    }

    public async invokeOptions(
        url: ProxyInfo,
        req: http.IncomingMessage,
        res: http.ServerResponse
    ) {
        console.assert(req.method === "OPTIONS");
        return this.invoke(url, req, res);
    }

    public async invokeGet(
        url: ProxyInfo,
        req: http.IncomingMessage,
        res: http.ServerResponse
    ) {
        console.assert(req.method === "GET");
        return this.invoke(url, req, res);
    }

    public async invokePut(
        url: ProxyInfo,
        req: http.IncomingMessage,
        res: http.ServerResponse
    ) {
        console.assert(req.method === "PUT");
        return this.invoke(url, req, res);
    }

    private async invoke(
        proxyInfo: ProxyInfo,
        req: http.IncomingMessage,
        res: http.ServerResponse
    ) {
        verbose("invoke proxy info: ", proxyInfo);
        let cacheKey = stringify({
            method: req.method,
            url: proxyInfo.key || proxyInfo.url || req.url || "",
        });

        let requestHeaders = lowercase(req.headers);
        verbose(`inbound request headers: ${JSON.stringify(requestHeaders)}`);

        let origin = <string>requestHeaders.origin;
        let host = <string>requestHeaders.host;

        if (proxyInfo["read-from-cache"]) {
            let cachedata = await this.cache.exists(cacheKey);
            if (!!cachedata) {
                let result = unstringify(cachedata) as {
                    statusCode: number;
                    statusMessage: string;
                    headers: OutgoingHttpHeaders;
                    body: string | Array<number>;
                };

                const resultHeaders = <OutgoingHttpHeaders>(
                    lowercase(result.headers)
                );

                resultHeaders["access-control-allow-credentials"] = "true";
                resultHeaders["access-control-allow-origin"] =
                    origin || host || "*";
                resultHeaders["access-control-allow-methods"] = req.method;

                // it is not encoded as it may have been originally
                delete resultHeaders["content-encoding"];
                delete resultHeaders["content-length"];

                verbose(`request headers:\n${JSON.stringify(requestHeaders)}`);
                verbose(`response headers:\n${JSON.stringify(resultHeaders)}`);
                res.writeHead(
                    result.statusCode,
                    result.statusMessage,
                    resultHeaders
                );

                if (!!proxyInfo.processors) {
                    proxyInfo.processors.forEach(
                        (processor) =>
                            (result.body = processor.processResponse(
                                proxyInfo.url,
                                result.body,
                                { proxyInfo }
                            ))
                    );
                }

                res.write(asBody(result.body));
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
            requestHeaders["cache-control"] =
                "no-cache, no-store, must-revalidate"; // prevent 304 (maybe?)

            verbose(
                `outbound request headers: ${JSON.stringify(requestHeaders)}`
            );

            let result = await got.get(proxyInfo.url, {
                rejectUnauthorized: false,
                method: req.method,
                headers: requestHeaders,
            });

            let resultHeaders = lowercase(result.headers);
            verbose(
                `inbound response headers: ${JSON.stringify(resultHeaders)}`
            );

            let outboundHeader = {
                "access-control-allow-credentials": "true",
                "access-control-allow-origin": origin || "*",
                "access-control-allow-methods": req.method,
                "access-control-allow-headers":
                    resultHeaders["access-control-allow-headers"] || "*",
            };

            verbose(
                `outbound response headers: ${JSON.stringify(
                    outboundHeader,
                    null,
                    " "
                )}`
            );
            res.writeHead(result.statusCode || 200, outboundHeader);

            let processedBody = result.body;
            if (!!proxyInfo.processors) {
                proxyInfo.processors.forEach(
                    (processor) =>
                        (processedBody = processor.processResponse(
                            proxyInfo.url,
                            processedBody,
                            { proxyInfo }
                        ))
                );
            }

            res.write(asBody(processedBody));
            res.end();

            if (proxyInfo["write-to-cache"]) {
                this.cache.add(
                    cacheKey,
                    stringify({
                        statusCode: result.statusCode,
                        statusMessage: result.statusMessage,
                        headers: lowercase(resultHeaders),
                        body: result.body,
                    })
                );
            }
        } catch (ex) {
            console.error("failure to invoke", ex);
            this.failure(ex, res);
        }
    }
    private failure(ex: any, res: http.ServerResponse) {
        res.writeHead(500, {
            "content-type": "text/plain",
            body: ex,
        });
        res.end();
    }

    public async invokePost(
        url: ProxyInfo,
        req: http.IncomingMessage,
        res: http.ServerResponse
    ) {
        console.assert(req.method === "POST");
        let cacheKey = {
            url: url.key || url.url || req.url || "",
            method: req.method,
            request: "",
        };
        return new Promise((good, bad) => {
            // collect the request body
            req.on("error", (err) => {
                verbose("invokePost.error");
                bad(err);
            })
                .on("data", (chunk) => {
                    verbose("invokePost.data");
                    cacheKey.request += chunk;
                })
                // check the cache, invoke if missing
                .on("end", async () => {
                    verbose("invokePost.end");
                    try {
                        if (url["read-from-cache"]) {
                            let cachedata = await this.cache.exists(
                                stringify(cacheKey)
                            );
                            // found in cache, response with cached data
                            if (!!cachedata) {
                                let value = unstringify(cachedata) as {
                                    statusCode: number;
                                    statusMessage: string;
                                    headers: OutgoingHttpHeaders;
                                    body: string;
                                };
                                res.writeHead(
                                    value.statusCode || 200,
                                    value.statusMessage,
                                    value.headers
                                );
                                res.write(value.body);
                                res.end();
                                good(value.body);
                                return;
                            }
                        }
                        // invoke actual service, cache the response
                        const reqHeader = lowercase(req.headers);
                        const reqData = cacheKey.request; // query string format
                        let value = await got.post(url.url, {
                            rejectUnauthorized: false,
                            body: reqData,
                            headers: {
                                "content-type":
                                    reqHeader["content-type"] || "plain-text",
                                "content-length":
                                    reqHeader["content-length"] ||
                                    reqData.length,
                            },
                        });

                        let valueHeaders = lowercase(value.headers);
                        res.writeHead(
                            value.statusCode || 200,
                            value.statusMessage,
                            valueHeaders
                        );
                        res.write(value.body);
                        res.end();

                        if (url["write-to-cache"]) {
                            this.cache.add(
                                stringify(cacheKey),
                                stringify({
                                    statusCode: value.statusCode,
                                    statusMessage: value.statusMessage,
                                    body: value.body,
                                    headers: valueHeaders,
                                })
                            );
                        }

                        good(value.body);
                        return;
                    } catch (ex) {
                        verbose("failed to proxy POST request: ", ex);
                        res.end();
                        bad(ex);
                    }
                });
        });
    }
}
