import React, { useRef } from 'react';
import type { Theme, StreakData, StreakDifficulty, CompletionSound, Collection } from '../types';
import ToggleSwitch from './ToggleSwitch';
import ImageIcon from './icons/ImageIcon';
import DownloadIcon from './icons/DownloadIcon';
import UploadIcon from './icons/UploadIcon';

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
  reviewModeEnabled: boolean;
  onSetReviewModeEnabled: (value: boolean) => void;
  customArtwork: string | null;
  onSetCustomArtwork: (artwork: string | null) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  completionSound: CompletionSound;
  onSetCompletionSound: (sound: CompletionSound) => void;
  useCollectionsView: boolean;
  onSetUseCollectionsView: (value: boolean) => void;
}

const THEMES: { id: Theme; name: string }[] = [
  { id: 'charcoal', name: 'Charcoal' },
  { id: 'minecraft', name: 'Minecraft' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'hand-drawn', name: 'Hand-drawn' },
  { id: 'brutalist', name: 'Brutalist' },
  { id: 'retro-web', name: 'Retro Web' },
];

const DIFFICULTIES: { id: StreakDifficulty, name: string, description: string }[] = [
    { id: 'easy', name: 'Easy', description: 'Listen to any audio.' },
    { id: 'normal', name: 'Normal', description: 'Complete 1 audio.' },
    { id: 'hard', name: 'Hard', description: 'Complete 2 audio files.' },
    { id: 'extreme', name: 'Extreme', description: 'Complete 3 audio files.' },
];

