'use client'

import { useTranslations } from 'next-intl'

interface ActiveSession {
  id: string
  device: string
  ip_address: string
  last_activity: string
  expires_at?: string
}

interface SessionLimitModalProps {
  sessions: ActiveSession[]
  onClose: () => void
}

export function SessionLimitModal({ sessions, onClose }: SessionLimitModalProps) {
  const t = useTranslations('auth')

  // Calculate when the soonest session expires
  const getTimeUntilExpiry = () => {
    if (!sessions || sessions.length === 0) return null

    const now = new Date()
    let soonestExpiry: Date | null = null

    sessions.forEach(session => {
      if (session.expires_at) {
        const expiryDate = new Date(session.expires_at)
        if (!soonestExpiry || expiryDate < soonestExpiry) {
          soonestExpiry = expiryDate
        }
      }
    })

    if (!soonestExpiry) return null

    // TypeScript doesn't narrow the type after the null check above
    const msUntilExpiry = (soonestExpiry as Date).getTime() - now.getTime()
    const daysUntilExpiry = Math.floor(msUntilExpiry / (1000 * 60 * 60 * 24))
    const hoursUntilExpiry = Math.floor((msUntilExpiry % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (daysUntilExpiry > 0) {
      const unit = daysUntilExpiry === 1 ? t('day') : t('days')
      return `${daysUntilExpiry} ${unit}`
    } else if (hoursUntilExpiry > 0) {
      const unit = hoursUntilExpiry === 1 ? t('hour') : t('hours')
      return `${hoursUntilExpiry} ${unit}`
    } else {
      const minutesUntilExpiry = Math.floor(msUntilExpiry / (1000 * 60))
      const unit = minutesUntilExpiry === 1 ? t('minute') : t('minutes')
      return `${minutesUntilExpiry} ${unit}`
    }
  }

  const formatExpiry = (expiresAt: string | undefined) => {
    if (!expiresAt) return 'Unknown'
    const date = new Date(expiresAt)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays > 1) {
      return `${diffDays} ${t('days')}`
    } else if (diffDays === 1) {
      return `1 ${t('day')}`
    } else {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      if (diffHours > 0) {
        const unit = diffHours === 1 ? t('hour') : t('hours')
        return `${diffHours} ${unit}`
      } else {
        const diffMins = Math.floor(diffMs / (1000 * 60))
        const unit = diffMins === 1 ? t('minute') : t('minutes')
        return `${diffMins} ${unit}`
      }
    }
  }

  const timeUntilCanLogin = getTimeUntilExpiry()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {t('sessionLimitTitle') || 'Session Limit Reached'}
        </h2>

        <p className="text-gray-600 mb-4">
          {t('sessionLimitMessage') || 'You have reached the maximum of 3 concurrent sessions. Revoke a session to continue, or wait for one to expire.'}
        </p>

        {timeUntilCanLogin && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>⏱️ {t('canLoginIn') || 'You can login again in'}:</strong> {timeUntilCanLogin}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {t('sessionExpiryHint') || 'The oldest session will expire automatically, allowing you to login without revoking.'}
            </p>
          </div>
        )}

        <ul className="space-y-3 mb-6 max-h-96 overflow-y-auto">
          {sessions.map((session, index) => (
            <li
              key={session.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {session.device}
                    </span>
                    {index === 0 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        {t('mostRecent') || 'Most Recent'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    📍 {t('ipAddress') || 'IP Address'}: {session.ip_address}
                  </p>
                  <p className="text-sm text-gray-600">
                    🕐 {t('lastActive') || 'Last Active'}: {new Date(session.last_activity).toLocaleString()}
                  </p>
                  {session.expires_at && (
                    <p className="text-sm text-gray-600">
                      ⏳ {t('expiresIn') || 'Expires in'}: <strong>{formatExpiry(session.expires_at)}</strong>
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            {t('cancelButton') || 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}
