import * as defaultProcessor from "./cache-processor/ignore-callback-querystring";
type Processor = typeof defaultProcessor;

require("dotenv").config();
import got from "got";
import http, { OutgoingHttpHeaders } from "http";
import sqlite3 from "sqlite3";

const stringify = (v: Object) => JSON.stringify(v, null, 2);
const unstringify = (v: string) => JSON.parse(v);
const verbose = (...v: string[]) => console.log(...v);

// shape of the configuration (defaults to package.json)
interface IConfig {
  "reverse-proxy-cache": {
    "port": string;
    "reverse-proxy-db": string;
    "proxy-pass": Array<{
      "about": string;
      baseUri: string;
      proxyUri: string;
      "cache-processor": string;
    }>
  }
}

type ProxyInfo = {
  url: string;
  key?: string;
  processors?: Processor[]
}

class Db {
  private db: sqlite3.Database;

  constructor(config: IConfig) {
    let dbFile = config["reverse-proxy-cache"]["reverse-proxy-db"];
    verbose(`loading ${dbFile}`);
    let db = (this.db = new sqlite3.Database(dbFile));
    db.run(
      "CREATE TABLE cache (url TEXT, res TEXT)",
      () => { },
      err => {
        console.warn(err);
      }
    );
  }

  async exists(url: string) {
    let cmd = this.db.prepare("SELECT res FROM cache WHERE url=?");
    let p = new Promise<string | null>((resolve, reject) => {
      cmd.get(url, (err, row) => {
        err ? reject(err) : resolve(row && row.res);
        verbose(row ? "hit" : "miss");
      });
    });
    return p;
  }

  add(url: string, res: string) {
    verbose("add");
    let cmd = this.db.prepare("INSERT INTO cache VALUES (?, ?)");
    let p = new Promise((resolve, reject) => {
      cmd.run(url, res, (err: string) => {
        err ? reject(err) : resolve();
      });
    });
    return p;
  }
}


class Proxy {
  constructor(private config: IConfig) {
    // nothing to do
  }

  proxy(url: string): ProxyInfo {
    let match = this.config["reverse-proxy-cache"]["proxy-pass"].find(v => url.startsWith(v.baseUri));
    if (!match) return { url };
    let actualUrl = url.replace(match.baseUri, match.proxyUri);
    let cacheKey = actualUrl;
    if (match["cache-processor"]) {
      let processors = match["cache-processor"].split(",").map(mid => {
        let processor: Processor = require(`./cache-processor/${mid}`);
        cacheKey = processor.computeCacheKey(cacheKey);
        return processor;
      });
      return {
        url: actualUrl,
        key: cacheKey,
        processors: processors
      };
    }
    return {
      url: actualUrl,
      key: cacheKey,
    };
  }
}

class Http {
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

      this.cache.add(
        cacheKey,
        stringify({
          statusCode: result.statusCode,
          statusMessage: result.statusMessage,
          headers: headers,
          body: result.body
        })
      );
    } catch (ex) {
      this.failure(ex, res);
    }

  }

  failure(ex: any, res: http.ServerResponse) {
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
    }
    // collect the request body
    req.on("data", chunk => cacheKey.request += chunk);

    // check the cache, invoke if missing
    req.on("end", async () => {
      let cachedata = await this.cache.exists(stringify(cacheKey));
      // found in cache, response with cached data
      if (!!cachedata) {
        let value = unstringify(cachedata) as { statusCode: number; statusMessage: string, headers: OutgoingHttpHeaders; body: string };
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
      }))
    });

  }
}


function run(config: IConfig) {

  if (!config["reverse-proxy-cache"]) throw "missing configuration: reverse-proxy-cache not found";
  if (!config["reverse-proxy-cache"].port) throw "missing configuration: reverse-proxy-cache/port not found";
  if (!config["reverse-proxy-cache"]["reverse-proxy-db"]) throw "missing configuration: reverse-proxy-cache/reverse-proxy-db not found";
  if (!config["reverse-proxy-cache"]["proxy-pass"]) throw "missing configuration: reverse-proxy-cache/proxy-pass not found";

  let cache = new Db(config);
  let proxy = new Proxy(config);
  let helper = new Http(cache, proxy);

  let server = http.createServer(async (req, res) => {

    let url = req.url || "";
    let proxyurl = proxy.proxy(url);
    if (proxyurl.url === url) {
      res.writeHead(500, { "content-type": "text/plain" });
      res.write("no configuration found for this endpoint");
      res.end();
      return;
    }

    verbose(proxyurl.url);

    try {
      switch (req.method) {
        case "DELETE":
          helper.invokeDelete(proxyurl, req, res);
          break;
        case "GET":
          helper.invokeGet(proxyurl, req, res);
          break;
        case "OPTIONS":
          helper.invokeOptions(proxyurl, req, res);
          break;
        case "POST":
          helper.invokePost(proxyurl, req, res);
          break;
        case "PUT":
          helper.invokePut(proxyurl, req, res);
          break;
        default:
          res.writeHead(500, `unsupported method: ${req.method}`, { "content-type": "text/plain" });
          res.end();
          break;
      }
    } catch (ex) {
      console.error(ex);
      res.writeHead(500, `${(ex + "").substring(0, 16)}`, { "content-type": "text/plain" });
      res.end();
    }

  });

  let port = config["reverse-proxy-cache"].port;
  server.listen(port);
  verbose(`listening on ${port}`);
}

export = run;
