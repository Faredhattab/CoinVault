'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { authService } from '@/services/auth-service';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const t = useTranslations('auth');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code from URL params
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const state = searchParams.get('state');

        // Handle OAuth errors (e.g., user cancelled)
        if (error) {
          if (error === 'access_denied') {
            setErrorMessage(t('oauthCancelled') || 'OAuth login was cancelled');
          } else {
            setErrorMessage(t('oauthError') || `OAuth error: ${error}`);
          }
          setStatus('error');
          setTimeout(() => {
            router.push(`/${locale}/login` as any);
          }, 3000);
          return;
        }
 
        // Validate code exists
        if (!code) {
          setErrorMessage(t('invalidCallback') || 'Invalid callback: missing authorization code');
          setStatus('error');
          setTimeout(() => {
            router.push(`/${locale}/login` as any);
          }, 3000);
          return;
        }
 
        // Process the OAuth callback
        // Check if this is a linking flow (state contains 'link')
        const isLinking = state === 'link';
 
        if (isLinking) {
          // Link Google account to existing user
          const result = await authService.linkGoogleAccount(code);
          setStatus('success');
 
          // Redirect to settings page
          setTimeout(() => {
            router.push(`/${locale}/admin/settings?linked=google` as any);
          }, 1500);
        } else {
          // Normal OAuth login flow
          const result = await authService.loginWithGoogle(code);
 
          if (result.success) {
            setStatus('success');
 
            // Redirect to admin dashboard
            setTimeout(() => {
              router.push(`/${locale}/admin` as any);
            }, 1500);
          } else {
            throw new Error('OAuth login failed');
          }
        }
      } catch (error: any) {
        console.error('OAuth callback error:', error);
 
        let redirectError = 'oauth_failed';
        // Handle specific error types
        if (error.message?.includes('already exists') || error.status === 409) {
          redirectError = 'email_exists';
          setErrorMessage(
            t('emailExistsConflict') ||
              'This email is already registered with a password. Please log in and link your Google account from settings.'
          );
        } else if (error.message?.includes('unauthorized') || error.status === 401) {
          redirectError = 'unauthorized';
          setErrorMessage(t('oauthUnauthorized') || 'OAuth authorization failed. Please try again.');
        } else if (error.message?.includes('invalid')) {
          redirectError = 'invalid_code';
          setErrorMessage(
            t('invalidAuthCode') || 'Invalid authorization code. Please try logging in again.'
          );
        } else {
          setErrorMessage(
            t('oauthGenericError') ||
              error.message ||
              'An error occurred during OAuth login. Please try again.'
          );
        }
 
        setStatus('error');
 
        // Redirect back to login after showing error
        setTimeout(() => {
          router.push(`/${locale}/login?error=${redirectError}` as any);
        }, 1500);
      }
    };
 
    handleCallback();
  }, [searchParams, router, t]);
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f7f2] p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#20221f] mx-auto mb-4"></div>
            <h1 className="text-xl font-bold text-[#20221f] mb-2">
              {t('processingOAuth') || 'Processing Google Sign In...'}
            </h1>
            <p className="text-[#5d6558]">{t('pleaseWait') || 'Please wait a moment'}</p>
          </>
        )}
 
        {status === 'success' && (
          <>
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-green-600 mb-2">
              {t('oauthSuccess') || 'Successfully signed in!'}
            </h1>
            <p className="text-[#5d6558]">{t('redirecting') || 'Redirecting...'}</p>
          </>
        )}
 
        {status === 'error' && (
          <div role="alert">
            <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-red-600 mb-2">
              {t('oauthFailed') || 'Sign in failed'}
            </h1>
            <p className="text-[#5d6558] mb-4">{errorMessage}</p>
            <p className="text-sm text-[#5d6558]">
              {t('redirectingToLogin') || 'Redirecting to login page...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f2] p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#20221f] mx-auto mb-4"></div>
          <h1 className="text-xl font-bold text-[#20221f] mb-2">Processing Google Sign In...</h1>
          <p className="text-[#5d6558]">Please wait a moment</p>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}
