/**
 * @typedef {Object} ParseOptions
 * @property {string} [delimiter=','] - The field delimiter.
 * @property {boolean|string} [quote] - The character used to enclose fields.
 * @property {string} [headers] - Optional headers to use instead of the first row.
 */

/**
 * Stripped-down version of csvjson.toObject with prototype pollution protection.
 */

function getQuoteChar(q) {
  if (typeof q === 'string') {
    return q;
  } else if (q === true) {
    return '"';
  }
  return null;
}

function removeQuote(str, quote) {
  if (str) {
    const trimmed = String(str).trim();
    if (quote && trimmed.startsWith(quote) && trimmed.endsWith(quote)) {
      return trimmed.slice(1, -1);
    }
    // Fallback to original behavior of removing any leading/trailing quotes if no specific quote char is provided
    return trimmed.replace(/^["'](.*)["']$/, '$1');
  }
  return '';
}

function csvToArray(text, delimit, quote) {
  delimit = delimit || ',';
  quote = quote || '"';

  // Regular expression to handle quoted and unquoted fields
  const value = new RegExp(
    '(?!\\s*$)\\s*(?:' +
    quote +
    '([^' +
    quote +
    '\\\\]*(?:\\\\.[^' +
    quote +
    '\\\\]*)*)' +
    quote +
    '|([^' +
    delimit +
    quote +
    '\\s\\\\]*(?:\\s+[^' +
    delimit +
    quote +
    '\\s\\\\]+)*))\\s*(?:' +
    delimit +
    '|$)',
    'g'
  );

  const a = [];
  text.replace(value, (m0, m1, m2) => {
    if (m1 !== undefined) {
      a.push(m1.replace(/\\'/g, "'"));
    } else if (m2 !== undefined) {
      a.push(m2);
    }
    return '';
  });

  if (new RegExp(delimit + '\\s*$').test(text)) {
    a.push('');
  }
  return a;
}

function convertArray(str, delimiter, quote) {
  if (quote && str.indexOf(quote) !== -1) {
    return csvToArray(str, delimiter, quote);
  }
  return str.split(delimiter).map(val => val.trim());
}

/**
 * Converts CSV string to an array of objects.
 * @param {string} data - The CSV string to parse.
 * @param {ParseOptions} [opts] - Parsing options.
 * @returns {Object[]} An array of objects representing the CSV rows.
 */
function toObject(data, opts = {}) {
  if (typeof data !== 'string') {
    throw new Error('Invalid input, input data should be a string');
  }

  const delimiter = opts.delimiter || ',';
  const quote = getQuoteChar(opts.quote);
  const lines = data.split(/[\n\r]+/);

  let rawHeaders;
  if (typeof opts.headers === 'string') {
    const headerLines = opts.headers.split(/[\n\r]+/);
    const headerRow = headerLines.shift();
    rawHeaders = quote
      ? convertArray(headerRow, delimiter, quote)
      : headerRow.split(delimiter);
  } else {
    const headerRow = lines.shift();
    if (!headerRow) return [];
    rawHeaders = quote
      ? convertArray(headerRow, delimiter, quote)
      : headerRow.split(delimiter);
  }

  // Clean headers and identify unsafe keys to prevent prototype pollution
  // We keep the indices consistent with values by replacing unsafe headers with null
  const headers = rawHeaders.map(h => {
    const trimmed = h.trim();
    if (trimmed === '__proto__' || trimmed === 'constructor' || trimmed === 'prototype') {
      return null;
    }
    return trimmed;
  });

  const result = [];
  lines.forEach(line => {
    if (line.trim()) {
      const values = quote
        ? convertArray(line, delimiter, quote)
        : line.split(delimiter);
      const obj = {};
      headers.forEach((header, index) => {
        // Only set the property if the header is safe
        if (header !== null) {
          obj[header] = removeQuote(values[index], quote);
        }
      });
      result.push(obj);
    }
  });

  return result;
}

module.exports = {
  toObject
};
