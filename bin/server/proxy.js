"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Proxy = void 0;
class Proxy {
    constructor(config) {
        this.config = config;
        // nothing to do
    }
    proxy(url) {
        const proxyPass = this.config["proxy-pass"];
        if (!proxyPass) {
            throw "proxy-pass not found in configuration";
        }
        // upsettingly non-performant but finds longest match
        const matches = this.config["proxy-pass"].filter(v => url.startsWith(v.baseUri));
        matches.sort((a, b) => a.baseUri.length - b.baseUri.length);
        const match = matches.pop();
        if (!match) {
            return { url };
        }
        const actualUrl = url.replace(match.baseUri, match.proxyUri);
        let cacheKey = actualUrl;
        if (match["cache-processor"]) {
            const processors = match["cache-processor"].split(",").map(mid => {
                let processor = require(`../cache-processor/${mid}`);
                cacheKey = processor.computeCacheKey(cacheKey);
                return processor;
            });
            return {
                url: actualUrl,
                key: cacheKey,
                processors: processors,
                "write-to-cache": true,
                "read-from-cache": true
            };
        }
        return {
            url: actualUrl,
            key: cacheKey,
            "write-to-cache": (!match["no-cache"] || "writeonly" === match["no-cache"]),
            "read-from-cache": (!match["no-cache"] || "readonly" === match["no-cache"])
        };
    }
}
exports.Proxy = Proxy;
//# sourceMappingURL=proxy.js.map