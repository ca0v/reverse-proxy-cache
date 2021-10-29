import { setHeaders } from "#@app/server/setHeaders.js";
import * as http from "http";
import { verbose } from "../server/fun/stringify.js";

export class EchoServer {
  private server: http.Server | null = null;

  constructor(
    private options: {
      port: number;
    }
  ) { }

  start() {
    if (!this.server) {
      this.server = http.createServer(async (req, res) => {
        const origin: string = req.headers.origin || req.headers.referer || "localhost";
        setHeaders(res.getHeaders(), {
          "Content-Type": (<string>req.headers["content-type"]) || "text; charset=UTF-8",
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": req.method || "GET, OPTIONS",
          "Access-Control-Allow-Headers": "",
        });

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
