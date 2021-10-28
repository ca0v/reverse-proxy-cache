import type { IncomingMessage, ServerResponse } from "http";
import * as url from "url";
import type { Server } from "../../server.js";

export class ShutdownSystemPlugin {
  constructor(private server: Server) { }

  process(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== "GET") return false;
    res.write(`shutdown`);
    res.end();
    this.server.stop();
    return true;
  }
}
