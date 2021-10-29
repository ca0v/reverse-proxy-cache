import type { IncomingMessage, ServerResponse } from "http";
import type { Server } from "../../server.js";
import { verbose } from "../fun/stringify.js";

export class ShutdownSystemPlugin {
  constructor(private server: Server) { }

  process(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== "GET") return false;
    verbose("ShutdownSystemPlugin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      req.headers.origin || "GET"
    );
    res.write(`shutdown`);
    res.end();
    this.server.stop();
    return true;
  }
}
