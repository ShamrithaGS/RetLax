export interface RetirementInputs {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  currentMonthlyExpenses: number;
  generalInflationRate: number;
  medicalInflationRate: number;
  lifestyleInflationRate: number;
  basicExpenseFraction: number;
  lifestyleExpenseFraction: number;
  healthcareExpenseFraction: number;
  preRetirementReturn: number;
  postRetirementReturn: number;
  enableTopUp: boolean;
  topUpRate: number;
  existingSavings: number;
  enableTax: boolean;
  taxRate: number;
  enableGlidePath: boolean;
}

export interface CorpusDepletionRow {
  age: number;
  openingCorpus: number;
  annualWithdrawal: number; 
  returns: number;
  taxPaid: number;
  closingCorpus: number;
}

export interface MonteCarloResult {
  p10: number; 
  p25: number;
  p50: number; 
  p75: number;
  p90: number;
  successRate: number; 
  ruinAge: number;     
}

export interface SensitivityCell {
  corpus: number;
  sip: number;
  inflationLabel: string;
  returnLabel: string;
  actualReturn: number;       
  actualInflation: number;    
  isBase: boolean;
}

export interface RetirementResults {
  yearsToRetirement: number;
  yearsInRetirement: number;
  retirementAnnualExpense: number;
  basicInflated: number;
  lifestyleInflated: number;
  healthcareInflated: number;
  retirementCorpus: number;
  requiredMonthlySIP: number;
  requiredMonthlySIPWithTopUp: number;
  sensitivityLow: number;
  sensitivityMid: number;
  sensitivityHigh: number;
  sipSensitivityLow: number;
  sipSensitivityHigh: number;
  sensitivityMatrix: SensitivityCell[][];
  totalInvested: number;
  wealthGained: number;
  corpusDepletionTable: CorpusDepletionRow[];
  realRateWarning: string | null;
  monteCarlo: MonteCarloResult;
  breakEvenAge: number | null; 
  blendedInflation: number;
}

