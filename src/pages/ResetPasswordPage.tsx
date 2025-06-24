import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Target, 
  Sparkles,
  AlertCircle,
  CheckCircle,
  Shield
} from 'lucide-react';

interface ResetPasswordFormData {
  password: string
  confirmPassword: string
}

interface ResetPasswordFormErrors {
  password?: string
  confirmPassword?: string
  general?: string
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<ResetPasswordFormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false)
        return
      }

      try {
        const response = await fetch('http://localhost:3001/api/auth/validate-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        setTokenValid(response.ok)
      } catch (error) {
        console.error('Token validation error:', error)
        setTokenValid(false)
      }
    }

    validateToken()
  }, [token])

  // Password validation
  const validatePassword = (password: string): string | null => {
    if (!password) {
      return 'Password is required'
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number'
    }
    if (password.length > 128) {
      return 'Password is too long'
    }
    return null
  }

  // Confirm password validation
  const validateConfirmPassword = (confirmPassword: string, password: string): string | null => {
    if (!confirmPassword) {
      return 'Please confirm your password'
    }
    if (confirmPassword !== password) {
      return 'Passwords do not match'
    }
    return null
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear errors on input
    if (errors[name as keyof ResetPasswordFormErrors] || errors.general) {
      setErrors(prev => ({ ...prev, [name]: undefined, general: undefined }))
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const passwordError = validatePassword(formData.password)
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password)
    
    if (passwordError || confirmPasswordError) {
      setErrors({
        password: passwordError || undefined,
        confirmPassword: confirmPasswordError || undefined
      })
      return
    }
    
    setIsSubmitting(true)
    setErrors({})
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          password: formData.password 
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reset password')
      }

      setResetSuccess(true)
    } catch (error) {
      console.error('Reset password error:', error)
      
      let errorMessage = 'Failed to reset password. Please try again.'
      
      if (error instanceof Error) {
        const message = error.message.toLowerCase()
        
        if (message.includes('token') && message.includes('expired')) {
          errorMessage = 'Reset link has expired. Please request a new password reset.'
        } else if (message.includes('token') && message.includes('invalid')) {
          errorMessage = 'Invalid reset link. Please request a new password reset.'
        } else if (message.includes('network') || message.includes('fetch')) {
          errorMessage = 'Connection error. Please check your internet connection and try again.'
        } else if (message.includes('server') || message.includes('500')) {
          errorMessage = 'Server error. Please try again in a few moments.'
        } else if (error.message && error.message.length > 0) {
          errorMessage = error.message
        }
      }
      
      setErrors({ general: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Error display component
  const ErrorDisplay = ({ error }: { error: string }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
        <p className="text-sm font-medium text-red-700 leading-relaxed">{error}</p>
      </div>
    </div>
  )

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    let score = 0
    if (password.length >= 8) score++
    if (/(?=.*[a-z])/.test(password)) score++
    if (/(?=.*[A-Z])/.test(password)) score++
    if (/(?=.*\d)/.test(password)) score++
    if (/(?=.*[!@#$%^&*])/.test(password)) score++
    
    if (score <= 2) return { strength: 'weak', color: 'red', label: 'Weak' }
    if (score === 3) return { strength: 'medium', color: 'yellow', label: 'Medium' }
    if (score === 4) return { strength: 'good', color: 'blue', label: 'Good' }
    return { strength: 'strong', color: 'green', label: 'Strong' }
  }

  // Loading state
  if (tokenValid === null) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Validating reset link...</p>
        </div>
      </div>
    )
  }

  // Invalid token
  if (tokenValid === false) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-large p-6 lg:p-8 border border-gray-100 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired. Please request a new password reset.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/forgot-password')}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg"
              >
                Request New Reset
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (resetSuccess) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-large p-6 lg:p-8 border border-gray-100 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Password Reset Successfully</h2>
            <p className="text-gray-600 mb-6">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
            >
              Continue to Login
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const passwordStrength = getPasswordStrength(formData.password)

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-gradient-to-br from-primary via-accent to-primary">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/10 pointer-events-none"></div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-tertiary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-secondary/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-6 lg:px-8 xl:px-12 py-8 lg:py-10 xl:py-12 text-white">
          <div className="mb-6 lg:mb-8 xl:mb-10">
            <div className="flex items-center gap-2 lg:gap-3 xl:gap-4 mb-4 lg:mb-5 xl:mb-6">
              <div className="w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 bg-gradient-to-br from-tertiary to-secondary rounded-xl lg:rounded-2xl flex items-center justify-center shadow-xl">
                <Target className="w-5 h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold">Benders Workflow</h1>
                <p className="text-white/80 text-xs lg:text-sm xl:text-base">Business Process Management</p>
              </div>
            </div>
            
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold mb-3 lg:mb-4 xl:mb-5 leading-tight">
              Create New
              <br />
              <span className="text-tertiary">Password</span>
            </h2>
            <p className="text-sm lg:text-base xl:text-lg text-white/90 leading-relaxed max-w-sm lg:max-w-md">
              Choose a strong password to keep your account secure. Make sure it's something you'll remember.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Password Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-2 lg:p-3 xl:p-4 overflow-y-auto">
        <div className="w-full max-w-xs lg:max-w-sm xl:max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-3">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">Benders Workflow</h1>
                <p className="text-gray-600 text-xs">Reset Password</p>
              </div>
            </div>
          </div>

          {/* Reset Password Card */}
          <div className="bg-white rounded-lg lg:rounded-xl xl:rounded-2xl shadow-large p-3 lg:p-4 xl:p-5 border border-gray-100">
            <div className="text-center mb-4 lg:mb-6">
              <div className="flex items-center justify-center gap-1 lg:gap-1.5 mb-2 lg:mb-3">
                <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-tertiary" />
                <h2 className="text-lg lg:text-xl xl:text-2xl font-bold text-gray-900">Reset Password</h2>
              </div>
              <p className="text-gray-600 text-sm lg:text-base leading-relaxed">
                Enter your new password below. Make sure it's strong and secure.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
              {/* General Error */}
              {errors.general && (
                <ErrorDisplay error={errors.general} />
              )}

              {/* New Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className={`w-4 h-4 transition-colors ${
                      errors.password ? 'text-red-400' : 'text-gray-400'
                    }`} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-10 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                      errors.password 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50' 
                        : 'border-gray-200 focus:border-primary focus:ring-primary/20 bg-white'
                    }`}
                    placeholder="Enter your new password"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <div id="password-error" className="mt-2">
                    <ErrorDisplay error={errors.password} />
                  </div>
                )}
                {/* Password strength indicator */}
                {formData.password && !errors.password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            passwordStrength.color === 'red' ? 'bg-red-500 w-1/4' :
                            passwordStrength.color === 'yellow' ? 'bg-yellow-500 w-2/4' :
                            passwordStrength.color === 'blue' ? 'bg-blue-500 w-3/4' :
                            'bg-green-500 w-full'
                          }`}
                        ></div>
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength.color === 'red' ? 'text-red-600' :
                        passwordStrength.color === 'yellow' ? 'text-yellow-600' :
                        passwordStrength.color === 'blue' ? 'text-blue-600' :
                        'text-green-600'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className={`w-4 h-4 transition-colors ${
                      errors.confirmPassword ? 'text-red-400' : 'text-gray-400'
                    }`} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-10 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                      errors.confirmPassword 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50' 
                        : formData.confirmPassword && formData.confirmPassword === formData.password
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50'
                        : 'border-gray-200 focus:border-primary focus:ring-primary/20 bg-white'
                    }`}
                    placeholder="Confirm your new password"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                    aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                    aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1">
                    {formData.confirmPassword && formData.confirmPassword === formData.password && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="p-0.5"
                      disabled={isSubmitting}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                {errors.confirmPassword && (
                  <div id="confirm-password-error" className="mt-2">
                    <ErrorDisplay error={errors.confirmPassword} />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !formData.password || !formData.confirmPassword}
                className={`w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  isSubmitting || !formData.password || !formData.confirmPassword
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Resetting password...
                  </>
                ) : (
                  <>
                    Reset Password
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">
              © 2024 Benders Workflow. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}