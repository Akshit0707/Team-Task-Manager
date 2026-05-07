import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tasksAPI } from '../api/index';
import { useToast } from '../hooks/useToast';
import TaskCard from '../components/Tasks/TaskCard';
import TaskDetailModal from '../components/Tasks/TaskDetailModal';

export default function MyTasks() {
  const { showToast } = useToast();
  const [selectedTask, setSelectedTask] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    todo: true,
    in_progress: true,
    review: true,
    done: true,
  });

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['myTasks'],
    queryFn: async () => {
      const response = await tasksAPI.getMyTasks();
      return response.data.data.tasks;
    },
  });

  const tasks = tasksData || [];

  const toggleSection = (status) => {
    setExpandedSections((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const groupedTasks = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    review: tasks.filter((t) => t.status === 'review'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  const sectionConfig = [
    { status: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-800' },
    {
      status: 'in_progress',
      label: 'In Progress',
      color: 'bg-blue-100 text-blue-800',
    },
    {
      status: 'review',
      label: 'In Review',
      color: 'bg-amber-100 text-amber-800',
    },
    {
      status: 'done',
      label: 'Done',
      color: 'bg-green-100 text-green-800',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-flex items-center justify-center">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-1 bg-white rounded-full"></div>
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-600 mt-1">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
          <p className="text-gray-600 font-medium">No tasks assigned</p>
          <p className="text-gray-500 text-sm mt-1">
            Tasks will appear here once they're assigned to you
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sectionConfig.map(({ status, label, color }) => {
            const sectionTasks = groupedTasks[status];
            const isExpanded = expandedSections[status];

            return (
              <div key={status} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleSection(status)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center space-x-3">
                    <svg
                      className={`w-5 h-5 text-gray-600 transition-transform ${
                        isExpanded ? 'rotate-0' : '-rotate-90'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
                    >
                      {label}
                    </span>
                    <span className="text-sm font-semibold text-gray-600">
                      {sectionTasks.length}
                    </span>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
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
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 space-y-3">
                    {sectionTasks.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">
                        No tasks in this section
                      </p>
                    ) : (
                      sectionTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onClick={() => setSelectedTask(task)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <TaskDetailModal
        task={selectedTask}
        members={[]}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}