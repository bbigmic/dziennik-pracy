'use client';

import { useState, useEffect, useCallback } from 'react';
import { AssignedTask } from '@/types';

export function useAssignedTasksApi() {
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/assigned-tasks');
      if (!res.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await res.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching assigned tasks:', err);
      setError('Nie udało się pobrać zadań');
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (task: Omit<AssignedTask, 'id' | 'createdAt' | 'completed'>) => {
    try {
      const res = await fetch('/api/assigned-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add task');
      }

      const newTask: AssignedTask = await res.json();
      setTasks((prev) => [newTask, ...prev]);
      return newTask;
    } catch (err) {
      console.error('Error adding task:', err);
      setError(err instanceof Error ? err.message : 'Nie udało się dodać zadania');
      throw err;
    }
  };

  const removeTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/assigned-tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error('Error removing task:', err);
      setError('Nie udało się usunąć zadania');
      throw err;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<AssignedTask>) => {
    try {
      const res = await fetch(`/api/assigned-tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask: AssignedTask = await res.json();
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? updatedTask : t))
      );
      return updatedTask;
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Nie udało się zaktualizować zadania');
      throw err;
    }
  };

  return { tasks, isLoaded, error, addTask, removeTask, updateTask, refetch: fetchTasks };
}

