

import React, { useRef, useEffect, useState } from 'react';
import type { Podcast } from '../types';
import PodcastItem from './PodcastItem';

interface PodcastListProps {
  podcasts: Podcast[];
  currentPodcastId: string | null;
  isPlaying: boolean;
  onSelectPodcast: (id: string) => void;
  onDeletePodcast: (id: string) => void;
  onTogglePodcastComplete: (id: string) => void;
  hideCompleted: boolean;
}

const PodcastList: React.FC<PodcastListProps> = ({ podcasts, currentPodcastId, isPlaying, onSelectPodcast, onDeletePodcast, onTogglePodcastComplete, hideCompleted }) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;

    if (hideCompleted) {
      listElement.scrollTop = 0;
      return;
    }

    const firstUnplayedIndex = podcasts.findIndex(p => !p.isListened);
    
    if (firstUnplayedIndex !== -1) {
      const firstUnplayedNode = listElement.children[firstUnplayedIndex] as HTMLElement;
      if (firstUnplayedNode) {
        listElement.scrollTop = firstUnplayedNode.offsetTop;
      }
    } else {
      listElement.scrollTop = 0;
    }
  }, [podcasts, hideCompleted]);
  
  // Clean up deletingIds state if a podcast is removed by other means
  useEffect(() => {
    const podcastIds = new Set(podcasts.map(p => p.id));
    const newDeletingIds = new Set([...deletingIds].filter(id => podcastIds.has(id)));
    if (newDeletingIds.size !== deletingIds.size) {
      setDeletingIds(newDeletingIds);
    }
  }, [podcasts, deletingIds]);
  
  const handleDeleteRequest = (id: string) => {
    if (window.confirm(`Are you sure you want to delete this podcast?`)) {
      setDeletingIds(prev => new Set(prev).add(id));
    }
  };

  const handleAnimationEnd = (id: string) => {
    if (deletingIds.has(id)) {
      onDeletePodcast(id);
    }
  };

  return (
    <div 
      ref={listRef}
      className="relative bg-brand-surface rounded-lg overflow-hidden shadow-lg b-border b-shadow max-h-[60vh] overflow-y-auto"
      style={{ scrollBehavior: 'smooth' }}
    >
      {podcasts.map((podcast, index) => (
        <PodcastItem
          key={podcast.id}
          podcast={podcast}
          isActive={currentPodcastId === podcast.id}
          isPlaying={isPlaying && currentPodcastId === podcast.id}
          onSelect={onSelectPodcast}
          onDeleteRequest={handleDeleteRequest}
          onToggleComplete={onTogglePodcastComplete}
          isDeleting={deletingIds.has(podcast.id)}
          onAnimationEnd={() => handleAnimationEnd(podcast.id)}
          style={{ animationDelay: `${index * 30}ms` }}
        />
      ))}
    </div>
  );
};

export default PodcastList;