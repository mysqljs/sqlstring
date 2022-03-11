# sqlstring

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![Node.js Version][node-image]][node-url]
[![Build Status][github-actions-ci-image]][github-actions-ci-url]
[![Coverage Status][coveralls-image]][coveralls-url]

Simple SQL escape and format for MySQL

## Install

```sh
$ npm install sqlstring
```

## Usage


```js
var SqlString = require('sqlstring');
```

### Escaping query values

**Caution** These methods of escaping values only works when the
[NO_BACKSLASH_ESCAPES](https://dev.mysql.com/doc/refman/5.7/en/sql-mode.html#sqlmode_no_backslash_escapes)
SQL mode is disabled (which is the default state for MySQL servers).

**Caution** This library performs client-side escaping, as this is a library
to generate SQL strings on the client side. The syntax for functions like
`SqlString.format` may look similar to a prepared statement, but it is not
and the escaping rules from this module are used to generate a resulting SQL
string. The purpose of escaping input is to avoid SQL Injection attacks.
In order to support enhanced support like `SET` and `IN` formatting, this
module will escape based on the shape of the passed in JavaScript value,
and the resulting escaped string may be more than a single value. When
structured user input is provided as the value to escape, care should be taken
to validate the shape of the input to validate the output will be what is
expected.

In order to avoid SQL Injection attacks, you should always escape any user
provided data before using it inside a SQL query. You can do so using the
`SqlString.escape()` method:

```js
var userId = 'some user provided value';
var sql    = 'SELECT * FROM users WHERE id = ' + SqlString.escape(userId);
console.log(sql); // SELECT * FROM users WHERE id = 'some user provided value'
```

Alternatively, you can use `?` characters as placeholders for values you would
like to have escaped like this:

```js
var userId = 1;
var sql    = SqlString.format('SELECT * FROM users WHERE id = ?', [userId]);
console.log(sql); // SELECT * FROM users WHERE id = 1
```

Multiple placeholders are mapped to values in the same order as passed. For example,
in the following query `foo` equals `a`, `bar` equals `b`, `baz` equals `c`, and
`id` will be `userId`:

```js
var userId = 1;
var sql    = SqlString.format('UPDATE users SET foo = ?, bar = ?, baz = ? WHERE id = ?',
  ['a', 'b', 'c', userId]);
console.log(sql); // UPDATE users SET foo = 'a', bar = 'b', baz = 'c' WHERE id = 1
```

This looks similar to prepared statements in MySQL, however it really just uses
the same `SqlString.escape()` method internally.

**Caution** This also differs from prepared statements in that all `?` are
replaced, even those contained in comments and strings.

Different value types are escaped differently, here is how:

* Numbers are left untouched
* Booleans are converted to `true` / `false`
* Date objects are converted to `'YYYY-mm-dd HH:ii:ss'` strings
* Buffers are converted to hex strings, e.g. `X'0fa5'`
* Strings are safely escaped
* Arrays are turned into list, e.g. `['a', 'b']` turns into `'a', 'b'`
* Nested arrays are turned into grouped lists (for bulk inserts), e.g. `[['a',
  'b'], ['c', 'd']]` turns into `('a', 'b'), ('c', 'd')`
* Objects that have a `toSqlString` method will have `.toSqlString()` called
  and the returned value is used as the raw SQL.
* Objects are turned into `key = 'val'` pairs for each enumerable property on
  the object. If the property's value is a function, it is skipped; if the
  property's value is an object, toString() is called on it and the returned
  value is used.
* `undefined` / `null` are converted to `NULL`
* `NaN` / `Infinity` are left as-is. MySQL does not support these, and trying
  to insert them as values will trigger MySQL errors until they implement
  support.

You may have noticed that this escaping allows you to do neat things like this:

```js
var post  = {id: 1, title: 'Hello MySQL'};
var sql = SqlString.format('INSERT INTO posts SET ?', post);
console.log(sql); // INSERT INTO posts SET `id` = 1, `title` = 'Hello MySQL'
```

And the `toSqlString` method allows you to form complex queries with functions:

```js
var CURRENT_TIMESTAMP = { toSqlString: function() { return 'CURRENT_TIMESTAMP()'; } };
var sql = SqlString.format('UPDATE posts SET modified = ? WHERE id = ?', [CURRENT_TIMESTAMP, 42]);
console.log(sql); // UPDATE posts SET modified = CURRENT_TIMESTAMP() WHERE id = 42
```

To generate objects with a `toSqlString` method, the `SqlString.raw()` method can
be used. This creates an object that will be left un-touched when used in a `?`
placeholder, useful for using functions as dynamic values:

**Caution** The string provided to `SqlString.raw()` will skip all escaping
functions when used, so be careful when passing in unvalidated input.

Similarly, `SqlString.identifier(id, forbidQualified)` creates an object with a
`toSqlString` method that returns `SqlString.escapeId(id, forbidQualified)`.
Its result is not re-escaped when used in a `?` or `??` placeholder.

```js
var CURRENT_TIMESTAMP = SqlString.raw('CURRENT_TIMESTAMP()');
var sql = SqlString.format('UPDATE posts SET modified = ? WHERE id = ?', [CURRENT_TIMESTAMP, 42]);
console.log(sql); // UPDATE posts SET modified = CURRENT_TIMESTAMP() WHERE id = 42
```

If you feel the need to escape queries by yourself, you can also use the escaping
function directly:

```js
var sql = 'SELECT * FROM posts WHERE title=' + SqlString.escape('Hello MySQL');
console.log(sql); // SELECT * FROM posts WHERE title='Hello MySQL'
```

### Escaping query identifiers

If you can't trust an SQL identifier (database / table / column name) because it is
provided by a user, you should escape it with `SqlString.escapeId(identifier)` like this:

```js
var sorter = 'date';
var sql    = 'SELECT * FROM posts ORDER BY ' + SqlString.escapeId(sorter);
console.log(sql); // SELECT * FROM posts ORDER BY `date`
```

It also supports adding qualified identifiers. It will escape both parts.

```js
var sorter = 'date';
var sql    = 'SELECT * FROM posts ORDER BY ' + SqlString.escapeId('posts.' + sorter);
console.log(sql); // SELECT * FROM posts ORDER BY `posts`.`date`
```

If you do not want to treat `.` as qualified identifiers, you can set the second
argument to `true` in order to keep the string as a literal identifier:

```js
var sorter = 'date.2';
var sql    = 'SELECT * FROM posts ORDER BY ' + SqlString.escapeId(sorter, true);
console.log(sql); // SELECT * FROM posts ORDER BY `date.2`
```

If `escapeId` receives an object with a `toSqlString` method, then `escapeId` uses
that method's result after coercing it to a string.

```js
var sorter = SqlString.identifier('date'); // ({ toSqlString: () => '`date`' })
var sql    = 'SELECT * FROM posts ORDER BY ' + sqlString.escapeId(sorter);
console.log(sql); // SELECT * FROM posts ORDER BY `date`
```

Alternatively, you can use `??` characters as placeholders for identifiers you would
like to have escaped like this:

```js
var userId = 1;
var columns = ['username', 'email'];
var sql     = SqlString.format('SELECT ?? FROM ?? WHERE id = ?', [columns, 'users', userId]);
console.log(sql); // SELECT `username`, `email` FROM `users` WHERE id = 1
```
**Please note that this last character sequence is experimental and syntax might change**

When you pass an Object to `.escape()` or `.format()`, `.escapeId()`
is used to avoid SQL injection in object keys.

### Formatting queries

You can use `SqlString.format` to prepare a query with multiple insertion points,
utilizing the proper escaping for ids and values. A simple example of this follows:

```js
var userId  = 1;
var inserts = ['users', 'id', userId];
var sql     = SqlString.format('SELECT * FROM ?? WHERE ?? = ?', inserts);
console.log(sql); // SELECT * FROM `users` WHERE `id` = 1
```

Following this you then have a valid, escaped query that you can then send to the database safely.
This is useful if you are looking to prepare the query before actually sending it to the database.
You also have the option (but are not required) to pass in `stringifyObject` and `timeZone`,
allowing you provide a custom means of turning objects into strings, as well as a
location-specific/timezone-aware `Date`.

This can be further combined with the `SqlString.raw()` helper to generate SQL
that includes MySQL functions as dynamic vales:

```js
var userId = 1;
var data   = { email: 'foobar@example.com', modified: SqlString.raw('NOW()') };
var sql    = SqlString.format('UPDATE ?? SET ? WHERE `id` = ?', ['users', data, userId]);
console.log(sql); // UPDATE `users` SET `email` = 'foobar@example.com', `modified` = NOW() WHERE `id` = 1
```

### ES6 Template Tag Support

`SqlString.sql` works as a template tag in Node versions that support ES6 features
(node runtime versions 6 and later).

```es6
var column     = 'users';
var userId     = 1;
var data       = { email: 'foobar@example.com', modified: SqlString.raw('NOW()') };
var fromFormat = SqlString.format('UPDATE ?? SET ? WHERE `id` = ?', [column, data, userId]);
var fromTag    = SqlString.sql`UPDATE \`${column}\` SET ${data} WHERE \`id\` = ${userId}`;

console.log(fromFormat);
console.log(fromTag.toSqlString());
// Both emit:
// UPDATE `users` SET `email` = 'foobar@example.com', `modified` = NOW() WHERE `id` = 1
```


There are some differences between `SqlString.format` and `SqlString.raw`:

* The `SqlString.sql` tag returns a raw chunk SQL as if by `SqlString.raw`,
  whereas `SqlString.format` returns a string.
  This allows chaining:
  ```es6
  let data = { a: 1 };
  let whereClause = SqlString.sql`WHERE ${data}`;
  SqlString.sql`SELECT * FROM TABLE ${whereClause}`.toSqlString();
  // SELECT * FROM TABLE WHERE `a` = 1
  ```
* An interpolation in a quoted string will not insert excess quotes:
  ```es6
  SqlString.sql`SELECT '${ 'foo' }' `.toSqlString() === `SELECT 'foo' `;
  SqlString.sql`SELECT ${ 'foo' } `.toSqlString()   === `SELECT 'foo' `;
  SqlString.format("SELECT '?' ", ['foo'])          === `SELECT ''foo'' `;
  ```
  This means that you can interpolate a string into an ID thus:
  ```es6
  SqlString.sql`SELECT * FROM \`${ 'table' }\``.toSqlString() === 'SELECT * FROM `table`'
  SqlString.format('SELECT * FROM ??', ['table'])             === 'SELECT * FROM `table`'
  ```
* Backticks end a template tag, so you need to escape backticks.
  ```es6
  SqlString.sql`SELECT \`${ 'id' }\` FROM \`TABLE\``.toSqlString()
  === 'SELECT `id` FROM `TABLE`'
  ```
* Other escape sequences are raw.
  ```es6
  SqlString.sql`SELECT "\n"`.toSqlString()      === 'SELECT "\\n"'
  SqlString.format('SELECT "\n"', [])           === 'SELECT "\n"'
  SqlString.format(String.raw`SELECT "\n"`, []) === 'SELECT "\\n"'
  ```
* `SqlString.format` takes options at the end, but `SqlString.sql`
  takes an options object in a separate call.
  ```es6
  let timeZone = 'GMT';
  let date = new Date(Date.UTC(2000, 0, 1));
  SqlString.sql({ timeZone })`SELECT ${date}`.toSqlString() ===
    'SELECT \'2000-01-01 00:00:00.000\'';
  SqlString.format('SELECT ?', [date], false, timezone) ===
    'SELECT \'2000-01-01 00:00:00.000\'';
  ```
  The options object can contain any of
  `{ stringifyObjects, timeZone, forbidQualified }` which have the
  same meaning as when used with other `SqlString` APIs.

`SqlString.sql` handles `${...}` inside quoted strings as if the tag
matched the following grammar:

[![Railroad Diagram](docs/sql-railroad.svg)](docs/sql-railroad.svg)


## License

[MIT](LICENSE)

[npm-version-image]: https://img.shields.io/npm/v/sqlstring.svg
[npm-downloads-image]: https://img.shields.io/npm/dm/sqlstring.svg
[npm-url]: https://npmjs.org/package/sqlstring
[coveralls-image]: https://img.shields.io/coveralls/mysqljs/sqlstring/master.svg
[coveralls-url]: https://coveralls.io/r/mysqljs/sqlstring?branch=master
[github-actions-ci-image]: https://img.shields.io/github/workflow/status/mysqljs/sqlstring/ci/master?label=build
[github-actions-ci-url]: https://github.com/mysqljs/sqlstring/actions/workflows/ci.yml
[node-image]: https://img.shields.io/node/v/sqlstring.svg
[node-url]: https://nodejs.org/en/download
