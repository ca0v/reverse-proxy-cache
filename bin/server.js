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
var verbose = function () {
    var v = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        v[_i] = arguments[_i];
    }
    return console.log.apply(console, v);
};
var Db = /** @class */ (function () {
    function Db(config) {
        var dbFile = config["reverse-proxy-cache"]["reverse-proxy-db"];
        verbose("loading " + dbFile);
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
                        verbose(row ? "hit" : "miss");
                    });
                });
                return [2 /*return*/, p];
            });
        });
    };
    Db.prototype.add = function (url, res) {
        verbose("add");
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
    Http.prototype.invokeDelete = function (url, req, res) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.assert(req.method === "DELETE");
                return [2 /*return*/, this.invoke(url, req, res)];
            });
        });
    };
    Http.prototype.invokeOptions = function (url, req, res) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.assert(req.method === "OPTIONS");
                return [2 /*return*/, this.invoke(url, req, res)];
            });
        });
    };
    Http.prototype.invokeGet = function (url, req, res) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.assert(req.method === "GET");
                return [2 /*return*/, this.invoke(url, req, res)];
            });
        });
    };
    Http.prototype.invokePut = function (url, req, res) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.assert(req.method === "PUT");
                return [2 /*return*/, this.invoke(url, req, res)];
            });
        });
    };
    Http.prototype.invoke = function (url, req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cachedata, result, result, headers, ex_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cacheKey = stringify({
                            method: req.method,
                            url: req.url || ""
                        });
                        return [4 /*yield*/, this.cache.exists(cacheKey)];
                    case 1:
                        cachedata = _a.sent();
                        if (!!cachedata) {
                            result = unstringify(cachedata);
                            res.writeHead(result.statusCode, result.statusMessage, result.headers);
                            res.write(result.body);
                            res.end();
                            return [2 /*return*/];
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, got_1.default(url, {
                                method: req.method,
                                rejectUnauthorized: false
                            })];
                    case 3:
                        result = _a.sent();
                        headers = {
                            "content-type": result.headers["content-type"]
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
                        return [3 /*break*/, 5];
                    case 4:
                        ex_1 = _a.sent();
                        this.failure(ex_1, res);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Http.prototype.failure = function (ex, res) {
        console.error("FAILURE!", ex);
        res.writeHead(500, { "content-type": "text/plain" });
        res.end();
    };
    Http.prototype.invokePost = function (url, req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey;
            var _this = this;
            return __generator(this, function (_a) {
                console.assert(req.method === "POST");
                cacheKey = {
                    url: req.url,
                    method: req.method,
                    request: ""
                };
                // collect the request body
                req.on("data", function (chunk) { return cacheKey.request += chunk; });
                // check the cache, invoke if missing
                req.on("end", function () { return __awaiter(_this, void 0, void 0, function () {
                    var cachedata, value_1, value, headers;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.cache.exists(stringify(cacheKey))];
                            case 1:
                                cachedata = _a.sent();
                                // found in cache, response with cached data
                                if (!!cachedata) {
                                    value_1 = unstringify(cachedata);
                                    res.writeHead(value_1.statusCode || 200, value_1.statusMessage, value_1.headers);
                                    res.write(value_1.body);
                                    res.end();
                                    return [2 /*return*/];
                                }
                                return [4 /*yield*/, got_1.default.post(url, {
                                        rejectUnauthorized: false,
                                        body: cacheKey.request
                                    })];
                            case 2:
                                value = _a.sent();
                                headers = {
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
            verbose(proxyurl);
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
                        res.writeHead(500, "unsupported method: " + req.method, { "content-type": "text/plain" });
                        res.end();
                        break;
                }
            }
            catch (ex) {
                console.error(ex);
                res.writeHead(500, "" + (ex + "").substring(0, 16), { "content-type": "text/plain" });
                res.end();
            }
            return [2 /*return*/];
        });
    }); });
    var port = config["reverse-proxy-cache"].port;
    server.listen(port);
    verbose("listening on " + port);
}
module.exports = run;
