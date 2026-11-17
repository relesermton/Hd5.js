'use strict';

const path = require('path');
const fs = require('fs');
const { compile } = require('./bundler');
const { runNode, log } = require('./MiniCore');

const VERSION = '1.0.0';

async function build(options = {}) {
  if (!options.entry) throw new Error('build() requires an entry file');
  const result = await compile(path.resolve(options.entry), options);
  if (result.executable) {
    log(`Built ${result.executable.output} (${result.executable.bytes} bytes)`);
  }
  return result;
}

async function bundle(entry, options = {}) {
  return compile(path.resolve(entry), { ...options, sea: false, output: null });
}

function run(entry, args = []) {
  const result = runNode([path.resolve(entry), ...args], { stdio: 'inherit' });
  return result.status || 0;
}

function selftest() {
  const { discover } = require('./BundlerBuildThread1');
  const { transform } = require('./BundlerBuildThread2');
  const { graph } = require('./BundlerBuildThread3');
  const { emit } = require('./BundlerBuildThread4js');
  const { makeTempDir } = require('./MiniCore');

  const fixture = path.join(makeTempDir('hd2-test-'), 'entry.js');
  fs.writeFileSync(fixture, 'const x = 1;\nmodule.exports = x;\n', 'utf8');

  const discovered = discover({ entry: fixture });
  const modules = discovered.files.map((f) => transform(f));
  const gr = graph({ files: discovered.files, entry: discovered.entry });
  const out = emit({
    modules,
    order: gr.order,
    entry: discovered.entry,
    externals: discovered.externals,
    outputDir: path.dirname(fixture),
  });

  if (!fs.existsSync(out.bundlePath)) throw new Error('selftest: bundle not written');
  if (!out.code.includes('__hd2Modules')) throw new Error('selftest: runtime missing');
  return { ok: true, bundle: out.bundlePath };
}

module.exports = { VERSION, build, bundle, run, selftest };
