'use strict';

const { parentPort } = require('worker_threads');

const stages = {
  1: require('./BundlerBuildThread1'),
  2: require('./BundlerBuildThread2'),
  3: require('./BundlerBuildThread3'),
  4: require('./BundlerBuildThread4js'),
  5: require('./BundlerBuildThread5js'),
};

if (parentPort) {
  parentPort.on('message', (job) => {
    try {
      const stage = stages[job.stage];
      if (!stage || typeof stage[job.fn] !== 'function') {
        throw new Error(`Unknown stage/fn: ${job.stage}/${job.fn}`);
      }
      const result = stage[job.fn](job.payload);
      parentPort.postMessage({ id: job.id, ok: true, result });
    } catch (error) {
      parentPort.postMessage({
        id: job.id,
        ok: false,
        error: error.message,
        code: error.code,
        stack: error.stack,
      });
    }
  });
}

module.exports = { stages };
