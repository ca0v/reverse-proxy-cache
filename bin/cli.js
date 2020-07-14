#!/usr/bin/env node

"use strict";
const args = process.argv.slice(2);
require("./server.js").run(args);
