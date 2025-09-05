import React, { useRef } from 'react';
import type { Theme, StreakData, StreakDifficulty, CompletionSound } from '../types';
import ImageIcon from './icons/ImageIcon';
import UploadIcon from './icons/UploadIcon';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  title: string;
  onSetTitle: (title: string) => void;
  currentTheme: Theme;
  onSetTheme: (theme: Theme) => void;
  streakData: StreakData;
  onSetStreakData: React.Dispatch<React.SetStateAction<StreakData>>;
  customArtwork: string | null;
  onSetCustomArtwork: (artwork: string | null) => void;
  onImportData: (file: File) => void;
  completionSound: CompletionSound;
  onSetCompletionSound: (sound: CompletionSound) => void;
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
    { id: 'normal', name: 'Normal', description: 'Complete 1 audio daily.' },
    { id: 'hard', name: 'Hard', description: 'Complete 2 daily.' },
    { id: 'extreme', name: 'Extreme', description: 'Complete 3 daily.' },
];

const SOUNDS: { id: CompletionSound; name: string }[] = [
  { id: 'none', name: 'None' },
  { id: 'minecraft', name: 'Minecraft' },
  { id: 'pokemon', name: 'Pokémon' },
  { id: 'runescape', name: 'RuneScape' },
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  title,
  onSetTitle,
  currentTheme,
  onSetTheme,
  streakData,
  onSetStreakData,
  customArtwork,
  onSetCustomArtwork,
  onImportData,
  completionSound,
  onSetCompletionSound,
}) => {
  const artworkInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  
  const handleDifficultyChange = (difficulty: StreakDifficulty) => {
      onSetStreakData(prev => ({...prev, difficulty }));
  }

  const handleArtworkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/') && file.size <= 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (e) => onSetCustomArtwork(e.target?.result as string);
        reader.readAsDataURL(file);
    } else if (file) {
        alert('Please select an image file smaller than 1MB.');
    }
    if(event.target) event.target.value = '';
  };

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onImportData(file);
    if (event.target) event.target.value = '';
  };

  return (
    <div 
      className={`fixed inset-0 bg-black z-40 p-4 transition-opacity duration-500 ease-in-out flex items-center justify-center ${isOpen ? 'bg-opacity-75' : 'bg-opacity-0 pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-hidden={!isOpen}
    >
      <div 
        className={`modal-panel onboarding bg-brand-surface rounded-lg shadow-2xl p-6 w-full max-w-md b-shadow flex flex-col max-h-[90vh] transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <div className="text-center mb-6 flex-shrink-0">
          <h2 id="onboarding-title" className="text-2xl font-bold text-brand-text">Welcome!</h2>
          <p className="text-brand-text-secondary mt-1">Let's get you set up.</p>
        </div>
        
        <div className="space-y-6 overflow-y-auto flex-grow pr-4 -mr-4">
          {/* Section: Title */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-brand-text">1. Name Your Course</h3>
            <input
              type="text"
              value={title}
              onChange={(e) => onSetTitle(e.target.value)}
              placeholder="e.g., Japanese Listening Practice"
              className="w-full p-2 bg-brand-surface-light rounded-md b-border text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Section: Style */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-brand-text">2. Choose Your Style</h3>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => onSetTheme(theme.id)}
                  className={`w-full text-center p-2 text-sm rounded-md transition-colors duration-200 b-border ${
                    currentTheme === theme.id ? 'bg-brand-primary text-brand-text-on-primary active' : 'bg-brand-surface-light hover:bg-opacity-75'
                  }`}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Section: Customization */}
           <div className="space-y-3">
            <h3 className="text-lg font-semibold text-brand-text">3. Customize Your Player</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-2">Player Artwork</label>
                     <input type="file" accept="image/*" ref={artworkInputRef} onChange={handleArtworkUpload} className="hidden" />
                    <button onClick={() => artworkInputRef.current?.click()} className="p-3 w-full h-24 bg-brand-surface-light rounded-md b-border flex items-center justify-center gap-4 text-brand-text-secondary hover:bg-brand-surface transition-colors">
                        {customArtwork ? (
                             <img src={customArtwork} alt="Custom artwork" className="w-16 h-16 object-cover rounded-md b-border" />
                        ) : (
                            <ImageIcon size={32} />
                        )}
                        <span className="text-sm font-semibold">{customArtwork ? 'Change' : 'Upload'}</span>
                    </button>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-2">Completion Sound</label>
                    <select 
                        value={completionSound} 
                        onChange={(e) => onSetCompletionSound(e.target.value as CompletionSound)}
                        className="w-full p-2 h-24 bg-brand-surface-light rounded-md b-border text-brand-text"
                    >
                        {SOUNDS.map(sound => (
                            <option key={sound.id} value={sound.id}>{sound.name}</option>
                        ))}
                    </select>
                </div>
            </div>
          </div>

          {/* Section: Goal */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-brand-text">4. Set Your Daily Goal</h3>
            <div className="flex flex-col space-y-2">
              {DIFFICULTIES.map(d => (
                   <button
                      key={d.id}
                      onClick={() => handleDifficultyChange(d.id)}
                      className={`w-full text-left p-2 rounded-md transition-colors duration-200 flex items-center justify-between text-sm b-border ${
                          streakData.difficulty === d.id ? 'bg-brand-primary text-brand-text-on-primary active' : 'bg-brand-surface hover:bg-opacity-75'
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
          
           {/* Section: Import */}
           <div className="text-center py-2">
                <p className="text-brand-text-secondary text-sm mb-2">Already have a backup file?</p>
                <input
                    type="file"
                    accept=".json"
                    ref={importInputRef}
                    onChange={handleImportFileChange}
                    className="hidden"
                />
                <button 
                    onClick={() => importInputRef.current?.click()}
                    className="inline-flex items-center gap-2 text-sm text-brand-primary font-semibold hover:underline"
                >
                    <UploadIcon size={16}/>
                    Import From File
                </button>
            </div>
        </div>

        <div className="mt-auto pt-4 border-t border-brand-surface-light flex-shrink-0">
            <button 
                onClick={onComplete}
                className="w-full py-3 rounded-md bg-brand-primary text-brand-text-on-primary font-bold hover:bg-brand-primary-hover transition-colors b-border b-shadow b-shadow-hover transform hover:scale-105 active:scale-95"
            >
                Get Started
            </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;