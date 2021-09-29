"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.Server = void 0;
const fs = require("fs");
const http = require("http");
const db_1 = require("./server/db");
const stringify_1 = require("./server/fun/stringify");
const proxy_1 = require("./server/proxy");
const http_1 = require("./server/http");
const url = require("url");
const parseArgs_1 = require("./parseArgs");
const DeleteSystemPlugin_1 = require("./DeleteSystemPlugin");
const AddMockResponseSystemPlugin_1 = require("./AddMockResponseSystemPlugin");
function sort(o) {
    if (null === o)
        return o;
    if (undefined === o)
        return o;
    if (typeof o !== "object")
        return o;
    if (Array.isArray(o)) {
        return o.map((item) => sort(item));
    }
    const keys = Object.keys(o).sort();
    const result = {};
    keys.forEach((k) => (result[k] = sort(o[k])));
    return result;
}
class Server {
    constructor(config) {
        this.server = null;
        this.cache = null;
        this.systemPlugins = [
            new DeleteSystemPlugin_1.DeleteSystemPlugin(this),
            new AddMockResponseSystemPlugin_1.AddMockResponseSystemPlugin(this),
        ];
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
    verbose(...args) {
        if (!this.config.verbose)
            return;
        stringify_1.verbose(...args);
    }
    async start() {
        let config = this.config;
        const cache = await db_1.Db.init(config);
        this.cache = cache;
        if (!cache)
            throw "db failed to return a database connection";
        let proxy = new proxy_1.Proxy(config);
        let helper = new http_1.Http(cache);
        this.server = http.createServer(async (req, res) => {
            // let the plugins have a chance
            if (this.allowIntercepts(req, res))
                return;
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
            }
            catch (ex) {
                this.verbose(`${req.method} request failed for ${proxyurl}:\n`, ex + "");
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
    allowIntercepts(req, res) {
        var _a;
        const { pathname } = url.parse(req.url || "", true);
        this.verbose("allowIntercepts", req.url || "", pathname || "");
        if (pathname !== "/system")
            return false;
        const pluginFound = ((_a = this.systemPlugins) === null || _a === void 0 ? void 0 : _a.some((p) => p.process(req, res))) || false;
        this.verbose(JSON.stringify({ pluginFound, url: req.url }));
        return pluginFound;
    }
    stop() {
        if (this.server)
            this.server.close();
        if (this.cache)
            this.cache.close();
    }
}
exports.Server = Server;
function addHandler(switchName, gatewayFile, externalUri, internalName) {
    if ("--add" !== switchName)
        throw "invalid switch";
    if (!gatewayFile)
        throw `you must specify a target package.json files as the 1st argument`;
    if (!externalUri)
        throw "you must specify the external uri as the second argument";
    if (!internalName)
        throw "you must specify an internal identifier as the third argument";
    if (!fs.existsSync(gatewayFile))
        throw `file not found: ${gatewayFile}`;
    const config = JSON.parse(fs.readFileSync(gatewayFile) + "");
    const cache = (config["reverse-proxy-cache"] = config["reverse-proxy-cache"] || {
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
    if (!originalBase)
        pass.unshift(base);
    pass.sort((a, b) => a.baseUri.localeCompare(b.baseUri));
    pass.forEach((p) => (p.about = p.about || "this proxy is used to..."));
    cache["proxy-pass"] = sort(cache["proxy-pass"]);
    fs.writeFileSync(gatewayFile, JSON.stringify(config, null, 2));
}
function deleteHandler(switchName, gatewayFile, fromCacheWhereResLike) {
    if ("--delete" !== switchName)
        throw "invalid switch";
    if (!gatewayFile)
        throw `you must specify a target package.json files as the 1st argument`;
}
function initHandler(switchName, gatewayFile) {
    if ("--init" !== switchName)
        throw "invalid switch";
    gatewayFile = gatewayFile || "package.json";
    addHandler("--add", gatewayFile, "https://www.arcgis.com", "arcgis");
    addHandler("--add", gatewayFile, "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer", "agol/ArcGIS/rest/services/World_Street_Map/MapServer");
}
const handlers = {
    init: initHandler,
    add: addHandler,
    delete: deleteHandler,
};
async function run(args) {
    if (Array.isArray(args)) {
        const parsedArgs = parseArgs_1.parseArgs(args);
        if (parsedArgs)
            return;
        let primarySwitch = args[0];
        if (primarySwitch === null || primarySwitch === void 0 ? void 0 : primarySwitch.startsWith("--")) {
            const handlerName = primarySwitch.substring(2);
            const handler = handlers[handlerName];
            if (!handler)
                throw `no handler found for ${handlerName}`;
            return handler(...args);
        }
        else {
            // default handler
            const gatewayFile = primarySwitch || "package.json";
            if (!fs.existsSync(gatewayFile))
                throw "file not found: " + gatewayFile;
            const config = JSON.parse(fs.readFileSync(gatewayFile) + "");
            return new Server(config).start();
        }
    }
    else {
        return new Server(args).start();
    }
}
exports.run = run;
//# sourceMappingURL=server.js.map