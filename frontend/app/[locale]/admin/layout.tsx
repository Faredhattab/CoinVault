import { AuthGuard } from '@/components/guards/AuthGuard'
import { RoleGuard } from '@/components/guards/RoleGuard'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { ReactNode } from 'react'
import Link from 'next/link'
import { getMessages, normalizeLocale } from "@/i18n"
import { LayoutDashboard, Shield, Settings, Activity, Coins, Folder } from "lucide-react"

export default async function AdminLayout({
  children,
  params
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const messages = getMessages(locale);

  return (
    <AuthGuard>
      <RoleGuard requiredRole="admin">
        <div className="min-h-screen bg-[#f7f7f2] flex flex-col">
          <header className="bg-white border-b border-[#d8dccf] px-6 py-4 flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="bg-[#20221f] text-white p-1.5 rounded">
                <Coins className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#20221f]">CoinVault Admin</h2>
            </div>
            <LogoutButton />
          </header>

        <div className="flex-1 flex flex-col md:flex-row">
          {/* Sidebar */}
          <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-[#d8dccf] p-4">
            <p className="eyebrow px-2 mb-4">{messages.admin.navTitle}</p>
            <nav className="grid gap-1 mb-6">
              <Link
                href={`/${locale}/admin`}
                className="flex items-center gap-3 p-2.5 rounded text-[#3e443b] hover:bg-[#f7f7f2] hover:text-[#20221f] transition-colors font-medium"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>{messages.admin.dashboardLink}</span>
              </Link>
              <Link
                href={`/${locale}/admin/categories`}
                className="flex items-center gap-3 p-2.5 rounded text-[#3e443b] hover:bg-[#f7f7f2] hover:text-[#20221f] transition-colors font-medium"
              >
                <Folder className="w-5 h-5" />
                <span>{messages.admin.categoriesLink}</span>
              </Link>
              <Link
                href={`/${locale}/admin/items`}
                className="flex items-center gap-3 p-2.5 rounded text-[#3e443b] hover:bg-[#f7f7f2] hover:text-[#20221f] transition-colors font-medium"
              >
                <Coins className="w-5 h-5" />
                <span>{messages.admin.itemsLink}</span>
              </Link>
              <Link
                href={`/${locale}/admin/sessions`}
                className="flex items-center gap-3 p-2.5 rounded text-[#3e443b] hover:bg-[#f7f7f2] hover:text-[#20221f] transition-colors font-medium"
              >
                <Shield className="w-5 h-5" />
                <span>{messages.admin.sessionsLink}</span>
              </Link>
              <Link
                href={`/${locale}/admin/settings`}
                className="flex items-center gap-3 p-2.5 rounded text-[#3e443b] hover:bg-[#f7f7f2] hover:text-[#20221f] transition-colors font-medium"
              >
                <Settings className="w-5 h-5" />
                <span>{messages.admin.settingsLink}</span>
              </Link>
              <Link
                href={`/${locale}/health`}
                className="flex items-center gap-3 p-2.5 rounded text-[#3e443b] hover:bg-[#f7f7f2] hover:text-[#20221f] transition-colors font-medium"
              >
                <Activity className="w-5 h-5" />
                <span>{messages.admin.healthLink}</span>
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
      </RoleGuard>
    </AuthGuard>
  )
}

