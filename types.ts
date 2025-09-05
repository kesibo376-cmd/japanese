export interface Podcast {
  id: string;
  name: string;
  url?: string; // Optional, as it won't exist for IndexedDB files in localStorage
  duration: number; // in seconds
  progress: number; // in seconds
  isListened: boolean;
  storage: 'preloaded' | 'indexeddb';
}

export type Theme = 'charcoal' | 'paper' | 'brutalist' | 'retro-web' | 'minimal' | 'hand-drawn';

export type StreakDifficulty = 'easy' | 'normal' | 'hard' | 'extreme';

export interface StreakData {
  enabled: boolean;
  lastListenDate: string | null; // ISO Date String: YYYY-MM-DD
  currentStreak: number;
  history: string[]; // Array of ISO Date Strings
  difficulty: StreakDifficulty;
  completionDate: string | null; // ISO Date for the completedToday list
  completedToday: string[]; // Array of podcast IDs completed on completionDate
}

export type CompletionSound = 'none' | 'minecraft' | 'pokemon' | 'runescape';