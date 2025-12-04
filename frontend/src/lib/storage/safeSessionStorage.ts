// Safe wrapper around sessionStorage to avoid exceptions in restricted contexts
let _sessionStorageWarned = false;
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return null;
      return window.sessionStorage.getItem(key);
    } catch (e) {
      if (!_sessionStorageWarned) {
        // eslint-disable-next-line no-console
        console.warn('sessionStorage.getItem() unavailable:', e);
        _sessionStorageWarned = true;
      }
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return;
      window.sessionStorage.setItem(key, value);
    } catch (e) {
      if (!_sessionStorageWarned) {
        // eslint-disable-next-line no-console
        console.warn('sessionStorage.setItem() unavailable:', e);
        _sessionStorageWarned = true;
      }
    }
  },
  removeItem: (key: string) => {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return;
      window.sessionStorage.removeItem(key);
    } catch (e) {
      if (!_sessionStorageWarned) {
        // eslint-disable-next-line no-console
        console.warn('sessionStorage.removeItem() unavailable:', e);
        _sessionStorageWarned = true;
      }
    }
  },
  clear: () => {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return;
      window.sessionStorage.clear();
    } catch (e) {
      if (!_sessionStorageWarned) {
        // eslint-disable-next-line no-console
        console.warn('sessionStorage.clear() unavailable:', e);
        _sessionStorageWarned = true;
      }
    }
  },
};
