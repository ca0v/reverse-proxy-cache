"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Db = void 0;
const sqlite3 = require("sqlite3");
const stringify_1 = require("./fun/stringify");
class Db {
    constructor(config) {
        let dbFile = config["reverse-proxy-db"];
        config.verbose && stringify_1.verbose(`loading ${dbFile}`);
        this.db = new sqlite3.Database(dbFile, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);
    }
    close() {
        this.db.close();
    }
    static async init(config) {
        let result = new Db(config);
        return new Promise((resolve, reject) => {
            return result.db.run("CREATE TABLE cache (url TEXT, res TEXT)", () => {
                resolve(result);
            }, (err) => {
                if ("" + err !== "Error: SQLITE_ERROR: table cache already exists")
                    reject(err);
                resolve(result);
            });
        });
    }
    async exists(url) {
        let cmd = this.db.prepare("SELECT res FROM cache WHERE url=?");
        let p = new Promise((resolve, reject) => {
            cmd.get(url, (err, row) => {
                err ? reject(err) : resolve(row && row.res);
                stringify_1.verbose(row ? "hit" : "miss");
            });
            cmd.finalize();
        });
        return p;
    }
    add(url, res) {
        stringify_1.verbose("db.add");
        let cmd = this.db.prepare("INSERT INTO cache VALUES (?, ?)");
        let p = new Promise((resolve, reject) => {
            cmd.run(url, res, (err) => {
                cmd.finalize();
                err ? reject(err) : resolve();
            });
        });
        return p;
    }
    delete(statusCode) {
        stringify_1.verbose("db.delete status code", statusCode);
        let cmd = this.db.prepare(`DELETE FROM cache WHERE res LIKE '%"statusCode": ${statusCode}%'`);
        let p = new Promise((resolve, reject) => {
            cmd.run((err) => {
                cmd.finalize();
                err ? reject(err) : resolve(err);
            });
        });
        return p;
    }
}
exports.Db = Db;
//# sourceMappingURL=db.js.map