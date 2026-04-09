'use client'

import { useMemo, useState } from 'react'

import { TopHeader } from '@/components/top-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useListShopsQuery } from '@/redux/api/shops-api'
import {
  useCreatePlanMutation,
  useCreateSubscriptionMutation,
  useListInvoicesQuery,
  useListPlansQuery,
  useListSubscriptionsQuery,
  usePayInvoiceMutation,
  useUpdatePlanMutation,
  useUpdateSubscriptionMutation,
} from '@/redux/api/billing-api'

const MODULE_FEATURES = [
  { key: 'dashboard', label: 'Dashboard', description: 'Access overview and KPIs' },
  { key: 'terminal', label: 'Terminal', description: 'Create sales and scan items' },
  { key: 'customers', label: 'Customers', description: 'Manage customer directory' },
  { key: 'receipts', label: 'Receipts', description: 'View and manage transactions' },
  { key: 'analytics', label: 'Analytics', description: 'View reports and trends' },
  { key: 'inventory', label: 'Inventory', description: 'Manage products and stock' },
  { key: 'employees', label: 'Employees', description: 'Manage staff accounts' },
  { key: 'settings', label: 'Settings', description: 'Change shop and system configuration' },
] as const

type ModuleKey = (typeof MODULE_FEATURES)[number]['key']

function summarizePlanModules(features: any) {
  const raw = features?.modules
  const out: Record<string, boolean> = {}
  for (const m of MODULE_FEATURES) {
    out[m.key] = raw && typeof raw === 'object' && m.key in raw ? Boolean(raw[m.key]) : true
  }
  const enabledKeys = Object.entries(out)
    .filter(([, v]) => v)
    .map(([k]) => k)
  return { enabledCount: enabledKeys.length, enabledKeys }
}

