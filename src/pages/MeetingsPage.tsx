/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback } from 'react';
import { MeetingView } from '../components/MeetingView';
import { MeetingModal } from '../components/MeetingModal';
import { useAppContext } from '../hooks/useAppContext';
import { useMeetingActions } from '../hooks/useMeetingActions';
import { Meeting } from '../types';

const MeetingsPage: React.FC = () => {
  const { meetings, clients, teamMembers } = useAppContext();
  const { createMeeting, updateMeeting, deleteMeeting, updateMeetingStatus } = useMeetingActions();
  
  // Meeting modal state
  const [meetingModal, setMeetingModal] = useState<{
    isOpen: boolean;
    meeting: Meeting | null;
  }>({
    isOpen: false,
    meeting: null
  });

  const handleMeetingCreate = useCallback(() => {
    setMeetingModal({
      isOpen: true,
      meeting: null
    });
  }, []);

  const handleMeetingEdit = useCallback((meeting: Meeting) => {
    setMeetingModal({
      isOpen: true,
      meeting: meeting
    });
  }, []);

  const handleMeetingModalSubmit = useCallback(async (meetingData: any) => {
    try {
      if (meetingModal.meeting) {
        await updateMeeting(meetingModal.meeting.id, meetingData);
      } else {
        await createMeeting(meetingData);
      }
      setMeetingModal({ isOpen: false, meeting: null });
    } catch (error) {
      console.error('Failed to save meeting:', error);
      throw error;
    }
  }, [meetingModal.meeting, updateMeeting, createMeeting]);

  const handleMeetingModalClose = useCallback(() => {
    setMeetingModal({ isOpen: false, meeting: null });
  }, []);

  return (
    <>
      <MeetingView
        meetings={meetings}
        clients={clients}
        teamMembers={teamMembers}
        onMeetingCreate={handleMeetingCreate}
        onMeetingEdit={handleMeetingEdit}
        onMeetingDelete={deleteMeeting}
        onMeetingStatusChange={updateMeetingStatus}
      />
      
      <MeetingModal
        meeting={meetingModal.meeting || undefined}
        clients={clients}
        teamMembers={teamMembers}
        isOpen={meetingModal.isOpen}
        onClose={handleMeetingModalClose}
        onSubmit={handleMeetingModalSubmit}
      />
    </>
  );
};

export default MeetingsPage;