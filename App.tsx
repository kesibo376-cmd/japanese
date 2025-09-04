import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Podcast, StreakData, Theme } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTheme } from './hooks/useTheme';
import { useStreak } from './hooks/useStreak';
import { savePodcastToDB, clearPodcastsInDB, deletePodcastFromDB } from './lib/db';
import FileUpload from './components/FileUpload';
import PodcastList from './components/PodcastList';
import Player from './components/Player';
import StatusBar from './components/StatusBar';
import SettingsIcon from './components/icons/SettingsIcon';
import EditIcon from './components/icons/EditIcon';
import SettingsModal from './components/SettingsModal';
import StreakTracker from './components/StreakTracker';
import ReviewModal from './components/ReviewModal';

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
  const { streakData, setStreakData, recordActivity, recordCompletion, unrecordCompletion, isTodayComplete } = useStreak();
  const [hideCompleted, setHideCompleted] = useLocalStorage<boolean>('hideCompleted', false);
  const [currentPodcastId, setCurrentPodcastId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [reviewModeEnabled, setReviewModeEnabled] = useLocalStorage<boolean>('reviewModeEnabled', false);
  const [reviewPrompt, setReviewPrompt] = useState<{ show: boolean; podcastToReview: Podcast | null; podcastToPlay: Podcast | null }>({ show: false, podcastToReview: null, podcastToPlay: null });
  const [nextPodcastOnEnd, setNextPodcastOnEnd] = useState<string | null>(null);

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
    if (streakData.enabled && streakData.difficulty === 'easy') {
      recordActivity();
    }
    setPodcasts(prev => {
      let podcastWasCompleted = false;
      const updatedPodcasts = prev.map(p => {
        if (p.id === id) {
          // If progress is within 1 second of the end, mark as listened
          const isFinished = p.duration > 0 && progress >= p.duration - 1;
          if (isFinished && !p.isListened) {
            podcastWasCompleted = true;
          }
          return { ...p, progress, isListened: p.isListened || isFinished };
        }
        return p;
      });

      if (podcastWasCompleted && streakData.enabled && streakData.difficulty !== 'easy') {
          recordCompletion(id);
      }
      return updatedPodcasts;
    });
  }, [setPodcasts, recordActivity, recordCompletion, streakData.enabled, streakData.difficulty]);

  const updatePodcastDuration = useCallback((id: string, duration: number) => {
    setPodcasts(prev =>
      prev.map(p => (p.id === id && p.duration === 0) ? { ...p, duration } : p)
    );
  }, [setPodcasts]);
  
  const startPlayback = useCallback((id: string) => {
    setCurrentPodcastId(id);
    setIsPlaying(true);
    if (!isPlayerExpanded) setIsPlayerExpanded(true);
  }, [isPlayerExpanded]);

  const visiblePodcasts = useMemo(() => {
    const internalSort = (a: Podcast, b: Podcast) => {
      const numA = parseInt(a.name, 10);
      const numB = parseInt(b.name, 10);
      if (isNaN(numA) && isNaN(numB)) return a.name.localeCompare(b.name);
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      return numA - numB;
    };

    if (hideCompleted) {
      return [...podcasts].filter(p => !p.isListened).sort(internalSort);
    }

    // When not hiding, group completed at the top, then sort each group.
    const completed = [...podcasts].filter(p => p.isListened).sort(internalSort);
    const inProgress = [...podcasts].filter(p => !p.isListened).sort(internalSort);
    
    return [...completed, ...inProgress];
  }, [podcasts, hideCompleted]);

  const handleSelectPodcast = (id: string) => {
    if (currentPodcastId === id) {
      setIsPlaying(prev => !prev);
      return;
    }

    const podcastToPlay = podcasts.find(p => p.id === id);
    if (!podcastToPlay) return;

    if (!reviewModeEnabled) {
      startPlayback(id);
      return;
    }

    const currentIndex = visiblePodcasts.findIndex(p => p.id === id);
    if (currentIndex <= 0) {
      startPlayback(id);
      return;
    }

    const podcastToReview = visiblePodcasts[currentIndex - 1];
    if (!podcastToReview.isListened) {
      startPlayback(id);
      return;
    }

    // All conditions met, show prompt
    setReviewPrompt({ show: true, podcastToReview, podcastToPlay });
  };

  const handlePlaybackEnd = () => {
      if (currentPodcastId) {
        // The check in updatePodcastProgress is more reliable, but we can ensure it's marked here too.
        setPodcasts(prev => 
            prev.map(p => p.id === currentPodcastId ? { ...p, isListened: true } : p)
        );
      }

      if (nextPodcastOnEnd) {
        startPlayback(nextPodcastOnEnd);
        setNextPodcastOnEnd(null);
      } else {
        setIsPlaying(false);
      }
  };

  const handleConfirmReview = () => {
    if (!reviewPrompt.podcastToReview || !reviewPrompt.podcastToPlay) return;
    
    const reviewId = reviewPrompt.podcastToReview.id;
    const playId = reviewPrompt.podcastToPlay.id;

    setNextPodcastOnEnd(playId);
    setPodcasts(prev => prev.map(p => 
        p.id === reviewId ? { ...p, progress: 0 } : p
    ));
    
    startPlayback(reviewId);

    setReviewPrompt({ show: false, podcastToReview: null, podcastToPlay: null });
  };

  const handleCancelReview = () => {
    if (!reviewPrompt.podcastToPlay) return;
    startPlayback(reviewPrompt.podcastToPlay.id);
    setReviewPrompt({ show: false, podcastToReview: null, podcastToPlay: null });
  };

  const handleResetProgress = useCallback(() => {
    setIsPlaying(false); // Stop playback for better UX
    setPodcasts(prev => 
        prev.map(p => ({ ...p, progress: 0, isListened: false }))
    );
    setStreakData(prev => ({...prev, completedToday: [] }));
  }, [setPodcasts, setStreakData]);

  const handleDeleteAll = useCallback(async () => {
    try {
        await clearPodcastsInDB();
        setPodcasts([]);
        setCurrentPodcastId(null);
        setIsPlaying(false);
        setIsPlayerExpanded(false);
        setStreakData(prev => ({...prev, completedToday: [] }));
    } catch (error) {
        console.error("Failed to delete all podcasts:", error);
    }
  }, [setPodcasts, setStreakData]);

  const handleDeletePodcast = useCallback(async (id: string) => {
    const podcastToDelete = podcasts.find(p => p.id === id);
    if (!podcastToDelete) return;

    if (podcastToDelete.storage === 'indexeddb') {
      try {
        await deletePodcastFromDB(id);
      } catch (error) {
        console.error("Failed to delete podcast from DB:", error);
      }
    }
    setPodcasts(prev => prev.filter(p => p.id !== id));
    if (streakData.enabled && streakData.difficulty !== 'easy') {
        unrecordCompletion(id);
    }
    if (currentPodcastId === id) {
        setCurrentPodcastId(null);
        setIsPlaying(false);
    }
  }, [podcasts, setPodcasts, unrecordCompletion, streakData.enabled, streakData.difficulty, currentPodcastId]);

  const handleToggleComplete = useCallback((id: string) => {
    let wasMarkedComplete: boolean | undefined;

    setPodcasts(prev => prev.map(p => {
      if (p.id === id) {
        wasMarkedComplete = !p.isListened;
        return { 
          ...p, 
          isListened: !p.isListened, 
          // When un-marking, reset progress for better UX
          progress: !p.isListened ? p.duration : 0 
        };
      }
      return p;
    }));
    
    if (streakData.enabled && streakData.difficulty !== 'easy') {
        if (wasMarkedComplete === true) {
            recordCompletion(id);
        } else if (wasMarkedComplete === false) {
            unrecordCompletion(id);
        }
    }
  }, [setPodcasts, recordCompletion, unrecordCompletion, streakData.enabled, streakData.difficulty]);

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
                <StreakTracker streakData={streakData} isTodayComplete={isTodayComplete} />
              </div>
            )}
            {podcasts.length > 0 ? (
              <PodcastList 
                podcasts={visiblePodcasts}
                currentPodcastId={currentPodcastId}
                isPlaying={isPlaying}
                onSelectPodcast={handleSelectPodcast}
                onDeletePodcast={handleDeletePodcast}
                onTogglePodcastComplete={handleToggleComplete}
                hideCompleted={hideCompleted}
                listenedCount={listenedStats.listenedCount}
                totalCount={listenedStats.totalCount}
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
        reviewModeEnabled={reviewModeEnabled}
        onSetReviewModeEnabled={setReviewModeEnabled}
      />
      
      <ReviewModal
        isOpen={reviewPrompt.show}
        onConfirm={handleConfirmReview}
        onCancel={handleCancelReview}
        podcastName={reviewPrompt.podcastToReview?.name || ''}
      />
    </div>
  );
}