const { parse } = require('../src');
const { expect } = require('chai');

describe('parse', () => {

  it('jtl file', () => {
    const result = parse('./tests/data/test.jtl');
    expect(result).deep.equals({
      call1: {
        label: 'call1',
        samples: 4,
        errors: 1,
        elapsed_times: [1170, 1131, 1023, 24],
        max: 1170,
        min: 24,
        total: 3348,
        received: 0,
        sent: 0,
        average: 837,
        p50: 1131,
        p90: 1170,
        p95: 1170,
        p99: 1170,
        error_rate: 0.25,
        start: 1448450968840,
        end: 1448450969972,
        tps: 0.0035335689045936395
      },
      call2: {
        label: 'call2',
        samples: 4,
        errors: 0,
        elapsed_times: [2200, 1907, 938, 833],
        max: 2200,
        min: 833,
        total: 5878,
        received: 0,
        sent: 0,
        average: 1469.5,
        p50: 1907,
        p90: 2200,
        p95: 2200,
        p99: 2200,
        error_rate: 0,
        start: 1448450969091,
        end: 1448450969203,
        tps: 0.03571428571428571
      }
    });
  });

});