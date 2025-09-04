import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetProgress: () => void;
  onDeleteAll: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onResetProgress, onDeleteAll }) => {
  if (!isOpen) return null;

  const handleResetClick = () => {
    onResetProgress();
    onClose();
  };

  const handleDeleteClick = () => {
    if (window.confirm('Are you sure you want to delete all podcasts? This action cannot be undone.')) {
      onDeleteAll();
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-40 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div 
        className="bg-brand-surface rounded-lg shadow-2xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="settings-title" className="text-xl font-bold text-brand-text">Settings</h2>
          <button onClick={onClose} aria-label="Close settings" className="text-brand-text-secondary hover:text-brand-text text-3xl leading-none">&times;</button>
        </div>
        
        <div className="space-y-4">
          <button 
            onClick={handleResetClick}
            className="w-full text-left p-3 bg-brand-surface-light hover:bg-opacity-75 rounded-md transition-colors duration-200"
          >
            <p className="font-semibold">Reset Progress</p>
            <p className="text-sm text-brand-text-secondary">Mark all podcasts as unplayed and reset progress.</p>
          </button>
          
          <button 
            onClick={handleDeleteClick}
            className="w-full text-left p-3 bg-brand-surface-light hover:bg-opacity-75 rounded-md transition-colors duration-200 text-red-500"
          >
            <p className="font-semibold">Delete All Podcasts</p>
            <p className="text-sm">Permanently remove all audio files and data.</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;