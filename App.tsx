import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Podcast, StreakData, Theme } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTheme } from './hooks/useTheme';
import { useStreak } from './hooks/useStreak';
import { savePodcastToDB, clearPodcastsInDB } from './lib/db';
import FileUpload from './components/FileUpload';
import PodcastList from './components/PodcastList';
import Player from './components/Player';
import StatusBar from './components/StatusBar';
import SettingsIcon from './components/icons/SettingsIcon';
import EditIcon from './components/icons/EditIcon';
import SettingsModal from './components/SettingsModal';
import StreakTracker from './components/StreakTracker';

const INITIAL_PODCASTS: Podcast[] = [];

// NOTE: As web applications cannot directly read your file system for security reasons,
// you must list the audio files you place in the `/public/audio` folder here.
// Ensure the file names here exactly match the ones in your folder.
const PRELOADED_PODCAST_URLS = [
  // Example: '/audio/my-cool-podcast.mp3',
];


export default function App() {
  const [podcasts, setPodcasts] = useLocalStorage<Podcast[]>('podcasts', INITIAL_PODCASTS);
  const [title, setTitle] = useLocalStorage<string>('appTitle', '日本語コース');
  const [theme, setTheme] = useTheme();
  const { streakData, setStreakData, recordActivity } = useStreak();
  const [hideCompleted, setHideCompleted] = useLocalStorage<boolean>('hideCompleted', false);
  const [currentPodcastId, setCurrentPodcastId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Effect to load pre-defined podcasts from the public folder on initial app load
  useEffect(() => {
    const loadPodcastFromUrl = (url: string): Promise<Podcast | null> => {
      return new Promise((resolve) => {
        const audio = new Audio(url);
        audio.onloadedmetadata = () => {
          const fileName = url.split('/').pop()?.replace(/\.[^/.]+$/, "") || "Unknown";
          // A simple formatter to make file names like 'history-of-coffee' into 'History Of Coffee'
          const formattedName = fileName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          resolve({
            id: url,
            name: formattedName,
            url: url,
            duration: audio.duration,
            progress: 0,
            isListened: false,
            storage: 'preloaded',
          });
        };
        audio.onerror = () => {
          console.error(`Could not load metadata for ${url}. Make sure the file exists in the /public/audio/ folder.`);
          resolve(null);
        };
      });
    };

    const loadPreloadedPodcasts = async () => {
      if (PRELOADED_PODCAST_URLS.length === 0) return;
      
      setIsLoading(true);

      const newPodcastsPromises = PRELOADED_PODCAST_URLS.map(loadPodcastFromUrl);
      const results = await Promise.all(newPodcastsPromises);
      const newPodcasts = results.filter((p): p is Podcast => p !== null);

      if (newPodcasts.length > 0) {
        setPodcasts(prevPodcasts => {
          const existingIds = new Set(prevPodcasts.map(p => p.id));
          const uniqueNewPodcasts = newPodcasts.filter(p => !existingIds.has(p.id));
          return [...prevPodcasts, ...uniqueNewPodcasts];
        });
      }
      setIsLoading(false);
    };
    
    // Check if preloaded podcasts are already in state to avoid re-loading
    const hasPreloaded = PRELOADED_PODCAST_URLS.every(url => podcasts.some(p => p.id === url));
    if (!hasPreloaded) {
      loadPreloadedPodcasts();
    }
  }, [setPodcasts, podcasts]);

  // Effect to lock body scroll when player is expanded or settings are open
  useEffect(() => {
    const shouldLockScroll = isPlayerExpanded || isSettingsOpen;
    if (shouldLockScroll) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    // Cleanup on component unmount
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isPlayerExpanded, isSettingsOpen]);

  // Effect to focus the title input when editing starts
  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  const handleFileUpload = useCallback((files: FileList) => {
    setIsLoading(true);

    const newPodcastPromises = Array.from(files).map(file => {
      return new Promise<Podcast | null>((resolve, reject) => {
        const tempAudioUrl = URL.createObjectURL(file);
        const audioElement = new Audio(tempAudioUrl);
        const podcastId = `${file.name}-${file.lastModified}`;

        audioElement.onloadedmetadata = async () => {
          try {
            await savePodcastToDB(podcastId, file);
            const newPodcast: Podcast = {
              id: podcastId,
              name: file.name.replace(/\.[^/.]+$/, ""),
              duration: audioElement.duration,
              progress: 0,
              isListened: false,
              storage: 'indexeddb',
            };
            URL.revokeObjectURL(tempAudioUrl);
            resolve(newPodcast);
          } catch (error) {
              console.error(`Failed to save ${file.name} to IndexedDB`, error);
              URL.revokeObjectURL(tempAudioUrl);
              reject(null);
          }
        };

        audioElement.onerror = () => {
          console.error(`Error loading audio metadata for: ${file.name}`);
          URL.revokeObjectURL(tempAudioUrl);
          reject(null); // Use reject to signify an error
        };
      });
    });

    Promise.allSettled(newPodcastPromises).then(results => {
      const successfulUploads = results
        .filter((res): res is PromiseFulfilledResult<Podcast> => res.status === 'fulfilled' && res.value !== null)
        .map(res => res.value);

      setPodcasts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNewPodcasts = successfulUploads.filter(p => !existingIds.has(p.id));
        return [...prev, ...uniqueNewPodcasts];
      });

      setIsLoading(false);
    });
  }, [setPodcasts]);

  const updatePodcastProgress = useCallback((id: string, progress: number) => {
    if (streakData.enabled) {
      recordActivity();
    }
    setPodcasts(prev => 
      prev.map(p => {
        if (p.id === id) {
          // If progress is within 1 second of the end, mark as listened
          const isFinished = p.duration > 0 && progress >= p.duration - 1;
          return { ...p, progress, isListened: p.isListened || isFinished };
        }
        return p;
      })
    );
  }, [setPodcasts, recordActivity, streakData.enabled]);

  const updatePodcastDuration = useCallback((id: string, duration: number) => {
    setPodcasts(prev =>
      prev.map(p => (p.id === id && p.duration === 0) ? { ...p, duration } : p)
    );
  }, [setPodcasts]);
  
  const handleSelectPodcast = (id: string) => {
    if (currentPodcastId === id) {
      setIsPlaying(prev => !prev);
    } else {
      setCurrentPodcastId(id);
      setIsPlaying(true);
      setIsPlayerExpanded(true); // Expand player on new selection
    }
  };

  const handlePlaybackEnd = () => {
      setIsPlaying(false);
      if (currentPodcastId) {
        // The check in updatePodcastProgress is more reliable, but we can ensure it's marked here too.
        setPodcasts(prev => 
            prev.map(p => p.id === currentPodcastId ? { ...p, isListened: true } : p)
        );
      }
  };

  const handleResetProgress = useCallback(() => {
    setIsPlaying(false); // Stop playback for better UX
    setPodcasts(prev => 
        prev.map(p => ({ ...p, progress: 0, isListened: false }))
    );
  }, [setPodcasts]);

  const handleDeleteAll = useCallback(async () => {
    try {
        await clearPodcastsInDB();
        setPodcasts([]);
        setCurrentPodcastId(null);
        setIsPlaying(false);
        setIsPlayerExpanded(false);
    } catch (error) {
        console.error("Failed to delete all podcasts:", error);
    }
  }, [setPodcasts]);

  const currentPodcast = useMemo(() => 
    podcasts.find(p => p.id === currentPodcastId),
    [podcasts, currentPodcastId]
  );
  
  const listenedStats = useMemo(() => {
    const listenedCount = podcasts.filter(p => p.isListened).length;
    const totalCount = podcasts.length;
    const percentage = totalCount > 0 ? (listenedCount / totalCount) * 100 : 0;
    return { listenedCount, totalCount, percentage };
  }, [podcasts]);

  const visiblePodcasts = useMemo(() => {
    const sorted = [...podcasts].sort((a, b) => {
      const numA = parseInt(a.name, 10);
      const numB = parseInt(b.name, 10);

      // If both are not numbers, sort alphabetically
      if (isNaN(numA) && isNaN(numB)) {
        return a.name.localeCompare(b.name);
      }
      // If only A is not a number, push it to the end
      if (isNaN(numA)) {
        return 1;
      }
      // If only B is not a number, push it to the end
      if (isNaN(numB)) {
        return -1;
      }
      // Otherwise, sort numerically
      return numA - numB;
    });

    if (hideCompleted) {
        return sorted.filter(p => !p.isListened);
    }
    return sorted;
  }, [podcasts, hideCompleted]);

  return (
    <div className="text-brand-text min-h-screen">
      <div className={`transition-opacity duration-300 ${isPlayerExpanded ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
        <header className="p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                {isEditingTitle ? (
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        setIsEditingTitle(false);
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="text-2xl sm:text-3xl font-bold bg-transparent text-brand-text focus:outline-none w-full border-b-2 border-brand-surface-light focus:border-brand-primary transition-colors"
                    aria-label="Edit course title"
                  />
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h1 className="text-2xl sm:text-3xl font-bold truncate">{title}</h1>
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="text-brand-text-secondary hover:text-brand-text p-1 rounded-full transition-opacity duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      aria-label="Edit title"
                    >
                      <EditIcon size={20} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 sm:gap-4 self-end sm:self-auto">
                <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
                 <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 text-brand-text-secondary hover:text-brand-text rounded-full transition-colors duration-200"
                    aria-label="Open settings"
                  >
                    <SettingsIcon size={24} />
                  </button>
              </div>
            </div>
            {podcasts.length > 0 && (
              <StatusBar 
                listenedCount={listenedStats.listenedCount}
                totalCount={listenedStats.totalCount}
                percentage={listenedStats.percentage}
              />
            )}
          </div>
        </header>

        <main className="p-4 sm:p-6 md:p-8 pt-0">
          <div className="max-w-4xl mx-auto">
            {streakData.enabled && podcasts.length > 0 && (
              <div className="mb-6">
                <StreakTracker streakData={streakData} />
              </div>
            )}
            {podcasts.length > 0 ? (
              <PodcastList 
                podcasts={visiblePodcasts}
                currentPodcastId={currentPodcastId}
                isPlaying={isPlaying}
                onSelectPodcast={handleSelectPodcast}
              />
            ) : (
              <div className="text-center py-20 bg-brand-surface rounded-lg b-border">
                <h2 className="text-xl font-semibold">No Podcasts Yet</h2>
                <p className="text-brand-text-secondary mt-2">Click "Add Podcast" to get started.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {currentPodcast && (
        <Player
          key={currentPodcast.id} // Re-mount player when podcast changes
          podcast={currentPodcast}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          onProgressUpdate={updatePodcastProgress}
          onDurationUpdate={updatePodcastDuration}
          onEnded={handlePlaybackEnd}
          isPlayerExpanded={isPlayerExpanded}
          setIsPlayerExpanded={setIsPlayerExpanded}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onResetProgress={handleResetProgress}
        onDeleteAll={handleDeleteAll}
        currentTheme={theme}
        onSetTheme={setTheme}
        streakData={streakData}
        onSetStreakData={setStreakData}
        hideCompleted={hideCompleted}
        onSetHideCompleted={setHideCompleted}
      />
    </div>
  );
}
