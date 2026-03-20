'use client'

import { useMemo, useState } from 'react'

import { TopHeader } from '@/components/top-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useCreateShopMutation, useDeleteShopMutation, useListShopsQuery, useUpdateShopMutation } from '@/redux/api/shops-api'

export default function StoresPage() {
  const { data: shops = [], isLoading, isError } = useListShopsQuery()
  const [createShop, { isLoading: isCreating }] = useCreateShopMutation()
  const [updateShop, { isLoading: isUpdating }] = useUpdateShopMutation()
  const [deleteShop, { isLoading: isDeleting }] = useDeleteShopMutation()

  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createCurrency, setCreateCurrency] = useState('NGN')

  const [editOpen, setEditOpen] = useState(false)
  const [editShopId, setEditShopId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editCurrency, setEditCurrency] = useState('NGN')

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteShopId, setDeleteShopId] = useState<string | null>(null)

  const canCreate = useMemo(() => createName.trim().length > 0, [createName])
  const canEdit = useMemo(() => editName.trim().length > 0, [editName])

  return (
    <div className="min-h-screen">
      <TopHeader title="Stores" />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>All Stores</CardTitle>
                <CardDescription>Manage store records.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{shops.length} total</Badge>
                <Button
                  onClick={() => {
                    setCreateName('')
                    setCreateCurrency('NGN')
                    setCreateOpen(true)
                  }}
                >
                  New store
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="text-sm text-muted-foreground">Loading...</div> : null}
            {isError ? <div className="text-sm text-destructive">Failed to load stores</div> : null}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Currency</th>
                    <th className="py-2 pr-4">ID</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shops.map((shop) => (
                    <tr key={shop.id} className="border-b border-border">
                      <td className="py-3 pr-4">
                        <span className="font-medium">{shop.name}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span>{shop.currency ?? '-'}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-mono text-xs text-muted-foreground">{shop.id}</span>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditShopId(shop.id)
                            setEditName(shop.name)
                            setEditCurrency(shop.currency ?? 'NGN')
                            setEditOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isDeleting}
                          onClick={() => {
                            setDeleteShopId(shop.id)
                            setDeleteOpen(true)
                          }}
                        >
                          Delete
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
          title="Create Store"
          description="Create a new store under the BillScan platform."
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Store name</label>
              <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="e.g. Ikeja Branch" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <Input value={createCurrency} onChange={(e) => setCreateCurrency(e.target.value)} placeholder="NGN" />
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
                  await createShop({ name: createName.trim(), currency: createCurrency.trim() || undefined }).unwrap()
                  setCreateOpen(false)
                }}
              >
                {isCreating ? 'Creating...' : 'Create store'}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          open={editOpen}
          onOpenChange={(open) => {
            if (!isUpdating) setEditOpen(open)
          }}
          title="Edit Store"
          description="Update store details."
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Store name</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <Input value={editCurrency} onChange={(e) => setEditCurrency(e.target.value)} />
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
                disabled={!editShopId || !canEdit || isUpdating}
                onClick={async () => {
                  if (!editShopId) return
                  await updateShop({
                    shopId: editShopId,
                    input: { name: editName.trim(), currency: editCurrency.trim() || 'NGN' },
                  }).unwrap()
                  setEditOpen(false)
                }}
              >
                {isUpdating ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          open={deleteOpen}
          onOpenChange={(open) => {
            if (!isDeleting) setDeleteOpen(open)
          }}
          title="Delete Store"
          description="This action cannot be undone."
        >
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">Delete this store and remove it from all users' access lists.</div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!deleteShopId || isDeleting}
                onClick={async () => {
                  if (!deleteShopId) return
                  await deleteShop({ shopId: deleteShopId }).unwrap()
                  setDeleteOpen(false)
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete store'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
