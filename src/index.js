const path = require('path');
const fs = require("fs");
const csv_json = require('csvjson');

function parse(jtl_file_path) {
  const cwd = process.cwd();
  const text = fs.readFileSync(path.join(cwd, jtl_file_path), { encoding: 'utf8' });
  const rows = csv_json.toObject(text, { delimiter: ',', quote: '"' });
  const aggregate_records = {};
  const total_requests_record = getTotalRecord();
  const total_transaction_record = getTotalRecord();
  for (const record of rows) {
    parseRecord(record);
    if (!aggregate_records[record.label]) {
      setInitialAggregateReport(aggregate_records, record);
    }
    const total_report = aggregate_records[record.label].transaction ? total_transaction_record : total_requests_record;
    setCounts(aggregate_records, total_report, record);
  }
  summarize(aggregate_records);
  setSummaryCounts(total_requests_record);
  setSummaryCounts(total_transaction_record);
  copyLatencies(total_transaction_record, total_requests_record);
  return { requests: getFilteredRecord(aggregate_records, false), transactions: getFilteredRecord(aggregate_records, true), total_requests: total_requests_record, total_transactions: total_transaction_record, all: aggregate_records };
}

function getTotalRecord() {
  return JSON.parse(JSON.stringify({
    label: 'TOTAL',
    samples: 0,
    errors: 0,
    elapsed_times: [],
    max: Number.MIN_VALUE,
    min: Number.MAX_VALUE,
    total: 0,
    received: 0,
    sent: 0,
    latencies: [],
    max_latency: Number.MIN_VALUE,
    min_latency: Number.MAX_VALUE,
    total_latency: 0,
  }));
}

function parseRecord(record) {
  record.timeStamp = parseInt(record.timeStamp);
  record.elapsed = parseInt(record.elapsed);
  record.responseCode = parseInt(record.responseCode);
  record.bytes = parseInt(record.bytes);
  record.sentBytes = parseInt(record.sentBytes);
  if (record.Latency) {
    record.Latency = parseInt(record.Latency);
  }
  if (record.IdleTime) {
    record.IdleTime = parseInt(record.IdleTime);
  }
  if (record.Connect) {
    record.Connect = parseInt(record.Connect);
  }
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
    transaction: record.URL === "null",
    latencies: [],
    max_latency: Number.MIN_VALUE,
    min_latency: Number.MAX_VALUE,
    total_latency: 0,
  };
}

