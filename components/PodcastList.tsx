



import React, { useRef, useEffect, useState } from 'react';
import type { Podcast, Collection } from '../types';
import PodcastItem from './PodcastItem';

interface PodcastListProps {
  podcasts: Podcast[];
  currentPodcastId: string | null;
  isPlaying: boolean;
  onSelectPodcast: (id: string) => void;
  onDeletePodcast: (id: string) => void;
  onTogglePodcastComplete: (id: string) => void;
  onMovePodcastToCollection: (podcastId: string, collectionId: string | null) => void;
  hideCompleted: boolean;
  activePlayerTime: number;
  collections: Collection[];
  useCollectionsView: boolean;
}

const PodcastList: React.FC<PodcastListProps> = (props) => {
  const { podcasts, currentPodcastId, isPlaying, onSelectPodcast, onDeletePodcast, onTogglePodcastComplete, onMovePodcastToCollection, hideCompleted, activePlayerTime, collections, useCollectionsView } = props;
  const listRef = useRef<HTMLDivElement>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Clean up deletingIds state if a podcast is removed by other means
  useEffect(() => {
    const podcastIds = new Set(podcasts.map(p => p.id));
    const newDeletingIds = new Set([...deletingIds].filter(id => podcastIds.has(id)));
    if (newDeletingIds.size !== deletingIds.size) {
      setDeletingIds(newDeletingIds);
    }
  }, [podcasts, deletingIds]);
  
  const handleDeleteRequest = (id: string) => {
    if (window.confirm(`Are you sure you want to delete this audio file?`)) {
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
      className="relative"
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
          onMoveRequest={onMovePodcastToCollection}
          collections={collections}
          isDeleting={deletingIds.has(podcast.id)}
          onAnimationEnd={() => handleAnimationEnd(podcast.id)}
          style={{ animationDelay: `${index * 30}ms` }}
          progressOverride={currentPodcastId === podcast.id ? activePlayerTime : undefined}
          useCollectionsView={useCollectionsView}
        />
      ))}
    </div>
  );
};

export default PodcastList;
