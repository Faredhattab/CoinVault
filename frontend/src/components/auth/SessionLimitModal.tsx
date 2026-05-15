'use client'

import { useTranslations } from 'next-intl'

interface ActiveSession {
  id: string
  device: string
  ip_address: string
  last_activity: string
}

interface SessionLimitModalProps {
  sessions: ActiveSession[]
  onRevoke: (sessionId: string) => Promise<void>
  onClose: () => void
}

export function SessionLimitModal({ sessions, onRevoke, onClose }: SessionLimitModalProps) {
  const t = useTranslations('auth')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">{t('sessionLimitTitle') || 'Session Limit Reached'}</h2>
        <p className="text-gray-600 mb-4">
          {t('sessionLimitMessage') || 'You have reached the maximum number of concurrent sessions. Please revoke an existing session to continue.'}
        </p>
        
        <ul className="space-y-3 mb-6">
          {sessions.map((session) => (
            <li key={session.id} className="border rounded p-3 flex justify-between items-center">
              <div className="text-sm">
                <div className="font-medium">{session.device}</div>
                <div className="text-gray-500">{session.ip_address}</div>
                <div className="text-xs text-gray-400">
                  {new Date(session.last_activity).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => onRevoke(session.id)}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
              >
                {t('revokeButton') || 'Revoke'}
              </button>
            </li>
          ))}
        </ul>
        
        <button
          onClick={onClose}
          className="w-full text-gray-500 py-2 hover:bg-gray-100 rounded transition-colors"
        >
          {t('cancelButton') || 'Cancel'}
        </button>
      </div>
    </div>
  )
}
