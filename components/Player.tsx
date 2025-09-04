import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Podcast } from '../types';
import { getPodcastFromDB } from '../lib/db';
import { formatTime } from '../lib/utils';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';

interface PlayerProps {
  podcast: Podcast;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  onProgressUpdate: (id: string, progress: number) => void;
  onDurationUpdate: (id: string, duration: number) => void;
  onEnded: () => void;
  isPlayerExpanded: boolean;
  setIsPlayerExpanded: (isExpanded: boolean) => void;
}

const Player: React.FC<PlayerProps> = ({ 
  podcast, 
  isPlaying, 
  setIsPlaying, 
  onProgressUpdate,
  onDurationUpdate, 
  onEnded,
  isPlayerExpanded,
  setIsPlayerExpanded
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(podcast.progress);
  const [audioSrc, setAudioSrc] = useState<string>('');
  
  const progressUpdateDebounceRef = useRef<number | undefined>(undefined);

  // State for swipe-to-close gesture
  const [dragState, setDragState] = useState({
    isDragging: false,
    startY: 0,
    deltaY: 0,
  });

  // Effect to load the correct audio source (URL or IndexedDB blob)
  useEffect(() => {
    let objectUrl: string | null = null;

    const loadAudio = async () => {
      if (podcast.storage === 'indexeddb') {
        const file = await getPodcastFromDB(podcast.id);
        if (file) {
          objectUrl = URL.createObjectURL(file);
          setAudioSrc(objectUrl);
        } else {
          console.error("Could not find podcast in the database.");
          // Handle error, maybe show a message to the user
        }
      } else {
        setAudioSrc(podcast.url || '');
      }
    };

    loadAudio();

    // Cleanup function to revoke the object URL on component unmount or podcast change
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [podcast.id, podcast.storage, podcast.url]);

  // Effect to sync audio element's current time with stored progress
  useEffect(() => {
    if (audioRef.current && audioSrc) {
        audioRef.current.currentTime = podcast.progress;
    }
  }, [audioSrc, podcast.progress]);

  // Effect to control play/pause state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && audio.paused) {
      audio.play().catch(e => console.error("Playback error:", e));
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [isPlaying, audioSrc]); // Depend on audioSrc to ensure it runs after source is set

  // Touch gesture handlers for expanded player
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPlayerExpanded) return;
    setDragState({
      isDragging: true,
      startY: e.touches[0].clientY,
      deltaY: 0,
    });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!dragState.isDragging || !isPlayerExpanded) return;

    const currentY = e.touches[0].clientY;
    // Allow swiping down only
    const delta = Math.max(0, currentY - dragState.startY);

    setDragState(prev => ({ ...prev, deltaY: delta }));
  };

  const handleTouchEnd = () => {
    if (!dragState.isDragging || !isPlayerExpanded) return;

    // Threshold to decide whether to close or snap back
    const threshold = window.innerHeight / 4;

    if (dragState.deltaY > threshold) {
      setIsPlayerExpanded(false);
    }

    // Reset drag state, which will cause a re-render and trigger CSS snap-back animation if not closing
    setDragState({
      isDragging: false,
      startY: 0,
      deltaY: 0,
    });
  };

  // Style for interactive swipe-down animation
  const expandedPlayerStyle: React.CSSProperties = dragState.isDragging
    ? {
        transition: 'none',
        transform: `translateY(${dragState.deltaY}px)`,
      }
    : {};


  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    
    if (progressUpdateDebounceRef.current) {
      clearTimeout(progressUpdateDebounceRef.current);
    }
    progressUpdateDebounceRef.current = window.setTimeout(() => {
       onProgressUpdate(podcast.id, audioRef.current?.currentTime || 0);
    }, 500);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const newTime = (offsetX / rect.width) * podcast.duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    onProgressUpdate(podcast.id, newTime);
  };
  
  const handleSkip = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(podcast.duration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [podcast.duration]);

  const progressPercent = podcast.duration > 0 ? (currentTime / podcast.duration) * 100 : 0;

  const sharedProgressBar = (
    <div className="w-full">
      <div 
        className="w-full bg-brand-surface rounded-full h-1.5 cursor-pointer group"
        onClick={handleSeek}
      >
        <div className="bg-brand-primary h-1.5 rounded-full group-hover:bg-brand-primary-hover" style={{ width: `${progressPercent}%` }}></div>
      </div>
      <div className="flex justify-between text-xs text-brand-text-secondary mt-1">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(podcast.duration)}</span>
      </div>
    </div>
  );

  const sharedControls = (size: 'small' | 'large') => (
    <div className={`flex items-center justify-center gap-${size === 'large' ? '4 sm:gap-8' : '2'}`}>
      <button onClick={() => handleSkip(-5)} className="text-brand-text-secondary hover:text-brand-text p-2 rounded-full text-sm">
          -5s
      </button>
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className={`bg-brand-primary text-brand-bg rounded-full hover:bg-brand-primary-hover transition-transform transform hover:scale-105 ${size === 'large' ? 'p-5' : 'p-3'}`}
      >
      {isPlaying ? <PauseIcon size={size === 'large' ? 32 : 16} /> : <PlayIcon size={size === 'large' ? 32 : 16} />}
      </button>
      <button onClick={() => handleSkip(5)} className="text-brand-text-secondary hover:text-brand-text p-2 rounded-full text-sm">
          +5s
      </button>
    </div>
  );
  
  return (
    <>
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onEnded}
        onLoadedData={() => {
            if (audioRef.current) {
                audioRef.current.currentTime = podcast.progress;
                setCurrentTime(podcast.progress);
                if (podcast.duration === 0 && audioRef.current.duration) {
                  onDurationUpdate(podcast.id, audioRef.current.duration);
                }
            }
        }}
        preload="metadata"
      />
      {/* Player Wrapper */}
      <div 
        className={`fixed left-0 right-0 z-20 transition-all duration-500 ease-in-out ${isPlayerExpanded ? 'bottom-0 top-0' : 'bottom-0'}`}
      >
        {/* Expanded Player */}
        <div 
          className={`absolute inset-0 bg-brand-bg flex flex-col p-4 sm:p-8 transition-transform duration-300 ease-in-out ${isPlayerExpanded ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`}
          style={expandedPlayerStyle}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div className="flex-shrink-0">
            <button onClick={() => setIsPlayerExpanded(false)} className="text-brand-text-secondary hover:text-brand-text">
              <ChevronDownIcon size={32} />
            </button>
          </div>
          <div className="flex-grow flex flex-col items-center justify-center text-center gap-6 sm:gap-8">
            <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 bg-brand-surface rounded-lg shadow-2xl overflow-hidden">
              <img
                src="https://www.visithasselt.be/sites/visithasselt/files/styles/teaser_cover/public/2025-02/iedereen-verdient-vakantie.jpg.jpg?h=38395a2e&itok=iRMrimgV"
                alt={`Artwork for ${podcast.name}`}
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-brand-text">{podcast.name}</h2>
            <div className="w-full max-w-md px-4 sm:px-0">
              {sharedProgressBar}
            </div>
             {sharedControls('large')}
          </div>
        </div>

        {/* Mini Player */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-brand-surface-light p-4 shadow-2xl border-t border-brand-surface transition-transform duration-500 ease-in-out cursor-pointer ${isPlayerExpanded ? 'translate-y-full' : 'translate-y-0'}`}
          onClick={() => setIsPlayerExpanded(true)}
        >
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className="flex-shrink-0">
              <button onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }} className="text-brand-text">
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
            </div>
            <div className="flex-grow min-w-0">
              <p className="font-bold text-brand-text truncate">{podcast.name}</p>
              <div className="w-full bg-gray-600 rounded-full h-1 mt-1">
                <div className="bg-brand-primary h-1 rounded-full" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
             <div className="flex-shrink-0" onClick={(e) => {e.stopPropagation(); setIsPlayerExpanded(true)}}>
                <button className="text-brand-text-secondary hover:text-brand-text p-2">
                    <ChevronUpIcon size={24} />
                </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Player;