import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { TwoFactorVerification } from '../components/TwoFactorVerification';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Target, 
  Sparkles,
  Shield,
  Workflow,
  BarChart3,
  Github,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

interface LoginFormData {
  email: string
  password: string
}

interface LoginFormErrors {
  email?: string
  password?: string
  general?: string
}

interface ValidationRule {
  test: (value: string) => boolean
  message: string
  type?: 'error' | 'warning' | 'info'
}

interface TwoFactorData {
  email: string
  loginType: 'password' | 'magic-link'
  magicToken?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const { loginWithEmail, loginWithGoogle, loginWithGitHub, sendMagicLink, isLoading } = useAuth()
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [loginMode, setLoginMode] = useState<'password' | 'magic-link'>('password')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rememberMe, setRememberMe] = useState(false) // Add remember me state
  
  // 2FA states
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorData | null>(null)

  // Load remember me preference from localStorage on component mount
  useEffect(() => {
    const savedRememberMe = localStorage.getItem('rememberMe')
    if (savedRememberMe === 'true') {
      setRememberMe(true)
    }
  }, [])

  // Enhanced validation rules
  const emailValidationRules: ValidationRule[] = [
    {
      test: (value) => value.length > 0,
      message: 'Email address is required',
      type: 'error'
    },
    {
      test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Please enter a valid email address',
      type: 'error'
    },
    {
      test: (value) => value.length <= 254,
      message: 'Email address is too long',
      type: 'error'
    }
  ]

  const passwordValidationRules: ValidationRule[] = [
    {
      test: (value) => value.length > 0,
      message: 'Password is required',
      type: 'error'
    },
    {
      test: (value) => value.length >= 6,
      message: 'Password must be at least 6 characters long',
      type: 'error'
    },
    {
      test: (value) => value.length <= 128,
      message: 'Password is too long',
      type: 'error'
    }
  ]

  // Real-time validation function
  const validateField = (fieldName: string, value: string): string | null => {
    const rules = fieldName === 'email' ? emailValidationRules : passwordValidationRules
    
    for (const rule of rules) {
      if (!rule.test(value)) {
        return rule.message
      }
    }
    return null
  }

  // Enhanced input change handler with real-time validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Mark field as touched
    setTouchedFields(prev => new Set(prev).add(name))
    
    // Real-time validation for touched fields
    if (touchedFields.has(name) || value.length > 0) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error || undefined }))
    }
    
    // Clear general error when user starts typing
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }))
    }
  }

  // Enhanced form validation
  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {}
    
    // Validate email
    const emailError = validateField('email', formData.email)
    if (emailError) {
      newErrors.email = emailError
    }
    
    // Validate password (only in password mode)
    if (loginMode === 'password') {
      const passwordError = validateField('password', formData.password)
      if (passwordError) {
        newErrors.password = passwordError
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle 2FA verification success
  const handle2FASuccess = async (authData: any) => {
    try {
      // Store the authentication data (token, user info)
      localStorage.setItem('authToken', authData.token)
      localStorage.setItem('authUser', JSON.stringify(authData.user))
      localStorage.setItem('authExpires', authData.expires)
      
      // Reset 2FA state
      setShowTwoFactor(false)
      setTwoFactorData(null)
      
      // Navigate to dashboard
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to complete 2FA login:', error)
      setErrors({ general: 'Login failed after 2FA verification. Please try again.' })
      setShowTwoFactor(false)
    }
  }

  // Handle going back from 2FA verification
  const handle2FABack = () => {
    setShowTwoFactor(false)
    setTwoFactorData(null)
    setFormData({ email: '', password: '' })
    setErrors({})
  }

  // Enhanced submit handler with remember me support
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouchedFields(new Set(['email', 'password']))
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      if (loginMode === 'password') {
        // Save remember me preference
        localStorage.setItem('rememberMe', rememberMe.toString())
        
        // Email/Password login with 2FA support and remember me
        const result = await loginWithEmail({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          rememberMe // Pass remember me option to login function
        })

        // Check if 2FA is required
        if ('requiresTwoFactor' in result) {
          setTwoFactorData({
            email: result.email,
            loginType: 'password'
          })
          setShowTwoFactor(true)
          return
        }

        // Regular login success (no 2FA) - user is already set by auth context
        navigate('/dashboard')
      } else {
        // Magic link login
        await sendMagicLink(formData.email.trim().toLowerCase())
        setMagicLinkSent(true)
      }
    } catch (error) {
      console.error('Login failed:', error)
      
      // Enhanced error message handling
      let errorMessage = 'Login failed. Please try again.'
      
      if (error instanceof Error) {
        const message = error.message.toLowerCase()
        
        if (message.includes('invalid credentials') || message.includes('invalid email or password')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
        } else if (message.includes('user not found')) {
          errorMessage = 'No account found with this email address. Please check your email or contact admin.'
        } else if (message.includes('account locked') || message.includes('too many attempts')) {
          errorMessage = 'Account temporarily locked due to too many failed attempts. Please try again later.'
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

  // Enhanced social login with better error handling
  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      setErrors({}) // Clear any existing errors
      
      if (provider === 'google') {
        await loginWithGoogle()
      } else {
        await loginWithGitHub()
      }
    } catch (error) {
      console.error(`${provider} login failed:`, error)
      
      let errorMessage = `${provider === 'google' ? 'Google' : 'GitHub'} login failed. Please try again.`
      
      if (error instanceof Error) {
        const message = error.message.toLowerCase()
        
        if (message.includes('popup') || message.includes('blocked')) {
          errorMessage = 'Popup blocked. Please allow popups for this site and try again.'
        } else if (message.includes('cancelled') || message.includes('closed')) {
          errorMessage = 'Login was cancelled. Please try again.'
        } else if (message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        }
      }
      
      setErrors({ general: errorMessage })
    }
  }

  // Professional error display component
  const ErrorDisplay = ({ error, type = 'error' }: { error: string; type?: 'error' | 'warning' | 'info' }) => {
    const icons = {
      error: AlertCircle,
      warning: Info,
      info: Info
    }
    
    const styles = {
      error: 'bg-red-50 border-red-200 text-red-700',
      warning: 'bg-amber-50 border-amber-200 text-amber-700',
      info: 'bg-blue-50 border-blue-200 text-blue-700'
    }
    
    const iconStyles = {
      error: 'text-red-500',
      warning: 'text-amber-500',
      info: 'text-blue-500'
    }
    
    const IconComponent = icons[type]
    
    return (
      <div className={`border rounded-lg p-3 ${styles[type]}`}>
        <div className="flex items-start gap-2">
          <IconComponent className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconStyles[type]}`} />
          <p className="text-sm font-medium leading-relaxed">{error}</p>
        </div>
      </div>
    )
  }

  // Professional success display for magic link
  const SuccessDisplay = ({ message }: { message: string }) => (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
        <p className="text-sm font-medium text-green-700 leading-relaxed">{message}</p>
      </div>
    </div>
  )

  const features = [
    {
      icon: Workflow,
      title: 'Workflow Management',
      description: 'Design and manage complex business processes with our visual workflow builder'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-grade security with end-to-end encryption and secure data handling'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Real-time dashboards and comprehensive reporting for data-driven decisions'
    }
  ]

  if (magicLinkSent) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-large p-6 lg:p-8 border border-gray-100 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-600 mb-6">
              We've sent a magic link to <strong>{formData.email}</strong>. 
              Click the link in the email to sign in.
            </p>
            <button
              onClick={() => {
                setMagicLinkSent(false)
                setFormData({ email: '', password: '' })
              }}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show 2FA verification screen
  if (showTwoFactor && twoFactorData) {
    return (
      <TwoFactorVerification
        email={twoFactorData.email}
        loginType={twoFactorData.loginType}
        onVerificationSuccess={handle2FASuccess}
        onBack={handle2FABack}
        magicToken={twoFactorData.magicToken}
      />
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-gradient-to-br from-primary via-accent to-primary">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/10 pointer-events-none"></div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-tertiary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-secondary/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-6 lg:px-8 xl:px-12 py-8 lg:py-10 xl:py-12 text-white">
          {/* Logo & Brand */}
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
              Transform Your
              <br />
              <span className="text-tertiary">Business Operations</span>
            </h2>
            <p className="text-sm lg:text-base xl:text-lg text-white/90 leading-relaxed max-w-sm lg:max-w-md">
              Streamline workflows, boost productivity, and drive growth with our comprehensive business management platform.
            </p>
          </div>

          {/* Features - Compact for laptop screens */}
          <div className="space-y-3 lg:space-y-4 xl:space-y-5">
            {features.slice(0, 2).map((feature, index) => (
              <div key={index} className="flex items-start gap-2 lg:gap-3 xl:gap-4">
                <div className="w-7 h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                  <feature.icon className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-4.5 xl:h-4.5 text-tertiary" />
                </div>
                <div>
                  <h3 className="text-xs lg:text-sm xl:text-base font-semibold text-white mb-0.5 lg:mb-1">{feature.title}</h3>
                  <p className="text-xs lg:text-xs xl:text-sm text-white/70 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
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
                <p className="text-gray-600 text-xs">Business Management</p>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-lg lg:rounded-xl xl:rounded-2xl shadow-large p-3 lg:p-4 xl:p-5 border border-gray-100">
            <div className="text-center mb-3 lg:mb-4">
              <div className="flex items-center justify-center gap-1 lg:gap-1.5 mb-1 lg:mb-2">
                <Sparkles className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-tertiary" />
                <h2 className="text-base lg:text-lg xl:text-xl font-bold text-gray-900">Welcome Back</h2>
              </div>
              <p className="text-gray-600 text-xs lg:text-sm">Sign in to access your workspace</p>
            </div>

            {/* Login Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-3 lg:mb-4">
              <button
                type="button"
                onClick={() => setLoginMode('password')}
                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                  loginMode === 'password'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('magic-link')}
                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                  loginMode === 'magic-link'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Magic Link
              </button>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-1.5 lg:space-y-2 mb-3 lg:mb-4">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                className="w-full py-1.5 lg:py-2 xl:py-2.5 border border-gray-200 hover:border-gray-300 text-gray-700 rounded-md lg:rounded-lg font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1.5 lg:gap-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              
              <button
                type="button"
                onClick={() => handleSocialLogin('github')}
                disabled={isLoading}
                className="w-full py-1.5 lg:py-2 xl:py-2.5 border border-gray-200 hover:border-gray-300 text-gray-700 rounded-md lg:rounded-lg font-medium text-xs transition-all duration-200 flex items-center justify-center gap-1.5 lg:gap-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Github className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                Continue with GitHub
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-2 lg:mb-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">
                  or continue with {loginMode === 'password' ? 'email' : 'magic link'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2 lg:space-y-3">
              {/* General Error - Enhanced Display */}
              {errors.general && (
                <ErrorDisplay error={errors.general} type="error" />
              )}

              {/* Email Field - Enhanced with Real-time Validation */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 lg:pl-2.5 flex items-center pointer-events-none">
                    <Mail className={`w-3 h-3 lg:w-3.5 lg:h-3.5 transition-colors ${
                      errors.email ? 'text-red-400' : 'text-gray-400'
                    }`} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={() => setTouchedFields(prev => new Set(prev).add('email'))}
                    className={`w-full pl-7 lg:pl-8 pr-2 lg:pr-2.5 py-1.5 lg:py-2 xl:py-2.5 border rounded-md lg:rounded-lg text-xs focus:outline-none focus:ring-2 transition-all duration-200 ${
                      errors.email 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50' 
                        : touchedFields.has('email') && !errors.email && formData.email
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50'
                        : 'border-gray-200 focus:border-primary focus:ring-primary/20 bg-white'
                    }`}
                    placeholder="Enter your email address"
                    disabled={isLoading || isSubmitting}
                    autoComplete="email"
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {/* Success indicator */}
                  {touchedFields.has('email') && !errors.email && formData.email && (
                    <div className="absolute inset-y-0 right-0 pr-2 lg:pr-2.5 flex items-center">
                      <CheckCircle className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-green-500" />
                    </div>
                  )}
                </div>
                {errors.email && (
                  <div id="email-error" className="mt-1">
                    <ErrorDisplay error={errors.email} type="error" />
                  </div>
                )}
              </div>

              {/* Password Field - Enhanced with Real-time Validation (Only in password mode) */}
              {loginMode === 'password' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 lg:pl-2.5 flex items-center pointer-events-none">
                      <Lock className={`w-3 h-3 lg:w-3.5 lg:h-3.5 transition-colors ${
                        errors.password ? 'text-red-400' : 'text-gray-400'
                      }`} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={() => setTouchedFields(prev => new Set(prev).add('password'))}
                      className={`w-full pl-7 lg:pl-8 pr-7 lg:pr-8 py-1.5 lg:py-2 xl:py-2.5 border rounded-md lg:rounded-lg text-xs focus:outline-none focus:ring-2 transition-all duration-200 ${
                        errors.password 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50' 
                          : touchedFields.has('password') && !errors.password && formData.password
                          ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50'
                          : 'border-gray-200 focus:border-primary focus:ring-primary/20 bg-white'
                      }`}
                      placeholder="Enter your password"
                      disabled={isLoading || isSubmitting}
                      autoComplete="current-password"
                      aria-invalid={errors.password ? 'true' : 'false'}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                    />
                    <div className="absolute inset-y-0 right-0 pr-2 lg:pr-2.5 flex items-center gap-1">
                      {/* Success indicator */}
                      {touchedFields.has('password') && !errors.password && formData.password && (
                        <CheckCircle className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-green-500" />
                      )}
                      {/* Show/Hide password toggle */}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                        disabled={isLoading || isSubmitting}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                  {errors.password && (
                    <div id="password-error" className="mt-1">
                      <ErrorDisplay error={errors.password} type="error" />
                    </div>
                  )}
                  
                  {/* Password strength indicator (optional) */}
                  {touchedFields.has('password') && formData.password && !errors.password && (
                    <div className="mt-1">
                      <SuccessDisplay message="Password looks good!" />
                    </div>
                  )}
                </div>
              )}

              {/* Magic Link Info - Only in magic link mode */}
              {loginMode === 'magic-link' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 lg:p-3">
                  <div className="flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-500" />
                    <div>
                      <p className="text-xs font-medium text-blue-700 mb-1">Magic Link Login</p>
                      <p className="text-xs text-blue-600 leading-relaxed">
                        We'll send a secure login link to your email. No password required!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Remember Me & Forgot Password - Enhanced (Only in password mode) */}
              {loginMode === 'password' && (
                <div className="flex items-center justify-between pt-0.5 lg:pt-1">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-primary focus:ring-primary focus:ring-offset-0 border-gray-300 rounded transition-colors disabled:opacity-50 cursor-pointer"
                      disabled={isLoading || isSubmitting}
                    />
                    <span className="ml-1 lg:ml-1.5 text-xs text-gray-700 group-hover:text-gray-900 transition-colors select-none">
                      Remember me for 30 days
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-primary hover:text-primary/80 font-medium transition-colors text-xs underline-offset-2 hover:underline"
                    disabled={isLoading || isSubmitting}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Enhanced Submit Button with Loading States */}
              <button
                type="submit"
                disabled={isLoading || isSubmitting || !formData.email || (loginMode === 'password' && !formData.password)}
                className={`w-full py-1.5 lg:py-2 xl:py-2.5 rounded-md lg:rounded-lg font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-1 lg:gap-1.5 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  isLoading || isSubmitting || !formData.email || (loginMode === 'password' && !formData.password)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {isLoading || isSubmitting ? (
                  <>
                    <div className="w-3 h-3 lg:w-3.5 lg:h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {loginMode === 'password' ? 'Signing in...' : 'Sending magic link...'}
                  </>
                ) : (
                  <>
                    {loginMode === 'password' ? 'Sign In' : 'Send Magic Link'}
                    <ArrowRight className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-2 lg:mt-3 text-center">
              <p className="text-gray-600 text-xs">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-2 lg:mt-3 text-center">
            <p className="text-xs text-gray-500">
              © 2024 Benders Workflow. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}