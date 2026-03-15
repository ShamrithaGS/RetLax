import {
  inflateExpenses, calculateCorpus, calculateRequiredSIP,
  calculateTopUpSIP, buildCorpusDepletionTable,
  findBreakEvenAge, runMonteCarlo, calculateRetirement, DEFAULT_INPUTS,
} from '../lib/retirement';

describe('inflateExpenses', () => {
  it('inflates each bucket at its own rate', () => {
    const inputs = { ...DEFAULT_INPUTS, currentMonthlyExpenses: 50000, retirementAge: 40, currentAge: 30 };
    const { basicInflated, lifestyleInflated, healthcareInflated } = inflateExpenses(inputs);
    expect(basicInflated).toBeCloseTo(300000 * Math.pow(1.06, 10), -2);
    expect(lifestyleInflated).toBeCloseTo(180000 * Math.pow(1.05, 10), -2);
    expect(healthcareInflated).toBeCloseTo(120000 * Math.pow(1.08, 10), -2);
  });

  it('returns zero when expenses are zero', () => {
    const r = inflateExpenses({ ...DEFAULT_INPUTS, currentMonthlyExpenses: 0 });
    expect(r.totalRetirementExpense).toBe(0);
  });
});

describe('calculateCorpus', () => {
  it('returns annualExpense × years when rate and inflation are both 0', () => {
    expect(calculateCorpus(100000, 0, 20, 0)).toBe(2000000);
  });

  it('uses growing annuity PV formula — deterministic run ends at zero', () => {
    const r = 0.08, g = 0.06, t = 25, annual = 1000000;
    const corpus = calculateCorpus(annual, r, t, g);
    let balance = corpus, withdrawal = annual;
    for (let y = 0; y < t; y++) {
      balance = balance * (1 + r) - withdrawal;
      withdrawal *= (1 + g);
    }
    expect(balance).toBeCloseTo(0, -2); 
  });

  it('growing annuity corpus > flat annuity corpus when inflation > 0', () => {
    const corpus_growing = calculateCorpus(500000, 0.08, 25, 0.06);
    const corpus_flat    = calculateCorpus(500000, 0.08, 25, 0);
    expect(corpus_growing).toBeGreaterThan(corpus_flat);
  });

  it('longer retirement needs larger corpus', () => {
    expect(calculateCorpus(500000, 0.07, 30, 0.05)).toBeGreaterThan(calculateCorpus(500000, 0.07, 20, 0.05));
  });

  it('when r equals g, uses L-Hopital limit: PMT * t / (1 + r)', () => {
    const annual = 1000000, r = 0.06, t = 20;
    expect(calculateCorpus(annual, r, t, r)).toBeCloseTo(annual * t / (1 + r), -2);
  });
});

describe('calculateRequiredSIP', () => {
  it('returns corpus/months when rate is 0', () => {
    expect(calculateRequiredSIP(1200000, 0, 10)).toBeCloseTo(10000, 0);
  });

  it('forward simulation reaches target corpus', () => {
    const corpus = 5000000;
    const sip = calculateRequiredSIP(corpus, 0.12, 20);
    const r = 0.12 / 12, n = 240;
    const fv = sip * ((Math.pow(1+r,n)-1)/r) * (1+r);
    expect(fv).toBeCloseTo(corpus, -3);
  });

  it('higher returns = lower SIP', () => {
    expect(calculateRequiredSIP(5000000, 0.12, 20)).toBeLessThan(calculateRequiredSIP(5000000, 0.10, 20));
  });
});

describe('calculateTopUpSIP', () => {
  it('first-year SIP is lower than flat SIP', () => {
    const flat = calculateRequiredSIP(5000000, 0.12, 20);
    const topUp = calculateTopUpSIP(5000000, 0.12, 20, 0.10);
    expect(topUp).toBeLessThan(flat * 0.85);
  });
});

