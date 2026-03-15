'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { RetirementInputs, DEFAULT_INPUTS, calculateRetirement } from '@/lib/retirement';

function encodeToURL(inputs: RetirementInputs): string {
  if (typeof window === 'undefined') return '';
  const p = new URLSearchParams({
    ca: String(inputs.currentAge), ra: String(inputs.retirementAge),
    le: String(inputs.lifeExpectancy), me: String(inputs.currentMonthlyExpenses),
    gi: String(inputs.generalInflationRate), mi: String(inputs.medicalInflationRate),
    li: String(inputs.lifestyleInflationRate), bf: String(inputs.basicExpenseFraction),
    lf: String(inputs.lifestyleExpenseFraction), hf: String(inputs.healthcareExpenseFraction),
    pr: String(inputs.preRetirementReturn), po: String(inputs.postRetirementReturn),
    tu: inputs.enableTopUp ? '1' : '0', tr: String(inputs.topUpRate),
    es: String(inputs.existingSavings),
  });
  return p.toString();
}

function decodeFromURL(): Partial<RetirementInputs> {

  const p = new URLSearchParams(window.location.search);
  const num = (k: string) => { const v = p.get(k); return v !== null ? Number(v) : undefined; };
  const partial: Partial<RetirementInputs> = {};
  if (num('ca') !== undefined) partial.currentAge = num('ca')!;
  if (num('ra') !== undefined) partial.retirementAge = num('ra')!;
  if (num('le') !== undefined) partial.lifeExpectancy = num('le')!;
  if (num('me') !== undefined) partial.currentMonthlyExpenses = num('me')!;
  if (num('gi') !== undefined) partial.generalInflationRate = num('gi')!;
  if (num('mi') !== undefined) partial.medicalInflationRate = num('mi')!;
  if (num('li') !== undefined) partial.lifestyleInflationRate = num('li')!;
  if (num('bf') !== undefined) partial.basicExpenseFraction = num('bf')!;
  if (num('lf') !== undefined) partial.lifestyleExpenseFraction = num('lf')!;
  if (num('hf') !== undefined) partial.healthcareExpenseFraction = num('hf')!;
  if (num('pr') !== undefined) partial.preRetirementReturn = num('pr')!;
  if (num('po') !== undefined) partial.postRetirementReturn = num('po')!;
  if (p.get('tu') !== null) partial.enableTopUp = p.get('tu') === '1';
  if (num('tr') !== undefined) partial.topUpRate = num('tr')!;
  if (num('es') !== undefined) partial.existingSavings = num('es')!;
  return partial;
}

export type ScenarioLabel = 'A' | 'B';

export interface Scenario {
  label: ScenarioLabel;
  inputs: RetirementInputs;
  name: string;
}

export function useRetirementCalc() {
  const [inputs, setInputs] = useState<RetirementInputs>(DEFAULT_INPUTS);
  const [hydrated, setHydrated] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const stepAnnouncerRef = useRef<HTMLDivElement | null>(null);

  const [scenarioA, setScenarioA] = useState<RetirementInputs | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  const [changedKeys, setChangedKeys] = useState<Set<keyof RetirementInputs>>(new Set());

  useEffect(() => {
    const fromURL = decodeFromURL();
    if (Object.keys(fromURL).length > 0) {
      setInputs(prev => ({ ...prev, ...fromURL }));
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.history.replaceState(null, '', `${window.location.pathname}?${encodeToURL(inputs)}`);
  }, [inputs, hydrated]);

  useEffect(() => {
    if (stepAnnouncerRef.current) {
      const labels = ['Your age', 'Your expenses', 'Assumptions', 'Your retirement plan'];
      stepAnnouncerRef.current.textContent = `Step ${currentStep}: ${labels[currentStep - 1]}`;
    }
  }, [currentStep]);

  const results = useMemo(() => {
    try { return calculateRetirement(inputs); } catch { return null; }
  }, [inputs]);

  const liveResults = useMemo(() => {
    try { return calculateRetirement(inputs); } catch { return null; }
  }, [inputs]);

  const scenarioAResults = useMemo(() => {
    if (!scenarioA) return null;
    try { return calculateRetirement(scenarioA); } catch { return null; }
  }, [scenarioA]);

  const updateInput = useCallback(<K extends keyof RetirementInputs>(
    key: K, value: RetirementInputs[K]
  ) => {
    setInputs(prev => ({ ...prev, [key]: value }));
    if (value !== DEFAULT_INPUTS[key]) {
      setChangedKeys(prev => new Set([...prev, key]));
    } else {
      setChangedKeys(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  }, []);

  const nextStep = useCallback(() => setCurrentStep(s => Math.min(s + 1, 4)), []);
  const prevStep = useCallback(() => setCurrentStep(s => Math.max(s - 1, 1)), []);
  const goToStep = useCallback((step: number) => setCurrentStep(step), []);

  const reset = useCallback(() => {
    setInputs(DEFAULT_INPUTS);
    setCurrentStep(1);
    setChangedKeys(new Set());
    setScenarioA(null);
    setCompareMode(false);
    if (typeof window !== 'undefined') window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const copyShareLink = useCallback(() => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href).catch(() => {});
    }
  }, []);

  const saveScenarioA = useCallback(() => {
    setScenarioA(inputs);
    setCompareMode(true);
  }, [inputs]);

  const clearComparison = useCallback(() => {
    setScenarioA(null);
    setCompareMode(false);
  }, []);

  return {
    inputs, results, liveResults, currentStep,
    updateInput, goToStep, nextStep, prevStep, reset,
    copyShareLink, stepAnnouncerRef, changedKeys,
    scenarioA, scenarioAResults, compareMode,
    saveScenarioA, clearComparison,
    hydrated,
  };
}
