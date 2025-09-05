

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Podcast, StreakData, Theme, CompletionSound } from './types';
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
import OnboardingModal from './components/OnboardingModal';
import StreakTracker from './components/StreakTracker';
import ReviewModal from './components/ReviewModal';
import Confetti from './components/Confetti';

const INITIAL_PODCASTS: Podcast[] = [];

// NOTE: As web applications cannot directly read your file system for security reasons,
// you must list the audio files you place in the `/public/audio` folder here.
// Ensure the file names here exactly match the ones in your folder.
const PRELOADED_PODCAST_URLS = [
  // Example: '/audio/my-cool-podcast.mp3',
];

const COMPLETION_SOUND_URLS: Record<Exclude<CompletionSound, 'none'>, string> = {
  minecraft: 'https://www.myinstants.com/media/sounds/levelup.mp3',
  pokemon: 'https://www.myinstants.com/media/sounds/12_3.mp3',
  runescape: 'https://www.myinstants.com/media/sounds/runescape-attack-level-up.mp3',
};


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
  const soundAudioRef = useRef<HTMLAudioElement>(null);
  const [reviewModeEnabled, setReviewModeEnabled] = useLocalStorage<boolean>('reviewModeEnabled', false);
  const [reviewPrompt, setReviewPrompt] = useState<{ show: boolean; podcastToReview: Podcast | null; podcastToPlay: Podcast | null }>({ show: false, podcastToReview: null, podcastToPlay: null });
  const [nextPodcastOnEnd, setNextPodcastOnEnd] = useState<string | null>(null);
  const [customArtwork, setCustomArtwork] = useLocalStorage<string | null>('customArtwork', null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [playbackRate, setPlaybackRate] = useLocalStorage<number>('playbackRate', 1);
  const [activePlayerTime, setActivePlayerTime] = useState(0);
  const [completionSound, setCompletionSound] = useLocalStorage<CompletionSound>('completionSound', 'none');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useLocalStorage<boolean>('hasCompletedOnboarding', false);

  // Effect for revealing animation on page load
  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 10);
    return () => clearTimeout(timer);
  }, []);

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
    const shouldLockScroll = isPlayerExpanded || isSettingsOpen || !hasCompletedOnboarding;
    if (shouldLockScroll) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    // Cleanup on component unmount
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isPlayerExpanded, isSettingsOpen, hasCompletedOnboarding]);

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
    const podcastToPlay = podcasts.find(p => p.id === id);
    if (podcastToPlay) {
      setActivePlayerTime(podcastToPlay.progress);
    }
    setCurrentPodcastId(id);
    setIsPlaying(true);
    if (!isPlayerExpanded) setIsPlayerExpanded(true);
  }, [isPlayerExpanded, podcasts]);

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
      if (isPlayerExpanded) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000); // Confetti lasts 5 seconds
      }

      if (completionSound !== 'none') {
        const soundUrl = COMPLETION_SOUND_URLS[completionSound];
        if (soundUrl && soundAudioRef.current) {
          soundAudioRef.current.src = soundUrl;
          soundAudioRef.current.play().catch(e => console.error("Error playing completion sound:", e));
        }
      }
    
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

    // When reviewing, reset progress and mark as not listened again.
    setPodcasts(prev => prev.map(p => 
        p.id === reviewId ? { ...p, progress: 0, isListened: false } : p
    ));
    // Also un-record the completion for streak tracking.
    if (streakData.enabled && streakData.difficulty !== 'easy') {
        unrecordCompletion(reviewId);
    }
    
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
        console.error("Failed to delete all audio files:", error);
    }
  }, [setPodcasts, setStreakData]);

  const handleDeletePodcast = useCallback(async (id: string) => {
    const podcastToDelete = podcasts.find(p => p.id === id);
    if (!podcastToDelete) return;

    if (podcastToDelete.storage === 'indexeddb') {
      try {
        await deletePodcastFromDB(id);
      } catch (error) {
        console.error("Failed to delete audio file from DB:", error);
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

  const handleExportData = useCallback(() => {
    const dataToExport = {
      podcasts,
      appTitle: title,
      theme,
      streakData,
      hideCompleted,
      reviewModeEnabled,
      customArtwork,
      completionSound,
    };
    
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `audio-player-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [podcasts, title, theme, streakData, hideCompleted, reviewModeEnabled, customArtwork, completionSound]);

  const handleImportData = useCallback((file: File, onSuccess?: () => void) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const result = event.target?.result;
            if (typeof result !== 'string') {
                throw new Error("File could not be read as text.");
            }
            const importedData = JSON.parse(result);

            if (!importedData.podcasts || !Array.isArray(importedData.podcasts)) {
                throw new Error("Invalid import file: 'podcasts' array is missing.");
            }
            
            // Overwrite settings and other data
            if (importedData.appTitle) setTitle(importedData.appTitle);
            if (importedData.theme) setTheme(importedData.theme);
            if (importedData.streakData) setStreakData(importedData.streakData);
            if (typeof importedData.hideCompleted === 'boolean') setHideCompleted(importedData.hideCompleted);
            if (typeof importedData.reviewModeEnabled === 'boolean') setReviewModeEnabled(importedData.reviewModeEnabled);
            if (importedData.customArtwork !== undefined) setCustomArtwork(importedData.customArtwork);
            if (importedData.completionSound) setCompletionSound(importedData.completionSound);
            
            // Merge podcast progress intelligently
            setPodcasts(currentPodcasts => {
                // FIX: Explicitly type the Map to resolve errors where properties on `importedPodcast`
                // were inaccessible because its type was inferred as `unknown`.
                const importedPodcastsMap = new Map<string, Podcast>(importedData.podcasts.map((p: Podcast) => [p.id, p]));
                
                return currentPodcasts.map(currentPodcast => {
                    const importedPodcast = importedPodcastsMap.get(currentPodcast.id);
                    if (importedPodcast) {
                        return {
                            ...currentPodcast,
                            progress: importedPodcast.progress || 0,
                            isListened: importedPodcast.isListened || false,
                        };
                    }
                    return currentPodcast;
                });
            });

            alert('Progress imported successfully!');
            onSuccess?.();

        } catch (error) {
            console.error("Failed to import data:", error);
            alert(`Error importing file: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };
    reader.onerror = () => {
        alert('Failed to read the file.');
    };
    reader.readAsText(file);
  }, [setPodcasts, setTitle, setTheme, setStreakData, setHideCompleted, setReviewModeEnabled, setCustomArtwork, setCompletionSound]);

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

  const showStreakTracker = streakData.enabled && podcasts.length > 0;
  
  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
  };
  
  const showApp = hasCompletedOnboarding && !isInitializing;

  return (
    <div className="text-brand-text min-h-screen">
      <audio ref={soundAudioRef} preload="auto" />
      {showConfetti && <Confetti count={50} theme={theme} />}

      <OnboardingModal
        isOpen={!hasCompletedOnboarding}
        onComplete={handleOnboardingComplete}
        onImportData={(file) => handleImportData(file, handleOnboardingComplete)}
      />
      
      <div className={`transition-all duration-300 ${isPlayerExpanded || !showApp ? 'opacity-0 invisible' : 'opacity-100 visible'} ${!hasCompletedOnboarding ? 'blur-sm' : ''}`}>
        <header className="p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div
              className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 ${!showApp ? 'opacity-0' : 'animate-slide-up-fade-in'}`}
              style={{ animationDelay: '100ms' }}
            >
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
                    className="p-2 text-brand-text-secondary hover:text-brand-text rounded-full transition-colors duration-200 group"
                    aria-label="Open settings"
                  >
                    <SettingsIcon size={24} />
                  </button>
              </div>
            </div>
            {podcasts.length > 0 && (
              <div
                className={`${!showApp ? 'opacity-0' : 'animate-slide-up-fade-in'}`}
                style={{ animationDelay: '200ms' }}
              >
                <StatusBar 
                  listenedCount={listenedStats.listenedCount}
                  totalCount={listenedStats.totalCount}
                  percentage={listenedStats.percentage}
                />
              </div>
            )}
          </div>
        </header>

        <main className="p-4 sm:p-6 md:p-8 pt-0">
          <div className="max-w-4xl mx-auto">
            {showStreakTracker && (
              <div
                className={`mb-6 ${!showApp ? 'opacity-0' : 'animate-slide-up-fade-in'}`}
                style={{ animationDelay: '300ms' }}
              >
                <StreakTracker streakData={streakData} isTodayComplete={isTodayComplete} />
              </div>
            )}
            {podcasts.length > 0 ? (
              <div
                className={`${!showApp ? 'opacity-0' : 'animate-slide-up-fade-in'}`}
                style={{ animationDelay: showStreakTracker ? '400ms' : '300ms' }}
              >
                <PodcastList 
                  podcasts={visiblePodcasts}
                  currentPodcastId={currentPodcastId}
                  isPlaying={isPlaying}
                  onSelectPodcast={handleSelectPodcast}
                  onDeletePodcast={handleDeletePodcast}
                  onTogglePodcastComplete={handleToggleComplete}
                  hideCompleted={hideCompleted}
                  activePlayerTime={activePlayerTime}
                />
              </div>
            ) : (
              <div
                className={`text-center py-20 bg-brand-surface rounded-lg b-border ${!showApp ? 'opacity-0' : 'animate-slide-up-fade-in'}`}
                style={{ animationDelay: '300ms' }}
              >
                <h2 className="text-xl font-semibold">No Audio Files Yet</h2>
                <p className="text-brand-text-secondary mt-2">Click "Add Audio" to get started.</p>
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
          onProgressSave={updatePodcastProgress}
          onDurationUpdate={updatePodcastDuration}
          onEnded={handlePlaybackEnd}
          isPlayerExpanded={isPlayerExpanded}
          setIsPlayerExpanded={setIsPlayerExpanded}
          artworkUrl={customArtwork}
          playbackRate={playbackRate}
          onPlaybackRateChange={setPlaybackRate}
          currentTime={activePlayerTime}
          onCurrentTimeUpdate={setActivePlayerTime}
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
        customArtwork={customArtwork}
        onSetCustomArtwork={setCustomArtwork}
        onExportData={handleExportData}
        onImportData={(file) => handleImportData(file, () => setIsSettingsOpen(false))}
        completionSound={completionSound}
        onSetCompletionSound={setCompletionSound}
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