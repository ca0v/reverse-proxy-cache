# reverse-proxy-cache

Reverse Proxy with Caching to facilitate service oriented unit tests

## Develop

- `npm run server` TODO: restart when source code changes

## Todo

- watch package.json for changes and restart service

## Install

- `npm install https://github.com/ca0v/reverse-proxy-cache/tarball/v1.0.5`

## Cli

- `npx reverse-proxy-cache [package.json]`
- `npx reverse-proxy-cache --init`
- `npx reverse-proxy-cache --add package.json https://www.arcgis.com arcgis`

## Configure

Add a "reverse-proxy-cache" section to your package.json file

```
// shape of the configuration (defaults to package.json)
interface IConfig {
  "reverse-proxy-cache": {
    "port": string;
    "reverse-proxy-db": string;
    "proxy-pass": Array<{
      baseUri: string;
      proxyUri: string;
      "cache-processor": string;
    }>
  }
}
```

## History

- v1.0.6 - additional caching strategies, see https://codeahoy.com/2017/08/11/caching-strategies-and-how-to-choose-the-right-one/
- v1.0.5 - organize code using patterns from popular node projects
- v1.0.4 - adds system service for deleting by statuscode (e.g. /system/delete=302)
- v1.0.2 - adds --init and --add commands
- v1.0.1 - adds support for DELETE OPTIONS, POST, PUT
- v1.0.0 - supports GET only

## Issues

- content-type needs to be transmitted in binary format (not converted to json)

  - `application/font-sfnt`
  - `application/font-woff`
  - `image/png`, `image/gif`

- having difficulty with spotting unhandled exceptions, maybe find a linter tool to discover them

  - https://www.npmjs.com/package/eslint-plugin-promise
