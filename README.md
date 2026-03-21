# parse-jtl

A Node.js library to parse and aggregate JMeter JTL files.

## Features

- Parse JTL files to extract requests and transactions.
- Aggregate performance metrics like Average, Median, 90th, 95th, and 99th percentiles.
- Calculate Throughput (TPS), Error Rate, and Latency metrics.
- Support for custom delimiters and quoted fields.

## Installation

```bash
npm install parse-jtl
```

## Usage

### Parsing a JTL file

```javascript
const { parse } = require('parse-jtl');

const results = parse('path/to/results.jtl');
console.log(results.requests);
console.log(results.transactions);
console.log(results.total_requests);
```

### Aggregating results

```javascript
const { aggregate } = require('parse-jtl');

const summary = aggregate('path/to/results.jtl');
console.table(summary);
```

## Metrics Calculated

- **Samples**: Total number of requests.
- **Average**: Arithmetic mean of response times.
- **Median**: 50th percentile of response times.
- **90% Line**: 90th percentile of response times.
- **95% Line**: 95th percentile of response times.
- **99% Line**: 99th percentile of response times.
- **Min/Max**: Minimum and maximum response times.
- **Error %**: Percentage of requests with response code >= 400.
- **Throughput**: Transactions per second.
- **Latency Metrics**: Average, Median, and Percentiles for Latency (if available).

## License

[ISC](LICENSE)
