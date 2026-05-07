import React, { useState, useMemo } from 'react';
import { useToast } from '../../hooks/useToast';
import TaskCard from './TaskCard';

export default function TaskList({ tasks, loading, onTaskSelect }) {
  const { showToast } = useToast();
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignee: '',
  });
  const [sortBy, setSortBy] = useState('dueDate');

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'In Review' },
    { value: 'done', label: 'Done' },
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];


  const assigneeOptions = useMemo(() => {
    const assignees = new Map();
    tasks.forEach((task) => {
      if (task.assignee_id && task.assignee_name) {
        assignees.set(task.assignee_id, task.assignee_name);
      }
    });
    return [
      { value: '', label: 'All Assignees' },
      ...Array.from(assignees.entries()).map(([id, name]) => ({
        value: id,
        label: name,
      })),
    ];
  }, [tasks]);


  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.status && task.status !== filters.status) return false;
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.assignee && task.assignee_id !== filters.assignee) return false;
      return true;
    });
  }, [tasks, filters]);

  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks];
    switch (sortBy) {
      case 'dueDate':
        return sorted.sort(
          (a, b) =>
            new Date(a.due_date || '9999-12-31') -
            new Date(b.due_date || '9999-12-31')
        );
      case 'priority':
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return sorted.sort(
          (a, b) =>
            (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)
        );
      case 'created':
        return sorted.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
      default:
        return sorted;
    }
  }, [filteredTasks, sortBy]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-gray-200 rounded-lg animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 pb-4 border-b border-gray-200">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={filters.priority}
            onChange={(e) =>
              setFilters({ ...filters, priority: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {priorityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assignee
          </label>
          <select
            value={filters.assignee}
            onChange={(e) =>
              setFilters({ ...filters, assignee: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {assigneeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="created">Recently Created</option>
          </select>
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-gray-600 font-medium">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskSelect && onTaskSelect(task)}
            />
          ))}
        </div>
      )}

      <div className="text-sm text-gray-600 text-center pt-2">
        Showing {sortedTasks.length} of {tasks.length} tasks
      </div>
    </div>
  );
}