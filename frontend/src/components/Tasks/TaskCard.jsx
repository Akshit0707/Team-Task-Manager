import React from 'react';

export default function TaskCard({ task, onClick }) {
  const isOverdue = () => {
    if (!task.due_date || task.status === 'done') return false;
    return new Date(task.due_date) < new Date();
  };

  const formatDate = (date) => {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-amber-100 text-amber-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in_progress':
        return 'In Progress';
      case 'review':
        return 'In Review';
      case 'done':
        return 'Done';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-indigo-300 transition duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition line-clamp-2">
            {task.title}
          </h4>
          <p className="text-sm text-gray-600 mt-1 line-clamp-1">
            {task.description}
          </p>

          {task.assignee_name && (
            <div className="flex items-center space-x-2 mt-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                {getInitials(task.assignee_name)}
              </div>
              <span className="text-xs text-gray-600">{task.assignee_name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
              task.status
            )}`}
          >
            {getStatusLabel(task.status)}
          </span>

          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getPriorityColor(
              task.priority
            )}`}
          >
            {getPriorityLabel(task.priority)}
          </span>


          <span
            className={`text-xs font-medium whitespace-nowrap ${
              isOverdue()
                ? 'text-red-600 font-semibold'
                : 'text-gray-600'
            }`}
          >
            {formatDate(task.due_date)}
            {isOverdue() && <span className="ml-1">⚠️</span>}
          </span>
        </div>
      </div>
    </div>
  );
}