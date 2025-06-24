// Custom authentication service for Vite React app

interface LoginCredentials {
  email: string
  password?: string
  rememberMe?: boolean // Add remember me option
}

interface RegisterCredentials {
  email: string
  password: string
  name: string
  role?: string
}

interface AuthUser {
  id: string
  email: string
  name?: string
  image?: string
  role?: string
  twoFactorEnabled?: boolean
}

interface AuthResponse {
  user: AuthUser
  token: string
  expires: string
}

// New interface for 2FA responses
interface TwoFactorRequiredResponse {
  requiresTwoFactor: true
  email: string
  loginType: 'password' | 'magic-link'
  message: string
  magicToken?: string
}

interface TwoFactorVerificationRequest {
  email: string
  token: string
  loginType: 'password' | 'magic-link'
  password?: string
  magicToken?: string
}

class AuthService {
  private baseUrl = 'http://localhost:3001'
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

  // Enhanced Email/Password login with 2FA support
  async loginWithEmail(credentials: LoginCredentials): Promise<AuthUser | TwoFactorRequiredResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Login failed')
      }

      const data = await response.json()

      // Check if 2FA is required
      if (data.requiresTwoFactor) {
        return {
          requiresTwoFactor: true,
          email: data.email,
          loginType: 'password',
          message: data.message
        } as TwoFactorRequiredResponse
      }

      // Regular login success (no 2FA)
      const authResponse: AuthResponse = data
      this.setAuthData(authResponse)
      return authResponse.user
    } catch (error) {
      console.error('Email login error:', error)
      throw error
    }
  }

  // Register new user
  async register(credentials: RegisterCredentials): Promise<AuthUser> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Registration failed')
      }

      const authResponse: AuthResponse = await response.json()
      this.setAuthData(authResponse)
      return authResponse.user
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  // Magic link login
  async sendMagicLink(email: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        let error
        try {
          error = JSON.parse(errorText)
        } catch {
          error = { message: errorText }
        }
        throw new Error(error.message || 'Failed to send magic link')
      }
    } catch (error) {
      console.error('Magic link request failed:', error)
      throw error
    }
  }

  // Enhanced Magic link with 2FA support  
  async verifyMagicLink(token: string): Promise<AuthUser | TwoFactorRequiredResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/verify-magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Invalid magic link')
      }

      const data = await response.json()

      // Check if 2FA is required
      if (data.requiresTwoFactor) {
        return {
          requiresTwoFactor: true,
          email: data.email,
          loginType: 'magic-link',
          message: data.message,
          magicToken: token
        } as TwoFactorRequiredResponse
      }

      // Regular magic link success (no 2FA)
      const authResponse: AuthResponse = data
      this.setAuthData(authResponse)
      return authResponse.user
    } catch (error) {
      console.error('Magic link verification error:', error)
      throw error
    }
  }

  // New method: Verify 2FA and complete login
  async verify2FA(request: TwoFactorVerificationRequest): Promise<AuthUser> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '2FA verification failed')
      }

      const authResponse: AuthResponse = await response.json()
      this.setAuthData(authResponse)
      return authResponse.user
    } catch (error) {
      console.error('2FA verification error:', error)
      throw error
    }
  }

  // New 2FA management methods
  async setup2FA(): Promise<{ secret: string; qrCodeDataURL: string; manualEntryKey: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/2fa/setup`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to setup 2FA')
      }

      return await response.json()
    } catch (error) {
      console.error('2FA setup error:', error)
      throw error
    }
  }

  async enable2FA(token: string): Promise<{ backupCodes: string[]; user: AuthUser }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/2fa/enable`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to enable 2FA')
      }

      const data = await response.json()
      
      // Update stored user data with new 2FA status
      localStorage.setItem(this.userKey, JSON.stringify(data.user))
      
      return data
    } catch (error) {
      console.error('2FA enable error:', error)
      throw error
    }
  }

  async disable2FA(token: string): Promise<AuthUser> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/2fa/disable`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to disable 2FA')
      }

      const data = await response.json()
      
      // Update stored user data with new 2FA status
      localStorage.setItem(this.userKey, JSON.stringify(data.user))
      
      return data.user
    } catch (error) {
      console.error('2FA disable error:', error)
      throw error
    }
  }

  async get2FAStatus(): Promise<{ twoFactorEnabled: boolean; hasBackupCodes: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/2fa/status`, {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get 2FA status')
      }

      return await response.json()
    } catch (error) {
      console.error('2FA status error:', error)
      throw error
    }
  }

  async regenerateBackupCodes(token: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/2fa/regenerate-backup-codes`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to regenerate backup codes')
      }

      const data = await response.json()
      return data.backupCodes
    } catch (error) {
      console.error('2FA regenerate backup codes error:', error)
      throw error
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      const token = this.getToken()
      if (token) {
        await fetch(`${this.baseUrl}/api/auth/logout`, {
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

      const response = await fetch(`${this.baseUrl}/api/auth/me`, {
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

  // Google OAuth login
  async loginWithGoogle(): Promise<void> {
    try {
      // Get Google OAuth URL from backend
      const response = await fetch(`${this.baseUrl}/api/auth/google/url`)
      if (!response.ok) {
        throw new Error('Failed to get Google OAuth URL')
      }
      
      const { authUrl } = await response.json()
      
      // Redirect to Google OAuth
      window.location.href = authUrl
    } catch (error) {
      console.error('Google OAuth error:', error)
      throw error
    }
  }

  // GitHub OAuth login
  async loginWithGitHub(): Promise<void> {
    try {
      // Get GitHub OAuth URL from backend
      const response = await fetch(`${this.baseUrl}/api/auth/github/url`)
      if (!response.ok) {
        throw new Error('Failed to get GitHub OAuth URL')
      }
      
      const { authUrl } = await response.json()
      
      // Redirect to GitHub OAuth
      window.location.href = authUrl
    } catch (error) {
      console.error('GitHub OAuth error:', error)
      throw error
    }
  }
}

export const authService = new AuthService()

export type { 
  AuthUser, 
  LoginCredentials, 
  TwoFactorRequiredResponse, 
  TwoFactorVerificationRequest,
    RegisterCredentials
}

