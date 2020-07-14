"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBinaryMimeType = void 0;
function isBinaryMimeType(mimeType) {
    return ["image/"].some(v => mimeType.startsWith(v));
}
exports.isBinaryMimeType = isBinaryMimeType;
//# sourceMappingURL=isBinaryMimeType.js.map