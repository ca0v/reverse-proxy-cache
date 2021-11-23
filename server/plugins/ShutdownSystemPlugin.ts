import * as url from "url";
import { dumpHeaders } from "#@app/test/dumpHeaders.js";
import type { IncomingMessage, ServerResponse } from "http";
import type { Server } from "../../server.js";
import { setHeaders } from "../setHeaders.js";
import { stringify, verbose as dump, verbose } from "../fun/stringify.js";

export class ShutdownSystemPlugin {
  constructor(private server: Server) {}

  process(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== "GET") return false;
    const query = url.parse(req.url || "", true).query as {
      shutdown: "shutdown";
    };
    if (typeof query.shutdown === "undefined") {
      dump("shutdown expects a 'shutdown' query", req.url, query);
      return false;
    }
    verbose("ShutdownSystemPlugin");
    setHeaders(res, {
      "Content-Type": "application/text",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "",
      "Access-Control-Allow-Origin": <string>(
        (req.headers.origin || req.headers.referer || "localhost")
      ),
    });
    dumpHeaders(res.getHeaders());
    res.write(`shutdown`);
    res.end();
    this.server.stop();
    return true;
  }
}
