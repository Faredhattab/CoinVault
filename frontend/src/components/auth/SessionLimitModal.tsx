'use client'

import { useTranslations } from 'next-intl'
import { ShieldAlert, Clock, Globe, Info, X } from 'lucide-react'

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
    <div className="fixed inset-0 bg-[#20221f]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-[#d8dccf] animate-in zoom-in-95 duration-200">
        <div className="bg-[#ffd9d6] p-6 flex items-start justify-between border-b border-[#7b1d17]/10">
          <div className="flex items-center gap-4">
            <div className="bg-[#7b1d17] text-white p-2 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#7b1d17]">
                {t('sessionLimitTitle') || 'Session Limit Reached'}
              </h2>
              <p className="text-[#7b1d17]/80 text-sm font-medium mt-1">
                {t('sessionLimitMessage') || 'Maximum of 3 concurrent sessions reached.'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5 text-[#7b1d17]" />
          </button>
        </div>

        <div className="p-6">
          {timeUntilCanLogin && (
            <div className="bg-[#f7f7f2] border border-[#d8dccf] rounded-xl p-4 mb-6 flex items-start gap-4">
              <div className="bg-[#20221f] text-white p-1.5 rounded flex-shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-[#20221f]">
                  <strong>{t('canLoginIn') || 'You can login again in'}:</strong> <span className="font-bold">{timeUntilCanLogin}</span>
                </p>
                <p className="text-xs text-[#5d6558] mt-1 italic">
                  {t('sessionExpiryHint') || 'The oldest session will expire automatically.'}
                </p>
              </div>
            </div>
          )}

          <div className="eyebrow mb-3 px-1">{t('activeSessionsHeader') || 'Current Access Points'}</div>
          <ul className="space-y-3 mb-8 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
            {sessions.map((session, index) => (
              <li
                key={session.id}
                className="bg-white border border-[#d8dccf] rounded-xl p-4 hover:border-[#20221f] transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-[#20221f]">
                        {session.device}
                      </span>
                      {index === 0 && (
                        <span className="text-[0.65rem] font-bold uppercase tracking-wider bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          {t('mostRecent') || 'Most Recent'}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#5d6558]">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3 h-3" />
                        <span>{session.ip_address}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(session.last_activity).toLocaleDateString()}</span>
                      </div>
                      {session.expires_at && (
                        <div className="flex items-center gap-1.5 col-span-full mt-1 text-[#20221f] font-medium">
                          <Info className="w-3 h-3" />
                          <span>{t('expiresIn') || 'Expires in'}: {formatExpiry(session.expires_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <button
            onClick={onClose}
            className="button secondary w-full py-3 rounded-xl font-bold tracking-tight"
          >
            {t('cancelButton') || 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
