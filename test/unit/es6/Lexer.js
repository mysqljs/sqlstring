// This file uses es6 features and is loaded conditionally.

var assert    = require('assert');
var test      = require('utest');
var Lexer     = require('../../../lib/es6/Lexer');

function tokens (...chunks) {
  const lexer = Lexer.makeLexer();
  const out = [];
  for (let i = 0, len = chunks.length; i < len; ++i) {
    out.push(lexer(chunks[i]) || '_');
  }
  return out.join(',');
}

test('template lexer', {
  'empty string': function () {
    assert.equal(tokens(''), '_');
  },
  'hash comments': function () {
    assert.equal(tokens(' # "foo\n', ''), '_,_');
  },
  'dash comments': function () {
    assert.equal(tokens(' -- \'foo\n', ''), '_,_');
  },
  'dash dash participates in number literal': function () {
    assert.equal(tokens('SELECT (1--1) + "', '"'), '",_');
  },
  'block comments': function () {
    assert.equal(tokens(' /* `foo */', ''), '_,_');
  },
  'dq': function () {
    assert.equal(tokens('SELECT "foo"'), '_');
    assert.equal(tokens('SELECT `foo`, "foo"'), '_');
    assert.equal(tokens('SELECT "', '"'), '",_');
    assert.equal(tokens('SELECT "x', '"'), '",_');
    assert.equal(tokens('SELECT "\'', '"'), '",_');
    assert.equal(tokens('SELECT "`', '"'), '",_');
    assert.equal(tokens('SELECT """', '"'), '",_');
    assert.equal(tokens('SELECT "\\"', '"'), '",_');
  },
  'sq': function () {
    assert.equal(tokens('SELECT \'foo\''), '_');
    assert.equal(tokens('SELECT `foo`, \'foo\''), '_');
    assert.equal(tokens('SELECT \'', '\''), '\',_');
    assert.equal(tokens('SELECT \'x', '\''), '\',_');
    assert.equal(tokens('SELECT \'"', '\''), '\',_');
    assert.equal(tokens('SELECT \'`', '\''), '\',_');
    assert.equal(tokens('SELECT \'\'\'', '\''), '\',_');
    assert.equal(tokens('SELECT \'\\\'', '\''), '\',_');
  },
  'bq': function () {
    assert.equal(tokens('SELECT `foo`'), '_');
    assert.equal(tokens('SELECT "foo", `foo`'), '_');
    assert.equal(tokens('SELECT `', '`'), '`,_');
    assert.equal(tokens('SELECT `x', '`'), '`,_');
    assert.equal(tokens('SELECT `\'', '`'), '`,_');
    assert.equal(tokens('SELECT `"', '`'), '`,_');
    assert.equal(tokens('SELECT ```', '`'), '`,_');
    assert.equal(tokens('SELECT `\\`', '`'), '`,_');
  },
  'replay error': function () {
    const lexer = Lexer.makeLexer();
    assert.equal(lexer('SELECT '), null);
    assert.throws(
      () => lexer(' # '),
      /^Error: Expected delimiter at " # "$/);
    // Providing more input throws the same error.
    assert.throws(
      () => lexer(' '),
      /^Error: Expected delimiter at " # "$/);
  },
  'unfinished escape squence': function () {
    const lexer = Lexer.makeLexer();
    assert.throws(
      () => lexer('SELECT "\\'),
      /^Error: Expected "\\\\" at "\\\\"$/);
  }
});
