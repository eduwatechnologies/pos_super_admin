import { baseApi } from '@/redux/api/base-api'
import { mapUser, type ApiUser, type ApiUserRole } from '@/lib/api/mappers'

export const usersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listUsers: build.query<ApiUser[], void>({
      query: () => ({ url: '/users', method: 'GET' }),
      transformResponse: (response: any) => {
        const items = Array.isArray(response?.items) ? response.items : []
        return items.map(mapUser)
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((u) => ({ type: 'User' as const, id: u.id })),
              { type: 'User' as const, id: 'LIST' },
            ]
          : [{ type: 'User' as const, id: 'LIST' }],
    }),
    createUser: build.mutation<
      ApiUser,
      { email: string; password: string; name: string; role: ApiUserRole; shopIds?: string[]; isActive?: boolean }
    >({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      transformResponse: (response: any) => mapUser(response?.item),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
    updateUser: build.mutation<
      ApiUser,
      { userId: string; input: Partial<{ email: string; password: string; name: string; role: ApiUserRole; shopIds: string[]; isActive: boolean }> }
    >({
      query: ({ userId, input }) => ({ url: `/users/${userId}`, method: 'PATCH', body: input }),
      transformResponse: (response: any) => mapUser(response?.item),
      invalidatesTags: (_r, _e, arg) => [{ type: 'User', id: arg.userId }, { type: 'User', id: 'LIST' }],
    }),
  }),
})

export const { useListUsersQuery, useCreateUserMutation, useUpdateUserMutation } = usersApi

