import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ title = 'No data found', message = 'There are no items to display at the moment.', actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50/55 rounded-lg border border-dashed border-gray-200 max-w-md mx-auto my-4">
      <Inbox className="w-12 h-12 text-gray-400 mb-3" />
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{message}</p>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md transition-colors shadow-sm cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
