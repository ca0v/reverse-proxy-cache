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
        const matches = this.config["proxy-pass"].filter((v) => url.startsWith(v.baseUri));
        matches.sort((a, b) => a.baseUri.length - b.baseUri.length);
        const match = matches.pop();
        if (!match) {
            return { url };
        }
        const actualUrl = url.replace(match.baseUri, match.proxyUri);
        let cacheKey = actualUrl;
        if (match["cache-processor"]) {
            const processors = match["cache-processor"]
                .split(",")
                .map((mid) => {
                let processor = require(`../cache-processor/${mid}`);
                if (processor.computeCacheKey) {
                    cacheKey = processor.computeCacheKey(cacheKey, {
                        proxyPass: match,
                    });
                }
                return processor;
            });
            return {
                url: actualUrl,
                key: cacheKey,
                processors: processors,
                writeToCache: true,
                readFromCache: true,
                proxyPass: match,
            };
        }
        return {
            url: actualUrl,
            key: cacheKey,
            writeToCache: !match["no-cache"] || "writeonly" === match["no-cache"],
            readFromCache: !match["no-cache"] || "readonly" === match["no-cache"],
            proxyPass: match,
        };
    }
}
exports.Proxy = Proxy;
//# sourceMappingURL=proxy.js.map