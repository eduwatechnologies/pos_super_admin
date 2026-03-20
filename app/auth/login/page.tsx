'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/auth-context'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => email.trim().length > 0 && password.trim().length > 0, [email, password])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Super Admin Login</CardTitle>
        <CardDescription>Sign in to manage stores, users, payments, and analytics.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="superadmin@company.com" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        {error ? <div className="text-sm text-destructive">{error}</div> : null}
        <Button
          className="w-full"
          disabled={!canSubmit || isLoading}
          onClick={async () => {
            setError(null)
            try {
              await login(email, password)
              router.replace('/stores')
            } catch (e: any) {
              setError(e?.data?.error ?? 'Login failed')
            }
          }}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </CardContent>
    </Card>
  )
}

