'use client';

import { useRetirementCalc } from '@/hooks/useRetirementCalc';
import { LiveResultsPanel } from '@/components/ui/LiveResultsPanel';
import { Step1Age } from '@/components/steps/Step1Age';
import { Step2Expenses } from '@/components/steps/Step2Expenses';
import { Step3Assumptions } from '@/components/steps/Step3Assumptions';
import { Step4Results } from '@/components/steps/Step4Results';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const STEPS = [
  { number: 1, label: 'Your Age' },
  { number: 2, label: 'Expenses' },
  { number: 3, label: 'Assumptions' },
  { number: 4, label: 'Your Plan' },
];

export default function RetirementCalculatorPage() {
  const {
    inputs, results, liveResults, currentStep,
    updateInput, goToStep, nextStep, prevStep, reset,
    copyShareLink, stepAnnouncerRef, changedKeys,
    scenarioA, scenarioAResults, compareMode,
    saveScenarioA, clearComparison,
    hydrated,
  } = useRetirementCalc();

  return (
    <div className="app-wrapper">
      {}
      <header className="hb-header" role="banner">
        <div className="hb-header-inner">
          <div className="hb-logo-group">
            <div className="hb-logo" aria-label="RetLax Retirement Planner">
              <span className="hb-logo-retlax" style={{ color: 'var(--blue)' }}>Ret</span>
              <span className="hb-logo-mf" style={{ color: 'var(--success)' }}>Lax</span>
            </div>
            <div className="hb-logo-divider" aria-hidden="true" />
            <span className="hb-tool-name">Professional Retirement Planner</span>
          </div>
          <div className="hb-header-right">
            <span className="hb-edu-badge">Advanced Financial Modeling</span>
          </div>
        </div>
      </header>

      {}
      <div className="hb-disclaimer" role="complementary" aria-label="Important disclaimer">
        <strong>Disclaimer:</strong> This tool is designed for educational and planning purposes only. Actual financial outcomes are subject to market returns, tax changes, inflation shifts, and individual circumstances. Past performance is not a guarantee of future returns.
      </div>

      {}
      <div className="hb-hero">
        <h1 className="hb-hero-title">Plan your retirement with confidence</h1>
        <p className="hb-hero-sub">Estimate how much you need to save for a comfortable retirement — all assumptions are illustrative and fully editable</p>

        {}
        <nav className="hb-tabs" aria-label="Calculator steps">
          {STEPS.map((s) => {
            const isDone = s.number < currentStep;
            const isActive = s.number === currentStep;
            const canClick = s.number <= currentStep;
            return (
              <button
                key={s.number}
                type="button"
                className={`hb-tab${isActive ? ' hb-tab-active' : ''}${isDone ? ' hb-tab-done' : ''}`}
                onClick={() => canClick && goToStep(s.number)}
                disabled={!canClick}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Step ${s.number}: ${s.label}${isDone ? ' (completed)' : isActive ? ' (current)' : ''}`}
              >
                <span className="hb-tab-num" aria-hidden="true">{isDone ? '✓' : s.number}</span>
                <span className="hb-tab-label">{s.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div ref={stepAnnouncerRef} aria-live="polite" aria-atomic="true" className="sr-only" role="status" />

      {}
      <div className="hb-calc-area">
        <main id="main-content" className="hb-form-col" tabIndex={-1}>
          <ErrorBoundary>
            {currentStep === 1 && <Step1Age inputs={inputs} updateInput={updateInput} onNext={nextStep} />}
            {currentStep === 2 && <Step2Expenses inputs={inputs} updateInput={updateInput} onNext={nextStep} onBack={prevStep} />}
            {currentStep === 3 && <Step3Assumptions inputs={inputs} updateInput={updateInput} onNext={nextStep} onBack={prevStep} />}
            {currentStep === 4 && results && (
              <Step4Results
                results={results} inputs={inputs}
                onBack={prevStep} onReset={reset}
                onCopyLink={copyShareLink}
                onSaveScenarioA={saveScenarioA}
                scenarioA={scenarioA} scenarioAResults={scenarioAResults}
                compareMode={compareMode} onClearComparison={clearComparison}
                changedKeys={changedKeys}
              />
            )}
            {currentStep === 4 && !results && (
              <div className="hb-card" role="alert">
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <p style={{ color: 'var(--red)', fontWeight: 600, marginBottom: 16 }}>Invalid inputs. Please go back and review your entries.</p>
                  <button type="button" className="hb-btn-primary" onClick={prevStep}>← Go Back</button>
                </div>
              </div>
            )}
          </ErrorBoundary>
        </main>

        {}
        {currentStep < 4 && hydrated && (
          <LiveResultsPanel
            results={liveResults} inputs={inputs} currentStep={currentStep}
            onSaveScenarioA={saveScenarioA} compareMode={compareMode}
          />
        )}
      </div>

      {}
      <footer className="hb-footer" role="contentinfo">
        <div className="hb-footer-brand">
          <strong>RetLax retirement planner</strong>
          <span className="hb-footer-badge">Interactive Modeling Tool</span>
        </div>
        <p className="hb-footer-text">
          This calculator simulates wealth compounding and depletion based on mathematical approximations and user assumptions. Financial planning metrics, returns, tax rules, and inflation rates vary across locales; users should consult professional planners before making actual investment decisions.
        </p>
        <p className="hb-footer-links">
          <a href="/methodology">Methodology & assumptions</a>
        </p>
        <p className="hb-footer-legal">
          © 2026 RetLax Retirement Planner. All rights reserved. Mathematical projections are illustrative only.
        </p>
      </footer>
    </div>
  );
}
