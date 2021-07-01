const { DateTime } = require('luxon');

module.exports = {
  dateToFormat(date, format) {
    return DateTime.fromJSDate(date, { zone: 'utc' }).toFormat(
      String(format),
    );
  },

  obfuscate(str) {
    const chars = [];
    for (let i = str.length - 1; i >= 0; i--) {
      chars.unshift(['&#', str[i].charCodeAt(), ';'].join(''));
    }
    return chars.join('');
  },

  stripSpaces(str) {
    return str.replace(/\s/g, '');
  },

  stripProtocol(str) {
    return str.replace(/(^\w+:|^)\/\//, '');
  },
};
