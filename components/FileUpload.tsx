
import React, { useRef } from 'react';
import PlusIcon from './icons/PlusIcon';

interface FileUploadProps {
  onFileUpload: (files: FileList) => void;
  isLoading: boolean;
  compact?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading, compact = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileUpload(files);
    }
    // Reset file input to allow uploading the same file again
    if(event.target) {
        event.target.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="text-right">
      <input
        type="file"
        accept=".mp3,.m4a,.wav,.aac,audio/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
        aria-label="Upload audio files"
      />
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`flex items-center justify-center bg-brand-primary text-brand-text-on-primary rounded-full hover:bg-brand-primary-hover transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed ${compact ? 'p-2' : 'p-2 sm:py-2 sm:px-4'} b-border b-shadow b-shadow-hover transform hover:scale-105 active:scale-95`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" role="status" aria-label="Loading">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {!compact && <span className="hidden sm:inline ml-3">Processing...</span>}
          </>
        ) : (
          <>
            <PlusIcon size={20} />
            {!compact && <span className="hidden sm:inline ml-2 font-bold">Add Audio</span>}
          </>
        )}
      </button>
    </div>
  );
};

export default FileUpload;
