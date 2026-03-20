'use client'

import { useMemo } from 'react'

import { TopHeader } from '@/components/top-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useListInvoicesQuery, useListPlansQuery, useListSubscriptionsQuery } from '@/redux/api/billing-api'
import { useListShopsQuery } from '@/redux/api/shops-api'
import { useListUsersQuery } from '@/redux/api/users-api'

export default function DashboardPage() {
  const { data: shops = [], isLoading: isShopsLoading } = useListShopsQuery()
  const { data: users = [], isLoading: isUsersLoading } = useListUsersQuery()
  const { data: plans = [], isLoading: isPlansLoading } = useListPlansQuery()
  const { data: subs = [], isLoading: isSubsLoading } = useListSubscriptionsQuery()
  const { data: invoices = [], isLoading: isInvoicesLoading } = useListInvoicesQuery()

  const stats = useMemo(() => {
    const activeSubs = subs.filter((s) => s.status === 'active').length
    const pastDueSubs = subs.filter((s) => s.status === 'past_due').length
    const unpaidInvoices = invoices.filter((i) => i.status === 'unpaid')
    const paidInvoices = invoices.filter((i) => i.status === 'paid')
    const unpaidTotal = unpaidInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
    const paidTotal = paidInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)

    return {
      activeSubs,
      pastDueSubs,
      unpaidCount: unpaidInvoices.length,
      unpaidTotal,
      paidCount: paidInvoices.length,
      paidTotal,
    }
  }, [invoices, subs])

  const isLoading = isShopsLoading || isUsersLoading || isPlansLoading || isSubsLoading || isInvoicesLoading

  return (
    <div className="min-h-screen">
      <TopHeader title="Dashboard" />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Stores</CardTitle>
              <CardDescription>Total stores on platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{shops.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Total users on platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Plans</CardTitle>
              <CardDescription>Subscription plans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{plans.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>Active / Past due</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Badge>active {stats.activeSubs}</Badge>
              <Badge>past_due {stats.pastDueSubs}</Badge>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue (Paid)</CardTitle>
              <CardDescription>Total paid invoices</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="text-2xl font-semibold">{stats.paidTotal}</div>
              <Badge>{stats.paidCount} paid</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Outstanding</CardTitle>
              <CardDescription>Total unpaid invoices</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="text-2xl font-semibold">{stats.unpaidTotal}</div>
              <Badge>{stats.unpaidCount} unpaid</Badge>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Quick snapshot of platform billing and activity.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="text-sm text-muted-foreground">Loading...</div> : null}
            {!isLoading ? (
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-border p-4">
                  <div className="text-sm text-muted-foreground">Users enabled</div>
                  <div className="mt-1 text-lg font-semibold">{users.filter((u) => u.isActive).length}</div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="text-sm text-muted-foreground">Users disabled</div>
                  <div className="mt-1 text-lg font-semibold">{users.filter((u) => !u.isActive).length}</div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="text-sm text-muted-foreground">Invoices total</div>
                  <div className="mt-1 text-lg font-semibold">{invoices.length}</div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

