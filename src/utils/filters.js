import { DateTime } from 'luxon';

export const dateToFormat = (date, format) => {
  return DateTime.fromJSDate(date, { zone: 'utc' }).toFormat(
    String(format),
  );
};

export const obfuscate = (str) => {
  const chars = [];
  for (let i = str.length - 1; i >= 0; i--) {
    chars.unshift(['&#', str[i].charCodeAt(), ';'].join(''));
  }
  return chars.join('');
};

export const stripSpaces = (str) => {
  return str.replace(/\s/g, '');
};

export const stripProtocol = (str) => {
  return str.replace(/(^\w+:|^)\/\//, '');
};

// For backward compatibility
export default {
  dateToFormat,
  obfuscate,
  stripSpaces,
  stripProtocol
};
