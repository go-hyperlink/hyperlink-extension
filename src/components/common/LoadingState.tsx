import React from 'react';

interface LoadingStateProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({ label = 'Processing...', size = 'md' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
      <div className="relative flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-sky-400/20 border-t-sky-400 animate-spin" />
        <div className="absolute w-4 h-4 rounded-full bg-sky-400/30 blur-sm animate-pulse" />
      </div>
      <p className="text-xs font-medium text-slate-400 animate-pulse">{label}</p>
    </div>
  );
};
