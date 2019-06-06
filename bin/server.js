"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
require("dotenv").config();
var got_1 = __importDefault(require("got"));
var http_1 = __importDefault(require("http"));
var sqlite3_1 = __importDefault(require("sqlite3"));
var stringify = function (v) { return JSON.stringify(v, null, 2); };
var unstringify = function (v) { return JSON.parse(v); };
var Db = /** @class */ (function () {
    function Db(config) {
        var dbFile = config["reverse-proxy-cache"]["reverse-proxy-db"];
        console.log("loading " + dbFile);
        var db = (this.db = new sqlite3_1.default.Database(dbFile));
        db.run("CREATE TABLE cache (url TEXT, res TEXT)", function () { }, function (err) {
            console.warn(err);
        });
    }
    Db.prototype.exists = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var cmd, p;
            return __generator(this, function (_a) {
                cmd = this.db.prepare("SELECT res FROM cache WHERE url=?");
                p = new Promise(function (resolve, reject) {
                    cmd.get(url, function (err, row) {
                        err ? reject(err) : resolve(row && row.res);
                    });
                });
                return [2 /*return*/, p];
            });
        });
    };
    Db.prototype.add = function (url, res) {
        var cmd = this.db.prepare("INSERT INTO cache VALUES (?, ?)");
        var p = new Promise(function (resolve, reject) {
            cmd.run(url, res, function (err) {
                err ? reject(err) : resolve();
            });
        });
        return p;
    };
    return Db;
}());
var Proxy = /** @class */ (function () {
    function Proxy(config) {
        this.config = config;
        // nothing to do
    }
    Proxy.prototype.proxy = function (url) {
        var match = this.config["reverse-proxy-cache"]["proxy-pass"].find(function (v) { return url.startsWith(v.baseUri); });
        if (!match)
            return url;
        return url.replace(match.baseUri, match.proxyUri);
    };
    return Proxy;
}());
var Http = /** @class */ (function () {
    function Http(cache, proxy) {
        this.cache = cache;
        this.proxy = proxy;
    }
    Http.prototype.invokeGet = function (url, req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var exists, result, result, headers;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.assert(req.method === "GET");
                        return [4 /*yield*/, this.cache.exists(req.url || "")];
                    case 1:
                        exists = _a.sent();
                        if (!!exists) {
                            result = unstringify(exists);
                            res.writeHead(result.statusCode, result.headers);
                            res.write(result.body);
                            res.end();
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, got_1.default(url, {
                                rejectUnauthorized: false
                            })];
                    case 2:
                        result = _a.sent();
                        headers = {
                            "content-type": result.headers["content-type"]
                        };
                        res.writeHead(result.statusCode || 200, headers);
                        res.write(result.body);
                        res.end();
                        this.cache.add(req.url || "", stringify({
                            statusCode: result.statusCode,
                            headers: headers,
                            body: result.body
                        }));
                        return [2 /*return*/];
                }
            });
        });
    };
    Http.prototype.invokePost = function (url, req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var key;
            var _this = this;
            return __generator(this, function (_a) {
                console.assert(req.method === "POST");
                key = {
                    url: req.url,
                    request: ""
                };
                // collect the request body
                req.on("data", function (chunk) { return key.request += chunk; });
                // check the cache, invoke if missing
                req.on("end", function () { return __awaiter(_this, void 0, void 0, function () {
                    var cachedata, value;
                    var _this = this;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.cache.exists(stringify(key))];
                            case 1:
                                cachedata = _a.sent();
                                // found in cache, response with cached data
                                if (!!cachedata) {
                                    value = unstringify(cachedata);
                                    res.writeHead(value.statusCode || 200, value.statusMessage, value.headers);
                                    res.write(value.body);
                                    res.end();
                                    return [2 /*return*/];
                                }
                                // invoke actual service, cache the response
                                got_1.default.post(url, {
                                    body: key.request
                                }).then(function (value) {
                                    var headers = {
                                        "content-type": value.headers["content-type"]
                                    };
                                    res.writeHead(value.statusCode || 200, value.statusMessage, headers);
                                    res.write(value.body);
                                    res.end();
                                    _this.cache.add(stringify(key), stringify({
                                        statusCode: value.statusCode,
                                        statusMessage: value.statusMessage,
                                        body: value.body,
                                        headers: headers
                                    }));
                                });
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        });
    };
    return Http;
}());
function run(config) {
    var _this = this;
    if (!config["reverse-proxy-cache"])
        throw "missing configuration: reverse-proxy-cache not found";
    if (!config["reverse-proxy-cache"].port)
        throw "missing configuration: reverse-proxy-cache/port not found";
    if (!config["reverse-proxy-cache"]["reverse-proxy-db"])
        throw "missing configuration: reverse-proxy-cache/reverse-proxy-db not found";
    if (!config["reverse-proxy-cache"]["proxy-pass"])
        throw "missing configuration: reverse-proxy-cache/proxy-pass not found";
    var cache = new Db(config);
    var proxy = new Proxy(config);
    var helper = new Http(cache, proxy);
    var server = http_1.default.createServer(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var url, proxyurl;
        return __generator(this, function (_a) {
            url = req.url || "";
            proxyurl = proxy.proxy(url);
            if (proxyurl === url) {
                res.writeHead(500, { "content-type": "text/plain" });
                res.write("no configuration found for this endpoint");
                res.end();
                return [2 /*return*/];
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
                    res.write("unsupported method: " + req.method);
                    res.end();
                    break;
            }
            return [2 /*return*/];
        });
    }); });
    var port = config["reverse-proxy-cache"].port;
    server.listen(port);
    console.log("listening on " + port);
}
module.exports = run;
