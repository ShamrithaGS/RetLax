'use client';

import { useEffect, useRef, useMemo } from 'react';
import { RetirementInputs, calculateCorpus, inflateExpenses } from '@/lib/retirement';
import { InfoTooltip, sliderBg } from '@/components/ui/FormComponents';

interface Props {
  inputs: RetirementInputs;
  updateInput: <K extends keyof RetirementInputs>(key: K, value: RetirementInputs[K]) => void;
  onNext: () => void;
  onBack: () => void;
}

const PRESETS = {
  modest:      { label: 'Modest',      desc: 'Simple, needs-based', gi: 0.05, mi: 0.07, li: 0.04, po: 0.07 },
  comfortable: { label: 'Comfortable', desc: 'Travel, hobbies',     gi: 0.06, mi: 0.08, li: 0.05, po: 0.08 },
  affluent:    { label: 'Affluent',    desc: 'Premium & legacy',    gi: 0.07, mi: 0.09, li: 0.07, po: 0.09 },
};

export function Step3Assumptions({ inputs, updateInput, onNext, onBack }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);

  const blendedInflation =
    inputs.generalInflationRate   * inputs.basicExpenseFraction +
    inputs.lifestyleInflationRate * inputs.lifestyleExpenseFraction +
    inputs.medicalInflationRate   * inputs.healthcareExpenseFraction;

  const postReturnWarning = inputs.postRetirementReturn <= blendedInflation;
  const preReturnWarning  = inputs.preRetirementReturn  <= inputs.generalInflationRate;

  const selectedPreset = Object.entries(PRESETS).find(([, p]) =>
    p.gi === inputs.generalInflationRate && p.mi === inputs.medicalInflationRate && p.li === inputs.lifestyleInflationRate
  )?.[0];

  const savingsAnalysis = useMemo(() => {
    if (inputs.existingSavings <= 0) return null;
    const yearsToRet = inputs.retirementAge - inputs.currentAge;
    if (yearsToRet <= 0) return null;
    try {
      const { totalRetirementExpense } = inflateExpenses(inputs);
      const yearsInRet = inputs.lifeExpectancy - inputs.retirementAge;
      const blendedInfl =
        inputs.generalInflationRate   * inputs.basicExpenseFraction +
        inputs.lifestyleInflationRate * inputs.lifestyleExpenseFraction +
        inputs.medicalInflationRate   * inputs.healthcareExpenseFraction;
      const rawCorpus = calculateCorpus(totalRetirementExpense, inputs.postRetirementReturn, yearsInRet, blendedInfl);
      const savingsFV = inputs.existingSavings * Math.pow(1 + inputs.preRetirementReturn, yearsToRet);
      const coversPct = rawCorpus > 0 ? Math.min(100, (savingsFV / rawCorpus) * 100) : 0;
      const fvDisplay = savingsFV >= 10000000 ? `₹${(savingsFV/10000000).toFixed(2)} Cr` : `₹${(savingsFV/100000).toFixed(1)} L`;
      return { savingsFV, coversPct, exceedsCorpus: savingsFV >= rawCorpus, fvDisplay };
    } catch { return null; }
  }, [inputs]);

  function applyPreset(key: string) {
    const p = PRESETS[key as keyof typeof PRESETS];
    updateInput('generalInflationRate', p.gi);
    updateInput('medicalInflationRate', p.mi);
    updateInput('lifestyleInflationRate', p.li);
    updateInput('postRetirementReturn', p.po);
  }

  function resetDefaults() {
    updateInput('generalInflationRate', 0.06); updateInput('medicalInflationRate', 0.08);
    updateInput('lifestyleInflationRate', 0.05); updateInput('preRetirementReturn', 0.12);
    updateInput('postRetirementReturn', 0.08); updateInput('enableTopUp', false);
    updateInput('topUpRate', 0.10); updateInput('existingSavings', 0);
  }

  const sliderRow = (id: string, label: string, tip: string, val: number, min: number, max: number, step: number,
    onChange: (v: number) => void) => (
    <div className="hb-slider-group">
      <div className="hb-slider-header">
        <label htmlFor={id} className="hb-slider-label">{label}<InfoTooltip content={tip} /></label>
        <div className="hb-slider-value-box"><span>{val.toFixed(1)}%</span></div>
      </div>
      <input id={id} type="range" className="hb-range hb-range-filled" min={min} max={max} step={step}
        value={val} onChange={e => onChange(Number(e.target.value))}
        style={{ background: sliderBg(val, min, max) }}
        aria-valuetext={`${val.toFixed(1)}%`} />
      <div className="hb-slider-minmax"><span>{min}%</span><span>{max}%</span></div>
    </div>
  );

  return (
    <section aria-labelledby="step3-heading">
      <div className="hb-card animate-fade-in">
        <div className="hb-card-header">
          <h2 id="step3-heading" ref={headingRef} tabIndex={-1}>Assumptions &amp; Lifestyle</h2>
          <p>All assumptions are illustrative and fully editable. Not predictions or guarantees.</p>
        </div>
        <div className="hb-card-body">

          {}
          <p className="hb-section-title">Retirement Lifestyle</p>
          <fieldset style={{ border: 'none', padding: 0, margin: '0 0 20px 0' }}>
            <legend className="sr-only">Select retirement lifestyle preset</legend>
            <div className="hb-preset-row">
              {Object.entries(PRESETS).map(([key, p]) => (
                <label key={key} className={`hb-preset-card${selectedPreset === key ? ' selected' : ''}`}>
                  <input type="radio" name="lifestyle" value={key} checked={selectedPreset === key} onChange={() => applyPreset(key)} className="sr-only" />
                  <span className="hb-preset-name">{p.label}</span>
                  <span className="hb-preset-desc">{p.desc}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {}
          <p className="hb-section-title">Inflation Assumptions</p>
          {sliderRow('gen-inf', 'General Inflation', "India's long-run CPI: 5–7%.", inputs.generalInflationRate * 100, 2, 12, 0.5, v => updateInput('generalInflationRate', v / 100))}
          {sliderRow('med-inf', 'Medical / Healthcare Inflation', 'Healthcare costs typically rise faster than general CPI in India.', inputs.medicalInflationRate * 100, 3, 15, 0.5, v => updateInput('medicalInflationRate', v / 100))}
          {sliderRow('life-inf', 'Lifestyle & Leisure Inflation', 'Travel, dining, entertainment.', inputs.lifestyleInflationRate * 100, 2, 12, 0.5, v => updateInput('lifestyleInflationRate', v / 100))}

          {}
          <p className="hb-section-title">Return Assumptions</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Illustrative only. Actual returns subject to market risk — not guaranteed.</p>
          {sliderRow('pre-ret', 'Pre-Retirement Return', 'Assumed return during working years.', inputs.preRetirementReturn * 100, 5, 18, 0.5, v => updateInput('preRetirementReturn', v / 100))}
          {preReturnWarning && <div className="hb-warning">⚠️ Pre-retirement return ≤ general inflation. Investments may not grow in real terms.</div>}
          {sliderRow('post-ret', 'Post-Retirement Return', 'Return after retirement. Typically lower as portfolio shifts to safer instruments.', inputs.postRetirementReturn * 100, 3, 12, 0.5, v => updateInput('postRetirementReturn', v / 100))}
          {postReturnWarning && <div className="hb-warning">⚠️ Post-retirement return ≤ blended inflation (~{(blendedInflation*100).toFixed(1)}%). Corpus may lose purchasing power.</div>}

          {}
          <p className="hb-section-title">Existing Savings</p>
          <div className="hb-input-row">
            <label htmlFor="existing-savings" className="hb-input-label">
              Current Savings (EPF, PPF, MF etc.)
              <InfoTooltip content="Savings already accumulated toward retirement. Compounded and deducted from required corpus." />
            </label>
            <div className="hb-number-input-wrap">
              <span className="hb-prefix">₹</span>
              <input id="existing-savings" type="number" className="hb-number-input"
                value={inputs.existingSavings} min={0} step={10000}
                onChange={e => updateInput('existingSavings', Math.max(0, Number(e.target.value)))} />
            </div>
          </div>
          {savingsAnalysis && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -8, marginBottom: 16 }}>
              Projected at retirement: {savingsAnalysis.fvDisplay} — covers {savingsAnalysis.coversPct.toFixed(0)}% of estimated corpus
            </p>
          )}
          {savingsAnalysis?.exceedsCorpus && (
            <div className="savings-covered-card" role="alert">
              <span className="savings-covered-icon" aria-hidden="true">✅</span>
              <div>Your existing savings are projected to fully cover the corpus. No additional SIP may be required. Verify on the results page.</div>
            </div>
          )}

          {}
          <p className="hb-section-title">Top-Up SIP (Optional)</p>
          <div style={{ marginBottom: 16 }}>
            <label className="hb-toggle-label" htmlFor="enable-topup">
              <input id="enable-topup" type="checkbox" checked={inputs.enableTopUp}
                onChange={e => updateInput('enableTopUp', e.target.checked)}
                style={{ marginRight: 10, width: 16, height: 16, accentColor: 'var(--blue)', cursor: 'pointer' }} />
              <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)' }}>Enable Annual SIP Step-Up</span>
            </label>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 26, marginTop: 4 }}>Increase SIP by a fixed % each year as income grows.</p>
          </div>
          {inputs.enableTopUp && sliderRow('topup-rate', 'Annual Step-Up Rate', 'E.g. 10%: ₹10,000/mo this year → ₹11,000/mo next year.', inputs.topUpRate * 100, 1, 25, 1, v => updateInput('topUpRate', v / 100))}

          {}
          <div className="hb-summary-panel">
            <div className="hb-summary-grid">
              {[
                ['General inflation', `${(inputs.generalInflationRate*100).toFixed(1)}% p.a.`],
                ['Medical inflation', `${(inputs.medicalInflationRate*100).toFixed(1)}% p.a.`],
                ['Pre-retirement return', `${(inputs.preRetirementReturn*100).toFixed(1)}% p.a.`],
                ['Post-retirement return', `${(inputs.postRetirementReturn*100).toFixed(1)}% p.a.`],
              ].map(([k, v]) => (
                <div key={k} className="hb-summary-item">
                  <span className="hb-summary-label">{k}</span>
                  <span className="hb-summary-value">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hb-btn-group">
            <button type="button" className="hb-btn-ghost" onClick={resetDefaults}>↺ Reset</button>
            <button type="button" className="hb-btn-ghost" onClick={onBack}>← Back</button>
            <button type="button" className="hb-btn-primary" onClick={onNext}>Calculate My Plan →</button>
          </div>
        </div>
      </div>
    </section>
  );
}
