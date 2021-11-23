import { setHeaders } from "../setHeaders.js";

export function apply(req, res) {
  const origin = req.headers.origin || req.headers.referer || "localhost";
  const allowMethods =
    req.headers["access-control-request-method"] ||
    <string>req.method ||
    "DELETE,GET,POST";
  const allowHeaders =
    req.headers["access-control-request-headers"] ||
    "Content-Type,Access-Control-Allow-Origin,Access-Control-Allow-Methods,Access-Control-Allow-Credentials";

  setHeaders(res, {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": allowMethods,
    "access-control-allow-headers": allowHeaders,
    "access-control-max-age": 86400,
    "access-control-allow-credentials": "true",
  });

  return res;
}
