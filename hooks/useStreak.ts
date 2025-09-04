import React, { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { StreakData, StreakDifficulty } from '../types';

const INITIAL_STREAK_DATA: StreakData = {
  enabled: false,
  lastListenDate: null,
  currentStreak: 0,
  history: [],
  difficulty: 'normal',
  completedToday: [],
};

const STREAK_GOALS: Record<StreakDifficulty, number> = {
  easy: 1,      // Goal is just activity, not completion
  normal: 1,
  hard: 2,
  extreme: 3,
};

export function useStreak() {
  const [streakData, setStreakData] = useLocalStorage<StreakData>('streakData', INITIAL_STREAK_DATA);
  
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const updateStreak = useCallback((data: StreakData): StreakData => {
      const today = new Date();
      const currentTodayStr = today.toISOString().split('T')[0];

      if (data.lastListenDate === currentTodayStr) {
        return data; // Already recorded for today
      }
      
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const isConsecutive = data.lastListenDate === yesterdayStr;
      const newCurrentStreak = isConsecutive ? data.currentStreak + 1 : 1;
      const newHistory = [...new Set([...data.history, currentTodayStr])].slice(-365);
      
      return {
        ...data,
        lastListenDate: currentTodayStr,
        currentStreak: newCurrentStreak,
        history: newHistory,
      };
  }, []);

  const recordActivity = useCallback(() => {
    // Only 'easy' mode uses generic activity for streaks.
    if (streakData.difficulty !== 'easy') return;
    
    setStreakData(prevData => {
       // If it's a new day, clear completed podcasts
      const newDay = prevData.lastListenDate !== todayStr;
      const updatedData = { ...prevData, completedToday: newDay ? [] : prevData.completedToday };
      return updateStreak(updatedData);
    });
  }, [setStreakData, streakData.difficulty, todayStr, updateStreak]);

  const recordCompletion = useCallback((podcastId: string) => {
    if (streakData.difficulty === 'easy') return;

    setStreakData(prevData => {
      const newDay = prevData.lastListenDate !== todayStr;
      const completedToday = newDay ? [] : prevData.completedToday;
      
      const newCompletedToday = [...new Set([...completedToday, podcastId])];
      let updatedData: StreakData = { ...prevData, completedToday: newCompletedToday };
      
      const goal = STREAK_GOALS[updatedData.difficulty];
      if (newCompletedToday.length >= goal) {
        updatedData = updateStreak(updatedData);
      }
      return updatedData;
    });
  }, [setStreakData, streakData.difficulty, todayStr, updateStreak]);

  const unrecordCompletion = useCallback((podcastId: string) => {
     if (streakData.difficulty === 'easy') return;
     
     setStreakData(prevData => {
         const newCompletedToday = prevData.completedToday.filter(id => id !== podcastId);
         return { ...prevData, completedToday: newCompletedToday };
     });
  }, [setStreakData, streakData.difficulty]);

  const isTodayComplete = useMemo(() => {
    if (!streakData.enabled) return false;
    
    // Check if streak was already awarded for today
    if (streakData.lastListenDate === todayStr) return true;
    
    // For non-easy modes, check if the goal has been met, even if streak not awarded yet
    if (streakData.difficulty !== 'easy') {
        const goal = STREAK_GOALS[streakData.difficulty];
        // Ensure completions are from today
        const completionsForToday = streakData.lastListenDate === todayStr ? streakData.completedToday : [];
        return completionsForToday.length >= goal;
    }
    
    return false;
  }, [streakData, todayStr]);


  return { streakData, setStreakData, recordActivity, recordCompletion, unrecordCompletion, isTodayComplete };
}