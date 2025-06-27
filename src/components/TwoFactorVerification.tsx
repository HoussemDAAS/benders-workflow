import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  ArrowLeft, 
  Key, 
  Target, 
  Sparkles,
  Clock,
  Smartphone,
  Info
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface TwoFactorVerificationProps {
  email: string;
  loginType: 'password' | 'magic-link';
  onVerificationSuccess: (data: any) => void;
  onBack: () => void;
  magicToken?: string; // For magic link flow
}

export function TwoFactorVerification({ 
  email, 
  loginType, 
  onVerificationSuccess, 
  onBack,
  magicToken 
}: TwoFactorVerificationProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  const [touchedField, setTouchedField] = useState(false);

  const { verify2FA } = useAuth();

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= (showBackupCode ? 8 : 6)) {
      setCode(value);
      setError('');
      setTouchedField(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length < (showBackupCode ? 8 : 6)) {
      setError(`Please enter a valid ${showBackupCode ? 'backup code' : '2FA code'}`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const requestBody = {
        email,
        token: code,
        loginType,
        ...(loginType === 'magic-link' && magicToken && { magicToken })
      };

      // Use the auth context's verify2FA method
      const user = await verify2FA(requestBody);
      onVerificationSuccess({ user, token: 'handled-by-context' });
    } catch (error) {
      console.error('2FA verification failed:', error);
      setError(error instanceof Error ? error.message : '2FA verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBackupCode = () => {
    setShowBackupCode(!showBackupCode);
    setCode('');
    setError('');
    setTouchedField(false);
  };

  // Professional error display component
  const ErrorDisplay = ({ error }: { error: string }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
        <p className="text-sm font-medium text-red-700 leading-relaxed">{error}</p>
      </div>
    </div>
  );

  // Professional info display component
  const InfoDisplay = ({ message, type = 'info' }: { message: string; type?: 'info' | 'warning' | 'success' }) => {
    const styles = {
      info: 'bg-blue-50 border-blue-200 text-blue-700',
      warning: 'bg-amber-50 border-amber-200 text-amber-700',
      success: 'bg-green-50 border-green-200 text-green-700'
    };
    
    const iconStyles = {
      info: 'text-blue-500',
      warning: 'text-amber-500',
      success: 'text-green-500'
    };
    
    const icons = {
      info: Info,
      warning: Clock,
      success: CheckCircle
    };
    
    const IconComponent = icons[type];
    
    return (
      <div className={`border rounded-lg p-3 ${styles[type]}`}>
        <div className="flex items-start gap-2">
          <IconComponent className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconStyles[type]}`} />
          <p className="text-sm font-medium leading-relaxed">{message}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Left Side - Branding (Same as LoginPage) */}
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
              Secure Access
              <br />
              <span className="text-tertiary">Two-Factor Authentication</span>
            </h2>
            <p className="text-sm lg:text-base xl:text-lg text-white/90 leading-relaxed max-w-sm lg:max-w-md">
              Your account is protected with two-factor authentication. Enter the code from your authenticator app to continue.
            </p>
          </div>

          {/* Security Features */}
          <div className="space-y-3 lg:space-y-4 xl:space-y-5">
            <div className="flex items-start gap-2 lg:gap-3 xl:gap-4">
              <div className="w-7 h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                <Shield className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-4.5 xl:h-4.5 text-tertiary" />
              </div>
              <div>
                <h3 className="text-xs lg:text-sm xl:text-base font-semibold text-white mb-0.5 lg:mb-1">Enhanced Security</h3>
                <p className="text-xs lg:text-xs xl:text-sm text-white/70 leading-relaxed">Your account is protected with multi-factor authentication</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 lg:gap-3 xl:gap-4">
              <div className="w-7 h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                <Smartphone className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-4.5 xl:h-4.5 text-tertiary" />
              </div>
              <div>
                <h3 className="text-xs lg:text-sm xl:text-base font-semibold text-white mb-0.5 lg:mb-1">Authenticator App</h3>
                <p className="text-xs lg:text-xs xl:text-sm text-white/70 leading-relaxed">Use Google Authenticator, Authy, or similar apps</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - 2FA Form */}
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

          {/* 2FA Card */}
          <div className="bg-white rounded-lg lg:rounded-xl xl:rounded-2xl shadow-large p-3 lg:p-4 xl:p-5 border border-gray-100">
            {/* Header */}
            <div className="text-center mb-3 lg:mb-4">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3">
                <Shield className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
              </div>
              <div className="flex items-center justify-center gap-1 lg:gap-1.5 mb-1 lg:mb-2">
                <Sparkles className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-blue-500" />
                <h2 className="text-base lg:text-lg xl:text-xl font-bold text-gray-900">Two-Factor Authentication</h2>
              </div>
              <p className="text-gray-600 text-xs lg:text-sm">
                Enter the {showBackupCode ? 'backup code' : '6-digit code'} from your authenticator app
              </p>
            </div>

            {/* Session timer */}
            {timeLeft > 0 && (
              <div className="mb-3 lg:mb-4">
                <InfoDisplay 
                  message={`Session expires in ${formatTime(timeLeft)}`}
                  type="warning"
                />
              </div>
            )}

            {/* Account info */}
            <div className="bg-gray-50 rounded-lg p-2 lg:p-3 mb-3 lg:mb-4">
              <p className="text-xs lg:text-sm text-gray-600">
                Signing in as: <span className="font-medium text-gray-900">{email}</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Login method: {loginType === 'password' ? 'Email & Password' : 'Magic Link'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2 lg:space-y-3">
              {/* Error display */}
              {error && (
                <ErrorDisplay error={error} />
              )}

              {/* Code input */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {showBackupCode ? 'Backup Code' : '2FA Code'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 lg:pl-2.5 flex items-center pointer-events-none">
                    <Key className={`w-3 h-3 lg:w-3.5 lg:h-3.5 transition-colors ${
                      error ? 'text-red-400' : 'text-gray-400'
                    }`} />
                  </div>
                  <input
                    type="text"
                    value={code}
                    onChange={handleCodeChange}
                    onBlur={() => setTouchedField(true)}
                    className={`w-full pl-7 lg:pl-8 pr-7 lg:pr-8 py-1.5 lg:py-2 xl:py-2.5 border rounded-md lg:rounded-lg text-center text-sm lg:text-base font-mono tracking-wider focus:outline-none focus:ring-2 transition-all duration-200 ${
                      error 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50' 
                        : touchedField && !error && code.length === (showBackupCode ? 8 : 6)
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-green-50'
                        : 'border-gray-200 focus:border-primary focus:ring-primary/20 bg-white'
                    }`}
                    placeholder={showBackupCode ? '12345678' : '123456'}
                    disabled={isLoading}
                    autoComplete="one-time-code"
                    autoFocus
                    inputMode="numeric"
                    maxLength={showBackupCode ? 8 : 6}
                  />
                  {/* Success indicator */}
                  {touchedField && !error && code.length === (showBackupCode ? 8 : 6) && (
                    <div className="absolute inset-y-0 right-0 pr-2 lg:pr-2.5 flex items-center">
                      <CheckCircle className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-green-500" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {showBackupCode 
                    ? 'Enter one of your 8-digit backup codes'
                    : 'Enter the 6-digit code from your authenticator app'
                  }
                </p>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || !code || code.length < (showBackupCode ? 8 : 6)}
                className={`w-full py-1.5 lg:py-2 xl:py-2.5 rounded-md lg:rounded-lg font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-1 lg:gap-1.5 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  isLoading || !code || code.length < (showBackupCode ? 8 : 6)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-3 h-3 lg:w-3.5 lg:h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                    Verify & Sign In
                  </>
                )}
              </button>
            </form>

            {/* Backup code toggle */}
            <div className="mt-2 lg:mt-3 text-center">
              <button
                type="button"
                onClick={toggleBackupCode}
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors underline-offset-2 hover:underline"
                disabled={isLoading}
              >
                {showBackupCode 
                  ? '← Use authenticator app instead'
                  : 'Use backup code instead'
                }
              </button>
            </div>

            {/* Back button */}
            <div className="mt-3 lg:mt-4 pt-2 lg:pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={onBack}
                className="w-full flex items-center justify-center gap-1 lg:gap-1.5 py-1.5 lg:py-2 text-xs text-gray-600 hover:text-gray-800 transition-colors rounded-md hover:bg-gray-50"
                disabled={isLoading}
              >
                <ArrowLeft className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                Back to login
              </button>
            </div>

            {/* Help text */}
            <div className="mt-2 lg:mt-3 text-center">
              <p className="text-xs text-gray-500">
                Lost access to your authenticator? Contact support for assistance.
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