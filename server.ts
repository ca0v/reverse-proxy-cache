import * as fs from "fs";
import * as http from "http";
import { Db } from "./server/db";
import {
  IConfig,
  ReverseProxyCache as ReverseProxyCacheConfig,
} from "./server/contracts";
import { verbose as dump, verbose } from "./server/fun/stringify";
import { Proxy } from "./server/proxy";
import { Http } from "./server/http";
import * as url from "url";
import { parseArgs } from "./parseArgs";
import { DeleteSystemPlugin } from "./DeleteSystemPlugin";
import { AddMockResponseSystemPlugin } from "./AddMockResponseSystemPlugin";
import { addHandler } from "./addHandler";
import { deleteHandler } from "./deleteHandler";
import { asConfig } from "./asConfig";

export function sort(o: any): any {
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
  public cache: Db | null = null;
  public proxy: Proxy | null = null;

  private server: http.Server | null = null;

  private config: ReverseProxyCacheConfig;
  private systemPlugins = [
    new DeleteSystemPlugin(this),
    new AddMockResponseSystemPlugin(this),
  ];

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
    const proxy = (this.proxy = new Proxy(config));
    const helper = new Http(cache);
    this.server = http.createServer(async (req, res) => {
      // let the plugins have a chance
      if (this.allowIntercepts(req, res)) return;
      const url = req.url || "";
      const proxyurl = proxy.proxy(url);
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
        this.verbose(
          `${req.method} request failed for ${proxyurl}:\n`,
          ex + ""
        );
        res.writeHead(500, `${(ex + "").substring(0, 16)}`, {
          "content-type": "text/plain",
          body: ex + "",
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
    const { pathname } = url.parse(req.url || "", true);
    this.verbose("allowIntercepts", req.url || "", pathname || "");
    if (pathname !== "/system") return false;
    const pluginFound =
      this.systemPlugins?.some((p) => p.process(req, res)) || false;
    this.verbose(JSON.stringify({ pluginFound, url: req.url }));
    if (pluginFound) {
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader(
        "access-control-allow-origin",
        <any>req.headers.origin || "*"
      );
      res.setHeader("access-control-allow-methods", req.method || "*");
    }
    return pluginFound;
  }

  stop() {
    if (this.server) this.server.close();
    if (this.cache) this.cache.close();
  }
}

interface Dictionary<T> {
  [index: string]: T;
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
    const primarySwitch = args[0];
    if (primarySwitch === "--help") {
      parseArgs(args); // half-baked way of managing commands I guess...
      return;
    }
    if (primarySwitch?.startsWith("--")) {
      const handlerName = primarySwitch.substring(2);
      const handler = handlers[handlerName];
      if (handler) {
        return handler(...args);
      }
      const config = asConfig(args);
      return new Server(config).start();
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
