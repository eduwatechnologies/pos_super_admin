'use client'

import { useMemo, useState } from 'react'

import { TopHeader } from '@/components/top-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import type { ApiUserRole } from '@/lib/api/mappers'
import { useListShopsQuery } from '@/redux/api/shops-api'
import { useCreateUserMutation, useListUsersQuery, useUpdateUserMutation } from '@/redux/api/users-api'

function parseShopIds(raw: string) {
  return raw
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

export default function UsersPage() {
  const { data: users = [], isLoading, isError } = useListUsersQuery()
  const { data: shops = [] } = useListShopsQuery()
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation()
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()

  const [createOpen, setCreateOpen] = useState(false)
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createName, setCreateName] = useState('')
  const [createRole, setCreateRole] = useState<ApiUserRole>('admin')
  const [createShopIdsRaw, setCreateShopIdsRaw] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [editUserId, setEditUserId] = useState<string | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<ApiUserRole>('admin')
  const [editShopIdsRaw, setEditShopIdsRaw] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)

  const canCreate = useMemo(
    () => createEmail.trim() && createPassword.trim() && createName.trim(),
    [createEmail, createName, createPassword],
  )
  const canEdit = useMemo(() => editEmail.trim() && editName.trim(), [editEmail, editName])

  return (
    <div className="min-h-screen">
      <TopHeader title="Users" />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Toggle access and update roles.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{users.length} total</Badge>
                <Button
                  onClick={() => {
                    setCreateName('')
                    setCreateEmail('')
                    setCreatePassword('')
                    setCreateRole('admin')
                    setCreateShopIdsRaw('')
                    setCreateOpen(true)
                  }}
                >
                  New user
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="text-sm text-muted-foreground">Loading...</div> : null}
            {isError ? <div className="text-sm text-destructive">Failed to load users</div> : null}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Stores</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border">
                      <td className="py-3 pr-4 font-medium">{u.name}</td>
                      <td className="py-3 pr-4">{u.email}</td>
                      <td className="py-3 pr-4">
                        <Badge>{u.role}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs text-muted-foreground">{u.shopIds.length ? `${u.shopIds.length} store(s)` : '-'}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge className={u.isActive ? '' : 'opacity-70'}>{u.isActive ? 'active' : 'disabled'}</Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={u.role === 'super_admin'}
                          onClick={() => {
                            setEditUserId(u.id)
                            setEditName(u.name)
                            setEditEmail(u.email)
                            setEditPassword('')
                            setEditRole(u.role)
                            setEditShopIdsRaw(u.shopIds.join(', '))
                            setEditIsActive(u.isActive)
                            setEditOpen(true)
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

        <Modal
          open={createOpen}
          onOpenChange={(open) => {
            if (!isCreating) setCreateOpen(open)
          }}
          title="Create User"
          description="Create admin/cashier users and assign store access."
        >
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="user@company.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as ApiUserRole)}
                >
                  <option value="admin">admin</option>
                  <option value="cashier">cashier</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Store IDs (comma-separated)</label>
                <Input
                  value={createShopIdsRaw}
                  onChange={(e) => setCreateShopIdsRaw(e.target.value)}
                  placeholder="e.g. 65f..., 65a..."
                />
                {shops.length ? (
                  <div className="text-xs text-muted-foreground">Available stores: {shops.map((s) => s.name).join(', ')}</div>
                ) : null}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isCreating}
                onClick={() => {
                  setCreateOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!canCreate || isCreating}
                onClick={async () => {
                  await createUser({
                    email: createEmail.trim(),
                    password: createPassword,
                    name: createName.trim(),
                    role: createRole,
                    shopIds: parseShopIds(createShopIdsRaw),
                    isActive: true,
                  }).unwrap()
                  setCreateOpen(false)
                }}
              >
                {isCreating ? 'Creating...' : 'Create user'}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          open={editOpen}
          onOpenChange={(open) => {
            if (!isUpdating) setEditOpen(open)
          }}
          title="Edit User"
          description="Update user details, access, and role."
        >
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New password (optional)</label>
                <Input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as ApiUserRole)}
                  disabled={editRole === 'super_admin'}
                >
                  <option value="super_admin">super_admin</option>
                  <option value="admin">admin</option>
                  <option value="cashier">cashier</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Store IDs (comma-separated)</label>
                <Input value={editShopIdsRaw} onChange={(e) => setEditShopIdsRaw(e.target.value)} />
                {shops.length ? (
                  <div className="text-xs text-muted-foreground">Available stores: {shops.map((s) => s.name).join(', ')}</div>
                ) : null}
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  value={editIsActive ? 'active' : 'disabled'}
                  onChange={(e) => setEditIsActive(e.target.value === 'active')}
                  disabled={editRole === 'super_admin'}
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
                disabled={isUpdating}
                onClick={() => {
                  setEditOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!editUserId || !canEdit || isUpdating || editRole === 'super_admin'}
                onClick={async () => {
                  if (!editUserId) return
                  const input: any = {
                    email: editEmail.trim(),
                    name: editName.trim(),
                    role: editRole,
                    shopIds: parseShopIds(editShopIdsRaw),
                    isActive: editIsActive,
                  }
                  if (editPassword.trim()) input.password = editPassword
                  await updateUser({ userId: editUserId, input }).unwrap()
                  setEditOpen(false)
                }}
              >
                {isUpdating ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
