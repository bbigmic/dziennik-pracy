'use client';

import { useState, useEffect, useCallback } from 'react';
import { MonthData, Task } from '@/types';

export function useTasks() {
  const [data, setData] = useState<MonthData>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const tasks = await res.json();
      setData(tasks);
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Nie udało się pobrać zadań');
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (date: string, text: string) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, text }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add task');
      }

      const newTask: Task = await res.json();
      
      setData((prev) => {
        const dayEntry = prev[date] || { date, tasks: [] };
        return {
          ...prev,
          [date]: {
            ...dayEntry,
            tasks: [...dayEntry.tasks, newTask],
          },
        };
      });
      
      return newTask;
    } catch (err) {
      console.error('Error adding task:', err);
      setError(err instanceof Error ? err.message : 'Nie udało się dodać zadania');
      throw err;
    }
  };

  const removeTask = async (date: string, taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete task');
      }

      setData((prev) => {
        const dayEntry = prev[date];
        if (!dayEntry) return prev;
        return {
          ...prev,
          [date]: {
            ...dayEntry,
            tasks: dayEntry.tasks.filter((t) => t.id !== taskId),
          },
        };
      });
    } catch (err) {
      console.error('Error removing task:', err);
      setError('Nie udało się usunąć zadania');
      throw err;
    }
  };

  const updateTask = async (date: string, taskId: string, newText: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText }),
      });

      if (!res.ok) {
        throw new Error('Failed to update task');
      }

      setData((prev) => {
        const dayEntry = prev[date];
        if (!dayEntry) return prev;
        return {
          ...prev,
          [date]: {
            ...dayEntry,
            tasks: dayEntry.tasks.map((t) =>
              t.id === taskId ? { ...t, text: newText } : t
            ),
          },
        };
      });
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Nie udało się zaktualizować zadania');
      throw err;
    }
  };

  return { data, isLoaded, error, addTask, removeTask, updateTask, refetch: fetchTasks };
}

