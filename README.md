# sqlstring

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![Node.js Version][node-image]][node-url]
[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]

Simple SQL escape and format for MySQL

## Install

```bash
$ npm install sqlstring
```

## Usage

```js
var sqlstring = require('sqlstring');

sqlstring.format('SELECT * FROM user WHERE age = ? and gender = ?', [18, 'female']);
// "SELECT * FROM user WHERE age = 18 and gender = 'female'"
```

## License

[MIT](LICENSE)

[npm-version-image]: https://img.shields.io/npm/v/sqlstring.svg
[npm-downloads-image]: https://img.shields.io/npm/dm/sqlstring.svg
[npm-url]: https://npmjs.org/package/sqlstring
[travis-image]: https://img.shields.io/travis/mysqljs/sqlstring/master.svg
[travis-url]: https://travis-ci.org/mysqljs/sqlstring
[coveralls-image]: https://img.shields.io/coveralls/mysqljs/sqlstring/master.svg
[coveralls-url]: https://coveralls.io/r/mysqljs/sqlstring?branch=master
[node-image]: https://img.shields.io/node/v/sqlstring.svg
[node-url]: https://nodejs.org/en/download
