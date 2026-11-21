import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ThemeId,
  ThemeDefinition,
  ColorMode,
  THEMES,
  loadStoredTheme,
  saveStoredTheme,
  loadStoredColorMode,
  saveStoredColorMode,
  applyThemeToDom,
} from '../types/theme';

interface ThemeContextType {
  themeId: ThemeId;
  theme: ThemeDefinition;
  setTheme: (id: ThemeId) => void;
  resetTheme: () => void;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeId: 'kurdish-gold',
  theme: THEMES['kurdish-gold'],
  setTheme: () => {},
  resetTheme: () => {},
  colorMode: 'dark',
  setColorMode: () => {},
  toggleColorMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => loadStoredTheme());
  const [colorMode, setColorModeState] = useState<ColorMode>(() => loadStoredColorMode());
  const isInitialMountRef = useRef(true);

  const setTheme = useCallback((newId: ThemeId) => {
    if (!THEMES[newId]) return;
    setThemeIdState(newId);
    saveStoredTheme(newId);
    applyThemeToDom(newId, colorMode, true);
  }, [colorMode]);

  const setColorMode = useCallback((newMode: ColorMode) => {
    setColorModeState(newMode);
    saveStoredColorMode(newMode);
    applyThemeToDom(themeId, newMode, true);
  }, [themeId]);

  const toggleColorMode = useCallback(() => {
    const nextMode: ColorMode = colorMode === 'dark' ? 'light' : 'dark';
    setColorMode(nextMode);
  }, [colorMode, setColorMode]);

  const resetTheme = useCallback(() => {
    setTheme('kurdish-gold');
  }, [setTheme]);

  // Apply CSS variables to DOM on mount (without forced reflow) and on state changes
  useEffect(() => {
    const shouldDisableTransitions = !isInitialMountRef.current;
    isInitialMountRef.current = false;
    applyThemeToDom(themeId, colorMode, shouldDisableTransitions);
  }, [themeId, colorMode]);

  const value = useMemo(
    () => ({
      themeId,
      theme: THEMES[themeId] || THEMES['kurdish-gold'],
      setTheme,
      resetTheme,
      colorMode,
      setColorMode,
      toggleColorMode,
    }),
    [themeId, setTheme, resetTheme, colorMode, setColorMode, toggleColorMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
