#!/usr/bin/env node

import { runCli } from "./index.js";

const exitCode = await runCli(process.argv.slice(2), {
  stdout(message) {
    console.log(message);
  },
  stderr(message) {
    console.error(message);
  },
});

process.exit(exitCode);
