import type { IncomingMessage, ServerResponse } from "http";
import * as url from "url";
import type { Server } from "../../server.js";
import { stringify, verbose as dump, verbose } from "../fun/stringify.js";
import { lowercase } from "../fun/lowercase.js";
import { setHeaders } from "../setHeaders.js";

function asStatus(message: string) {
  return JSON.stringify({ status: message });
}

export class AddProxySystemPlugin {
  constructor(private server: Server) {}

  process(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== "POST") {
      dump("add mock expects a POST");
      return false;
    }
    const query = url.parse(req.url || "", true).query as { proxy: "add" };
    if (!query.proxy) {
      dump("add proxy expects a 'proxy' query", req.url, query);
      return false;
    }

    verbose("AddProxySystemPlugin");
    setHeaders(res, {
      "Content-Type": req.headers["content-type"] || "add-mock/unknown",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Origin": <string>(
        (req.headers.origin || req.headers.referer || "localhost")
      ),
    });

    switch (query.proxy) {
      case "add":
        const data: Array<string> = [];
        const cache = this.server.cache;
        if (!cache) throw "server must have a cache defined";

        req
          .on("error", (err) => {
            dump("failed to upload mock data", err.message);
          })
          .on("data", (chunk) => {
            dump("uploading mock data", chunk);
            data.push(chunk);
          })
          // check the cache, invoke if missing
          .on("end", async () => {
            const rawData = data.join("");
            const proxyInfo = JSON.parse(rawData) as {
              about: string;
              baseUri: string;
              proxyUri: string;
            };
            verbose(
              `creating proxy for ${proxyInfo.proxyUri} using ${proxyInfo.baseUri}`
            );

            try {
              const response = this.server.addProxy(proxyInfo);
              res.write(JSON.stringify({ response }));
              res.end();
            } catch (ex) {
              dump(asStatus(`failed to add the mock data: ${ex + ""}`));
              res.write(JSON.stringify(ex));
              res.end();
            }
          });
        return true;
      default:
        return false;
    }
  }
}
