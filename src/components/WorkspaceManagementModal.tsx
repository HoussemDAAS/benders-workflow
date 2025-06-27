import React, { useState, useEffect } from 'react'
import { 
  BuildingOfficeIcon, 
  UsersIcon, 
  PlusIcon, 
  TrashIcon, 
  PencilIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useWorkspace } from '../context/WorkspaceContext'
import { useAuth } from '../hooks/useAuth'
import { workspaceService, type AddMemberData } from '../services/workspaceService'
import { ErrorMessage } from './ErrorMessage'
import { LoadingSpinner } from './LoadingSpinner'
import type { Workspace, WorkspaceMember } from '../types'

interface WorkspaceManagementModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit' | 'manage'
  workspace?: Workspace
}

export function WorkspaceManagementModal({ isOpen, onClose, mode, workspace }: WorkspaceManagementModalProps) {
  const { createWorkspace, refreshWorkspaces, currentWorkspace } = useWorkspace()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form state
  const [form, setForm] = useState({
    name: '',
    description: ''
  })
  
  // Workspace details and members (for edit/manage modes)
  const [workspaceDetails, setWorkspaceDetails] = useState<Workspace | null>(null)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  
  // Member invitation state
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member' as 'admin' | 'member'
  })
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  
  // Confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (mode === 'create') {
        setForm({ name: '', description: '' })
      } else if ((mode === 'edit' || mode === 'manage') && workspace) {
        setForm({
          name: workspace.name,
          description: workspace.description || ''
        })
        loadWorkspaceDetails(workspace.id)
      }
      setError(null)
      setSuccess(null)
      setShowInviteForm(false)
    }
  }, [isOpen, mode, workspace])

  const loadWorkspaceDetails = async (workspaceId: string) => {
    try {
      setIsLoading(true)
      const details = await workspaceService.getWorkspace(workspaceId)
      setWorkspaceDetails(details)
      setMembers(details.members || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    try {
      setIsSaving(true)
      setError(null)
      
      await createWorkspace({
        name: form.name.trim(),
        description: form.description.trim() || undefined
      })
      
      setSuccess('Workspace created successfully!')
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceDetails || !form.name.trim()) return

    try {
      setIsSaving(true)
      setError(null)
      
      await workspaceService.updateWorkspace(workspaceDetails.id, {
        name: form.name.trim(),
        description: form.description.trim() || undefined
      })
      
      setSuccess('Workspace updated successfully!')
      await refreshWorkspaces()
      await loadWorkspaceDetails(workspaceDetails.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workspace')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceDetails || !inviteForm.email.trim()) return

    try {
      setIsInviting(true)
      setError(null)
      
      await workspaceService.addMember(workspaceDetails.id, {
        email: inviteForm.email.trim(),
        role: inviteForm.role
      })
      
      setSuccess(`Invitation sent to ${inviteForm.email}`)
      setInviteForm({ email: '', role: 'member' })
      setShowInviteForm(false)
      await loadWorkspaceDetails(workspaceDetails.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite member')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!workspaceDetails) return

    try {
      setError(null)
      await workspaceService.removeMember(workspaceDetails.id, userId)
      setSuccess('Member removed successfully')
      await loadWorkspaceDetails(workspaceDetails.id)
      setMemberToRemove(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  const handleUpdateMemberRole = async (userId: string, newRole: 'admin' | 'member') => {
    if (!workspaceDetails) return

    try {
      setError(null)
      await workspaceService.updateMemberRole(workspaceDetails.id, userId, newRole)
      setSuccess('Member role updated successfully')
      await loadWorkspaceDetails(workspaceDetails.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member role')
    }
  }

  const handleRegenerateInviteCode = async () => {
    if (!workspaceDetails) return

    try {
      setError(null)
      await workspaceService.regenerateInviteCode(workspaceDetails.id)
      setSuccess('Invite code regenerated successfully')
      await loadWorkspaceDetails(workspaceDetails.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate invite code')
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!workspaceDetails) return

    try {
      setError(null)
      await workspaceService.deleteWorkspace(workspaceDetails.id)
      await refreshWorkspaces()
      setSuccess('Workspace deleted successfully')
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workspace')
    }
  }

  const copyInviteCode = async () => {
    if (!workspaceDetails?.inviteCode) return

    try {
      await navigator.clipboard.writeText(workspaceDetails.inviteCode)
      setSuccess('Invite code copied to clipboard!')
    } catch (err) {
      setError('Failed to copy invite code')
    }
  }

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  if (!isOpen) return null

  const isOwner = workspaceDetails?.ownerId === user?.id
  const isAdmin = workspaceDetails?.userRole === 'admin' || isOwner
  const canEdit = mode === 'create' || isAdmin

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Create New Workspace'
      case 'edit': return 'Edit Workspace'
      case 'manage': return 'Manage Workspace'
      default: return 'Workspace'
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-medium text-gray-900">{getModalTitle()}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Messages */}
          {error && (
            <div className="mb-4">
              <ErrorMessage error={error} onRetry={clearMessages} />
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={clearMessages}
                    className="inline-flex text-green-400 hover:text-green-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner message="Loading workspace details..." />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Workspace Details Form */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Workspace Details</h3>
                <form onSubmit={mode === 'create' ? handleCreateWorkspace : handleUpdateWorkspace} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Workspace Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      required
                      maxLength={100}
                      disabled={!canEdit}
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description (Optional)
                    </label>
                    <textarea
                      id="description"
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      maxLength={500}
                      placeholder="Describe your workspace..."
                      disabled={!canEdit}
                    />
                  </div>

                  {canEdit && (
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                            {mode === 'create' ? 'Creating...' : 'Saving...'}
                          </>
                        ) : (
                          <>
                            <PencilIcon className="w-4 h-4 mr-2" />
                            {mode === 'create' ? 'Create Workspace' : 'Update Workspace'}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>

                {!canEdit && (
                  <p className="text-sm text-gray-500 mt-2">
                    Only workspace administrators can edit these details.
                  </p>
                )}
              </div>

              {/* Invite Code Section (only for existing workspaces) */}
              {(mode === 'edit' || mode === 'manage') && workspaceDetails && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Invite Code</h3>
                  <div className="flex items-center space-x-3">
                    <code className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-mono tracking-wider">
                      {workspaceDetails.inviteCode}
                    </code>
                    <button
                      onClick={copyInviteCode}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <ClipboardDocumentIcon className="w-4 h-4 mr-1" />
                      Copy
                    </button>
                    {isAdmin && (
                      <button
                        onClick={handleRegenerateInviteCode}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <ArrowPathIcon className="w-4 h-4 mr-1" />
                        Regenerate
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Anyone with this code can join your workspace.
                  </p>
                </div>
              )}

              {/* Members Section (only for manage mode) */}
              {mode === 'manage' && workspaceDetails && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Members ({members.length})</h3>
                    {isAdmin && (
                      <button
                        onClick={() => setShowInviteForm(true)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <UserPlusIcon className="w-4 h-4 mr-1" />
                        Invite Member
                      </button>
                    )}
                  </div>

                  {/* Invite Form */}
                  {showInviteForm && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <form onSubmit={handleInviteMember} className="flex items-end space-x-3">
                        <div className="flex-1">
                          <label htmlFor="email" className="block text-xs font-medium text-blue-700">
                            Email Address
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={inviteForm.email}
                            onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                            className="mt-1 block w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="user@example.com"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="role" className="block text-xs font-medium text-blue-700">
                            Role
                          </label>
                          <select
                            id="role"
                            value={inviteForm.role}
                            onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'member' }))}
                            className="mt-1 block px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          disabled={isInviting}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isInviting ? 'Inviting...' : 'Invite'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowInviteForm(false)
                            setInviteForm({ email: '', role: 'member' })
                          }}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Members List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            member.id === workspaceDetails.ownerId
                              ? 'bg-purple-100 text-purple-800'
                              : member.workspaceRole === 'admin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {member.id === workspaceDetails.ownerId ? 'Owner' : member.workspaceRole}
                          </span>
                          {isAdmin && member.id !== workspaceDetails.ownerId && member.id !== user?.id && (
                            <div className="flex items-center space-x-1">
                              <select
                                value={member.workspaceRole}
                                onChange={(e) => handleUpdateMemberRole(member.id, e.target.value as 'admin' | 'member')}
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                              </select>
                              <button
                                onClick={() => setMemberToRemove(member.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Danger Zone (only for owners in manage mode) */}
              {mode === 'manage' && isOwner && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-red-900 mb-2">Danger Zone</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-red-700">Delete this workspace</p>
                        <p className="text-xs text-red-600">This action cannot be undone.</p>
                      </div>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                      >
                        <TrashIcon className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>

      {/* Delete Workspace Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Delete Workspace</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete "{workspaceDetails?.name}"? This will permanently delete the workspace and all associated data. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWorkspace}
                className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation */}
      {memberToRemove && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Remove Member</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to remove this member from the workspace? They will lose access to all workspace data.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setMemberToRemove(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveMember(memberToRemove)}
                className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 