export type ApiUserRole = 'super_admin' | 'admin' | 'cashier'

export type ApiUser = {
  id: string
  email: string
  name: string
  role: ApiUserRole
  shopIds: string[]
  isActive: boolean
  createdAt?: Date
}

export type ApiShop = {
  id: string
  name: string
  currency?: string
  businessName?: string
  address?: string
  phone?: string
  createdAt?: Date
}

export type ApiPlan = {
  id: string
  name: string
  code: string
  currency: string
  priceMonthly: number
  features: Record<string, any>
  isActive: boolean
  createdAt?: Date
}

export type ApiSubscriptionStatus = 'active' | 'past_due' | 'canceled'

export type ApiSubscription = {
  id: string
  shopId: string
  planId: string
  status: ApiSubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  canceledAt?: Date | null
  createdAt?: Date
}

export type ApiInvoiceStatus = 'unpaid' | 'paid' | 'void'

export type ApiInvoice = {
  id: string
  shopId: string
  subscriptionId: string
  planId: string
  currency: string
  amount: number
  status: ApiInvoiceStatus
  paymentProvider?: string | null
  paymentReference?: string | null
  periodStart: Date
  periodEnd: Date
  dueDate: Date
  paidAt?: Date | null
  createdAt?: Date
}

export function toIsoDate(input: any) {
  const d = input ? new Date(input) : new Date()
  if (Number.isNaN(d.getTime())) return new Date()
  return d
}

export function mapUser(u: any): ApiUser {
  const roleRaw = String(u?.role ?? 'cashier')
  const role: ApiUserRole =
    roleRaw === 'super_admin' ? 'super_admin' : roleRaw === 'admin' ? 'admin' : 'cashier'

  return {
    id: String(u?.id ?? u?._id ?? ''),
    email: String(u?.email ?? ''),
    name: String(u?.name ?? ''),
    role,
    shopIds: Array.isArray(u?.shopIds) ? u.shopIds.map((s: any) => String(s)) : [],
    isActive: u?.isActive !== false,
    createdAt: u?.createdAt ? toIsoDate(u.createdAt) : undefined,
  }
}

export function mapShop(s: any): ApiShop {
  return {
    id: String(s?.id ?? s?._id ?? ''),
    name: String(s?.name ?? ''),
    currency: s?.currency ? String(s.currency) : undefined,
    businessName: s?.businessName ? String(s.businessName) : undefined,
    address: s?.address ? String(s.address) : undefined,
    phone: s?.phone ? String(s.phone) : undefined,
    createdAt: s?.createdAt ? toIsoDate(s.createdAt) : undefined,
  }
}

export function mapPlan(p: any): ApiPlan {
  return {
    id: String(p?.id ?? p?._id ?? ''),
    name: String(p?.name ?? ''),
    code: String(p?.code ?? ''),
    currency: String(p?.currency ?? 'NGN'),
    priceMonthly: Number(p?.priceMonthly ?? 0),
    features: typeof p?.features === 'object' && p?.features ? p.features : {},
    isActive: p?.isActive !== false,
    createdAt: p?.createdAt ? toIsoDate(p.createdAt) : undefined,
  }
}

export function mapSubscription(s: any): ApiSubscription {
  const statusRaw = String(s?.status ?? 'active')
  const status: ApiSubscriptionStatus =
    statusRaw === 'past_due' ? 'past_due' : statusRaw === 'canceled' ? 'canceled' : 'active'

  return {
    id: String(s?.id ?? s?._id ?? ''),
    shopId: String(s?.shopId ?? ''),
    planId: String(s?.planId ?? ''),
    status,
    currentPeriodStart: toIsoDate(s?.currentPeriodStart),
    currentPeriodEnd: toIsoDate(s?.currentPeriodEnd),
    cancelAtPeriodEnd: !!s?.cancelAtPeriodEnd,
    canceledAt: s?.canceledAt ? toIsoDate(s.canceledAt) : null,
    createdAt: s?.createdAt ? toIsoDate(s.createdAt) : undefined,
  }
}

export function mapInvoice(i: any): ApiInvoice {
  const statusRaw = String(i?.status ?? 'unpaid')
  const status: ApiInvoiceStatus =
    statusRaw === 'paid' ? 'paid' : statusRaw === 'void' ? 'void' : 'unpaid'

  return {
    id: String(i?.id ?? i?._id ?? ''),
    shopId: String(i?.shopId ?? ''),
    subscriptionId: String(i?.subscriptionId ?? ''),
    planId: String(i?.planId ?? ''),
    currency: String(i?.currency ?? 'NGN'),
    amount: Number(i?.amount ?? 0),
    status,
    paymentProvider: i?.paymentProvider ? String(i.paymentProvider) : null,
    paymentReference: i?.paymentReference ? String(i.paymentReference) : null,
    periodStart: toIsoDate(i?.periodStart),
    periodEnd: toIsoDate(i?.periodEnd),
    dueDate: toIsoDate(i?.dueDate),
    paidAt: i?.paidAt ? toIsoDate(i.paidAt) : null,
    createdAt: i?.createdAt ? toIsoDate(i.createdAt) : undefined,
  }
}
