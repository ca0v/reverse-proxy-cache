import { apply } from "#@app/server/fun/access-control-allow.js";
import { setHeaders } from "#@app/server/setHeaders.js";
import * as http from "http";
import { verbose } from "../server/fun/stringify.js";
import { dumpHeaders } from "./dumpHeaders.js";

export class EchoServer {
  private server: http.Server | null = null;

  constructor(
    private options: {
      port: number;
    }
  ) {}

  start() {
    if (!this.server) {
      this.server = http.createServer(async (req, res) => {
        apply(req, res);
        setHeaders(res, {
          "Content-Type": "echo/text",
        });

        verbose("echo headers");
        dumpHeaders(res.getHeaders());

        let ended = false;
        res.write("echo(");
        req
          .on("end", () => {
            ended = true;
            res.write(")");
            res.end();
          })
          .on("data", (data) => {
            if (ended) throw "CANNOT WRITE ANY MORE DATA";
            res.write(data);
          });
      });
      this.server.listen(this.options.port);
      verbose(`echo server listening at port ${this.options.port}`);
    }
  }

  stop() {
    if (!this.server) return;
    this.server.close();
    this.server = null;
    verbose("echo off");
  }
}
