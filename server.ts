require("dotenv").config();
import got from "got";
import http, { OutgoingHttpHeaders } from "http";
import sqlite3 from "sqlite3";

const stringify = (v: Object) => JSON.stringify(v, null, 2);
const unstringify = (v: string) => JSON.parse(v);

// shape of the configuration (defaults to package.json)
interface IConfig {
  "reverse-proxy-cache": {
    "port": string;
    "reverse-proxy-db": string;
    "proxy-pass": Array<{
      baseUri: string;
      proxyUri: string;
    }>
  }
}

class Db {
  private db: sqlite3.Database;

  constructor(config: IConfig) {
    let dbFile = config["reverse-proxy-cache"]["reverse-proxy-db"];
    console.log(`loading ${dbFile}`);
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
      });
    });
    return p;
  }

  add(url: string, res: string) {
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

  proxy(url: string) {
    let match = this.config["reverse-proxy-cache"]["proxy-pass"].find(v => url.startsWith(v.baseUri));
    if (!match) return url;
    return url.replace(match.baseUri, match.proxyUri);
  }
}

class Http {
  constructor(private cache: Db, private proxy: Proxy) {
  }

  public async invokeGet(url: string, req: http.IncomingMessage, res: http.ServerResponse) {
    console.assert(req.method === "GET");

    let exists = await this.cache.exists(req.url || "");
    if (!!exists) {
      let result = unstringify(exists) as { statusCode: number; headers: OutgoingHttpHeaders; body: string };
      res.writeHead(result.statusCode, result.headers);
      res.write(result.body);
      res.end();
      return;
    }

    {
      let result = await got(url, {
        rejectUnauthorized: false
      });

      let headers = {
        "content-type": result.headers["content-type"]
      };

      res.writeHead(result.statusCode || 200, headers);
      res.write(result.body);
      res.end();

      this.cache.add(
        req.url || "",
        stringify({
          statusCode: result.statusCode,
          headers: headers,
          body: result.body
        })
      );
    }

  }

  public async invokePost(url: string, req: http.IncomingMessage, res: http.ServerResponse) {
    console.assert(req.method === "POST");
    let key = {
      url: req.url,
      request: ""
    }
    // collect the request body
    req.on("data", chunk => key.request += chunk);

    // check the cache, invoke if missing
    req.on("end", async () => {
      console.log("request received", key.request);
      let cachedata = await this.cache.exists(stringify(key));
      // found in cache, response with cached data
      if (!!cachedata) {
        console.log("request found in cache", cachedata);
        return;
      }

      // invoke actual service, cache the response
      console.log("invoke actual service");
      got.post(url, {
        body: key.request
      }).then(value => {
        console.log("response received", value.statusCode, value.statusMessage, value.body, value.headers);
        res.writeHead(value.statusCode || 200, value.statusMessage, {
          "content-type": value.headers["content-type"]
        });
        res.write(value.body);
        res.end();
      });
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
    if (proxyurl === url) {
      res.writeHead(500, { "content-type": "text/plain" });
      res.write("no configuration found for this endpoint");
      res.end();
      return;
    }

    switch (req.method) {
      case "GET":
        helper.invokeGet(proxyurl, req, res);
        break;
      case "POST":
        helper.invokePost(proxyurl, req, res);
        break;
      default:
        res.writeHead(500, { "content-type": "text/plain" });
        res.write(`unsupported method: ${req.method}`);
        res.end();
        break;
    }

  });

  let port = config["reverse-proxy-cache"].port;
  server.listen(port);
  console.log(`listening on ${port}`);
}

export = run;
