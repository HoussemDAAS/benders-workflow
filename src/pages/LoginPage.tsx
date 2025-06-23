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
  BarChart3
} from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<LoginFormErrors>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof LoginFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {};
    
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
      
      // For demo purposes, accept any valid email/password
      // In production, this would make an actual API call
      console.log('Login attempt:', formData);
      
      // Navigate to dashboard on successful login
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Login failed:', error);
      setErrors({
        general: 'Login failed. Please check your credentials and try again.',
      });
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-gradient-to-br from-primary via-accent to-primary">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/10 pointer-events-none"></div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-tertiary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-secondary/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-8 lg:px-12 xl:px-16 py-12 text-white">
          {/* Logo & Brand */}
          <div className="mb-8 lg:mb-12">
            <div className="flex items-center gap-3 lg:gap-4 mb-6 lg:mb-8">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-tertiary to-secondary rounded-2xl flex items-center justify-center shadow-xl">
                <Target className="w-6 h-6 lg:w-9 lg:h-9 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold">Benders Workflow</h1>
                <p className="text-white/80 text-sm lg:text-base xl:text-lg">Business Process Management</p>
              </div>
            </div>
            
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 lg:mb-6 leading-tight">
              Transform Your
              <br />
              <span className="text-tertiary">Business Operations</span>
            </h2>
            <p className="text-base lg:text-lg xl:text-xl text-white/90 leading-relaxed max-w-md">
              Streamline workflows, boost productivity, and drive growth with our comprehensive business management platform.
            </p>
          </div>

          {/* Features - Compact for better spacing */}
          <div className="space-y-4 lg:space-y-6">
            {features.slice(0, 2).map((feature, index) => (
              <div key={index} className="flex items-start gap-3 lg:gap-4">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white/10 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                  <feature.icon className="w-4 h-4 lg:w-5 lg:h-5 text-tertiary" />
                </div>
                <div>
                  <h3 className="text-sm lg:text-base font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-xs lg:text-sm text-white/70 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-4 lg:p-6 xl:p-8">
        <div className="w-full max-w-sm lg:max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Benders Workflow</h1>
                <p className="text-gray-600 text-sm">Business Management</p>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl lg:rounded-3xl shadow-large p-6 lg:p-8 border border-gray-100">
            <div className="text-center mb-6 lg:mb-8">
              <div className="flex items-center justify-center gap-2 mb-3 lg:mb-4">
                <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-tertiary" />
                <h2 className="text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">Welcome Back</h2>
              </div>
              <p className="text-gray-600 text-sm lg:text-base">Sign in to access your workspace</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
              {/* General Error */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg lg:rounded-xl p-3 lg:p-4">
                  <p className="text-red-600 text-sm text-center">{errors.general}</p>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="form-label text-sm lg:text-base">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 lg:pl-4 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-10 lg:pl-12 pr-3 lg:pr-4 py-3 lg:py-4 border rounded-lg lg:rounded-xl text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                      errors.email 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red/20 bg-red-50' 
                        : 'border-gray-200 focus:border-primary bg-white'
                    }`}
                    placeholder="Enter your email"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <span className="form-error text-xs lg:text-sm">{errors.email}</span>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="form-label text-sm lg:text-base">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 lg:pl-4 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full pl-10 lg:pl-12 pr-10 lg:pr-12 py-3 lg:py-4 border rounded-lg lg:rounded-xl text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                      errors.password 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red/20 bg-red-50' 
                        : 'border-gray-200 focus:border-primary bg-white'
                    }`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 lg:pr-4 flex items-center hover:bg-gray-50 rounded-r-lg lg:rounded-r-xl transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span className="form-error text-xs lg:text-sm">{errors.password}</span>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1 lg:pt-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-primary focus:ring-primary border-gray-300 rounded transition-colors"
                    disabled={isLoading}
                  />
                  <span className="ml-2 lg:ml-3 text-sm lg:text-base text-gray-700">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-primary hover:text-primary/80 font-medium transition-colors text-sm lg:text-base"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 lg:py-4 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 disabled:from-primary/50 disabled:to-accent/50 text-white rounded-lg lg:rounded-xl font-semibold text-sm lg:text-base transition-all duration-200 flex items-center justify-center gap-2 lg:gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner w-4 h-4 lg:w-5 lg:h-5"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-5 lg:mt-6 text-center">
              <p className="text-gray-600 text-sm lg:text-base">
                Don't have an account?{' '}
                <button className="text-primary hover:text-primary/80 font-semibold transition-colors">
                  Contact Admin
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 lg:mt-6 text-center">
            <p className="text-xs lg:text-sm text-gray-500">
              © 2024 Benders Workflow. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;