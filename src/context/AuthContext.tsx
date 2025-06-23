import React, { createContext, useEffect, useState } from 'react'
import { authService, type AuthUser, type LoginCredentials } from '../services/authService'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  loginWithEmail: (credentials: LoginCredentials) => Promise<AuthUser>
  loginWithGoogle: () => Promise<void>
  loginWithGitHub: () => Promise<void>
  sendMagicLink: (email: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize auth state from localStorage
    const initializeAuth = async () => {
      try {
        const storedUser = authService.getUser()
        if (storedUser && authService.isAuthenticated()) {
          // Refresh session to validate token
          const refreshedUser = await authService.refreshSession()
          setUser(refreshedUser)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const loginWithEmail = async (credentials: LoginCredentials): Promise<AuthUser> => {
    setIsLoading(true)
    try {
      const user = await authService.loginWithEmail(credentials)
      setUser(user)
      return user
    } catch (error) {
      console.error('Email login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async (): Promise<void> => {
    setIsLoading(true)
    try {
      await authService.loginWithGoogle()
      // OAuth redirect will happen, so no need to update state here
    } catch (error) {
      console.error('Google login error:', error)
      setIsLoading(false)
      throw error
    }
  }

  const loginWithGitHub = async (): Promise<void> => {
    setIsLoading(true)
    try {
      await authService.loginWithGitHub()
      // OAuth redirect will happen, so no need to update state here
    } catch (error) {
      console.error('GitHub login error:', error)
      setIsLoading(false)
      throw error
    }
  }

  const sendMagicLink = async (email: string): Promise<void> => {
    setIsLoading(true)
    try {
      await authService.sendMagicLink(email)
    } catch (error) {
      console.error('Magic link error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    setIsLoading(true)
    try {
      await authService.logout()
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const refreshSession = async (): Promise<void> => {
    try {
      const refreshedUser = await authService.refreshSession()
      setUser(refreshedUser)
    } catch (error) {
      console.error('Session refresh error:', error)
      setUser(null)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    loginWithEmail,
    loginWithGoogle,
    loginWithGitHub,
    sendMagicLink,
    logout,
    refreshSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Export the context for advanced usage
export { AuthContext }