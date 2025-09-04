import React from 'react';

interface StatusBarProps {
  listenedCount: number;
  totalCount: number;
  percentage: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ listenedCount, totalCount, percentage }) => {
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center text-sm text-brand-text-secondary mb-1">
        <span className="font-semibold text-brand-text">{Math.round(percentage)}% Complete</span>
        <span>{listenedCount} of {totalCount} listened</span>
      </div>
      <div 
        className="w-full bg-brand-surface rounded-full h-2 b-border"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Podcast listening progress"
      >
        <div 
          className="bg-brand-primary h-full transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default StatusBar;