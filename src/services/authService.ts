// Custom authentication service for Vite React app

interface LoginCredentials {
  email: string
  password?: string
}

interface AuthUser {
  id: string
  email: string
  name?: string
  image?: string
  role?: string
}

interface AuthResponse {
  user: AuthUser
  token: string
  expires: string
}

class AuthService {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  private tokenKey = 'auth-token'
  private userKey = 'auth-user'

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey)
  }

  // Get stored user
  getUser(): AuthUser | null {
    const user = localStorage.getItem(this.userKey)
    return user ? JSON.parse(user) : null
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken()
    const user = this.getUser()
    return !!(token && user)
  }

  // Set authentication data
  private setAuthData(response: AuthResponse) {
    localStorage.setItem(this.tokenKey, response.token)
    localStorage.setItem(this.userKey, JSON.stringify(response.user))
  }

  // Clear authentication data
  private clearAuthData() {
    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.userKey)
  }

  // Email/Password login
  async loginWithEmail(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
      }

      const authResponse: AuthResponse = await response.json()
      this.setAuthData(authResponse)
      return authResponse.user
    } catch (error) {
      console.error('Email login error:', error)
      throw error
    }
  }

  // Magic link login
  async sendMagicLink(email: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send magic link')
      }
    } catch (error) {
      console.error('Magic link error:', error)
      throw error
    }
  }

  // Verify magic link
  async verifyMagicLink(token: string): Promise<AuthUser> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/verify-magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Invalid magic link')
      }

      const authResponse: AuthResponse = await response.json()
      this.setAuthData(authResponse)
      return authResponse.user
    } catch (error) {
      console.error('Magic link verification error:', error)
      throw error
    }
  }

  // Google OAuth login
  async loginWithGoogle(): Promise<void> {
    try {
      // Get Google OAuth URL from our backend
      const response = await fetch(`${this.baseUrl}/auth/google/url`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get Google OAuth URL')
      }
      
      const { authUrl } = await response.json()
      
      // Redirect to Google OAuth
      window.location.href = authUrl
    } catch (error) {
      console.error('Google OAuth URL error:', error)
      throw error
    }
  }

  // GitHub OAuth login
  async loginWithGitHub(): Promise<void> {
    try {
      // Get GitHub OAuth URL from our backend
      const response = await fetch(`${this.baseUrl}/auth/github/url`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get GitHub OAuth URL')
      }
      
      const { authUrl } = await response.json()
      
      // Redirect to GitHub OAuth
      window.location.href = authUrl
    } catch (error) {
      console.error('GitHub OAuth URL error:', error)
      throw error
    }
  }

  // Handle OAuth callback
  async handleOAuthCallback(provider: string, code: string): Promise<AuthUser> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/callback/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'OAuth callback failed')
      }

      const authResponse: AuthResponse = await response.json()
      this.setAuthData(authResponse)
      return authResponse.user
    } catch (error) {
      console.error('OAuth callback error:', error)
      throw error
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      const token = this.getToken()
      if (token) {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.clearAuthData()
    }
  }

  // Refresh session
  async refreshSession(): Promise<AuthUser | null> {
    try {
      const token = this.getToken()
      if (!token) return null

      const response = await fetch(`${this.baseUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        this.clearAuthData()
        return null
      }

      const user: AuthUser = await response.json()
      localStorage.setItem(this.userKey, JSON.stringify(user))
      return user
    } catch (error) {
      console.error('Session refresh error:', error)
      this.clearAuthData()
      return null
    }
  }

  // Get API headers with authentication
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken()
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    }
  }
}

export const authService = new AuthService()
export type { AuthUser, LoginCredentials }