import { useCallback } from 'react';
import { useAppContext } from './useAppContext';
import {
  workflowService,
} from '../services';
import { Workflow } from '../types';

// Type for UI workflow creation (matches WorkflowsView component)
interface CreateWorkflowData {
  name: string;
  description: string;
  clientId: string;
  status: 'draft' | 'active' | 'completed' | 'on-hold';
  startDate?: string;
  expectedEndDate?: string;
}

export const useWorkflowActions = () => {
  const { refresh } = useAppContext();

  // Helper function to convert UI status to API status
  const convertStatusToApi = (uiStatus: CreateWorkflowData['status']): Workflow['status'] => {
    switch (uiStatus) {
      case 'draft':
        return 'draft';
      case 'active':
        return 'active';
      case 'on-hold':
        return 'on-hold';
      case 'completed':
        return 'completed';
      default:
        return 'active';
    }
  };

  const createWorkflow = useCallback(async (workflowData: CreateWorkflowData) => {
    try {
      // Convert UI data to Workflow format
      const apiData: Partial<Workflow> = {
        name: workflowData.name,
        description: workflowData.description,
        clientId: workflowData.clientId,
        status: convertStatusToApi(workflowData.status),
        startDate: workflowData.startDate,
        expectedEndDate: workflowData.expectedEndDate,
      };
      
      await workflowService.create(apiData);
      await refresh();
    } catch (error) {
      console.error('Failed to create workflow:', error);
      throw error;
    }
  }, [refresh]);

  const updateWorkflow = useCallback(async (workflow: Workflow) => {
    try {
      // Convert workflow to update format
      const updateData: Partial<Workflow> = {
        name: workflow.name,
        description: workflow.description,
        clientId: workflow.clientId,
        status: convertStatusToApi(workflow.status as CreateWorkflowData['status']),
        startDate: workflow.startDate ? new Date(workflow.startDate).toISOString() : undefined,
        expectedEndDate: workflow.expectedEndDate ? new Date(workflow.expectedEndDate).toISOString() : undefined
      };
      
      await workflowService.update(workflow.id, updateData);
      await refresh();
    } catch (error) {
      console.error('Failed to update workflow:', error);
      throw error;
    }
  }, [refresh]);

  const deleteWorkflow = useCallback(async (workflowId: string) => {
    try {
      await workflowService.delete(workflowId);
      await refresh();
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      throw error;
    }
  }, [refresh]);

  const updateWorkflowStatus = useCallback(async (workflowId: string, status: string) => {
    try {
      // Convert UI status to API status before sending
      const apiStatus = convertStatusToApi(status as CreateWorkflowData['status']);
      
      // Ensure apiStatus is not undefined before calling the service
      if (apiStatus) {
        await workflowService.updateStatus(workflowId, apiStatus);
        await refresh();
      } else {
        console.error('Invalid status provided:', status);
        throw new Error(`Invalid workflow status: ${status}`);
      }
    } catch (error) {
      console.error('Failed to update workflow status:', error);
      throw error;
    }
  }, [refresh]);

  return {
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    updateWorkflowStatus,
  };
};