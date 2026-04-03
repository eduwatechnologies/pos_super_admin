import { baseApi } from '@/redux/api/base-api'
import { mapInvoice, mapPlan, mapSubscription, type ApiInvoice, type ApiPlan, type ApiSubscription } from '@/lib/api/mappers'

export const billingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listPlans: build.query<ApiPlan[], void>({
      query: () => ({ url: '/billing/plans', method: 'GET' }),
      transformResponse: (response: any) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map(mapPlan)
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: 'Plan' as const, id: p.id })),
              { type: 'Plan' as const, id: 'LIST' },
            ]
          : [{ type: 'Plan' as const, id: 'LIST' }],
    }),
    createPlan: build.mutation<
      ApiPlan,
      { name: string; code: string; currency?: string; priceMonthly: number; isActive?: boolean; features?: Record<string, any> }
    >({
      query: (body) => ({ url: '/billing/plans', method: 'POST', body }),
      transformResponse: (response: any) => mapPlan(response?.item),
      invalidatesTags: [{ type: 'Plan', id: 'LIST' }],
    }),
    updatePlan: build.mutation<
      ApiPlan,
      {
        planId: string
        input: Partial<{ name: string; currency: string; priceMonthly: number; isActive: boolean; features: Record<string, any> }>
      }
    >({
      query: ({ planId, input }) => ({ url: `/billing/plans/${planId}`, method: 'PATCH', body: input }),
      transformResponse: (response: any) => mapPlan(response?.item),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Plan', id: arg.planId }, { type: 'Plan', id: 'LIST' }],
    }),
    listSubscriptions: build.query<ApiSubscription[], { shopId?: string } | void>({
      query: (arg) => {
        const shopId = (arg as any)?.shopId
        return { url: '/billing/subscriptions', method: 'GET', params: shopId ? { shopId } : undefined }
      },
      transformResponse: (response: any) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map(mapSubscription)
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({ type: 'Subscription' as const, id: s.id })),
              { type: 'Subscription' as const, id: 'LIST' },
            ]
          : [{ type: 'Subscription' as const, id: 'LIST' }],
    }),
    createSubscription: build.mutation<
      { subscription: ApiSubscription; invoice: ApiInvoice },
      { shopId: string; planId: string }
    >({
      query: (body) => ({ url: '/billing/subscriptions', method: 'POST', body }),
      transformResponse: (response: any) => ({
        subscription: mapSubscription(response?.item),
        invoice: mapInvoice(response?.invoice),
      }),
      invalidatesTags: [
        { type: 'Subscription', id: 'LIST' },
        { type: 'Invoice', id: 'LIST' },
      ],
    }),
    updateSubscription: build.mutation<ApiSubscription, { subscriptionId: string; input: Partial<{ status: string; cancelAtPeriodEnd: boolean }> }>({
      query: ({ subscriptionId, input }) => ({ url: `/billing/subscriptions/${subscriptionId}`, method: 'PATCH', body: input }),
      transformResponse: (response: any) => mapSubscription(response?.item),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Subscription', id: arg.subscriptionId }, { type: 'Subscription', id: 'LIST' }],
    }),
    listInvoices: build.query<ApiInvoice[], { shopId?: string; status?: string } | void>({
      query: (arg) => {
        const shopId = (arg as any)?.shopId
        const status = (arg as any)?.status
        const params: any = {}
        if (shopId) params.shopId = shopId
        if (status) params.status = status
        return { url: '/billing/invoices', method: 'GET', params: Object.keys(params).length ? params : undefined }
      },
      transformResponse: (response: any) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map(mapInvoice)
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((i) => ({ type: 'Invoice' as const, id: i.id })),
              { type: 'Invoice' as const, id: 'LIST' },
            ]
          : [{ type: 'Invoice' as const, id: 'LIST' }],
    }),
    payInvoice: build.mutation<ApiInvoice, { invoiceId: string }>({
      query: ({ invoiceId }) => ({ url: `/billing/invoices/${invoiceId}/pay`, method: 'POST' }),
      transformResponse: (response: any) => mapInvoice(response?.item),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Invoice', id: arg.invoiceId }, { type: 'Invoice', id: 'LIST' }],
    }),
  }),
})

export const {
  useListPlansQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useListSubscriptionsQuery,
  useCreateSubscriptionMutation,
  useUpdateSubscriptionMutation,
  useListInvoicesQuery,
  usePayInvoiceMutation,
} = billingApi
