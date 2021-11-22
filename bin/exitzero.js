#!/usr/bin/env node
import { exec } from "child_process";

const cmd = process.argv.slice(2).join(" ");

const child = exec(cmd, {
  cwd: process.cwd(),
  env: process.env,
});

child.stderr.pipe(process.stderr);
child.stdout.pipe(process.stdout);
