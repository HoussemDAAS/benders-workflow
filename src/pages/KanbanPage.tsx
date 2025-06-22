import React, { useState, useCallback } from 'react';
import { KanbanBoard } from '../components/KanbanBoard';
import { TaskEditModal } from '../components/TaskEditModal';
import { useAppContext } from '../hooks/useAppContext';
import { useTaskActions } from '../hooks/useTaskActions';
import { KanbanTask, WorkflowStep } from '../types';

const KanbanPage: React.FC = () => {
  const { kanbanColumns, kanbanTasks, teamMembers, workflows, clients, refresh } = useAppContext();
  const { moveTask, saveTask, deleteTask } = useTaskActions();
  
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | undefined>();
  const [selectedClient, setSelectedClient] = useState<string | undefined>();
  
  // Task edit modal state
  const [taskEditModal, setTaskEditModal] = useState<{
    isOpen: boolean;
    task: KanbanTask | null;
  }>({
    isOpen: false,
    task: null
  });

  // New task context
  const [newTaskContext, setNewTaskContext] = useState<{
    columnId?: string;
    workflowId?: string;
    clientId?: string;
  }>({});

  const handleTaskMove = useCallback(async (taskId: string, newColumnId: string) => {
    await moveTask(taskId, newColumnId, selectedWorkflow);
  }, [moveTask, selectedWorkflow]);

  const handleTaskCreate = useCallback(async (columnId: string, workflowId?: string, clientId?: string) => {
    setTaskEditModal({
      isOpen: true,
      task: null
    });
    
    setNewTaskContext({
      columnId,
      workflowId: workflowId || selectedWorkflow || workflows[0]?.id,
      clientId
    });
  }, [selectedWorkflow, workflows]);

  const handleTaskEdit = useCallback(async (task: KanbanTask | WorkflowStep) => {
    if ('type' in task) {
      console.log('Workflow step clicked:', task.name);
      return;
    }
    
    setTaskEditModal({
      isOpen: true,
      task: task as KanbanTask
    });
  }, []);

  const handleTaskModalClose = useCallback(() => {
    setTaskEditModal({
      isOpen: false,
      task: null
    });
    setNewTaskContext({});
  }, []);

  return (
    <>
      <KanbanBoard
        columns={kanbanColumns}
        tasks={kanbanTasks}
        teamMembers={teamMembers}
        workflows={workflows}
        clients={clients}
        onTaskMove={handleTaskMove}
        onTaskCreate={handleTaskCreate}
        onTaskEdit={handleTaskEdit}
        onRefresh={refresh}
        selectedWorkflow={selectedWorkflow}
        selectedClient={selectedClient}
        onWorkflowChange={setSelectedWorkflow}
        onClientChange={setSelectedClient}
      />
      
      <TaskEditModal
        task={taskEditModal.task}
        isOpen={taskEditModal.isOpen}
        onClose={handleTaskModalClose}
        onSave={saveTask}
        onDelete={deleteTask}
        teamMembers={teamMembers}
        workflows={workflows}
        columns={kanbanColumns}
        defaultColumnId={newTaskContext.columnId}
        defaultWorkflowId={newTaskContext.workflowId}
      />
    </>
  );
};

export default KanbanPage;