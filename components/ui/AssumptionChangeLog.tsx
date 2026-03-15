'use client';

import { RetirementInputs, DEFAULT_INPUTS } from '@/lib/retirement';

const LABELS: Partial<Record<keyof RetirementInputs, string>> = {
  currentAge: 'Current Age',
  retirementAge: 'Retirement Age',
  lifeExpectancy: 'Life Expectancy',
  currentMonthlyExpenses: 'Monthly Expenses',
  generalInflationRate: 'General Inflation',
  medicalInflationRate: 'Medical Inflation',
  lifestyleInflationRate: 'Lifestyle Inflation',
  basicExpenseFraction: 'Basic Needs Split',
  lifestyleExpenseFraction: 'Lifestyle Split',
  healthcareExpenseFraction: 'Healthcare Split',
  preRetirementReturn: 'Pre-retirement Return',
  postRetirementReturn: 'Post-retirement Return',
  enableTopUp: 'Top-Up SIP',
  topUpRate: 'Top-Up Rate',
  existingSavings: 'Existing Savings',
};

function formatVal(key: keyof RetirementInputs, value: RetirementInputs[typeof key]): string {
  if (typeof value === 'boolean') return value ? 'On' : 'Off';
  const pctKeys = ['generalInflationRate','medicalInflationRate','lifestyleInflationRate',
    'basicExpenseFraction','lifestyleExpenseFraction','healthcareExpenseFraction',
    'preRetirementReturn','postRetirementReturn','topUpRate'];
  if (pctKeys.includes(key)) return `${((value as number) * 100).toFixed(1)}%`;
  if (key === 'currentMonthlyExpenses' || key === 'existingSavings')
    return `₹${(value as number).toLocaleString('en-IN')}`;
  return String(value);
}

interface Props {
  changedKeys: Set<keyof RetirementInputs>;
  inputs: RetirementInputs;
}

export function AssumptionChangeLog({ changedKeys, inputs }: Props) {
  const changes = [...changedKeys].filter(k => LABELS[k]);
  if (changes.length === 0) return null;

  return (
    <div className="change-log" role="region" aria-label="Assumptions changed from defaults">
      <div className="change-log-header">
        <span aria-hidden="true">✏️</span>
        You've customised {changes.length} assumption{changes.length > 1 ? 's' : ''} from the defaults
      </div>
      <ul className="change-log-list" role="list">
        {changes.map(key => (
          <li key={key} className="change-log-item">
            <span className="change-log-name">{LABELS[key]}</span>
            <span className="change-log-from">{formatVal(key, DEFAULT_INPUTS[key])}</span>
            <span className="change-log-arrow" aria-hidden="true">→</span>
            <span className="change-log-to">{formatVal(key, inputs[key])}</span>
          </li>
        ))}
      </ul>
      <p className="change-log-note">
        All changes are illustrative assumptions. Not a recommendation or prediction.
      </p>
    </div>
  );
}
