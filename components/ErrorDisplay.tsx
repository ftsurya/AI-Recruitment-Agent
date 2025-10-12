import React from 'react';
import { XIcon, ExclamationTriangleIcon } from './icons';

interface ErrorDisplayProps {
  message: string;
  onDismiss: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onDismiss }) => {
  return (
    <div 
      className="fixed top-5 left-1/2 -translate-x-1/2 w-11/12 max-w-2xl bg-red-900/80 backdrop-blur-sm border border-red-600 text-white p-4 rounded-lg shadow-2xl z-50 flex items-start gap-4 animate-fade-in"
      role="alert"
    >
      <div className="flex-shrink-0 pt-0.5">
        <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
      </div>
      <div className="flex-grow">
        <h3 className="font-bold text-red-300">An Error Occurred</h3>
        <p className="text-sm text-red-200">{message}</p>
      </div>
      <div className="flex-shrink-0">
        <button onClick={onDismiss} aria-label="Dismiss error message" className="p-1 rounded-full hover:bg-white/10 transition-colors">
          <XIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ErrorDisplay;