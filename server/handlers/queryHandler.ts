import * as fs from "fs";
import type { IConfig } from "../contracts.js";
import { Db } from "../db.js";

export async function queryHandler(switchName: string, sqlQuery: string) {
  if ("--query" !== switchName) throw "invalid switch";
  if (!sqlQuery) throw `you must specify a query as the 1st argument`;

  // load configuration
  const gatewayFile = "package.json";
  if (!fs.existsSync(gatewayFile)) throw "file not found: " + gatewayFile;
  const packageConfig = JSON.parse(
    fs.readFileSync(gatewayFile) + ""
  ) as IConfig;

  // execute the query against the sqlite database
  const cache = await Db.init(packageConfig["reverse-proxy-cache"]);
  return await cache.executeQuery(sqlQuery);
}
