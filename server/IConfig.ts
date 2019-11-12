export interface ReverseProxyCache {
    port: string;
    verbose: boolean;
    "reverse-proxy-db": string;
    "proxy-pass": Array<{
        about: string;
        baseUri: string;
        proxyUri: string;
        "cache-processor"?: string;
        "no-cache"?: true | "readonly" | "writeonly";
    }>;
}

// shape of the configuration (defaults to package.json)
export interface IConfig {
    "reverse-proxy-cache": ReverseProxyCache;
}
