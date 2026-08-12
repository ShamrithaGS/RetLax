'use client';

import { RetirementResults, RetirementInputs, formatCurrency } from '@/lib/retirement';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface Props {
  results: RetirementResults | null;
  inputs: RetirementInputs;
  currentStep: number;
  onSaveScenarioA: () => void;
  compareMode: boolean;
}

function AnimVal({ v }: { v: number }) {
  const a = useAnimatedCounter(v, 800, true);
  return <>{formatCurrency(a)}</>;
}

export function LiveResultsPanel({ results, inputs, currentStep, onSaveScenarioA, compareMode }: Props) {
  if (currentStep === 4) return null;

  return (
    <aside className="hb-live-panel" aria-label="Live retirement estimate" aria-live="polite" aria-atomic="false">
      {}
      <div className="hb-results-hero">
        <p className="hb-results-hero-label">
          {results ? 'Estimated Corpus Required' : 'Complete Step 1 to see your estimate'}
        </p>
        {results && (
          <>
            <p className="hb-results-hero-value" aria-live="polite" aria-atomic="true">
              <AnimVal v={results.retirementCorpus} />
            </p>
            <p style={{ fontSize: 11, color: 'var(--blue)', marginTop: 4, fontWeight: 500 }}>
              at age {inputs.retirementAge} · illustrative only
            </p>
          </>
        )}
      </div>

      {}
      {results && (
        <>
          <div className="hb-results-body">
            <div className="hb-result-row">
              <span className="hb-result-label">Monthly SIP Required</span>
              <span className="hb-result-value primary"><AnimVal v={results.requiredMonthlySIP} /></span>
            </div>
            {inputs.enableTopUp && (
              <div className="hb-result-row">
                <span className="hb-result-label">With {(inputs.topUpRate*100).toFixed(0)}% Step-Up</span>
                <span className="hb-result-value" style={{ color: 'var(--success)' }}>
                  <AnimVal v={results.requiredMonthlySIPWithTopUp} />
                </span>
              </div>
            )}
            <div className="hb-result-row">
              <span className="hb-result-label">Annual Expense at Retirement</span>
              <span className="hb-result-value"><AnimVal v={results.retirementAnnualExpense} /></span>
            </div>
            <div className="hb-result-row">
              <span className="hb-result-label">Years to Retire</span>
              <span className="hb-result-value">{results.yearsToRetirement} years</span>
            </div>
            <div className="hb-result-row">
              <span className="hb-result-label">Retirement Duration</span>
              <span className="hb-result-value">{results.yearsInRetirement} years</span>
            </div>
            {results.monteCarlo.successRate > 0 && results.monteCarlo.successRate !== -1 && (
              <div className="hb-result-row">
                <span className="hb-result-label">Plan Resilience</span>
                <span className="hb-result-value" style={{
                  color: results.monteCarlo.successRate >= 80 ? 'var(--success)' : 'var(--amber)',
                }}>
                  {results.monteCarlo.successRate.toFixed(0)}% success
                </span>
              </div>
            )}
          </div>

          {results.realRateWarning && (
            <div className="hb-warning" role="alert" style={{ margin: '8px 0 0', borderRadius: '0 0 6px 6px' }}>
              <span aria-hidden="true">⚠️ </span>{results.realRateWarning}
            </div>
          )}

          {}
          <div className="hb-panel-actions" style={{ borderRadius: '0', border: '1px solid var(--grey-border)', borderTop: 'none' }}>
            {!compareMode ? (
              <button type="button" className="hb-btn-secondary" onClick={onSaveScenarioA}
                aria-label="Save current inputs as Scenario A for comparison" style={{ fontSize: 11 }}>
                Save as Scenario A
              </button>
            ) : (
              <p style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, margin: 0 }}>✓ Scenario A saved</p>
            )}
          </div>

          <div className="hb-panel-disclaimer">
            Illustrative only. Not a guarantee. All assumptions user-defined.
          </div>
        </>
      )}
    </aside>
  );
}
