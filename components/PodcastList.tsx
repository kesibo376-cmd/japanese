
import React, { useRef, useEffect } from 'react';
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

  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;

    // When "Hide Completed" is on, the list is filtered, so we always start from the top.
    if (hideCompleted) {
      listElement.scrollTop = 0;
      return;
    }

    // When completed items are visible, find the first one that hasn't been listened to.
    const firstUnplayedIndex = podcasts.findIndex(p => !p.isListened);
    
    // If we found an unplayed podcast, scroll to it.
    if (firstUnplayedIndex !== -1) {
      const firstUnplayedNode = listElement.children[firstUnplayedIndex] as HTMLElement;
      // The `relative` class on the container ensures `offsetTop` is calculated correctly.
      if (firstUnplayedNode) {
        listElement.scrollTop = firstUnplayedNode.offsetTop;
      }
    } else {
      // If all podcasts are completed, scroll to the top to show the full list.
      listElement.scrollTop = 0;
    }
  }, [podcasts, hideCompleted]); // Depend on podcasts array directly for robustness.

  return (
    <div 
      ref={listRef}
      className="relative bg-brand-surface rounded-lg overflow-hidden shadow-lg b-border b-shadow max-h-[60vh] overflow-y-auto"
      // Using smooth scrolling for a better user experience when the view auto-scrolls.
      style={{ scrollBehavior: 'smooth' }}
    >
      {podcasts.map((podcast) => (
        <PodcastItem
          key={podcast.id}
          podcast={podcast}
          isActive={currentPodcastId === podcast.id}
          isPlaying={isPlaying && currentPodcastId === podcast.id}
          onSelect={onSelectPodcast}
          onDelete={onDeletePodcast}
          onToggleComplete={onTogglePodcastComplete}
        />
      ))}
    </div>
  );
};

export default PodcastList;