import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <main className="shell">
      <div className="panel">
        <Suspense fallback={
          <div className="w-full max-w-md mx-auto text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#20221f] mx-auto mb-4"></div>
            <p className="text-[#5d6558]">Loading secure portal...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
