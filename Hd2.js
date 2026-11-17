#!/usr/bin/env node
'use strict';

const path = require('path');
const { VERSION, build, bundle, selftest } = require('./main');
const { log } = require('./MiniCore');

function parseOptions(args) {
  const options = {
    entry: null,
    output: null,
    threads: 4,
    noThreads: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === '-o' || token === '--output') {
      options.output = args[++i];
    } else if (token === '-t' || token === '--threads') {
      options.threads = Number(args[++i]) || 4;
    } else if (token === '--no-threads') {
      options.noThreads = true;
    } else if (!token.startsWith('-')) {
      options.entry = token;
    }
  }
  return options;
}

function help() {
  process.stdout.write(`Hd2.js v${VERSION} - fast JavaScript to OS application compiler

Usage:
  node Hd2.js <entry.js> [-o app.exe] [-t 4]    Build a native executable
  node Hd2.js bundle <entry.js> [-o outDir]     Emit bundle.js only
  node Hd2.js selftest                          Run internal checks
  node Hd2.js version                           Print version
  node Hd2.js help                              Show this message
`);
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);

  if (!command || command === 'help' || command === '-h' || command === '--help') {
    help();
    return 0;
  }

  if (command === 'version' || command === '-v' || command === '--version') {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }

  if (command === 'selftest') {
    const result = selftest();
    process.stdout.write(`selftest passed: ${result.bundle}\n`);
    return 0;
  }

  if (command === 'bundle') {
    const options = parseOptions(rest);
    if (!options.entry) {
      log('bundle requires an entry file');
      help();
      return 2;
    }
    const result = await bundle(options.entry, {
      outputDir: options.output ? path.resolve(options.output) : undefined,
      noThreads: options.noThreads,
      threads: options.threads,
    });
    process.stdout.write(`${result.emitted.bundlePath}\n`);
    return 0;
  }

  const options = parseOptions(process.argv.slice(2));
  if (!options.entry) {
    log('build requires an entry file');
    help();
    return 2;
  }

  const output = options.output
    ? path.resolve(options.output)
    : path.resolve(path.basename(options.entry, '.js') + (process.platform === 'win32' ? '.exe' : ''));

  const result = await build({
    entry: options.entry,
    output,
    threads: options.threads,
    noThreads: options.noThreads,
  });
  process.stdout.write(`${result.executable.output}\n`);
  return 0;
}

main().then(
  (code) => { process.exitCode = code || 0; },
  (error) => {
    log(`ERROR: ${error.message}`);
    process.exitCode = 1;
  }
);
