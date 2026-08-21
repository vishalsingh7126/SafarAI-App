import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Reactive localStorage state that survives reloads and syncs across tabs.
 * The initial value is captured once so the hook stays referentially stable.
 */
export default function useLocalStorage(key, initialValue) {
  const initialRef = useRef(initialValue);

  const read = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initialRef.current : JSON.parse(raw);
    } catch {
      return initialRef.current;
    }
  }, [key]);

  const [value, setValue] = useState(read);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable (private mode / quota) — state still works in memory */
    }
  }, [key, value]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === key) setValue(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key, read]);

  return [value, setValue];
}
