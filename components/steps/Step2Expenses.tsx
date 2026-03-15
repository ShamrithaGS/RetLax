'use client';

import { useEffect, useRef, useState } from 'react';
import { RetirementInputs, DEFAULT_INPUTS, formatCurrency } from '@/lib/retirement';
import { InfoTooltip, sliderBg } from '@/components/ui/FormComponents';

interface Props {
  inputs: RetirementInputs;
  updateInput: <K extends keyof RetirementInputs>(key: K, value: RetirementInputs[K]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2Expenses({ inputs, updateInput, onNext, onBack }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); headingRef.current?.focus(); }, []);
  const displayInputs = mounted ? inputs : DEFAULT_INPUTS;


  const annualEquiv = inputs.currentMonthlyExpenses * 12;
  const basic = annualEquiv * inputs.basicExpenseFraction;
  const lifestyle = annualEquiv * inputs.lifestyleExpenseFraction;
  const healthcare = annualEquiv * inputs.healthcareExpenseFraction;
  const expenseError = inputs.currentMonthlyExpenses <= 0 ? 'Please enter a valid monthly expense amount.' : undefined;

  return (
    <section aria-labelledby="step2-heading">
      <div className="hb-card animate-fade-in">
        <div className="hb-card-header">
          <h2 id="step2-heading" ref={headingRef} tabIndex={-1}>What Do You Spend Each Month?</h2>
          <p>Your current spending is the baseline. We project how it grows by retirement.</p>
        </div>
        <div className="hb-card-body">

          <p className="hb-section-title">Monthly Household Expenses</p>

          <div className="hb-input-row">
            <label htmlFor="monthly-expenses" className="hb-input-label">
              Total Monthly Expenses
              <InfoTooltip content="Include rent/EMI, groceries, transport, utilities, subscriptions, dining, entertainment — everything." />
            </label>
            <div className="hb-number-input-wrap">
              <span className="hb-prefix">₹</span>
              <input id="monthly-expenses" type="number" className="hb-number-input"
                value={inputs.currentMonthlyExpenses} min={0} step={1000}
                onChange={e => updateInput('currentMonthlyExpenses', Number(e.target.value))}
                aria-invalid={!!expenseError} />
            </div>
          </div>
          {expenseError && <p className="hb-form-error" role="alert"><span aria-hidden="true">⚠</span> {expenseError}</p>}
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -8, marginBottom: 16 }}>Annual equivalent: {formatCurrency(annualEquiv)}/year</p>

          <p className="hb-section-title">Expense Breakdown by Category</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 500 }}>
            Different expenses inflate at different rates. Adjust the splits to reflect your lifestyle.
          </p>

          {}
          <div className="hb-slider-group">
            <div className="hb-slider-header">
              <label htmlFor="basic-fraction" className="hb-slider-label">
                Basic Needs
                <InfoTooltip content="Essentials: groceries, rent/EMI, utilities, transport. Grows with general CPI." />
              </label>
              <div className="hb-slider-value-box">
                <span>{Math.round(inputs.basicExpenseFraction * 100)}% — {formatCurrency(basic)}/yr</span>
              </div>
            </div>
            <input id="basic-fraction" type="range" className="hb-range hb-range-filled"
              min={10} max={80} step={5} value={Math.round(displayInputs.basicExpenseFraction * 100)}
              style={{ background: sliderBg(Math.round(displayInputs.basicExpenseFraction * 100), 10, 80) }}
              onChange={e => {
                const newBasic = Number(e.target.value) / 100;
                const clamped = Math.min(newBasic, 1 - 0.05 - 0.05);
                const remaining = 1 - clamped;
                const lRatio = inputs.lifestyleExpenseFraction / (inputs.lifestyleExpenseFraction + inputs.healthcareExpenseFraction) || 0.6;
                const newLife = Math.max(0.05, Math.round(remaining * lRatio * 100) / 100);
                const newHealth = Math.max(0.05, Math.round((remaining - newLife) * 100) / 100);
                updateInput('basicExpenseFraction', clamped);
                updateInput('lifestyleExpenseFraction', newLife);
                updateInput('healthcareExpenseFraction', newHealth);
              }}
              aria-valuetext={`${Math.round(displayInputs.basicExpenseFraction * 100)}%`} />
            <div className="hb-slider-minmax"><span>10%</span><span>80%</span></div>
          </div>

          {}
          <div className="hb-slider-group">
            <div className="hb-slider-header">
              <label htmlFor="lifestyle-fraction" className="hb-slider-label">
                Lifestyle &amp; Leisure
                <InfoTooltip content="Dining out, travel, entertainment, shopping, hobbies." />
              </label>
              <div className="hb-slider-value-box">
                <span>{Math.round(inputs.lifestyleExpenseFraction * 100)}% — {formatCurrency(lifestyle)}/yr</span>
              </div>
            </div>
            <input id="lifestyle-fraction" type="range" className="hb-range hb-range-filled"
              min={5} max={60} step={5} value={Math.round(displayInputs.lifestyleExpenseFraction * 100)}
              style={{ background: sliderBg(Math.round(displayInputs.lifestyleExpenseFraction * 100), 5, 60) }}
              onChange={e => {
                const newLife = Number(e.target.value) / 100;
                const maxLife = 1 - inputs.basicExpenseFraction - 0.05;
                const clamped = Math.min(newLife, maxLife);
                const newHealth = Math.max(0.05, Math.round((1 - inputs.basicExpenseFraction - clamped) * 100) / 100);
                updateInput('lifestyleExpenseFraction', clamped);
                updateInput('healthcareExpenseFraction', newHealth);
              }}
              aria-valuetext={`${Math.round(displayInputs.lifestyleExpenseFraction * 100)}%`} />
            <div className="hb-slider-minmax"><span>5%</span><span>60%</span></div>
          </div>

          {}
          <div className="hb-input-row" style={{ marginBottom: 0 }}>
            <div className="hb-input-label">
              Healthcare <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>(auto-adjusted)</span>
            </div>
            <div className="hb-slider-value-box" style={{ cursor: 'default' }}
              aria-label={`Healthcare: ${Math.round(inputs.healthcareExpenseFraction * 100)}%, auto-adjusted`}>
              <span>{Math.round(inputs.healthcareExpenseFraction * 100)}% — {formatCurrency(healthcare)}/yr</span>
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, marginBottom: 20 }}>Uses medical inflation rate (Step 3)</p>

          {}
          <div className="hb-summary-panel" role="region" aria-label="Expense breakdown">
            <div className="hb-summary-grid">
              {[
                ['Basic Needs', `${formatCurrency(basic)}/yr`],
                ['Lifestyle', `${formatCurrency(lifestyle)}/yr`],
                ['Healthcare', `${formatCurrency(healthcare)}/yr`],
                ['Total Annual', `${formatCurrency(annualEquiv)}/yr`],
              ].map(([k, v]) => (
                <div key={k} className="hb-summary-item">
                  <span className="hb-summary-label">{k}</span>
                  <span className="hb-summary-value">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hb-btn-group">
            <button type="button" className="hb-btn-ghost" onClick={onBack}>← Back</button>
            <button type="button" className="hb-btn-primary" onClick={onNext} disabled={!!expenseError}>Continue →</button>
          </div>
        </div>
      </div>
    </section>
  );
}
