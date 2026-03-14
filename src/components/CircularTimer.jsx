import { useState, useEffect } from 'react'

export default function CircularTimer({ totalSeconds, secondsLeft, size = 120, paused = false }) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = secondsLeft / totalSeconds
  const dashoffset = circumference * (1 - pct)

  const stroke = pct > 0.6 ? '#22c55e' : pct > 0.3 ? '#f59e0b' : '#ef4444'
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
        stroke="#374151"
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
        fill={isUrgent ? '#ef4444' : '#f4f4f5'}
        style={isUrgent ? { animation: 'pulse 1s ease-in-out infinite' } : {}}
      >
        {secondsLeft}
      </text>
    </svg>
  )
}
