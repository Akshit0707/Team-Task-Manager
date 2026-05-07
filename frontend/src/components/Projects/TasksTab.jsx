import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksAPI } from '../../api/index';
import CreateTaskModal from './CreateTaskModal';

export default function TasksTab({ tasks, loading, projectId, members }) {
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // ← add this
  const queryClient = useQueryClient();

  const statusUpdateMutation = useMutation({
    mutationFn: async ({ taskId, status }) => {
      await tasksAPI.updateStatus(taskId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks', projectId] });
    },
  });

  const filteredTasks = tasks.filter((task) => {
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    return true;
  });

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'In Review' },
    { value: 'done', label: 'Done' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  const statusBadgeClasses = {
    todo: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    review: 'bg-amber-100 text-amber-800',
    done: 'bg-green-100 text-green-800',
  };

  const priorityBadgeClasses = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-amber-100 text-amber-800',
    high: 'bg-red-100 text-red-800',
  };

  const priorityLabels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading tasks...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header with Create Task button */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Priorities</option>
              {priorityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ← Create Task button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Task</span>
        </button>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{task.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              </div>

              <div className="flex items-center space-x-4 ml-4">
                <select
                  value={task.status}
                  onChange={(e) =>
                    statusUpdateMutation.mutate({ taskId: task.id, status: e.target.value })
                  }
                  className={`px-2 py-1 text-xs font-medium rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${statusBadgeClasses[task.status]}`}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityBadgeClasses[task.priority]}`}>
                  {priorityLabels[task.priority]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ← Create Task Modal wired up */}
      <CreateTaskModal
        projectId={projectId}
        members={members || []}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}