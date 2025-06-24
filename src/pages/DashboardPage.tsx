/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dashboard } from '../components/Dashboard';
import { useAppContext } from '../hooks/useAppContext';
import { useRecentItems } from '../hooks/useRecentItems';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { dashboardStats, clients, workflows } = useAppContext(); // TODO: Removed teamMembers for user auth implementation
  const { addRecentItem } = useRecentItems();

  // Track dashboard visit
  useEffect(() => {
    addRecentItem({
      id: 'dashboard',
      type: 'workflow', // Using workflow as a fallback type
      title: 'Dashboard',
      subtitle: 'Main dashboard overview',
      path: '/app/dashboard'
    });
  }, [addRecentItem]);

  const handleViewChange = (view: string) => {
    navigate(`/${view}`);
  };

  const handleClientSelect = (clientId: string) => {
    navigate(`/workflows?client=${clientId}`);
  };

  const activeWorkflows = workflows.filter((w: any) => w.status === 'active');

  return (
    <Dashboard
      stats={dashboardStats}
      recentClients={clients}
      activeWorkflows={activeWorkflows}
      teamMembers={[]} // TODO: Pass empty array for now during user auth implementation
      onViewChange={handleViewChange}
      onClientSelect={handleClientSelect}
    />
  );
};

export default DashboardPage;