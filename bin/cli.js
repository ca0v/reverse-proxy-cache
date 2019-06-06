#!/usr/bin/env node

"use strict";
const fs = require("fs");
const args = process.argv.slice(2);
let gatewayFile = args[0] || "package.json";
if (!fs.existsSync(gatewayFile)) throw "file not found: " + gatewayFile;
const config = JSON.parse(fs.readFileSync(gatewayFile) + "");
require("./server.js")(config);
