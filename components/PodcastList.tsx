
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
  listenedCount: number;
  totalCount: number;
}

const PodcastList: React.FC<PodcastListProps> = ({ podcasts, currentPodcastId, isPlaying, onSelectPodcast, onDeletePodcast, onTogglePodcastComplete, hideCompleted, listenedCount, totalCount }) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;

    if (hideCompleted) {
        // When hiding completed, the list should always start from the top.
        listElement.scrollTop = 0;
        return;
    }

    const firstUnplayedIndex = podcasts.findIndex(p => !p.isListened);

    // A short timeout allows the DOM to update before we calculate offsets,
    // preventing potential race conditions with rendering.
    setTimeout(() => {
        if (firstUnplayedIndex !== -1) {
            const firstUnplayedNode = listElement.children[firstUnplayedIndex] as HTMLElement;
            if (firstUnplayedNode) {
                listElement.scrollTop = firstUnplayedNode.offsetTop;
            }
        } else {
            // If all are completed, scroll to the top to show the full list.
            listElement.scrollTop = 0;
        }
    }, 0);

  }, [hideCompleted, listenedCount, totalCount]);

  return (
    <div 
      ref={listRef}
      className="bg-brand-surface rounded-lg overflow-hidden shadow-lg b-border b-shadow max-h-[60vh] overflow-y-auto"
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