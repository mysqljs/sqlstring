/*eslint-env es6*/
var assert    = require('assert');
var tags = require('../../tags');
var test      = require('utest');

test('SqlString.tags.escapeId', {
  'value is quoted': function() {
    assert.equal('`id`', tags.escapeId `${'id'}`);
  },

  'value can be a number': function() {
    assert.equal('`42`', tags.escapeId `${42}`);
  },

  'value containing escapes is quoted': function() {
    assert.equal('`i``d`', tags.escapeId `${'i`d'}`);
  },

  'value containing separator is quoted': function() {
    assert.equal('`id1`.`id2`', tags.escapeId `${'id1.id2'}`);
  },

  'value containing separator and escapes is quoted': function() {
    assert.equal('`id``1`.`i``d2`', tags.escapeId `${'id`1.i`d2'}`);
  },

  'arrays are turned into lists': function() {
    assert.equal("`a`, `b`, `t`.`c`", tags.escapeId `${['a', 'b', 't.c']}`);
  },

  'nested arrays are flattened': function() {
    assert.equal("`a`, `b`, `t`.`c`", tags.escapeId `${['a', ['b', ['t.c']]]}`);
  }
});

test('SqlString.tags.escapeIdForbidQualified', {
  'value is quoted': function() {
    assert.equal('`id`', tags.escapeIdForbidQualified `${'id'}`);
  },

  'value can be a number': function() {
    assert.equal('`42`', tags.escapeIdForbidQualified `${42}`);
  },

  'value containing escapes is quoted': function() {
    assert.equal('`i``d`', tags.escapeIdForbidQualified `${'i`d'}`);
  },

  'value containing separator is quoted': function() {
    assert.equal('`id1.id2`', tags.escapeIdForbidQualified `${'id1.id2'}`);
  },

  'value containing separator and escapes is quoted': function() {
    assert.equal('`id``1.i``d2`', tags.escapeIdForbidQualified `${'id`1.i`d2'}`);
  },

  'arrays are turned into lists': function() {
    assert.equal("`a`, `b`, `t.c`", tags.escapeIdForbidQualified `${['a', 'b', 't.c']}`);
  },

  'nested arrays are flattened': function() {
    assert.equal("`a`, `b`, `t.c`", tags.escapeIdForbidQualified `${['a', ['b', ['t.c']]]}`);
  }
});

test('SqlString.tags.escape', {
  'question marks are replaced with escaped array values': function() {
    var sql = tags.escape `${'a'} and ${'b'}`;
    assert.equal(sql, "'a' and 'b'");
  },

  'double quest marks are ignored': function () {
    var sql = tags.escape `SELECT * FROM ?? WHERE id = ${42}`;
    assert.equal(sql, 'SELECT * FROM ?? WHERE id = 42');
  },

  'single question marks are ignored': function() {
    var sql = tags.escape `${'a'} and ?`;
    assert.equal(sql, "'a' and ?");
  },

  'question marks within values do not cause issues': function() {
    var sql = tags.escape `${'hello?'} and ${'b'}`;
    assert.equal(sql, "'hello?' and 'b'");
  },

  'undefined is converted to NULL': function () {
    var sql = tags.escape `${undefined}`;
    assert.equal(sql, 'NULL');
  },

  'objects are converted to values': function () {
    var sql = tags.escape `${{ 'hello': 'world' }}`;
    assert.equal(sql, "`hello` = 'world'");
  }
});

test('SqlString.tags.escapeStringifyObjects', {
  'question marks are replaced with escaped array values': function() {
    var sql = tags.escapeStringifyObjects `${'a'} and ${'b'}`;
    assert.equal(sql, "'a' and 'b'");
  },

  'double quest marks are ignored': function () {
    var sql = tags.escapeStringifyObjects `SELECT * FROM ?? WHERE id = ${42}`;
    assert.equal(sql, 'SELECT * FROM ?? WHERE id = 42');
  },

  'single question marks are ignored': function() {
    var sql = tags.escapeStringifyObjects `${'a'} and ?`;
    assert.equal(sql, "'a' and ?");
  },

  'question marks within values do not cause issues': function() {
    var sql = tags.escapeStringifyObjects `${'hello?'} and ${'b'}`;
    assert.equal(sql, "'hello?' and 'b'");
  },

  'undefined is converted to NULL': function () {
    var sql = tags.escapeStringifyObjects `${undefined}`;
    assert.equal(sql, 'NULL');
  },

  'objects are converted to string': function () {
    var sql = tags.escapeStringifyObjects `${{ 'hello': 'world' }}`;
    assert.equal(sql, "'[object Object]'");

    var sql = tags.escapeStringifyObjects `${{ toString: function () { return 'hello'; } }}`;
    assert.equal(sql, "'hello'");
  }
});

test('SqlString.tags.escapeWithOptions', {
  'question marks are replaced with escaped array values': function() {
    var sql = tags.escapeWithOptions(false, 'Z') `${'a'} and ${'b'}`;
    assert.equal(sql, "'a' and 'b'");

    var sql = tags.escapeWithOptions(false, '+01') `${'a'} and ${'b'}`;
    assert.equal(sql, "'a' and 'b'");
  },

  'double quest marks are ignored': function () {
    var sql = tags.escapeWithOptions(false, 'Z') `SELECT * FROM ?? WHERE id = ${42}`;
    assert.equal(sql, 'SELECT * FROM ?? WHERE id = 42');

    var sql = tags.escapeWithOptions(false, '+01') `SELECT * FROM ?? WHERE id = ${42}`;
    assert.equal(sql, 'SELECT * FROM ?? WHERE id = 42');
  },

  'single question marks are ignored': function() {
    var sql = tags.escapeWithOptions(false, 'Z') `${'a'} and ?`;
    assert.equal(sql, "'a' and ?");

    var sql = tags.escapeWithOptions(false, '+01') `${'a'} and ?`;
    assert.equal(sql, "'a' and ?");
  },

  'question marks within values do not cause issues': function() {
    var sql = tags.escapeWithOptions(false, 'Z') `${'hello?'} and ${'b'}`;
    assert.equal(sql, "'hello?' and 'b'");

    var sql = tags.escapeWithOptions(false, '+01') `${'hello?'} and ${'b'}`;
    assert.equal(sql, "'hello?' and 'b'");
  },

  'dates are converted to specified time zone "Z"': function() {
    var expected = '2012-05-07 11:42:03.002';
    var date     = new Date(Date.UTC(2012, 4, 7, 11, 42, 3, 2));
    var string   = tags.escapeWithOptions(false, 'Z') `${date}`;

    assert.strictEqual(string, "'" + expected + "'");
  },

  'dates are converted to specified time zone "+01"': function() {
    var expected = '2012-05-07 12:42:03.002';
    var date     = new Date(Date.UTC(2012, 4, 7, 11, 42, 3, 2));
    var string   = tags.escapeWithOptions(false, '+01') `${date}`;

    assert.strictEqual(string, "'" + expected + "'");
  }
});

test('SqlString.tags.generateFormatFunction', {
  'question marks are replaced with escaped array values': function() {
    var sql = (tags.generateFormatFunction `? and ?`)(['a', 'b']);
    assert.equal(sql, "'a' and 'b'");
  },

  'double quest marks are replaced with escaped id': function () {
    var sql = (tags.generateFormatFunction `SELECT * FROM ${'db.table'} WHERE id = ?`)([42]);
    assert.equal(sql, 'SELECT * FROM `db`.`table` WHERE id = 42');
  },

  'extra question marks are left untouched': function() {
    var sql = (tags.generateFormatFunction `? and ?`)(['a']);
    assert.equal(sql, "'a' and ?");
  },

  'extra arguments are not used': function() {
    var sql = (tags.generateFormatFunction `? and ?`)(['a', 'b', 'c']);
    assert.equal(sql, "'a' and 'b'");
  },

  'question marks within values do not cause issues': function() {
    var sql = (tags.generateFormatFunction `? and ?`)(['hello?', 'b']);
    assert.equal(sql, "'hello?' and 'b'");
  },

  'undefined is ignored': function () {
    var sql = (tags.generateFormatFunction `?`)(undefined, false);
    assert.equal(sql, '?');
  },

  'objects is converted to values': function () {
    var sql = (tags.generateFormatFunction `?`)({ 'hello': 'world' }, false);
    assert.equal(sql, "`hello` = 'world'");
  },

  'objects is not converted to values': function () {
    var sql = (tags.generateFormatFunction `?`)({ 'hello': 'world' }, true);
    assert.equal(sql, "'[object Object]'");

    var sql = (tags.generateFormatFunction `?`)({ toString: function () { return 'hello'; } }, true);
    assert.equal(sql, "'hello'");
  },

  'sql is untouched if values are provided but there are no placeholders': function () {
    var sql = (tags.generateFormatFunction `SELECT COUNT(*) FROM table`)(['a', 'b']);
    assert.equal(sql, 'SELECT COUNT(*) FROM table');
  }
});

test('SqlString.tags.generateFormatFunctionWithOptions(true)', {
  'question marks are replaced with escaped array values': function() {
    var sql = (tags.generateFormatFunctionWithOptions(true) `? and ?`)(['a', 'b']);
    assert.equal(sql, "'a' and 'b'");
  },

  'double quest marks are replaced with escaped id': function () {
    var sql = (tags.generateFormatFunctionWithOptions(true) `SELECT * FROM ${'db.table'} WHERE id = ?`)([42]);
    assert.equal(sql, 'SELECT * FROM `db.table` WHERE id = 42');
  },

  'extra question marks are left untouched': function() {
    var sql = (tags.generateFormatFunctionWithOptions(true) `? and ?`)(['a']);
    assert.equal(sql, "'a' and ?");
  },

  'extra arguments are not used': function() {
    var sql = (tags.generateFormatFunctionWithOptions(true) `? and ?`)(['a', 'b', 'c']);
    assert.equal(sql, "'a' and 'b'");
  },

  'question marks within values do not cause issues': function() {
    var sql = (tags.generateFormatFunctionWithOptions(true) `? and ?`)(['hello?', 'b']);
    assert.equal(sql, "'hello?' and 'b'");
  },

  'undefined is ignored': function () {
    var sql = (tags.generateFormatFunctionWithOptions(true) `?`)(undefined, false);
    assert.equal(sql, '?');
  },

  'objects is converted to values': function () {
    var sql = (tags.generateFormatFunctionWithOptions(true) `?`)({ 'hello': 'world' }, false);
    assert.equal(sql, "`hello` = 'world'");
  },

  'objects is not converted to values': function () {
    var sql = (tags.generateFormatFunctionWithOptions(true) `?`)({ 'hello': 'world' }, true);
    assert.equal(sql, "'[object Object]'");

    var sql = (tags.generateFormatFunctionWithOptions(true) `?`)({ toString: function () { return 'hello'; } }, true);
    assert.equal(sql, "'hello'");
  },

  'sql is untouched if values are provided but there are no placeholders': function () {
    var sql = (tags.generateFormatFunctionWithOptions(true) `SELECT COUNT(*) FROM table`)(['a', 'b']);
    assert.equal(sql, 'SELECT COUNT(*) FROM table');
  }
});
