import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
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
  User,
  CheckCircle,
  AlertCircle,
  Info,
  Github
} from 'lucide-react';

interface AuthFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AuthFormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
  type?: 'error' | 'warning' | 'info';
}

type AuthMode = 'login' | 'signup';
type LoginMode = 'password' | 'magic-link';

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithEmail, register, loginWithGoogle, loginWithGitHub, sendMagicLink, isLoading } = useAuth();
  
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [formData, setFormData] = useState<AuthFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Set initial auth mode based on URL
  useEffect(() => {
    if (location.pathname === '/signup') {
      setAuthMode('signup');
    } else {
      setAuthMode('login');
    }
  }, [location.pathname]);

  // Enhanced validation rules
  const nameValidationRules: ValidationRule[] = [
    {
      test: (value) => value.trim().length > 0,
      message: 'Full name is required',
      type: 'error'
    },
    {
      test: (value) => value.trim().length >= 2,
      message: 'Name must be at least 2 characters',
      type: 'error'
    }
  ];

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
    }
  ];

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
    }
  ];

  const confirmPasswordValidationRules: ValidationRule[] = [
    {
      test: (value) => value.length > 0,
      message: 'Please confirm your password',
      type: 'error'
    },
    {
      test: (value) => value === formData.password,
      message: 'Passwords do not match',
      type: 'error'
    }
  ];

  // Real-time validation function
  const validateField = (fieldName: string, value: string): string | null => {
    let rules: ValidationRule[] = [];
    
    switch (fieldName) {
      case 'name':
        rules = nameValidationRules;
        break;
      case 'email':
        rules = emailValidationRules;
        break;
      case 'password':
        rules = passwordValidationRules;
        break;
      case 'confirmPassword':
        rules = confirmPasswordValidationRules;
        break;
    }
    
    for (const rule of rules) {
      if (!rule.test(value)) {
        return rule.message;
      }
    }
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Real-time validation
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error || undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: AuthFormErrors = {};
    
    // Always validate email
    const emailError = validateField('email', formData.email);
    if (emailError) newErrors.email = emailError;

    if (authMode === 'login' && loginMode === 'password') {
      // Login mode - only validate email and password
      const passwordError = validateField('password', formData.password);
      if (passwordError) newErrors.password = passwordError;
    } else if (authMode === 'signup') {
      // Signup mode - validate all fields
      const nameError = validateField('name', formData.name);
      if (nameError) newErrors.name = nameError;
      
      const passwordError = validateField('password', formData.password);
      if (passwordError) newErrors.password = passwordError;
      
      const confirmPasswordError = validateField('confirmPassword', formData.confirmPassword);
      if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enhanced submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark relevant fields as touched
    if (authMode === 'login') {
      if (loginMode === 'password') {
        setTouchedFields(new Set(['email', 'password']));
      } else {
        setTouchedFields(new Set(['email']));
      }
    } else {
      setTouchedFields(new Set(['name', 'email', 'password', 'confirmPassword']));
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (authMode === 'login') {
        if (loginMode === 'password') {
          // Email/Password login
          await loginWithEmail({
            email: formData.email.trim().toLowerCase(),
            password: formData.password
          });
          navigate('/app/dashboard');
        } else {
          // Magic link login
          await sendMagicLink(formData.email.trim().toLowerCase());
          setMagicLinkSent(true);
        }
      } else {
        // Signup
        await register({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: 'user'
        });
        navigate('/app/dashboard');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      
      // Enhanced error message handling
      let errorMessage = authMode === 'login' ? 'Login failed. Please try again.' : 'Registration failed. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('email')) {
          errorMessage = authMode === 'login' 
            ? 'Invalid email or password.' 
            : 'An account with this email already exists.';
        } else if (error.message.includes('password')) {
          errorMessage = 'Password does not meet requirements.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      if (provider === 'google') {
        await loginWithGoogle();
      } else {
        await loginWithGitHub();
      }
    } catch (error) {
      console.error(`${provider} login error:`, error);
      setErrors({
        general: `${provider.charAt(0).toUpperCase() + provider.slice(1)} login failed. Please try again.`,
      });
    }
  };

  const handleModeSwitch = (newMode: AuthMode) => {
    setAuthMode(newMode);
    setErrors({});
    setTouchedFields(new Set());
    setMagicLinkSent(false);
    setLoginMode('password');
    // Reset form data when switching modes
    setFormData({
      name: '',
      email: formData.email, // Keep email when switching
      password: '',
      confirmPassword: ''
    });
  };

  const ErrorDisplay = ({ error, type = 'error' }: { error: string; type?: 'error' | 'warning' | 'info' }) => {
    const getStyles = () => {
      switch (type) {
        case 'warning':
          return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        case 'info':
          return 'text-blue-600 bg-blue-50 border-blue-200';
        default:
          return 'text-red-600 bg-red-50 border-red-200';
      }
    };

    const getIcon = () => {
      switch (type) {
        case 'warning':
          return <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />;
        case 'info':
          return <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />;
        default:
          return <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />;
      }
    };

    return (
      <div className={`flex items-start gap-1.5 p-1.5 rounded-md border text-xs ${getStyles()}`}>
        {getIcon()}
        <span className="leading-relaxed">{error}</span>
      </div>
    );
  };

  

  if (magicLinkSent) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl lg:rounded-2xl shadow-xl p-4 lg:p-6 border border-gray-100 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-600 text-xs lg:text-sm mb-4">
              We've sent a magic link to <strong>{formData.email}</strong>. 
              Click the link in the email to sign in.
            </p>
            <button
              onClick={() => {
                setMagicLinkSent(false);
                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
              }}
              className="text-primary hover:text-primary/80 font-medium transition-colors text-xs"
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    );
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
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center gap-2 lg:gap-3 mb-4 lg:mb-6">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-tertiary to-secondary rounded-xl lg:rounded-2xl flex items-center justify-center shadow-xl">
                <Target className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl xl:text-2xl font-bold">Benders Workflow</h1>
                <p className="text-white/80 text-xs lg:text-sm">Business Process Management</p>
              </div>
            </div>
            
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold mb-3 lg:mb-4 leading-tight">
              {authMode === 'login' ? (
                <>
                  Transform Your
                  <br />
                  <span className="text-tertiary">Business Operations</span>
                </>
              ) : (
                <>
                  Join Thousands of
                  <br />
                  <span className="text-tertiary">Successful Teams</span>
                </>
              )}
            </h2>
            <p className="text-sm lg:text-base text-white/90 leading-relaxed max-w-md">
              {authMode === 'login' 
                ? 'Streamline workflows, boost productivity, and drive growth with our comprehensive business management platform.'
                : 'Start your journey to streamlined workflows and improved productivity. Create your account in just a few minutes.'
              }
            </p>
          </div>

          {/* Features - Compact */}
          <div className="space-y-3 lg:space-y-4">
            <div className="flex items-start gap-2 lg:gap-3">
              <div className="w-6 h-6 lg:w-8 lg:h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                <Workflow className="w-3 h-3 lg:w-4 lg:h-4 text-tertiary" />
              </div>
              <div>
                <h3 className="text-xs lg:text-sm font-semibold text-white mb-0.5">Workflow Management</h3>
                <p className="text-xs text-white/70 leading-relaxed">Design and manage complex business processes</p>
              </div>
            </div>
            <div className="flex items-start gap-2 lg:gap-3">
              <div className="w-6 h-6 lg:w-8 lg:h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                <Shield className="w-3 h-3 lg:w-4 lg:h-4 text-tertiary" />
              </div>
              <div>
                <h3 className="text-xs lg:text-sm font-semibold text-white mb-0.5">Enterprise Security</h3>
                <p className="text-xs text-white/70 leading-relaxed">Bank-grade security with end-to-end encryption</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-3 lg:p-4 xl:p-6">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">Benders Workflow</h1>
                <p className="text-gray-600 text-xs">Business Management</p>
              </div>
            </div>
          </div>

          {/* Auth Card */}
          <div className="bg-white rounded-xl lg:rounded-2xl shadow-xl p-4 lg:p-6 border border-gray-100">
            {/* Mode Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-0.5 mb-4 lg:mb-6">
              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all duration-200 ${
                  authMode === 'login'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch('signup')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all duration-200 ${
                  authMode === 'signup'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign Up
              </button>
            </div>

            <div className="text-center mb-4 lg:mb-6">
              <div className="flex items-center justify-center gap-1.5 mb-2 lg:mb-3">
                <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-tertiary" />
                <h2 className="text-lg lg:text-xl xl:text-2xl font-bold text-gray-900">
                  {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
              </div>
              <p className="text-gray-600 text-xs lg:text-sm">
                {authMode === 'login' 
                  ? 'Sign in to access your workspace'
                  : 'Join us and start streamlining your workflows'
                }
              </p>
            </div>

            {/* Login Mode Tabs (Only for login) */}
            {authMode === 'login' && (
              <div className="flex bg-gray-50 rounded-md p-0.5 mb-3">
                <button
                  type="button"
                  onClick={() => setLoginMode('password')}
                  className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-all duration-200 ${
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
                  className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-all duration-200 ${
                    loginMode === 'magic-link'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Magic Link
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2 lg:space-y-3">
              {/* General Error */}
              {errors.general && (
                <ErrorDisplay error={errors.general} type="error" />
              )}

              {/* Name Field - Only for signup */}
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 lg:pl-2.5 flex items-center pointer-events-none">
                      <User className={`w-3 h-3 lg:w-3.5 lg:h-3.5 transition-colors ${
                        errors.name ? 'text-red-400' : 'text-gray-400'
                      }`} />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onBlur={() => setTouchedFields(prev => new Set(prev).add('name'))}
                      className={`w-full pl-7 lg:pl-8 pr-2 lg:pr-2.5 py-1.5 lg:py-2 xl:py-2.5 border rounded-md lg:rounded-lg text-xs focus:outline-none focus:ring-2 transition-all duration-200 ${
                        errors.name 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50' 
                          : touchedFields.has('name') && !errors.name && formData.name
                          ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50'
                          : 'border-gray-200 focus:border-primary focus:ring-primary/20 bg-white'
                      }`}
                      placeholder="Enter your full name"
                      disabled={isLoading || isSubmitting}
                      autoComplete="name"
                    />
                    {touchedFields.has('name') && !errors.name && formData.name && (
                      <div className="absolute inset-y-0 right-0 pr-2 lg:pr-2.5 flex items-center">
                        <CheckCircle className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {errors.name && (
                    <div className="mt-1">
                      <ErrorDisplay error={errors.name} type="error" />
                    </div>
                  )}
                </div>
              )}

              {/* Email Field */}
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
                  />
                  {touchedFields.has('email') && !errors.email && formData.email && (
                    <div className="absolute inset-y-0 right-0 pr-2 lg:pr-2.5 flex items-center">
                      <CheckCircle className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-green-500" />
                    </div>
                  )}
                </div>
                {errors.email && (
                  <div className="mt-1">
                    <ErrorDisplay error={errors.email} type="error" />
                  </div>
                )}
              </div>

              {/* Password Field - For login password mode and signup */}
              {(authMode === 'login' && loginMode === 'password') || authMode === 'signup' ? (
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
                      placeholder={authMode === 'login' ? 'Enter your password' : 'Create a password'}
                      disabled={isLoading || isSubmitting}
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <div className="absolute inset-y-0 right-0 pr-2 lg:pr-2.5 flex items-center gap-1">
                      {touchedFields.has('password') && !errors.password && formData.password && (
                        <CheckCircle className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-green-500" />
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                        disabled={isLoading || isSubmitting}
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
                    <div className="mt-1">
                      <ErrorDisplay error={errors.password} type="error" />
                    </div>
                  )}
                </div>
              ) : null}

              {/* Confirm Password Field - Only for signup */}
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 lg:pl-2.5 flex items-center pointer-events-none">
                      <CheckCircle className={`w-3 h-3 lg:w-3.5 lg:h-3.5 transition-colors ${
                        errors.confirmPassword ? 'text-red-400' : 'text-gray-400'
                      }`} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      onBlur={() => setTouchedFields(prev => new Set(prev).add('confirmPassword'))}
                      className={`w-full pl-7 lg:pl-8 pr-7 lg:pr-8 py-1.5 lg:py-2 xl:py-2.5 border rounded-md lg:rounded-lg text-xs focus:outline-none focus:ring-2 transition-all duration-200 ${
                        errors.confirmPassword 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50' 
                          : touchedFields.has('confirmPassword') && !errors.confirmPassword && formData.confirmPassword
                          ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50'
                          : 'border-gray-200 focus:border-primary focus:ring-primary/20 bg-white'
                      }`}
                      placeholder="Confirm your password"
                      disabled={isLoading || isSubmitting}
                      autoComplete="new-password"
                    />
                    <div className="absolute inset-y-0 right-0 pr-2 lg:pr-2.5 flex items-center gap-1">
                      {touchedFields.has('confirmPassword') && !errors.confirmPassword && formData.confirmPassword && (
                        <CheckCircle className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-green-500" />
                      )}
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                        disabled={isLoading || isSubmitting}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                  {errors.confirmPassword && (
                    <div className="mt-1">
                      <ErrorDisplay error={errors.confirmPassword} type="error" />
                    </div>
                  )}
                </div>
              )}

              {/* Magic Link Info - Only for login magic link mode */}
              {authMode === 'login' && loginMode === 'magic-link' && (
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

              {/* Remember Me & Forgot Password - Only for login password mode */}
              {authMode === 'login' && loginMode === 'password' && (
                <div className="flex items-center justify-between pt-0.5 lg:pt-1">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-primary focus:ring-primary focus:ring-offset-0 border-gray-300 rounded transition-colors disabled:opacity-50"
                      disabled={isLoading || isSubmitting}
                    />
                    <span className="ml-1 lg:ml-1.5 text-xs text-gray-700 group-hover:text-gray-900 transition-colors">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('magic-link');
                      setErrors({});
                    }}
                    className="text-primary hover:text-primary/80 font-medium transition-colors text-xs underline-offset-2 hover:underline"
                    disabled={isLoading || isSubmitting}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Terms and Conditions - Only for signup */}
              {authMode === 'signup' && (
                <div className="pt-0.5 lg:pt-1">
                  <label className="flex items-start cursor-pointer group">
                    <input
                      type="checkbox"
                      className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-primary focus:ring-primary focus:ring-offset-0 border-gray-300 rounded transition-colors disabled:opacity-50 mt-1"
                      disabled={isLoading || isSubmitting}
                      required
                    />
                    <span className="ml-1 lg:ml-1.5 text-xs text-gray-700 group-hover:text-gray-900 transition-colors leading-relaxed">
                      I agree to the{' '}
                      <button type="button" className="text-primary hover:text-primary/80 font-medium transition-colors underline-offset-2 hover:underline">
                        Terms of Service
                      </button>
                      {' '}and{' '}
                      <button type="button" className="text-primary hover:text-primary/80 font-medium transition-colors underline-offset-2 hover:underline">
                        Privacy Policy
                      </button>
                    </span>
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isSubmitting || !formData.email || 
                  (authMode === 'login' && loginMode === 'password' && !formData.password) ||
                  (authMode === 'signup' && (!formData.name || !formData.password || !formData.confirmPassword))}
                className={`w-full py-1.5 lg:py-2 xl:py-2.5 rounded-md lg:rounded-lg font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-1 lg:gap-1.5 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  isLoading || isSubmitting || !formData.email || 
                  (authMode === 'login' && loginMode === 'password' && !formData.password) ||
                  (authMode === 'signup' && (!formData.name || !formData.password || !formData.confirmPassword))
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {isLoading || isSubmitting ? (
                  <>
                    <div className="w-3 h-3 lg:w-3.5 lg:h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {authMode === 'login' 
                      ? (loginMode === 'password' ? 'Signing in...' : 'Sending magic link...')
                      : 'Creating account...'
                    }
                  </>
                ) : (
                  <>
                    {authMode === 'login' 
                      ? (loginMode === 'password' ? 'Sign In' : 'Send Magic Link')
                      : 'Create Account'
                    }
                    <ArrowRight className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-3 lg:my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading || isSubmitting}
                className="flex items-center justify-center gap-1.5 py-1.5 lg:py-2 px-3 border border-gray-200 rounded-md lg:rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('github')}
                disabled={isLoading || isSubmitting}
                className="flex items-center justify-center gap-1.5 py-1.5 lg:py-2 px-3 border border-gray-200 rounded-md lg:rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Github className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                GitHub
              </button>
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
  );
} 