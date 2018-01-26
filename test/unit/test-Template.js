var assert    = require('assert');
var SqlString = require('../../');
var test      = require('utest');

var canRequireES6 = true;
try {
  require('./es6/canary');
} catch (ignored) {
  canRequireES6 = false;
}

if (canRequireES6) {
  require('./es6/Template');
} else {
  console.info('Skipping ES6 tests for node_version %s', process.version);

  test('Template fallback', {
    'fallback sql': function () {
      var strings = ['SELECT ', ''];
      strings.raw = ['SELECT ', ''];
      assert.throws(
        function () {
          SqlString.sql(strings, 42);
        });
    }
  });
}

var sql = SqlString.sql;

// Regardless of whether ES6 is availale, sql.calledAsTemplateTagQuick
// should return false for non-tag calling conventions.
test('sql.calledAsTemplateTagQuick', {
  'zero arguments': function () {
    assert.equal(sql.calledAsTemplateTagQuick(undefined, 0), false);
  },
  'some arguments': function () {
    assert.equal(sql.calledAsTemplateTagQuick(1, 2), false);
  },
  'string array first': function () {
    assert.equal(sql.calledAsTemplateTagQuick([''], 2), false);
  }
});
