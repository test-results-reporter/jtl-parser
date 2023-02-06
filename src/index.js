const path = require('path');
const fs = require("fs");
const csv_json = require('csvjson');

function parse(jtl_file_path) {
  const cwd = process.cwd();
  const text = fs.readFileSync(path.join(cwd, jtl_file_path), { encoding: 'utf8' });
  const rows = csv_json.toObject(text, { delimiter: ',', quote: '"' });
  const aggregate_report = {};
  const total_report = {
    label: 'TOTAL',
    samples: 0,
    errors: 0,
    elapsed_times: [],
    max: Number.MIN_VALUE,
    min: Number.MAX_VALUE,
    total: 0,
    received: 0,
    sent: 0,
  };
  let last_parent = '';
  for (const record of rows) {
    parseRecord(record);
    if (!aggregate_report[record.label]) {
      setInitialAggregateReport(aggregate_report, record);
    }
    if (aggregate_report[record.label].parent) {
      last_parent = record.label;
    }
    setCounts(aggregate_report, total_report, record, last_parent);
  }
  summarize(aggregate_report);
  setSummaryCounts(total_report);
  return { transactions: aggregate_report, total: total_report };
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

function setCounts(aggregate_report, total_report, record, last_parent) {
  const transaction = aggregate_report[record.label];

  transaction.samples += 1;
  total_report.samples += 1;

  if (record.responseCode >= 400) {
    transaction.errors += 1;
    total_report.errors += 1;
  }

  transaction.max = Math.max(transaction.max, record.elapsed);
  total_report.max = Math.max(total_report.max, record.elapsed);

  transaction.min = Math.min(transaction.min, record.elapsed);
  total_report.min = Math.min(total_report.min, record.elapsed);

  transaction.total += record.elapsed;
  total_report.total += record.elapsed;

  transaction.received += record.bytes;
  total_report.received += record.bytes;

  transaction.sent += record.sentBytes;
  total_report.sent += record.sentBytes;

  transaction.elapsed_times.push(record.elapsed);
  total_report.elapsed_times.push(record.elapsed);

  transaction.end = record.timeStamp;
  total_report.end = record.timeStamp;

  if (!total_report.start) {
    total_report.start = record.timeStamp;
  }

  const parent_transaction = aggregate_report[last_parent];
  if (parent_transaction) {
    parent_transaction.end = record.timeStamp;
  }
}

function summarize(aggregate_report) {
  for (const key in aggregate_report) {
    if (Object.hasOwnProperty.call(aggregate_report, key)) {
      const transaction = aggregate_report[key];
      setSummaryCounts(transaction);
    }
  }
}

function setSummaryCounts(transaction) {
  transaction.tps = transaction.samples * 1000 / (transaction.end - transaction.start);
  transaction.average = +((transaction.total / transaction.samples).toFixed(2));
  const sorted_response_times = transaction.elapsed_times.sort((a, b) => b - a);
  transaction.p50 = calculatePercentile(sorted_response_times, 50);
  transaction.p90 = calculatePercentile(sorted_response_times, 90);
  transaction.p95 = calculatePercentile(sorted_response_times, 95);
  transaction.p99 = calculatePercentile(sorted_response_times, 99);
  transaction.error_rate = +((transaction.errors / transaction.samples).toFixed(2));

  const n = sorted_response_times.length;
  if (n % 2 === 0) {
    transaction.median = parseInt((sorted_response_times[n / 2] + sorted_response_times[(n / 2) + 1]) / 2);
  } else {
    transaction.median = sorted_response_times[(n + 1) / 2];
  }

}

function calculatePercentile(sorted_response_times, percentile) {
  const divisor = (100 - percentile) / 100;
  const xPercent = parseInt(Math.ceil(sorted_response_times.length * divisor));
  return sorted_response_times.slice(0, xPercent).slice(-1)[0];
};

function aggregate(jtl_file_path) {
  const { total, transactions } = parse(jtl_file_path);
  const records = [];
  for (const key in transactions) {
    if (Object.hasOwnProperty.call(transactions, key)) {
      const transaction = transactions[key];
      records.push(getAggregateRecord(transaction));
    }
  }
  records.push(getAggregateRecord(total));
  return records;
}

function getAggregateRecord(transaction) {
  return {
    'Label': transaction.label,
    '# Samples': transaction.samples,
    'Throughput': transaction.tps,
    'Average': transaction.average,
    'Median': transaction.median,
    '90% Line': transaction.p90,
    '95% Line': transaction.p95,
    '99% Line': transaction.p99,
    'Min': transaction.min,
    'Max': transaction.max,
    'Error %': transaction.error_rate + '%',
    'Sent KB/sec': transaction.sent,
    'Received KB/sec': transaction.received,
  }
}

module.exports = {
  parse,
  aggregate
};