describe('buildCorpusDepletionTable - inflation-adjusted', () => {
  it('withdrawal in later rows is larger (inflation-adjusted)', () => {
    const rows = buildCorpusDepletionTable(10000000, 600000, 0.08, 0.06, 60, 80);
    expect(rows[5].annualWithdrawal).toBeGreaterThan(rows[0].annualWithdrawal);
  });

  it('generates rows for each retirement year', () => {
    const rows = buildCorpusDepletionTable(10000000, 600000, 0.08, 0.06, 60, 80);
    expect(rows.length).toBe(20);
    expect(rows[0].age).toBe(60);
  });
});

describe('findBreakEvenAge', () => {
  it('returns null when corpus is large enough', () => {
    expect(findBreakEvenAge(100000000, 100000, 0.08, 0.06, 60)).toBeNull();
  });

  it('returns age when corpus depletes', () => {
    const age = findBreakEvenAge(1000000, 600000, 0.04, 0.06, 60);
    expect(age).not.toBeNull();
    expect(age!).toBeGreaterThan(60);
    expect(age!).toBeLessThan(70);
  });
});

describe('runMonteCarlo', () => {
  it('returns success rate between 0 and 100', () => {
    const mc = runMonteCarlo(10000000, 500000, 0.08, 0.06, 25, 100);
    expect(mc.successRate).toBeGreaterThanOrEqual(0);
    expect(mc.successRate).toBeLessThanOrEqual(100);
  });

  it('larger corpus has higher success rate', () => {
    const mc1 = runMonteCarlo(5000000,  500000, 0.08, 0.06, 25, 200);
    const mc2 = runMonteCarlo(20000000, 500000, 0.08, 0.06, 25, 200);
    expect(mc2.successRate).toBeGreaterThanOrEqual(mc1.successRate);
  });

  it('percentiles are ordered p10 <= p25 <= p50 <= p75 <= p90', () => {
    const mc = runMonteCarlo(10000000, 400000, 0.08, 0.06, 20, 200);
    expect(mc.p10).toBeLessThanOrEqual(mc.p25);
    expect(mc.p25).toBeLessThanOrEqual(mc.p50);
    expect(mc.p50).toBeLessThanOrEqual(mc.p75);
    expect(mc.p75).toBeLessThanOrEqual(mc.p90);
  });
});

describe('calculateRetirement - integration', () => {
  it('produces non-zero corpus and SIP for defaults', () => {
    const r = calculateRetirement(DEFAULT_INPUTS);
    expect(r.retirementCorpus).toBeGreaterThan(0);
    expect(r.requiredMonthlySIP).toBeGreaterThan(0);
  });

  it('existing savings reduce required SIP', () => {
    const r1 = calculateRetirement(DEFAULT_INPUTS);
    const r2 = calculateRetirement({ ...DEFAULT_INPUTS, existingSavings: 1000000 });
    expect(r2.requiredMonthlySIP).toBeLessThan(r1.requiredMonthlySIP);
  });

  it('top-up SIP is lower than flat SIP', () => {
    const r = calculateRetirement({ ...DEFAULT_INPUTS, enableTopUp: true, topUpRate: 0.10 });
    expect(r.requiredMonthlySIPWithTopUp).toBeLessThan(r.requiredMonthlySIP);
  });

  it('warns when returns <= inflation', () => {
    const r = calculateRetirement({ ...DEFAULT_INPUTS, postRetirementReturn: 0.04, generalInflationRate: 0.06 });
    expect(r.realRateWarning).not.toBeNull();
  });

  it('no warning for healthy default inputs', () => {
    expect(calculateRetirement(DEFAULT_INPUTS).realRateWarning).toBeNull();
  });

  it('inflation-adjusted depletion table has growing withdrawals', () => {
    const r = calculateRetirement(DEFAULT_INPUTS);
    if (r.corpusDepletionTable.length > 5) {
      expect(r.corpusDepletionTable[5].annualWithdrawal).toBeGreaterThan(r.corpusDepletionTable[0].annualWithdrawal);
    }
  });

  it('monteCarlo successRate is populated', () => {
    const r = calculateRetirement(DEFAULT_INPUTS);
    expect(r.monteCarlo.successRate).toBeGreaterThanOrEqual(0);
    expect(r.monteCarlo.successRate).toBeLessThanOrEqual(100);
  });
});
