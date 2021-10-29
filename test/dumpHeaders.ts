import * as http from "http";
import { verbose } from "../server/fun/stringify.js";

export function dumpHeaders(headers: http.OutgoingHttpHeaders) {
    verbose("HEADERS");
    Object.entries(headers).forEach(([n, v]) => verbose(`Header: ${n}:${v}`));
}
