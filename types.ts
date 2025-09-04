export interface Podcast {
  id: string;
  name: string;
  url?: string; // Optional, as it won't exist for IndexedDB files in localStorage
  duration: number; // in seconds
  progress: number; // in seconds
  isListened: boolean;
  storage: 'preloaded' | 'indexeddb';
}
