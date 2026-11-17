'use strict';

const path = require('path');
const { Worker } = require('worker_threads');
const { stages } = require('./ThreadCore');

class ThreadPool {
  constructor(size = 4) {
    this.size = Math.max(1, size);
    this.file = path.join(__dirname, 'ThreadCore.js');
    this.workers = [];
    this.next = 0;
    this.pending = new Map();
    this.sequence = 0;
  }

  spawn() {
    const worker = new Worker(this.file);
    worker.on('message', (message) => {
      const entry = this.pending.get(message.id);
      if (!entry) return;
      this.pending.delete(message.id);
      if (message.ok) entry.resolve(message.result);
      else {
        const error = new Error(message.error);
        error.code = message.code;
        error.stack = message.stack;
        entry.reject(error);
      }
    });
    worker.on('error', (error) => {
      for (const entry of this.pending.values()) entry.reject(error);
      this.pending.clear();
    });
    this.workers.push(worker);
    return worker;
  }

  getWorker() {
    if (this.workers.length < this.size) return this.spawn();
    const worker = this.workers[this.next % this.workers.length];
    this.next += 1;
    return worker;
  }

  dispatch(stage, fn, payload) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.getWorker().postMessage({ id, stage, fn, payload });
    });
  }

  async map(stage, fn, items) {
    return Promise.all(items.map((item) => this.dispatch(stage, fn, item)));
  }

  close() {
    for (const worker of this.workers) worker.terminate();
    this.workers = [];
    this.pending.clear();
  }
}

function localDispatch(stage, fn, payload) {
  const target = stages[stage];
  if (!target || typeof target[fn] !== 'function') {
    throw new Error(`Unknown stage/fn: ${stage}/${fn}`);
  }
  return target[fn](payload);
}

module.exports = { ThreadPool, localDispatch };