export default function PaymentsPage() {
  const { data: shops = [] } = useListShopsQuery()
  const { data: plans = [], isLoading: isPlansLoading, isError: isPlansError } = useListPlansQuery()
  const [createPlan, { isLoading: isCreatingPlan }] = useCreatePlanMutation()
  const [updatePlan, { isLoading: isUpdatingPlan }] = useUpdatePlanMutation()

  const [selectedShopId, setSelectedShopId] = useState<string>('')
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignShopId, setAssignShopId] = useState<string>('')
  const [assignPlanId, setAssignPlanId] = useState<string>('')
  const [createPlanOpen, setCreatePlanOpen] = useState(false)
  const [editPlanOpen, setEditPlanOpen] = useState(false)
  const [editPlanId, setEditPlanId] = useState<string | null>(null)
  const [payOpen, setPayOpen] = useState(false)
  const [payInvoiceId, setPayInvoiceId] = useState<string | null>(null)

  const { data: subscriptions = [], isLoading: isSubsLoading } = useListSubscriptionsQuery(
    selectedShopId ? { shopId: selectedShopId } : undefined,
  )
  const [createSubscription, { isLoading: isCreatingSub }] = useCreateSubscriptionMutation()
  const [updateSubscription, { isLoading: isUpdatingSub }] = useUpdateSubscriptionMutation()

  const { data: invoices = [], isLoading: isInvoicesLoading } = useListInvoicesQuery(
    selectedShopId ? { shopId: selectedShopId } : undefined,
  )
  const [payInvoice, { isLoading: isPayingInvoice }] = usePayInvoiceMutation()

  const activeSub = useMemo(() => subscriptions.find((s) => s.status !== 'canceled') ?? null, [subscriptions])

  const [planName, setPlanName] = useState('')
  const [planCode, setPlanCode] = useState('')
  const [planCurrency, setPlanCurrency] = useState('NGN')
  const [planPriceMonthly, setPlanPriceMonthly] = useState('0')
  const [planIsActive, setPlanIsActive] = useState<'active' | 'disabled'>('active')
  const [planFeaturesText, setPlanFeaturesText] = useState('{}')
  const [featureKeyDraft, setFeatureKeyDraft] = useState('')
  const [featureTypeDraft, setFeatureTypeDraft] = useState<'number' | 'boolean' | 'string' | 'json'>('number')
  const [featureValueDraft, setFeatureValueDraft] = useState('')

  const featuresParse = useMemo(() => {
    const raw = planFeaturesText.trim()
    if (!raw) return { ok: true as const, value: {} as Record<string, any> }
    try {
      const v = JSON.parse(raw)
      if (!v || typeof v !== 'object' || Array.isArray(v)) {
        return { ok: false as const, value: {} as Record<string, any> }
      }
      return { ok: true as const, value: v as Record<string, any> }
    } catch {
      return { ok: false as const, value: {} as Record<string, any> }
    }
  }, [planFeaturesText])

  const moduleFlags = useMemo(() => {
    const base: Record<ModuleKey, boolean> = Object.fromEntries(MODULE_FEATURES.map((m) => [m.key, true])) as Record<ModuleKey, boolean>
    if (!featuresParse.ok) return base
    const modules = (featuresParse.value as any)?.modules
    if (!modules || typeof modules !== 'object') return base
    const out = { ...base }
    for (const m of MODULE_FEATURES) {
      if (m.key in modules) out[m.key] = Boolean((modules as any)[m.key])
    }
    return out
  }, [featuresParse.ok, featuresParse.value])

  const applyModules = (next: Record<ModuleKey, boolean>) => {
    if (!featuresParse.ok) return
    const base = featuresParse.value || {}
    const nextFeatures = { ...base, modules: next }
    setPlanFeaturesText(JSON.stringify(nextFeatures, null, 2))
  }

  const setModuleFlag = (key: ModuleKey, enabled: boolean) => {
    const next = { ...moduleFlags, [key]: enabled }
    applyModules(next)
  }

  const featureEntries = useMemo(() => {
    if (!featuresParse.ok) return []
    const entries = Object.entries(featuresParse.value || {})
    entries.sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    return entries
  }, [featuresParse.ok, featuresParse.value])

  const canApplyFeatureDraft = useMemo(() => {
    if (!featuresParse.ok) return false
    const key = featureKeyDraft.trim()
    if (!key) return false
    if (featureTypeDraft === 'string') return true
    if (featureTypeDraft === 'number') {
      const n = Number(featureValueDraft)
      return Number.isFinite(n)
    }
    if (featureTypeDraft === 'boolean') {
      return featureValueDraft === 'true' || featureValueDraft === 'false'
    }
    if (featureTypeDraft === 'json') {
      try {
        JSON.parse(featureValueDraft || 'null')
        return true
      } catch {
        return false
      }
    }
    return false
  }, [featureKeyDraft, featureTypeDraft, featureValueDraft, featuresParse.ok])

  const upsertFeatureDraft = () => {
    if (!featuresParse.ok) return
    const key = featureKeyDraft.trim()
    if (!key) return

    let value: any = featureValueDraft
    if (featureTypeDraft === 'number') value = Number(featureValueDraft)
    if (featureTypeDraft === 'boolean') value = featureValueDraft === 'true'
    if (featureTypeDraft === 'json') value = JSON.parse(featureValueDraft || 'null')

    const next = { ...(featuresParse.value || {}), [key]: value }
    setPlanFeaturesText(JSON.stringify(next, null, 2))
  }

  const removeFeatureKey = (key: string) => {
    if (!featuresParse.ok) return
    const next = { ...(featuresParse.value || {}) }
    delete (next as any)[key]
    setPlanFeaturesText(JSON.stringify(next, null, 2))
  }

  const loadFeatureIntoDraft = (key: string, value: any) => {
    setFeatureKeyDraft(key)
    if (typeof value === 'number') {
      setFeatureTypeDraft('number')
      setFeatureValueDraft(String(value))
      return
    }
    if (typeof value === 'boolean') {
      setFeatureTypeDraft('boolean')
      setFeatureValueDraft(value ? 'true' : 'false')
      return
    }
    if (typeof value === 'string') {
      setFeatureTypeDraft('string')
      setFeatureValueDraft(value)
      return
    }
    setFeatureTypeDraft('json')
    setFeatureValueDraft(JSON.stringify(value, null, 2))
  }

  const canCreatePlan = useMemo(() => {
    const price = Number(planPriceMonthly)
    return (
      planName.trim().length > 0 &&
      planCode.trim().length > 0 &&
      Number.isFinite(price) &&
      price >= 0 &&
      featuresParse.ok
    )
  }, [featuresParse.ok, planCode, planName, planPriceMonthly])

  const canUpdatePlan = useMemo(() => {
    if (!editPlanId) return false
    const price = Number(planPriceMonthly)
    return planName.trim().length > 0 && planCurrency.trim().length > 0 && Number.isFinite(price) && price >= 0 && featuresParse.ok
  }, [editPlanId, featuresParse.ok, planCurrency, planName, planPriceMonthly])

  const assignablePlans = useMemo(() => plans.filter((p) => p.isActive), [plans])
  const canAssignPlan = useMemo(() => assignShopId && assignPlanId, [assignPlanId, assignShopId])

  return (
    <div className="min-h-screen">
      <TopHeader title="Payments" />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Billing</CardTitle>
                <CardDescription>Manage plans, store subscriptions, and invoices.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{shops.length} stores</Badge>
                <Badge>{plans.length} plans</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Store</label>
              <select
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
              >
                <option value="">Select a store</option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPlanName('')
                  setPlanCode('')
                  setPlanCurrency('NGN')
                  setPlanPriceMonthly('0')
                  setPlanFeaturesText('{}')
                  setFeatureKeyDraft('')
                  setFeatureTypeDraft('number')
                  setFeatureValueDraft('')
                  setCreatePlanOpen(true)
                }}
              >
                New plan
              </Button>
              <Button
                disabled={!selectedShopId || isCreatingSub || !!activeSub}
                onClick={() => {
                  setAssignShopId(selectedShopId)
                  setAssignPlanId('')
                  setAssignOpen(true)
                }}
              >
                {activeSub ? 'Already subscribed' : 'Assign plan'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Plans</CardTitle>
                <CardDescription>Subscription plans on the platform.</CardDescription>
              </div>
              <Button
                onClick={() => {
                  setPlanName('')
                  setPlanCode('')
                  setPlanCurrency('NGN')
                  setPlanPriceMonthly('0')
                  setPlanFeaturesText('{}')
                  setFeatureKeyDraft('')
                  setFeatureTypeDraft('number')
                  setFeatureValueDraft('')
                  setCreatePlanOpen(true)
                }}
              >
                New plan
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPlansLoading ? <div className="text-sm text-muted-foreground">Loading plans...</div> : null}
            {isPlansError ? <div className="text-sm text-destructive">Failed to load plans</div> : null}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Code</th>
                    <th className="py-2 pr-4">Price</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Modules</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => (
                    <tr key={p.id} className="border-b border-border">
                      <td className="py-3 pr-4 font-medium">{p.name}</td>
                      <td className="py-3 pr-4">
                        <span className="font-mono text-xs text-muted-foreground">{p.code}</span>
                      </td>
                      <td className="py-3 pr-4">
                        {p.currency} {p.priceMonthly}/mo
                      </td>
                      <td className="py-3 pr-4">
                        <Badge className={p.isActive ? '' : 'opacity-60'}>{p.isActive ? 'active' : 'disabled'}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs text-muted-foreground">
                          {summarizePlanModules(p.features).enabledCount}/{MODULE_FEATURES.length}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isUpdatingPlan}
                          onClick={() => {
                            setEditPlanId(p.id)
                            setPlanName(p.name)
                            setPlanCode(p.code)
                            setPlanCurrency(p.currency ?? 'NGN')
                            setPlanPriceMonthly(String(p.priceMonthly ?? 0))
                            setPlanIsActive(p.isActive ? 'active' : 'disabled')
                            setPlanFeaturesText(JSON.stringify(p.features ?? {}, null, 2))
                            setFeatureKeyDraft('')
                            setFeatureTypeDraft('number')
                            setFeatureValueDraft('')
                            setEditPlanOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Store Subscription</CardTitle>
            <CardDescription>View and manage the selected store subscription.</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedShopId ? <div className="text-sm text-muted-foreground">Select a store to view subscription.</div> : null}
            {selectedShopId && isSubsLoading ? <div className="text-sm text-muted-foreground">Loading...</div> : null}
            {selectedShopId && !isSubsLoading && !activeSub ? (
              <div className="text-sm text-muted-foreground">No active subscription.</div>
            ) : null}

            {activeSub ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge>{activeSub.status}</Badge>
                    {activeSub.cancelAtPeriodEnd ? <Badge>cancel at period end</Badge> : null}
                  </div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="text-sm text-muted-foreground">Current period</div>
                  <div className="mt-1 text-sm font-medium">
                    {activeSub.currentPeriodStart.toLocaleDateString()} → {activeSub.currentPeriodEnd.toLocaleDateString()}
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    disabled={isUpdatingSub}
                    onClick={async () => {
                      await updateSubscription({
                        subscriptionId: activeSub.id,
                        input: { cancelAtPeriodEnd: !activeSub.cancelAtPeriodEnd },
                      }).unwrap()
                    }}
                  >
                    {activeSub.cancelAtPeriodEnd ? 'Undo cancel' : 'Cancel at period end'}
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={isUpdatingSub}
                    onClick={async () => {
                      await updateSubscription({ subscriptionId: activeSub.id, input: { status: 'canceled' } }).unwrap()
                    }}
                  >
                    Cancel now
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>Payment records for the selected store.</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedShopId ? <div className="text-sm text-muted-foreground">Select a store to view invoices.</div> : null}
            {selectedShopId && isInvoicesLoading ? <div className="text-sm text-muted-foreground">Loading...</div> : null}

            {selectedShopId ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="py-2 pr-4">Amount</th>
                      <th className="py-2 pr-4">Provider</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Period</th>
                      <th className="py-2 pr-4">Due</th>
                      <th className="py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-border">
                        <td className="py-3 pr-4 font-medium">
                          {inv.currency} {inv.amount}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="text-xs text-muted-foreground">
                            {inv.paymentProvider ?? '-'}
                            {inv.paymentReference ? (
                              <div className="font-mono">{inv.paymentReference}</div>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge>{inv.status}</Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-xs text-muted-foreground">
                            {inv.periodStart.toLocaleDateString()} → {inv.periodEnd.toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-xs text-muted-foreground">{inv.dueDate.toLocaleDateString()}</span>
                        </td>
                        <td className="py-3 text-right">
                          {inv.status === 'unpaid' && inv.paymentProvider !== 'paystack' ? (
                            <Button
                              size="sm"
                              disabled={isPayingInvoice}
                              onClick={() => {
                                setPayInvoiceId(inv.id)
                                setPayOpen(true)
                              }}
                            >
                              Mark paid
                            </Button>
                          ) : inv.status === 'unpaid' && inv.paymentProvider === 'paystack' ? (
                            <span className="text-xs text-muted-foreground">Awaiting Paystack</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {inv.paidAt ? `Paid ${inv.paidAt.toLocaleDateString()}` : ''}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Modal
          open={createPlanOpen}
          onOpenChange={(open) => {
            if (!isCreatingPlan) setCreatePlanOpen(open)
          }}
          title="Create Plan"
          description="Create a new subscription plan."
        >
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="e.g. Starter" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Code</label>
                <Input value={planCode} onChange={(e) => setPlanCode(e.target.value)} placeholder="starter" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Currency</label>
                <Input value={planCurrency} onChange={(e) => setPlanCurrency(e.target.value)} placeholder="NGN" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Price / month</label>
                <Input
                  value={planPriceMonthly}
                  onChange={(e) => setPlanPriceMonthly(e.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Features (JSON)</label>
                <div className="rounded-md border border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">Plan modules</div>
                      <div className="text-xs text-muted-foreground">Toggle which areas of the app this plan can access.</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!featuresParse.ok}
                        onClick={() =>
                          applyModules(
                            Object.fromEntries(MODULE_FEATURES.map((m) => [m.key, true])) as Record<ModuleKey, boolean>,
                          )
                        }
                      >
                        Enable all
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!featuresParse.ok}
                        onClick={() =>
                          applyModules(
                            Object.fromEntries(MODULE_FEATURES.map((m) => [m.key, false])) as Record<ModuleKey, boolean>,
                          )
                        }
                      >
                        Disable all
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {MODULE_FEATURES.map((m) => (
                      <label
                        key={m.key}
                        className="flex items-start gap-3 rounded-md border border-border bg-background px-3 py-2"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4"
                          checked={moduleFlags[m.key]}
                          disabled={!featuresParse.ok}
                          onChange={(e) => setModuleFlag(m.key, e.target.checked)}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{m.label}</div>
                          <div className="text-xs text-muted-foreground">{m.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                {featuresParse.ok ? (
                  <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
                    <div className="grid gap-2 md:grid-cols-3">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Key</div>
                        <Input value={featureKeyDraft} onChange={(e) => setFeatureKeyDraft(e.target.value)} placeholder="e.g. maxTerminals" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Type</div>
                        <select
                          className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                          value={featureTypeDraft}
                          onChange={(e) => setFeatureTypeDraft(e.target.value as any)}
                        >
                          <option value="number">number</option>
                          <option value="boolean">boolean</option>
                          <option value="string">string</option>
                          <option value="json">json</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Value</div>
                        {featureTypeDraft === 'json' ? (
                          <textarea
                            className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            value={featureValueDraft}
                            onChange={(e) => setFeatureValueDraft(e.target.value)}
                            placeholder='e.g. {"canExport":true}'
                          />
                        ) : featureTypeDraft === 'boolean' ? (
                          <select
                            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                            value={featureValueDraft || 'true'}
                            onChange={(e) => setFeatureValueDraft(e.target.value)}
                          >
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                        ) : (
                          <Input value={featureValueDraft} onChange={(e) => setFeatureValueDraft(e.target.value)} placeholder="e.g. 1" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">Add or update a single feature without editing JSON manually.</div>
                      <Button type="button" size="sm" variant="outline" disabled={!canApplyFeatureDraft} onClick={upsertFeatureDraft}>
                        Add / Update
                      </Button>
                    </div>

                    {featureEntries.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="text-left text-muted-foreground">
                            <tr className="border-b border-border">
                              <th className="py-2 pr-4">Key</th>
                              <th className="py-2 pr-4">Value</th>
                              <th className="py-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {featureEntries.map(([k, v]) => (
                              <tr key={k} className="border-b border-border">
                                <td className="py-2 pr-4 font-mono text-xs">{k}</td>
                                <td className="py-2 pr-4 font-mono text-xs">{JSON.stringify(v)}</td>
                                <td className="py-2 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button type="button" size="sm" variant="outline" onClick={() => loadFeatureIntoDraft(String(k), v)}>
                                      Edit
                                    </Button>
                                    <Button type="button" size="sm" variant="destructive" onClick={() => removeFeatureKey(String(k))}>
                                      Remove
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">No features yet.</div>
                    )}
                  </div>
                ) : null}
                <textarea
                  className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={planFeaturesText}
                  onChange={(e) => setPlanFeaturesText(e.target.value)}
                  placeholder='e.g. {"trialDays":7,"maxTerminals":1}'
                />
                {!featuresParse.ok ? <div className="text-xs text-destructive">Invalid JSON object.</div> : null}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isCreatingPlan}
                onClick={() => {
                  setCreatePlanOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!canCreatePlan || isCreatingPlan}
                onClick={async () => {
                  const price = Number(planPriceMonthly)
                  await createPlan({
                    name: planName.trim(),
                    code: planCode.trim(),
                    currency: planCurrency.trim() || 'NGN',
                    priceMonthly: Number.isFinite(price) ? price : 0,
                    features: featuresParse.value,
                  }).unwrap()
                  setCreatePlanOpen(false)
                }}
              >
                {isCreatingPlan ? 'Creating...' : 'Create plan'}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          open={editPlanOpen}
          onOpenChange={(open) => {
            if (!isUpdatingPlan) setEditPlanOpen(open)
          }}
          title="Edit Plan"
          description="Update plan details and availability."
        >
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="e.g. Starter" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Code</label>
                <Input value={planCode} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Currency</label>
                <Input value={planCurrency} onChange={(e) => setPlanCurrency(e.target.value)} placeholder="NGN" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Price / month</label>
                <Input
                  value={planPriceMonthly}
                  onChange={(e) => setPlanPriceMonthly(e.target.value)}
                  inputMode="decimal"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Features (JSON)</label>
                <div className="rounded-md border border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">Plan modules</div>
                      <div className="text-xs text-muted-foreground">Toggle which areas of the app this plan can access.</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!featuresParse.ok}
                        onClick={() =>
                          applyModules(
                            Object.fromEntries(MODULE_FEATURES.map((m) => [m.key, true])) as Record<ModuleKey, boolean>,
                          )
                        }
                      >
                        Enable all
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!featuresParse.ok}
                        onClick={() =>
                          applyModules(
                            Object.fromEntries(MODULE_FEATURES.map((m) => [m.key, false])) as Record<ModuleKey, boolean>,
                          )
                        }
                      >
                        Disable all
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {MODULE_FEATURES.map((m) => (
                      <label
                        key={m.key}
                        className="flex items-start gap-3 rounded-md border border-border bg-background px-3 py-2"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4"
                          checked={moduleFlags[m.key]}
                          disabled={!featuresParse.ok}
                          onChange={(e) => setModuleFlag(m.key, e.target.checked)}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{m.label}</div>
                          <div className="text-xs text-muted-foreground">{m.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                {featuresParse.ok ? (
                  <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
                    <div className="grid gap-2 md:grid-cols-3">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Key</div>
                        <Input value={featureKeyDraft} onChange={(e) => setFeatureKeyDraft(e.target.value)} placeholder="e.g. maxTerminals" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Type</div>
                        <select
                          className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                          value={featureTypeDraft}
                          onChange={(e) => setFeatureTypeDraft(e.target.value as any)}
                        >
                          <option value="number">number</option>
                          <option value="boolean">boolean</option>
                          <option value="string">string</option>
                          <option value="json">json</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Value</div>
                        {featureTypeDraft === 'json' ? (
                          <textarea
                            className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            value={featureValueDraft}
                            onChange={(e) => setFeatureValueDraft(e.target.value)}
                            placeholder='e.g. {"canExport":true}'
                          />
                        ) : featureTypeDraft === 'boolean' ? (
                          <select
                            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                            value={featureValueDraft || 'true'}
                            onChange={(e) => setFeatureValueDraft(e.target.value)}
                          >
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                        ) : (
                          <Input value={featureValueDraft} onChange={(e) => setFeatureValueDraft(e.target.value)} placeholder="e.g. 1" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">Add or update a single feature without editing JSON manually.</div>
                      <Button type="button" size="sm" variant="outline" disabled={!canApplyFeatureDraft} onClick={upsertFeatureDraft}>
                        Add / Update
                      </Button>
                    </div>

                    {featureEntries.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="text-left text-muted-foreground">
                            <tr className="border-b border-border">
                              <th className="py-2 pr-4">Key</th>
                              <th className="py-2 pr-4">Value</th>
                              <th className="py-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {featureEntries.map(([k, v]) => (
                              <tr key={k} className="border-b border-border">
                                <td className="py-2 pr-4 font-mono text-xs">{k}</td>
                                <td className="py-2 pr-4 font-mono text-xs">{JSON.stringify(v)}</td>
                                <td className="py-2 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button type="button" size="sm" variant="outline" onClick={() => loadFeatureIntoDraft(String(k), v)}>
                                      Edit
                                    </Button>
                                    <Button type="button" size="sm" variant="destructive" onClick={() => removeFeatureKey(String(k))}>
                                      Remove
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">No features yet.</div>
                    )}
                  </div>
                ) : null}
                <textarea
                  className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={planFeaturesText}
                  onChange={(e) => setPlanFeaturesText(e.target.value)}
                  placeholder='e.g. {"trialDays":7,"maxTerminals":1}'
                />
                {!featuresParse.ok ? <div className="text-xs text-destructive">Invalid JSON object.</div> : null}
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={planIsActive}
                  onChange={(e) => setPlanIsActive(e.target.value === 'active' ? 'active' : 'disabled')}
                >
                  <option value="active">active</option>
                  <option value="disabled">disabled</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isUpdatingPlan}
                onClick={() => {
                  setEditPlanOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!canUpdatePlan || isUpdatingPlan}
                onClick={async () => {
                  if (!editPlanId) return
                  const price = Number(planPriceMonthly)
                  await updatePlan({
                    planId: editPlanId,
                    input: {
                      name: planName.trim(),
                      currency: planCurrency.trim() || 'NGN',
                      priceMonthly: Number.isFinite(price) ? price : 0,
                      features: featuresParse.value,
                      isActive: planIsActive === 'active',
                    },
                  }).unwrap()
                  setEditPlanOpen(false)
                }}
              >
                {isUpdatingPlan ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          open={assignOpen}
          onOpenChange={(open) => {
            if (!isCreatingSub) setAssignOpen(open)
          }}
          title="Assign Plan"
          description="Assign a subscription plan to a store."
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Store</label>
              <select
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={assignShopId}
                onChange={(e) => setAssignShopId(e.target.value)}
              >
                <option value="">Select a store</option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan</label>
              <select
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={assignPlanId}
                onChange={(e) => setAssignPlanId(e.target.value)}
              >
                <option value="">Select a plan</option>
                {assignablePlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.currency} {p.priceMonthly}/mo)
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isCreatingSub}
                onClick={() => {
                  setAssignOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!canAssignPlan || isCreatingSub}
                onClick={async () => {
                  await createSubscription({ shopId: assignShopId, planId: assignPlanId }).unwrap()
                  setSelectedShopId(assignShopId)
                  setAssignOpen(false)
                }}
              >
                {isCreatingSub ? 'Assigning...' : 'Assign plan'}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          open={payOpen}
          onOpenChange={(open) => {
            if (!isPayingInvoice) setPayOpen(open)
          }}
          title="Mark Invoice Paid"
          description="Confirm payment for this invoice."
        >
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">This will mark the invoice as paid.</div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPayingInvoice}
                onClick={() => {
                  setPayOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!payInvoiceId || isPayingInvoice}
                onClick={async () => {
                  if (!payInvoiceId) return
                  await payInvoice({ invoiceId: payInvoiceId }).unwrap()
                  setPayOpen(false)
                }}
              >
                {isPayingInvoice ? 'Saving...' : 'Mark paid'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
