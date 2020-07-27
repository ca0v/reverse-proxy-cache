/*
When making an Export request the service returns an absolute
url to the resulting image.
https://usalvwdgis1.infor.com:6443/arcgis/rest/services/IPS112/QA112AU/MapServer/export
 */

import { ProxyInfo } from "@app/server/contracts";

class Processor {
    processResponse(request: string, response: string, options: {proxyInfo: ProxyInfo}) {
        if (typeof response !== "string") return response;
        const replacements = options.proxyInfo["search-and-replace"]||{};
        Object.keys(replacements).forEach(search => {
            response = response.replace(new RegExp(search,"g"), replacements[search]);
        })
        return response;
    }
}

let processor = new Processor();

export = processor;
