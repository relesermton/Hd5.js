'use strict';

const fs = require('fs');
const path = require('path');
const { normalizeId, Hd2Error } = require('./MiniCore');

const REQUIRE_PATTERN = /(?:^|[^\w$.])require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

function candidatePaths(request, fromFile) {
  const base = path.resolve(path.dirname(fromFile), request);
  return [base, `${base}.js`, `${base}.json`, path.join(base, 'index.js')];
}

function resolveLocal(request, fromFile) {
  if (!request.startsWith('.')) return null;
  for (const candidate of candidatePaths(request, fromFile)) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return normalizeId(candidate);
    }
  }
  throw new Hd2Error(`Cannot resolve '${request}' from ${fromFile}`, 'RESOLVE_FAILED');
}

function discover(payload) {
  const entry = path.resolve(payload.entry);
  if (!fs.existsSync(entry)) {
    throw new Hd2Error(`Entry file not found: ${entry}`, 'ENTRY_MISSING');
  }

  const queue = [normalizeId(entry)];
  const seen = new Set();
  const files = [];
  const externals = new Set();

  while (queue.length > 0) {
    const id = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);

    const source = fs.readFileSync(id.replace(/\//g, path.sep), 'utf8');
    const deps = [];
    let match;
    REQUIRE_PATTERN.lastIndex = 0;
    while ((match = REQUIRE_PATTERN.exec(source)) !== null) {
      const request = match[1];
      const local = resolveLocal(request, id.replace(/\//g, path.sep));
      if (local) {
        deps.push(local);
        queue.push(local);
      } else {
        externals.add(request);
      }
    }

    files.push({ id, file: id, source, deps });
  }

  return { entry: normalizeId(entry), files, externals: Array.from(externals).sort() };
}

module.exports = { discover };
