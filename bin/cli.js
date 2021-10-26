#!/usr/bin/env node
"use strict";
const [nodeExe, thisFile, ...args] = process.argv;
import { run } from "./server.js";
await run(args);
