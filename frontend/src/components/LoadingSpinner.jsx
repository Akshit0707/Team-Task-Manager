import React from 'react';

export default function LoadingSpinner({ fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full animate-spin"></div>
        <div className="absolute inset-1 bg-white rounded-full"></div>
      </div>
      <p className="mt-4 text-gray-600 font-medium">Loading...</p>
    </div>
  );

  if (fullScreen) {
    return <div className="flex items-center justify-center h-screen bg-gray-50">{content}</div>;
  }

  return <div className="flex items-center justify-center h-96">{content}</div>;
}