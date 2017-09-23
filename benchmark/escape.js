var benchmark  = require('benchmark');
var benchmarks = require('beautify-benchmark');

global.SqlString = require('..');

global.arr  = [ 42, 'foobar' ];
global.buf  = new Buffer('foobar');
global.date = new Date(0);
global.func = { toSqlString: function () { return 'NOW()'; } };
global.num  = 42;
global.obj  = { foo: 'bar' };
global.str  = 'foobar';

var suite = new benchmark.Suite();

suite.add({
  name       : 'array',
  minSamples : 100,
  fn         : 'var val = SqlString.escape(arr);'
});

suite.add({
  name       : 'boolean',
  minSamples : 100,
  fn         : 'var val = SqlString.escape(true);'
});

suite.add({
  name       : 'date',
  minSamples : 100,
  fn         : 'var val = SqlString.escape(date);'
});

suite.add({
  name       : 'function',
  minSamples : 100,
  fn         : 'var val = SqlString.escape(func);'
});

suite.add({
  name       : 'null',
  minSamples : 100,
  fn         : 'var val = SqlString.escape(null);'
});

suite.add({
  name       : 'number',
  minSamples : 100,
  fn         : 'var val = SqlString.escape(num);'
});

suite.add({
  name       : 'object',
  minSamples : 100,
  fn         : 'var val = SqlString.escape(obj);'
});

suite.add({
  name       : 'string',
  minSamples : 100,
  fn         : 'var val = SqlString.escape(str);'
});

suite.on('start', function onCycle() {
  process.stdout.write('  escape\n\n');
});

suite.on('cycle', function onCycle(event) {
  benchmarks.add(event.target);
});

suite.on('complete', function onComplete() {
  benchmarks.log();
});

suite.run({async: false});
