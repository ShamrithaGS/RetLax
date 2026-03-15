'use client';

import { useEffect, useRef, useState } from 'react';
import { RetirementInputs, DEFAULT_INPUTS } from '@/lib/retirement';
import { InfoTooltip, sliderBg } from '@/components/ui/FormComponents';

interface Step1Props {
  inputs: RetirementInputs;
  updateInput: <K extends keyof RetirementInputs>(key: K, value: RetirementInputs[K]) => void;
  onNext: () => void;
}

export function Step1Age({ inputs, updateInput, onNext }: Step1Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    headingRef.current?.focus();
  }, []);

  const yearsToRetirement = inputs.retirementAge - inputs.currentAge;
  const yearsInRetirement = inputs.lifeExpectancy - inputs.retirementAge;

  const retirementAgeError = inputs.retirementAge <= inputs.currentAge
    ? 'Retirement age must be greater than current age.' : undefined;
  const lifeExpectancyError = inputs.lifeExpectancy <= inputs.retirementAge
    ? 'Life expectancy must be greater than retirement age.' : undefined;
  const canProceed = !retirementAgeError && !lifeExpectancyError && yearsToRetirement >= 1;

  const displayInputs = mounted ? inputs : DEFAULT_INPUTS;

  return (
    <section aria-labelledby="step1-heading">
      <div className="hb-card animate-fade-in">
        <div className="hb-card-header">
          <h2 id="step1-heading" ref={headingRef} tabIndex={-1}>Tell Us About Yourself</h2>
          <p>Your age and retirement timeline are the foundation of your plan.</p>
        </div>
        <div className="hb-card-body">

          <p className="hb-section-title">Age &amp; Retirement Timeline</p>

          {}
          <div className="hb-slider-group">
            <div className="hb-slider-header">
              <label htmlFor="current-age" className="hb-slider-label">
                Current Age
                <InfoTooltip content="Your age today. This determines how many years you have to build your retirement corpus." />
              </label>
              <div className="hb-slider-value-box">
                <span suppressHydrationWarning>{displayInputs.currentAge} yrs</span>
              </div>
            </div>
            <input id="current-age" type="range" className="hb-range hb-range-filled"
              min={18} max={65} step={1}
              value={displayInputs.currentAge}
              style={{ background: sliderBg(displayInputs.currentAge, 18, 65) }}
              onChange={e => updateInput('currentAge', Number(e.target.value))}
              aria-valuemin={18} aria-valuemax={65}
              aria-valuenow={displayInputs.currentAge}
              aria-valuetext={`${displayInputs.currentAge} years`} />
            <div className="hb-slider-minmax"><span>18 yrs</span><span>65 yrs</span></div>
          </div>

          {}
          <div className="hb-slider-group">
            <div className="hb-slider-header">
              <label htmlFor="retirement-age" className="hb-slider-label">
                Planned Retirement Age
                <InfoTooltip content="The age at which you plan to stop working and start drawing from your retirement corpus." />
              </label>
              <div className="hb-slider-value-box">
                <span suppressHydrationWarning>{displayInputs.retirementAge} yrs</span>
              </div>
            </div>
            <input id="retirement-age" type="range" className="hb-range hb-range-filled"
              min={40} max={75} step={1}
              value={displayInputs.retirementAge}
              style={{ background: sliderBg(displayInputs.retirementAge, 40, 75) }}
              onChange={e => updateInput('retirementAge', Number(e.target.value))}
              aria-valuemin={40} aria-valuemax={75}
              aria-valuenow={displayInputs.retirementAge}
              aria-valuetext={`${displayInputs.retirementAge} years`} />
            <div className="hb-slider-minmax"><span>40 yrs</span><span>75 yrs</span></div>
            {retirementAgeError && (
              <p className="hb-form-error" role="alert"><span aria-hidden="true">⚠</span> {retirementAgeError}</p>
            )}
          </div>

          {}
          <div className="hb-slider-group">
            <div className="hb-slider-header">
              <label htmlFor="life-expectancy" className="hb-slider-label">
                Expected Life Span
                <InfoTooltip content="Plan for longer to be safe. We recommend planning up to age 90 or beyond." />
              </label>
              <div className="hb-slider-value-box">
                <span suppressHydrationWarning>{displayInputs.lifeExpectancy} yrs</span>
              </div>
            </div>
            <input id="life-expectancy" type="range" className="hb-range hb-range-filled"
              min={60} max={100} step={1}
              value={displayInputs.lifeExpectancy}
              style={{ background: sliderBg(displayInputs.lifeExpectancy, 60, 100) }}
              onChange={e => updateInput('lifeExpectancy', Number(e.target.value))}
              aria-valuemin={60} aria-valuemax={100}
              aria-valuenow={displayInputs.lifeExpectancy}
              aria-valuetext={`${displayInputs.lifeExpectancy} years`} />
            <div className="hb-slider-minmax"><span>60 yrs</span><span>100 yrs</span></div>
            {lifeExpectancyError && (
              <p className="hb-form-error" role="alert"><span aria-hidden="true">⚠</span> {lifeExpectancyError}</p>
            )}
          </div>

          {}
          {canProceed && (
            <div className="hb-summary-panel" role="region" aria-label="Timeline summary">
              <div className="hb-summary-grid">
                {[
                  ['You retire in',         `${2026 + (displayInputs.retirementAge - displayInputs.currentAge)}`],
                  ['Years to build wealth', `${displayInputs.retirementAge - displayInputs.currentAge} years`],
                  ['Retirement duration',   `${displayInputs.lifeExpectancy - displayInputs.retirementAge} years`],
                  ['Plan covers until',     `Age ${displayInputs.lifeExpectancy}`],
                ].map(([k, v]) => (
                  <div key={k} className="hb-summary-item">
                    <span className="hb-summary-label">{k}</span>
                    <span className="hb-summary-value" suppressHydrationWarning>{v}</span>
                  </div>
                ))}
              </div>
              <div className="hb-timeline-bar"
                role="img"
                aria-label={`${displayInputs.retirementAge - displayInputs.currentAge} working years, ${displayInputs.lifeExpectancy - displayInputs.retirementAge} retirement years`}>
                <div className="hb-timeline-working"
                  style={{ flex: displayInputs.retirementAge - displayInputs.currentAge }}
                  aria-hidden="true">Working</div>
                <div className="hb-timeline-retired"
                  style={{ flex: displayInputs.lifeExpectancy - displayInputs.retirementAge }}
                  aria-hidden="true">Retired</div>
              </div>
            </div>
          )}

          <div className="hb-btn-group">
            <button type="button" className="hb-btn-primary" onClick={onNext}
              disabled={!canProceed} aria-disabled={!canProceed}>
              Continue →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
