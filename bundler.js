'use strict';

const path = require('path');
const { ThreadPool, localDispatch } = require('./multiPthreadOnbundler');
const { makeTempDir, log, formatBytes } = require('./MiniCore');

async function compile(entry, options = {}) {
  const threads = options.threads || 4;
  const outputDir = options.outputDir || makeTempDir('hd2-build-');
  const pool = options.noThreads ? null : new ThreadPool(threads);
  const call = async (stage, fn, payload) =>
    pool ? pool.dispatch(stage, fn, payload) : localDispatch(stage, fn, payload);
  const map = async (stage, fn, items) =>
    pool ? pool.map(stage, fn, items) : items.map((item) => localDispatch(stage, fn, item));

  try {
    log(`Stage 1/5: discovering dependencies from ${path.basename(entry)}`);
    const discovered = await call(1, 'discover', { entry });

    log(`Stage 2/5: transforming ${discovered.files.length} module(s) across ${threads} thread(s)`);
    const modules = await map(2, 'transform', discovered.files);

    log('Stage 3/5: building dependency graph');
    const graph = await call(3, 'graph', {
      files: discovered.files,
      entry: discovered.entry,
    });

    log('Stage 4/5: emitting bundle');
    const emitted = await call(4, 'emit', {
      modules,
      order: graph.order,
      entry: discovered.entry,
      externals: discovered.externals,
      outputDir,
    });
    log(`Bundle size: ${formatBytes(emitted.manifest.bundleBytes)}`);

    let executable = null;
    if (options.sea !== false && options.output) {
      log('Stage 5/5: building OS executable');
      executable = await call(5, 'buildExecutable', {
        bundlePath: emitted.bundlePath,
        outputDir,
        output: options.output,
      });
    }

    return {
      discovered,
      modules,
      graph,
      emitted,
      executable,
      outputDir,
    };
  } finally {
    if (pool) pool.close();
  }
}

module.exports = { compile };
