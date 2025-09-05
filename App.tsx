
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Podcast, StreakData, Theme, CompletionSound, Collection } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTheme } from './hooks/useTheme';
import { useStreak } from './hooks/useStreak';
import { savePodcastToDB, clearPodcastsInDB, deletePodcastFromDB } from './lib/db';
import FileUpload from './components/FileUpload';
import CollectionList from './components/CollectionList';
import Player from './components/Player';
import StatusBar from './components/StatusBar';
import SettingsIcon from './components/icons/SettingsIcon';
import EditIcon from './components/icons/EditIcon';
import FolderIcon from './components/icons/FolderIcon';
import SettingsModal from './components/SettingsModal';
import OnboardingModal from './components/OnboardingModal';
import StreakTracker from './components/StreakTracker';
import ReviewModal from './components/ReviewModal';
import Confetti from './components/Confetti';
import CategorizeModal from './components/CategorizeModal';
import CreateCollectionModal from './components/CreateCollectionModal';
import ChevronLeftIcon from './components/icons/ChevronLeftIcon';
import PodcastList from './components/PodcastList';
import PlayIcon from './components/icons/PlayIcon';

const INITIAL_PODCASTS: Podcast[] = [];
const DEFAULT_COLLECTIONS: Collection[] = [
  { id: 'default-collection', name: 'My First Collection' }
];

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
  const [collections, setCollections] = useLocalStorage<Collection[]>('collections', DEFAULT_COLLECTIONS);
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
  const [podcastsToCategorize, setPodcastsToCategorize] = useState<Podcast[]>([]);
  const [isCategorizeModalOpen, setIsCategorizeModalOpen] = useState(false);
  const [useCollectionsView, setUseCollectionsView] = useLocalStorage<boolean>('useCollectionsView', true);
  const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<string | null>(null); // null is root, collectionId, or 'uncategorized'
  const [playOnNavigate, setPlayOnNavigate] = useLocalStorage<boolean>('playOnNavigate', true);


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
            collectionId: null,
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
    const shouldLockScroll = isPlayerExpanded || isSettingsOpen || !hasCompletedOnboarding || isCategorizeModalOpen || isCreateCollectionModalOpen;
    if (shouldLockScroll) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    // Cleanup on component unmount
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isPlayerExpanded, isSettingsOpen, hasCompletedOnboarding, isCategorizeModalOpen, isCreateCollectionModalOpen]);

  // Effect to focus the title input when editing starts
  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  const handleAssignToCollection = useCallback((podcastsToAssign: Podcast[], collectionId: string | null) => {
    setPodcasts(prev => {
        const podcastMap = new Map(prev.map(p => [p.id, p]));
        podcastsToAssign.forEach(p => {
          podcastMap.set(p.id, { ...p, collectionId });
        });
        return Array.from(podcastMap.values());
    });
    setPodcastsToCategorize([]);
    setIsCategorizeModalOpen(false);
  }, [setPodcasts]);


  const handleFileUpload = useCallback((files: FileList, contextCollectionId: string | null = null) => {
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
              collectionId: null,
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
      
      if (successfulUploads.length > 0) {
        if (!useCollectionsView) {
            handleAssignToCollection(successfulUploads, null);
        } else if (contextCollectionId) {
            const isUncategorized = contextCollectionId === 'uncategorized';
            const collection = isUncategorized ? null : collections.find(c => c.id === contextCollectionId);
            const collectionName = isUncategorized ? 'Uncategorized' : collection?.name;

            if (collectionName && window.confirm(`Add ${successfulUploads.length} new audio file(s) to "${collectionName}"?`)) {
                handleAssignToCollection(successfulUploads, isUncategorized ? null : contextCollectionId);
            } else {
                setPodcastsToCategorize(successfulUploads);
                setIsCategorizeModalOpen(true);
            }
        } else {
            setPodcastsToCategorize(successfulUploads);
            setIsCategorizeModalOpen(true);
        }
      }
      setIsLoading(false);
    });
  }, [collections, handleAssignToCollection, useCollectionsView]);
  
  const handleCreateCollection = useCallback((name: string): string => {
    const newCollection: Collection = {
      id: `coll-${Date.now()}`,
      name: name.trim(),
    };
    setCollections(prev => [...prev, newCollection]);
    return newCollection.id;
  }, [setCollections]);

  const handleRenameCollection = useCallback((id: string, newName: string) => {
    setCollections(prev => prev.map(c => c.id === id ? { ...c, name: newName.trim() } : c));
  }, [setCollections]);

  const handleDeleteCollection = useCallback((id: string) => {
    setPodcasts(prev => prev.map(p => p.collectionId === id ? { ...p, collectionId: null } : p));
    setCollections(prev => prev.filter(c => c.id !== id));
    if (currentView === id) {
      setCurrentView(null); // Go back to root if current collection is deleted
    }
  }, [setPodcasts, setCollections, currentView]);
  
  const handleMovePodcastToCollection = useCallback((podcastId: string, newCollectionId: string | null) => {
    setPodcasts(prev => prev.map(p => p.id === podcastId ? { ...p, collectionId: newCollectionId } : p));
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

  const allPodcastsSorted = useMemo(() => {
      const internalSort = (a: Podcast, b: Podcast) => {
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      };
      return [...podcasts].sort(internalSort);
  }, [podcasts]);

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
    
    // Note: Review mode logic may need adjustment with collections.
    // This implementation checks the previous podcast in the flat sorted list.
    const currentIndex = allPodcastsSorted.findIndex(p => p.id === id);
    if (currentIndex <= 0) {
      startPlayback(id);
      return;
    }

    const podcastToReview = allPodcastsSorted[currentIndex - 1];
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
  
  const handlePlayCollection = useCallback((collectionId: string | null) => {
      const podcastsInCollection = allPodcastsSorted.filter(p => p.collectionId === collectionId);
      const firstUnplayed = podcastsInCollection.find(p => !p.isListened);
      
      if (firstUnplayed) {
        startPlayback(firstUnplayed.id);
      } else {
        // If all are played, maybe play the first one? For now, do nothing.
        if (podcastsInCollection.length > 0) {
           startPlayback(podcastsInCollection[0].id)
        }
      }
    }, [allPodcastsSorted, startPlayback]);
  
  const handleNavigateToCollection = useCallback((collectionId: string) => {
    setCurrentView(collectionId);
    if (playOnNavigate) {
      handlePlayCollection(collectionId === 'uncategorized' ? null : collectionId);
    }
  }, [playOnNavigate, handlePlayCollection]);

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
        setCollections([]);
        setCurrentPodcastId(null);
        setIsPlaying(false);
        setIsPlayerExpanded(false);
        setStreakData(prev => ({...prev, completedToday: [] }));
    } catch (error) {
        console.error("Failed to delete all audio files:", error);
    }
  }, [setPodcasts, setCollections, setStreakData]);

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
      collections,
      appTitle: title,
      theme,
      streakData,
      hideCompleted,
      reviewModeEnabled,
      customArtwork,
      completionSound,
      useCollectionsView,
      playOnNavigate,
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
  }, [podcasts, collections, title, theme, streakData, hideCompleted, reviewModeEnabled, customArtwork, completionSound, useCollectionsView, playOnNavigate]);

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
            if (importedData.collections && Array.isArray(importedData.collections)) setCollections(importedData.collections);
            if (importedData.appTitle) setTitle(importedData.appTitle);
            if (importedData.theme) setTheme(importedData.theme);
            if (importedData.streakData) setStreakData(importedData.streakData);
            if (typeof importedData.hideCompleted === 'boolean') setHideCompleted(importedData.hideCompleted);
            if (typeof importedData.reviewModeEnabled === 'boolean') setReviewModeEnabled(importedData.reviewModeEnabled);
            if (importedData.customArtwork !== undefined) setCustomArtwork(importedData.customArtwork);
            if (importedData.completionSound) setCompletionSound(importedData.completionSound);
            if (typeof importedData.useCollectionsView === 'boolean') setUseCollectionsView(importedData.useCollectionsView);
            if (typeof importedData.playOnNavigate === 'boolean') setPlayOnNavigate(importedData.playOnNavigate);

            
            // Merge podcast progress intelligently
            setPodcasts(currentPodcasts => {
                const importedPodcastsMap = new Map<string, Podcast>(importedData.podcasts.map((p: Podcast) => [p.id, p]));
                
                return currentPodcasts.map(currentPodcast => {
                    const importedPodcast = importedPodcastsMap.get(currentPodcast.id);
                    if (importedPodcast) {
                        return {
                            ...currentPodcast,
                            progress: importedPodcast.progress || 0,
                            isListened: importedPodcast.isListened || false,
                            collectionId: importedPodcast.collectionId || null,
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
  }, [setPodcasts, setCollections, setTitle, setTheme, setStreakData, setHideCompleted, setReviewModeEnabled, setCustomArtwork, setCompletionSound, setUseCollectionsView, setPlayOnNavigate]);

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
  
  const handleToggleCollectionsView = (enabled: boolean) => {
    setUseCollectionsView(enabled);
    if (!enabled) {
        setCurrentView(null); // Go back to root view when disabling
    }
  };

  const currentCollection = useMemo(() => {
    if (!currentView || !useCollectionsView) return null;
    if (currentView === 'uncategorized') {
      return { id: 'uncategorized', name: 'Uncategorized' };
    }
    return collections.find(c => c.id === currentView);
  }, [currentView, collections, useCollectionsView]);
  
  const podcastsForListView = useMemo(() => {
    const list = currentView 
        ? allPodcastsSorted.filter(p => p.collectionId === (currentView === 'uncategorized' ? null : currentView))
        : allPodcastsSorted;

    if (hideCompleted) {
        return list.filter(p => !p.isListened);
    }
    const completed = list.filter(p => p.isListened);
    const inProgress = list.filter(p => !p.isListened);
    return [...inProgress, ...completed];
  }, [currentView, allPodcastsSorted, hideCompleted]);

  const firstUnplayedInView = useMemo(() => {
    if (!currentView) return null;
    return podcastsForListView.find(p => !p.isListened);
  }, [podcastsForListView, currentView]);

  const currentViewStats = useMemo(() => {
    if (!currentView) return { listenedCount: 0, totalCount: 0, percentage: 0 };
    const listenedCount = podcastsForListView.filter(p => p.isListened).length;
    const totalCount = podcastsForListView.length;
    const percentage = totalCount > 0 ? (listenedCount / totalCount) * 100 : 0;
    return { listenedCount, totalCount, percentage };
  }, [podcastsForListView, currentView]);
  
  const isRootView = useCollectionsView && currentView === null;

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
            {!currentCollection ? (
              // Root View or Simple List View Header
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
                   {useCollectionsView && (
                    <button
                        onClick={() => setIsCreateCollectionModalOpen(true)}
                        className="flex items-center justify-center bg-brand-surface text-brand-text rounded-full hover:bg-brand-surface-light transition-all duration-300 p-2 sm:py-2 sm:px-4 b-border b-shadow b-shadow-hover transform hover:scale-105 active:scale-95"
                        aria-label="Create new collection"
                      >
                        <FolderIcon size={20} />
                        <span className="hidden sm:inline ml-2 font-bold">New Collection</span>
                      </button>
                   )}
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
            ) : (
              // Collection View Header
              <div 
                className={`flex items-center gap-2 ${!showApp ? 'opacity-0' : 'animate-slide-up-fade-in'}`}
                style={{ animationDelay: '100ms' }}
              >
                <button 
                    onClick={() => setCurrentView(null)}
                    className="p-2 text-brand-text-secondary hover:text-brand-text rounded-full transition-colors duration-200"
                    aria-label="Go back to collections"
                >
                    <ChevronLeftIcon size={28} />
                </button>
                <h1 className="flex-grow text-2xl sm:text-3xl font-bold truncate">{currentCollection?.name || 'Collection'}</h1>
                <FileUpload onFileUpload={(files) => handleFileUpload(files, currentView)} isLoading={isLoading} compact />
              </div>
            )}
            
            {podcasts.length > 0 && (!useCollectionsView || currentView === null) && (
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
            {showStreakTracker && (!useCollectionsView || currentView === null) && (
              <div
                className={`mt-4 ${!showApp ? 'opacity-0' : 'animate-slide-up-fade-in'}`}
                style={{ animationDelay: '300ms' }}
              >
                <StreakTracker streakData={streakData} isTodayComplete={isTodayComplete} />
              </div>
            )}
          </div>
        </header>

        <main className="p-4 sm:p-6 md:p-8 pt-0">
          <div className="max-w-4xl mx-auto">
            {podcasts.length > 0 || collections.length > 0 ? (
                useCollectionsView ? (
                    isRootView ? (
                        <div
                          className={`${!showApp ? 'opacity-0' : 'animate-slide-up-fade-in'}`}
                          style={{ animationDelay: showStreakTracker ? '400ms' : '300ms' }}
                        >
                          <CollectionList 
                            collections={collections}
                            podcasts={podcasts}
                            onNavigateToCollection={handleNavigateToCollection}
                            onPlayCollection={handlePlayCollection}
                            onRenameCollection={handleRenameCollection}
                            onDeleteCollection={handleDeleteCollection}
                          />
                        </div>
                    ) : (
                      <>
                        {firstUnplayedInView && (
                          <div
                            className={`mb-6 ${!showApp ? 'opacity-0' : 'animate-slide-up-fade-in'}`}
                            style={{ animationDelay: '100ms' }}
                          >
                            <button
                              onClick={() => handlePlayCollection(currentView === 'uncategorized' ? null : currentView)}
                              className="w-full flex items-center justify-center gap-3 text-lg font-bold bg-brand-primary text-brand-text-on-primary rounded-lg p-4 b-border b-shadow b-shadow-hover transition-transform transform hover:scale-[1.02] active:scale-[0.98]"
                              aria-label="Continue learning this collection"
                            >
                              <PlayIcon size={24} />
                              <span>Continue Learning</span>
                            </button>
                          </div>
                        )}
                       <div 
                          className={`bg-brand-surface rounded-lg overflow-hidden shadow-lg b-border b-shadow ${!showApp ? 'opacity-0' : 'animate-slide-up-fade-in'}`}
                          style={{ animationDelay: firstUnplayedInView ? '200ms' : '100ms' }}
                      >
                          {podcastsForListView.length > 0 && (
                            <div className="p-4 border-b border-brand-surface">
                                <StatusBar 
                                    listenedCount={currentViewStats.listenedCount}
                                    totalCount={currentViewStats.totalCount}
                                    percentage={currentViewStats.percentage}
                                />
                            </div>
                          )}
                          <PodcastList
                              podcasts={podcastsForListView}
                              collections={collections}
                              currentPodcastId={currentPodcastId}
                              isPlaying={isPlaying}
                              onSelectPodcast={handleSelectPodcast}
                              onDeletePodcast={handleDeletePodcast}
                              onTogglePodcastComplete={handleToggleComplete}
                              onMovePodcastToCollection={handleMovePodcastToCollection}
                              hideCompleted={hideCompleted}
                              activePlayerTime={activePlayerTime}
                              useCollectionsView={useCollectionsView}
                          />
                      </div>
                    </>
                    )
                ) : (
                  <div 
                      className={`bg-brand-surface rounded-lg overflow-hidden shadow-lg b-border b-shadow ${!showApp ? 'opacity-0' : 'animate-slide-up-fade-in'}`}
                      style={{ animationDelay: '300ms' }}
                  >
                      <PodcastList
                          podcasts={podcastsForListView}
                          collections={collections}
                          currentPodcastId={currentPodcastId}
                          isPlaying={isPlaying}
                          onSelectPodcast={handleSelectPodcast}
                          onDeletePodcast={handleDeletePodcast}
                          onTogglePodcastComplete={handleToggleComplete}
                          onMovePodcastToCollection={handleMovePodcastToCollection}
                          hideCompleted={hideCompleted}
                          activePlayerTime={activePlayerTime}
                          useCollectionsView={useCollectionsView}
                      />
                  </div>
                )
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
        useCollectionsView={useCollectionsView}
        onSetUseCollectionsView={handleToggleCollectionsView}
        playOnNavigate={playOnNavigate}
        onSetPlayOnNavigate={setPlayOnNavigate}
      />
      
      <ReviewModal
        isOpen={reviewPrompt.show}
        onConfirm={handleConfirmReview}
        onCancel={handleCancelReview}
        podcastName={reviewPrompt.podcastToReview?.name || ''}
      />

      <CategorizeModal
        isOpen={isCategorizeModalOpen}
        onClose={() => handleAssignToCollection(podcastsToCategorize, null)}
        collections={collections}
        podcastCount={podcastsToCategorize.length}
        onCreateAndAssign={(name) => {
          const newId = handleCreateCollection(name);
          handleAssignToCollection(podcastsToCategorize, newId);
        }}
        onAssign={(collectionId) => handleAssignToCollection(podcastsToCategorize, collectionId)}
      />

      <CreateCollectionModal
        isOpen={isCreateCollectionModalOpen}
        onClose={() => setIsCreateCollectionModalOpen(false)}
        onCreate={handleCreateCollection}
      />
    </div>
  );
}
