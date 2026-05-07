import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { tasksAPI } from '../api/index';
import { useToast, useAuth } from '../hooks';

const SkeletonCard = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
    <div className="h-8 bg-gray-300 rounded w-16"></div>
  </div>
);

const SkeletonTable = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
    ))}
  </div>
);

const StatCard = ({ title, value, icon: Icon, color, loading }) => {
  if (loading) return <SkeletonCard />;

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
  };

  const iconBgClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    red: 'bg-red-100',
    amber: 'bg-amber-100',
  };

  return (
    <div className={`rounded-lg border ${colorClasses[color]} p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`${iconBgClasses[color]} rounded-lg p-3`}>
          <Icon />
        </div>
      </div>
    </div>
  );
};

const StatusBreakdown = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="h-8 bg-gray-300 rounded"></div>
      </div>
    );
  }

  const total =
    stats.byStatus.todo +
    stats.byStatus.in_progress +
    stats.byStatus.review +
    stats.byStatus.done;

  const getPercentage = (count) => {
    return total === 0 ? 0 : Math.round((count / total) * 100);
  };

  const statusColors = {
    todo: 'bg-gray-400',
    in_progress: 'bg-blue-500',
    review: 'bg-amber-500',
    done: 'bg-green-500',
  };

  const statusLabels = {
    todo: 'To Do',
    in_progress: 'In Progress',
    review: 'Review',
    done: 'Done',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Overview</h3>

      <div className="mb-6">
        <div className="flex h-3 bg-gray-200 rounded-full overflow-hidden">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div
              key={status}
              className={`${statusColors[status]}`}
              style={{ width: `${getPercentage(count)}%` }}
              title={`${statusLabels[status]}: ${count}`}
            ></div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(stats.byStatus).map(([status, count]) => (
          <div key={status} className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${statusColors[status]}`}
            ></div>
            <div>
              <p className="text-xs font-medium text-gray-600">
                {statusLabels[status]}
              </p>
              <p className="text-sm font-bold text-gray-900">{count}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TaskList = ({ tasks, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <SkeletonTable />
      </div>
    );
  }

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && dueDate;
  };

  const formatDate = (date) => {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusBadgeClasses = {
    todo: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    review: 'bg-amber-100 text-amber-800',
    done: 'bg-green-100 text-green-800',
  };

  const statusLabels = {
    todo: 'To Do',
    in_progress: 'In Progress',
    review: 'In Review',
    done: 'Done',
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Tasks</h3>
      </div>

      {tasks.length === 0 ? (
        <div className="p-6 text-center">
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
          <p className="text-gray-600 font-medium">No tasks yet</p>
          <p className="text-gray-500 text-sm mt-1">Create your first task to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.slice(0, 5).map((task) => (
                <tr
                  key={task.id}
                  className="hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => navigate('/my-tasks')}
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{task.project_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusBadgeClasses[task.status]
                      }`}
                    >
                      {statusLabels[task.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        priorityBadgeClasses[task.priority]
                      }`}
                    >
                      {priorityLabels[task.priority]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p
                      className={`text-sm font-medium ${
                        isOverdue(task.due_date)
                          ? 'text-red-600 font-semibold'
                          : 'text-gray-600'
                      }`}
                    >
                      {formatDate(task.due_date)}
                      {isOverdue(task.due_date) && (
                        <span className="ml-2 text-xs">⚠️ Overdue</span>
                      )}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default function Dashboard() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await tasksAPI.getDashboardStats();
      return response.data.data.stats;
    },
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['myTasks'],
    queryFn: async () => {
      const response = await tasksAPI.getMyTasks();
      return response.data.data.tasks;
    },
  });

  const stats = statsData || {
    totalTasks: 0,
    byStatus: { todo: 0, in_progress: 0, review: 0, done: 0 },
    overdueTasks: 0,
    myTasks: 0,
  };

  const tasks = tasksData || [];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tasks"
          value={stats.totalTasks}
          color="blue"
          loading={statsLoading}
          icon={() => (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9h6"
              />
            </svg>
          )}
        />

        <StatCard
          title="In Progress"
          value={stats.byStatus.in_progress}
          color="blue"
          loading={statsLoading}
          icon={() => (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          )}
        />

        <StatCard
          title="Done"
          value={stats.byStatus.done}
          color="green"
          loading={statsLoading}
          icon={() => (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        />

        <StatCard
          title="Overdue"
          value={stats.overdueTasks}
          color="red"
          loading={statsLoading}
          icon={() => (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StatusBreakdown stats={stats} loading={statsLoading} />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/projects')}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold rounded-lg transition duration-200"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>New Project</span>
            </button>

            <button
              onClick={() => navigate('/my-tasks')}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border-2 border-indigo-600 hover:bg-indigo-50 text-indigo-600 font-semibold rounded-lg transition duration-200"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Create Task</span>
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              👋 Welcome back!
            </p>
            <p className="text-xs text-blue-800">
              You have{' '}
              <span className="font-bold">{stats.myTasks} active tasks</span>{' '}
              assigned to you.
            </p>
          </div>
        </div>
      </div>

      <TaskList tasks={tasks} loading={tasksLoading} />
    </div>
  );
}