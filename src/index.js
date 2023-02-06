const fs = require("fs");
const csv_json = require('csvjson');

function parse(jtl_file_path) {
  const text = fs.readFileSync(jtl_file_path, { encoding: 'utf8' });
  const rows = csv_json.toObject(text, { delimiter: ',', quote: '"' });
  const aggregate_report = {};
  let last_parent = '';
  for (const record of rows) {
    parseRecord(record);
    if (!aggregate_report[record.label]) {
      setInitialAggregateReport(aggregate_report, record);
    }
    if (aggregate_report[record.label].parent) {
      last_parent = record.label;
    }
    setCounts(aggregate_report, record, last_parent);
  }
  summarize(aggregate_report);
  return aggregate_report;
}

function parseRecord(record) {
  record.timeStamp = parseInt(record.timeStamp);
  record.elapsed = parseInt(record.elapsed);
  record.responseCode = parseInt(record.responseCode);
  record.bytes = parseInt(record.bytes);
  record.sentBytes = parseInt(record.sentBytes);
}

function setInitialAggregateReport(aggregate_report, record) {
  aggregate_report[record.label] = {
    label: record.label,
    samples: 0,
    errors: 0,
    elapsed_times: [],
    max: Number.MIN_VALUE,
    min: Number.MAX_VALUE,
    total: 0,
    received: 0,
    sent: 0,
    start: record.timeStamp,
    parent: record.URL === "null"
  };
}

function setCounts(aggregate_report, record, last_parent) {
  const transaction = aggregate_report[record.label];
  transaction.samples += 1;
  if (record.responseCode >= 400) {
    transaction.errors += 1;
  }
  transaction.max = Math.max(transaction.max, record.elapsed);
  transaction.min = Math.min(transaction.min, record.elapsed);
  transaction.total += record.elapsed;
  transaction.received += record.bytes;
  transaction.sent += record.sentBytes;
  transaction.elapsed_times.push(record.elapsed);
  transaction.end = record.timeStamp;

  const parent_transaction = aggregate_report[last_parent];
  if (parent_transaction) {
    parent_transaction.end = record.timeStamp;
  }
}

function summarize(aggregate_report) {
  for (const key in aggregate_report) {
    if (Object.hasOwnProperty.call(aggregate_report, key)) {
      const transaction = aggregate_report[key];
      transaction.tps = transaction.samples * 1000 / (transaction.end - transaction.start);
      transaction.average = +((transaction.total / transaction.samples).toFixed(2));
      const sorted_response_times = transaction.elapsed_times.sort((a, b) => b - a);
      transaction.p50 = calculatePercentile(sorted_response_times, 50);
      transaction.p90 = calculatePercentile(sorted_response_times, 90);
      transaction.p95 = calculatePercentile(sorted_response_times, 95);
      transaction.p99 = calculatePercentile(sorted_response_times, 99);
      transaction.error_rate = +((transaction.errors / transaction.samples).toFixed(2));
    }
  }
}

function calculatePercentile(sorted_response_times, percentile) {
  const divisor = (100 - percentile) / 100;
  const xPercent = parseInt(Math.ceil(sorted_response_times.length * divisor));
  return sorted_response_times.slice(0, xPercent).slice(-1)[0];
};

module.exports = {
  parse
};
