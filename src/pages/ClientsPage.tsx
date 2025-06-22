/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback } from 'react';
import { ClientsView } from '../components/ClientsView';
import { ClientModal } from '../components/ClientModal';
import { useAppContext } from '../hooks/useAppContext';
import { useClientActions } from '../hooks/useClientActions';
import { Client } from '../types';

const ClientsPage: React.FC = () => {
  const { clients, workflows, kanbanTasks, teamMembers } = useAppContext();
  const { createClient, updateClient, updateClientStatus } = useClientActions();
  
  // Client modal state
  const [clientModal, setClientModal] = useState<{
    isOpen: boolean;
    client: Client | null;
  }>({
    isOpen: false,
    client: null
  });

  const handleClientCreate = useCallback(() => {
    setClientModal({
      isOpen: true,
      client: null
    });
  }, []);

  const handleClientEdit = useCallback((client: Client) => {
    setClientModal({
      isOpen: true,
      client: client
    });
  }, []);

  const handleClientModalSubmit = useCallback(async (clientData: any) => {
    try {
      if (clientModal.client) {
        await updateClient(clientModal.client.id, clientData);
      } else {
        await createClient(clientData);
      }
      setClientModal({ isOpen: false, client: null });
    } catch (error) {
      console.error('Failed to save client:', error);
      throw error;
    }
  }, [clientModal.client, updateClient, createClient]);

  const handleClientModalClose = useCallback(() => {
    setClientModal({ isOpen: false, client: null });
  }, []);

  return (
    <>
      <ClientsView
        clients={clients}
        workflows={workflows}
        tasks={kanbanTasks}
        teamMembers={teamMembers}
        onClientCreate={handleClientCreate}
        onClientEdit={handleClientEdit}
        onClientStatusChange={updateClientStatus}
      />
      
      <ClientModal
        client={clientModal.client || undefined}
        isOpen={clientModal.isOpen}
        onClose={handleClientModalClose}
        onSubmit={handleClientModalSubmit}
      />
    </>
  );
};

export default ClientsPage;