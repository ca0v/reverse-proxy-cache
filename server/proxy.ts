import {
    ReverseProxyCache,
    ProxyInfo,
    IProcessor,
    ProxyPass,
} from "./contracts";

export class Proxy {
    constructor(private config: ReverseProxyCache) {
        // nothing to do
    }
    proxy(url: string): ProxyInfo {
        const proxyPass = this.config["proxy-pass"];
        if (!proxyPass) {
            throw "proxy-pass not found in configuration";
        }
        // upsettingly non-performant but finds longest match
        const matches = this.config["proxy-pass"].filter((v) =>
            url.startsWith(v.baseUri)
        );
        matches.sort((a, b) => a.baseUri.length - b.baseUri.length);
        const match = <ProxyPass>matches.pop();
        if (!match) {
            return { url };
        }

        const actualUrl = url.replace(match.baseUri, match.proxyUri);
        let cacheKey = actualUrl;
        if (match["cache-processor"]) {
            const processors = match["cache-processor"]
                .split(",")
                .map((mid) => {
                    let processor: IProcessor = require(`../cache-processor/${mid}`);
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
            writeToCache:
                !match["no-cache"] || "writeonly" === match["no-cache"],
            readFromCache:
                !match["no-cache"] || "readonly" === match["no-cache"],
            proxyPass: match,
        };
    }
}
