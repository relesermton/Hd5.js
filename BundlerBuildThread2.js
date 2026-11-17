'use strict';

const vm = require('vm');
const { sha256, Hd2Error } = require('./MiniCore');

function transform(payload) {
  const { id, file, source } = payload;
  const stripped = source.replace(/^#![^\r\n]*\r?\n/, '');

  try {
    new vm.Script(stripped, { filename: file });
  } catch (error) {
    throw new Hd2Error(`Syntax error in ${file}: ${error.message}`, 'SYNTAX_ERROR');
  }

  return {
    id,
    file,
    source: stripped,
    hash: sha256(stripped),
    bytes: Buffer.byteLength(stripped, 'utf8'),
  };
}

module.exports = { transform };
