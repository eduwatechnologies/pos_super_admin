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

  const canCreatePlan = useMemo(() => {
    const price = Number(planPriceMonthly)
    return planName.trim().length > 0 && planCode.trim().length > 0 && Number.isFinite(price) && price >= 0
  }, [planCode, planName, planPriceMonthly])

  const canUpdatePlan = useMemo(() => {
    if (!editPlanId) return false
    const price = Number(planPriceMonthly)
    return planName.trim().length > 0 && planCurrency.trim().length > 0 && Number.isFinite(price) && price >= 0
  }, [editPlanId, planCurrency, planName, planPriceMonthly])

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
                {plans.map((p) => (
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
