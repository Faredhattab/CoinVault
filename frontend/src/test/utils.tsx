import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'

const messages = {
  auth: {
    logoutButton: 'Logout',
    loggingOut: 'Logging out...',
    sessionLimitTitle: 'Session Limit Reached',
    sessionLimitMessage: 'Maximum of 3 concurrent sessions reached.',
    canLoginIn: 'You can login again in',
    sessionExpiryHint: 'The oldest session will expire automatically.',
    activeSessionsHeader: 'Current Access Points',
    mostRecent: 'Most Recent',
    expiresIn: 'Expires in',
    cancelButton: 'Close',
    day: 'day',
    days: 'days',
    hour: 'hour',
    hours: 'hours',
    minute: 'minute',
    minutes: 'minutes',
  },
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: string
  messages?: Record<string, any>
}

export function renderWithIntl(
  ui: ReactElement,
  { locale = 'en', messages: customMessages, ...options }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={customMessages || messages}>
        {children}
      </NextIntlClientProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react'
