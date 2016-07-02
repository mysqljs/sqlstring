var SqlString  = exports;
var charsRegex = /[\0\b\t\n\r\x1a\"\'\\]/g; // eslint-disable-line no-control-regex
var charsMap   = {
  '\0': '\\0',
  '\b': '\\b',
  '\t': '\\t',
  '\n': '\\n',
  '\r': '\\r',
  '\x1a': '\\Z',
  '"': '\\"',
  '\'': '\\\'',
  '\\': '\\\\'
};
var iterableSupport = isIterableSupported();

SqlString.escapeId = function escapeId(val, forbidQualified) {
  if (isArrayLike(val)) {
    val = toArray(val);
    var sql = '';

    for (var i = 0; i < val.length; i++) {
      sql += (i === 0 ? '' : ', ') + SqlString.escapeId(val[i], forbidQualified);
    }

    return sql;
  }

  if (forbidQualified) {
    return '`' + val.replace(/`/g, '``') + '`';
  }

  return '`' + val.replace(/`/g, '``').replace(/\./g, '`.`') + '`';
};

SqlString.escape = function escape(val, stringifyObjects, timeZone) {
  if (val === undefined || val === null) {
    return 'NULL';
  }

  switch (typeof val) {
    case 'boolean': return (val) ? 'true' : 'false';
    case 'number': return val+'';
    case 'object':
      if (val instanceof Date) {
        val = SqlString.dateToString(val, timeZone || 'local');
      } else if (Buffer.isBuffer(val)) {
        return SqlString.bufferToString(val);
      } else if (isArrayLike(val)) {
        return SqlString.arrayToList(toArray(val), timeZone);
      } else if (stringifyObjects) {
        val = val.toString();
      } else {
        return SqlString.objectToValues(val, timeZone);
      }
  }

  return escapeString(val);
};

SqlString.arrayToList = function arrayToList(array, timeZone) {
  var sql = '';

  for (var i = 0; i < array.length; i++) {
    var val = array[i];

    if (isArrayLike(val)) {
      sql += (i === 0 ? '' : ', ') + '(' + SqlString.arrayToList(toArray(val), timeZone) + ')';
    } else {
      sql += (i === 0 ? '' : ', ') + SqlString.escape(val, true, timeZone);
    }
  }

  return sql;
};

SqlString.format = function format(sql, values, stringifyObjects, timeZone) {
  if (values == null) {
    return sql;
  }

  if (isArrayLike(values)) {
    values = toArray(values);
  }

  if (isMap(values)) {
    values = mapToObject(values);
  }

  if (!(values instanceof Array || Array.isArray(values))) {
    values = [values];
  }

  var chunkIndex        = 0;
  var placeholdersRegex = /\?\??/g;
  var result            = '';
  var valuesIndex       = 0;
  var match;

  while (valuesIndex < values.length && (match = placeholdersRegex.exec(sql))) {
    var value = match[0] === '??'
        ? SqlString.escapeId(values[valuesIndex])
        : SqlString.escape(values[valuesIndex], stringifyObjects, timeZone);

    result += sql.slice(chunkIndex, match.index) + value;
    chunkIndex = placeholdersRegex.lastIndex;
    valuesIndex++;
  }

  if (chunkIndex === 0) {
    // Nothing was replaced
    return sql;
  }

  if (chunkIndex < sql.length) {
    return result + sql.slice(chunkIndex);
  }

  return result;
};

SqlString.dateToString = function dateToString(date, timeZone) {
  var dt = new Date(date);

  var year;
  var month;
  var day;
  var hour;
  var minute;
  var second;
  var millisecond;

  if (timeZone === 'local') {
    year        = dt.getFullYear();
    month       = dt.getMonth() + 1;
    day         = dt.getDate();
    hour        = dt.getHours();
    minute      = dt.getMinutes();
    second      = dt.getSeconds();
    millisecond = dt.getMilliseconds();
  } else {
    var tz = convertTimezone(timeZone);

    if (tz !== false && tz !== 0) {
      dt.setTime(dt.getTime() + (tz * 60000));
    }

    year       = dt.getUTCFullYear();
    month       = dt.getUTCMonth() + 1;
    day         = dt.getUTCDate();
    hour        = dt.getUTCHours();
    minute      = dt.getUTCMinutes();
    second      = dt.getUTCSeconds();
    millisecond = dt.getUTCMilliseconds();
  }

  // YYYY-MM-DD HH:mm:ss.mmm
  return zeroPad(year, 4) + '-' + zeroPad(month, 2) + '-' + zeroPad(day, 2) + ' ' +
    zeroPad(hour, 2) + ':' + zeroPad(minute, 2) + ':' + zeroPad(second, 2) + '.' +
    zeroPad(millisecond, 3);
};

SqlString.bufferToString = function bufferToString(buffer) {
  return "X'" + buffer.toString('hex') + "'";
};

SqlString.objectToValues = function objectToValues(object, timeZone) {
  var sql = '';

  if (isMap(object)) {
    object = mapToObject(object);
  }

  for (var key in object) {
    var val = object[key];

    if (typeof val === 'function') {
      continue;
    }

    sql += (sql.length === 0 ? '' : ', ') + SqlString.escapeId(key) + ' = ' + SqlString.escape(val, true, timeZone);
  }

  return sql;
};

function escapeString(val) {
  var chunkIndex = charsRegex.lastIndex = 0;
  var escapedVal = '';
  var match;

  while ((match = charsRegex.exec(val))) {
    escapedVal += val.slice(chunkIndex, match.index) + charsMap[match[0]];
    chunkIndex = charsRegex.lastIndex;
  }

  if (chunkIndex === 0) {
    // Nothing was escaped
    return "'" + val + "'";
  }

  if (chunkIndex < val.length) {
    return "'" + escapedVal + val.slice(chunkIndex) + "'";
  }

  return "'" + escapedVal + "'";
}

function zeroPad(number, length) {
  number = number.toString();
  while (number.length < length) {
    number = '0' + number;
  }

  return number;
}

function convertTimezone(tz) {
  if (tz === 'Z') {
    return 0;
  }

  var m = tz.match(/([\+\-\s])(\d\d):?(\d\d)?/);
  if (m) {
    return (m[1] == '-' ? -1 : 1) * (parseInt(m[2], 10) + ((m[3] ? parseInt(m[3], 10) : 0) / 60)) * 60;
  }
  return false;
}

function isArrayLike(val) {
  if (!iterableSupport && Array.isArray(val)) {
    return true;
  }
  if (iterableSupport &&
      !isMap(val) &&
      typeof val[Symbol.iterator] === 'function' &&
      typeof val !== 'string') {
    return true;
  }
  return false;
}

function isMap(val) {
  return iterableSupport && val instanceof Map;
}

function toArray(val) {
  if (!iterableSupport) return val;
  if (Array.isArray(val)) return val;
  if (typeof val.next === 'undefined') {
    var arr = [];
    val.forEach(function(key) {
      arr.push(key);
    });
    return arr;
  }
  if (typeof Array.from === 'undefined') {
    var arr = [];
    var g;
    while(true){
      g = val.next();
      if (g.done) break;
      arr.push(g.value);
    }
    return arr;
  }
  return Array.from(val);
}

function mapToObject(map) {
  var object = {};
  map.forEach(function(val, key) {
    object[key] = val;
  });
  // if custom toString was implemented, attach to new object
  if (map.toString !== new Map().toString) {
    object.toString = map.toString.bind(object);
  }
  return object;
}

function isIterableSupported() {
  if ('function' === typeof Map && 'function' === typeof Set) return true;
  return false;
}
