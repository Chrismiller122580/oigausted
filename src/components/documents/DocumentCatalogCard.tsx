import Link from 'next/link'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ColombianDocumentTemplate } from '@/lib/colombian-documents'

interface Props {
  template: ColombianDocumentTemplate
}

export function DocumentCatalogCard({ template }: Props) {
  const href =
    template.id === 'custom'
      ? '/documentos/custom'
      : `/documentos/${encodeURIComponent(template.id)}`

  return (
    <Link href={href} className="group block h-full">
      <article
        className={cn(
          'h-full flex flex-col rounded-2xl border border-slate-200/70 dark:border-slate-700/60',
          'bg-white dark:bg-slate-900 p-5 shadow-sm transition-all duration-300',
          'hover:-translate-y-1 hover:shadow-lg hover:border-orange-300/60',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-3xl" aria-hidden>
            {template.icon}
          </span>
          {template.fromLearning && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              <Users className="h-3 w-3" />
              Comunidad
            </span>
          )}
        </div>
        <h3 className="mt-3 font-semibold text-slate-900 dark:text-slate-100 group-hover:text-orange-700">
          {template.name}
        </h3>
        <p className="mt-1 flex-1 text-sm text-muted-foreground line-clamp-2">
          {template.description}
        </p>
        {template.requestCount != null && template.requestCount > 1 && (
          <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
            Solicitado {template.requestCount} veces
          </p>
        )}
      </article>
    </Link>
  )
}