'use client';

import { useState, useEffect } from 'react';
import { MonthData } from '@/types';

const STORAGE_KEY = 'dziennik-pracy-data';

export function useLocalStorage() {
  const [data, setData] = useState<MonthData>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing stored data:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isLoaded]);

  const addTask = (date: string, taskText: string) => {
    setData(prev => {
      const dayEntry = prev[date] || { date, tasks: [] };
      const newTask = {
        id: crypto.randomUUID(),
        text: taskText,
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        [date]: {
          ...dayEntry,
          tasks: [...dayEntry.tasks, newTask],
        },
      };
    });
  };

  const removeTask = (date: string, taskId: string) => {
    setData(prev => {
      const dayEntry = prev[date];
      if (!dayEntry) return prev;
      return {
        ...prev,
        [date]: {
          ...dayEntry,
          tasks: dayEntry.tasks.filter(t => t.id !== taskId),
        },
      };
    });
  };

  const updateTask = (date: string, taskId: string, newText: string) => {
    setData(prev => {
      const dayEntry = prev[date];
      if (!dayEntry) return prev;
      return {
        ...prev,
        [date]: {
          ...dayEntry,
          tasks: dayEntry.tasks.map(t =>
            t.id === taskId ? { ...t, text: newText } : t
          ),
        },
      };
    });
  };

  return { data, isLoaded, addTask, removeTask, updateTask };
}

