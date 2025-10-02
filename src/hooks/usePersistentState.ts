'use client';

import { useState, useEffect } from 'react';

export function usePersistentState<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(defaultValue);

  // Cargar estado inicial desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(key);
        if (saved !== null) {
          setState(JSON.parse(saved));
        }
      } catch (error) {
        console.warn(`Error loading state for key "${key}":`, error);
      }
    }
  }, [key]);

  // Guardar estado en localStorage cuando cambie
  const setPersistentState = (value: T) => {
    setState(value);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn(`Error saving state for key "${key}":`, error);
      }
    }
  };

  return [state, setPersistentState];
}



