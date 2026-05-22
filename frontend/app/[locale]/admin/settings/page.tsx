/**
 * T110 [US2] Admin settings page with OAuth account linking UI
 *
 * Allows users to link/unlink their Google account to their admin profile.
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { authService } from '@/services/auth-service';
import { Link as LinkIcon, Unlink, AlertCircle, CheckCircle, Shield, User, Mail } from 'lucide-react';

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
          text: t('linkSuccess'),
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
      setMessage({ type: 'error', text: t('loadError') });
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
        text: error.message || t('linkError'),
      });
      setActionLoading(null);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!user) return;

    // Confirm before unlinking
    const confirmed = confirm(t('confirmUnlink'));
    if (!confirmed) return;

    // Check if this is the last provider
    if (user.linked_providers.length === 1) {
      setMessage({
        type: 'error',
        text: t('lastProviderError'),
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
        text: t('unlinkSuccess'),
      });
    } catch (error: any) {
      console.error('Failed to unlink Google account:', error);

      if (error.message?.includes('last provider') || error.message?.includes('at least one')) {
        setMessage({
          type: 'error',
          text: t('lastProviderError'),
        });
      } else {
        setMessage({
          type: 'error',
          text: error.message || t('unlinkError'),
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
        {t('noUserData')}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#20221f] mb-6">
        {t('title')}
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
          {t('profileSection')}
        </h2>
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#5d6558]">{t('email')}</span>
            <span className="font-medium text-[#20221f]">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#5d6558]">{t('role')}</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              user.role === 'admin'
                ? 'bg-[#20221f] text-white'
                : 'bg-[#f7f7f2] text-[#5d6558] border border-[#d8dccf]'
            }`}>
              {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
              {user.role === 'admin' ? t('adminRole') : t('userRole')}
            </span>
          </div>
        </div>
      </section>

      {/* Linked Accounts */}
      <section className="bg-white rounded-lg border border-[#d8dccf] p-5">
        <h2 className="text-sm font-semibold text-[#5d6558] uppercase tracking-wide mb-1">
          {t('linkedAccountsSection')}
        </h2>
        <p className="text-xs text-[#5d6558] mb-4">
          {t('linkedAccountsDescription')}
        </p>

        <div className="space-y-3">
          {/* Email/Password Provider */}
          <div className="flex items-center justify-between px-3 py-3 border border-[#d8dccf] rounded-lg">
            <div className="flex items-center gap-2.5">
              <div className="bg-[#f7f7f2] p-1.5 rounded">
                <Mail className="w-4 h-4 text-[#3e443b]" />
              </div>
              <div>
                <span className="text-sm font-medium text-[#20221f]">
                  {t('emailPasswordProvider')}
                </span>
                <span className="text-xs text-[#5d6558] ml-2">
                  {isEmailLinked ? t('linked') : t('notLinked')}
                </span>
              </div>
            </div>
            {isEmailLinked && (
              <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">
                {t('active')}
              </span>
            )}
          </div>

          {/* Google OAuth Provider */}
          <div className="flex items-center justify-between px-3 py-3 border border-[#d8dccf] rounded-lg">
            <div className="flex items-center gap-2.5">
              <div className="bg-[#f7f7f2] p-1.5 rounded">
                <img src="/icons/google.svg" alt="Google" width={16} height={16} />
              </div>
              <div>
                <span className="text-sm font-medium text-[#20221f]">Google</span>
                <span className="text-xs text-[#5d6558] ml-2">
                  {isGoogleLinked ? t('linked') : t('notLinked')}
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
                <span>{t('unlink')}</span>
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
                <span>{t('link')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Warning about last provider */}
        {user.linked_providers.length === 1 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2.5 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <p className="text-xs">
              {t('lastProviderWarning')}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
