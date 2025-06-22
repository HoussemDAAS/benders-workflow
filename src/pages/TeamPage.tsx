/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback } from 'react';
import { TeamView } from '../components/TeamView';
import { TeamMemberModal } from '../components/TeamMemberModal';
import { useAppContext } from '../hooks/useAppContext';
import { useTeamActions } from '../hooks/useTeamActions';
import { TeamMember } from '../types';

const TeamPage: React.FC = () => {
  const { teamMembers, workflows, kanbanTasks } = useAppContext();
  const { createTeamMember, updateTeamMember, deleteTeamMember, updateTeamMemberStatus } = useTeamActions();
  
  // Team member modal state
  const [teamMemberModal, setTeamMemberModal] = useState<{
    isOpen: boolean;
    member: TeamMember | null;
  }>({
    isOpen: false,
    member: null
  });

  const handleMemberCreate = useCallback(() => {
    setTeamMemberModal({
      isOpen: true,
      member: null
    });
  }, []);

  const handleMemberEdit = useCallback((member: TeamMember) => {
    setTeamMemberModal({
      isOpen: true,
      member: member
    });
  }, []);

  const handleTeamMemberModalSubmit = useCallback(async (memberData: any) => {
    try {
      if (teamMemberModal.member) {
        await updateTeamMember(teamMemberModal.member.id, memberData);
      } else {
        await createTeamMember(memberData);
      }
      setTeamMemberModal({ isOpen: false, member: null });
    } catch (error) {
      console.error('Failed to save team member:', error);
      throw error;
    }
  }, [teamMemberModal.member, updateTeamMember, createTeamMember]);

  const handleTeamMemberModalClose = useCallback(() => {
    setTeamMemberModal({ isOpen: false, member: null });
  }, []);

  return (
    <>
      <TeamView
        teamMembers={teamMembers}
        workflows={workflows}
        tasks={kanbanTasks}
        onMemberCreate={handleMemberCreate}
        onMemberEdit={handleMemberEdit}
        onMemberDelete={deleteTeamMember}
        onMemberStatusChange={updateTeamMemberStatus}
      />
      
      <TeamMemberModal
        member={teamMemberModal.member || undefined}
        isOpen={teamMemberModal.isOpen}
        onClose={handleTeamMemberModalClose}
        onSubmit={handleTeamMemberModalSubmit}
      />
    </>
  );
};

export default TeamPage;