/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
import { useAppContext } from './useAppContext';
import {
  meetingService,
  CreateMeetingRequest,
} from '../services';

export const useMeetingActions = () => {
  const { refresh } = useAppContext();

  const createMeeting = useCallback(async (meetingData: CreateMeetingRequest) => {
    try {
      await meetingService.create(meetingData);
      await refresh();
    } catch (error) {
      console.error('Failed to create meeting:', error);
      throw error;
    }
  }, [refresh]);

  const updateMeeting = useCallback(async (meetingId: string, meetingData: Partial<CreateMeetingRequest>) => {
    try {
      await meetingService.update(meetingId, meetingData);
      await refresh();
    } catch (error) {
      console.error('Failed to update meeting:', error);
      throw error;
    }
  }, [refresh]);

  const deleteMeeting = useCallback(async (meetingId: string) => {
    try {
      await meetingService.delete(meetingId);
      await refresh();
    } catch (error) {
      console.error('Failed to delete meeting:', error);
      throw error;
    }
  }, [refresh]);

  const updateMeetingStatus = useCallback(async (meetingId: string, status: string) => {
    try {
      await meetingService.updateStatus(meetingId, status as any);
      await refresh();
    } catch (error) {
      console.error('Failed to update meeting status:', error);
      throw error;
    }
  }, [refresh]);

  return {
    createMeeting,
    updateMeeting,
    deleteMeeting,
    updateMeetingStatus,
  };
};