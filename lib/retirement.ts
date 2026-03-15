
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
}

export interface CorpusDepletionRow {
  age: number;
  openingCorpus: number;
  annualWithdrawal: number; 
  returns: number;
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

export function inflateExpenses(inputs: RetirementInputs) {
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
  inflationRate = 0
): number {
  const r = postRetirementReturn, g = inflationRate, t = yearsInRetirement;
  if (r === 0 && g === 0) return annualExpense * t;
  if (Math.abs(r - g) < 1e-9) return annualExpense * t / (1 + r);
  return annualExpense * (1 - Math.pow((1 + g) / (1 + r), t)) / (r - g);
}

export function calculateRequiredSIP(
  targetCorpus: number, annualReturn: number, years: number
): number {
  const r = annualReturn / 12, n = years * 12;
  if (r === 0) return targetCorpus / n;
  return (targetCorpus * r) / ((Math.pow(1 + r, n) - 1) * (1 + r));
}

export function calculateTopUpSIP(
  targetCorpus: number, annualReturn: number, years: number, topUpRate: number
): number {
  const r = annualReturn / 12;
  function fv(firstYearMonthly: number): number {
    let total = 0;
    for (let y = 0; y < years; y++) {
      const sip = firstYearMonthly * Math.pow(1 + topUpRate, y);
      const mRem = (years - y) * 12;
      const fvYear = sip * ((Math.pow(1 + r, 12) - 1) / r) * (1 + r);
      total += fvYear * Math.pow(1 + r, mRem - 12);
    }
    return total;
  }
  let lo = 100, hi = targetCorpus;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (fv(mid) < targetCorpus) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

export function buildCorpusDepletionTable(
  corpus: number,
  firstYearExpense: number,
  postRetirementReturn: number,
  blendedInflation: number,
  retirementAge: number,
  lifeExpectancy: number
): CorpusDepletionRow[] {
  const rows: CorpusDepletionRow[] = [];
  let balance = corpus;
  let withdrawal = firstYearExpense;
  for (let i = 0; i < lifeExpectancy - retirementAge; i++) {
    const age = retirementAge + i;
    const opening = Math.max(0, balance);
    if (opening <= 0) break;
    const returns = opening * postRetirementReturn;
    const closing = opening + returns - withdrawal;
    rows.push({ age, openingCorpus: opening, annualWithdrawal: withdrawal, returns, closingCorpus: closing });
    balance = closing;
    withdrawal *= (1 + blendedInflation); 
  }
  return rows;
}

export function findBreakEvenAge(
  corpus: number,
  firstYearExpense: number,
  postRetirementReturn: number,
  blendedInflation: number,
  retirementAge: number
): number | null {
  let balance = corpus;
  let withdrawal = firstYearExpense;
  for (let i = 0; i < 60; i++) {
    const returns = balance * postRetirementReturn;
    balance = balance + returns - withdrawal;
    withdrawal *= (1 + blendedInflation);
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
  simulations = 500
): MonteCarloResult {
  const sigma = meanReturn >= 0.10 ? 0.12 : meanReturn >= 0.07 ? 0.09 : 0.07;
  const mu = Math.log(1 + meanReturn) - 0.5 * sigma * sigma;

  const endCorpora: number[] = [];
  let successCount = 0;
  const ruinAges: number[] = [];

  for (let s = 0; s < simulations; s++) {
    let balance = corpus;
    let withdrawal = firstYearExpense;
    let ruined = false;
    let ruinYear = -1;

    for (let y = 0; y < yearsInRetirement; y++) {
      const u1 = Math.max(1e-10, Math.random());
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const annualReturn = Math.exp(mu + sigma * z) - 1;

      balance = balance * (1 + annualReturn) - withdrawal;
      withdrawal *= (1 + blendedInflation);

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

  const rawCorpus = calculateCorpus(totalRetirementExpense, inputs.postRetirementReturn, yearsInRetirement, blendedInflation);
  const existingSavingsFV = inputs.existingSavings * Math.pow(1 + inputs.preRetirementReturn, yearsToRetirement);
  const retirementCorpus = Math.max(0, rawCorpus - existingSavingsFV);

  const requiredMonthlySIP = retirementCorpus > 0
    ? calculateRequiredSIP(retirementCorpus, inputs.preRetirementReturn, yearsToRetirement)
    : 0;

  const requiredMonthlySIPWithTopUp = (inputs.enableTopUp && retirementCorpus > 0)
    ? calculateTopUpSIP(retirementCorpus, inputs.preRetirementReturn, yearsToRetirement, inputs.topUpRate)
    : requiredMonthlySIP;

  const lowPostReturn  = Math.max(0.01, inputs.postRetirementReturn - 0.02);
  const highPostReturn = inputs.postRetirementReturn + 0.01;
  const lowPreReturn   = Math.max(0.01, inputs.preRetirementReturn - 0.02);
  const highPreReturn  = inputs.preRetirementReturn + 0.02;

  const sensitivityLow  = calculateCorpus(totalRetirementExpense, lowPostReturn,  yearsInRetirement, blendedInflation);
  const sensitivityMid  = rawCorpus;
  const sensitivityHigh = calculateCorpus(totalRetirementExpense, highPostReturn, yearsInRetirement, blendedInflation);
  const sipSensitivityLow  = calculateRequiredSIP(retirementCorpus, lowPreReturn,  yearsToRetirement);
  const sipSensitivityHigh = calculateRequiredSIP(retirementCorpus, highPreReturn, yearsToRetirement);

  const inflationOffsets = [-0.01, 0, 0.01];
  const returnOffsets    = [-0.02, 0, 0.01];
  const sensitivityMatrix: SensitivityCell[][] = inflationOffsets.map(infOff => {
    const adjInflation = Math.max(0.01, blendedInflation + infOff);
    return returnOffsets.map(retOff => {
      const adjReturn = Math.max(0.01, inputs.postRetirementReturn + retOff);

      const adjGeneralInf = Math.max(0.01, inputs.generalInflationRate + infOff);
      const adjInputs = { ...inputs, generalInflationRate: adjGeneralInf, lifestyleInflationRate: Math.max(0.01, inputs.lifestyleInflationRate + infOff), medicalInflationRate: Math.max(0.01, inputs.medicalInflationRate + infOff) };
      const { totalRetirementExpense: adjExpense } = inflateExpenses(adjInputs);
      const adjCorpus = calculateCorpus(adjExpense, adjReturn, yearsInRetirement, adjInflation);
      const adjSavingsFV = inputs.existingSavings * Math.pow(1 + inputs.preRetirementReturn, yearsToRetirement);
      const adjNetCorpus = Math.max(0, adjCorpus - adjSavingsFV);
      const adjSIP = adjNetCorpus > 0 ? calculateRequiredSIP(adjNetCorpus, inputs.preRetirementReturn, yearsToRetirement) : 0;
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
    ? (() => { let t = 0; for (let y = 0; y < yearsToRetirement; y++) t += requiredMonthlySIPWithTopUp * Math.pow(1 + inputs.topUpRate, y) * 12; return t; })()
    : requiredMonthlySIP * yearsToRetirement * 12;

  const wealthGained = retirementCorpus - totalInvested;

  const corpusDepletionTable = buildCorpusDepletionTable(
    rawCorpus, totalRetirementExpense, inputs.postRetirementReturn,
    blendedInflation, inputs.retirementAge, inputs.lifeExpectancy
  );

  const breakEvenAge = findBreakEvenAge(
    rawCorpus, totalRetirementExpense, inputs.postRetirementReturn,
    blendedInflation, inputs.retirementAge
  );

  const monteCarlo = runMonteCarlo(
    rawCorpus, totalRetirementExpense, inputs.postRetirementReturn,
    blendedInflation, yearsInRetirement
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
};
