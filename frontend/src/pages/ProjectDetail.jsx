import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsAPI, tasksAPI } from '../api/index';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import TasksTab from '../components/Projects/TasksTab';
import MembersTab from '../components/Projects/MembersTab';

const TabButton = ({ active, label, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-semibold border-b-2 transition ${
      active
        ? 'text-indigo-600 border-indigo-600'
        : 'text-gray-600 hover:text-gray-900 border-transparent'
    }`}
  >
    {label}
  </button>
);

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('tasks');

  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await projectsAPI.getById(id);
      return response.data.data.project;
    },
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['projectTasks', id],
    queryFn: async () => {
      const response = await tasksAPI.getProjectTasks(id);
      return response.data.data.tasks;
    },
  });

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['projectMembers', id],
    queryFn: async () => {
      const response = await projectsAPI.getMembers(id);
      return response.data.data.members;
    },
  });

  const project = projectData;
  const tasks = tasksData || [];
  const members = membersData || [];

  const isProjectAdmin = project && user && user.id === project.owner_id;

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-flex items-center justify-center">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-1 bg-white rounded-full"></div>
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 font-medium">Project not found</p>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                project.status
              )}`}
            >
              {project.status === 'active' ? 'Active' : 'Archived'}
            </span>
          </div>
          <p className="text-gray-600 mt-2">{project.description}</p>
        </div>
        {isProjectAdmin && (
          <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 font-semibold rounded-lg transition">
            Edit Project
          </button>
        )}
      </div>


      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 px-6">
          <TabButton
            active={activeTab === 'tasks'}
            label={`Tasks (${tasks.length})`}
            onClick={() => setActiveTab('tasks')}
          />
          <TabButton
            active={activeTab === 'members'}
            label={`Members (${members.length})`}
            onClick={() => setActiveTab('members')}
          />
        </div>

        <div className="p-6">
          {activeTab === 'tasks' && (
            <TasksTab tasks={tasks} loading={tasksLoading} projectId={id} members={members} />
          )}
          {activeTab === 'members' && (
            <MembersTab
              members={members}
              loading={membersLoading}
              projectId={id}
              isAdmin={isProjectAdmin}
            />
          )}
        </div>
      </div>
    </div>
  );
}