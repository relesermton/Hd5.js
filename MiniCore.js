'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { spawnSync } = require('child_process');

class Hd2Error extends Error {
  constructor(message, code = 'HD2_ERROR') {
    super(message);
    this.name = 'Hd2Error';
    this.code = code;
  }
}

function normalizeId(filePath) {
  return path.resolve(filePath).replace(/\\/g, '/');
}

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function makeTempDir(prefix = 'hd2-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf8');
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function log(message) {
  process.stderr.write(`[Hd2] ${message}\n`);
}

function runNode(args, options = {}) {
  return spawnSync(process.execPath, args, {
    encoding: 'utf8',
    windowsHide: true,
    ...options,
  });
}

module.exports = {
  Hd2Error,
  normalizeId,
  sha256,
  ensureDir,
  makeTempDir,
  readJson,
  writeJson,
  formatBytes,
  log,
  runNode,
};
