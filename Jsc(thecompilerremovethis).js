'use strict';

/**
 * Legacy compiler stub. Kept only as a compatibility shim for old callers.
 * Do not use: the real pipeline lives in bundler.js + BundlerBuildThread*.js.
 */

function compile(source) {
  process.stderr.write(
    '[Hd2] Jsc(thecompilerremovethis).js is deprecated; use bundler.js instead.\n'
  );
  return source;
}

module.exports = { compile };
