import React, { useState, useRef, useEffect } from 'react';
import type { Collection } from '../types';
import ThreeDotsIcon from './icons/ThreeDotsIcon';
import FolderIcon from './icons/FolderIcon';
import PlayCircleIcon from './icons/PlayCircleIcon';

interface CollectionItemProps {
  collection: Collection & { podcastCount: number };
  onNavigate: () => void;
  onPlay: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  style: React.CSSProperties;
}

const CollectionItem: React.FC<CollectionItemProps> = (props) => {
  const { collection, onNavigate, onPlay, onRename, onDelete, style } = props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSpecialCollection = collection.id === 'uncategorized';
  
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

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    const newName = prompt('Enter new collection name:', collection.name);
    if (newName && newName.trim() && newName.trim() !== collection.name) {
      onRename(newName);
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (window.confirm(`Are you sure you want to delete the "${collection.name}" collection? Audio files will be moved to Uncategorized.`)) {
      onDelete();
    }
  }

  return (
    <div 
        className="group relative aspect-[4/5] flex flex-col items-center justify-center p-4 bg-brand-surface rounded-lg b-border b-shadow b-shadow-hover transition-transform duration-200 animate-slide-up-fade-in"
        style={style}
    >
        {/* Main click handler for navigation */}
        <div 
          className="absolute inset-0 cursor-pointer rounded-lg z-0" 
          onClick={onNavigate} 
          aria-label={`View collection ${collection.name}`}
        />

        {/* Content */}
        <div className="relative text-center flex flex-col items-center justify-center gap-2 transition-opacity duration-300 md:group-hover:opacity-0 pointer-events-none">
            <span className="absolute -top-8 text-sm font-bold text-brand-text-secondary">{collection.podcastCount} item{collection.podcastCount !== 1 ? 's' : ''}</span>
            <FolderIcon size={64} className="text-brand-text-secondary" />
            <div className="relative w-full h-14 flex items-center justify-center overflow-hidden">
                <h2 className="font-bold text-lg w-full px-2 text-center" title={collection.name}>
                    {collection.name}
                </h2>
                <div className="absolute bottom-0 left-0 w-full h-3 bg-gradient-to-t from-brand-surface to-transparent pointer-events-none" aria-hidden="true" />
            </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex-col items-center justify-center p-4 pointer-events-none hidden md:flex">
            <button
                onClick={(e) => { e.stopPropagation(); onPlay(); }}
                className="text-white z-10 transform transition-transform hover:scale-110 pointer-events-auto"
                aria-label={`Play collection ${collection.name}`}
            >
                <PlayCircleIcon size={80} />
            </button>
            <p className="absolute bottom-4 text-white font-semibold z-10">See the playlist</p>
        </div>

        {/* Three Dots Menu */}
        {!isSpecialCollection && (
            <div className="absolute top-2 right-2 z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" ref={menuRef}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(prev => !prev);
                    }}
                    className="p-2 rounded-full bg-black/50 text-white hover:bg-black/75"
                    aria-label="Collection options"
                >
                    <ThreeDotsIcon size={20} />
                </button>
                {isMenuOpen && (
                     <div className="absolute right-0 top-full mt-2 w-48 bg-brand-surface-light rounded-md shadow-lg z-50 b-border animate-scale-in origin-top-right">
                        <ul className="py-1">
                            <li><button onClick={handleRename} className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-surface">Rename</button></li>
                            <li><button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-brand-surface">Delete</button></li>
                        </ul>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};
export default CollectionItem;