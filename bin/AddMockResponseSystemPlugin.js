"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMockResponseSystemPlugin = void 0;
const url = require("url");
const stringify_1 = require("./server/fun/stringify");
const querystring_1 = require("querystring");
const lowercase_1 = require("./server/fun/lowercase");
class AddMockResponseSystemPlugin {
    constructor(server) {
        this.server = server;
    }
    process(req, res) {
        if (req.method !== "POST") {
            stringify_1.verbose("add mock expects a POST");
            return false;
        }
        const query = url.parse(req.url || "", true).query;
        if (!query.mock) {
            stringify_1.verbose("add mock expects a 'mock' query", req.url, query);
            return false;
        }
        switch (query.mock) {
            case "add":
                const data = [];
                const cache = this.server.cache;
                if (!cache)
                    throw "server must have a cache defined";
                req
                    .on("error", (err) => {
                    stringify_1.verbose("failed to upload mock data", err.message);
                })
                    .on("data", (chunk) => {
                    stringify_1.verbose("uploading mock data");
                    data.push(chunk);
                })
                    // check the cache, invoke if missing
                    .on("end", async () => {
                    const mockData = querystring_1.parse(data.join(""));
                    try {
                        const urlKey = stringify_1.stringify({
                            method: mockData.method,
                            url: mockData.url,
                        });
                        const exists = await cache.exists(urlKey);
                        if (!exists) {
                            await cache.add(urlKey, stringify_1.stringify({
                                statusCode: res.statusCode,
                                statusMessage: res.statusCode,
                                headers: lowercase_1.lowercase(req.headers),
                                body: mockData.data,
                            }));
                            stringify_1.verbose("mock data was saved to the cache");
                            res.write(`mocked ${query.mock}`);
                            res.end();
                        }
                        else {
                            res.write(`mock already exists`);
                            res.end();
                        }
                    }
                    catch (ex) {
                        stringify_1.verbose("failed to add the mock data", ex + "");
                        res.write(JSON.stringify(ex));
                        res.end();
                    }
                });
                return true;
            default:
                return false;
        }
    }
}
exports.AddMockResponseSystemPlugin = AddMockResponseSystemPlugin;
//# sourceMappingURL=AddMockResponseSystemPlugin.js.map