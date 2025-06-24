import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { TwoFactorVerification } from '../components/TwoFactorVerification';
import { LoadingCard } from '../components/LoadingSpinner';
import { ErrorCard } from '../components/ErrorMessage';
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Target,
  Sparkles
} from 'lucide-react';

export function MagicLinkVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSession } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'requires2fa'>('verifying');
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // 2FA states
  const [twoFactorData, setTwoFactorData] = useState<{
    email: string;
    magicToken: string;
  } | null>(null);

  // Handle 2FA verification success
  const handle2FASuccess = async (authData: any) => {
    try {
      // Store the authentication data
      localStorage.setItem('auth-token', authData.token);
      localStorage.setItem('auth-user', JSON.stringify(authData.user));

      // Refresh the auth context
      await refreshSession();

      setStatus('success');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        setIsRedirecting(true);
        navigate('/dashboard', { replace: true });
      }, 2000);
    } catch (error) {
      console.error('Failed to complete 2FA login:', error);
      setError('Login failed after 2FA verification. Please try again.');
      setStatus('error');
    }
  };

  // Handle going back from 2FA verification
  const handle2FABack = () => {
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    let isMounted = true;

    const verifyMagicLink = async () => {
      try {
        const token = searchParams.get('token');
        const requires2fa = searchParams.get('requires2fa') === 'true';
        
        if (!token) {
          throw new Error('Invalid magic link - no token found');
        }

        console.log('🔗 Verifying magic link token...');

        // Verify the magic link token with our backend
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-magic-link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Magic link verification failed');
        }

        const authData = await response.json();
        
        if (!isMounted) return;

        // Check if 2FA is required
        if (authData.requiresTwoFactor) {
          console.log('🔐 2FA required for magic link login');
          setTwoFactorData({
            email: authData.email,
            magicToken: token
          });
          setStatus('requires2fa');
          return;
        }

        console.log('✅ Magic link verified successfully');
        
        // Regular login success (no 2FA)
        localStorage.setItem('auth-token', authData.token);
        localStorage.setItem('auth-user', JSON.stringify(authData.user));

        // Refresh the auth context
        await refreshSession();

        setStatus('success');

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          if (isMounted) {
            setIsRedirecting(true);
            navigate('/dashboard', { replace: true });
          }
        }, 2000);

      } catch (err) {
        console.error('Magic link verification error:', err);
        
        if (!isMounted) return;

        let errorMessage = 'Magic link verification failed';
        
        if (err instanceof Error) {
          const message = err.message.toLowerCase();
          
          if (message.includes('expired')) {
            errorMessage = 'This magic link has expired. Please request a new one.';
          } else if (message.includes('invalid') || message.includes('token')) {
            errorMessage = 'This magic link is invalid. Please request a new one.';
          } else if (message.includes('already used')) {
            errorMessage = 'This magic link has already been used. Please request a new one.';
          } else if (message.includes('user not found')) {
            errorMessage = 'User account not found. Please contact support.';
          } else if (message.includes('network') || message.includes('fetch')) {
            errorMessage = 'Connection error. Please check your internet and try again.';
          } else if (err.message) {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
        setStatus('error');
      }
    };

    // Small delay to show the loading state
    const timeoutId = setTimeout(verifyMagicLink, 500);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [searchParams, navigate, refreshSession]);

  // Show 2FA verification screen
  if (status === 'requires2fa' && twoFactorData) {
    return (
      <TwoFactorVerification
        email={twoFactorData.email}
        loginType="magic-link"
        onVerificationSuccess={handle2FASuccess}
        onBack={handle2FABack}
        magicToken={twoFactorData.magicToken}
      />
    );
  }

  if (status === 'verifying') {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-large p-6 lg:p-8 border border-gray-100 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Verifying Magic Link</h2>
            <p className="text-gray-600">
              Please wait while we verify your magic link and sign you in...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-large p-6 lg:p-8 border border-gray-100 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Sign In Successful!</h2>
            <p className="text-gray-600 mb-6">
              You've been successfully signed in. Redirecting to your dashboard...
            </p>
            
            {isRedirecting && (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Redirecting...</span>
              </div>
            )}
            
            {!isRedirecting && (
              <button
                onClick={() => {
                  setIsRedirecting(true);
                  navigate('/dashboard', { replace: true });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-medium text-sm hover:from-primary/90 hover:to-accent/90 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-large p-6 lg:p-8 border border-gray-100 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">
              {error || 'We couldn\'t verify your magic link. Please try requesting a new one.'}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-medium text-sm hover:from-primary/90 hover:to-accent/90 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Back to Login
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}