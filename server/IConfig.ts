// shape of the configuration (defaults to package.json)
export interface IConfig {
  "reverse-proxy-cache": {
    "port": string;
    "reverse-proxy-db": string;
    "proxy-pass": Array<{
      "about": string;
      baseUri: string;
      proxyUri: string;
      "cache-processor": string;
    }>;
  };
}
