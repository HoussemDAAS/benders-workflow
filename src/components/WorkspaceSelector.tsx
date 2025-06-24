import React, { useState } from 'react'
import { PlusIcon, UsersIcon, BuildingOfficeIcon, CodeBracketIcon } from '@heroicons/react/24/outline'
import { useWorkspace } from '../context/WorkspaceContext'
import { ErrorMessage } from './ErrorMessage'
import { LoadingSpinner } from './LoadingSpinner'

export function WorkspaceSelector() {
  const { 
    workspaces, 
    isLoading, 
    error, 
    createWorkspace, 
    joinWorkspace, 
    selectWorkspace,
    clearError 
  } = useWorkspace()

  const [view, setView] = useState<'select' | 'create' | 'join'>('select')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Create workspace form
  const [createForm, setCreateForm] = useState({
    name: '',
    description: ''
  })
  
  // Join workspace form
  const [joinForm, setJoinForm] = useState({
    inviteCode: ''
  })

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name.trim()) return

    try {
      setIsSubmitting(true)
      clearError()
      await createWorkspace({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined
      })
      // Reset form
      setCreateForm({ name: '', description: '' })
      setView('select')
    } catch (err) {
      // Error is handled by context
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleJoinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinForm.inviteCode.trim()) return

    try {
      setIsSubmitting(true)
      clearError()
      await joinWorkspace({
        inviteCode: joinForm.inviteCode.trim().toUpperCase()
      })
      // Reset form
      setJoinForm({ inviteCode: '' })
      setView('select')
    } catch (err) {
      // Error is handled by context
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Loading workspaces..." />
      </div>
    )
  }

  // If user has workspaces, show selection view
  if (workspaces.length > 0 && view === 'select') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <BuildingOfficeIcon className="mx-auto h-16 w-16 text-blue-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Workspace</h1>
            <p className="text-gray-600">Choose a workspace to continue</p>
          </div>

          {error && (
            <div className="mb-6">
              <ErrorMessage error={error} onRetry={clearError} />
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="grid gap-4">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => selectWorkspace(workspace)}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{workspace.name}</h3>
                        {workspace.description && (
                          <p className="text-sm text-gray-500 mt-1">{workspace.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center">
                            <UsersIcon className="w-4 h-4 mr-1" />
                            {workspace.members?.length || 0} members
                          </span>
                          <span className="capitalize">{workspace.userRole} access</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-blue-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setView('create')}
                  className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create New Workspace
                </button>
                <button
                  onClick={() => setView('join')}
                  className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <CodeBracketIcon className="w-4 h-4 mr-2" />
                  Join with Code
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Create workspace view
  if (view === 'create') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <PlusIcon className="mx-auto h-16 w-16 text-green-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Workspace</h1>
            <p className="text-gray-600">Set up your new workspace</p>
          </div>

          {error && (
            <div className="mb-6">
              <ErrorMessage error={error} onRetry={clearError} />
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="My Company"
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your workspace..."
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setView('select')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !createForm.name.trim()}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Join workspace view
  if (view === 'join') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <CodeBracketIcon className="mx-auto h-16 w-16 text-purple-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Workspace</h1>
            <p className="text-gray-600">Enter your invitation code</p>
          </div>

          {error && (
            <div className="mb-6">
              <ErrorMessage error={error} onRetry={clearError} />
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleJoinWorkspace} className="space-y-4">
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Invitation Code *
                </label>
                <input
                  type="text"
                  id="inviteCode"
                  value={joinForm.inviteCode}
                  onChange={(e) => setJoinForm(prev => ({ ...prev, inviteCode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono tracking-wider uppercase"
                  placeholder="ABC123"
                  required
                  maxLength={6}
                  style={{ textTransform: 'uppercase' }}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter the 6-character code provided by your workspace admin
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setView('select')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !joinForm.inviteCode.trim()}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Joining...' : 'Join Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // No workspaces - show create/join options
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <BuildingOfficeIcon className="mx-auto h-16 w-16 text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Benders Workflow</h1>
          <p className="text-gray-600">To get started, create a new workspace or join an existing one</p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage error={error} onRetry={clearError} />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 space-y-4">
            <button
              onClick={() => setView('create')}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <PlusIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Create New Workspace</h3>
                  <p className="text-sm text-gray-500 mt-1">Set up a new workspace for your team</p>
                </div>
              </div>
              <div className="text-green-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            <button
              onClick={() => setView('join')}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CodeBracketIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Join Existing Workspace</h3>
                  <p className="text-sm text-gray-500 mt-1">Use an invitation code to join a workspace</p>
                </div>
              </div>
              <div className="text-purple-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 