'use client';

import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

const DEFAULT_WIDGETS = [
  { id: 'steps', order: 0, visible: true },
  { id: 'heart-rate', order: 1, visible: true },
  { id: 'calories', order: 2, visible: true },
  { id: 'hydration', order: 3, visible: true },
  { id: 'sleep', order: 4, visible: true },
  { id: 'blood-glucose', order: 5, visible: true },
  { id: 'critical-events', order: 6, visible: true },
  { id: 'manual-entry', order: 7, visible: true },
  { id: 'streaks', order: 8, visible: true },
  { id: 'summary', order: 9, visible: true },
  { id: 'articles', order: 10, visible: true },
  { id: 'appointments', order: 11, visible: true },
  { id: 'prescriptions', order: 12, visible: true },
];

export const useWidgetPreferences = () => {
  const [preferences, setPreferences, isLoading] = useLocalStorage(
    'dashboard-widget-preferences',
    DEFAULT_WIDGETS
  );

  useEffect(() => {
    if (isLoading || !Array.isArray(preferences)) {
      return;
    }

    const missingDefaults = DEFAULT_WIDGETS.filter(
      (defaultWidget) => !preferences.some((widget) => widget.id === defaultWidget.id)
    );

    if (missingDefaults.length === 0) {
      return;
    }

    const mergedPreferences = [
      ...preferences,
      ...missingDefaults.map((widget) => ({ ...widget, visible: widget.visible !== false })),
    ].map((widget, index) => ({
      ...widget,
      order: index,
    }));

    setPreferences(mergedPreferences);
  }, [isLoading, preferences, setPreferences]);

  const toggleWidgetVisibility = (widgetId) => {
    setPreferences((prev) =>
      prev.map((widget) =>
        widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget
      )
    );
  };

  const reorderWidgets = (sourceIndex, destIndex) => {
    const newPreferences = Array.from(preferences);
    const [removed] = newPreferences.splice(sourceIndex, 1);
    newPreferences.splice(destIndex, 0, removed);

    // Update order numbers
    const reordered = newPreferences.map((widget, index) => ({
      ...widget,
      order: index,
    }));

    setPreferences(reordered);
  };

  const resetToDefaults = () => {
    setPreferences(DEFAULT_WIDGETS);
  };

  const getVisibleWidgets = () => {
    return preferences.filter((w) => w.visible).sort((a, b) => a.order - b.order);
  };

  const getWidgetPreference = (widgetId) => {
    return preferences.find((w) => w.id === widgetId);
  };

  return {
    preferences,
    toggleWidgetVisibility,
    reorderWidgets,
    resetToDefaults,
    getVisibleWidgets,
    getWidgetPreference,
    isLoading,
  };
};
