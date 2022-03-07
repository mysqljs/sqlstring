var assert    = require('assert');
var SqlString = require('../../');
var test      = require('utest');
var vm        = require('vm');

test('SqlString.escapeId', {
  'value is quoted': function() {
    assert.equal(SqlString.escapeId('id'), '`id`');
  },

  'value can be a number': function() {
    assert.equal(SqlString.escapeId(42), '`42`');
  },

  'value can be an object': function() {
    assert.equal(SqlString.escapeId({}), '`[object Object]`');
  },

  'value toString is called': function() {
    assert.equal(SqlString.escapeId({ toString: function() { return 'foo'; } }), '`foo`');
  },

  'value toString is quoted': function() {
    assert.equal(SqlString.escapeId({ toString: function() { return 'f`oo'; } }), '`f``oo`');
  },

  'value containing escapes is quoted': function() {
    assert.equal(SqlString.escapeId('i`d'), '`i``d`');
  },

  'value containing separator is quoted': function() {
    assert.equal(SqlString.escapeId('id1.id2'), '`id1`.`id2`');
  },

  'value containing separator and escapes is quoted': function() {
    assert.equal(SqlString.escapeId('id`1.i`d2'), '`id``1`.`i``d2`');
  },

  'value containing separator is fully escaped when forbidQualified': function() {
    assert.equal(SqlString.escapeId('id1.id2', true), '`id1.id2`');
  },

  'arrays are stringified and then escaped': function() {
    assert.equal(SqlString.escapeId(['a', 'b', 'c']), '`a,b,c`');
  }
});

test('SqlString.escape', {
  'undefined -> NULL': function() {
    assert.equal(SqlString.escape(undefined), 'NULL');
  },

  'null -> NULL': function() {
    assert.equal(SqlString.escape(null), 'NULL');
  },

  'booleans convert to strings': function() {
    assert.equal(SqlString.escape(false), 'false');
    assert.equal(SqlString.escape(true), 'true');
  },

  'numbers convert to strings': function() {
    assert.equal(SqlString.escape(5), '5');
  },

  'raw not escaped': function () {
    assert.equal(SqlString.escape(SqlString.raw('NOW()')), 'NOW()');
  },

  'objects are turned into string value': function() {
    assert.equal(SqlString.escape({ 'hello': 'world' }), "'[object Object]'");
    assert.equal(SqlString.escape({ toString: function () { return 'hello'; } }), "'hello'");
  },

  'objects toSqlString is called': function() {
    assert.equal(SqlString.escape({ toSqlString: function() { return '@foo_id'; } }), '@foo_id');
  },

  'objects toSqlString is not quoted': function() {
    assert.equal(SqlString.escape({ toSqlString: function() { return 'CURRENT_TIMESTAMP()'; } }), 'CURRENT_TIMESTAMP()');
  },

  'arrays are stringified and escaped': function() {
    assert.equal(SqlString.escape([1, 2, 'c']), "'1,2,c'");
  },

  'strings are quoted': function() {
    assert.equal(SqlString.escape('Super'), "'Super'");
  },

  '\0 gets escaped': function() {
    assert.equal(SqlString.escape('Sup\0er'), "'Sup\\0er'");
    assert.equal(SqlString.escape('Super\0'), "'Super\\0'");
  },

  '\b gets escaped': function() {
    assert.equal(SqlString.escape('Sup\ber'), "'Sup\\ber'");
    assert.equal(SqlString.escape('Super\b'), "'Super\\b'");
  },

  '\n gets escaped': function() {
    assert.equal(SqlString.escape('Sup\ner'), "'Sup\\ner'");
    assert.equal(SqlString.escape('Super\n'), "'Super\\n'");
  },

  '\r gets escaped': function() {
    assert.equal(SqlString.escape('Sup\rer'), "'Sup\\rer'");
    assert.equal(SqlString.escape('Super\r'), "'Super\\r'");
  },

  '\t gets escaped': function() {
    assert.equal(SqlString.escape('Sup\ter'), "'Sup\\ter'");
    assert.equal(SqlString.escape('Super\t'), "'Super\\t'");
  },

  '\\ gets escaped': function() {
    assert.equal(SqlString.escape('Sup\\er'), "'Sup\\\\er'");
    assert.equal(SqlString.escape('Super\\'), "'Super\\\\'");
  },

  '\u001a (ascii 26) gets replaced with \\Z': function() {
    assert.equal(SqlString.escape('Sup\u001aer'), "'Sup\\Zer'");
    assert.equal(SqlString.escape('Super\u001a'), "'Super\\Z'");
  },

  'single quotes get escaped': function() {
    assert.equal(SqlString.escape('Sup\'er'), "'Sup\\'er'");
    assert.equal(SqlString.escape('Super\''), "'Super\\''");
  },

  'double quotes get escaped': function() {
    assert.equal(SqlString.escape('Sup"er'), "'Sup\\\"er'");
    assert.equal(SqlString.escape('Super"'), "'Super\\\"'");
  },

  'dates are converted to YYYY-MM-DD HH:II:SS.sss': function() {
    var expected = '2012-05-07 11:42:03.002';
    var date     = new Date(2012, 4, 7, 11, 42, 3, 2);
    var string   = SqlString.escape(date);

    assert.strictEqual(string, "'" + expected + "'");
  },

  'dates are converted to specified time zone "Z"': function() {
    var expected = '2012-05-07 11:42:03.002';
    var date     = new Date(Date.UTC(2012, 4, 7, 11, 42, 3, 2));
    var string   = SqlString.escape(date, 'Z');

    assert.strictEqual(string, "'" + expected + "'");
  },

  'dates are converted to specified time zone "+01"': function() {
    var expected = '2012-05-07 12:42:03.002';
    var date     = new Date(Date.UTC(2012, 4, 7, 11, 42, 3, 2));
    var string   = SqlString.escape(date, '+01');

    assert.strictEqual(string, "'" + expected + "'");
  },

  'dates are converted to specified time zone "+0200"': function() {
    var expected = '2012-05-07 13:42:03.002';
    var date     = new Date(Date.UTC(2012, 4, 7, 11, 42, 3, 2));
    var string   = SqlString.escape(date, '+0200');

    assert.strictEqual(string, "'" + expected + "'");
  },

  'dates are converted to specified time zone "-05:00"': function() {
    var expected = '2012-05-07 06:42:03.002';
    var date     = new Date(Date.UTC(2012, 4, 7, 11, 42, 3, 2));
    var string   = SqlString.escape(date, '-05:00');

    assert.strictEqual(string, "'" + expected + "'");
  },

  'dates are converted to UTC for unknown time zone': function() {
    var date     = new Date(Date.UTC(2012, 4, 7, 11, 42, 3, 2));
    var expected = SqlString.escape(date, 'Z');
    var string   = SqlString.escape(date, 'foo');

    assert.strictEqual(string, expected);
  },

  'invalid dates are converted to null': function() {
    var date   = new Date(NaN);
    var string = SqlString.escape(date);

    assert.strictEqual(string, 'NULL');
  },

  'dates from other isolates are converted': function() {
    var expected = '2012-05-07 11:42:03.002';
    var date     = vm.runInNewContext('new Date(2012, 4, 7, 11, 42, 3, 2)');
    var string   = SqlString.escape(date);

    assert.strictEqual(string, "'" + expected + "'");
  },

  'buffers are converted to hex': function() {
    var buffer = new Buffer([0, 1, 254, 255]);
    var string = SqlString.escape(buffer);

    assert.strictEqual(string, "X'0001feff'");
  },

  'buffers object cannot inject SQL': function() {
    var buffer = new Buffer([0, 1, 254, 255]);
    buffer.toString = function() { return "00' OR '1'='1"; };
    var string = SqlString.escape(buffer);

    assert.strictEqual(string, "X'00\\' OR \\'1\\'=\\'1'");
  },

  'NaN -> NaN': function() {
    assert.equal(SqlString.escape(NaN), 'NaN');
  },

  'Infinity -> Infinity': function() {
    assert.equal(SqlString.escape(Infinity), 'Infinity');
  }
});

