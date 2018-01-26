// A simple lexer for SQL.
// SQL has many divergent dialects with subtly different
// conventions for string escaping and comments.
// This just attempts to roughly tokenize MySQL's specific variant.
// See also
// https://www.w3.org/2005/05/22-SPARQL-MySQL/sql_yacc
// https://github.com/twitter/mysql/blob/master/sql/sql_lex.cc
// https://dev.mysql.com/doc/refman/5.7/en/string-literals.html

// "--" followed by whitespace starts a line comment
// "#"
// "/*" starts an inline comment ended at first "*/"
// \N means null
// Prefixed strings x'...' is a hex string,  b'...' is a binary string, ....
// '...', "..." are strings.  `...` escapes identifiers.
// doubled delimiters and backslash both escape
// doubled delimiters work in `...` identifiers

exports.makeLexer = makeLexer;

const WS = '[\\t\\r\\n ]';
const PREFIX_BEFORE_DELIMITER = new RegExp(
  '^(?:' +
    (
      // Comment
      // https://dev.mysql.com/doc/refman/5.7/en/comments.html
      // https://dev.mysql.com/doc/refman/5.7/en/ansi-diff-comments.html
      // If we do not see a newline at the end of a comment, then it is
      // a concatenation hazard; a fragment concatened at the end would
      // start in a comment context.
      '--(?=' + WS + ')[^\\r\\n]*[\r\n]' +
      '|#[^\\r\\n]*[\r\n]' +
      '|/[*][\\s\\S]*?[*]/'
    ) +
    '|' +
    (
      // Run of non-comment non-string starts
      '(?:[^\'"`\\-/#]|-(?!-' + WS + ')|/(?![*]))'
    ) +
    ')*');
const DELIMITED_BODIES = {
  '\'' : /^(?:[^'\\]|\\[\s\S]|'')*/,
  '"'  : /^(?:[^"\\]|\\[\s\S]|"")*/,
  '`'  : /^(?:[^`\\]|\\[\s\S]|``)*/
};

/**
 * Template tag that creates a new Error with a message.
 * @param {!Array.<string>} strs a valid TemplateObject.
 * @return {string} A message suitable for the Error constructor.
 */
function msg (strs, ...dyn) {
  let message = String(strs[0]);
  for (let i = 0; i < dyn.length; ++i) {
    message += JSON.stringify(dyn[i]) + strs[i + 1];
  }
  return message;
}

/**
 * Returns a stateful function that can be fed chunks of input and
 * which returns a delimiter context.
 *
 * @return {!function (string) : string}
 *    a stateful function that takes a string of SQL text and
 *    returns the context after it.  Subsequent calls will assume
 *    that context.
 */
function makeLexer () {
  let errorMessage = null;
  let delimiter = null;
  return (text) => {
    if (errorMessage) {
      // Replay the error message if we've already failed.
      throw new Error(errorMessage);
    }
    text = String(text);
    while (text) {
      const pattern = delimiter
        ? DELIMITED_BODIES[delimiter]
        : PREFIX_BEFORE_DELIMITER;
      const match = pattern.exec(text);
      // Match must be defined since all possible values of pattern have
      // an outer Kleene-* and no postcondition so will fallback to matching
      // the empty string.
      let nConsumed = match[0].length;
      if (text.length > nConsumed) {
        const chr = text.charAt(nConsumed);
        if (delimiter) {
          if (chr === delimiter) {
            delimiter = null;
            ++nConsumed;
          } else {
            throw new Error(
              errorMessage = msg`Expected ${chr} at ${text}`);
          }
        } else if (Object.hasOwnProperty.call(DELIMITED_BODIES, chr)) {
          delimiter = chr;
          ++nConsumed;
        } else {
          throw new Error(
            errorMessage = msg`Expected delimiter at ${text}`);
        }
      }
      text = text.substring(nConsumed);
    }
    return delimiter;
  };
}
