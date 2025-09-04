import React from 'react';

interface ReviewModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  podcastName: string;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onConfirm, onCancel, podcastName }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-title"
    >
      <div 
        className="bg-brand-surface rounded-lg shadow-2xl p-6 w-full max-w-sm b-border b-shadow mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="review-title" className="text-xl font-bold text-brand-text mb-4">Review Previous Lesson?</h2>
        <p className="text-brand-text-secondary mb-6">
          Would you like to quickly review "{podcastName}" before starting the next one?
        </p>
        <div className="flex justify-end gap-4">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-md bg-brand-surface-light text-brand-text hover:bg-opacity-75 transition-colors b-border"
          >
            Skip
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-brand-primary text-brand-text hover:bg-brand-primary-hover transition-colors b-border b-shadow b-shadow-hover"
          >
            Start Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
