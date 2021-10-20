import { processor as searchAndReplace } from "../cache-processor/search-and-replace";
import { processor as ignoreCallback } from "../cache-processor/ignore-callback-querystring";

const CacheProcessors = {
  "search-and-replace": searchAndReplace,
  "ignore-callback-querystring": ignoreCallback,
};

import {
  ReverseProxyCache,
  ProxyInfo,
  IProcessor,
  ProxyPass,
} from "./contracts";
import { verbose } from "./fun/stringify";

export class Proxy {
  constructor(private config: ReverseProxyCache) {
    // nothing to do
  }

  // given a mock url find the proxy info
  proxy(url: string): ProxyInfo {
    const proxyPass = this.config["proxy-pass"];
    if (!proxyPass) {
      throw "proxy-pass not found in configuration";
    }
    // upsettingly non-performant but finds longest match
    const matches = proxyPass.filter((v) => url.startsWith(v.baseUri));
    matches.sort((a, b) => a.baseUri.length - b.baseUri.length);
    const match = <ProxyPass>matches.pop();
    if (!match) {
      verbose(`no proxy match found for ${url}`);
      return { url };
    }

    const actualUrl = url.replace(match.baseUri, match.proxyUri);
    let cacheKey = actualUrl;
    if (match["cache-processor"]) {
      const processors = match["cache-processor"].split(",").map((mid) => {
        let processor: IProcessor =
          CacheProcessors[mid as "search-and-replace"];
        if (!processor) throw `${mid} is an invalid processor name`;
        verbose("PROCESSOR LOADED: ", processor.name || processor + "");
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
        offline: this.config.offline,
        writeToCache: true,
        readFromCache: true,
        proxyPass: match,
      };
    }

    return {
      url: actualUrl,
      key: cacheKey,
      offline: !!this.config.offline,
      writeToCache: !match["no-cache"] || "writeonly" === match["no-cache"],
      readFromCache: !match["no-cache"] || "readonly" === match["no-cache"],
      proxyPass: match,
    };
  }
}
