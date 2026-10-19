import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ThemeId,
  ThemeDefinition,
  THEMES,
  loadStoredTheme,
  saveStoredTheme,
  applyThemeToDom,
} from '../types/theme';

interface ThemeContextType {
  themeId: ThemeId;
  theme: ThemeDefinition;
  setTheme: (id: ThemeId) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeId: 'kurdish-gold',
  theme: THEMES['kurdish-gold'],
  setTheme: () => {},
  resetTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => loadStoredTheme());

  const setTheme = useCallback((newId: ThemeId) => {
    if (!THEMES[newId]) return;
    setThemeIdState(newId);
    saveStoredTheme(newId);
    applyThemeToDom(newId);
  }, []);

  const resetTheme = useCallback(() => {
    setTheme('kurdish-gold');
  }, [setTheme]);

  // Apply to DOM on first mount
  useEffect(() => {
    applyThemeToDom(themeId);
  }, [themeId]);

  const value = {
    themeId,
    theme: THEMES[themeId] || THEMES['kurdish-gold'],
    setTheme,
    resetTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
