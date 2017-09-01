var SqlString = require('./SqlString');

module.exports.escapeId = function escapeId(strings) {
  var values = [].slice.call(arguments).slice(1);

  return values.map(function(value, i) {
    return strings[i] + SqlString.escapeId(value);
  }).join('') + strings[strings.length - 1];
};

module.exports.escapeIdForbidQualified = function escapeIdForbidQualified(strings) {
  var values = [].slice.call(arguments).slice(1);

  return values.map(function(value, i) {
    return strings[i] + SqlString.escapeId(value, true);
  }).join('') + strings[strings.length - 1];
};

module.exports.escapeWithOptions = function escapeWithOptions(stringifyObjects, timeZone) {
  return function(strings) {
    var values = [].slice.call(arguments).slice(1);

    return values.map(function(value, i) {
      return strings[i] + SqlString.escape(value, stringifyObjects, timeZone);
    }).join('') + strings[strings.length - 1];
  };
};
module.exports.escape = module.exports.escapeWithOptions();
module.exports.escapeStringifyObjects = module.exports.escapeWithOptions(true);

module.exports.generateFormatFunctionWithOptions = function generateFormatFunctionWithOptions(forbidQualified) {
  return function generateFormatFunction(strings) {
    var values = [].slice.call(arguments).slice(1);

    var parts = values.map(function(value, i) {
      var stringParts = strings[i].split('?');
      stringParts[stringParts.length - 1] += SqlString.escapeId(value, forbidQualified);
      return stringParts;
    });
    parts.push(strings[strings.length - 1].split('?'));

    var prepared = parts.reduce(function(result, part) {
      result[result.length - 1] += part.shift();
      result.push.apply(result, part);
      return result;
    }, parts.shift());
    var lastPrepared = prepared.pop();

    return function(values, stringifyObjects, timeZone) {
      if (!values) {
        values = [];
      }

      if (!Array.isArray(values)) {
        values = [values];
      }

      return prepared.map(function(string, i) {
        var value = '?';
        if (i < values.length) {
          value = SqlString.escape(values[i], stringifyObjects, timeZone);
        }

        return string + value;
      }).join('') + lastPrepared;
    };
  };
};
module.exports.generateFormatFunction = module.exports.generateFormatFunctionWithOptions();
module.exports.generateFormatFunctionForbidQualified = module.exports.generateFormatFunctionWithOptions(true);
