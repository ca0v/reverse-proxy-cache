export interface Dictionary<T> {
  [index: string]: T;
}

export type ProxyInfo = {
  url: string;
  key?: string;
  processors?: IProcessor[];
  writeToCache?: boolean;
  readFromCache?: boolean;
  "search-and-replace"?: Dictionary<string>;
  proxyPass?: ProxyPass;
};

export interface IProcessor {
  name: string;
  computeCacheKey?(request: string, options: { proxyPass: ProxyPass }): string;
  processResponse?(
    request: string,
    response: string | Array<number>,
    options: { proxyPass: ProxyPass }
  ): string;
}

/**
 * shape of the configuration (defaults to package.json)
 */
export interface IConfig {
  "reverse-proxy-cache": ReverseProxyCache;
}

export interface ReverseProxyCache {
  port: string;
  verbose: boolean;
  "reverse-proxy-db": string;
  "proxy-pass": Array<ProxyPass>;
}

export interface ProxyPass {
  about: string;
  baseUri: string;
  proxyUri: string;
  "cache-processor"?: string;
  "no-cache"?: true | "readonly" | "writeonly";
  "search-and-replace"?: Dictionary<string>;
}
