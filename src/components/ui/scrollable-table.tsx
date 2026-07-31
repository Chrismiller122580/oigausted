import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ScrollableTableProps = {
  children: ReactNode
  className?: string
  /** Mobile hint under the table (default true) */
  hint?: boolean
  /** Hint copy — Spanish marketplace default */
  hintLabel?: string
}

/**
 * Touch-friendly horizontal table wrapper for admin/staff dense grids.
 * Prefer card layouts when possible; use this when a real table is required.
 */
export function ScrollableTable({
  children,
  className,
  hint = true,
  hintLabel = 'Desliza → para ver más columnas',
}: ScrollableTableProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <div
        className={cn(
          'overflow-x-auto overscroll-x-contain touch-pan-x',
          '[-webkit-overflow-scrolling:touch]',
          // Subtle edge fade cue on small screens without blocking taps
          'md:shadow-none',
        )}
      >
        {children}
      </div>
      {hint ? (
        <p
          className="mt-1.5 px-1 text-[11px] text-muted-foreground md:hidden select-none"
          aria-hidden
        >
          {hintLabel}
        </p>
      ) : null}
    </div>
  )
}
