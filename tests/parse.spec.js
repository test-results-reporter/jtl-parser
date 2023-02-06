const { parse, aggregate } = require('../src');
const { expect } = require('chai');

describe('parse', () => {

  it('simple jtl file', () => {
    const result = parse('./tests/data/simple.jtl');
    expect(result).deep.equals({
      transactions: {
        call1: {
          label: 'call1',
          samples: 4,
          errors: 1,
          elapsed_times: [1170, 1131, 1023, 24],
          max: 1170,
          min: 24,
          total: 3348,
          received: 175,
          sent: 175,
          average: 837,
          p50: 1131,
          p90: 1170,
          p95: 1170,
          p99: 1170,
          error_rate: 0.25,
          start: 1448450968840,
          end: 1448450969972,
          tps: 3.5335689045936394,
          parent: false,
          median: 523,
        },
        call2: {
          label: 'call2',
          samples: 4,
          errors: 0,
          elapsed_times: [2200, 1907, 938, 833],
          max: 2200,
          min: 833,
          total: 5878,
          received: 180,
          sent: 180,
          average: 1469.5,
          p50: 1907,
          p90: 2200,
          p95: 2200,
          p99: 2200,
          error_rate: 0,
          start: 1448450969091,
          end: 1448450969203,
          tps: 35.714285714285715,
          parent: false,
          median: 885,
        }
      },
      total: {
        samples: 8,
        errors: 1,
        elapsed_times: [
          2200, 1907, 1170,
          1131, 1023,  938,
           833,   24
        ],
        max: 2200,
        min: 24,
        total: 9226,
        received: 355,
        sent: 355,
        end: 1448450969972,
        start: 1448450968840,
        tps: 7.067137809187279,
        average: 1153.25,
        p50: 1131,
        p90: 2200,
        p95: 2200,
        p99: 2200,
        error_rate: 0.13,
        median: 980,
        label: "TOTAL"
      }
    });
  });

  it('complex jtl file', () => {
    const result = parse('./tests/data/complex.jtl');
    expect(result.transactions['S01_Create_Booking_T01_Application_Launch']).deep.equals({
      label: 'S01_Create_Booking_T01_Application_Launch',
      samples: 5,
      errors: 0,
      elapsed_times: [1010, 521, 465, 358, 356],
      max: 1010,
      median: 358,
      min: 356,
      total: 2710,
      received: 230278,
      sent: 31395,
      start: 1675348044597,
      parent: true,
      end: 1675348046201,
      tps: 3.117206982543641,
      average: 542,
      p50: 465,
      p90: 1010,
      p95: 1010,
      p99: 1010,
      error_rate: 0
    });
  });

});

describe('aggregate', () => {

  it('simple jtl file', () => {
    const result = aggregate('./tests/data/simple.jtl');
    expect(result).deep.equals([
      {
        Label: 'call1',
        '# Samples': 4,
        Throughput: 3.5335689045936394,
        Average: 837,
        Median: 523,
        '90% Line': 1170,
        '95% Line': 1170,
        '99% Line': 1170,
        Min: 24,
        Max: 1170,
        'Error %': '0.25%',
        'Sent KB/sec': 175,
        'Received KB/sec': 175
      },
      {
        Label: 'call2',
        '# Samples': 4,
        Throughput: 35.714285714285715,
        Average: 1469.5,
        Median: 885,
        '90% Line': 2200,
        '95% Line': 2200,
        '99% Line': 2200,
        Min: 833,
        Max: 2200,
        'Error %': '0%',
        'Sent KB/sec': 180,
        'Received KB/sec': 180
      },
      {
        Label: 'TOTAL',
        '# Samples': 8,
        Throughput: 7.067137809187279,
        Average: 1153.25,
        Median: 980,
        '90% Line': 2200,
        '95% Line': 2200,
        '99% Line': 2200,
        Min: 24,
        Max: 2200,
        'Error %': '0.13%',
        'Sent KB/sec': 355,
        'Received KB/sec': 355
      }
    ]);
  });

});
