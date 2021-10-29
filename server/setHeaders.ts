import type { IncomingMessage, ServerResponse } from "http";
import type { IncomingHttpHeaders, OutgoingHttpHeaders } from "http";
import { verbose } from "./fun/stringify.js";

export function setHeaders(value: ServerResponse | IncomingHttpHeaders | OutgoingHttpHeaders, headers: {
    "Content-Type": string;
    "Access-Control-Allow-Credentials": string;
    "Access-Control-Allow-Headers": string;
    "Access-Control-Allow-Origin": string;
    "Access-Control-Allow-Methods": string;
}) {
    if (value.setHeader) {
        const target = <ServerResponse>value;
        Object.entries(headers).forEach(([k, v]) => {
            verbose("setting header:", k, v);
            target.setHeader(k, v);
        });

    } else {
        const target = <IncomingHttpHeaders>value;
        Object.entries(headers).forEach(([k, v]) => {
            verbose("setting header:", k, v);
            target[k.toLocaleLowerCase()] = v;
        });
    }
}
