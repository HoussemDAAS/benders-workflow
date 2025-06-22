import { useCallback } from 'react';
import { useAppContext } from './useAppContext';
import {
  taskService,
  CreateTaskRequest,
} from '../services';
import { KanbanTask } from '../types';

export const useTaskActions = () => {
  const { refresh, workflows, kanbanTasks } = useAppContext();

  const moveTask = useCallback(async (taskId: string, newColumnId: string, selectedWorkflow?: string) => {
    try {
      // Find the task to understand its current context
      const task = kanbanTasks.find(t => t.id === taskId);
      if (!task) return;

      // Determine if we're moving within workflow steps or generic columns
      const currentWorkflow = selectedWorkflow && selectedWorkflow !== 'all' 
        ? workflows.find(w => w.id === selectedWorkflow)
        : null;

      if (currentWorkflow && currentWorkflow.steps && currentWorkflow.steps.length > 0) {
        // Moving between workflow steps - update stepId
        const targetStep = currentWorkflow.steps.find(step => step.id === newColumnId);
        if (targetStep) {
          await taskService.update(taskId, {
            stepId: newColumnId,
            status: targetStep.status || task.status // Update status to match step status
          });
        }
      } else {
        // Moving between generic columns - update status
        await taskService.move(taskId, newColumnId);
      }
      
      await refresh();
    } catch (error) {
      console.error('Failed to move task:', error);
      throw error;
    }
  }, [refresh, workflows, kanbanTasks]);

  const saveTask = useCallback(async (task: KanbanTask) => {
    try {
      if (task.id) {
        // Update existing task
        const updateData: Partial<CreateTaskRequest> = {
          title: task.title,
          description: task.description,
          workflowId: task.workflowId,
          stepId: task.stepId,
          priority: task.priority,
          status: task.status,
          tags: task.tags,
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
          assignedMembers: task.assignedMembers
        };
        
        await taskService.update(task.id, updateData);
      } else {
        // Create new task
        const createData: CreateTaskRequest = {
          title: task.title,
          description: task.description,
          workflowId: task.workflowId,
          stepId: task.stepId,
          priority: task.priority,
          status: task.status,
          tags: task.tags || [],
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
          assignedMembers: task.assignedMembers || []
        };
        
        await taskService.create(createData);
      }
      
      await refresh();
    } catch (error) {
      console.error('Failed to save task:', error);
      throw error;
    }
  }, [refresh]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await taskService.delete(taskId);
      await refresh();
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }, [refresh]);

  return {
    moveTask,
    saveTask,
    deleteTask,
  };
};