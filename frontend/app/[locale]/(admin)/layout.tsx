import { AuthGuard } from '@/components/guards/AuthGuard'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">CoinVault Admin</h1>
          <LogoutButton />
        </header>
        <div className="flex-1 flex overflow-hidden">
          {/* Future Sidebar Sidebar */}
          <aside className="w-64 bg-white border-r hidden md:block">
            <nav className="p-4 space-y-2">
              <a href="#" className="block p-2 rounded-md bg-blue-50 text-blue-700 font-medium">
                Dashboard
              </a>
              <a href="#" className="block p-2 rounded-md text-gray-600 hover:bg-gray-50 transition-colors">
                Collection
              </a>
              <a href="#" className="block p-2 rounded-md text-gray-600 hover:bg-gray-50 transition-colors">
                Settings
              </a>
            </nav>
          </aside>
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
