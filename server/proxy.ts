import * as defaultProcessor from "../cache-processor/ignore-callback-querystring";
type Processor = typeof defaultProcessor;

import { IConfig } from "./IConfig";


export type ProxyInfo = {
    url: string;
    key?: string;
    processors?: Processor[];
    "write-to-cache"?: boolean;
    "read-from-cache"?: boolean;
}

export class Proxy {
    constructor(private config: IConfig) {
        // nothing to do
    }
    proxy(url: string): ProxyInfo {
        let match = this.config["reverse-proxy-cache"]["proxy-pass"].find(v => url.startsWith(v.baseUri));
        if (!match)
            return { url };
        let actualUrl = url.replace(match.baseUri, match.proxyUri);
        let cacheKey = actualUrl;
        if (match["cache-processor"]) {
            let processors = match["cache-processor"].split(",").map(mid => {
                let processor: Processor = require(`../cache-processor/${mid}`);
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
            "write-to-cache": (true !== match["no-cache"]),
            "read-from-cache": (true !== match["no-cache"])
        };
    }
}
