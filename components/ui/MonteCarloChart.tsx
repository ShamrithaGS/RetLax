'use client';

import { MonteCarloResult } from '@/lib/retirement';
import { formatCurrency } from '@/lib/retirement';

interface Props {
  mc: MonteCarloResult;
  retirementAge: number;
  lifeExpectancy: number;
  postRetirementReturn: number;
}

const TIER_COLORS: Record<string, { cls: string }> = {
  p90: { cls: 'mc-tier-teal-deep' },
  p75: { cls: 'mc-tier-teal' },
  p50: { cls: 'mc-tier-blue' },
  p25: { cls: 'mc-tier-amber' },
  p10: { cls: 'mc-tier-amber-muted' },
};

function ScoreRing({ rate }: { rate: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const fill = (rate / 100) * circ;

  const cls =
    rate >= 85 ? 'mc-ring-strong' :
    rate >= 70 ? 'mc-ring-good' :
    rate >= 55 ? 'mc-ring-moderate' :
                 'mc-ring-low';

  const label =
    rate >= 85 ? 'Strong' :
    rate >= 70 ? 'Good' :
    rate >= 55 ? 'Moderate' :
                 'Review';

  return (
    <div className={`mc-ring-wrap ${cls}`} aria-hidden="true">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--grey-border)" strokeWidth="7" />
        <circle
          cx="36" cy="36" r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeDashoffset={circ * 0.25}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text x="36" y="33" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">{rate.toFixed(0)}%</text>
        <text x="36" y="46" textAnchor="middle" fontSize="9" fontWeight="500" fill="currentColor">{label}</text>
      </svg>
    </div>
  );
}

export function MonteCarloChart({ mc, retirementAge, lifeExpectancy, postRetirementReturn }: Props) {
  const maxVal = Math.max(mc.p90, 1);
  const yearsInRetirement = lifeExpectancy - retirementAge;

  const tiers = [
    { key: 'p90', label: 'Best 10%',    pct: 'Top decile outcome',   value: mc.p90 },
    { key: 'p75', label: 'Top quarter', pct: 'Upper quartile',       value: mc.p75 },
    { key: 'p50', label: 'Median',      pct: '50th percentile',      value: mc.p50 },
    { key: 'p25', label: 'Low quarter', pct: 'Lower quartile',       value: mc.p25 },
    { key: 'p10', label: 'Worst 10%',   pct: 'Bottom decile outcome',value: mc.p10 },
  ] as const;

  const contextNote =
    mc.successRate >= 85
      ? `In ${mc.successRate.toFixed(0)}% of 500 simulated scenarios, your corpus lasted all ${yearsInRetirement} retirement years.`
      : mc.successRate >= 60
      ? `In ${mc.successRate.toFixed(0)}% of simulations the corpus lasted. Consider a slightly larger SIP or later retirement age.`
      : `Only ${mc.successRate.toFixed(0)}% of simulations succeeded. Your plan may benefit from revision — try the What-If Explorer below.`;

  return (
    <div
      className="monte-carlo-section"
      role="region"
      aria-label={`Monte Carlo simulation. Success rate ${mc.successRate.toFixed(0)}%`}
    >
      {}
      <div className="mc-header">
        <div className="mc-header-text">
          <h3 className="mc-title">Monte Carlo Simulation</h3>
          <p className="mc-subtitle">
            500 randomised return sequences · Illustrative only · Not a prediction
          </p>
        </div>
        <ScoreRing rate={mc.successRate} />
      </div>

      {}
      <p className="mc-context">{contextNote}</p>

      {}
      <div className="mc-fan" aria-hidden="true">
        {tiers.map(t => {
          const colors = TIER_COLORS[t.key];
          const widthPct = maxVal > 0 ? (t.value / maxVal) * 100 : 0;
          return (
            <div key={t.key} className="mc-tier-row">
              <div className="mc-tier-meta">
                <span className={`mc-tier-name ${colors.cls}`}>{t.label}</span>
                <span className="mc-tier-pct">{t.pct}</span>
              </div>
              <div className="mc-tier-track">
                <div
                  className={`mc-tier-fill ${colors.cls}`}
                  style={{ width: `${widthPct}%` }}
                />
                <span
                  className={`mc-tier-val ${colors.cls}`}
                >
                  {t.value > 0 ? formatCurrency(t.value) : 'Depleted'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {}
      <div className="mc-legend" aria-hidden="true">
        {tiers.map(t => (
          <div key={t.key} className="mc-legend-dot-wrap">
            <span className={`mc-legend-dot ${TIER_COLORS[t.key].cls}`} />
            <span>{t.label}</span>
          </div>
        ))}
      </div>

      {}
      <div className="mc-stats-row">
        <div className="mc-stat-card">
          <span className="mc-stat-label">Median corpus left</span>
          <span className="mc-stat-val mc-stat-blue">
            {mc.p50 > 0 ? formatCurrency(mc.p50) : 'Depleted'}
          </span>
          <span className="mc-stat-sub">at age {lifeExpectancy}</span>
        </div>
        <div className="mc-stat-card">
          <span className="mc-stat-label">Best case left</span>
          <span className="mc-stat-val mc-stat-teal">{formatCurrency(mc.p90)}</span>
          <span className="mc-stat-sub">top 10% of scenarios</span>
        </div>
        <div className="mc-stat-card">
          <span className="mc-stat-label">Conservative case</span>
          <span className="mc-stat-val mc-stat-amber">
            {mc.p10 > 0 ? formatCurrency(mc.p10) : 'Depleted'}
          </span>
          <span className="mc-stat-sub">bottom 10% of scenarios</span>
        </div>
        <div className="mc-stat-card">
          <span className="mc-stat-label">Plan horizon</span>
          <span className="mc-stat-val mc-stat-blue">{yearsInRetirement} yrs</span>
          <span className="mc-stat-sub">age {retirementAge} to {lifeExpectancy}</span>
        </div>
      </div>

      <div className="mc-footer-note">
        Uses an illustrative log-normal return model; volatility is estimated from the assumed return level ({(postRetirementReturn * 100).toFixed(1)}% mean). Actual market behaviour will differ. This is for educational illustration only — not a prediction or guarantee.
      </div>
    </div>
  );
}
