'use client';

import React from 'react';

export default function QuickPrompts({ onPromptSelect }) {
  const quickPrompts = [
    "Give me today's summary",
    "How many hours did I sleep last night?",
    "What is my current step count?"
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {quickPrompts.map((prompt, index) => (
        <button
          key={index}
          onClick={() => onPromptSelect(prompt)}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-50 text-sm font-medium rounded-full transition-colors duration-200"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
