"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EchoServer = void 0;
const http = require("http");
const stringify_1 = require("../server/fun/stringify");
class EchoServer {
    constructor(options) {
        this.options = options;
        this.server = null;
    }
    start() {
        if (!this.server) {
            this.server = http.createServer(async (req, res) => {
                let ended = false;
                res.write("echo(");
                req
                    .on("end", () => {
                    ended = true;
                    res.write(")");
                    res.end();
                })
                    .on("data", data => {
                    if (ended)
                        throw "CANNOT WRITE ANY MORE DATA";
                    res.write(data);
                });
            });
            this.server.listen(this.options.port);
            stringify_1.verbose(`echo server listening at port ${this.options.port}`);
        }
    }
    stop() {
        if (!this.server)
            return;
        this.server.close();
        this.server = null;
        stringify_1.verbose("echo off");
    }
}
exports.EchoServer = EchoServer;
//# sourceMappingURL=echo-server.js.map