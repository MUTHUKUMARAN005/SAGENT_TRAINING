import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = 'kindwave_theme';

export const THEMES = [
  { code: 'classic', label: 'Classic Blue' },
  { code: 'midnight', label: 'Midnight' },
  { code: 'forest', label: 'Forest' },
];

const isValidTheme = (themeCode) => THEMES.some((theme) => theme.code === themeCode);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return isValidTheme(storedTheme) ? storedTheme : 'classic';
  });

  useEffect(() => {
    const appliedTheme = isValidTheme(theme) ? theme : 'classic';
    document.documentElement.setAttribute('data-theme', appliedTheme);
    localStorage.setItem(THEME_STORAGE_KEY, appliedTheme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (nextTheme) => {
        if (isValidTheme(nextTheme)) {
          setTheme(nextTheme);
        }
      },
      themes: THEMES,
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

export default ThemeContext;
