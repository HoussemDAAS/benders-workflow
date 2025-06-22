import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-gray-200 border-t-secondary ${sizeClasses[size]}`}></div>
      {message && (
        <p className="mt-3 text-sm text-gray-600 font-medium">{message}</p>
      )}
    </div>
  );
};

export const LoadingCard: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="bg-white rounded-xl shadow-soft p-8 m-8">
    <LoadingSpinner size="large" message={message} />
  </div>
);

export const LoadingRow: React.FC<{ height?: string }> = ({ height = 'h-16' }) => (
  <div className={`bg-gray-200 animate-pulse rounded-lg ${height} mb-2`}></div>
);