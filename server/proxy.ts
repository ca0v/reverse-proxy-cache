import * as defaultProcessor from "../cache-processor/ignore-callback-querystring";
type Processor = typeof defaultProcessor;

import { IConfig, ReverseProxyCache } from "./IConfig";

export interface Dictionary<T> {
    [index: string]: T;
}

export type ProxyInfo = {
    url: string;
    key?: string;
    processors?: Processor[];
    "write-to-cache"?: boolean;
    "read-from-cache"?: boolean;
    "search-and-replace"?: Dictionary<string>;
};

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
                    let processor: Processor = require(`../cache-processor/${mid}`);
                    if (processor.computeCacheKey) {
                        cacheKey = processor.computeCacheKey(cacheKey);
                    }
                    return processor;
                });
            return {
                url: actualUrl,
                key: cacheKey,
                processors: processors,
                "write-to-cache": true,
                "read-from-cache": true,
                "search-and-replace": match["search-and-replace"],
            };
        }

        return {
            url: actualUrl,
            key: cacheKey,
            "write-to-cache":
                !match["no-cache"] || "writeonly" === match["no-cache"],
            "read-from-cache":
                !match["no-cache"] || "readonly" === match["no-cache"],
        };
    }
}
