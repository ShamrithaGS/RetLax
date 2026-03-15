'use client';

import { RetirementInputs, RetirementResults, formatCurrency } from '@/lib/retirement';

interface Props {
  inputsA: RetirementInputs;
  resultsA: RetirementResults;
  inputsB: RetirementInputs;
  resultsB: RetirementResults;
  onClear: () => void;
}

type CompRow = {
  label: string;
  a: string;
  b: string;
  winner?: 'a' | 'b' | 'tie';
};

export function ScenarioComparison({ inputsA, resultsA, inputsB, resultsB, onClear }: Props) {
  const rows: CompRow[] = [
    {
      label: 'Retirement Age',
      a: `${inputsA.retirementAge} yrs`,
      b: `${inputsB.retirementAge} yrs`,
    },
    {
      label: 'Monthly Expenses',
      a: formatCurrency(inputsA.currentMonthlyExpenses),
      b: formatCurrency(inputsB.currentMonthlyExpenses),
    },
    {
      label: 'Corpus Required',
      a: formatCurrency(resultsA.retirementCorpus),
      b: formatCurrency(resultsB.retirementCorpus),
      winner: resultsA.retirementCorpus <= resultsB.retirementCorpus ? 'a' : 'b',
    },
    {
      label: 'Monthly SIP',
      a: formatCurrency(resultsA.requiredMonthlySIP),
      b: formatCurrency(resultsB.requiredMonthlySIP),
      winner: resultsA.requiredMonthlySIP <= resultsB.requiredMonthlySIP ? 'a' : 'b',
    },
    {
      label: 'Total Invested',
      a: formatCurrency(resultsA.totalInvested),
      b: formatCurrency(resultsB.totalInvested),
      winner: resultsA.totalInvested <= resultsB.totalInvested ? 'a' : 'b',
    },
    {
      label: 'Wealth Created',
      a: formatCurrency(resultsA.wealthGained),
      b: formatCurrency(resultsB.wealthGained),
      winner: resultsA.wealthGained >= resultsB.wealthGained ? 'a' : 'b',
    },
    {
      label: 'Expense at Retirement',
      a: formatCurrency(resultsA.retirementAnnualExpense) + '/yr',
      b: formatCurrency(resultsB.retirementAnnualExpense) + '/yr',
    },
    {
      label: 'MC Success Rate',
      a: `${resultsA.monteCarlo.successRate.toFixed(0)}%`,
      b: `${resultsB.monteCarlo.successRate.toFixed(0)}%`,
      winner: resultsA.monteCarlo.successRate >= resultsB.monteCarlo.successRate ? 'a' : 'b',
    },
    {
      label: 'Pre-retirement Return',
      a: `${(inputsA.preRetirementReturn * 100).toFixed(1)}% p.a.`,
      b: `${(inputsB.preRetirementReturn * 100).toFixed(1)}% p.a.`,
    },
  ];

  return (
    <div className="scenario-comparison" role="region" aria-label="Scenario A vs B comparison">
      <div className="scenario-comparison-header">
        <h3>Scenario Comparison</h3>
        <button
          type="button"
          className="hb-btn-ghost"
          onClick={onClear}
          style={{ padding: '6px 14px', fontSize: 12 }}
          aria-label="Clear scenario comparison"
        >
          ✕ Clear
        </button>
      </div>

      <div className="scenario-col-headers" aria-hidden="true">
        <div />
        <div className="scenario-col-label scenario-a">Scenario A<span>(saved)</span></div>
        <div className="scenario-col-label scenario-b">Scenario B<span>(current)</span></div>
      </div>

      <table className="scenario-table" aria-label="Side-by-side scenario comparison">
        <thead className="sr-only">
          <tr>
            <th>Metric</th>
            <th>Scenario A (Saved)</th>
            <th>Scenario B (Current)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.label}>
              <td className="scenario-row-label">{row.label}</td>
              <td className={`scenario-cell${row.winner === 'a' ? ' winner' : ''}`}>
                {row.winner === 'a' && <span className="winner-dot" aria-label="better value" />}
                {row.a}
              </td>
              <td className={`scenario-cell${row.winner === 'b' ? ' winner' : ''}`}>
                {row.winner === 'b' && <span className="winner-dot" aria-label="better value" />}
                {row.b}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="scenario-note">
        Green dot indicates the more favourable value. All figures are illustrative only.
      </p>
    </div>
  );
}
