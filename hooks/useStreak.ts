import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { StreakData, StreakDifficulty } from '../types';

const INITIAL_STREAK_DATA: StreakData = {
  enabled: true,
  lastListenDate: null,
  currentStreak: 0,
  history: [],
  difficulty: 'normal',
  completionDate: null,
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

  // Helper to get today's completions, clearing stale ones from yesterday.
  const getTodaysCompletions = useCallback((data: StreakData): string[] => {
    // On-the-fly migration for users with old data structure
    if (data.completionDate === undefined) {
      return [];
    }
    if (data.completionDate === todayStr) {
      return data.completedToday;
    }
    // It's a new day, so start with a fresh list.
    return [];
  }, [todayStr]);

  const updateStreak = useCallback((data: StreakData): StreakData => {
      const today = new Date();
      const currentTodayStr = today.toISOString().split('T')[0];

      // This function should only be called when we are certain a streak is being awarded for today.
      // Avoids incrementing streak multiple times a day.
      if (data.lastListenDate === currentTodayStr) {
        return data; 
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
      if (prevData.lastListenDate === todayStr) {
        return prevData; // Already recorded for today
      }
      // Easy mode doesn't need to touch completionDate/completedToday
      return updateStreak(prevData);
    });
  }, [setStreakData, streakData.difficulty, todayStr, updateStreak]);

  const recordCompletion = useCallback((podcastId: string) => {
    if (streakData.difficulty === 'easy') return;

    setStreakData(prevData => {
      const todaysCompletions = getTodaysCompletions(prevData);
      const newCompletedToday = [...new Set([...todaysCompletions, podcastId])];
      
      let updatedData: StreakData = {
        ...prevData,
        completedToday: newCompletedToday,
        completionDate: todayStr,
      };
      
      const goal = STREAK_GOALS[updatedData.difficulty];
      // Award streak if goal is met and it hasn't been awarded today yet
      if (newCompletedToday.length >= goal && updatedData.lastListenDate !== todayStr) {
        updatedData = updateStreak(updatedData);
      }
      return updatedData;
    });
  }, [setStreakData, streakData.difficulty, todayStr, updateStreak, getTodaysCompletions]);

  const unrecordCompletion = useCallback((podcastId: string) => {
     if (streakData.difficulty === 'easy') return;
     
     setStreakData(prevData => {
         const todaysCompletions = getTodaysCompletions(prevData);
         const newCompletedToday = todaysCompletions.filter(id => id !== podcastId);
         
         // We don't reverse a streak if it was already awarded. 
         // The user keeps the streak for the day for motivation.
         // The visual 'isTodayComplete' status will update correctly regardless.
         return {
           ...prevData,
           completedToday: newCompletedToday,
           completionDate: todayStr,
         };
     });
  }, [setStreakData, streakData.difficulty, getTodaysCompletions, todayStr]);

  const isTodayComplete = useMemo(() => {
    if (!streakData.enabled) return false;
    
    // For 'easy' mode, completion is simply based on the streak being awarded for today.
    if (streakData.difficulty === 'easy') {
      return streakData.lastListenDate === todayStr;
    }
    
    // For other modes, completion is based on meeting the goal with today's completed podcasts.
    const goal = STREAK_GOALS[streakData.difficulty];
    const todaysCompletions = getTodaysCompletions(streakData);
    return todaysCompletions.length >= goal;

  }, [streakData, todayStr, getTodaysCompletions]);


  return { streakData, setStreakData, recordActivity, recordCompletion, unrecordCompletion, isTodayComplete };
}