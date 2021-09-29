import type { IncomingMessage, ServerResponse } from "http";
import * as url from "url";
import { Server } from "./server";
import { stringify, verbose as dump } from "./server/fun/stringify";
import { parse } from "querystring";
import { lowercase } from "./server/fun/lowercase";

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
            dump("uploading mock data");
            data.push(chunk);
          })
          // check the cache, invoke if missing
          .on("end", async () => {
            const mockData = parse(data.join("")) as {
              method: string;
              url: string;
              data: string;
            };
            try {
              const urlKey = stringify({
                method: mockData.method,
                url: mockData.url,
              });

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
                res.write(`mocked ${query.mock}`);
                res.end();
              } else {
                res.write(`mock already exists`);
                res.end();
              }
            } catch (ex) {
              dump("failed to add the mock data", ex + "");
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
