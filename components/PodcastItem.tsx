import React from 'react';
import type { Podcast } from '../types';
import { formatTime } from '../lib/utils';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import CheckIcon from './icons/CheckIcon';

interface PodcastItemProps {
  podcast: Podcast;
  isActive: boolean;
  isPlaying: boolean;
  onSelect: (id: string) => void;
}

const PodcastItem: React.FC<PodcastItemProps> = ({ podcast, isActive, isPlaying, onSelect }) => {
  const isCompleted = podcast.isListened;
  const progressPercent = isCompleted ? 100 : podcast.duration > 0 ? (podcast.progress / podcast.duration) * 100 : 0;
  
  return (
    <div
      onClick={() => onSelect(podcast.id)}
      className={`p-4 flex items-center gap-4 border-b border-brand-surface cursor-pointer transition-colors duration-200 ${
        isActive ? 'bg-brand-surface-light' : 'hover:bg-brand-surface'
      } ${isCompleted && !isActive ? 'opacity-60' : ''}`}
    >
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
        {isCompleted && !isActive ? (
          <CheckIcon size={24} color="text-brand-primary" />
        ) : isActive ? (
          isPlaying ? <PauseIcon size={24} color="text-brand-primary" /> : <PlayIcon size={24} color="text-brand-primary" />
        ) : (
           <PlayIcon size={24} color="text-brand-text-secondary" />
        )}
      </div>
      <div className="flex-grow">
        <h3 className={`font-semibold ${isActive ? 'text-brand-primary' : 'text-brand-text'}`}>{podcast.name}</h3>
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
    </div>
  );
};

export default PodcastItem;