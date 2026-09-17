// Safe, fault-tolerant proxy for localStorage that falls back to in-memory storage if blocked by sandboxed iframes.
const getLocalStorage = (): Storage | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Perform a strict read/write check to ensure it doesn't throw a SecurityError
      const testKey = '__safe_storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    }
  } catch (e) {
    console.warn('localStorage is restricted or blocked in this environment. Falling back to in-memory state.', e);
  }
  return null;
};

const memoryStore: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    const ls = getLocalStorage();
    if (ls) {
      try {
        return ls.getItem(key);
      } catch (err) {
        // Fallback below
      }
    }
    return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
  },

  setItem(key: string, value: string): void {
    const ls = getLocalStorage();
    if (ls) {
      try {
        ls.setItem(key, value);
        return;
      } catch (err) {
        // Fallback below
      }
    }
    memoryStore[key] = String(value);
  },

  removeItem(key: string): void {
    const ls = getLocalStorage();
    if (ls) {
      try {
        ls.removeItem(key);
        return;
      } catch (err) {
        // Fallback below
      }
    }
    delete memoryStore[key];
  },

  clear(): void {
    const ls = getLocalStorage();
    if (ls) {
      try {
        ls.clear();
        return;
      } catch (err) {
        // Fallback below
      }
    }
    for (const key in memoryStore) {
      delete memoryStore[key];
    }
  }
};
