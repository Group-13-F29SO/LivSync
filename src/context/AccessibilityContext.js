'use client';

import { createContext, useState, useEffect } from 'react';

export const AccessibilityContext = createContext();

export function AccessibilityProvider({ children }) {
  const [accessibility, setAccessibility] = useState({
    highContrast: false,
    colorBlind: false,
  });
  const [mounted, setMounted] = useState(false);

  // Load accessibility preferences from localStorage on mount
  useEffect(() => {
    const savedAccessibility = localStorage.getItem('accessibility');
    
    if (savedAccessibility) {
      try {
        const settings = JSON.parse(savedAccessibility);
        setAccessibility(settings);
        applyAccessibilitySettings(settings);
      } catch (error) {
        console.error('Error loading accessibility settings:', error);
      }
    }
    
    setMounted(true);
  }, []);

  const applyAccessibilitySettings = (settings) => {
    // Apply high contrast
    if (settings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Apply colorblind mode
    if (settings.colorBlind) {
      document.documentElement.classList.add('colorblind-mode');
    } else {
      document.documentElement.classList.remove('colorblind-mode');
    }
  };

  const updateAccessibilitySetting = (setting, value) => {
    setAccessibility(prev => {
      const updated = {
        ...prev,
        [setting]: value,
      };
      
      // Save to localStorage
      localStorage.setItem('accessibility', JSON.stringify(updated));
      
      // Apply the settings
      applyAccessibilitySettings(updated);
      
      return updated;
    });
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <AccessibilityContext.Provider value={{ accessibility, updateAccessibilitySetting }}>
      {children}
    </AccessibilityContext.Provider>
  );
}
