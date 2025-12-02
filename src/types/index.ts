export interface Task {
  id: string;
  text: string;
  createdAt: string;
}

export interface DayEntry {
  date: string; // format: YYYY-MM-DD
  tasks: Task[];
}

export interface MonthData {
  [date: string]: DayEntry;
}

export interface AssignedTask {
  id: string;
  title: string;
  description?: string;
  category: 'responsibility' | 'todo';
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  deadline?: string; // format: YYYY-MM-DD
  deadlineTime?: string; // format: HH:mm (optional)
  createdAt: string;
}

