import React, { useRef } from 'react';
import UploadIcon from './icons/UploadIcon';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onImportData: (file: File) => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  onImportData,
}) => {
  const importInputRef = useRef<HTMLInputElement>(null);

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
      className={`fixed inset-0 bg-black z-40 p-4 transition-opacity duration-500 ease-in-out flex items-center justify-center ${isOpen ? 'bg-opacity-75' : 'bg-opacity-0 pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-hidden={!isOpen}
    >
      <div 
        className={`modal-panel onboarding bg-brand-surface rounded-lg shadow-2xl w-full max-w-sm b-shadow b-border transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <div className="onboarding-header p-6 pb-4 text-center">
          <h2 id="onboarding-title" className="text-2xl font-bold text-brand-text">Welcome!</h2>
          <p className="text-brand-text-secondary mt-1">Are you new here or restoring from a backup?</p>
        </div>
        
        <div className="onboarding-content p-6 pt-2">
          <div className="space-y-4">
            <button 
                onClick={onComplete}
                className="w-full text-center p-4 rounded-md transition-colors duration-200 b-border bg-brand-primary text-brand-text-on-primary hover:bg-brand-primary-hover b-shadow b-shadow-hover"
            >
                <span className="font-semibold">Start Fresh</span>
                <p className="text-sm opacity-80 mt-1">Begin with a clean slate.</p>
            </button>
             <input
                type="file"
                accept=".json"
                ref={importInputRef}
                onChange={handleImportFileChange}
                className="hidden"
                aria-label="Import data file"
            />
            <button 
                onClick={() => importInputRef.current?.click()}
                className="w-full text-center p-4 rounded-md transition-colors duration-200 b-border bg-brand-surface-light hover:bg-brand-surface"
            >
                <span className="font-semibold inline-flex items-center gap-2">
                  <UploadIcon size={16}/>
                  Import from File
                </span>
                <p className="text-sm text-brand-text-secondary mt-1">Load your progress and settings.</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
