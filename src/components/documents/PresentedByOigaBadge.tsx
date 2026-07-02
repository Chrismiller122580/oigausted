import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PresentedByOigaBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-200',
        'px-3 py-1 text-xs font-semibold tracking-wide',
        className,
      )}
    >
      <Sparkles className="h-3.5 w-3.5" aria-hidden />
      Presentado por OigaGIG
    </span>
  )
}