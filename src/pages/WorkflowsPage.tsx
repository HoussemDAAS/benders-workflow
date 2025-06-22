import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { WorkflowsView } from '../components/WorkflowsView';
import { useAppContext } from '../hooks/useAppContext';
import { useWorkflowActions } from '../hooks/useWorkflowActions';

const WorkflowsPage: React.FC = () => {
  const { workflows, clients, teamMembers, kanbanTasks } = useAppContext();
  const { createWorkflow, updateWorkflow, deleteWorkflow, updateWorkflowStatus } = useWorkflowActions();
  const [searchParams] = useSearchParams();
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Check for client parameter in URL
  useEffect(() => {
    const clientId = searchParams.get('client');
    if (clientId) {
      setSelectedClientId(clientId);
    }
  }, [searchParams]);

  return (
    <WorkflowsView
      workflows={workflows}
      clients={clients}
      teamMembers={teamMembers}
      tasks={kanbanTasks}
      onWorkflowCreate={createWorkflow}
      onWorkflowEdit={updateWorkflow}
      onWorkflowDelete={deleteWorkflow}
      onWorkflowStatusChange={updateWorkflowStatus}
      initialClientFilter={selectedClientId}
    />
  );
};

export default WorkflowsPage;