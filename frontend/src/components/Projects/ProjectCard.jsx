import React from 'react';

export default function ProjectCard({ project, onClick }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getProgressPercentage = () => {
    if (!project.task_count || project.task_count === 0) return 0;
    return Math.round((project.done_tasks / project.task_count) * 100);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-300 transition duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition line-clamp-1">
            {project.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {project.description || 'No description'}
          </p>
        </div>
        <span
          className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
            project.status
          )}`}
        >
          {project.status === 'active' ? 'Active' : 'Archived'}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-600">Progress</span>
          <span className="text-xs font-semibold text-gray-900">
            {getProgressPercentage()}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-indigo-600 to-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{project.task_count || 0}</p>
          <p className="text-xs text-gray-600">Tasks</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{project.member_count || 0}</p>
          <p className="text-xs text-gray-600">Members</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{project.done_tasks || 0}</p>
          <p className="text-xs text-gray-600">Done</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Created {formatDate(project.created_at)}
        </span>
        <svg
          className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>
  );
}