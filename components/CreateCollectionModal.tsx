
import React, { useState, useEffect } from 'react';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => {
        const input = document.getElementById('collection-name-input');
        input?.focus();
      }, 100);
      setName('');
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-black z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out ${isOpen ? 'bg-opacity-75 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-collection-title"
      aria-hidden={!isOpen}
    >
      <div 
        className={`bg-brand-surface rounded-lg shadow-2xl p-6 w-full max-w-sm b-border b-shadow mx-auto transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="create-collection-title" className="text-xl font-bold text-brand-text mb-4">Create New Collection</h2>
        <div className="mb-6">
          <label htmlFor="collection-name-input" className="block text-sm font-medium text-brand-text-secondary mb-1">Collection Name</label>
          <input
            id="collection-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Japanese Grammar"
            className="w-full p-2 bg-brand-surface-light rounded-md b-border text-brand-text"
          />
        </div>
        <div className="flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-brand-surface-light text-brand-text hover:bg-opacity-75 transition-colors b-border transform hover:scale-105 active:scale-95"
          >
            Cancel
          </button>
          <button 
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-4 py-2 rounded-md bg-brand-primary text-brand-text-on-primary hover:bg-brand-primary-hover transition-colors b-border b-shadow b-shadow-hover transform hover:scale-105 active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};
export default CreateCollectionModal;