test('SqlString.format', {
  'question marks are replaced with escaped array values': function() {
    var sql = SqlString.format('? and ?', ['a', 'b']);
    assert.equal(sql, "'a' and 'b'");
  },

  'double quest marks are replaced with escaped id': function () {
    var sql = SqlString.format('SELECT * FROM ?? WHERE id = ?', ['table', 42]);
    assert.equal(sql, 'SELECT * FROM `table` WHERE id = 42');
  },

  'triple question marks are ignored': function () {
    var sql = SqlString.format('? or ??? and ?', ['foo', 'bar', 'fizz', 'buzz']);
    assert.equal(sql, "'foo' or ??? and 'bar'");
  },

  'extra question marks are left untouched': function() {
    var sql = SqlString.format('? and ?', ['a']);
    assert.equal(sql, "'a' and ?");
  },

  'extra arguments are not used': function() {
    var sql = SqlString.format('? and ?', ['a', 'b', 'c']);
    assert.equal(sql, "'a' and 'b'");
  },

  'question marks within values do not cause issues': function() {
    var sql = SqlString.format('? and ?', ['hello?', 'b']);
    assert.equal(sql, "'hello?' and 'b'");
  },

  'undefined is ignored': function () {
    var sql = SqlString.format('?', undefined, false);
    assert.equal(sql, '?');
  },

  'objects is converted to string value': function () {
    var sql = SqlString.format('?', { 'hello': 'world' }, false);
    assert.equal(sql, "'[object Object]'");

    var sql = SqlString.format('?', { toString: function () { return 'hello'; } }, true);
    assert.equal(sql, "'hello'");

    var sql = SqlString.format('?', { toSqlString: function () { return '@foo'; } }, true);
    assert.equal(sql, '@foo');
  },

  'sql is untouched if no values are provided': function () {
    var sql = SqlString.format('SELECT ??');
    assert.equal(sql, 'SELECT ??');
  },

  'sql is untouched if values are provided but there are no placeholders': function () {
    var sql = SqlString.format('SELECT COUNT(*) FROM table', ['a', 'b']);
    assert.equal(sql, 'SELECT COUNT(*) FROM table');
  }
});

test('SqlString.raw', {
  'creates object': function() {
    assert.equal(typeof SqlString.raw('NOW()'), 'object');
  },

  'rejects number': function() {
    assert.throws(function () {
      SqlString.raw(42);
    });
  },

  'rejects undefined': function() {
    assert.throws(function () {
      SqlString.raw();
    });
  },

  'object has toSqlString': function() {
    assert.equal(typeof SqlString.raw('NOW()').toSqlString, 'function');
  },

  'toSqlString returns sql as-is': function() {
    assert.equal(SqlString.raw("NOW() AS 'current_time'").toSqlString(), "NOW() AS 'current_time'");
  }
});
