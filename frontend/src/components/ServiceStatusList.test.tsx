import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ServiceStatusList, type FoundationHealth } from './ServiceStatusList'

describe('ServiceStatusList', () => {
  const mockLabels = {
    aggregate: 'System Status',
    web: 'Web',
    backend: 'Backend',
    database: 'Database',
    migrations: 'Migrations',
    auth: 'Auth',
    admin: 'Admin',
    storage: 'Storage',
    ok: 'OK',
    degraded: 'Degraded',
    unavailable: 'Unavailable',
  }

  const mockHealthOk: FoundationHealth = {
    status: 'ok',
    checked_at: new Date().toISOString(),
    services: {
      web: { status: 'ok', message: 'Running' },
      backend: { status: 'ok', message: 'Running' },
      database: { status: 'ok', message: 'Connected' },
      migrations: { status: 'ok', message: 'Up to date' },
      auth: { status: 'ok', message: 'Running' },
      admin: { status: 'ok', message: 'Accessible' },
      storage: { status: 'ok', message: 'Available' },
    },
  }

  it('renders all services', () => {
    render(<ServiceStatusList health={mockHealthOk} labels={mockLabels} />)

    expect(screen.getByText('Web')).toBeInTheDocument()
    expect(screen.getByText('Backend')).toBeInTheDocument()
    expect(screen.getByText('Database')).toBeInTheDocument()
    expect(screen.getByText('Migrations')).toBeInTheDocument()
    expect(screen.getByText('Auth')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Storage')).toBeInTheDocument()
  })

  it('displays aggregate status', () => {
    render(<ServiceStatusList health={mockHealthOk} labels={mockLabels} />)

    expect(screen.getByText('System Status:')).toBeInTheDocument()
  })

  it('shows degraded status correctly', () => {
    const healthDegraded: FoundationHealth = {
      ...mockHealthOk,
      status: 'degraded',
      services: {
        ...mockHealthOk.services,
        backend: { status: 'degraded', message: 'Slow response' },
      },
    }

    render(<ServiceStatusList health={healthDegraded} labels={mockLabels} />)

    expect(screen.getByText('Slow response')).toBeInTheDocument()
  })

  it('shows unavailable status correctly', () => {
    const healthUnavailable: FoundationHealth = {
      ...mockHealthOk,
      status: 'unavailable',
      services: {
        ...mockHealthOk.services,
        database: { status: 'unavailable', message: 'Connection failed' },
      },
    }

    render(<ServiceStatusList health={healthUnavailable} labels={mockLabels} />)

    expect(screen.getByText('Connection failed')).toBeInTheDocument()
  })
})
