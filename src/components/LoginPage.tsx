import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Github
} from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginPageProps {
  onLogin?: (credentials: LoginFormData) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof LoginFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onLogin) {
        onLogin(formData);
      } else {
        // Default behavior - navigate to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    try {
      // Simulate social login
      console.log(`Logging in with ${provider}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/dashboard');
    } catch (error) {
      console.error(`${provider} login failed:`, error);
    } finally {
      setIsLoading(false);
    }
  };

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
  ];

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
                <span className="px-2 bg-white text-gray-500">or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2 lg:space-y-3">
              {/* Email Field */}
              <div>
                <label className="form-label text-xs">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 lg:pl-2.5 flex items-center pointer-events-none">
                    <Mail className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-7 lg:pl-8 pr-2 lg:pr-2.5 py-1.5 lg:py-2 xl:py-2.5 border rounded-md lg:rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                      errors.email 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red/20 bg-red-50' 
                        : 'border-gray-200 focus:border-primary bg-white'
                    }`}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <span className="form-error text-xs">{errors.email}</span>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="form-label text-xs">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 lg:pl-2.5 flex items-center pointer-events-none">
                    <Lock className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full pl-7 lg:pl-8 pr-7 lg:pr-8 py-1.5 lg:py-2 xl:py-2.5 border rounded-md lg:rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                      errors.password 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red/20 bg-red-50' 
                        : 'border-gray-200 focus:border-primary bg-white'
                    }`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2 lg:pr-2.5 flex items-center hover:bg-gray-50 rounded-r-md lg:rounded-r-lg transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span className="form-error text-xs">{errors.password}</span>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-0.5 lg:pt-1">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-primary focus:ring-primary border-gray-300 rounded transition-colors"
                    disabled={isLoading}
                  />
                  <span className="ml-1 lg:ml-1.5 text-xs text-gray-700">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-primary hover:text-primary/80 font-medium transition-colors text-xs"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-1.5 lg:py-2 xl:py-2.5 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 disabled:from-primary/50 disabled:to-accent/50 text-white rounded-md lg:rounded-lg font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-1 lg:gap-1.5 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner w-3 h-3 lg:w-3.5 lg:h-3.5"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-2 lg:mt-3 text-center">
              <p className="text-gray-600 text-xs">
                Don't have an account?{' '}
                <button className="text-primary hover:text-primary/80 font-semibold transition-colors">
                  Contact Admin
                </button>
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
  );
}