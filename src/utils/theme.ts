import { COOKIE_KEYS, getCookie, setCookie } from './cookies';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const readThemePreference = (): ThemePreference => {
  const v = getCookie(COOKIE_KEYS.THEME);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
};

const prefersDark = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;

export const resolveTheme = (pref: ThemePreference): ResolvedTheme => (pref === 'system' ? (prefersDark() ? 'dark' : 'light') : pref);

/** Applies the theme to <html data-theme>. The palette itself lives in src/dark-theme.css (generated). */
export const applyTheme = (pref: ThemePreference): ResolvedTheme => {
  const resolved = resolveTheme(pref);
  document.documentElement.dataset.theme = resolved;
  return resolved;
};

export const persistTheme = (pref: ThemePreference): void => setCookie(COOKIE_KEYS.THEME, pref);

/** Follows OS changes while the preference is "system". Returns an unsubscribe function. */
export const watchSystemTheme = (getPref: () => ThemePreference): (() => void) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => undefined;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => { if (getPref() === 'system') applyTheme('system'); };
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
};
