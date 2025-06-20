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
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}></div>
      {message && (
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
};

export const LoadingCard: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <LoadingSpinner size="large" message={message} />
  </div>
);

export const LoadingRow: React.FC<{ height?: string }> = ({ height = 'h-16' }) => (
  <div className={`bg-gray-200 animate-pulse rounded ${height} mb-2`}></div>
); 