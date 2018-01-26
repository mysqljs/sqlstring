// A minimal file that uses ES6 features which will fail to load on
// older browsers.
`I load on ES6`;

module.exports = function usesRestArgs (...args) {
  return args;
};
