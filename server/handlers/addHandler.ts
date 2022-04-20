import * as fs from "fs";
import { IConfig } from "../contracts.js";
import { sort } from "../../sort.js";

export function addHandler(
  switchName: string,
  gatewayFile: string,
  externalUri: string,
  internalName: string
) {
  if ("--add" !== switchName) throw "invalid switch";
  if (!gatewayFile)
    throw `you must specify a target package.json files as the 1st argument`;
  if (!externalUri)
    throw "you must specify the external uri as the second argument";
  if (!internalName)
    throw "you must specify an internal identifier as the third argument";
  if (!fs.existsSync(gatewayFile)) throw `file not found: ${gatewayFile}`;
  const config = JSON.parse(fs.readFileSync(gatewayFile) + "") as IConfig;
  const cache = (config["reverse-proxy-cache"] = config[
    "reverse-proxy-cache"
  ] || {
    port: 3002,
    verbose: false,
    "reverse-proxy-db": "reverse-proxy.sqlite",
  });
  const pass = (cache["proxy-pass"] = cache["proxy-pass"] || []);
  const baseUri = `/proxy/${internalName}`;
  const originalBase = pass.find((p) => p.baseUri === baseUri);
  const base = originalBase || {
    about: "",
    baseUri: "",
    proxyUri: "",
  };
  base.baseUri = baseUri;
  base.proxyUri = externalUri;
  base.about = base.about || internalName;
  if (!originalBase) pass.unshift(base);
  pass.sort((a, b) => a.baseUri.localeCompare(b.baseUri));
  pass.forEach((p) => (p.about = p.about || "this proxy is used to..."));
  cache["proxy-pass"] = sort(cache["proxy-pass"]);
  fs.writeFileSync(gatewayFile, JSON.stringify(config, null, 2));
}
