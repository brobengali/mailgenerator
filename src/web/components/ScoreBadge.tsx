import React from 'react';

interface ScoreBadgeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, label, size = 'md' }) => {
  const pct = score <= 1 ? Math.round(score * 100) : Math.round(score);

  let style = {
    background: 'rgba(16,185,129,0.1)',
    color: '#065f46',
    borderColor: 'rgba(16,185,129,0.3)',
  };

  if (pct < 50) {
    style = {
      background: 'rgba(239,68,68,0.1)',
      color: '#991b1b',
      borderColor: 'rgba(239,68,68,0.3)',
    };
  } else if (pct < 70) {
    style = {
      background: 'rgba(245,158,11,0.1)',
      color: '#92400e',
      borderColor: 'rgba(245,158,11,0.3)',
    };
  } else if (pct < 85) {
    style = {
      background: 'rgba(99,102,241,0.1)',
      color: '#3730a3',
      borderColor: 'rgba(99,102,241,0.3)',
    };
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-bold',
  };

  return (
    <div
      style={style}
      className={`inline-flex items-center space-x-1.5 rounded-xl border font-mono font-bold ${sizeClasses[size]}`}
    >
      {label && <span className="font-sans font-medium text-[11px] opacity-75">{label}:</span>}
      <span>{pct}%</span>
    </div>
  );
};

