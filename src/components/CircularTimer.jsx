import { useState, useEffect } from 'react'

export default function CircularTimer({ totalSeconds, secondsLeft, size = 120, paused = false }) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = secondsLeft / totalSeconds
  const dashoffset = circumference * (1 - pct)

  const stroke =
    pct > 0.6
      ? 'var(--color-accent-teal)'
      : pct > 0.3
      ? 'var(--color-accent-gold)'
      : 'var(--color-error)'
  const isUrgent = pct <= 0.3

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block' }}
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-surface-muted)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: paused ? 'none' : 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
      />
      {/* Center text */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.28}
        fontWeight="bold"
        fill={isUrgent ? 'var(--color-error)' : 'var(--color-text-primary)'}
        style={isUrgent ? { animation: 'pulse 1s ease-in-out infinite' } : {}}
      >
        {secondsLeft}
      </text>
    </svg>
  )
}
