try {
  module.exports = require('./es6/Template');
} catch (ignored) {
  // ES6 code failed to load.
  //
  // This happens in Node runtimes with versions < 6.
  // Since those runtimes won't parse template tags, we
  // fallback to an equivalent API that assumes no calls
  // are template tag calls.
  //
  // Clients that need to work on older Node runtimes
  // should not use any part of this API except
  // calledAsTemplateTagQuick unless that function has
  // returned true.

  // eslint-disable-next-line no-unused-vars
  module.exports = function (sqlStrings) {
    // This might be reached if client code is transpiled down to
    // ES5 but this module is not.
    throw new Error('ES6 features not supported');
  };
  /**
   * @param {*} firstArg The first argument to the function call.
   * @param {number} nArgs The number of arguments pass to the function call.
   *
   * @return {boolean} always false in ES<6 compatibility mode.
   */
  // eslint-disable-next-line no-unused-vars
  module.exports.calledAsTemplateTagQuick = function (firstArg, nArgs) {
    return false;
  };
}
