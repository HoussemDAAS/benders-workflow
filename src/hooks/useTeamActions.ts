import { useCallback } from 'react';
import { useAppContext } from './useAppContext';
import {
  teamService,
  CreateTeamMemberRequest,
} from '../services';

export const useTeamActions = () => {
  const { refresh } = useAppContext();

  const createTeamMember = useCallback(async (memberData: CreateTeamMemberRequest) => {
    try {
      await teamService.create(memberData);
      await refresh();
    } catch (error) {
      console.error('Failed to create team member:', error);
      throw error;
    }
  }, [refresh]);

  const updateTeamMember = useCallback(async (memberId: string, memberData: Partial<CreateTeamMemberRequest>) => {
    try {
      await teamService.update(memberId, memberData);
      await refresh();
    } catch (error) {
      console.error('Failed to update team member:', error);
      throw error;
    }
  }, [refresh]);

  const deleteTeamMember = useCallback(async (memberId: string) => {
    try {
      await teamService.delete(memberId);
      await refresh();
    } catch (error) {
      console.error('Failed to delete team member:', error);
      throw error;
    }
  }, [refresh]);

  const updateTeamMemberStatus = useCallback(async (memberId: string, isActive: boolean) => {
    try {
      await teamService.updateStatus(memberId, isActive);
      await refresh();
    } catch (error) {
      console.error('Failed to update team member status:', error);
      throw error;
    }
  }, [refresh]);

  return {
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    updateTeamMemberStatus,
  };
};