'use client'

import { LogOut, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth-context'

export function TopHeader({ title }: { title: string }) {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="size-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{user?.email ?? ''}</div>
        </div>
      </div>
      <Button type="button" variant="outline" onClick={logout}>
        <LogOut className="size-4" />
        Sign out
      </Button>
    </header>
  )
}

