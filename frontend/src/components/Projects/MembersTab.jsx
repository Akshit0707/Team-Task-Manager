import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsAPI } from '../../api/index';
import { useToast } from '../../hooks/useToast';

const addMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member']),
});

export default function MembersTab({ members, loading, projectId, isAdmin }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { role: 'member' },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data) => {
      await projectsAPI.addMember(projectId, data.email, data.role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
      reset();
      setApiError('');
      showToast('Member added successfully!', 'success');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to add member';
      setApiError(message);
      showToast(message, 'error');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId) => {
      await projectsAPI.removeMember(projectId, memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
      showToast('Member removed successfully!', 'success');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to remove member';
      showToast(message, 'error');
    },
  });

  const onSubmit = async (data) => {
    setApiError('');
    await addMemberMutation.mutateAsync(data);
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading members...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Members List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h3>
        {members.length === 0 ? (
          <p className="text-gray-600">No members yet</p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-600">{member.email}</p>
                </div>

                <div className="flex items-center space-x-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {member.role === 'admin' ? 'Admin' : 'Member'}
                  </span>

                  {isAdmin && member.role !== 'admin' && (
                    <button
                      onClick={() => removeMemberMutation.mutate(member.id)}
                      disabled={removeMemberMutation.isPending}
                      className="text-red-600 hover:text-red-700 font-semibold text-sm transition"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Member Form */}
      {isAdmin && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Member</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            {apiError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">{apiError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="member@example.com"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={addMemberMutation.isPending}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg transition"
            >
              {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}