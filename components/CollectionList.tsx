
import React, { useMemo } from 'react';
import type { Podcast, Collection } from '../types';
import CollectionItem from './CollectionItem';

interface CollectionListProps {
  collections: Collection[];
  podcasts: Podcast[];
  onNavigateToCollection: (id: string) => void;
  onPlayCollection: (id: string | null) => void;
  onRenameCollection: (id: string, newName: string) => void;
  onDeleteCollection: (id: string) => void;
}

const CollectionList: React.FC<CollectionListProps> = (props) => {
  const { collections, podcasts, onNavigateToCollection, onPlayCollection, onRenameCollection, onDeleteCollection } = props;
  
  const uncategorizedPodcasts = useMemo(() => {
    return podcasts.filter(p => p.collectionId === null);
  }, [podcasts]);
  
  const collectionsWithPodcastCount = useMemo(() => {
    const podcastMap = new Map<string, number>();
    podcasts.forEach(p => {
        if (p.collectionId) {
            podcastMap.set(p.collectionId, (podcastMap.get(p.collectionId) || 0) + 1);
        }
    });

    return collections
      .map(collection => ({
          ...collection,
          podcastCount: podcastMap.get(collection.id) || 0
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [collections, podcasts]);

  const uncategorizedCollection = {
      id: 'uncategorized',
      name: 'Uncategorized',
      podcastCount: uncategorizedPodcasts.length,
  };

  const allItems = [...collectionsWithPodcastCount];
  if (uncategorizedPodcasts.length > 0) {
      allItems.push(uncategorizedCollection);
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {allItems.map((collection, index) => (
            <CollectionItem
              key={collection.id}
              collection={collection}
              onNavigate={() => onNavigateToCollection(collection.id)}
              onPlay={() => onPlayCollection(collection.id === 'uncategorized' ? null : collection.id)}
              onRename={(newName) => onRenameCollection(collection.id, newName)}
              onDelete={() => onDeleteCollection(collection.id)}
              style={{ animationDelay: `${index * 50}ms` }}
            />
        ))}
    </div>
  );
};
export default CollectionList;
