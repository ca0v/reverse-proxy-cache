require("dotenv").config();
import * as http from "http";
import { Db } from "./server/db";
import { IConfig, ReverseProxyCache as ReverseProxyCacheConfig } from "./server/IConfig";
import { verbose as dump } from "./server/fun/stringify";
import { Proxy } from "./server/proxy";
import { Http } from "./server/http";

export class Server {
    private server: http.Server | null = null;
    private cache: Db | null = null;
    private config: ReverseProxyCacheConfig;

    constructor(config: IConfig) {
        if (!config["reverse-proxy-cache"]) throw "missing configuration: reverse-proxy-cache not found";
        if (!config["reverse-proxy-cache"].port) throw "missing configuration: reverse-proxy-cache/port not found";
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
                        res.writeHead(500, `unsupported method: ${req.method}`, { "content-type": "text/plain" });
                        res.end();
                        break;
                }
            } catch (ex) {
                this.verbose(`${req.method} request failed for ${proxyurl}:\n`, ex);
                res.writeHead(500, `${(ex + "").substring(0, 16)}`, { "content-type": "text/plain", body: ex });
                res.end();
                return;
            }
        });
        let port = config.port;
        this.server.listen(port);
        this.verbose(`listening on ${port}`);
        return this;
    }

    stop() {
        if (this.server) this.server.close();
        if (this.cache) this.cache.close();
    }
}

export async function run(config: IConfig) {
    return new Server(config).start();
}
