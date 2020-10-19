import * as fs from "fs";
import * as http from "http";
import { Db } from "./server/db";
import {
  IConfig,
  ReverseProxyCache as ReverseProxyCacheConfig,
} from "./server/contracts";
import { verbose as dump } from "./server/fun/stringify";
import { Proxy } from "./server/proxy";
import { Http } from "./server/http";
import * as url from "url";
import { parseArgs } from "./parseArgs";

function sort(o: any): any {
  if (null === o) return o;
  if (undefined === o) return o;
  if (typeof o !== "object") return o;
  if (Array.isArray(o)) {
    return o.map((item) => sort(item));
  }
  const keys = Object.keys(o).sort();
  const result = <any>{};
  keys.forEach((k) => (result[k] = sort(o[k])));
  return result;
}

export class Server {
  private server: http.Server | null = null;
  private cache: Db | null = null;
  private config: ReverseProxyCacheConfig;

  constructor(config: IConfig) {
    if (!config["reverse-proxy-cache"])
      throw "missing configuration: reverse-proxy-cache not found";
    if (!config["reverse-proxy-cache"].port)
      throw "missing configuration: reverse-proxy-cache/port not found";
    if (!config["reverse-proxy-cache"]["reverse-proxy-db"])
      throw "missing configuration: reverse-proxy-cache/reverse-proxy-db not found";
    if (!config["reverse-proxy-cache"]["proxy-pass"])
      throw "missing configuration: reverse-proxy-cache/proxy-pass not found";
    this.config = config["reverse-proxy-cache"];
  }

  private verbose(...args: string[]) {
    if (!this.config.verbose) return;
    dump(...args);
  }

  async start() {
    let config = this.config;

    const cache = await Db.init(config);
    this.cache = cache;
    if (!cache) throw "db failed to return a database connection";
    let proxy = new Proxy(config);
    let helper = new Http(cache);
    this.server = http.createServer(async (req, res) => {
      if (this.allowIntercepts(req, res)) return;
      let url = req.url || "";
      let proxyurl = proxy.proxy(url);
      if (proxyurl.url === url) {
        res.writeHead(500, { "content-type": "text/plain" });
        res.write("no configuration found for this endpoint");
        res.end();
        return;
      }
      this.verbose(`proxyurl: ${req.method} ${proxyurl.url}`);
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
            res.writeHead(500, `unsupported method: ${req.method}`, {
              "content-type": "text/plain",
            });
            res.end();
            break;
        }
      } catch (ex) {
        this.verbose(`${req.method} request failed for ${proxyurl}:\n`, ex);
        res.writeHead(500, `${(ex + "").substring(0, 16)}`, {
          "content-type": "text/plain",
          body: ex,
        });
        res.end();
        return;
      }
    });
    let port = config.port;
    this.server.listen(port);
    this.verbose(`listening on ${port}`);
    return this;
  }

  allowIntercepts(req: http.IncomingMessage, res: http.ServerResponse) {
    const urlStr = req.url || "";
    const { query, pathname } = url.parse(urlStr, true);
    console.log("here", pathname, query, req.method);
    if (req.method !== "GET") return false;
    if (pathname !== "/system") return false;
    if (query.delete) {
      this.cache!.delete(<string>query.delete)
        .catch((err) => {
          console.log(err);
          res.write(JSON.stringify(err));
          res.end();
        })
        .then(() => {
          console.log("ok");
          res.write(`deleting where status code is ${query.delete}`);
          res.end();
        });
      return true;
    }
    return false;
  }

  stop() {
    if (this.server) this.server.close();
    if (this.cache) this.cache.close();
  }
}

interface Dictionary<T> {
  [index: string]: T;
}

function addHandler(
  switchName: string,
  gatewayFile: string,
  externalUri: string,
  internalName: string
) {
  if ("--add" !== switchName) throw "invalid switch";
  if (!gatewayFile)
    throw `you must specify a target package.json files as the 1st argument`;
  if (!externalUri)
    throw "you must specify the external uri as the second argument";
  if (!internalName)
    throw "you must specify an internal identifier as the third argument";
  if (!fs.existsSync(gatewayFile)) throw `file not found: ${gatewayFile}`;
  const config = JSON.parse(fs.readFileSync(gatewayFile) + "") as IConfig;
  const cache = (config["reverse-proxy-cache"] = config[
    "reverse-proxy-cache"
  ] || {
    port: 3002,
    verbose: false,
    "reverse-proxy-db": "reverse-proxy.sqlite",
  });
  const pass = (cache["proxy-pass"] = cache["proxy-pass"] || []);
  const baseUri = `/proxy/${internalName}`;
  const originalBase = pass.find((p) => p.baseUri === baseUri);
  const base = originalBase || {
    about: "",
    baseUri: "",
    proxyUri: "",
  };
  base.baseUri = baseUri;
  base.proxyUri = externalUri;
  base.about = base.about || internalName;
  if (!originalBase) pass.unshift(base);
  pass.sort((a, b) => a.baseUri.localeCompare(b.baseUri));
  pass.forEach((p) => (p.about = p.about || "this proxy is used to..."));
  cache["proxy-pass"] = sort(cache["proxy-pass"]);
  fs.writeFileSync(gatewayFile, JSON.stringify(config, null, 2));
}

function deleteHandler(
  switchName: string,
  gatewayFile: string,
  fromCacheWhereResLike: string
) {
  if ("--delete" !== switchName) throw "invalid switch";
  if (!gatewayFile)
    throw `you must specify a target package.json files as the 1st argument`;
}

function initHandler(switchName: string, gatewayFile?: string) {
  if ("--init" !== switchName) throw "invalid switch";
  gatewayFile = gatewayFile || "package.json";
  addHandler("--add", gatewayFile, "https://www.arcgis.com", "arcgis");
  addHandler(
    "--add",
    gatewayFile,
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer",
    "agol/ArcGIS/rest/services/World_Street_Map/MapServer"
  );
}

const handlers: Dictionary<(...args: string[]) => void> = {
  init: initHandler,
  add: addHandler,
  delete: deleteHandler,
};

export async function run(args: string[] | IConfig) {
  if (Array.isArray(args)) {
    const parsedArgs = parseArgs(args);
    if (parsedArgs) return;
    let primarySwitch = args[0];
    if (primarySwitch?.startsWith("--")) {
      const handlerName = primarySwitch.substring(2);
      const handler = handlers[handlerName];
      if (!handler) throw `no handler found for ${handlerName}`;
      return handler(...args);
    } else {
      // default handler
      const gatewayFile = primarySwitch || "package.json";
      if (!fs.existsSync(gatewayFile)) throw "file not found: " + gatewayFile;
      const config = JSON.parse(fs.readFileSync(gatewayFile) + "") as IConfig;
      return new Server(config).start();
    }
  } else {
    return new Server(args).start();
  }
}
