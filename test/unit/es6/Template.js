// This file uses es6 features and is loaded conditionally.

var assert    = require('assert');
var SqlString = require('../../../');
var test      = require('utest');

var sql = SqlString.sql;

function runTagTest (golden, test) {
  // Run multiply to test memoization bugs.
  for (let i = 3; --i >= 0;) {
    let result = test();
    if (typeof result.toSqlString !== 'string') {
      result = result.toSqlString();
    } else {
      throw new Error(`Expected raw not ${result}`);
    }
    assert.equal(result, golden);
  }
}

test('template tag', {
  'numbers': function () {
    runTagTest(
      'SELECT 2',
      () => sql`SELECT ${1 + 1}`);
  },
  'date': function () {
    const date = new Date(Date.UTC(2000, 0, 1, 0, 0, 0));
    runTagTest(
      `SELECT '2000-01-01 00:00:00.000'`,
      () => sql({ timeZone: 'GMT' })`SELECT ${date}`);
  },
  'string': function () {
    runTagTest(
      `SELECT 'Hello, World!\\n'`,
      () => sql`SELECT ${'Hello, World!\n'}`);
  },
  'stringify': function () {
    const obj = {
      Hello    : 'World!',
      toString : function () {
        return 'Hello, World!';
      }
    };
    runTagTest(
      `SELECT 'Hello, World!'`,
      () => sql({ stringifyObjects: true })`SELECT ${obj}`);
    runTagTest(
      'SELECT * FROM t WHERE `Hello` = \'World!\'',
      () => sql({ stringifyObjects: false })`SELECT * FROM t WHERE ${obj}`);
  },
  'identifier': function () {
    runTagTest(
      'SELECT `foo`',
      () => sql`SELECT ${SqlString.identifier('foo')}`);
  },
  'blob': function () {
    runTagTest(
      'SELECT "\x1f8p\xbe\\\'OlI\xb3\xe3\\Z\x0cg(\x95\x7f"',
      () =>
        sql`SELECT "${Buffer.from('1f3870be274f6c49b3e31a0c6728957f', 'hex')}"`
    );
  },
  'null': function () {
    runTagTest(
      'SELECT NULL',
      () =>
        sql`SELECT ${null}`
    );
  },
  'undefined': function () {
    runTagTest(
      'SELECT NULL',
      () =>
        sql`SELECT ${undefined}`
    );
  },
  'negative zero': function () {
    runTagTest(
      'SELECT (1 / 0)',
      () =>
        sql`SELECT (1 / ${-0})`
    );
  },
  'raw': function () {
    const raw = SqlString.raw('1 + 1');
    runTagTest(
      `SELECT 1 + 1`,
      () => sql`SELECT ${raw}`);
  },
  'string in dq string': function () {
    runTagTest(
      `SELECT "Hello, World!\\n"`,
      () => sql`SELECT "Hello, ${'World!'}\n"`);
  },
  'string in sq string': function () {
    runTagTest(
      `SELECT 'Hello, World!\\n'`,
      () => sql`SELECT 'Hello, ${'World!'}\n'`);
  },
  'string after string in string': function () {
    // The following tests check obliquely that '?' is not
    // interpreted as a prepared statement meta-character
    // internally.
    runTagTest(
      `SELECT 'Hello', "World?"`,
      () => sql`SELECT '${'Hello'}', "World?"`);
  },
  'string before string in string': function () {
    runTagTest(
      `SELECT 'Hello?', 'World?'`,
      () => sql`SELECT 'Hello?', '${'World?'}'`);
  },
  'number after string in string': function () {
    runTagTest(
      `SELECT 'Hello?', 123`,
      () => sql`SELECT '${'Hello?'}', ${123}`);
  },
  'number before string in string': function () {
    runTagTest(
      `SELECT 123, 'World?'`,
      () => sql`SELECT ${123}, '${'World?'}'`);
  },
  'string in identifier': function () {
    runTagTest(
      'SELECT `foo`',
      () => sql`SELECT \`${'foo'}\``);
  },
  'identifier in identifier': function () {
    runTagTest(
      'SELECT `foo`',
      () => sql`SELECT \`${SqlString.identifier('foo')}\``);
  },
  'plain quoted identifier': function () {
    runTagTest(
      'SELECT `ID`',
      () => sql`SELECT \`ID\``);
  },
  'backquotes in identifier': function () {
    runTagTest(
      'SELECT `\\\\`',
      () => sql`SELECT \`\\\``);
    const strings = ['SELECT `\\\\`'];
    strings.raw = strings.slice();
    runTagTest('SELECT `\\\\`', () => sql(strings));
  },
  'backquotes in strings': function () {
    runTagTest(
      'SELECT "`\\\\", \'`\\\\\'',
      () => sql`SELECT "\`\\", '\`\\'`);
  },
  'number in identifier': function () {
    runTagTest(
      'SELECT `foo_123`',
      () => sql`SELECT \`foo_${123}\``);
  },
  'array': function () {
    const id = SqlString.identifier('foo');
    const frag = SqlString.raw('1 + 1');
    const values = [ 123, 'foo', id, frag ];
    runTagTest(
      "SELECT X FROM T WHERE X IN (123, 'foo', `foo`, 1 + 1)",
      () => sql`SELECT X FROM T WHERE X IN (${values})`);
  },
  'unclosed-sq': function () {
    assert.throws(() => sql`SELECT '${'foo'}`);
  },
  'unclosed-dq': function () {
    assert.throws(() => sql`SELECT "foo`);
  },
  'unclosed-bq': function () {
    assert.throws(() => sql`SELECT \`${'foo'}`);
  },
  'unclosed-comment': function () {
    // Ending in a comment is a concatenation hazard.
    // See comments in lib/es6/Lexer.js.
    assert.throws(() => sql`SELECT (${0}) -- comment`);
  },
  'merge-word-string': function () {
    runTagTest(
      `SELECT utf8'foo'`,
      () => sql`SELECT utf8${'foo'}`);
  },
  'merge-string-string': function () {
    runTagTest(
      // Adjacent string tokens are concatenated, but 'a''b' is a
      // 3-char string with a single-quote in the middle.
      `SELECT 'a' 'b'`,
      () => sql`SELECT ${'a'}${'b'}`);
  },
  'merge-bq-bq': function () {
    runTagTest(
      'SELECT `a` `b`',
      () => sql`SELECT ${SqlString.identifier('a')}${SqlString.identifier('b')}`);
  },
  'merge-static-string-string': function () {
    runTagTest(
      `SELECT 'a' 'b'`,
      () => sql`SELECT 'a'${'b'}`);
  },
  'merge-string-static-string': function () {
    runTagTest(
      `SELECT 'a' 'b'`,
      () => sql`SELECT ${'a'}'b'`);
  },
  'not-a-merge-hazard': function () {
    runTagTest(
      `SELECT 'a''b'`,
      () => sql`SELECT 'a''b'`);
  }
});
