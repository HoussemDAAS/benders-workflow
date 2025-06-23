import React, { useState, useCallback, useEffect } from 'react';
import { KanbanBoard } from '../components/KanbanBoard';
import { TaskEditModal } from '../components/TaskEditModal';
import { useAppContext } from '../hooks/useAppContext';
import { useTaskActions } from '../hooks/useTaskActions';
import { taskService } from '../services';
import { KanbanTask, WorkflowStep } from '../types';

const KanbanPage: React.FC = () => {
  const { kanbanColumns, kanbanTasks, workflows, clients, refresh } = useAppContext(); // TODO: Removed teamMembers for user auth implementation
  const { moveTask, saveTask, deleteTask } = useTaskActions();
  
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | undefined>();
  const [selectedClient, setSelectedClient] = useState<string | undefined>();
  
  // Local tasks state for optimistic updates
  const [localTasks, setLocalTasks] = useState<KanbanTask[]>(kanbanTasks);
  
  // Sync local tasks with context tasks when they change
  useEffect(() => {
    setLocalTasks(kanbanTasks);
  }, [kanbanTasks]);
  
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
    // Optimistic update - update local state immediately
    setLocalTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newColumnId }
          : task
      )
    );

    try {
      await moveTask(taskId, newColumnId, selectedWorkflow);
      
      // Targeted refresh - just refresh tasks data instead of full context
      const updatedTasks = await taskService.getAll();
      setLocalTasks(updatedTasks);
    } catch (error) {
      // Error - revert optimistic update by syncing with original state
      setLocalTasks(kanbanTasks);
      console.error('Failed to move task:', error);
    }
  }, [moveTask, selectedWorkflow, kanbanTasks]);

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
        tasks={localTasks}
        teamMembers={[]} // TODO: Pass empty array for now during user auth implementation
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
        teamMembers={[]} // TODO: Pass empty array for now during user auth implementation
        workflows={workflows}
        columns={kanbanColumns}
        defaultColumnId={newTaskContext.columnId}
        defaultWorkflowId={newTaskContext.workflowId}
      />
    </>
  );
};

export default KanbanPage;