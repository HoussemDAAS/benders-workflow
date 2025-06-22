/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dashboard } from '../components/Dashboard';
import { useAppContext } from '../hooks/useAppContext';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { dashboardStats, clients, workflows, teamMembers, refresh } = useAppContext();

  // Refresh data when dashboard page is visited to ensure stats are up-to-date
  useEffect(() => {
    refresh();
  }, [refresh]);

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
      onRefresh={refresh}
    />
  );
};

export default DashboardPage;