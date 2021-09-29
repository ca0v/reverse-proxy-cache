"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteSystemPlugin = void 0;
const url = require("url");
class DeleteSystemPlugin {
    constructor(server) {
        this.server = server;
    }
    process(req, res) {
        if (req.method !== "GET")
            return false;
        const { query } = url.parse(req.url || "", true);
        if (!query.delete)
            return false;
        const cache = this.server.cache;
        cache
            .delete(query.delete)
            .catch((err) => {
            console.log(err);
            res.write(JSON.stringify(err));
            res.end();
        })
            .then(() => {
            console.log("ok");
            res.write(`deleting where status code is ${query.delete}`);
            res.end();
        });
        return true;
    }
}
exports.DeleteSystemPlugin = DeleteSystemPlugin;
//# sourceMappingURL=DeleteSystemPlugin.js.map