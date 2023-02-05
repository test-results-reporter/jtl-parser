const fs = require("fs");

function parse(jtl_file_path) {
  const text = fs.readFileSync(jtl_file_path, { encoding: 'utf8' });
  const rows = text.split("\n");
  const aggregate_report = {};
  for (const row of rows) {
    const record = getRecord(row);
    if (!aggregate_report[record.label]) {
      setInitialAggregateReport(aggregate_report, record);
    }
    setCounts(aggregate_report, record);
  }
  summarize(aggregate_report);
  return aggregate_report;
}

function getRecord(row) {
  const columns = row.split(',');
  return {
    timestamp: columns[0],
    elapsed: parseInt(columns[1]),
    label: columns[2],
    code: parseInt(columns[3]),
    message: columns[4],
    thread: columns[5],
    type: columns[6],
    success: columns[7],
    failure: columns[8],
    bytes: parseInt(columns[9]),
    sent: parseInt(columns[10]),
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
    start: parseInt(record.timestamp)
  };
}

function setCounts(aggregate_report, record) {
  const transaction = aggregate_report[record.label];
  transaction.samples += 1;
  if (record.code >= 400) {
    transaction.errors += 1;
  }
  transaction.max = Math.max(transaction.max, record.elapsed);
  transaction.min = Math.min(transaction.min, record.elapsed);
  transaction.total += record.elapsed;
  transaction.elapsed_times.push(record.elapsed);
  transaction.end = parseInt(record.timestamp);
}

function summarize(aggregate_report) {
  for (const key in aggregate_report) {
    if (Object.hasOwnProperty.call(aggregate_report, key)) {
      const transaction = aggregate_report[key];
      transaction.tps = transaction.samples / (transaction.end - transaction.start)
      transaction.average = +((transaction.total / transaction.samples).toFixed(2));
      transaction.p50 = calculatePercentile(transaction.elapsed_times, 50);
      transaction.p90 = calculatePercentile(transaction.elapsed_times, 90);
      transaction.p95 = calculatePercentile(transaction.elapsed_times, 95);
      transaction.p99 = calculatePercentile(transaction.elapsed_times, 99);
      transaction.error_rate = +((transaction.errors / transaction.samples).toFixed(2));
    }
  }
}

function calculatePercentile(elapsedTimes, percentile) {
  const divisor = (100 - percentile) / 100;
  elapsedTimes.sort(function (a, b) {
    return b - a;
  });
  const xPercent = parseInt(Math.ceil(elapsedTimes.length * divisor));
  return elapsedTimes.slice(0, xPercent).slice(-1)[0];
};

module.exports = {
  parse
};
