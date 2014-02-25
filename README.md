sqlstring
=======

[![Build Status](https://secure.travis-ci.org/fengmk2/sqlstring.png)](http://travis-ci.org/fengmk2/sqlstring) [![Coverage Status](https://coveralls.io/repos/fengmk2/sqlstring/badge.png)](https://coveralls.io/r/fengmk2/sqlstring) [![Dependency Status](https://gemnasium.com/fengmk2/sqlstring.png)](https://gemnasium.com/fengmk2/sqlstring)

[![NPM](https://nodei.co/npm/sqlstring.png?downloads=true&stars=true)](https://nodei.co/npm/sqlstring/)

![logo](https://raw.github.com/fengmk2/sqlstring/master/logo.png)

SQL escape and format from [mysql/lib/protocol/SqlString.js](https://github.com/felixge/node-mysql/blob/master/lib/protocol/SqlString.js)

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

(The MIT License)

Copyright (c) 2014 fengmk2 &lt;fengmk2@gmail.com&gt; and other contributors

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
