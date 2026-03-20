'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type ModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onOpenChange, title, description, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }

    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [onOpenChange, open])

  if (!open) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          onOpenChange(false)
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={cn('w-full max-w-lg rounded-xl border border-border bg-card text-card-foreground shadow-lg', className)}>
          {(title || description) && (
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div className="min-w-0">
                {title ? <div className="text-base font-semibold">{title}</div> : null}
                {description ? <div className="mt-1 text-sm text-muted-foreground">{description}</div> : null}
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => {
                  onOpenChange(false)
                }}
              >
                <X className="size-4" />
              </Button>
            </div>
          )}
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

