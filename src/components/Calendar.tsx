'use client';

import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MonthData } from '@/types';

interface CalendarProps {
  data: MonthData;
  onDayClick: (date: Date) => void;
}

export default function Calendar({ data, onDayClick }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDaysFull = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];
  const weekDaysShort = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

  const getTaskCount = (date: Date): number => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return data[dateKey]?.tasks.length || 0;
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-1 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-8">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] 
                     hover:border-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)] transition-all
                     active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h2 className="text-xl sm:text-3xl font-bold tracking-tight capitalize">
          {format(currentMonth, 'LLLL yyyy', { locale: pl })}
        </h2>

        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] 
                     hover:border-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)] transition-all
                     active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 sm:gap-3 mb-1 sm:mb-3">
        {weekDaysFull.map((day, idx) => (
          <div
            key={day}
            className="text-center text-xs sm:text-sm font-semibold text-[var(--text-muted)] py-1 sm:py-2"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{weekDaysShort[idx]}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-3">
        {days.map((day, idx) => {
          const taskCount = getTaskCount(day);
          const isToday = isSameDay(day, today);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={idx}
              onClick={() => onDayClick(day)}
              className={`
                calendar-day
                ${isToday ? 'today' : ''}
                ${taskCount > 0 ? 'has-tasks' : ''}
                ${!isCurrentMonth ? 'other-month' : ''}
                active:scale-95
              `}
            >
              <span
                className={`
                text-sm sm:text-lg font-semibold
                ${isToday ? 'text-[var(--accent-secondary)]' : ''}
              `}
              >
                {format(day, 'd')}
              </span>

              {taskCount > 0 && (
                <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--accent-primary)]" />
                  <span className="text-[10px] sm:text-xs text-[var(--text-muted)] hidden xs:inline">
                    {taskCount}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4 sm:mt-8 text-xs sm:text-sm text-[var(--text-muted)]">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-[var(--accent-primary)]" />
          <span>Dziś</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[var(--accent-primary)]" />
          <span>Ma wpisy</span>
        </div>
      </div>
    </div>
  );
}
