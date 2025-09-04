import React from 'react';
import type { Theme, StreakData } from '../types';
import ToggleSwitch from './ToggleSwitch';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetProgress: () => void;
  onDeleteAll: () => void;
  currentTheme: Theme;
  onSetTheme: (theme: Theme) => void;
  streakData: StreakData;
  onSetStreakData: React.Dispatch<React.SetStateAction<StreakData>>;
  hideCompleted: boolean;
  onSetHideCompleted: (value: boolean) => void;
}

const THEMES: { id: Theme; name: string }[] = [
  { id: 'charcoal', name: 'Charcoal' },
  { id: 'ocean', name: 'Ocean' },
  { id: 'paper', name: 'Paper' },
  { id: 'brutalist', name: 'Brutalist' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onResetProgress,
  onDeleteAll,
  currentTheme,
  onSetTheme,
  streakData,
  onSetStreakData,
  hideCompleted,
  onSetHideCompleted,
}) => {
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
  
  const handleStreakToggle = () => {
      onSetStreakData(prev => ({ ...prev, enabled: !prev.enabled }));
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-40 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div 
        className="bg-brand-surface rounded-lg shadow-2xl p-6 w-full max-w-sm b-border b-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="settings-title" className="text-xl font-bold text-brand-text">Settings</h2>
          <button onClick={onClose} aria-label="Close settings" className="text-brand-text-secondary hover:text-brand-text text-3xl leading-none">&times;</button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-brand-text mb-3">Appearance</h3>
            <div className="space-y-2">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => onSetTheme(theme.id)}
                  className={`w-full text-left p-3 rounded-md transition-colors duration-200 flex items-center justify-between b-border ${
                    currentTheme === theme.id ? 'bg-brand-primary text-white' : 'bg-brand-surface-light hover:bg-opacity-75'
                  }`}
                >
                  <span>{theme.name}</span>
                  {currentTheme === theme.id && <span className="text-sm">Selected</span>}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-brand-text mb-3">Features</h3>
            <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border">
                    <div>
                        <p className="font-semibold">Enable Streak</p>
                        <p className="text-sm text-brand-text-secondary">Track your daily listening activity.</p>
                    </div>
                    <ToggleSwitch
                        isOn={streakData.enabled}
                        handleToggle={handleStreakToggle}
                    />
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border">
                    <div>
                        <p className="font-semibold">Hide Completed</p>
                        <p className="text-sm text-brand-text-secondary">Remove listened items from the list.</p>
                    </div>
                    <ToggleSwitch
                        isOn={hideCompleted}
                        handleToggle={() => onSetHideCompleted(!hideCompleted)}
                    />
                </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-brand-text mb-3">Data Management</h3>
            <div className="space-y-2">
              <button 
                onClick={handleResetClick}
                className="w-full text-left p-3 bg-brand-surface-light hover:bg-opacity-75 rounded-md transition-colors duration-200 b-border"
              >
                <p className="font-semibold">Reset Progress</p>
                <p className="text-sm text-brand-text-secondary">Mark all podcasts as unplayed and reset progress.</p>
              </button>
              
              <button 
                onClick={handleDeleteClick}
                className="w-full text-left p-3 bg-brand-surface-light hover:bg-opacity-75 rounded-md transition-colors duration-200 text-red-500 b-border"
              >
                <p className="font-semibold">Delete All Podcasts</p>
                <p className="text-sm">Permanently remove all audio files and data.</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;