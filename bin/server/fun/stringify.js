"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verbose = exports.unstringify = exports.stringify = void 0;
exports.stringify = (v) => JSON.stringify(v, null, 2);
exports.unstringify = (v) => JSON.parse(v);
exports.verbose = (...v) => {
    // how to read a node global?
    console.log(...v);
};
//# sourceMappingURL=stringify.js.map