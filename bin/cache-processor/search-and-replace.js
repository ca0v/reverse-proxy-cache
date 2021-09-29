"use strict";
/*
When making an Export request the service returns an absolute
url to the resulting image.
https://usalvwdgis1.infor.com:6443/arcgis/rest/services/IPS112/QA112AU/MapServer/export
 */
class Processor {
    processResponse(request, response, options) {
        if (typeof response !== "string")
            return response;
        const replacements = options.proxyPass["search-and-replace"] || {};
        Object.keys(replacements).forEach((search) => {
            response = response.replace(new RegExp(search, "g"), replacements[search]);
        });
        return response;
    }
}
let processor = new Processor();
module.exports = processor;
//# sourceMappingURL=search-and-replace.js.map