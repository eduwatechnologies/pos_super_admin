'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import type { ApiUser } from '@/lib/api/mappers'
import { useLoginMutation, useMeQuery } from '@/redux/api/auth-api'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { clearCredentials, setCredentials } from '@/redux/features/auth/auth-slice'

type AuthContextType = {
  user: ApiUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const token = useAppSelector((s) => s.auth.token)
  const user = useAppSelector((s) => s.auth.user)
  const [hasToken, setHasToken] = useState(false)

  const [loginTrigger, { isLoading: isLoginLoading }] = useLoginMutation()

  useEffect(() => {
    setHasToken(typeof window !== 'undefined' && !!localStorage.getItem('auth_token'))
  }, [])

  const { data: meData, isFetching: isMeLoading, isError: isMeError } = useMeQuery(undefined, { skip: !hasToken })

  const login = useCallback(async (email: string, password: string) => {
    const { token: nextToken, user: nextUser } = await loginTrigger({ email, password }).unwrap()
    localStorage.setItem('auth_token', nextToken)
    dispatch(setCredentials({ token: nextToken, user: nextUser }))
    setHasToken(true)
  }, [dispatch, loginTrigger])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    dispatch(clearCredentials())
    setHasToken(false)
    router.push('/auth/login')
  }, [dispatch, router])

  useEffect(() => {
    if (!hasToken) return

    if (meData?.user) {
      const storedToken = localStorage.getItem('auth_token') ?? ''
      if (storedToken) dispatch(setCredentials({ token: storedToken, user: meData.user }))
      if (meData.user.role !== 'super_admin') {
        logout()
      }
      return
    }

    if (isMeError) {
      localStorage.removeItem('auth_token')
      dispatch(clearCredentials())
      setHasToken(false)
    }
  }, [dispatch, hasToken, isMeError, logout, meData?.user])

  const value = useMemo<AuthContextType>(() => {
    return {
      user: user ?? null,
      isLoading: isLoginLoading || isMeLoading,
      isAuthenticated: !!token || hasToken,
      login,
      logout,
    }
  }, [hasToken, isLoginLoading, isMeLoading, login, logout, token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
