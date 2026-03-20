import { baseApi } from '@/redux/api/base-api'
import { mapUser, type ApiUser } from '@/lib/api/mappers'

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<{ token: string; user: ApiUser }, { email: string; password: string }>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => ({
        token: String(response?.token ?? ''),
        user: mapUser(response?.user),
      }),
      invalidatesTags: ['Auth'],
    }),
    me: build.query<{ user: ApiUser }, void>({
      query: () => ({ url: '/auth/me', method: 'GET' }),
      transformResponse: (response: any) => ({ user: mapUser(response?.user) }),
      providesTags: ['Auth'],
    }),
  }),
})

export const { useLoginMutation, useMeQuery } = authApi

