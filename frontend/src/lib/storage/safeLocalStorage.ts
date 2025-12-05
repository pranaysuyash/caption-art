// Safe wrapper around localStorage accesses to avoid exceptions in restricted contexts
let _localStorageWarned = false;
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      // Accessing localStorage property can throw in restricted iframes
      const storage = window.localStorage;
      if (!storage) return null;
      return storage.getItem(key);
    } catch (e) {
      if (!_localStorageWarned) {
        console.warn('localStorage.getItem() unavailable:', e);
        _localStorageWarned = true;
      }
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window === 'undefined') return;
      const storage = window.localStorage;
      if (!storage) return;
      storage.setItem(key, value);
    } catch (e) {
      if (!_localStorageWarned) {
        console.warn('localStorage.setItem() unavailable:', e);
        _localStorageWarned = true;
      }
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window === 'undefined') return;
      const storage = window.localStorage;
      if (!storage) return;
      storage.removeItem(key);
    } catch (e) {
      if (!_localStorageWarned) {
        console.warn('localStorage.removeItem() unavailable:', e);
        _localStorageWarned = true;
      }
    }
  },
  clear: (): void => {
    try {
      if (typeof window === 'undefined') return;
      const storage = window.localStorage;
      if (!storage) return;
      storage.clear();
    } catch (e) {
      if (!_localStorageWarned) {
        console.warn('localStorage.clear() unavailable:', e);
        _localStorageWarned = true;
      }
    }
  },
  get length(): number {
    try {
      if (typeof window === 'undefined') return 0;
      const storage = window.localStorage;
      if (!storage) return 0;
      return storage.length;
    } catch (e) {
      if (!_localStorageWarned) {
        console.warn('localStorage.length unavailable:', e);
        _localStorageWarned = true;
      }
      return 0;
    }
  },
  key: (index: number): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      const storage = window.localStorage;
      if (!storage) return null;
      return storage.key(index);
    } catch (e) {
      if (!_localStorageWarned) {
        console.warn('localStorage.key() unavailable:', e);
        _localStorageWarned = true;
      }
      return null;
    }
  },
  keys: (): string[] => {
    try {
      if (typeof window === 'undefined') return [];
      const storage = window.localStorage;
      if (!storage) return [];
      const list: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) list.push(key);
      }
      return list;
    } catch (e) {
      if (!_localStorageWarned) {
        console.warn('localStorage.keys() unavailable:', e);
        _localStorageWarned = true;
      }
      return [];
    }
  },
};
