import { dumpHeaders } from "#@app/test/dumpHeaders.js";
import type { IncomingMessage, ServerResponse } from "http";
import * as url from "url";
import type { Server } from "../../server.js";
import { verbose } from "../fun/stringify.js";
import { setHeaders } from "../setHeaders.js";

export class DeleteSystemPlugin {
  constructor(private server: Server) { }

  process(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== "GET") return false;
    const { query } = url.parse(req.url || "", true);
    if (!query.delete) return false;

    verbose("DeleteSystemPlugin");
    setHeaders(res, {
      "Content-Type": "application/text",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "DELETE",
      "Access-Control-Allow-Headers": "",
      "Access-Control-Allow-Origin": <string>(req.headers.origin || req.headers.referer || "localhost"),
    });
    dumpHeaders(res.getHeaders());

    const cache = this.server.cache;
    cache!
      .delete(<string>query.delete)
      .catch((err) => {
        console.log(err);
        res.write(JSON.stringify(err));
        res.end();
      })
      .then(() => {
        console.log("ok");
        res.write(`deleting where status code is ${query.delete}`);
        res.end();
      });
    return true;
  }
}
