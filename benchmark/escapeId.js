var benchmark  = require('benchmark');
var benchmarks = require('beautify-benchmark');

global.SqlString = require('..');

var suite = new benchmark.Suite();

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
