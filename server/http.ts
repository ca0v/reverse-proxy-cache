import {
  IncomingHttpHeaders,
  IncomingMessage,
  ServerResponse,
  OutgoingHttpHeaders,
} from "http";
import { IDb } from "./db.js";
import { stringify, unstringify, verbose } from "./fun/stringify.js";
import { lowercase } from "./fun/lowercase.js";
import { HttpsGet } from "./fun/http-get.js";
import { ProxyInfo } from "./contracts.js";
import { setHeaders } from "./setHeaders.js";
import { dumpHeaders } from "#@app/test/dumpHeaders.js";

let got = new HttpsGet();

function asBody(data: string | Array<number>) {
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return Buffer.from(data);
  verbose("UNKNOWN BODY TYPE");
  if (typeof data === "object") return JSON.stringify(data);
}

export class Http {
  constructor(private cache: IDb) { }

  public async invokeDelete(
    url: ProxyInfo,
    req: IncomingMessage,
    res: ServerResponse
  ) {
    console.assert(req.method === "DELETE");
    return this.invoke(url, req, res);
  }

  public async invokeOptions(
    url: ProxyInfo,
    req: IncomingMessage,
    res: ServerResponse
  ) {
    console.assert(req.method === "OPTIONS");
    return this.invoke(url, req, res);
  }

  public async invokeGet(
    url: ProxyInfo,
    req: IncomingMessage,
    res: ServerResponse
  ) {
    console.assert(req.method === "GET");
    return this.invoke(url, req, res);
  }

  public async invokePut(
    url: ProxyInfo,
    req: IncomingMessage,
    res: ServerResponse
  ) {
    console.assert(req.method === "PUT");
    return this.invoke(url, req, res);
  }

