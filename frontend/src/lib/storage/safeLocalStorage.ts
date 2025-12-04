// Safe wrapper around localStorage accesses to avoid exceptions in restricted contexts
let _localStorageWarned = false;
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return window.localStorage.getItem(key);
    } catch (e) {
      // Storage access is not allowed (sandboxed iframe, extension, etc.)
      // We swallow the exception and return null so the app remains functional.
      // eslint-disable-next-line no-console
      if (!_localStorageWarned) {
        // eslint-disable-next-line no-console
        console.warn('localStorage.getItem() unavailable:', e);
        _localStorageWarned = true;
      }
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.setItem(key, value);
    } catch (e) {
      // Ignore storage errors in restricted contexts
      if (!_localStorageWarned) {
        // eslint-disable-next-line no-console
        console.warn('localStorage.setItem() unavailable:', e);
        _localStorageWarned = true;
      }
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.removeItem(key);
    } catch (e) {
      if (!_localStorageWarned) {
        // eslint-disable-next-line no-console
        console.warn('localStorage.removeItem() unavailable:', e);
        _localStorageWarned = true;
      }
    }
  },
  clear: (): void => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.clear();
    } catch (e) {
      if (!_localStorageWarned) {
        // eslint-disable-next-line no-console
        console.warn('localStorage.clear() unavailable:', e);
        _localStorageWarned = true;
      }
    }
  },
  // Return number of keys in localStorage, 0 in restricted contexts
  get length(): number {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return 0;
      return window.localStorage.length;
    } catch (e) {
      if (!_localStorageWarned) {
        // eslint-disable-next-line no-console
        console.warn('localStorage.length unavailable:', e);
        _localStorageWarned = true;
      }
      return 0;
    }
  },
  // Return the key at the given index, or null if not available
  key: (index: number): string | null => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return window.localStorage.key(index);
    } catch (e) {
      if (!_localStorageWarned) {
        // eslint-disable-next-line no-console
        console.warn('localStorage.key() unavailable:', e);
        _localStorageWarned = true;
      }
      return null;
    }
  },
  // Return all keys as an array. Safe for restricted contexts.
  keys: (): string[] => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return [];
      const list: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) list.push(key);
      }
      return list;
    } catch (e) {
      if (!_localStorageWarned) {
        // eslint-disable-next-line no-console
        console.warn('localStorage.keys() unavailable:', e);
        _localStorageWarned = true;
      }
      return [];
    }
  },
};
