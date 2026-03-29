#!/usr/bin/env bun

import { runCli } from './index.ts';

const exitCode = await runCli(process.argv.slice(2), {
  stdout(message) {
    console.log(message);
  },
  stderr(message) {
    console.error(message);
  },
});

process.exit(exitCode);
