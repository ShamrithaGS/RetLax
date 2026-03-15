'use client';

import { useState, useMemo } from 'react';
import { RetirementInputs, RetirementResults, calculateRetirement, formatCurrency } from '@/lib/retirement';
import { useDebounce } from '@/hooks/useDebounce';
import { sliderBg } from '@/components/ui/FormComponents';

interface Props {
  baseInputs: RetirementInputs;
  baseResults: RetirementResults;
}

export function WhatIfSliders({ baseInputs, baseResults }: Props) {
  const [open, setOpen] = useState(false);
  const [extraSIP, setExtraSIP] = useState(0);
  const [retireYearsLater, setRetireYearsLater] = useState(0);
  const [returnBoost, setReturnBoost] = useState(0);

  const dExtraSIP    = useDebounce(extraSIP, 150);
  const dRetireLater = useDebounce(retireYearsLater, 150);
  const dReturnBoost = useDebounce(returnBoost, 150);

  const hasChanges = extraSIP > 0 || retireYearsLater > 0 || returnBoost > 0;

  const whatIfResults = useMemo(() => {
    if (!open) return null;
    const modified: RetirementInputs = {
      ...baseInputs,
      retirementAge: baseInputs.retirementAge + dRetireLater,
      preRetirementReturn: Math.min(0.20, baseInputs.preRetirementReturn + dReturnBoost / 100),
    };
    if (modified.retirementAge >= modified.lifeExpectancy) return null;
    try {
      const r = calculateRetirement(modified);
      const extraCorpus = dExtraSIP > 0
        ? (() => {
            const rMo = modified.preRetirementReturn / 12;
            const n = (modified.retirementAge - modified.currentAge) * 12;
            return dExtraSIP * ((Math.pow(1 + rMo, n) - 1) / rMo) * (1 + rMo);
          })()
        : 0;
      return { results: r, extraCorpus };
    } catch { return null; }
  }, [open, baseInputs, dExtraSIP, dRetireLater, dReturnBoost]);

  const sipReduction = whatIfResults
    ? Math.max(0, baseResults.requiredMonthlySIP - whatIfResults.results.requiredMonthlySIP)
    : 0;
  const corpusDelta = whatIfResults
    ? whatIfResults.results.retirementCorpus - baseResults.retirementCorpus
    : 0;
  const mcDelta = whatIfResults
    ? whatIfResults.results.monteCarlo.successRate - baseResults.monteCarlo.successRate
    : 0;

  function resetAll() {
    setExtraSIP(0);
    setRetireYearsLater(0);
    setReturnBoost(0);
  }

  return (
    <div className="whatif-section" role="region" aria-label="What-if scenario explorer">

      {}
      <button
        type="button"
        className="whatif-toggle-btn"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-controls="whatif-body"
      >
        <span className="whatif-toggle-icon" aria-hidden="true">
          {open ? '▾' : '▸'}
        </span>
        <span className="whatif-toggle-label">
          What-If Explorer
          {hasChanges && !open && (
            <span className="whatif-active-dot" aria-label="changes active" />
          )}
        </span>
        <span className="whatif-toggle-sub">
          {open ? 'Adjust sliders to see instant impact' : 'Explore how small changes affect your plan'}
        </span>
        <span className="whatif-toggle-badge" aria-hidden="true">Illustrative</span>
      </button>

      {}
      {open && (
        <div id="whatif-body" className="whatif-body">

          <div className="whatif-controls">
            {}
            <div className="whatif-control">
              <div className="whatif-control-top">
                <label htmlFor="extra-sip" className="whatif-label">Extra monthly SIP</label>
                <span className="whatif-value">
                  {extraSIP === 0 ? '₹0' : `+${formatCurrency(extraSIP)}`}
                </span>
              </div>
              <input
                id="extra-sip" type="range" className="hb-range hb-range-filled"
                min={0} max={50000} step={1000}
                value={extraSIP}
                style={{ background: sliderBg(extraSIP, 0, 50000) }}
                onChange={e => setExtraSIP(Number(e.target.value))}
                aria-valuetext={`${formatCurrency(extraSIP)} extra per month`}
              />
              <div className="whatif-marks"><span>₹0</span><span>₹50,000</span></div>
            </div>

            {}
            <div className="whatif-control">
              <div className="whatif-control-top">
                <label htmlFor="retire-later" className="whatif-label">Retire later by</label>
                <span className="whatif-value">
                  {retireYearsLater === 0 ? 'on time' : `${retireYearsLater} yr${retireYearsLater > 1 ? 's' : ''}`}
                </span>
              </div>
              <input
                id="retire-later" type="range" className="hb-range hb-range-filled"
                min={0} max={10} step={1}
                value={retireYearsLater}
                style={{ background: sliderBg(retireYearsLater, 0, 10) }}
                onChange={e => setRetireYearsLater(Number(e.target.value))}
                aria-valuetext={`Retire ${retireYearsLater} years later`}
              />
              <div className="whatif-marks"><span>On time</span><span>+10 yrs</span></div>
            </div>

            {}
            <div className="whatif-control">
              <div className="whatif-control-top">
                <label htmlFor="return-boost" className="whatif-label">Higher returns by</label>
                <span className="whatif-value">
                  {returnBoost === 0 ? 'none' : `+${returnBoost}%`}
                </span>
              </div>
              <input
                id="return-boost" type="range" className="hb-range hb-range-filled"
                min={0} max={4} step={0.5}
                value={returnBoost}
                style={{ background: sliderBg(returnBoost, 0, 4) }}
                onChange={e => setReturnBoost(Number(e.target.value))}
                aria-valuetext={`Returns ${returnBoost}% higher than assumed`}
              />
              <div className="whatif-marks"><span>As assumed</span><span>+4%</span></div>
            </div>
          </div>

          {}
          {whatIfResults && hasChanges ? (
            <div className="whatif-impact" role="status" aria-live="polite" aria-atomic="true">
              <div className="whatif-impact-header">Impact on your plan</div>

              <div className="whatif-impact-row">
                <span>New monthly SIP</span>
                <strong className="wi-accent-blue">
                  {formatCurrency(Math.max(0, whatIfResults.results.requiredMonthlySIP - dExtraSIP))}/mo
                </strong>
              </div>

              {sipReduction > 0 && (
                <div className="whatif-impact-row">
                  <span>SIP reduction</span>
                  <strong className="wi-accent-green">−{formatCurrency(sipReduction)}/mo</strong>
                </div>
              )}

              {corpusDelta !== 0 && (
                <div className="whatif-impact-row">
                  <span>Corpus change</span>
                  <strong className={corpusDelta < 0 ? 'wi-accent-green' : 'wi-accent-amber'}>
                    {corpusDelta < 0 ? '−' : '+'}{formatCurrency(Math.abs(corpusDelta))}
                  </strong>
                </div>
              )}

              {Math.abs(mcDelta) >= 1 && (
                <div className="whatif-impact-row">
                  <span>Resilience score</span>
                  <strong className={mcDelta >= 0 ? 'wi-accent-green' : 'wi-accent-amber'}>
                    {whatIfResults.results.monteCarlo.successRate.toFixed(0)}%
                    <span style={{ fontWeight: 400, fontSize: 11, marginLeft: 4 }}>
                      ({mcDelta >= 0 ? '+' : ''}{mcDelta.toFixed(0)} pts)
                    </span>
                  </strong>
                </div>
              )}

              <p className="whatif-disclaimer">Illustrative only. Not a guarantee or recommendation.</p>
            </div>
          ) : (
            <div className="whatif-prompt">
              Move a slider above to see the impact on your plan.
            </div>
          )}

          {}
          {hasChanges && (
            <button type="button" className="whatif-reset-btn" onClick={resetAll}>
              ↺ Reset to base plan
            </button>
          )}
        </div>
      )}
    </div>
  );
}
