import type { IncomingMessage, ServerResponse } from "http";
import * as url from "url";
import { Server } from "./server";
import { stringify, verbose as dump, verbose } from "./server/fun/stringify";
import { parse } from "querystring";
import { lowercase } from "./server/fun/lowercase";

function asStatus(message: string) {
  return JSON.stringify({ status: message });
}

export class AddMockResponseSystemPlugin {
  constructor(private server: Server) {}

  process(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== "POST") {
      dump("add mock expects a POST");
      return false;
    }
    const query = url.parse(req.url || "", true).query as { mock: "add" };
    if (!query.mock) {
      dump("add mock expects a 'mock' query", req.url, query);
      return false;
    }

    switch (query.mock) {
      case "add":
        const data: Array<string> = [];
        const cache = this.server.cache;
        if (!cache) throw "server must have a cache defined";

        req
          .on("error", (err) => {
            dump("failed to upload mock data", err.message);
          })
          .on("data", (chunk) => {
            dump("uploading mock data", chunk);
            data.push(chunk);
          })
          // check the cache, invoke if missing
          .on("end", async () => {
            const rawData = data.join("");
            const mockData = JSON.parse(rawData) as {
              method: string;
              url: string;
              data: string;
            };

            verbose("mock method:", mockData.method);
            verbose("mock url:", mockData.url);

            try {
              const urlKey = stringify({
                method: mockData.method,
                url: mockData.url,
              });

              verbose(
                `checking if mock dataexists: ${mockData.method} for ${mockData.url}`
              );
              const exists = await cache.exists(urlKey);
              if (!exists) {
                await cache.add(
                  urlKey,
                  stringify({
                    statusCode: res.statusCode,
                    statusMessage: res.statusCode,
                    headers: lowercase(req.headers),
                    body: mockData.data,
                  })
                );
                dump("mock data was saved to the cache");
                res.write(asStatus(`mocked ${query.mock}`));
                res.end();
              } else {
                res.write(asStatus(`mock already exists: ${urlKey}`));
                res.end();
              }
            } catch (ex) {
              dump(asStatus(`failed to add the mock data: ${ex + ""}`));
              res.write(JSON.stringify(ex));
              res.end();
            }
          });
        return true;
      default:
        return false;
    }
  }
}
