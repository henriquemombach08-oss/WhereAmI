import { useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from '../theme';

export default function useThemePreference() {
  const systemTheme = useColorScheme();
  const [themeOverride, setThemeOverride] = useState(null);

  const currentThemeMode = themeOverride ?? systemTheme ?? 'light';
  const isDarkMode = currentThemeMode === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setThemeOverride(isDarkMode ? 'light' : 'dark');
  };

  return {
    isDarkMode,
    theme,
    toggleTheme,
  };
}
