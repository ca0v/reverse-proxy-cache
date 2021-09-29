"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lowercase = void 0;
function lowercase(o) {
    let result = {};
    Object.keys(o).sort().forEach(k => result[k.toLowerCase()] = o[k]);
    return result;
}
exports.lowercase = lowercase;
//# sourceMappingURL=lowercase.js.map