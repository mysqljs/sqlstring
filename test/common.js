var common = exports;
var fs     = require('fs');
var mkdirp = require('mkdirp');
var path   = require('path');

// Root directory
common.root = path.resolve(__dirname, '..', (process.env.TEST_COVERAGE || ''));

// Export module
common.SqlString = require(common.root + '/index');

common.iterableSupport = isIterableSupported();

// Setup coverage hook
if (process.env.TEST_COVERAGE) {
  process.on('exit', function () {
    writeCoverage(global.__coverage__ || {});
  });
}

function writeCoverage(coverage) {
  var test = path.relative(__dirname, path.resolve(process.argv[1]));
  var ext  = path.extname(test);
  var cov  = test.substr(0, test.length - ext.length) + '.json';
  var out  = path.resolve(__dirname, '..', process.env.TEST_COVERAGE, 'test', cov);

  mkdirp.sync(path.dirname(out));

  fs.writeFileSync(out, JSON.stringify(coverage));
}

function isIterableSupported() {
  if ('function' === typeof Map && 'function' === typeof Set) return true;
  return false;
}