  private async invoke(
    proxyInfo: ProxyInfo,
    req: IncomingMessage,
    res: ServerResponse
  ) {
    verbose("invoke proxy info: ", proxyInfo);
    let cacheKey = stringify({
      method: req.method,
      url: proxyInfo.key || proxyInfo.url || req.url || "",
    });

    let requestHeaders = lowercase(req.headers);
    verbose(`inbound request headers`);
    dumpHeaders(requestHeaders);

    if (proxyInfo.readFromCache) {
      let cachedata = await this.cache.exists(cacheKey);
      if (!!cachedata) {
        let result = unstringify(cachedata) as {
          statusCode: number;
          statusMessage: string;
          headers: OutgoingHttpHeaders;
          body: string | Array<number>;
        };

        const resultHeaders = <OutgoingHttpHeaders>lowercase(result.headers);

        verbose(`request headers`);
        dumpHeaders(requestHeaders);

        verbose(`cached response headers`);
        dumpHeaders(resultHeaders);

        setHeaders(resultHeaders, {
          "Content-Type": (<string>resultHeaders["content-type"]) || "text",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Origin": req.headers.origin || req.headers.referer || "localhost",
          "Access-Control-Allow-Methods": <string>req.method,
          "Access-Control-Allow-Headers": "Content-Type,Access-Control-Allow-Origin,Access-Control-Allow-Methods,Access-Control-Allow-Credentials"
        });

        verbose("\n\n\n");
        dumpHeaders(resultHeaders);
        verbose("\n\n\n");

        resultHeaders["Access-Control-Allow-Origin"] = "*";
        res.writeHead(result.statusCode, resultHeaders);

        const originalBody = result.body;
        const processedBody = this.runProcessors(proxyInfo, originalBody);
        const responseData = asBody(processedBody);
        if (processedBody != responseData) {
          verbose("RESPONSE BODY DATA\n", responseData);
        }
        res.write(responseData);
        res.end();
        return;
      }
    }

    if (true === proxyInfo.offline) {
      res.statusCode = 404;
      res.statusMessage = "offline";
      res.end();
      return;
    }

    try {
      delete requestHeaders["user-agent"];
      delete requestHeaders.host;
      delete requestHeaders.connection;
      requestHeaders["accept-encoding"] = ""; // prevents gzip errors
      requestHeaders["accept-content-encoding"] = ""; // prevents gzip errors
      requestHeaders["cache-control"] = "no-cache, no-store, must-revalidate"; // prevent 304 (maybe?)

      verbose(`outbound request headers: ${JSON.stringify(requestHeaders)}`);

      let result = await got.get(proxyInfo.url, {
        rejectUnauthorized: false,
        method: req.method,
        headers: requestHeaders,
      });

      let resultHeaders = lowercase(result.headers);

      verbose(`inbound response headers`);
      dumpHeaders(resultHeaders);

      let outboundHeader: IncomingHttpHeaders = {};
      setHeaders(outboundHeader, {
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": req.headers.origin || req.headers.referer || "localhost",
        "Access-Control-Allow-Methods": req.method || "GET",
        "Access-Control-Allow-Headers":
          resultHeaders["access-control-allow-headers"] || "",
        "Content-Type":
          resultHeaders["content-type"] || "reverse-proxy/unknown",
      });

      verbose(
        `outbound response headers: ${JSON.stringify(
          outboundHeader,
          null,
          " "
        )}`
      );
      res.writeHead(result.statusCode || 200, outboundHeader);

      let processedBody = this.runProcessors(proxyInfo, result.body);
      res.write(asBody(processedBody));
      res.end();

      if (proxyInfo.writeToCache) {
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

  private runProcessors(proxyInfo: ProxyInfo, body: string | number[]) {
    if (!proxyInfo?.processors) return body;
    let finalBody = body;
    proxyInfo.processors.forEach((processor) => {
      verbose(`RUNNING PROCESSOR ${processor.name}`);
      if (!processor.processResponse) return;
      verbose(`RUNNING processResponse`);
      finalBody = processor.processResponse(proxyInfo.url, finalBody, {
        proxyPass: proxyInfo.proxyPass!,
      });
      if (body != finalBody) {
        body = finalBody;
        verbose(`Processor ${processor.name} modified body\n: ${body}`);
      }
    });
    return finalBody;
  }

  private failure(ex: any, res: ServerResponse) {
    res.writeHead(500, {
      "content-type": "text/plain",
      body: ex,
    });
    res.end();
  }

  public async invokePost(
    url: ProxyInfo,
    req: IncomingMessage,
    res: ServerResponse
  ) {
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
            if (url.readFromCache) {
              let cachedata = await this.cache.exists(stringify(cacheKey));
              // found in cache, response with cached data
              if (!!cachedata) {
                let value = unstringify(cachedata) as {
                  statusCode: number;
                  statusMessage: string;
                  headers: OutgoingHttpHeaders;
                  body: string;
                };

                // the value.headers are probably stale, should probably attempt to heal them
                setHeaders(value.headers, {
                  "Content-Type": <string>(value.headers["content-type"]) || "",
                  "Access-Control-Allow-Credentials": "true",
                  "Access-Control-Allow-Origin": req.headers.origin || req.headers.referer || "localhost",
                  "Access-Control-Allow-Methods": req.method || "OPTIONS,POST",
                  "Access-Control-Allow-Headers": ""
                });

                verbose(
                  `outbound response headers: ${JSON.stringify(
                    value.headers,
                    null,
                    " "
                  )}`
                );

                res.statusMessage = value.statusMessage;
                res.writeHead(
                  value.statusCode || 200,
                  value.headers
                );

                value.body = this.runProcessors(url, value.body) as string;
                res.write(value.body);
                res.end();
                good(value.body);
                return;
              }
            }

            if (true === url.offline) {
              throw "offline";
            }

            // invoke actual service, cache the response
            const reqHeader = lowercase(req.headers);
            const reqData = cacheKey.request; // query string format
            let value = await got.post(url.url, {
              rejectUnauthorized: false,
              body: reqData,
              headers: {
                "content-type": reqHeader["content-type"] || "plain-text",
                "content-length": reqHeader["content-length"] || reqData.length,
              },
            });

            let valueHeaders = lowercase(value.headers);
            res.statusMessage = value.statusMessage;
            res.writeHead(value.statusCode || 200, valueHeaders);

            value.body = this.runProcessors(url, value.body) as string;
            res.write(value.body);
            res.end();

            if (url.writeToCache) {
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

