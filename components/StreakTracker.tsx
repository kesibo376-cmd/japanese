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
  const dayOfWeek = today.getDay(); // Sunday is 0, Monday is 1, etc.
  
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    return {
      date: d.toISOString().split('T')[0],
      dayLabel: DAY_LABELS[(d.getDay() + 7) % 7], // Handle different start of week
    };
  });

  const historySet = new Set(history);

  return (
    <div className="flex items-center gap-4 bg-brand-surface-light text-brand-text rounded-full p-1 pr-3">
      <div className="flex items-center gap-1">
        <div className="flex items-center justify-center bg-brand-surface rounded-full w-8 h-8">
            <FireIcon size={20} className="text-orange-400"/>
        </div>
        <span className="font-bold text-lg">{currentStreak}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {last7Days.map(({ date, dayLabel }, index) => {
          const isActive = historySet.has(date);
          return (
            <div key={index} className="flex flex-col items-center gap-1">
               <span className="text-xs text-brand-text-secondary">{dayLabel}</span>
              <div
                className={`w-3 h-3 rounded-full ${isActive ? 'bg-brand-primary' : 'bg-brand-surface'}`}
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
