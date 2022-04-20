import * as sqlite from "sqlite3";
import { verbose } from "./fun/stringify.js";
import { ReverseProxyCache } from "./contracts.js";

let sqlite3 = sqlite;
sqlite3 = (<any>sqlite).default;

export interface IDb {
  exists(url: string): Promise<string | null>;
  add(url: string, res: string): void;
}

export class Db implements IDb {
  private db: sqlite.Database;

  private constructor(config: ReverseProxyCache) {
    let dbFile = config["reverse-proxy-db"];
    config.verbose && verbose(`loading ${dbFile}`);

    this.db = new sqlite3.Database(
      dbFile,
      sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
    );
  }

  close() {
    this.db.close();
  }

  static async init(config: ReverseProxyCache) {
    let result = new Db(config);
    return new Promise<Db>((resolve, reject) => {
      return result.db.run(
        "CREATE TABLE cache (url TEXT, res TEXT)",
        () => {
          resolve(result);
        },
        (err: Error | null) => {
          if ("" + err !== "Error: SQLITE_ERROR: table cache already exists")
            reject(err);
          resolve(result);
        }
      );
    });
  }

  async exists(url: string) {
    let cmd = this.db.prepare("SELECT res FROM cache WHERE url=?");
    let p = new Promise<string | null>((resolve, reject) => {
      cmd.get(url, (err: Error | null, row: any) => {
        err ? reject(err) : resolve(row && row.res);
        verbose(row ? "hit" : "miss");
      });
      cmd.finalize();
    });
    return p;
  }

  add(url: string, res: string) {
    verbose("db.add");
    let cmd = this.db.prepare("INSERT INTO cache VALUES (?, ?)");
    let p = new Promise<void>((resolve, reject) => {
      cmd.run(url, res, (err: string) => {
        cmd.finalize();
        err ? reject(err) : resolve();
      });
    });
    return p;
  }

  delete(statusCode: string) {
    verbose("db.delete status code", statusCode);
    const cmd = this.db.prepare(
      `DELETE FROM cache WHERE res LIKE '%"statusCode": ${statusCode}%'`
    );
    const p = new Promise((resolve, reject) => {
      cmd.run((err: string) => {
        cmd.finalize();
        err ? reject(err) : resolve(err);
      });
    });
    return p;
  }

  // how to return a query result?  Could be a delete, insert, select, etc.
  // purpose is simply to run any sql without needing sqlite3 cli
  async executeQuery(sqlQuery: string) {
    const cmd = this.db.prepare(sqlQuery);
    return new Promise<void>((good, bad) => {
      cmd.run((err) => {
        cmd.finalize();
        err ? bad(err) : good();
      });
    });
  }
}
