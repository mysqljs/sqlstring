// This file uses es6 features and is loaded optimistically.

const SqlString = require('../SqlString');
const {
  calledAsTemplateTagQuick,
  memoizedTagFunction,
  trimCommonWhitespaceFromLines
} = require('template-tag-common');
const { makeLexer } = require('./Lexer');

const LITERAL_BACKTICK_FIXUP_PATTERN = /((?:[^\\]|\\[^\`])+)|\\(\`)(?!\`)/g;

/**
 * Trims common whitespace and converts escaped backticks
 * to backticks as appropriate.
 *
 * @param {!Array.<string>} strings a valid TemplateObject.
 * @return {!Array.<string>} the adjusted raw strings.
 */
function prepareStrings(strings) {
  const raw = trimCommonWhitespaceFromLines(strings).raw.slice();
  for (let i = 0, n = raw.length; i < n; ++i) {
    // Convert \` to ` but leave  \\` alone.
    raw[i] = raw[i].replace(LITERAL_BACKTICK_FIXUP_PATTERN, '$1$2');
  }
  return raw;
}

/**
 * Analyzes the static parts of the tag content.
 *
 * @param {!Array.<string>} strings a valid TemplateObject.
 * @return { !{
 *       delimiters : !Array.<string>,
 *       chunks: !Array.<string>
 *     } }
 *     A record like { delimiters, chunks }
 *     where delimiter is a contextual cue and chunk is
 *     the adjusted raw text.
 */
function computeStatic (strings) {
  const chunks = prepareStrings(strings);
  const lexer = makeLexer();

  const delimiters = [];
  let delimiter = null;
  for (let i = 0, len = chunks.length; i < len; ++i) {
    const chunk = String(chunks[i]);
    const newDelimiter = lexer(chunk);
    delimiters.push(newDelimiter);
    delimiter = newDelimiter;
  }

  if (delimiter) {
    throw new Error(`Unclosed quoted string: ${delimiter}`);
  }

  return { delimiters, chunks };
}

function interpolateSqlIntoFragment (
  { stringifyObjects, timeZone, forbidQualified },
  { delimiters, chunks },
  strings, values) {
  // A buffer to accumulate output.
  let [ result ] = chunks;
  for (let i = 1, len = chunks.length; i < len; ++i) {
    const chunk = chunks[i];
    // The count of values must be 1 less than the surrounding
    // chunks of literal text.
    const delimiter = delimiters[i - 1];
    const value = values[i - 1];

    let escaped = delimiter
      ? escapeDelimitedValue(value, delimiter, timeZone, forbidQualified)
      : defangMergeHazard(
        result,
        SqlString.escape(value, stringifyObjects, timeZone),
        chunk);

    result += escaped + chunk;
  }

  return SqlString.raw(result);
}

function escapeDelimitedValue (value, delimiter, timeZone, forbidQualified) {
  if (delimiter === '`') {
    return SqlString.escapeId(value, forbidQualified).replace(/^`|`$/g, '');
  }
  if (Buffer.isBuffer(value)) {
    value = value.toString('binary');
  }
  const escaped = SqlString.escape(String(value), true, timeZone);
  return escaped.substring(1, escaped.length - 1);
}

function defangMergeHazard (before, escaped, after) {
  const escapedLast = escaped[escaped.length - 1];
  if ('\"\'`'.indexOf(escapedLast) < 0) {
    // Not a merge hazard.
    return escaped;
  }

  let escapedSetOff = escaped;
  const lastBefore = before[before.length - 1];
  if (escapedLast === escaped[0] && escapedLast === lastBefore) {
    escapedSetOff = ' ' + escapedSetOff;
  }
  if (escapedLast === after[0]) {
    escapedSetOff += ' ';
  }
  return escapedSetOff;
}

/**
 * Template tag function that contextually autoescapes values
 * producing a SqlFragment.
 */
const sql = memoizedTagFunction(computeStatic, interpolateSqlIntoFragment);
sql.calledAsTemplateTagQuick = calledAsTemplateTagQuick;

module.exports = sql;
