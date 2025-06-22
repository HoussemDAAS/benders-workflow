import React from 'react';
import { WorkflowsView } from '../components/WorkflowsView';
import { useAppContext } from '../hooks/useAppContext';
import { useWorkflowActions } from '../hooks/useWorkflowActions';

const WorkflowsPage: React.FC = () => {
  const { workflows, clients, teamMembers, kanbanTasks } = useAppContext();
  const { createWorkflow, updateWorkflow, deleteWorkflow, updateWorkflowStatus } = useWorkflowActions();

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
    />
  );
};

export default WorkflowsPage;