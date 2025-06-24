import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, CheckCircle, ArrowLeft, Key, RefreshCw } from 'lucide-react';
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
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-large p-6 lg:p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
              Two-Factor Authentication
            </h2>
            <p className="text-gray-600 text-sm">
              Enter the {showBackupCode ? 'backup code' : '6-digit code'} from your authenticator app
            </p>
          </div>

          {/* Time left indicator */}
          {timeLeft > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-blue-700">
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Session expires in {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          )}

          {/* Account info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-sm text-gray-600">
              Signing in as: <span className="font-medium text-gray-900">{email}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Login method: {loginType === 'password' ? 'Email & Password' : 'Magic Link'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Code input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {showBackupCode ? 'Backup Code' : '2FA Code'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-center text-lg font-mono tracking-wider"
                  placeholder={showBackupCode ? '12345678' : '123456'}
                  disabled={isLoading}
                  autoComplete="one-time-code"
                  autoFocus
                />
                {code.length === (showBackupCode ? 8 : 6) && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500" />
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
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                isLoading || !code || code.length < (showBackupCode ? 8 : 6)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Verify & Sign In
                </>
              )}
            </button>
          </form>

          {/* Backup code toggle */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={toggleBackupCode}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              disabled={isLoading}
            >
              {showBackupCode 
                ? '← Use authenticator app instead'
                : 'Use backup code instead'
              }
            </button>
          </div>

          {/* Back button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>
          </div>

          {/* Help text */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Lost access to your authenticator? Contact support for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}