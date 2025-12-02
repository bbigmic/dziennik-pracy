'use client';

import { useState, useEffect } from 'react';
import { AssignedTask } from '@/types';

const STORAGE_KEY = 'dziennik-pracy-assigned-tasks';

export function useAssignedTasks() {
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTasks(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing stored tasks:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks, isLoaded]);

  const addTask = (task: Omit<AssignedTask, 'id' | 'createdAt' | 'completed'>) => {
    const newTask: AssignedTask = {
      ...task,
      id: crypto.randomUUID(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, newTask]);
  };

  const removeTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const updateTask = (taskId: string, updates: Partial<AssignedTask>) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, ...updates } : t))
    );
  };

  const toggleComplete = (taskId: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  return { tasks, isLoaded, addTask, removeTask, updateTask, toggleComplete };
}

