import got from "got";
import http from "http";
import sqlite3 from "sqlite3";
import config from "./serverconfig";

let stringify = (v: Object) => JSON.stringify(v, null, 2);

// rejectUnauthorized
//process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

class Db {
	private db: sqlite3.Database;
	constructor(fileName = ":memory:") {
		let db = (this.db = new sqlite3.Database(fileName));
		db.run(
			"CREATE TABLE cache (url TEXT, res TEXT)",
			() => {},
			err => {
				console.warn(err);
			}
		);
	}

	async exists(url: string) {
		let cmd = this.db.prepare("SELECT res FROM cache WHERE url=?");
		let p = new Promise<string | null>((resolve, reject) => {
			cmd.get(url, (err, row) => {
				console.log(err, row);
				err ? reject(err) : resolve(row && row.res);
			});
		});
		return p;
	}

	add(url: string, res: string) {
		let cmd = this.db.prepare("INSERT INTO cache VALUES (?, ?)");
		let p = new Promise((resolve, reject) => {
			cmd.run(url, res, (err: string) => {
				err ? reject(err) : resolve();
			});
		});
		return p;
	}
}

class Proxy {
	constructor() {
		// nothing to do
	}

	proxy(url: string) {
		let match = config["reverse-proxy"].find(v => {
			return url.startsWith(v.baseUri);
		});
		if (!match) return url;
		return url.replace(match.baseUri, match.proxyUri);
	}
}

let cache = new Db(config.cacheName);
let proxy = new Proxy();

let server = http.createServer(async (req, res) => {
	let url = req.url || "";

	let exists = await cache.exists(url);
	if (!!exists) {
		res.writeHead(200, { "Content-Type": "text/plain" });
		res.write(exists);
		res.end();
	} else {
		let proxyurl = proxy.proxy(url);
		console.log("proxyurl: ", proxyurl);

		try {
			if (proxyurl === url) {
				throw "no configuration found for this endpoint";
			}
			let result = await got(proxyurl, {
				rejectUnauthorized: false
			});
			res.writeHead(200, { "Content-Type": "text/plain" });
			res.write(result.body);
			res.end();
			cache.add(url, result.body);
		} catch (ex) {
			console.log(ex);
			res.writeHead(500, { "Content-Type": "text/plain" });
			res.write("error");
			res.end();
		}
	}
});

server.listen(9000);
