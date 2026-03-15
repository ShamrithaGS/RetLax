'use client';

import { useEffect, useRef, useState } from 'react';
import { RetirementResults, RetirementInputs, formatCurrency } from '@/lib/retirement';
import { SectionTitle } from '@/components/ui/FormComponents';
import { DonutChart } from '@/components/ui/DonutChart';
import { MonteCarloChart } from '@/components/ui/MonteCarloChart';
import { WhatIfSliders } from '@/components/ui/WhatIfSliders';
import { AssumptionChangeLog } from '@/components/ui/AssumptionChangeLog';
import { ScenarioComparison } from '@/components/ui/ScenarioComparison';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface Props {
  results: RetirementResults;
  inputs: RetirementInputs;
  onBack: () => void;
  onReset: () => void;
  onCopyLink?: () => void;
  onSaveScenarioA?: () => void;
  scenarioA?: RetirementInputs | null;
  scenarioAResults?: RetirementResults | null;
  compareMode?: boolean;
  onClearComparison?: () => void;
  changedKeys?: Set<keyof RetirementInputs>;
}

function AnimatedMoney({ value }: { value: number }) {
  const animated = useAnimatedCounter(value, 1200, true);
  return <>{formatCurrency(animated)}</>;
}

export function Step4Results({
  results, inputs, onBack, onReset, onCopyLink,
  onSaveScenarioA, scenarioA, scenarioAResults,
  compareMode, onClearComparison, changedKeys,
}: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [showDepletionTable, setShowDepletionTable] = useState(false);
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState('r4-hero');

  useEffect(() => { headingRef.current?.focus(); }, []);

  const totalExpense = results.basicInflated + results.lifestyleInflated + results.healthcareInflated;
  const workingPct = (results.yearsToRetirement / (results.yearsToRetirement + results.yearsInRetirement)) * 100;
  const sipCoveredBySavings = results.requiredMonthlySIP === 0 && inputs.existingSavings > 0;
  const sipAsPercentOfExpenses = inputs.currentMonthlyExpenses > 0
    ? ((results.requiredMonthlySIP / inputs.currentMonthlyExpenses) * 100).toFixed(0)
    : '0';

  function handleCopy() {
    onCopyLink?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const breakEvenMsg = results.breakEvenAge
    ? `Under base assumptions, your corpus runs out at age ${results.breakEvenAge}. If you live beyond this, you may face a shortfall.`
    : `Under base assumptions, your corpus is projected to last your full retirement horizon. This is illustrative only.`;

  useEffect(() => {
    const sectionIds = ['r4-hero', 'r4-sip', 'r4-montecarlo', 'r4-whatif', 'r4-sensitivity', 'r4-assumptions'];
    const observers: IntersectionObserver[] = [];
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  const sections = [
    { id: 'r4-hero',        label: 'Summary' },
    { id: 'r4-sip',         label: 'SIP' },
    { id: 'r4-montecarlo',  label: 'Resilience' },
    { id: 'r4-whatif',      label: 'What-If' },
    { id: 'r4-sensitivity', label: 'Sensitivity' },
    { id: 'r4-assumptions', label: 'Assumptions' },
  ];

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });

  }

  return (
    <section aria-labelledby="step4-heading">
      <div className="animate-fade-in">
        <h2 id="step4-heading" ref={headingRef} tabIndex={-1} className="sr-only">
          Your Retirement Plan Results
        </h2>

        {}
        <nav className="results-section-nav" aria-label="Jump to section">
          {sections.map(s => (
            <button
              key={s.id}
              type="button"
              className={`rsn-btn${activeSection === s.id ? ' rsn-active' : ''}`}
              onClick={() => scrollTo(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>

        {}
        {results.realRateWarning && (
          <div className="warning-box" role="alert" style={{ marginBottom: 20 }}>
            <span aria-hidden="true">⚠️</span> {results.realRateWarning}
          </div>
        )}

        {}
        {changedKeys && changedKeys.size > 0 && (
          <AssumptionChangeLog changedKeys={changedKeys} inputs={inputs} />
        )}

        {}
        {compareMode && scenarioA && scenarioAResults && (
          <ScenarioComparison
            inputsA={scenarioA} resultsA={scenarioAResults}
            inputsB={inputs} resultsB={results}
            onClear={onClearComparison ?? (() => {})}
          />
        )}

        {}
        <div id="r4-hero" className="hb-results-hero animate-fade-in" role="region" aria-label="Primary retirement result" style={{ borderRadius: '6px 6px 0 0', marginBottom: 0 }}>
          <p className="hb-results-hero-label">Estimated Retirement Corpus Required</p>
          <p className="hb-results-hero-value" aria-live="polite" aria-atomic="true">
            <AnimatedMoney value={results.retirementCorpus} />
          </p>
          <p style={{ fontSize: 12, color: 'var(--blue)', marginTop: 6, fontWeight: 500 }}>
            To sustain {formatCurrency(results.retirementAnnualExpense)}/yr for {results.yearsInRetirement} years from age {inputs.retirementAge}
          </p>
          {inputs.existingSavings > 0 && (
            <p style={{ marginTop: 5, fontSize: 11, color: 'var(--blue)', fontWeight: 500, opacity: 0.8 }}>
              Existing savings contribute {formatCurrency(inputs.existingSavings * Math.pow(1 + inputs.preRetirementReturn, results.yearsToRetirement))} by retirement — deducted above.
            </p>
          )}
          <p style={{ marginTop: 7, fontSize: 10, color: 'var(--blue)', fontStyle: 'italic', opacity: 0.65 }}>
            Illustrative estimate only. Not a guarantee or recommendation.
          </p>
        </div>

        {}
        {sipCoveredBySavings ? (
          <div className="savings-covered-card animate-fade-in animate-fade-in-delay-1" role="note" aria-label="Savings fully cover retirement goal">
            <span className="savings-covered-icon" aria-hidden="true">✅</span>
            <div>
              <strong>Your existing savings cover your full retirement corpus goal!</strong>
              <p>
                Your savings are projected to grow to approximately {formatCurrency(inputs.existingSavings * Math.pow(1 + inputs.preRetirementReturn, results.yearsToRetirement))} by retirement —
                enough to fund the estimated corpus. No additional SIP required under these assumptions.
              </p>
              <p style={{ fontSize: 11, fontStyle: 'italic', marginTop: 8, color: 'var(--text-muted)' }}>
                Illustrative only. Consider consulting a financial advisor.
              </p>
            </div>
          </div>
        ) : (
          <div className="plain-language-card animate-fade-in animate-fade-in-delay-1" role="note">
            <span className="plain-language-icon" aria-hidden="true">💡</span>
            <div>
              <p>
                To retire at age {inputs.retirementAge}, save approximately{' '}
                <strong>{formatCurrency(results.requiredMonthlySIP)}/month</strong>
                {Number(sipAsPercentOfExpenses) > 0 && (
                  <> — that is <strong>{sipAsPercentOfExpenses}% of your current monthly expenses</strong></>
                )}.
                Your withdrawals will increase with blended inflation each year.
              </p>
              <p style={{ fontSize: 11, marginTop: 6, color: 'var(--text-muted)', fontWeight: 500 }}>
                Real return = {((inputs.postRetirementReturn - results.blendedInflation) * 100).toFixed(1)}% p.a.
                (post-retirement return {(inputs.postRetirementReturn * 100).toFixed(1)}% minus blended inflation {(results.blendedInflation * 100).toFixed(1)}%).
                A lower real rate means a larger corpus is needed.
              </p>
            </div>
          </div>
        )}

        {}
        <div className={`breakeven-card animate-fade-in animate-fade-in-delay-1 ${results.breakEvenAge ? 'breakeven-warning' : 'breakeven-ok'}`} role="region" aria-label="Corpus longevity estimate">
          <div className="breakeven-icon" aria-hidden="true">
            {results.breakEvenAge ? '⏳' : '✅'}
          </div>
          <div>
            <strong style={{ fontSize: 13 }}>
              {results.breakEvenAge ? `Corpus runs out at age ${results.breakEvenAge}` : 'Corpus lasts full retirement'}
            </strong>
            <p style={{ fontSize: 11, marginTop: 4, color: 'var(--text-muted)', fontWeight: 500 }}>
              {breakEvenMsg}
            </p>
          </div>
        </div>

        {}
        <div id="r4-sip" className="animate-fade-in animate-fade-in-delay-1" role="region" aria-label="Key retirement metrics">
          <div className="hb-results-body" style={{ marginBottom: 20, borderRadius: 6, border: '1px solid var(--grey-border)' }}>
            <div className="hb-result-row">
              <span className="hb-result-label">Monthly SIP Required</span>
              <span className="hb-result-value primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <AnimatedMoney value={results.requiredMonthlySIP} />
              </span>
            </div>
            {inputs.enableTopUp && (
              <div className="hb-result-row">
                <span className="hb-result-label">With {(inputs.topUpRate*100).toFixed(0)}% Annual Step-Up</span>
                <span className="hb-result-value" style={{ color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>
                  <AnimatedMoney value={results.requiredMonthlySIPWithTopUp} />
                </span>
              </div>
            )}
            <div className="hb-result-row">
              <span className="hb-result-label">Annual Expense at Retirement</span>
              <span className="hb-result-value" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <AnimatedMoney value={results.retirementAnnualExpense} />
              </span>
            </div>
            <div className="hb-result-row">
              <span className="hb-result-label">Total You&apos;ll Invest</span>
              <span className="hb-result-value" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <AnimatedMoney value={results.totalInvested} />
              </span>
            </div>
            {results.wealthGained > 0 ? (
              <div className="hb-result-row">
                <span className="hb-result-label">Estimated Wealth Created</span>
                <span className="hb-result-value" style={{ color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>
                  <AnimatedMoney value={results.wealthGained} />
                </span>
              </div>
            ) : (
              <div className="hb-result-row">
                <span className="hb-result-label">Corpus vs Invested</span>
                <span className="hb-result-value" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  Fully covered by savings
                </span>
              </div>
            )}
          </div>
        </div>

        {}
        <div className="expense-breakdown animate-fade-in animate-fade-in-delay-2" role="region" aria-label="Corpus composition chart">
          <h3>Corpus Composition (Illustrative)</h3>
          <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', paddingTop: 8 }}>
            {results.wealthGained > 0 ? (
              <DonutChart size={180} strokeWidth={32}
                centerLabel={formatCurrency(results.retirementCorpus)} centerSub="total corpus"
                slices={[
                  { value: results.totalInvested, color: 'var(--blue)', label: 'Total Invested' },
                  { value: results.wealthGained, color: 'var(--success)', label: 'Wealth Created' },
                ]} />
            ) : (
              <DonutChart size={180} strokeWidth={32}
                centerLabel={formatCurrency(results.retirementCorpus)} centerSub="total corpus"
                slices={[
                  { value: Math.max(1, results.retirementCorpus), color: 'var(--success)', label: 'Covered by savings' },
                ]} />
            )}
            <div style={{ flex: 1, minWidth: 180 }}>
              {results.wealthGained > 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.7 }}>
                  Of the estimated corpus <strong style={{ color: 'var(--blue)' }}>{formatCurrency(results.retirementCorpus)}</strong>,{' '}
                  <strong>{formatCurrency(results.totalInvested)}</strong> is your SIP investment.
                  The remaining <strong style={{ color: 'var(--success)' }}>{formatCurrency(results.wealthGained)}</strong> is compounding growth — illustrative at {(inputs.preRetirementReturn*100).toFixed(1)}% assumed return.
                </p>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.7 }}>
                  Your existing savings of <strong>{formatCurrency(inputs.existingSavings)}</strong> are projected to cover the full corpus of <strong style={{ color: 'var(--success)' }}>{formatCurrency(results.retirementCorpus)}</strong>. No additional SIP is required under these assumptions.
                </p>
              )}
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
                Illustrative only. Not a guarantee of future returns.
              </p>
            </div>
          </div>
        </div>

        {}
        <div id="r4-montecarlo" className="animate-fade-in animate-fade-in-delay-2">
          <MonteCarloChart mc={results.monteCarlo} retirementAge={inputs.retirementAge} lifeExpectancy={inputs.lifeExpectancy} postRetirementReturn={inputs.postRetirementReturn} />
        </div>

        {}
        <div id="r4-whatif" className="animate-fade-in animate-fade-in-delay-2">
          <WhatIfSliders baseInputs={inputs} baseResults={results} />
        </div>

        {}
        <div className="timeline-section animate-fade-in animate-fade-in-delay-2" role="region" aria-label="Life timeline">
          <SectionTitle>Your Life Timeline</SectionTitle>
          <div className="timeline-bar" role="img"
            aria-label={`Working ${results.yearsToRetirement} years, retired ${results.yearsInRetirement} years`}>
            <div className="timeline-segment working" style={{ flex: workingPct }} aria-hidden="true">
              Working ({results.yearsToRetirement}y)
            </div>
            <div className="timeline-segment retired" style={{ flex: 100 - workingPct }} aria-hidden="true">
              Retired ({results.yearsInRetirement}y)
            </div>
          </div>
          <div className="timeline-labels" aria-hidden="true">
            <span>Age {inputs.currentAge}</span>
            <span>Age {inputs.retirementAge} →</span>
            <span>Age {inputs.lifeExpectancy}</span>
          </div>
        </div>

        {}
        <div className="expense-breakdown animate-fade-in animate-fade-in-delay-3" role="region" aria-label="Projected expense breakdown">
          <h3>Projected Annual Expenses at Retirement — Inflation-Adjusted (Illustrative)</h3>
          {[
            { label: 'Basic Needs',  value: results.basicInflated,      color: 'var(--blue)',       icon: '🏠', inf: inputs.generalInflationRate },
            { label: 'Lifestyle',    value: results.lifestyleInflated,   color: 'var(--amber)',      icon: '✈️', inf: inputs.lifestyleInflationRate },
            { label: 'Healthcare',   value: results.healthcareInflated,  color: 'var(--amber-dark)', icon: '🏥', inf: inputs.medicalInflationRate },
          ].map(item => (
            <div key={item.label} className="expense-bar-row">
              <span className="expense-bar-label"><span aria-hidden="true">{item.icon} </span>{item.label}</span>
              <div className="expense-bar-track" aria-hidden="true">
                <div className="expense-bar-fill" style={{ width: `${(item.value / totalExpense) * 100}%`, background: item.color }} />
              </div>
              <span className="expense-bar-value">
                {formatCurrency(item.value)}/yr
                <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', fontWeight: 500 }}>
                  at {(item.inf * 100).toFixed(1)}% inflation
                </span>
              </span>
            </div>
          ))}
        </div>

        {}
        <div id="r4-sensitivity" className="sensitivity-section animate-fade-in animate-fade-in-delay-3" role="region" aria-label="Sensitivity analysis">
          <SectionTitle>Sensitivity Analysis — Illustrative Range</SectionTitle>
          <p className="sensitivity-note">
            How corpus changes when inflation and post-retirement return vary simultaneously.{' '}
            <strong>Illustrative only — not a prediction or recommendation.</strong>{' '}
            Actual returns are subject to market risk.
          </p>

          {}
          {results.sensitivityMatrix && results.sensitivityMatrix.length > 0 ? (
            <div className="sg2-wrap" role="region" aria-label="2D sensitivity matrix: inflation vs return">
              <div className="sg2-table-wrap" style={{ overflowX: 'auto' }}>
                <table className="sg2-table" aria-label="Corpus sensitivity to inflation and return changes">
                  <caption className="sr-only">
                    Rows show inflation offset (lower, base, higher); columns show post-retirement return offset (lower, base, higher). Values show required corpus. Illustrative only.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" className="sg2-corner">
                        <span className="sg2-row-axis">Inflation →</span>
                        <span className="sg2-col-axis">Return ↓</span>
                      </th>
                      {results.sensitivityMatrix[0].map((cell, ci) => (
                        <th key={ci} scope="col" className="sg2-col-head">
                          Return {cell.returnLabel}
                          <span className="sg2-ret-val">
                            {(cell.actualReturn * 100).toFixed(1)}%
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.sensitivityMatrix.map((row, ri) => (
                      <tr key={ri}>
                        <th scope="row" className="sg2-row-head">
                          Inflation {row[0].inflationLabel}
                          <span className="sg2-inf-val">
                            {(row[0].actualInflation * 100).toFixed(1)}%
                          </span>
                        </th>
                        {row.map((cell, ci) => {
                          const isBase = cell.isBase;
                          
                          const vsBase = cell.corpus - results.sensitivityMid;
                          const cls = isBase ? 'sg2-cell base'
                            : cell.corpus < results.sensitivityMid ? 'sg2-cell lower'
                            : 'sg2-cell higher';
                          return (
                            <td key={ci} className={cls}
                              aria-label={`${cell.inflationLabel} inflation, ${cell.returnLabel} return: corpus ${formatCurrency(cell.corpus)}`}>
                              <span className="sg2-corpus">{formatCurrency(cell.corpus)}</span>
                              {!isBase && (
                                <span className="sg2-delta">
                                  {vsBase > 0 ? '+' : ''}{formatCurrency(vsBase)}
                                </span>
                              )}
                              <span className="sg2-sip">SIP {formatCurrency(cell.sip)}/mo</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="sensitivity-note" style={{ marginTop: 12 }}>
                Each cell shows the required corpus and monthly SIP for that combination of inflation and post-retirement return. Base case highlighted. Illustrative only.
              </p>
            </div>
          ) : (
            <div className="sensitivity-row" role="list">
              {[
                { scenario: 'Conservative', cls: 'low',  value: results.sensitivityLow,  ret: `${((inputs.postRetirementReturn-0.02)*100).toFixed(1)}%`, sip: results.sipSensitivityLow },
                { scenario: 'Base Case',    cls: 'mid',  value: results.sensitivityMid,  ret: `${(inputs.postRetirementReturn*100).toFixed(1)}%`,        sip: results.requiredMonthlySIP },
                { scenario: 'Optimistic',   cls: 'high', value: results.sensitivityHigh, ret: `${((inputs.postRetirementReturn+0.01)*100).toFixed(1)}%`, sip: results.sipSensitivityHigh },
              ].map(s => (
                <div key={s.scenario} className={`sensitivity-box ${s.cls}`} role="listitem"
                  aria-label={`${s.scenario}: corpus ${formatCurrency(s.value)}, SIP ${formatCurrency(s.sip)}`}>
                  <p className="sensitivity-box-label">{s.scenario}</p>
                  <p className="sensitivity-box-value">{formatCurrency(s.value)}</p>
                  <p className="sensitivity-box-return">{s.ret} post-ret. return</p>
                  <p className="sensitivity-box-sip">SIP: <strong>{formatCurrency(s.sip)}/mo</strong></p>
                </div>
              ))}
            </div>
          )}
        </div>

        {}
        {results.corpusDepletionTable.length > 0 && (
          <div className="expense-breakdown animate-fade-in animate-fade-in-delay-3" role="region" aria-label="Corpus depletion table">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8, paddingBottom: 12, borderBottom: '1px solid var(--grey-border)', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0 }}>Year-by-Year Corpus Depletion — Inflation-Adjusted Withdrawals (Illustrative)</h3>
              <button type="button" onClick={() => setShowDepletionTable(v => !v)}
                style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', background: 'var(--blue-muted)', border: 'none', padding: '4px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', flexShrink: 0 }}
                aria-expanded={showDepletionTable} aria-controls="depletion-table">
                {showDepletionTable ? 'Hide ▲' : 'Show ▼'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 500 }}>
              Withdrawals increase each year with blended inflation ({(results.blendedInflation*100).toFixed(1)}% p.a.). Not a guarantee.
            </p>
            {showDepletionTable && (
              <div id="depletion-table" style={{ overflowX: 'auto' }}>
                <table className="depletion-table" aria-label="Corpus depletion table">
                  <thead>
                    <tr>
                      <th scope="col">Age</th>
                      <th scope="col">Opening Corpus</th>
                      <th scope="col">Returns</th>
                      <th scope="col">Withdrawal</th>
                      <th scope="col">Closing Corpus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.corpusDepletionTable
                      .filter((_, i, arr) => i === 0 || i % 5 === 0 || i === arr.length - 1)
                      .map(row => (
                      <tr key={row.age} className={row.closingCorpus < row.annualWithdrawal * 2 ? 'depletion-row-low' : undefined}>
                        <td style={{ fontWeight: 700 }}>{row.age}</td>
                        <td>{formatCurrency(row.openingCorpus)}</td>
                        <td style={{ color: 'var(--success)' }}>{formatCurrency(row.returns)}</td>
                        <td style={{ color: 'var(--amber-dark)' }}>{formatCurrency(row.annualWithdrawal)}</td>
                        <td style={{ fontWeight: 700 }}>{formatCurrency(Math.max(0, row.closingCorpus))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>Every 5 years shown. Withdrawals grow with blended inflation each year. Illustrative only.</p>
              </div>
            )}
          </div>
        )}

        {}
        <div className="disclosure-box animate-fade-in animate-fade-in-delay-4" role="region" aria-label="What this estimate does not include">
          <button
            type="button"
            className="disclosure-toggle-btn"
            aria-expanded={showDisclosure}
            aria-controls="disclosure-content"
            onClick={() => setShowDisclosure(v => !v)}
          >
            <strong>What this estimate doesn&apos;t include</strong>
            <span className="disclosure-toggle-hint" aria-hidden="true">
              {showDisclosure ? '▲ Hide' : '▼ Show'}
            </span>
          </button>
          {showDisclosure && (
            <div id="disclosure-content" className="disclosure-content">
              <ul className="disclosure-list">
                <li>Taxes on investment gains or withdrawals</li>
                <li>Insurance premiums or term plan costs</li>
                <li>Outstanding loans or liabilities</li>
                <li>Emergency fund requirements</li>
                <li>Children&apos;s education or marriage costs</li>
                <li>Legacy / estate planning goals</li>
                <li>Social security or pension income</li>
                <li>Unexpected major expenses (medical emergencies, etc.)</li>
              </ul>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
                Consider consulting a qualified financial advisor for a comprehensive plan.
              </p>
            </div>
          )}
        </div>

        {}
        <div id="r4-assumptions" className="assumptions-panel animate-fade-in animate-fade-in-delay-4 print-assumptions"
          role="region" aria-label="All assumptions used in this calculation">
          <h3 aria-hidden="true">⚙️ All Assumptions — Editable, Illustrative Only</h3>
          <div className="assumptions-grid">
            {[
              ['Current Age',            `${inputs.currentAge} years`],
              ['Retirement Age',         `${inputs.retirementAge} years`],
              ['Life Expectancy',        `${inputs.lifeExpectancy} years`],
              ['Monthly Expenses',       `${formatCurrency(inputs.currentMonthlyExpenses)}/mo`],
              ['General Inflation',      `${(inputs.generalInflationRate*100).toFixed(1)}% p.a.`],
              ['Medical Inflation',      `${(inputs.medicalInflationRate*100).toFixed(1)}% p.a.`],
              ['Lifestyle Inflation',    `${(inputs.lifestyleInflationRate*100).toFixed(1)}% p.a.`],
              ['Pre-retirement Return',  `${(inputs.preRetirementReturn*100).toFixed(1)}% p.a.`],
              ['Post-retirement Return', `${(inputs.postRetirementReturn*100).toFixed(1)}% p.a.`],
              ...(inputs.enableTopUp ? [['SIP Step-Up', `${(inputs.topUpRate*100).toFixed(0)}% p.a.`]] : []),
              ...(inputs.existingSavings > 0 ? [['Existing Savings', formatCurrency(inputs.existingSavings)]] : []),
            ].map(([k, v]) => (
              <div key={k} className="assumption-item">
                <span className="assumption-label">{k}</span>
                <span className="assumption-value">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {}
        {!compareMode && (
          <div className="scenario-save-prompt animate-fade-in animate-fade-in-delay-4">
            <span aria-hidden="true">🔀</span>
            <div>
              <strong>Compare scenarios</strong>
              <p>Save this as Scenario A, then go back and change inputs to compare side-by-side.</p>
            </div>
            <button type="button" className="hb-btn-secondary" onClick={onSaveScenarioA}
              style={{ fontSize: 12, padding: '8px 16px', whiteSpace: 'nowrap' }}>
              Save as A
            </button>
          </div>
        )}

        {}
        <div className="hb-btn-group animate-fade-in animate-fade-in-delay-4 no-print">
          <button type="button" className="hb-btn-ghost" onClick={onBack}>← Edit Assumptions</button>
          <button type="button" className="hb-btn-ghost" onClick={handleCopy} aria-live="polite">
            {copied ? '✓ Copied!' : '🔗 Share Link'}
          </button>
          <button type="button" className="hb-btn-secondary" onClick={() => window.print()}>🖨 Print / PDF</button>
          <button type="button" className="hb-btn-primary" onClick={onReset}>↺ Start Over</button>
        </div>
      </div>
    </section>
  );
}
