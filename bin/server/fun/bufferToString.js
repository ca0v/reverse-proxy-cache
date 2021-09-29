"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufferToString = void 0;
function bufferToString(buffer) {
    return buffer.map(v => String.fromCharCode(v)).join("");
}
exports.bufferToString = bufferToString;
//# sourceMappingURL=bufferToString.js.map