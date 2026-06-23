import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorState = ({ message = 'Something went wrong. Please try again.', onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50/50 rounded-lg border border-red-100 max-w-md mx-auto my-4">
      <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Error Loaded</h3>
      <p className="text-sm text-gray-600 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-md transition-colors shadow-sm cursor-pointer"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
