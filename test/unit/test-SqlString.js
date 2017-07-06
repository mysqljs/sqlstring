var assert    = require('assert');
var SqlString = require('../../');
var test      = require('utest');

test('SqlString.escapeId', {
  'value is quoted': function() {
    assert.equal('`id`', SqlString.escapeId('id'));
  },

  'value can be a number': function() {
    assert.equal('`42`', SqlString.escapeId(42));
  },

  'value containing escapes is quoted': function() {
    assert.equal('`i``d`', SqlString.escapeId('i`d'));
  },

  'value containing separator is quoted': function() {
    assert.equal('`id1`.`id2`', SqlString.escapeId('id1.id2'));
  },

  'value containing separator and escapes is quoted': function() {
    assert.equal('`id``1`.`i``d2`', SqlString.escapeId('id`1.i`d2'));
  },

  'value containing separator is fully escaped when forbidQualified': function() {
    assert.equal('`id1.id2`', SqlString.escapeId('id1.id2', true));
  },

  'arrays are turned into lists': function() {
    assert.equal(SqlString.escapeId(['a', 'b', 't.c']), "`a`, `b`, `t`.`c`");
  },

  'nested arrays are flattened': function() {
    assert.equal(SqlString.escapeId(['a', ['b', ['t.c']]]), "`a`, `b`, `t`.`c`");
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

  'objects are turned into key value pairs': function() {
    assert.equal(SqlString.escape({a: 'b', c: 'd'}), "`a` = 'b', `c` = 'd'");
  },

  'objects function properties are ignored': function() {
    assert.equal(SqlString.escape({a: 'b', c: function() {}}), "`a` = 'b'");
  },

  'nested objects are cast to strings': function() {
    assert.equal(SqlString.escape({a: {nested: true}}), "`a` = '[object Object]'");
  },

  'arrays are turned into lists': function() {
    assert.equal(SqlString.escape([1, 2, 'c']), "1, 2, 'c'");
  },

  'nested arrays are turned into grouped lists': function() {
    assert.equal(SqlString.escape([[1,2,3], [4,5,6], ['a', 'b', {nested: true}]]), "(1, 2, 3), (4, 5, 6), ('a', 'b', '[object Object]')");
  },

  'nested objects inside arrays are cast to strings': function() {
    assert.equal(SqlString.escape([1, {nested: true}, 2]), "1, '[object Object]', 2");
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
    var string   = SqlString.escape(date, false, 'Z');

    assert.strictEqual(string, "'" + expected + "'");
  },

  'dates are converted to specified time zone "+01"': function() {
    var expected = '2012-05-07 12:42:03.002';
    var date     = new Date(Date.UTC(2012, 4, 7, 11, 42, 3, 2));
    var string   = SqlString.escape(date, false, '+01');

    assert.strictEqual(string, "'" + expected + "'");
  },

  'dates are converted to specified time zone "+0200"': function() {
    var expected = '2012-05-07 13:42:03.002';
    var date     = new Date(Date.UTC(2012, 4, 7, 11, 42, 3, 2));
    var string   = SqlString.escape(date, false, '+0200');

    assert.strictEqual(string, "'" + expected + "'");
  },

  'dates are converted to specified time zone "-05:00"': function() {
    var expected = '2012-05-07 06:42:03.002';
    var date     = new Date(Date.UTC(2012, 4, 7, 11, 42, 3, 2));
    var string   = SqlString.escape(date, false, '-05:00');

    assert.strictEqual(string, "'" + expected + "'");
  },

  'dates are converted to UTC for unknown time zone': function() {
    var date     = new Date(Date.UTC(2012, 4, 7, 11, 42, 3, 2));
    var expected = SqlString.escape(date, false, 'Z');
    var string   = SqlString.escape(date, false, 'foo');

    assert.strictEqual(string, expected);
  },

  'invalid dates are converted to null': function() {
    var date   = new Date(NaN);
    var string = SqlString.escape(date);

    assert.strictEqual(string, 'NULL');
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

  'objects is converted to values': function () {
    var sql = SqlString.format('?', { 'hello': 'world' }, false);
    assert.equal(sql, "`hello` = 'world'");
  },

  'objects is not converted to values': function () {
    var sql = SqlString.format('?', { 'hello': 'world' }, true);
    assert.equal(sql, "'[object Object]'");

    var sql = SqlString.format('?', { toString: function () { return 'hello'; } }, true);
    assert.equal(sql, "'hello'");
  },

  'sql is untouched if no values are provided': function () {
    var sql = SqlString.format('SELECT ??');
    assert.equal(sql, 'SELECT ??');
  },

  'sql is untouched if values are provided but there are no placeholders': function () {
    var sql = SqlString.format('SELECT COUNT(*) FROM table', ['a', 'b']);
    assert.equal(sql, 'SELECT COUNT(*) FROM table');
  },
  // Named placeholder tests
  'named placeholders should be replaced with values if values are provided': function () {
    var sql = SqlString.format('SELECT * FROM ::table WHERE hello = :world AND foo = :bar AND ::world IN [:worlds]', {table: 'tester', bar: 'bar', world: 'world', worlds: ['earth', 'mars']});
    assert.equal(sql, "SELECT * FROM `tester` WHERE hello = 'world' AND foo = 'bar' AND `world` IN ['earth', 'mars']");
  },

  'question mark placeholders values that contain colons do not cause issues': function() {
    var sql = SqlString.format('? and ?', [':hello', '::b']);
    assert.equal(sql, "':hello' and '::b'");
  },

  'named placeholders with values that contain colons do not cause issues': function() {
    var sql = SqlString.format(':a and ::b', {a: ':hello', b: '::b'});
    assert.equal(sql, "':hello' and `::b`");
  },

  'named placeholders with values that contain question marks do not cause issues': function() {
    var sql = SqlString.format(':a and :b', {a: 'hello?', b: 'b'});
    assert.equal(sql, "'hello?' and 'b'");
  },

  'extra named placeholders are left un-touched': function() {
    var sql = SqlString.format(':a and :b and :c and ::c and :b and ::a', {a: 'a', c: 'c'});
    assert.equal(sql, "'a' and :b and 'c' and `c` and :b and `a`");
  },

  'name placeholders are left un-touched and question marks are replace when an array is specified': function() {
    var sql = SqlString.format('SELECT * FROM ?? WHERE a = ? AND b = :b AND c = ?', ['tester', 'a', 'c']);
    assert.equal(sql, "SELECT * FROM `tester` WHERE a = 'a' AND b = :b AND c = 'c'");
  },

  'name placeholders are left un-touched and question marks are replace when a single value is specified': function() {
    var sql = SqlString.format('SELECT * FROM tester WHERE a = ? AND b = :b', 'a');
    assert.equal(sql, "SELECT * FROM tester WHERE a = 'a' AND b = :b");
  },

  'name placeholders are replace for columns': function() {
    var sql = SqlString.format('SELECT ::columns FROM ::table WHERE id = :id', {columns: ['username', 'email'], table: 'users', id: 1});
    assert.equal(sql, "SELECT `username`, `email` FROM `users` WHERE id = 1");
  }
});
