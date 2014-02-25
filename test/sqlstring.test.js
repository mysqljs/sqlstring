/**!
 * sqlstring - test/sqlstring.test.js
 *
 * Copyright(c) 2014
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

"use strict";

/**
 * Module dependencies.
 */

var should = require('should');
var sqlstring = require('../');

describe('sqlstring.test.js', function () {
  describe('format()', function () {
    it('should format sql with params work', function () {
      sqlstring.format('SELECT * FROM user WHERE age = ? and gender = ?', [18, 'female'])
      .should.equal('SELECT * FROM user WHERE age = 18 and gender = \'female\'');
    });
  });
});
