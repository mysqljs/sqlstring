var benchmark  = require('benchmark');
var benchmarks = require('beautify-benchmark');

global.SqlString = require('..');

var suite = new benchmark.Suite();
var arrayOf20strings = JSON.stringify(new Array(20).map(
  function (i) {
    return ('col$' + i);
}));

suite.add({
  name       : '"col"',
  minSamples : 100,
  fn         : 'var val = SqlString.escapeId("col");'
});

suite.add({
  name       : '"tbl.col"',
  minSamples : 100,
  fn         : 'var val = SqlString.escapeId("tbl.col");'
});

suite.add({
  name       : '["col1", "col2"]',
  minSamples : 100,
  fn         : 'var val = SqlString.escapeId(["col1", "col2"]);'
});

suite.add({
  name       : 'Array of 20 strings',
  minSamples : 100,
  fn         : 'var val = SqlString.escapeId(' + arrayOf20strings + ');'
});

// escapeIdFunctional
suite.add({
  name       : '"col" <Functional>',
  minSamples : 100,
  fn         : 'var val = SqlString.escapeIdFunctional("col");'
});

suite.add({
  name       : '"tbl.col" <Functional>',
  minSamples : 100,
  fn         : 'var val = SqlString.escapeIdFunctional("tbl.col");'
});

suite.add({
  name       : '["col1", "col2"] <Functional>',
  minSamples : 100,
  fn         : 'var val = SqlString.escapeIdFunctional(["col1", "col2"]);'
});

suite.add({
  name       : 'Array of 20 strings <Functional>',
  minSamples : 100,
  fn         : 'var val = SqlString.escapeIdFunctional(' + arrayOf20strings + ');'
});

// escapeIdIterative
suite.add({
  name       : '"col" <Iterative>',
  minSamples : 100,
  fn         : 'var val = SqlString.escapeIdIterative("col");'
});

suite.add({
  name       : '"tbl.col" <Iterative>',
  minSamples : 100,
  fn         : 'var val = SqlString.escapeIdIterative("tbl.col");'
});

suite.add({
  name       : '["col1", "col2"] <Iterative>',
  minSamples : 100,
  fn         : 'var val = SqlString.escapeIdIterative(["col1", "col2"]);'
});

suite.add({
  name       : 'Array of 20 strings <Iterative>',
  minSamples : 100,
  fn         : 'var val = SqlString.escapeIdIterative(' + arrayOf20strings + ');'
});

suite.on('start', function onCycle() {
  process.stdout.write('  escapeId\n\n');
});

suite.on('cycle', function onCycle(event) {
  benchmarks.add(event.target);
});

suite.on('complete', function onComplete() {
  benchmarks.log();
});

suite.run({async: false});
