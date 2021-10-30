import * as http from "http";
import { verbose } from "../server/fun/stringify.js";

export function dumpHeaders(headers: http.OutgoingHttpHeaders) {
    verbose("HEADERS");
    Object.entries(headers).sort(([k1], [k2]) => k1.localeCompare(k2)).forEach(([n, v]) => verbose(`Header: ${n}=${v}`));
}
