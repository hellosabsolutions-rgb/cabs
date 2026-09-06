'use client';

import { Sun, Moon } from '@phosphor-icons/react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted hover:text-foreground hover:border-accent transition-all duration-200 active:scale-95"
    >
      {theme === 'light' ? (
        <Moon size={16} weight="bold" />
      ) : (
        <Sun size={16} weight="bold" />
      )}
    </button>
  );
}