const SOUNDS: { id: CompletionSound; name: string }[] = [
  { id: 'none', name: 'None' },
  { id: 'minecraft', name: 'Minecraft' },
  { id: 'pokemon', name: 'Pokémon' },
  { id: 'runescape', name: 'RuneScape' },
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
  reviewModeEnabled,
  onSetReviewModeEnabled,
  customArtwork,
  onSetCustomArtwork,
  onExportData,
  onImportData,
  completionSound,
  onSetCompletionSound,
  useCollectionsView,
  onSetUseCollectionsView,
}) => {
  const artworkInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleResetClick = () => {
    if (window.confirm('Are you sure you want to reset all audio progress? This action cannot be undone.')) {
        onResetProgress();
        onClose();
    }
  };

  const handleDeleteClick = () => {
    if (window.confirm('Are you sure you want to delete all audio files and collections? This action cannot be undone.')) {
      onDeleteAll();
      onClose();
    }
  };
  
  const handleStreakToggle = () => {
      onSetStreakData(prev => ({ ...prev, enabled: !prev.enabled }));
  }
  
  const handleDifficultyChange = (difficulty: StreakDifficulty) => {
      onSetStreakData(prev => ({...prev, difficulty }));
  }

  const handleArtworkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please select an image file (e.g., JPG, PNG, GIF).');
        return;
    }

    if (file.size > 1024 * 1024) { // 1MB limit
        alert('Please select an image smaller than 1MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        if (e.target?.result) {
            onSetCustomArtwork(e.target.result as string);
        }
    };
    reader.readAsDataURL(file);

    if(event.target) {
        event.target.value = '';
    }
  };

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportData(file);
    }
    if (event.target) {
        event.target.value = '';
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-black z-40 p-4 transition-opacity duration-300 ease-in-out ${isOpen ? 'bg-opacity-75 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      aria-hidden={!isOpen}
    >
      <div 
        className={`bg-brand-surface rounded-lg shadow-2xl p-6 w-full max-w-sm b-border b-shadow mx-auto my-8 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="settings-title" className="text-xl font-bold text-brand-text">Settings</h2>
          <button onClick={onClose} aria-label="Close settings" className="text-brand-text-secondary hover:text-brand-text text-3xl leading-none">&times;</button>
        </div>
        
        <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 -mr-2">
          {/* Section: Appearance */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-text border-b border-brand-surface-light pb-2">Appearance</h3>
            <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Theme</label>
                <div className="grid grid-cols-2 gap-2">
                    {THEMES.map(theme => (
                        <button
                        key={theme.id}
                        onClick={() => onSetTheme(theme.id)}
                        className={`w-full text-center p-2 text-sm rounded-md transition-colors duration-200 b-border ${
                            currentTheme === theme.id ? 'active' : 'bg-brand-surface-light hover:bg-opacity-75'
                        }`}
                        >
                        {theme.name}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Player Artwork</label>
                <input
                type="file"
                accept="image/*"
                ref={artworkInputRef}
                onChange={handleArtworkUpload}
                className="hidden"
                aria-label="Upload custom artwork"
                />
                <div className="p-3 bg-brand-surface-light rounded-md b-border flex items-center gap-4">
                <div className="w-16 h-16 bg-brand-surface rounded-md b-border flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {customArtwork ? (
                    <img src={customArtwork} alt="Custom artwork" className="w-full h-full object-cover" />
                    ) : (
                    <div className="flex flex-col items-center text-brand-text-secondary">
                        <ImageIcon size={24} />
                    </div>
                    )}
                </div>
                <div className="flex flex-col gap-2 flex-grow">
                    <button onClick={() => artworkInputRef.current?.click()} className="w-full text-sm text-center px-3 py-2 bg-brand-surface hover:bg-opacity-75 rounded-md transition-colors duration-200 b-border">
                    {customArtwork ? 'Change' : 'Upload'}
                    </button>
                    {customArtwork && (
                    <button onClick={() => onSetCustomArtwork(null)} className="w-full text-sm text-center text-red-500 hover:bg-red-500 hover:text-white px-3 py-2 bg-brand-surface rounded-md transition-colors duration-200 b-border">
                        Remove
                    </button>
                    )}
                </div>
                </div>
            </div>
          </div>
          
          {/* Section: Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-text border-b border-brand-surface-light pb-2">Features</h3>
            <div className="flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border">
                <div>
                    <p className="font-semibold">Organize with Collections</p>
                    <p className="text-sm text-brand-text-secondary">Group audio files into folders.</p>
                </div>
                <ToggleSwitch isOn={useCollectionsView} handleToggle={() => onSetUseCollectionsView(!useCollectionsView)} />
            </div>
            <div className="flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border">
                <div>
                    <p className="font-semibold">Enable Streak</p>
                    <p className="text-sm text-brand-text-secondary">Track your daily listening activity.</p>
                </div>
                <ToggleSwitch isOn={streakData.enabled} handleToggle={handleStreakToggle} />
            </div>
            <div className={`p-3 bg-brand-surface-light rounded-md b-border transition-opacity ${!streakData.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <p className="font-semibold mb-2">Streak Difficulty</p>
                <div className="flex flex-col space-y-2 streak-difficulty-options">
                    {DIFFICULTIES.map(d => (
                        <button
                            key={d.id}
                            onClick={() => handleDifficultyChange(d.id)}
                            disabled={!streakData.enabled}
                            className={`w-full text-left px-2 py-3 rounded-md transition-colors duration-200 flex items-center justify-between text-sm b-border ${
                                streakData.difficulty === d.id ? 'active' : 'bg-brand-surface hover:bg-opacity-75'
                            }`}
                        >
                            <div>
                                <span className="font-semibold">{d.name}</span>
                                <span className="text-xs ml-2 opacity-80">{d.description}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border">
                <div>
                    <p className="font-semibold">Review Mode</p>
                    <p className="text-sm text-brand-text-secondary">Prompt to review previous lesson.</p>
                </div>
                <ToggleSwitch isOn={reviewModeEnabled} handleToggle={() => onSetReviewModeEnabled(!reviewModeEnabled)} />
            </div>
            <div className="flex items-center justify-between p-3 bg-brand-surface-light rounded-md b-border">
                <div>
                    <p className="font-semibold">Hide Completed</p>
                    <p className="text-sm text-brand-text-secondary">Remove listened items from the list.</p>
                </div>
                <ToggleSwitch isOn={hideCompleted} handleToggle={() => onSetHideCompleted(!hideCompleted)} />
            </div>
            <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Completion Sound</label>
                <select 
                    value={completionSound} 
                    onChange={(e) => onSetCompletionSound(e.target.value as CompletionSound)}
                    className="w-full p-2 bg-brand-surface-light rounded-md b-border text-brand-text"
                >
                    {SOUNDS.map(sound => (
                        <option key={sound.id} value={sound.id}>{sound.name}</option>
                    ))}
                </select>
            </div>
          </div>
          
          {/* Section: Data Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-text border-b border-brand-surface-light pb-2">Data Management</h3>
            <button 
                onClick={onExportData}
                className="w-full text-left p-3 bg-brand-surface-light hover:bg-opacity-75 rounded-md transition-colors duration-200 b-border flex items-center gap-3"
            >
                <DownloadIcon size={20} className="text-brand-text-secondary flex-shrink-0"/>
                <div>
                  <p className="font-semibold">Export All Data</p>
                  <p className="text-sm text-brand-text-secondary">Save settings and progress to a file.</p>
                </div>
            </button>
            <input
                type="file"
                accept=".json"
                ref={importInputRef}
                onChange={handleImportFileChange}
                className="hidden"
                aria-label="Import progress file"
            />
            <button 
                onClick={() => importInputRef.current?.click()}
                className="w-full text-left p-3 bg-brand-surface-light hover:bg-opacity-75 rounded-md transition-colors duration-200 b-border flex items-center gap-3"
            >
                <UploadIcon size={20} className="text-brand-text-secondary flex-shrink-0"/>
                <div>
                  <p className="font-semibold">Import Data</p>
                  <p className="text-sm text-brand-text-secondary">Load settings and progress from a file.</p>
                </div>
            </button>
          </div>
          
          {/* Section: Danger Zone */}
          <div className="space-y-4 p-4 rounded-lg border-2 border-red-500/50">
            <h3 className="text-lg font-semibold text-red-500">Danger Zone</h3>
            <button 
                onClick={handleResetClick}
                className="w-full text-left p-3 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors duration-200 b-border border-red-500/20"
            >
                <p className="font-semibold text-red-500">Reset All Progress</p>
                <p className="text-sm text-red-500/80">Mark all audio files as unplayed.</p>
            </button>
            <button 
                onClick={handleDeleteClick}
                className="w-full text-left p-3 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors duration-200 b-border border-red-500/20"
            >
                <p className="font-semibold text-red-500">Delete All Audio</p>
                <p className="text-sm text-red-500/80">Permanently remove all audio files.</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
