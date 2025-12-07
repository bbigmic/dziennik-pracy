'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { format } from 'date-fns';
import { Briefcase, Mic, LogOut, Crown, User, Clock } from 'lucide-react';
import Calendar from '@/components/Calendar';
import DayModal from '@/components/DayModal';
import AssignedTasks from '@/components/AssignedTasks';
import FloatingAssistant from '@/components/FloatingAssistant';
import UserProfileModal from '@/components/UserProfileModal';
import TodayTasks from '@/components/TodayTasks';
import { useTasks } from '@/hooks/useTasks';
import { useAssignedTasksApi } from '@/hooks/useAssignedTasksApi';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const { data: session, status } = useSession();
  const { data, isLoaded, addTask, removeTask, updateTask } = useTasks();
  const {
    tasks: assignedTasks,
    isLoaded: assignedTasksLoaded,
    addTask: addAssignedTask,
    removeTask: removeAssignedTask,
    updateTask: updateAssignedTask,
  } = useAssignedTasksApi();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    isActive: boolean;
    isTrialing: boolean;
    trialEndsAt: string | null;
  } | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchSubscriptionStatus();
    }
  }, [session]);

  const fetchSubscriptionStatus = async () => {
    try {
      const res = await fetch('/api/subscription/status');
      if (res.ok) {
        const data = await res.json();
        setSubscriptionStatus(data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleCloseModal = () => {
    setSelectedDate(null);
  };

  const handleAddTask = async (text: string) => {
    if (selectedDate) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      try {
        await addTask(dateKey, text);
      } catch {
        // Error is handled in the hook
      }
    }
  };

  const handleRemoveTask = async (taskId: string) => {
    if (selectedDate) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      try {
        await removeTask(dateKey, taskId);
      } catch {
        // Error is handled in the hook
      }
    }
  };

  const handleUpdateTask = async (taskId: string, newText: string) => {
    if (selectedDate) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      try {
        await updateTask(dateKey, taskId, newText);
      } catch {
        // Error is handled in the hook
      }
    }
  };

  const handleMarkAsDone = async (taskId: string, taskTitle: string) => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    try {
      await addTask(todayKey, `✅ ${taskTitle}`);
      await removeAssignedTask(taskId);
    } catch {
      // Error is handled in the hook
    }
  };

  const handleAddAssignedTask = async (task: Parameters<typeof addAssignedTask>[0]) => {
    try {
      await addAssignedTask(task);
    } catch {
      // Error is handled in the hook
    }
  };

  const handleRemoveAssignedTask = async (taskId: string) => {
    try {
      await removeAssignedTask(taskId);
    } catch {
      // Error is handled in the hook
    }
  };

  const handleUpdateAssignedTask = async (taskId: string, updates: Parameters<typeof updateAssignedTask>[1]) => {
    try {
      await updateAssignedTask(taskId, updates);
    } catch {
      // Error is handled in the hook
    }
  };

  const handleVoiceTask = async (task: {
    title: string;
    description?: string;
    category: 'todo';
    priority: 'low' | 'medium' | 'high';
  }) => {
    await handleAddAssignedTask(task);
  };

  if (status === 'loading' || !isLoaded || !assignedTasksLoaded) {
    return (
      <div className="min-h-screen bg-pattern flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const daysUntilTrialEnds = subscriptionStatus?.trialEndsAt
    ? Math.ceil(
        (new Date(subscriptionStatus.trialEndsAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <main className="min-h-screen bg-pattern safe-bottom">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 mb-20">
        {/* User Menu */}
        <div className="flex justify-end gap-2 mb-4">
          {subscriptionStatus?.isTrialing && daysUntilTrialEnds !== null && (
            <Link
              href="/subscription"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm hover:bg-amber-500/30 transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Trial: </span>
              {daysUntilTrialEnds} dni
            </Link>
          )}
          <Link
            href="/subscription"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] text-sm transition-colors"
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Subskrypcja</span>
          </Link>
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] text-sm transition-colors"
          >
            <User className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="hidden sm:inline text-[var(--text-muted)]">
              {session?.user?.name || session?.user?.email}
            </span>
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-red-500/50 hover:bg-red-500/10 text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Wyloguj</span>
          </button>
        </div>

        {/* Header */}
        <header className="text-center mb-6 sm:mb-12">
          <div className="inline-flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl overflow-hidden">
              <Image
                src="/icon-source.png"
                alt="Dziennik Pracy"
                fill
                className="object-cover"
              />
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Dziennik Pracy
            </h1>
          </div>
          <p className="text-[var(--text-muted)] text-sm sm:text-lg max-w-md mx-auto px-4">
            Rejestruj swoje czynności w pracy za pomocą głosu.
            <br />
            <span className="inline-flex items-center gap-1 mt-1 sm:mt-2">
              <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Nagraj, a AI zapisze za Ciebie.
            </span>
          </p>
        </header>

        {/* Today Tasks */}
        <TodayTasks tasks={assignedTasks} />

        {/* Calendar */}
        <Calendar data={data} onDayClick={handleDayClick} />

        {/* Stats */}
        <div className="mt-6 sm:mt-12 flex justify-center px-2">
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 inline-flex gap-4 sm:gap-8">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-[var(--accent-secondary)]">
                {Object.keys(data).length}
              </p>
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">Dni z wpisami</p>
            </div>
            <div className="w-px bg-[var(--border-color)]" />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-[var(--accent-secondary)]">
                {Object.values(data).reduce(
                  (acc, day) => acc + day.tasks.length,
                  0
                )}
              </p>
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">Łącznie wpisów</p>
            </div>
          </div>
        </div>

        {/* Assigned Tasks */}
        <AssignedTasks
          tasks={assignedTasks}
          onAddTask={handleAddAssignedTask}
          onRemoveTask={handleRemoveAssignedTask}
          onUpdateTask={handleUpdateAssignedTask}
          onMarkAsDone={handleMarkAsDone}
        />
      </div>

      {/* Day Modal */}
      {selectedDate && (
        <DayModal
          date={selectedDate}
          dayEntry={data[format(selectedDate, 'yyyy-MM-dd')]}
          onClose={handleCloseModal}
          onAddTask={handleAddTask}
          onRemoveTask={handleRemoveTask}
          onUpdateTask={handleUpdateTask}
        />
      )}

      {/* Floating Assistant */}
      <FloatingAssistant onAddTask={handleVoiceTask} />

      {/* User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </main>
  );
}
