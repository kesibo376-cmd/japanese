import React, { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { StreakData } from '../types';

const INITIAL_STREAK_DATA: StreakData = {
  enabled: false,
  lastListenDate: null,
  currentStreak: 0,
  history: [],
};

export function useStreak() {
  const [streakData, setStreakData] = useLocalStorage<StreakData>('streakData', INITIAL_STREAK_DATA);

  const recordActivity = useCallback(() => {
    setStreakData(prevData => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      if (prevData.lastListenDate === todayStr) {
        return prevData; // Already recorded for today
      }

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const isConsecutive = prevData.lastListenDate === yesterdayStr;
      const newCurrentStreak = isConsecutive ? prevData.currentStreak + 1 : 1;
      
      const newHistory = [...new Set([...prevData.history, todayStr])].slice(-365); // Keep last 365 days

      return {
        ...prevData,
        lastListenDate: todayStr,
        currentStreak: newCurrentStreak,
        history: newHistory,
      };
    });
  }, [setStreakData]);

  return { streakData, setStreakData, recordActivity };
}
