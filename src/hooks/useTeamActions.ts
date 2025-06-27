import { useCallback } from 'react';
import { useAppContext } from './useAppContext';
import {
  teamService,
} from '../services';

export const useTeamActions = () => {
  const { refresh } = useAppContext();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createTeamMember = useCallback(async (_memberData: unknown) => {
    try {
      await teamService.create();
      await refresh();
    } catch (error) {
      console.error('Failed to create team member:', error);
      throw error;
    }
  }, [refresh]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateTeamMember = useCallback(async (_memberId: string, _memberData: unknown) => {
    try {
      await teamService.update();
      await refresh();
    } catch (error) {
      console.error('Failed to update team member:', error);
      throw error;
    }
  }, [refresh]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const deleteTeamMember = useCallback(async (_memberId: string) => {
    try {
      await teamService.delete();
      await refresh();
    } catch (error) {
      console.error('Failed to delete team member:', error);
      throw error;
    }
  }, [refresh]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateTeamMemberStatus = useCallback(async (_memberId: string, _isActive: boolean) => {
    try {
      await teamService.updateStatus();
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