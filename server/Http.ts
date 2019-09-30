import * as got from "got";
import http, { OutgoingHttpHeaders } from "http";
import { Db } from "./db";
import { stringify, unstringify } from "./stringify";
import { Proxy, ProxyInfo } from "./proxy";

export class Http {
  constructor(private cache: Db, private proxy: Proxy) {
  }

  public async invokeDelete(url: ProxyInfo, req: http.IncomingMessage, res: http.ServerResponse) {
    console.assert(req.method === "DELETE");
    return this.invoke(url, req, res);
  }

  public async invokeOptions(url: ProxyInfo, req: http.IncomingMessage, res: http.ServerResponse) {
    console.assert(req.method === "OPTIONS");
    return this.invoke(url, req, res);
  }

  public async invokeGet(url: ProxyInfo, req: http.IncomingMessage, res: http.ServerResponse) {
    console.assert(req.method === "GET");
    return this.invoke(url, req, res);
  }

  public async invokePut(url: ProxyInfo, req: http.IncomingMessage, res: http.ServerResponse) {
    console.assert(req.method === "PUT");
    return this.invoke(url, req, res);
  }

  private async invoke(proxyInfo: ProxyInfo, req: http.IncomingMessage, res: http.ServerResponse) {
    let cacheKey = stringify({
      method: req.method,
      url: proxyInfo.key || proxyInfo.url || req.url || ""
    });
    let cachedata = await this.cache.exists(cacheKey);
    if (!!cachedata) {
      let result = unstringify(cachedata) as {
        statusCode: number;
        statusMessage: string;
        headers: OutgoingHttpHeaders;
        body: string;
      };
      if (!!proxyInfo.processors) {
        proxyInfo.processors.forEach(processor => result.body = processor.processResponse(proxyInfo.url, result.body));
      }
      result.headers['Access-Control-Allow-Credentials'] = "true";
      result.headers['Access-Control-Allow-Origin'] = "*";
      result.headers['Access-Control-Allow-Methods'] = req.method;
      console.log("headers", req.headers, result.headers);
      res.writeHead(result.statusCode, result.statusMessage, result.headers);
      res.write(result.body);
      res.end();
      return;
    }
    try {
      let result = await got(proxyInfo.url, {
        method: req.method,
        rejectUnauthorized: false
      });
      let headers = {
        "content-type": result.headers["content-type"],
        'Access-Control-Allow-Credentials': "true",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'application/json'
      };
      res.writeHead(result.statusCode || 200, headers);
      res.write(result.body);
      res.end();
      this.cache.add(cacheKey, stringify({
        statusCode: result.statusCode,
        statusMessage: result.statusMessage,
        headers: headers,
        body: result.body
      }));
    }
    catch (ex) {
      this.failure(ex, res);
    }
  }
  private failure(ex: any, res: http.ServerResponse) {
    console.error("FAILURE!", ex);
    res.writeHead(500, { "content-type": "text/plain" });
    res.end();
  }

  public async invokePost(url: ProxyInfo, req: http.IncomingMessage, res: http.ServerResponse) {
    console.assert(req.method === "POST");
    let cacheKey = {
      url: req.url,
      method: req.method,
      request: ""
    };
    // collect the request body
    req.on("data", chunk => cacheKey.request += chunk);
    // check the cache, invoke if missing
    req.on("end", async () => {
      let cachedata = await this.cache.exists(stringify(cacheKey));
      // found in cache, response with cached data
      if (!!cachedata) {
        let value = unstringify(cachedata) as {
          statusCode: number;
          statusMessage: string;
          headers: OutgoingHttpHeaders;
          body: string;
        };
        res.writeHead(value.statusCode || 200, value.statusMessage, value.headers);
        res.write(value.body);
        res.end();
        return;
      }
      // invoke actual service, cache the response
      let value = await got.post(url.url, {
        rejectUnauthorized: false,
        body: cacheKey.request
      });
      let headers = {
        "content-type": value.headers["content-type"]
      };
      res.writeHead(value.statusCode || 200, value.statusMessage, headers);
      res.write(value.body);
      res.end();
      this.cache.add(stringify(cacheKey), stringify({
        statusCode: value.statusCode,
        statusMessage: value.statusMessage,
        body: value.body,
        headers: headers
      }));
    });
  }
}
