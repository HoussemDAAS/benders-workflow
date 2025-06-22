import { useCallback } from 'react';
import { useAppContext } from './useAppContext';
import {
  clientService,
  CreateClientRequest,
} from '../services';

export const useClientActions = () => {
  const { refresh } = useAppContext();

  const createClient = useCallback(async (clientData: CreateClientRequest) => {
    try {
      await clientService.create(clientData);
      await refresh();
    } catch (error) {
      console.error('Failed to create client:', error);
      throw error;
    }
  }, [refresh]);

  const updateClient = useCallback(async (clientId: string, clientData: Partial<CreateClientRequest>) => {
    try {
      await clientService.update(clientId, clientData);
      await refresh();
    } catch (error) {
      console.error('Failed to update client:', error);
      throw error;
    }
  }, [refresh]);

  const deleteClient = useCallback(async (clientId: string) => {
    try {
      await clientService.delete(clientId);
      await refresh();
    } catch (error) {
      console.error('Failed to delete client:', error);
      throw error;
    }
  }, [refresh]);

  const updateClientStatus = useCallback(async (clientId: string, isActive: boolean) => {
    try {
      await clientService.updateStatus(clientId, isActive);
      await refresh();
    } catch (error) {
      console.error('Failed to update client status:', error);
      throw error;
    }
  }, [refresh]);

  return {
    createClient,
    updateClient,
    deleteClient,
    updateClientStatus,
  };
};