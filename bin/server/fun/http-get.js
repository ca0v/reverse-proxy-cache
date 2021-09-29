"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpsGet = void 0;
const http = require("http");
const https = require("https");
const stringify_1 = require("./stringify");
const isBinaryMimeType_1 = require("./isBinaryMimeType");
const bufferToString_1 = require("./bufferToString");
class HttpsGet {
    get(url, options) {
        stringify_1.verbose("https get");
        let urlOptions = new URL(url);
        let requestOptions = { ...(options || {}) }; // clone
        if (!requestOptions.method)
            requestOptions.method = "GET";
        let protocol = url.startsWith("https://") ? https : http;
        const p = new Promise((good, bad) => {
            const req = protocol
                .request(urlOptions, requestOptions, (res) => {
                const mimeType = res.headers["content-type"] || "text/plain";
                const isBinary = isBinaryMimeType_1.isBinaryMimeType(mimeType);
                stringify_1.verbose({ mimeType, isBinary });
                const data = [];
                stringify_1.verbose("https response statusCode: ", res.statusCode);
                const complete = () => {
                    let body = data;
                    if (!isBinary)
                        body = bufferToString_1.bufferToString(data);
                    good({
                        body: body,
                        headers: res.headers,
                        statusCode: res.statusCode || 0,
                        statusMessage: res.statusMessage || "",
                    });
                };
                res
                    .on("close", () => {
                    // close
                    stringify_1.verbose(`res.close size:${data.length}`);
                    complete();
                })
                    .on("data", (chunk) => {
                    // data
                    stringify_1.verbose("res.data", chunk.length);
                    chunk.length && data.push(...chunk);
                })
                    .on("end", () => {
                    // end
                    stringify_1.verbose("res.end");
                })
                    .on("error", (err) => {
                    // error
                    stringify_1.verbose("res.error");
                    bad(err);
                });
            })
                .on("error", (err) => {
                stringify_1.verbose("req.error");
                bad(err);
            })
                .on("close", () => {
                // close
                stringify_1.verbose("req.close");
            })
                .on("drain", () => {
                // drain
                stringify_1.verbose("req.drain");
            })
                .on("finish", () => {
                // finish
                stringify_1.verbose("req.finish");
            })
                .on("pipe", () => {
                // pipe
                stringify_1.verbose("req.pipe");
            })
                .on("unpipe", () => {
                // unpipe
                stringify_1.verbose("req.unpipe");
            });
            req.end(() => {
                stringify_1.verbose("req.end");
            });
        });
        return p;
    }
    post(url, options) {
        const protocol = url.startsWith("https://") ? https : http;
        const requestOptions = new URL(url);
        options.method = "POST";
        // copy options into requestOptions (native mixin?)
        const body = options.body;
        stringify_1.verbose("POST OPTIONS:", requestOptions);
        const p = new Promise((good, bad) => {
            const req = protocol
                .request(requestOptions, options, (inboundResponse) => {
                const data = [];
                const complete = () => {
                    good({
                        body: data.join(""),
                        headers: inboundResponse.headers,
                        statusCode: inboundResponse.statusCode || 0,
                        statusMessage: inboundResponse.statusMessage || "",
                    });
                    stringify_1.verbose("POST completed");
                };
                inboundResponse
                    .on("close", () => {
                    // close
                    stringify_1.verbose("res.close data", `"${data}"`);
                    complete();
                })
                    .on("data", (chunk) => {
                    // data
                    stringify_1.verbose("res.data", `"${chunk}"`);
                    chunk.length && data.push(chunk);
                })
                    .on("end", () => {
                    // end
                    stringify_1.verbose("res.end");
                    complete();
                })
                    .on("error", (err) => {
                    // error
                    stringify_1.verbose("res.error", err.message);
                    bad(err);
                });
            })
                .on("error", (err) => {
                stringify_1.verbose("req.error", err);
                bad(err);
            })
                .on("close", () => {
                // close
                stringify_1.verbose("req.close");
            })
                .on("drain", () => {
                // drain
                stringify_1.verbose("req.drain");
            })
                .on("finish", () => {
                // finish
                stringify_1.verbose("req.finish");
            })
                .on("pipe", () => {
                // pipe
                stringify_1.verbose("req.pipe");
            })
                .on("unpipe", () => {
                // unpipe
                stringify_1.verbose("req.unpipe");
            });
            stringify_1.verbose("write.body", body);
            req.write(body, (data) => {
                // write
                stringify_1.verbose("write.body", data || "");
            });
            req.end(() => {
                // end
                stringify_1.verbose("req.end");
            });
        });
        return p;
    }
}
exports.HttpsGet = HttpsGet;
//# sourceMappingURL=http-get.js.map