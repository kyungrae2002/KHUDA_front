import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: React.ReactNode;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-4 space-y-2">
      <div className="relative flex items-center justify-center">
        {/* Ambient pulse (Sky blue) */}
        <div className={`absolute rounded-full bg-blue-500/10 animate-ping ${sizeClasses[size]}`} />
        {/* Spinner ring (Sky blue) */}
        <div
          className={`animate-spin rounded-full border-2 border-t-blue-500 border-r-blue-500/20 border-b-slate-200 border-l-slate-200 ${sizeClasses[size]}`}
        />
      </div>
      {text && <div className="text-xs text-slate-500 animate-pulse font-medium">{text}</div>}
    </div>
  );
};

export default LoadingSpinner;
