var canRequireES6 = true;
try {
  require('./es6/canary');
} catch (ignored) {
  canRequireES6 = false;
}

if (canRequireES6) {
  require('./es6/Lexer');
} else {
  console.info('Skipping ES6 tests for node_version %s', process.version);
}
