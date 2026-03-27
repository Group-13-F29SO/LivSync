'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function DraggableWidget({
  widgetId,
  children,
  isEditMode,
  isVisible,
  onToggleVisibility,
  onDragStart,
  onDragOver,
  onDrop,
  draggingId,
  dragOverId,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(widgetId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
    onDragOver?.(widgetId);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop?.(widgetId);
  };

  if (!isVisible && !isEditMode) {
    return null;
  }

  const isBeingDragged = draggingId === widgetId;
  const isDragTarget = dragOverId === widgetId && draggingId !== widgetId;

  return (
    <div
      draggable={isEditMode}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative transition-all ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}
        ${isBeingDragged ? 'opacity-50' : ''}
        ${isDragTarget ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
        ${!isVisible && isEditMode ? 'opacity-50' : ''}
      `}
    >
      {/* Toggle visibility button - positioned inside widget on top right */}
      <button
        onClick={() => onToggleVisibility(widgetId)}
        className={`absolute top-2 right-2 p-1.5 rounded transition-all z-10 ${
          isEditMode
            ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}
        title={isVisible ? 'Hide widget' : 'Show widget'}
      >
        {isVisible ? (
          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        ) : (
          <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        )}
      </button>

      {children}
    </div>
  );
}
