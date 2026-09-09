import React from 'react';

interface ScoreDialProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  grade?: string;
}

export const ScoreDial: React.FC<ScoreDialProps> = ({
  score,
  size = 120,
  strokeWidth = 9,
  label = 'EQI Score',
  grade
}) => {
  const pct = score <= 1 ? Math.round(score * 100) : Math.round(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  let strokeColor = '#059669'; // Emerald >= 85
  if (pct < 50) strokeColor = '#dc2626'; // Red < 50
  else if (pct < 70) strokeColor = '#d97706'; // Amber < 70
  else if (pct < 85) strokeColor = '#7c3aed'; // Violet < 85

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(139,92,246,0.12)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-extrabold font-mono tracking-tight" style={{ color: '#1e1b4b' }}>
          {pct}%
        </span>
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
          {grade ? `Grade ${grade}` : label}
        </span>
      </div>
    </div>
  );
};

