import { dumpHeaders } from "#@app/test/dumpHeaders.js";
import type { IncomingMessage, ServerResponse } from "http";
import * as url from "url";
import type { Server } from "../../server.js";
import { apply } from "../fun/access-control-allow.js";
import { verbose } from "../fun/stringify.js";
import { setHeaders } from "../setHeaders.js";

export class DeleteSystemPlugin {
  constructor(private server: Server) {}

  process(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== "GET") return false;
    const { query } = url.parse(req.url || "", true);
    if (!query.delete) return false;

    verbose("DeleteSystemPlugin");
    apply(req, res);
    setHeaders(res, { "Content-Type": "application/text" });
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
