'use strict';

const { Hd2Error } = require('./MiniCore');

function graph(payload) {
  const { files, entry } = payload;
  const ids = new Set(files.map((file) => file.id));
  const deps = new Map();

  for (const file of files) {
    deps.set(file.id, file.deps.filter((dep) => ids.has(dep)));
  }

  const order = [];
  const state = new Map();

  function visit(id, stack) {
    const current = state.get(id) || 0;
    if (current === 2) return;
    if (current === 1) {
      throw new Hd2Error(
        `Circular dependency: ${stack.concat(id).join(' -> ')}`,
        'CIRCULAR_DEPENDENCY'
      );
    }
    state.set(id, 1);
    for (const dep of deps.get(id) || []) {
      visit(dep, stack.concat(id));
    }
    state.set(id, 2);
    order.push(id);
  }

  visit(entry, []);
  for (const id of ids) visit(id, []);

  return { order, deps: Object.fromEntries(deps) };
}

module.exports = { graph };
