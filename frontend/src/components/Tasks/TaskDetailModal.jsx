import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksAPI } from '../../api/index';
import { useToast } from '../../hooks/useToast';

export default function TaskDetailModal({ task, members, isOpen, onClose }) {
  // ✅ Guard: render nothing if not open or no task
  if (!isOpen || !task) return null;

  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      due_date: task.due_date?.split('T')[0] || '',
      assignee_id: task.assignee_id || '',
    },
  });

  // ✅ Reset form when task changes
  useEffect(() => {
    if (task) {
      reset({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        due_date: task.due_date?.split('T')[0] || '',
        assignee_id: task.assignee_id || '',
      });
      setIsEditing(false);
      setApiError('');
      setShowDeleteConfirm(false);
    }
  }, [task, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      await tasksAPI.update(task.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      setIsEditing(false);
      setApiError('');
      showToast('Task updated successfully!', 'success');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update task';
      setApiError(message);
      showToast(message, 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await tasksAPI.delete(task.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      showToast('Task deleted successfully!', 'success');
      onClose();
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete task';
      setApiError(message);
      showToast(message, 'error');
    },
  });

  const onSubmit = async (data) => {
    setApiError('');
    await updateMutation.mutateAsync(data);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-amber-100 text-amber-800';
      case 'done': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Task Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {apiError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">{apiError}</p>
            </div>
          )}

          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Title</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{task.title}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Description</p>
                <p className="text-gray-700 mt-1">{task.description || 'No description'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(task.status)}`}>
                    {task.status === 'todo' && 'To Do'}
                    {task.status === 'in_progress' && 'In Progress'}
                    {task.status === 'review' && 'In Review'}
                    {task.status === 'done' && 'Done'}
                    {!['todo','in_progress','review','done'].includes(task.status) && (task.status || 'Unknown')}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Priority</p>
                  {/* ✅ Guard against null priority */}
                  <p className="text-gray-900 mt-1 capitalize">{task.priority || 'None'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Due Date</p>
                  <p className="text-gray-900 mt-1">{formatDate(task.due_date)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600">Assignee</p>
                  <p className="text-gray-900 mt-1">{task.assignee_name || 'Unassigned'}</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    {...register('status')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    {...register('priority')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    {...register('due_date')}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                  <select
                    {...register('assignee_id')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Unassigned</option>
                    {(members || []).map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); reset(); }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg transition"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {!isEditing && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700 font-semibold transition"
              >
                Delete Task
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
              >
                Edit Task
              </button>
            </div>
          )}

          {showDeleteConfirm && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-semibold text-red-900 mb-3">Delete this task?</p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 text-red-700 hover:bg-red-100 rounded transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded transition"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}