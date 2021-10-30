import { ServerResponse } from "http";
import type { OutgoingHttpHeaders } from "http";
import { verbose } from "./fun/stringify.js";

export function setHeaders(target: ServerResponse, headers: OutgoingHttpHeaders) {
    Object.entries(headers).forEach(([k, v]) => {
        verbose(`setHeader("${k}", "${v}")`);
        target.setHeader(k.toLocaleLowerCase(), v!);
    });
}

export function removeHeader(target: ServerResponse, header: string) {
    target.removeHeader(header);
}

export function getHeader(target: ServerResponse | object, header: string, fallback = ""): string {
    if (target instanceof ServerResponse) {
        const name = target.getHeaderNames().find(name => {
            console.log(name);
            return name.toLocaleLowerCase() == header.toLocaleLowerCase();
        });
        if (name) return <string>target.getHeader(name);
    } else {
        const name = Object.getOwnPropertyNames(target).find(name => {
            console.log(name);
            return name.toLocaleLowerCase() == header.toLocaleLowerCase();
        });
        if (name) return <string>(<any>target)[name];
    }
    if (!!fallback) {
        console.log("fallback", header, Object.getOwnPropertyNames(target))
        return fallback;
    }
    throw `header ${header} not found`;
}