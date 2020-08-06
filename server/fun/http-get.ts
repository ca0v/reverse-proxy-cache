import * as IHttp from "http";
import * as http from "http";
import * as https from "https";

import { verbose } from "./stringify";
import { isBinaryMimeType } from "./isBinaryMimeType";
import { bufferToString } from "./bufferToString";

export class HttpsGet {
    get(url: string, options?: https.RequestOptions) {
        verbose("https get");
        let urlOptions = new URL(url);
        let requestOptions = { ...(options || {}) }; // clone
        if (!requestOptions.method) requestOptions.method = "GET";
        let protocol = url.startsWith("https://") ? https : http;

        let p = new Promise<{
            body: string | Array<number>;
            statusCode: number;
            statusMessage: string;
            headers: IHttp.IncomingHttpHeaders;
        }>((good, bad) => {
            let req = protocol
                .request(urlOptions, requestOptions, (res) => {
                    let mimeType = res.headers["content-type"] || "text/plain";
                    let isBinary = isBinaryMimeType(mimeType);
                    verbose({ mimeType, isBinary });

                    let data: Array<number> = [];
                    verbose("https response statusCode: ", res.statusCode);

                    let complete = () => {
                        let body: string | number[] = data;
                        if (!isBinary) body = bufferToString(data);

                        good({
                            body: body,
                            headers: res.headers,
                            statusCode: res.statusCode || 0,
                            statusMessage: res.statusMessage || "",
                        });
                    };

                    res.on("close", () => {
                        // close
                        verbose(`res.close size:${data.length}`);
                        complete();
                    })
                        .on("data", (chunk) => {
                            // data
                            verbose("res.data", chunk.length);
                            data.push(...chunk);
                        })
                        .on("end", () => {
                            // end
                            verbose("res.end");
                        })
                        .on("error", (err) => {
                            // error
                            verbose("res.error");
                            bad(err);
                        });
                })
                .on("error", (err) => {
                    verbose("req.error");
                    bad(err);
                })
                .on("close", () => {
                    // close
                    verbose("req.close");
                })
                .on("drain", () => {
                    // drain
                    verbose("req.drain");
                })
                .on("finish", () => {
                    // finish
                    verbose("req.finish");
                })
                .on("pipe", () => {
                    // pipe
                    verbose("req.pipe");
                })
                .on("unpipe", () => {
                    // unpipe
                    verbose("req.unpipe");
                });
            req.end(() => {
                verbose("req.end");
            });
        });
        return p;
    }

    post(
        url: string,
        options: {
            body: string;
            method?: "POST";
            rejectUnauthorized?: boolean;
            headers?: any;
        }
    ) {
        let protocol = url.startsWith("https://") ? https : http;
        let requestOptions = new URL(url);
        options.method = "POST";
        // copy options into requestOptions (native mixin?)

        let body = options.body;

        verbose("POST OPTIONS:", requestOptions);

        let p = new Promise<{
            body: string;
            statusCode: number;
            statusMessage: string;
            headers: http.IncomingHttpHeaders;
        }>((good, bad) => {
            let req = protocol
                .request(requestOptions, options, (res) => {
                    let data: string = "";
                    let complete = () =>
                        good({
                            body: data,
                            headers: res.headers,
                            statusCode: res.statusCode || 0,
                            statusMessage: res.statusMessage || "",
                        });

                    res.on("close", () => {
                        // close
                        verbose("res.close data", `"${data}"`);
                        complete();
                    })
                        .on("data", (chunk) => {
                            // data
                            verbose("res.data", chunk);
                            data += chunk;
                        })
                        .on("end", () => {
                            // end
                            verbose("res.end");
                            complete();
                        })
                        .on("error", (err) => {
                            // error
                            verbose("res.error");
                            bad(err);
                        });
                })
                .on("error", (err) => {
                    verbose("req.error", err);
                    bad(err);
                })
                .on("close", () => {
                    // close
                    verbose("req.close");
                })
                .on("drain", () => {
                    // drain
                    verbose("req.drain");
                })
                .on("finish", () => {
                    // finish
                    verbose("req.finish");
                })
                .on("pipe", () => {
                    // pipe
                    verbose("req.pipe");
                })
                .on("unpipe", () => {
                    // unpipe
                    verbose("req.unpipe");
                });

            verbose("write.body", body);
            req.write(body, (err) => {
                // write
                verbose("write.err", err || "");
            });

            req.end(() => {
                // end
                verbose("req.end");
            });
        });
        return p;
    }
}
