import React, { createContext, useContext, useEffect, useState } from 'react'
import { workspaceService, type CreateWorkspaceData, type JoinWorkspaceData } from '../services/workspaceService'
import type { Workspace } from '../types'
import { useAuth } from '../hooks/useAuth'

interface WorkspaceContextType {
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  isLoading: boolean
  error: string | null
  workspaceChanged: number // Increment when workspace changes to trigger re-renders
  
  // Actions
  createWorkspace: (data: CreateWorkspaceData) => Promise<Workspace>
  joinWorkspace: (data: JoinWorkspaceData) => Promise<void>
  selectWorkspace: (workspace: Workspace) => void
  refreshWorkspaces: () => Promise<void>
  clearError: () => void
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workspaceChanged, setWorkspaceChanged] = useState(0)
  const { isAuthenticated } = useAuth()

  // Load workspaces on auth change
  useEffect(() => {
    if (isAuthenticated) {
      loadWorkspaces()
    } else {
      // Clear workspace data when not authenticated
      setCurrentWorkspace(null)
      setWorkspaces([])
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // Load current workspace from localStorage
  useEffect(() => {
    if (workspaces.length > 0) {
      const savedWorkspaceId = localStorage.getItem('current-workspace-id')
      if (savedWorkspaceId) {
        const workspace = workspaces.find(w => w.id === savedWorkspaceId)
        if (workspace) {
          setCurrentWorkspace(workspace)
        } else {
          // If saved workspace doesn't exist, select the first one
          setCurrentWorkspace(workspaces[0])
          localStorage.setItem('current-workspace-id', workspaces[0].id)
        }
      } else if (!currentWorkspace) {
        // If no workspace selected and we have workspaces, select the first one
        setCurrentWorkspace(workspaces[0])
        localStorage.setItem('current-workspace-id', workspaces[0].id)
      }
    }
  }, [workspaces, currentWorkspace])

  const loadWorkspaces = async () => {
    if (!isAuthenticated) return
    
    try {
      setIsLoading(true)
      setError(null)
      const userWorkspaces = await workspaceService.getWorkspaces()
      
      // If no workspaces, set a default workspace ID anyway for API calls
      if (userWorkspaces.length === 0) {
        console.warn('⚠️ No workspaces found for user. Setting default workspace for API calls.')
        localStorage.setItem('current-workspace-id', 'default-workspace')
      }
      
      setWorkspaces(userWorkspaces)
    } catch (err) {
      console.error('Failed to load workspaces:', err)
      
      // If workspace loading fails, still set a default workspace ID for API calls
      localStorage.setItem('current-workspace-id', 'default-workspace')
      
      setError(err instanceof Error ? err.message : 'Failed to load workspaces')
    } finally {
      setIsLoading(false)
    }
  }

  const createWorkspace = async (data: CreateWorkspaceData): Promise<Workspace> => {
    try {
      setError(null)
      const newWorkspace = await workspaceService.createWorkspace(data)
      
      // Add to workspaces list
      setWorkspaces(prev => [newWorkspace, ...prev])
      
      // Select the new workspace
      setCurrentWorkspace(newWorkspace)
      localStorage.setItem('current-workspace-id', newWorkspace.id)
      
      return newWorkspace
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workspace'
      setError(errorMessage)
      throw err
    }
  }

  const joinWorkspace = async (data: JoinWorkspaceData): Promise<void> => {
    try {
      setError(null)
      const { workspace } = await workspaceService.joinWorkspace(data)
      
      // Add to workspaces list
      setWorkspaces(prev => [workspace, ...prev])
      
      // Select the joined workspace
      setCurrentWorkspace(workspace)
      localStorage.setItem('current-workspace-id', workspace.id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join workspace'
      setError(errorMessage)
      throw err
    }
  }

  const selectWorkspace = (workspace: Workspace) => {
    const previousWorkspaceId = currentWorkspace?.id
    setCurrentWorkspace(workspace)
    localStorage.setItem('current-workspace-id', workspace.id)
    
    // Trigger workspace change event if workspace actually changed
    if (previousWorkspaceId !== workspace.id) {
      setWorkspaceChanged(prev => prev + 1)

    }
  }

  const refreshWorkspaces = async () => {
    await loadWorkspaces()
  }

  const clearError = () => {
    setError(null)
  }

  const value: WorkspaceContextType = {
    currentWorkspace,
    workspaces,
    isLoading,
    error,
    workspaceChanged,
    createWorkspace,
    joinWorkspace,
    selectWorkspace,
    refreshWorkspaces,
    clearError
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
} 