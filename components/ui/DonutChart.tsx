'use client';

import { useId } from 'react';

interface DonutSlice {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSub?: string;
}

export function DonutChart({
  slices,
  size = 200,
  strokeWidth = 36,
  centerLabel,
  centerSub,
}: DonutChartProps) {
  const baseId  = useId();
  const titleId = `${baseId}-title`;
  const descId  = `${baseId}-desc`;

  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  let cumulativeOffset = 0;
  const startAngle = -90;

  const fullDesc = slices
    .map(s => `${s.label}: ${((s.value / total) * 100).toFixed(0)}% (${centerLabel ?? ''})`)
    .join('. ');

  return (
    <figure
      aria-label={`Donut chart: ${slices.map(s => `${s.label} ${((s.value / total) * 100).toFixed(0)}%`).join(', ')}`}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, margin: 0 }}
    >
      {}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        style={{ overflow: 'visible' }}
      >
        <title id={titleId}>Corpus composition donut chart</title>
        <desc id={descId}>{fullDesc}</desc>

        {}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--grey-border)"
          strokeWidth={strokeWidth}
        />

        {slices.map((slice, i) => {
          const pct = slice.value / total;
          const dashLength = circumference * pct;
          const gapLength  = circumference - dashLength;
          const rotation   = startAngle + (cumulativeOffset / total) * 360;
          cumulativeOffset += slice.value;

          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${gapLength}`}
              strokeDashoffset={0}
              transform={`rotate(${rotation} ${cx} ${cy})`}
              strokeLinecap="butt"
              style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }}
            />
          );
        })}

        {centerLabel && (
          <text
            x={cx} y={cy - 8}
            textAnchor="middle" dominantBaseline="middle"
            fontFamily="Montserrat, Arial, sans-serif"
            fontWeight="800"
            fontSize={size < 160 ? 14 : 18}
            fill="var(--blue)"
          >
            {centerLabel}
          </text>
        )}
        {centerSub && (
          <text
            x={cx} y={cy + 16}
            textAnchor="middle" dominantBaseline="middle"
            fontFamily="Montserrat, Arial, sans-serif"
            fontWeight="500"
            fontSize={10}
            fill="var(--text-muted)"
          >
            {centerSub}
          </text>
        )}
      </svg>

      {}
      <ul
        style={{
          listStyle: 'none',
          display: 'flex', flexWrap: 'wrap',
          gap: '8px 16px', justifyContent: 'center',
          padding: 0, margin: 0,
        }}
      >
        {slices.map((slice, i) => (
          <li
            key={i}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}
          >
            <span
              style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: slice.color, flexShrink: 0 }}
              aria-hidden="true"
            />
            {slice.label} ({((slice.value / total) * 100).toFixed(0)}%)
          </li>
        ))}
      </ul>
    </figure>
  );
}
