import * as http from "http";
import { verbose } from "../server/fun/stringify";

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
                res.setHeader("content-type", "echo/text");

                let ended = false;
                res.write("echo(");
                req.on("end", () => {
                    ended = true;
                    res.write(")");
                    res.end();
                }).on("data", (data) => {
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
