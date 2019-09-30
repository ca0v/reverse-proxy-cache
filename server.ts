require("dotenv").config();
import * as http from "http";
import { Db } from "./server/db";
import { IConfig } from "./server/IConfig";
import { verbose } from "./server/stringify";
import { Proxy } from "./server/proxy";
import { Http } from "./server/http";

function run(config: IConfig) {

  if (!config["reverse-proxy-cache"]) throw "missing configuration: reverse-proxy-cache not found";
  if (!config["reverse-proxy-cache"].port) throw "missing configuration: reverse-proxy-cache/port not found";
  if (!config["reverse-proxy-cache"]["reverse-proxy-db"]) throw "missing configuration: reverse-proxy-cache/reverse-proxy-db not found";
  if (!config["reverse-proxy-cache"]["proxy-pass"]) throw "missing configuration: reverse-proxy-cache/proxy-pass not found";

  Db.init(config)
    .catch(err => console.error(err))
    .then(cache => {
      if (!cache) throw "db failed to return a database connection";
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
    });

}

export = run;
