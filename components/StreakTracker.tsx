import React from 'react';
import type { StreakData } from '../types';
import FireIcon from './icons/FireIcon';

interface StreakTrackerProps {
  streakData: StreakData;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const StreakTracker: React.FC<StreakTrackerProps> = ({ streakData }) => {
  const { currentStreak, history } = streakData;

  const today = new Date();
  
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    return {
      date: d.toISOString().split('T')[0],
      dayLabel: DAY_LABELS[d.getDay()],
    };
  });

  const historySet = new Set(history);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8 bg-brand-surface text-brand-text rounded-lg p-4 b-border b-shadow">
      {/* Streak Count */}
      <div className="flex items-center gap-4 self-start sm:self-center">
        <div className="flex-shrink-0 flex items-center justify-center bg-brand-surface-light rounded-full w-14 h-14 b-border">
            <FireIcon size={28} className="text-orange-400"/>
        </div>
        <div>
            <span className="font-bold text-4xl leading-none">{currentStreak}</span>
            <p className="text-brand-text-secondary text-sm">Day Streak</p>
        </div>
      </div>
      
      {/* 7-Day Chart */}
      <div className="flex items-center justify-between gap-1 w-full sm:w-auto sm:justify-end sm:gap-3">
        {last7Days.map(({ date, dayLabel }, index) => {
          const isActive = historySet.has(date);
          return (
            <div key={index} className="flex flex-col items-center gap-2 p-1 rounded-md text-center">
               <span className="text-xs sm:text-sm text-brand-text-secondary">{dayLabel}</span>
              <div
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-colors duration-200 b-border ${isActive ? 'bg-brand-primary' : 'bg-brand-surface-light'}`}
                title={`Activity on ${date}`}
              ></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StreakTracker;