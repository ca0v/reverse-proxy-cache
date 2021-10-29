import { IncomingHttpHeaders, OutgoingHttpHeaders } from "http";
import { verbose } from "./fun/stringify.js";

export function setHeaders(value: IncomingHttpHeaders | OutgoingHttpHeaders, headers: {
    "Content-Type": string;
    "Access-Control-Allow-Credentials": string;
    "Access-Control-Allow-Headers": string;
    "Access-Control-Allow-Origin": string;
    "Access-Control-Allow-Methods": string;
}) {
    Object.entries(headers).forEach(([k, v]) => {
        verbose("setting header:", k, v);
        value[k.toLocaleLowerCase()] = v;
    });
}
