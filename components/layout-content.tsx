'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { Sidebar } from '@/components/sidebar'
import { useAuth } from '@/context/auth-context'

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isAuthRoute = pathname.startsWith('/auth')

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated && !isAuthRoute) router.push('/auth/login')
    if (isAuthenticated && isAuthRoute) router.push('/dashboard')
  }, [isAuthRoute, isAuthenticated, isLoading, router])

  if (isAuthRoute) {
    return <div className="min-h-screen">{children}</div>
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="pl-[240px]">{children}</main>
    </div>
  )
}
