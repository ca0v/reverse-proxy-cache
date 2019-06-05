require("dotenv").config();
import got from "got";
import http, { OutgoingHttpHeaders } from "http";
import sqlite3 from "sqlite3";
import config from "./serverconfig";

const args = process.argv.slice(2);
const port = args[0] || process.env.PORT || "9000";

const stringify = (v: Object) => JSON.stringify(v, null, 2);
const unstringify = (v: string) => JSON.parse(v);

class Db {
  private db: sqlite3.Database;
  constructor(fileName = ":memory:") {
    let db = (this.db = new sqlite3.Database(fileName));
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
  constructor() {
    // nothing to do
  }

  proxy(url: string) {
    let match = config["reverse-proxy"].find(v => url.startsWith(v.baseUri));
    if (!match) return url;
    return url.replace(match.baseUri, match.proxyUri);
  }
}

function run(args?: { port: string }) {
  args = args || { port: port };
  args.port = args.port || port;
  let cache = new Db(config.cacheName);
  let proxy = new Proxy();

  let server = http.createServer(async (req, res) => {
    let url = req.url || "";

    if (req.method !== "GET") {
      res.writeHead(500, { "content-type": "text/plain" });
      res.write(`unsupported method: ${req.method}`);
      res.end();
      return;
    }

    let exists = await cache.exists(url);
    if (!!exists) {
      let result = unstringify(exists) as { statusCode: number; headers: OutgoingHttpHeaders; body: string };
      res.writeHead(result.statusCode, result.headers);
      res.write(result.body);
      res.end();
      return;
    }

    let proxyurl = proxy.proxy(url);
    if (proxyurl === url) {
      res.writeHead(500, { "content-type": "text/plain" });
      res.write("no configuration found for this endpoint");
      res.end();
      return;
    }

    {
      let result = await got(proxyurl, {
        rejectUnauthorized: false
      });

      let headers = {
        "content-type": result.headers["content-type"]
      };

      res.writeHead(result.statusCode || 200, headers);
      res.write(result.body);
      res.end();

      cache.add(
        url,
        stringify({
          statusCode: result.statusCode,
          headers: headers,
          body: result.body
        })
      );
    }
  });

  server.listen(args.port);
  console.log(`listening on ${args.port}`);
}

export = run;
