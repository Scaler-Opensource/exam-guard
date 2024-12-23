import React from 'react';

const ProgressBar = ({ value = 0, className = '' }) => {
  // Ensure value is between 0 and 100
  const percentage = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full h-6 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-green-500 transition-all duration-1000 ease-in-out flex items-center justify-center text-white text-sm font-medium"
        style={{ width: `${percentage}%` }}
      >
        {percentage}%
      </div>
    </div>
  );
};

export default ProgressBar;
