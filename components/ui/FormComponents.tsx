'use client';

import { useState, useId } from 'react';

interface TooltipProps {
  content: string;
  label?: string;
}

export function Tooltip({ content, label = '?' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();

  return (
    <span className="tooltip-wrapper">
      <button
        type="button"
        className="tooltip-trigger"
        aria-label={`More information: ${content}`}
        aria-describedby={visible ? tooltipId : undefined}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
      >
        {label}
      </button>
      {visible && (
        <span role="tooltip" id={tooltipId} className="tooltip-box">
          {content}
        </span>
      )}
    </span>
  );
}

export function InfoTooltip({ content }: { content: string }) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();
  return (
    <span className="tooltip-wrapper">
      <button
        type="button"
        className="info-tooltip-btn"
        aria-label={`More information: ${content}`}
        aria-describedby={visible ? tooltipId : undefined}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
      >
        {}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
          <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <rect x="7.2" y="6.5" width="1.6" height="5" rx="0.8" fill="currentColor"/>
          <circle cx="8" cy="4.2" r="0.9" fill="currentColor"/>
        </svg>
      </button>
      {visible && (
        <span role="tooltip" id={tooltipId} className="tooltip-box">
          {content}
        </span>
      )}
    </span>
  );
}

export function sliderBg(value: number, min: number, max: number): string {
  const pct = ((value - min) / (max - min)) * 100;
  return `linear-gradient(to right, var(--blue) 0%, var(--blue) ${pct}%, var(--grey-border) ${pct}%, var(--grey-border) 100%)`;
}

interface SliderProps {
  id?: string;
  label: string;
  tooltip?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  displayValue: string;
  minLabel?: string;
  maxLabel?: string;
  'aria-label'?: string;
}

export function SliderInput({
  id,
  label,
  tooltip,
  min,
  max,
  step = 1,
  value,
  onChange,
  displayValue,
  minLabel,
  maxLabel,
}: SliderProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="form-group">
      <label htmlFor={inputId} className="form-label">
        {label}
        {tooltip && <Tooltip content={tooltip} />}
      </label>
      <div className="slider-container">
        <div className="slider-row">
          <input
            id={inputId}
            type="range"
            className="slider"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-valuetext={displayValue}
          />
          <span className="slider-value" aria-live="polite" aria-atomic="true">
            {displayValue}
          </span>
        </div>
        {(minLabel || maxLabel) && (
          <div className="slider-marks" aria-hidden="true">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface InputFieldProps {
  id?: string;
  label: string;
  tooltip?: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
  helpText?: string;
}

export function InputField({
  id,
  label,
  tooltip,
  value,
  onChange,
  prefix,
  suffix,
  min,
  max,
  step = 1,
  error,
  helpText,
}: InputFieldProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;

  return (
    <div className="form-group">
      <label htmlFor={inputId} className="form-label">
        {label}
        {tooltip && <Tooltip content={tooltip} />}
      </label>
      <div className="input-wrapper">
        {prefix && <span className="input-prefix" aria-hidden="true">{prefix}</span>}
        <input
          id={inputId}
          type="number"
          className={`form-input${prefix ? ' has-prefix' : ''}${suffix ? ' has-suffix' : ''}`}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          aria-invalid={!!error}
          aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim() || undefined}
        />
        {suffix && <span className="input-suffix" aria-hidden="true">{suffix}</span>}
      </div>
      {helpText && (
        <p id={helpId} className="form-label" style={{ fontWeight: 400, color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>
          {helpText}
        </p>
      )}
      {error && (
        <p id={errorId} className="form-error" role="alert" aria-live="assertive">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="section-title">{children}</h3>;
}