// Seedable PRNG (mulberry32) for reproducible Monte Carlo runs
export function createPRNG(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function inflateExpenses(inputs: {
  currentAge: number;
  retirementAge: number;
  currentMonthlyExpenses: number;
  basicExpenseFraction: number;
  lifestyleExpenseFraction: number;
  healthcareExpenseFraction: number;
  generalInflationRate: number;
  lifestyleInflationRate: number;
  medicalInflationRate: number;
}) {
  const t = inputs.retirementAge - inputs.currentAge;
  const annual = inputs.currentMonthlyExpenses * 12;
  const basicNow      = annual * inputs.basicExpenseFraction;
  const lifestyleNow  = annual * inputs.lifestyleExpenseFraction;
  const healthcareNow = annual * inputs.healthcareExpenseFraction;
  return {
    basicInflated:      basicNow      * Math.pow(1 + inputs.generalInflationRate,   t),
    lifestyleInflated:  lifestyleNow  * Math.pow(1 + inputs.lifestyleInflationRate, t),
    healthcareInflated: healthcareNow * Math.pow(1 + inputs.medicalInflationRate,   t),
    totalRetirementExpense:
      basicNow      * Math.pow(1 + inputs.generalInflationRate,   t) +
      lifestyleNow  * Math.pow(1 + inputs.lifestyleInflationRate, t) +
      healthcareNow * Math.pow(1 + inputs.medicalInflationRate,   t),
  };
}

export function calculateCorpus(
  annualExpense: number,
  postRetirementReturn: number,
  yearsInRetirement: number,
  inflationRate = 0,
  enableTax = false,
  taxRate = 0.15
): number {
  const effectiveAnnualExpense = enableTax ? annualExpense / (1 - taxRate) : annualExpense;
  const r = postRetirementReturn, g = inflationRate, t = yearsInRetirement;
  if (r === 0 && g === 0) return effectiveAnnualExpense * t;
  if (Math.abs(r - g) < 1e-9) return effectiveAnnualExpense * t / (1 + r);
  return effectiveAnnualExpense * (1 - Math.pow((1 + g) / (1 + r), t)) / (r - g);
}

// Asset Allocation Glide Path pre-retirement growth calculation
export function calculatePreRetirementGrowth(
  principal: number,
  monthlySip: number,
  preRetirementReturn: number,
  postRetirementReturn: number,
  yearsToRetirement: number,
  enableGlidePath: boolean,
  enableTopUp = false,
  topUpRate = 0.10
): { futureValue: number; totalInvested: number } {
  let fv = principal;
  let totalInvested = 0;
  
  if (yearsToRetirement <= 0) {
    return { futureValue: principal, totalInvested: 0 };
  }

  if (!enableGlidePath) {
    const r = preRetirementReturn / 12;
    const n = yearsToRetirement * 12;
    
    // Existing savings future value
    const fvSavings = principal * Math.pow(1 + preRetirementReturn, yearsToRetirement);
    
    // SIP future value
    let fvSip = 0;
    if (enableTopUp) {
      for (let y = 0; y < yearsToRetirement; y++) {
        const sip = monthlySip * Math.pow(1 + topUpRate, y);
        totalInvested += sip * 12;
        const mRem = (yearsToRetirement - y) * 12;
        const fvYear = r === 0 ? sip * 12 : sip * ((Math.pow(1 + r, 12) - 1) / r) * (1 + r);
        fvSip += fvYear * Math.pow(1 + r, mRem - 12);
      }
    } else {
      totalInvested = monthlySip * n;
      fvSip = r === 0 ? monthlySip * n : monthlySip * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    }
    
    return { futureValue: fvSavings + fvSip, totalInvested };
  }

  // Linear Glide Path calculation: month-by-month calculation to capture the changing rate
  const totalMonths = yearsToRetirement * 12;
  for (let m = 0; m < totalMonths; m++) {
    const currentYear = Math.floor(m / 12);
    // Linear transition of annual rate from preRetirementReturn to postRetirementReturn
    const annualRate = preRetirementReturn - (m / totalMonths) * (preRetirementReturn - postRetirementReturn);
    const monthlyRate = annualRate / 12;
    
    // Current SIP payment at the beginning of the month
    let sipAmount = 0;
    if (monthlySip > 0) {
      const stepUpFactor = enableTopUp ? Math.pow(1 + topUpRate, currentYear) : 1;
      sipAmount = monthlySip * stepUpFactor;
      if (m % 12 === 0) {
        // Track investment only once per month
      }
      totalInvested += sipAmount;
    }
    
    fv = (fv + sipAmount) * (1 + monthlyRate);
  }
  
  return { futureValue: fv, totalInvested };
}

export function calculateRequiredSIP(
  targetCorpus: number,
  preRetirementReturn: number,
  postRetirementReturn: number,
  yearsToRetirement: number,
  enableGlidePath = false
): number {
  if (yearsToRetirement <= 0) return 0;
  
  // Quick binary search to find exact starting SIP
  let lo = 0, hi = targetCorpus / (yearsToRetirement * 12);
  if (hi <= 0) hi = 10000000;
  
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const { futureValue } = calculatePreRetirementGrowth(0, mid, preRetirementReturn, postRetirementReturn, yearsToRetirement, enableGlidePath);
    if (futureValue < targetCorpus) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

export function calculateTopUpSIP(
  targetCorpus: number,
  preRetirementReturn: number,
  postRetirementReturn: number,
  yearsToRetirement: number,
  topUpRate: number,
  enableGlidePath = false
): number {
  if (yearsToRetirement <= 0) return 0;
  
  let lo = 0, hi = targetCorpus;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const { futureValue } = calculatePreRetirementGrowth(0, mid, preRetirementReturn, postRetirementReturn, yearsToRetirement, enableGlidePath, true, topUpRate);
    if (futureValue < targetCorpus) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

export function buildCorpusDepletionTable(
  corpus: number,
  firstYearExpense: number,
  postRetirementReturn: number,
  blendedInflation: number,
  retirementAge: number,
  lifeExpectancy: number,
  enableTax = false,
  taxRate = 0.15
): CorpusDepletionRow[] {
  const rows: CorpusDepletionRow[] = [];
  let balance = corpus;
  let netWithdrawal = firstYearExpense;
  const limit = lifeExpectancy - retirementAge;
  for (let i = 0; i < limit; i++) {
    const age = retirementAge + i;
    const opening = Math.max(0, balance);
    if (opening <= 0) break;
    
    // Withdrawal required covers the net expense + tax on withdrawal
    const withdrawal = enableTax ? netWithdrawal / (1 - taxRate) : netWithdrawal;
    const taxPaid = enableTax ? withdrawal - netWithdrawal : 0;
    
    const returns = opening * postRetirementReturn;
    const closing = opening + returns - withdrawal;
    rows.push({ age, openingCorpus: opening, annualWithdrawal: netWithdrawal, returns, taxPaid, closingCorpus: closing });
    balance = closing;
    netWithdrawal *= (1 + blendedInflation); 
  }
  return rows;
}

export function findBreakEvenAge(
  corpus: number,
  firstYearExpense: number,
  postRetirementReturn: number,
  blendedInflation: number,
  retirementAge: number,
  enableTax = false,
  taxRate = 0.15
): number | null {
  let balance = corpus;
  let netWithdrawal = firstYearExpense;
  for (let i = 0; i < 60; i++) {
    const withdrawal = enableTax ? netWithdrawal / (1 - taxRate) : netWithdrawal;
    const returns = balance * postRetirementReturn;
    balance = balance + returns - withdrawal;
    netWithdrawal *= (1 + blendedInflation);
    if (balance <= 0) return retirementAge + i + 1;
  }
  return null; 
}

export function runMonteCarlo(
  corpus: number,
  firstYearExpense: number,
  meanReturn: number,
  blendedInflation: number,
  yearsInRetirement: number,
  enableTax = false,
  taxRate = 0.15,
  simulations = 500,
  seed = 42
): MonteCarloResult {
  if (yearsInRetirement <= 0) {
    return { p10: corpus, p25: corpus, p50: corpus, p75: corpus, p90: corpus, successRate: 100, ruinAge: 0 };
  }
  const sigma = meanReturn >= 0.10 ? 0.12 : meanReturn >= 0.07 ? 0.09 : 0.07;
  const mu = Math.log(1 + meanReturn) - 0.5 * sigma * sigma;

  const endCorpora: number[] = [];
  let successCount = 0;
  const ruinAges: number[] = [];
  const rng = createPRNG(seed);

  for (let s = 0; s < simulations; s++) {
    let balance = corpus;
    let netWithdrawal = firstYearExpense;
    let ruined = false;
    let ruinYear = -1;

    for (let y = 0; y < yearsInRetirement; y++) {
      const u1 = Math.max(1e-10, rng());
      const u2 = rng();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const annualReturn = Math.exp(mu + sigma * z) - 1;
      const withdrawal = enableTax ? netWithdrawal / (1 - taxRate) : netWithdrawal;

      balance = balance * (1 + annualReturn) - withdrawal;
      netWithdrawal *= (1 + blendedInflation);

      if (balance <= 0 && !ruined) {
        ruined = true;
        ruinYear = y;
      }
    }

    endCorpora.push(Math.max(0, balance));
    if (!ruined) successCount++;
    if (ruined) ruinAges.push(ruinYear);
  }

  endCorpora.sort((a, b) => a - b);
  const pct = (p: number) => endCorpora[Math.floor(p * simulations / 100)];
  const medianRuinYear = ruinAges.length > 0
    ? ruinAges.sort((a, b) => a - b)[Math.floor(ruinAges.length / 2)]
    : yearsInRetirement;

  return {
    p10: pct(10), p25: pct(25), p50: pct(50), p75: pct(75), p90: pct(90),
    successRate: (successCount / simulations) * 100,
    ruinAge: medianRuinYear,
  };
}

export function calculateRetirement(inputs: RetirementInputs): RetirementResults {
  const yearsToRetirement = inputs.retirementAge - inputs.currentAge;
  const yearsInRetirement = inputs.lifeExpectancy - inputs.retirementAge;

  const { basicInflated, lifestyleInflated, healthcareInflated, totalRetirementExpense } =
    inflateExpenses(inputs);

  const blendedInflation =
    inputs.generalInflationRate   * inputs.basicExpenseFraction +
    inputs.lifestyleInflationRate * inputs.lifestyleExpenseFraction +
    inputs.medicalInflationRate   * inputs.healthcareExpenseFraction;

  const rawCorpus = calculateCorpus(totalRetirementExpense, inputs.postRetirementReturn, yearsInRetirement, blendedInflation, inputs.enableTax, inputs.taxRate);
  
  // Calculate existing savings compounded to retirement age (optionally with linear glide path)
  const { futureValue: existingSavingsFV } = calculatePreRetirementGrowth(
    inputs.existingSavings,
    0,
    inputs.preRetirementReturn,
    inputs.postRetirementReturn,
    yearsToRetirement,
    inputs.enableGlidePath
  );
  
  const retirementCorpus = Math.max(0, rawCorpus - existingSavingsFV);

  const requiredMonthlySIP = retirementCorpus > 0
    ? calculateRequiredSIP(retirementCorpus, inputs.preRetirementReturn, inputs.postRetirementReturn, yearsToRetirement, inputs.enableGlidePath)
    : 0;

  const requiredMonthlySIPWithTopUp = (inputs.enableTopUp && retirementCorpus > 0)
    ? calculateTopUpSIP(retirementCorpus, inputs.preRetirementReturn, inputs.postRetirementReturn, yearsToRetirement, inputs.topUpRate, inputs.enableGlidePath)
    : requiredMonthlySIP;

  const lowPostReturn  = Math.max(0.01, inputs.postRetirementReturn - 0.02);
  const highPostReturn = inputs.postRetirementReturn + 0.01;
  const lowPreReturn   = Math.max(0.01, inputs.preRetirementReturn - 0.02);
  const highPreReturn  = inputs.preRetirementReturn + 0.02;

  const sensitivityLow  = calculateCorpus(totalRetirementExpense, lowPostReturn,  yearsInRetirement, blendedInflation, inputs.enableTax, inputs.taxRate);
  const sensitivityMid  = rawCorpus;
  const sensitivityHigh = calculateCorpus(totalRetirementExpense, highPostReturn, yearsInRetirement, blendedInflation, inputs.enableTax, inputs.taxRate);
  const sipSensitivityLow  = calculateRequiredSIP(retirementCorpus, lowPreReturn, inputs.postRetirementReturn, yearsToRetirement, inputs.enableGlidePath);
  const sipSensitivityHigh = calculateRequiredSIP(retirementCorpus, highPreReturn, inputs.postRetirementReturn, yearsToRetirement, inputs.enableGlidePath);

  const inflationOffsets = [-0.01, 0, 0.01];
  const returnOffsets    = [-0.02, 0, 0.01];
  
  // Memoized/extracted sensitivity matrix calculation helper
  const sensitivityMatrix: SensitivityCell[][] = inflationOffsets.map(infOff => {
    const adjInflation = Math.max(0.01, blendedInflation + infOff);
    return returnOffsets.map(retOff => {
      const adjReturn = Math.max(0.01, inputs.postRetirementReturn + retOff);

      const adjGeneralInf = Math.max(0.01, inputs.generalInflationRate + infOff);
      const adjInputs = { ...inputs, generalInflationRate: adjGeneralInf, lifestyleInflationRate: Math.max(0.01, inputs.lifestyleInflationRate + infOff), medicalInflationRate: Math.max(0.01, inputs.medicalInflationRate + infOff) };
      const { totalRetirementExpense: adjExpense } = inflateExpenses(adjInputs);
      
      const adjCorpus = calculateCorpus(adjExpense, adjReturn, yearsInRetirement, adjInflation, inputs.enableTax, inputs.taxRate);
      
      // Calculate adjusted savings FV with potential glide path return shifting as postRetReturn shifts
      const { futureValue: adjSavingsFV } = calculatePreRetirementGrowth(
        inputs.existingSavings,
        0,
        inputs.preRetirementReturn,
        adjReturn,
        yearsToRetirement,
        inputs.enableGlidePath
      );
      
      const adjNetCorpus = Math.max(0, adjCorpus - adjSavingsFV);
      const adjSIP = adjNetCorpus > 0 ? calculateRequiredSIP(adjNetCorpus, inputs.preRetirementReturn, adjReturn, yearsToRetirement, inputs.enableGlidePath) : 0;
      return {
        corpus: adjCorpus,
        sip: adjSIP,
        inflationLabel: infOff === 0 ? 'Base' : infOff < 0 ? `−${Math.abs(infOff*100).toFixed(0)}%` : `+${(infOff*100).toFixed(0)}%`,
        returnLabel: retOff === 0 ? 'Base' : retOff < 0 ? `−${Math.abs(retOff*100).toFixed(0)}%` : `+${(retOff*100).toFixed(0)}%`,
        actualReturn: adjReturn,
        actualInflation: adjInflation,
        isBase: infOff === 0 && retOff === 0,
      };
    });
  });

  const totalInvested = inputs.enableTopUp
    ? (() => {
        const { totalInvested } = calculatePreRetirementGrowth(
          inputs.existingSavings,
          requiredMonthlySIPWithTopUp,
          inputs.preRetirementReturn,
          inputs.postRetirementReturn,
          yearsToRetirement,
          inputs.enableGlidePath,
          true,
          inputs.topUpRate
        );
        return totalInvested;
      })()
    : requiredMonthlySIP * yearsToRetirement * 12;

  const wealthGained = retirementCorpus - totalInvested;

  const corpusDepletionTable = buildCorpusDepletionTable(
    rawCorpus, totalRetirementExpense, inputs.postRetirementReturn,
    blendedInflation, inputs.retirementAge, inputs.lifeExpectancy,
    inputs.enableTax, inputs.taxRate
  );

  const breakEvenAge = findBreakEvenAge(
    rawCorpus, totalRetirementExpense, inputs.postRetirementReturn,
    blendedInflation, inputs.retirementAge, inputs.enableTax, inputs.taxRate
  );

  const monteCarlo = runMonteCarlo(
    rawCorpus, totalRetirementExpense, inputs.postRetirementReturn,
    blendedInflation, yearsInRetirement, inputs.enableTax, inputs.taxRate
  );

  let realRateWarning: string | null = null;
  if (inputs.postRetirementReturn <= blendedInflation)
    realRateWarning = `Post-retirement return (${(inputs.postRetirementReturn*100).toFixed(1)}%) ≤ blended inflation (~${(blendedInflation*100).toFixed(1)}%). Corpus may lose purchasing power in real terms.`;
  if (inputs.preRetirementReturn <= inputs.generalInflationRate) {
    const msg = `Pre-retirement return (${(inputs.preRetirementReturn*100).toFixed(1)}%) ≤ general inflation (${(inputs.generalInflationRate*100).toFixed(1)}%). Investments may not grow in real terms.`;
    realRateWarning = realRateWarning ? `${realRateWarning} Also: ${msg}` : msg;
  }

  return {
    yearsToRetirement, yearsInRetirement,
    retirementAnnualExpense: totalRetirementExpense,
    basicInflated, lifestyleInflated, healthcareInflated,
    retirementCorpus, requiredMonthlySIP, requiredMonthlySIPWithTopUp,
    sensitivityLow, sensitivityMid, sensitivityHigh,
    sipSensitivityLow, sipSensitivityHigh,
    sensitivityMatrix,
    totalInvested, wealthGained,
    corpusDepletionTable, realRateWarning,
    monteCarlo, breakEvenAge, blendedInflation,
  };
}

export function formatCurrency(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000)   return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function formatCurrencyFull(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export const DEFAULT_INPUTS: RetirementInputs = {
  currentAge: 30, retirementAge: 60, lifeExpectancy: 85,
  currentMonthlyExpenses: 50000,
  generalInflationRate: 0.06, medicalInflationRate: 0.08, lifestyleInflationRate: 0.05,
  basicExpenseFraction: 0.50, lifestyleExpenseFraction: 0.30, healthcareExpenseFraction: 0.20,
  preRetirementReturn: 0.12, postRetirementReturn: 0.08,
  enableTopUp: false, topUpRate: 0.10,
  existingSavings: 0,
  enableTax: false,
  taxRate: 0.15,
  enableGlidePath: false,
};
