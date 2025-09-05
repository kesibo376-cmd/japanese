import React, { useState, useRef, useEffect } from 'react';
import type { Podcast } from '../types';
import { formatTime } from '../lib/utils';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import CheckIcon from './icons/CheckIcon';
import ThreeDotsIcon from './icons/ThreeDotsIcon';

interface PodcastItemProps {
  podcast: Podcast;
  isActive: boolean;
  isPlaying: boolean;
  onSelect: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onAnimationEnd: () => void;
  isDeleting: boolean;
  style: React.CSSProperties;
}

const PodcastItem: React.FC<PodcastItemProps> = ({ 
  podcast, 
  isActive, 
  isPlaying, 
  onSelect, 
  onDeleteRequest, 
  onToggleComplete,
  onAnimationEnd,
  isDeleting,
  style,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const isCompleted = podcast.isListened;
  const progressPercent = isCompleted ? 100 : podcast.duration > 0 ? (podcast.progress / podcast.duration) * 100 : 0;
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(prev => !prev);
  }
  
  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    setIsMenuOpen(false);
  }

  return (
    <div
      onClick={() => onSelect(podcast.id)}
      onAnimationEnd={onAnimationEnd}
      style={style}
      className={`p-4 flex items-center gap-4 border-b border-brand-surface cursor-pointer transition-all duration-200 relative transform origin-center
        ${isActive ? 'bg-brand-surface-light' : 'hover:bg-brand-surface hover:-translate-y-0.5'}
        ${isCompleted && !isActive ? 'opacity-60' : ''}
        ${isDeleting ? 'animate-shrink-out' : 'animate-slide-up-fade-in'}
      `}
    >
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
        {isCompleted && !isActive ? (
          <div className="animate-scale-in">
            <CheckIcon size={24} color="text-brand-primary" />
          </div>
        ) : isActive ? (
          isPlaying ? <PauseIcon size={24} color="text-brand-primary" /> : <PlayIcon size={24} color="text-brand-primary" />
        ) : (
           <PlayIcon size={24} color="text-brand-text-secondary" />
        )}
      </div>
      <div className="flex-grow min-w-0">
        <h3 className={`font-semibold truncate ${isActive ? 'text-brand-primary' : 'text-brand-text'}`}>{podcast.name}</h3>
        <div className="mt-2 w-full bg-brand-surface rounded-full h-1.5">
          <div
            className="bg-brand-primary h-1.5 rounded-full"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>
      <div className="flex-shrink-0 text-sm text-brand-text-secondary w-12 text-right">
        {formatTime(podcast.duration)}
      </div>
       <div className="flex-shrink-0" ref={menuRef}>
          <button onClick={handleMenuToggle} className="p-2 rounded-full hover:bg-brand-surface-light text-brand-text-secondary hover:text-brand-text">
            <ThreeDotsIcon size={20} />
          </button>
          {isMenuOpen && (
              <div className="absolute right-4 top-12 mt-1 w-48 bg-brand-surface-light rounded-md shadow-lg z-50 b-border animate-scale-in origin-top-right">
                  <ul className="py-1">
                      <li>
                          <button 
                            onClick={(e) => handleAction(e, () => onToggleComplete(podcast.id))}
                            className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-surface"
                          >
                            {isCompleted ? 'Unmark as completed' : 'Mark as completed'}
                          </button>
                      </li>
                      <li>
                           <button 
                            onClick={(e) => handleAction(e, () => onDeleteRequest(podcast.id))}
                            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-brand-surface"
                          >
                            Delete
                          </button>
                      </li>
                  </ul>
              </div>
          )}
      </div>
    </div>
  );
};

export default PodcastItem;