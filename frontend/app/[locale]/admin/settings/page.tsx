/**
 * T110 [US2] Admin settings page with OAuth account linking UI
 *
 * Allows users to link/unlink their Google account to their admin profile.
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { authService } from '@/services/auth-service';
import { Link as LinkIcon, Unlink, AlertCircle, CheckCircle, Shield, User } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  linked_providers: string[];
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadUser();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('linked') === 'google') {
        setMessage({
          type: 'success',
          text: t('linkSuccess') || 'Google account linked successfully',
        });
        // Clear query parameters
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      setMessage({ type: 'error', text: t('loadError') || 'Failed to load user data' });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    try {
      setActionLoading('link-google');
      setMessage(null);

      // Initiate OAuth flow with state parameter for linking
      const oauthUrl = await authService.initiateGoogleOAuth('link');
      window.location.href = oauthUrl;
    } catch (error: any) {
      console.error('Failed to initiate Google linking:', error);
      setMessage({
        type: 'error',
        text: error.message || t('linkError') || 'Failed to link Google account',
      });
      setActionLoading(null);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!user) return;

    // Confirm before unlinking
    const confirmed = confirm(
      t('confirmUnlink') || 'Are you sure you want to unlink your Google account?'
    );
    if (!confirmed) return;

    // Check if this is the last provider
    if (user.linked_providers.length === 1) {
      setMessage({
        type: 'error',
        text:
          t('lastProviderError') ||
          'Cannot unlink the last authentication provider. Add another provider first.',
      });
      return;
    }

    try {
      setActionLoading('unlink-google');
      setMessage(null);

      await authService.unlinkGoogleAccount();

      // Reload user data
      await loadUser();

      setMessage({
        type: 'success',
        text: t('unlinkSuccess') || 'Google account unlinked successfully',
      });
    } catch (error: any) {
      console.error('Failed to unlink Google account:', error);

      if (error.message?.includes('last provider') || error.message?.includes('at least one')) {
        setMessage({
          type: 'error',
          text:
            t('lastProviderError') ||
            'Cannot unlink the last authentication provider. Add another provider first.',
        });
      } else {
        setMessage({
          type: 'error',
          text: error.message || t('unlinkError') || 'Failed to unlink Google account',
        });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const isGoogleLinked = user?.linked_providers.includes('google');
  const isEmailLinked = user?.linked_providers.includes('email');

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#20221f]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-[#ffd9d6] border border-[#7b1d17] text-[#7b1d17] p-4 rounded" role="alert">
        {t('noUserData') || 'Failed to load user data'}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#20221f] mb-6">
        {t('title') || 'Account Settings'}
      </h1>

      {/* Success/Error Messages */}
      {message && (
        <div
          className={`mb-5 px-4 py-3 rounded-lg border flex items-center gap-2 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-[#ffd9d6] border-[#7b1d17] text-[#7b1d17]'
          }`}
          role="alert"
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {/* Profile Information */}
      <section className="bg-white rounded-lg border border-[#d8dccf] p-5 mb-4">
        <h2 className="text-sm font-semibold text-[#5d6558] uppercase tracking-wide mb-3">
          {t('profileSection') || 'Profile'}
        </h2>
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#5d6558]">{t('email') || 'Email'}</span>
            <span className="font-medium text-[#20221f]">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#5d6558]">{t('role') || 'Role'}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              user.role === 'admin'
                ? 'bg-[#20221f] text-white'
                : 'bg-[#f7f7f2] text-[#5d6558] border border-[#d8dccf]'
            }`}>
              {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
              {user.role === 'admin' ? (t('adminRole') || 'Administrator') : (t('userRole') || 'User')}
            </span>
          </div>
        </div>
      </section>

      {/* Linked Accounts */}
      <section className="bg-white rounded-lg border border-[#d8dccf] p-5">
        <h2 className="text-sm font-semibold text-[#5d6558] uppercase tracking-wide mb-1">
          {t('linkedAccountsSection') || 'Linked Accounts'}
        </h2>
        <p className="text-xs text-[#5d6558] mb-4">
          {t('linkedAccountsDescription') ||
            'Connect multiple authentication methods to your account for more flexibility.'}
        </p>

        <div className="space-y-3">
          {/* Email/Password Provider */}
          <div className="flex items-center justify-between px-3 py-3 border border-[#d8dccf] rounded-lg">
            <div className="flex items-center gap-2.5">
              <div className="bg-[#f7f7f2] p-1.5 rounded">
                <svg className="w-4 h-4 text-[#3e443b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium text-[#20221f]">
                  {t('emailPasswordProvider') || 'Email & Password'}
                </span>
                <span className="text-xs text-[#5d6558] ml-2">
                  {isEmailLinked ? t('linked') || 'Linked' : t('notLinked') || 'Not linked'}
                </span>
              </div>
            </div>
            {isEmailLinked && (
              <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">
                {t('active') || 'Active'}
              </span>
            )}
          </div>

          {/* Google OAuth Provider */}
          <div className="flex items-center justify-between px-3 py-3 border border-[#d8dccf] rounded-lg">
            <div className="flex items-center gap-2.5">
              <div className="bg-[#f7f7f2] p-1.5 rounded">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium text-[#20221f]">Google</span>
                <span className="text-xs text-[#5d6558] ml-2">
                  {isGoogleLinked ? t('linked') || 'Linked' : t('notLinked') || 'Not linked'}
                </span>
              </div>
            </div>

            {isGoogleLinked ? (
              <button
                onClick={handleUnlinkGoogle}
                disabled={actionLoading === 'unlink-google'}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-md px-2.5 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'unlink-google' ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-red-600"></div>
                ) : (
                  <Unlink className="w-3 h-3" />
                )}
                <span>{t('unlink') || 'Unlink'}</span>
              </button>
            ) : (
              <button
                onClick={handleLinkGoogle}
                disabled={actionLoading === 'link-google'}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-[#20221f] rounded-md px-2.5 py-1.5 hover:bg-[#3e443b] transition-colors disabled:opacity-50"
              >
                {actionLoading === 'link-google' ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                ) : (
                  <LinkIcon className="w-3 h-3" />
                )}
                <span>{t('link') || 'Link'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Warning about last provider */}
        {user.linked_providers.length === 1 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2.5 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <p className="text-xs">
              {t('lastProviderWarning') ||
                'You must have at least one authentication method linked to your account.'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
