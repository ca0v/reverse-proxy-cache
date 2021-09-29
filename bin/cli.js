#!/usr/bin/env node
"use strict";
const [nodeExe, thisFile, ...args] = process.argv;
require("./server.js").run(args);
