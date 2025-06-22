/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dashboard } from '../components/Dashboard';
import { useAppContext } from '../hooks/useAppContext';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { dashboardStats, clients, workflows, teamMembers } = useAppContext();

  const handleViewChange = (view: string) => {
    navigate(`/${view}`);
  };

  const activeWorkflows = workflows.filter((w: any) => w.status === 'active');

  return (
    <Dashboard
      stats={dashboardStats}
      recentClients={clients}
      activeWorkflows={activeWorkflows}
      teamMembers={teamMembers}
      onViewChange={handleViewChange}
    />
  );
};

export default DashboardPage;