'use client';

import React from 'react';

export default function ChatMessage({ message, isUser }) {
  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex-shrink-0 flex items-center justify-center text-white text-sm font-bold">
          H
        </div>
      )}
      
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-lg max-w-xs lg:max-w-md break-words ${
            isUser
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-slate-100 text-gray-900 rounded-bl-none dark:bg-gray-800 dark:text-gray-50'
          }`}
        >
          {message.text}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {message.timestamp}
        </p>
      </div>
    </div>
  );
}
