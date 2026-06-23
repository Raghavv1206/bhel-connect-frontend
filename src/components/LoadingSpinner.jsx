import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = 'blue' }) => {
  const sizeClasses = {
    small: 'w-5 h-5 border-2',
    medium: 'w-10 h-10 border-4',
    large: 'w-16 h-16 border-4',
  };

  const colorClasses = {
    blue: 'border-blue-200 border-t-blue-600',
    white: 'border-white/20 border-t-white',
    yellow: 'border-yellow-200 border-t-yellow-500',
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
        role="status"
        aria-label="loading"
      />
    </div>
  );
};

export default LoadingSpinner;
