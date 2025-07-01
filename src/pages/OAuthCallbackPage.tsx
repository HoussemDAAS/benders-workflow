import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingCard } from '../components/LoadingSpinner';
import { ErrorCard } from '../components/ErrorMessage';

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    let isHandled = false; // Prevent duplicate processing

    const handleOAuthCallback = async () => {
      if (isHandled) return; // Prevent duplicate execution
      isHandled = true;

      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const state = searchParams.get('state');

        // Check for OAuth errors
        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Determine provider from current path
        const provider = window.location.pathname.includes('google') ? 'google' : 'github';



        // Send code to our backend
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/callback/${provider}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          
          // Handle specific OAuth errors
          if (errorData.error?.includes('Authorization code expired')) {
            throw new Error('Login session expired. Please try signing in again.');
          } else if (errorData.error?.includes('invalid_grant')) {
            throw new Error('Authentication failed. Please try signing in again.');
          } else {
            throw new Error(errorData.error || 'Authentication failed');
          }
        }

        const authData = await response.json();
        

        
        // Store authentication data using the same keys as your auth service
        localStorage.setItem('auth-token', authData.token);
        localStorage.setItem('auth-user', JSON.stringify(authData.user));

        // Refresh the auth context to update the user state
        await refreshSession();



        // OAuth users bypass 2FA by design, so redirect directly to dashboard
        navigate('/app/dashboard', { replace: true });
      } catch (err) {
        console.error('❌ OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setIsProcessing(false);
      }
    };

    // Add a small delay to ensure this only runs once
    const timeoutId = setTimeout(handleOAuthCallback, 100);
    
    return () => {
      clearTimeout(timeoutId);
      isHandled = true;
    };
  }, [searchParams, navigate, refreshSession]);

  if (isProcessing) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <LoadingCard message="Completing authentication..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <ErrorCard 
            error={error} 
            onRetry={() => navigate('/login', { replace: true })}
            retryText="Back to Login"
          />
        </div>
      </div>
    );
  }

  return null;
}