import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  ArrowRight, 
  Target, 
  Sparkles,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

interface ForgotPasswordFormData {
  email: string
}

interface ForgotPasswordFormErrors {
  email?: string
  general?: string
}

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: ''
  })
  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // Email validation
  const validateEmail = (email: string): string | null => {
    if (!email.trim()) {
      return 'Email address is required'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address'
    }
    if (email.length > 254) {
      return 'Email address is too long'
    }
    return null
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    setFormData({ email: value })
    
    // Clear errors on input
    if (errors.email || errors.general) {
      setErrors({})
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const emailError = validateEmail(formData.email)
    if (emailError) {
      setErrors({ email: emailError })
      return
    }
    
    setIsSubmitting(true)
    setErrors({})
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send reset email')
      }

      setEmailSent(true)
    } catch (error) {
      console.error('Forgot password error:', error)
      
      let errorMessage = 'Failed to send password reset email. Please try again.'
      
      if (error instanceof Error) {
        const message = error.message.toLowerCase()
        
        if (message.includes('network') || message.includes('fetch')) {
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

  // Success display
  const SuccessDisplay = ({ message }: { message: string }) => (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
        <p className="text-sm font-medium text-green-700 leading-relaxed">{message}</p>
      </div>
    </div>
  )

  if (emailSent) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-large p-6 lg:p-8 border border-gray-100 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-600 mb-6">
              We've sent password reset instructions to <strong>{formData.email}</strong>. 
              Click the link in the email to reset your password.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setEmailSent(false)
                  setFormData({ email: '' })
                }}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg"
              >
                Send another email
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full text-gray-600 hover:text-gray-800 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Left Side - Branding (same as login page) */}
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
              Secure Password
              <br />
              <span className="text-tertiary">Recovery</span>
            </h2>
            <p className="text-sm lg:text-base xl:text-lg text-white/90 leading-relaxed max-w-sm lg:max-w-md">
              We'll help you regain access to your account securely. Enter your email address to get started.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Forgot Password Form */}
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
                <p className="text-gray-600 text-xs">Password Recovery</p>
              </div>
            </div>
          </div>

          {/* Forgot Password Card */}
          <div className="bg-white rounded-lg lg:rounded-xl xl:rounded-2xl shadow-large p-3 lg:p-4 xl:p-5 border border-gray-100">
            <div className="text-center mb-4 lg:mb-6">
              <div className="flex items-center justify-center gap-1 lg:gap-1.5 mb-2 lg:mb-3">
                <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-tertiary" />
                <h2 className="text-lg lg:text-xl xl:text-2xl font-bold text-gray-900">Forgot Password?</h2>
              </div>
              <p className="text-gray-600 text-sm lg:text-base leading-relaxed">
                No worries! Enter your email address and we'll send you instructions to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
              {/* General Error */}
              {errors.general && (
                <ErrorDisplay error={errors.general} />
              )}

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className={`w-4 h-4 transition-colors ${
                      errors.email ? 'text-red-400' : 'text-gray-400'
                    }`} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-3 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                      errors.email 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50' 
                        : 'border-gray-200 focus:border-primary focus:ring-primary/20 bg-white'
                    }`}
                    placeholder="Enter your email address"
                    disabled={isSubmitting}
                    autoComplete="email"
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {/* Success indicator */}
                  {formData.email && !errors.email && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  )}
                </div>
                {errors.email && (
                  <div id="email-error" className="mt-2">
                    <ErrorDisplay error={errors.email} />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !formData.email}
                className={`w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  isSubmitting || !formData.email
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending reset email...
                  </>
                ) : (
                  <>
                    Send Reset Email
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-4 lg:mt-6 text-center">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm flex items-center justify-center gap-2 mx-auto"
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </button>
            </div>
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