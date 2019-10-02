import * as sqlite3 from "sqlite3";
import { verbose } from "./stringify";
import { IConfig } from "./IConfig";

export class Db {
    private db: sqlite3.Database;

    private constructor(config: IConfig) {
        let dbFile = config["reverse-proxy-cache"]["reverse-proxy-db"];
        verbose(`loading ${dbFile}`);
        this.db = new sqlite3.Database(dbFile);
    }

    close() {
        // not sure how to close the connection, continually errros with `SQLITE_BUSY: unable to close due to unfinalized statements or unfinished backups`
        //this.exists("foo").then(() => this.db.close());
    }

    static async init(config: IConfig) {
        let result = new Db(config);
        return new Promise<Db>((resolve, reject) => {
            return result.db.run("CREATE TABLE cache (url TEXT, res TEXT)", () => {
                resolve(result);
            }, err => {
                if ("" + err !== "Error: SQLITE_ERROR: table cache already exists") reject(err);
                resolve(result);
            });
        });
    }

    async exists(url: string) {
        let cmd = this.db.prepare("SELECT res FROM cache WHERE url=?");
        let p = new Promise<string | null>((resolve, reject) => {
            cmd.get(url, (err, row) => {
                err ? reject(err) : resolve(row && row.res);
                verbose(row ? "hit" : "miss");
            });
        });
        return p;
    }

    add(url: string, res: string) {
        verbose("add");
        let cmd = this.db.prepare("INSERT INTO cache VALUES (?, ?)");
        let p = new Promise((resolve, reject) => {
            cmd.run(url, res, (err: string) => {
                err ? reject(err) : resolve();
            });
        });
        return p;
    }
}