function setCounts(aggregate_records, total_report, record) {
  const aggregate_record = aggregate_records[record.label];

  aggregate_record.samples += 1;
  total_report.samples += 1;

  if (record.responseCode >= 400) {
    aggregate_record.errors += 1;
    total_report.errors += 1;
  }

  aggregate_record.max = Math.max(aggregate_record.max, record.elapsed);
  total_report.max = Math.max(total_report.max, record.elapsed);

  aggregate_record.min = Math.min(aggregate_record.min, record.elapsed);
  total_report.min = Math.min(total_report.min, record.elapsed);

  aggregate_record.total += record.elapsed;
  total_report.total += record.elapsed;

  aggregate_record.received += record.bytes;
  total_report.received += record.bytes;

  aggregate_record.sent += record.sentBytes;
  total_report.sent += record.sentBytes;

  aggregate_record.elapsed_times.push(record.elapsed);
  total_report.elapsed_times.push(record.elapsed);

  aggregate_record.end = record.timeStamp + record.elapsed;
  total_report.end = record.timeStamp + record.elapsed;

  if (!total_report.start) {
    total_report.start = record.timeStamp;
  }

  if (Number.isInteger(record.Latency) && !aggregate_record.transaction) {
    aggregate_record.latencies.push(record.Latency);
    total_report.latencies.push(record.Latency);

    aggregate_record.max_latency = Math.max(aggregate_record.max_latency, record.Latency);
    total_report.max_latency = Math.max(total_report.max_latency, record.Latency);

    aggregate_record.min_latency = Math.min(aggregate_record.min_latency, record.Latency);
    total_report.min_latency = Math.min(total_report.min_latency, record.Latency);

    aggregate_record.total_latency += record.Latency;
    total_report.total_latency += record.Latency;
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

function setSummaryCounts(total_record) {
  if (total_record.elapsed_times.length > 0) {
    total_record.tps = +((total_record.samples * 1000 / (total_record.end - total_record.start)).toFixed(2));
    total_record.average = +((total_record.total / total_record.samples).toFixed(2));
    const sorted_response_times = total_record.elapsed_times.sort((a, b) => b - a);
    total_record.p50 = calculatePercentile(sorted_response_times, 50);
    total_record.p90 = calculatePercentile(sorted_response_times, 90);
    total_record.p95 = calculatePercentile(sorted_response_times, 95);
    total_record.p99 = calculatePercentile(sorted_response_times, 99);
    total_record.error_rate = +((total_record.errors / total_record.samples).toFixed(2));
    total_record.sent_rate = +((total_record.sent / (total_record.end - total_record.start)).toFixed(2));
    total_record.received_rate = +((total_record.received / (total_record.end - total_record.start)).toFixed(2));
    total_record.median = median(sorted_response_times);
  } else {
    total_record.max = 0;
    total_record.min = 0;
  }

  if (total_record.latencies.length > 0) {
    const sorted_latencies = total_record.latencies.sort((a, b) => b - a);
    total_record.average_latency = +((total_record.total_latency / total_record.samples).toFixed(2));
    total_record.p50_latency = calculatePercentile(sorted_latencies, 50);
    total_record.p90_latency = calculatePercentile(sorted_latencies, 90);
    total_record.p95_latency = calculatePercentile(sorted_latencies, 95);
    total_record.p99_latency = calculatePercentile(sorted_latencies, 99);
    total_record.median_latency = median(sorted_latencies);
  } else {
    total_record.max_latency = 0;
    total_record.min_latency = 0;
  }

}

function calculatePercentile(sorted_response_times, percentile) {
  const divisor = (100 - percentile) / 100;
  const xPercent = parseInt(Math.ceil(sorted_response_times.length * divisor));
  return sorted_response_times.slice(0, xPercent).slice(-1)[0];
};

function median(array) {
  if (array.length === 0) {
    return 0;
  }

  if (array.length % 2 !== 0) {
    return parseFloat(array[Math.floor(array.length / 2)]);
  } else {
    const mid = array.length / 2;
    return (array[mid - 1] + array[mid]) / 2;
  }
}

function getFilteredRecord(aggregate_report, transaction) {
  const filtered_report = {}
  for (const key in aggregate_report) {
    if (Object.hasOwnProperty.call(aggregate_report, key)) {
      const current_record = aggregate_report[key];
      if (current_record['transaction'] === transaction) {
        filtered_report[key] = current_record;
      }
    }
  }
  return filtered_report;
}

function copyLatencies(total_transactions_record, total_requests_record) {
  if (total_requests_record.latencies.length > 0) {
    total_transactions_record.p50_latency = total_requests_record.p50_latency;
    total_transactions_record.p90_latency = total_requests_record.p90_latency;
    total_transactions_record.p95_latency = total_requests_record.p95_latency;
    total_transactions_record.p99_latency = total_requests_record.p99_latency;
    total_transactions_record.average_latency = total_requests_record.average_latency;
    total_transactions_record.median_latency = total_requests_record.median_latency;
    total_transactions_record.max_latency = total_requests_record.max_latency;
    total_transactions_record.min_latency = total_requests_record.min_latency;
    total_transactions_record.total_latency = total_requests_record.total_latency;
    total_transactions_record.latencies = total_requests_record.latencies;
  }
}

function aggregate(jtl_file_path) {
  const { total_transactions, transactions } = parse(jtl_file_path);
  const records = [];
  for (const key in transactions) {
    if (Object.hasOwnProperty.call(transactions, key)) {
      const transaction = transactions[key];
      records.push(getCSVAggregateRecord(transaction));
    }
  }
  records.push(getCSVAggregateRecord(total_transactions));
  return records;
}

function getCSVAggregateRecord(aggregate_record) {
  const record = {
    'Label': aggregate_record.label,
    '# Samples': aggregate_record.samples,
    'Throughput': aggregate_record.tps,
    'Average': aggregate_record.average,
    'Median': aggregate_record.median,
    '90% Line': aggregate_record.p90,
    '95% Line': aggregate_record.p95,
    '99% Line': aggregate_record.p99,
    'Min': aggregate_record.min,
    'Max': aggregate_record.max,
    'Error %': aggregate_record.error_rate + '%',
    'Sent KB/sec': aggregate_record.sent_rate,
    'Received KB/sec': aggregate_record.received_rate,
  }
  if (aggregate_record.latencies.length > 0) {
    record['Average Latency'] = aggregate_record.average_latency;
    record['Median Latency'] = aggregate_record.median_latency;
    record['90% Latency'] = aggregate_record.p90_latency;
    record['95% Latency'] = aggregate_record.p95_latency;
    record['99% Latency'] = aggregate_record.p99_latency;
    record['Min Latency'] = aggregate_record.min_latency;
    record['Max Latency'] = aggregate_record.max_latency;
  }
  return record;
}

module.exports = {
  parse,
  aggregate
};
