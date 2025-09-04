
import React from 'react';
import type { Podcast } from '../types';
import PodcastItem from './PodcastItem';

interface PodcastListProps {
  podcasts: Podcast[];
  currentPodcastId: string | null;
  isPlaying: boolean;
  onSelectPodcast: (id: string) => void;
}

const PodcastList: React.FC<PodcastListProps> = ({ podcasts, currentPodcastId, isPlaying, onSelectPodcast }) => {
  return (
    <div className="bg-brand-surface rounded-lg overflow-hidden shadow-lg">
      {podcasts.map((podcast) => (
        <PodcastItem
          key={podcast.id}
          podcast={podcast}
          isActive={currentPodcastId === podcast.id}
          isPlaying={isPlaying && currentPodcastId === podcast.id}
          onSelect={onSelectPodcast}
        />
      ))}
    </div>
  );
};

export default PodcastList;
