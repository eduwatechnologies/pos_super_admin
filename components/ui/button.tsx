import React from 'react'

import { cn } from '@/lib/utils'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'icon'
}

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        size === 'default' && 'h-9 px-4',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'icon' && 'h-9 w-9',
        variant === 'default' && 'bg-primary text-primary-foreground hover:opacity-90',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:opacity-90',
        variant === 'outline' && 'border border-border bg-background hover:bg-muted',
        variant === 'ghost' && 'hover:bg-muted',
        variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:opacity-90',
        className,
      )}
      {...props}
    />
  )
}

