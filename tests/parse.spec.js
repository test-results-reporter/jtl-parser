const { parse } = require('../src');
const { expect } = require('chai');

describe('parse', () => {

  it('simple jtl file', () => {
    const result = parse('./tests/data/simple.jtl');
    expect(result).deep.equals({
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
        parent: false
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
        parent: false
      }
    });
  });

  it('complex jtl file', () => {
    const result = parse('./tests/data/complex.jtl');
    expect(result['S01_Create_Booking_T01_Application_Launch']).deep.equals({
      label: 'S01_Create_Booking_T01_Application_Launch',
      samples: 5,
      errors: 0,
      elapsed_times: [1010, 521, 465, 358, 356],
      max: 1010,
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
