import React from 'react';

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

export default function CharacterCounter({ current, max, className = '' }: CharacterCounterProps) {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 80;
  const isOverLimit = current > max;

  const getColorClass = () => {
    if (isOverLimit) return 'text-red-600';
    if (isNearLimit) return 'text-yellow-600';
    return 'text-gray-500';
  };

  return (
    <div className={`text-sm ${getColorClass()} ${className}`}>
      <span className={isOverLimit ? 'font-semibold' : ''}>
        {current.toLocaleString()}
      </span>
      <span className="text-gray-400"> / {max.toLocaleString()}</span>
      {isOverLimit && (
        <span className="ml-2 text-red-600 font-medium">
          ({current - max} over limit)
        </span>
      )}
    </div>
  );
}
