import type { IncomingMessage, ServerResponse } from "http";
import * as url from "url";
import { Server } from "./server";

export class DeleteSystemPlugin {
  constructor(private server: Server) {}

  process(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== "GET") return false;
    const { query } = url.parse(req.url || "", true);
    if (!query.delete) return false;
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
