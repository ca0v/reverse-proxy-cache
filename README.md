# reverse-proxy-cache

Reverse Proxy with Caching to facilitate service oriented unit tests

## Develop

- `npm run server` TODO: restart when source code changes

## Todo

- watch package.json for changes and restart service

## Install

- `npm install https://github.com/ca0v/reverse-proxy-cache/tarball/v1.0.7`

## Cli

- `npx reverse-proxy-cache --init`
- `npx reverse-proxy-cache --offline`
- `npx reverse-proxy-cache --help`
- `npx reverse-proxy-cache [package.json]`
- `npx reverse-proxy-cache --add package.json https://www.arcgis.com arcgis`

## Configure

Add a "reverse-proxy-cache" section to your package.json file

```
// shape of the configuration (defaults to package.json)
interface IConfig {
  "reverse-proxy-cache": {
    "port": string;
    verbose: boolean;
    offline: boolean;
    "reverse-proxy-db": string;
    "proxy-pass": Array<{
      baseUri: string;
      proxyUri: string;
      "cache-processor": string;
      "no-cache": true | "readonly" | "writeonly"
    }>
  }
}
```

### reverse-proxy-cache options

| option           | description                                   |
| ---------------- | --------------------------------------------- |
| port             | proxy port                                    |
| offline          | fail on a cache miss when true                |
| verbose          | verbose output (true or false)                |
| reverse-proxy-db | identifies the sqlite file to use for caching |
| proxy-pass       | list of resources to proxy                    |

### proxy-pass options

| option            | description                                         |
| ----------------- | --------------------------------------------------- |
| `baseUri`         | identifies the route to the cached service          |
| `proxyUri`        | identifies the cached service                       |
| `no-cache`        | true will not read from or write to the cache       |
| `no-cache`        | readonly will not write to the cache                |
| `no-cache`        | writeonly will not read from the cache              |
| `cache-processor` | identifies pre-request and post-response processors |

### cache-processor

| cache-processor             | description                                          |
| --------------------------- | ---------------------------------------------------- |
| ignore-callback-querystring | ignore jsonp callback parameters computing cache key |
| search-and-replace          | post-response processor for replacing content        |

## History

- future
  - additional caching strategies, see https://codeahoy.com/2017/08/11/caching-strategies-and-how-to-choose-the-right-one/
  - organize code using patterns from popular node projects
- v1.0.7
  - adds `/system?shutdown` to shutdown server
- v1.0.6
  - adds `--offline` command
  - adds ability to inject mock data
- v1.0.5
  - adds ability to write a mock
  - allows CORS
- v1.0.4
  - adds system service for deleting by statuscode (e.g. /system?delete=302)
- v1.0.2
  - adds `--init` and `--add` commands
- v1.0.1
  - adds support for DELETE OPTIONS, POST, PUT
- v1.0.0
  - supports GET only

## Documentation

### Shutdown (v1.0.7)

Issue a GET request to /system?shutdown

### Inject mock data (v1.0.5)

```
const response1 = await got.post(
  `http://localhost:3001/system?mock=add`,
  {
    body: querystring.stringify({
      method: "GET",
      url: "https://usgvncalix02.infor.com/ips_112/client/images/mapdrawer/mapicons/README.md",
      data: "this data was injected as a mock",
    }),
  }
);
```

Request mocked data

```
const response2 = await got.get(
  `http://localhost:3001/mock/test/MapIcons/README.md`
);
```

### Delete 504 errors (v1.0.4)

```
got.get(`http://localhost:3001/system?delete=504`);
```

## Issues

- content-type needs to be transmitted in binary format (not converted to json)

  - `application/font-sfnt`
  - `application/font-woff`
  - `image/png`, `image/gif`

- having difficulty with spotting unhandled exceptions, maybe find a linter tool to discover them

  - https://www.npmjs.com/package/eslint-plugin-promise
