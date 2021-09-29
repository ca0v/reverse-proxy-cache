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

    const p = new Promise<{
      body: string | Array<number>;
      statusCode: number;
      statusMessage: string;
      headers: IHttp.IncomingHttpHeaders;
    }>((good, bad) => {
      const req = protocol
        .request(urlOptions, requestOptions, (res) => {
          const mimeType = res.headers["content-type"] || "text/plain";
          const isBinary = isBinaryMimeType(mimeType);
          verbose({ mimeType, isBinary });

          const data: Array<number> = [];
          verbose("https response statusCode: ", res.statusCode);

          const complete = () => {
            let body: string | number[] = data;
            if (!isBinary) body = bufferToString(data);

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
              verbose(`res.close size:${data.length}`);
              complete();
            })
            .on("data", (chunk) => {
              // data
              verbose("res.data", chunk.length);
              chunk.length && data.push(...chunk);
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
    const protocol = url.startsWith("https://") ? https : http;
    const requestOptions = new URL(url);
    options.method = "POST";
    // copy options into requestOptions (native mixin?)

    const body = options.body;

    verbose("POST OPTIONS:", requestOptions);

    const p = new Promise<{
      body: string;
      statusCode: number;
      statusMessage: string;
      headers: http.IncomingHttpHeaders;
    }>((good, bad) => {
      const req = protocol
        .request(requestOptions, options, (inboundResponse) => {
          const data: string[] = [];
          const complete = () => {
            good({
              body: data.join(""),
              headers: inboundResponse.headers,
              statusCode: inboundResponse.statusCode || 0,
              statusMessage: inboundResponse.statusMessage || "",
            });
            verbose("POST completed");
          };

          inboundResponse
            .on("close", () => {
              // close
              verbose("res.close data", `"${data}"`);
              complete();
            })
            .on("data", (chunk) => {
              // data
              verbose("res.data", `"${chunk}"`);
              chunk.length && data.push(chunk);
            })
            .on("end", () => {
              // end
              verbose("res.end");
              complete();
            })
            .on("error", (err) => {
              // error
              verbose("res.error", err.message);
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
      req.write(body, (data) => {
        // write
        verbose("write.body", data || "");
      });

      req.end(() => {
        // end
        verbose("req.end");
      });
    });
    return p;
  }
}
