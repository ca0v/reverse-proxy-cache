import { IConfig } from "./server/contracts";

export function asConfig(args: string[]) {
  const config = <IConfig>{};
  config["reverse-proxy-cache"] = {
    "proxy-pass": [],
    "reverse-proxy-db": "reverse-proxy-cache.sqlite",
    port: "3002",
    verbose: false,
  };
  const cache = config["reverse-proxy-cache"];

  // args syntax must be --\w+ \w*
  let argIndex = 0;
  while (argIndex < args.length) {
    const switchName = args[argIndex++];
    switch (switchName) {
      case "":
        break;
      case "--db":
        cache["reverse-proxy-db"] = args[argIndex++];
        break;
      case "--offline":
        cache.offline = true;
        break;
      case "--port":
        cache.port = args[argIndex++];
        break;
      case "--verbose":
        cache.verbose = true;
        break;
      default:
        throw `unexpected switch: ${switchName}`;
    }
  }
  return config;
}
