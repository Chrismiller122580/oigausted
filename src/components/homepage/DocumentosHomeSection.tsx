import Link from 'next/link'
import { FileText, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PresentedByOigaBadge } from '@/components/documents/PresentedByOigaBadge'

export function DocumentosHomeSection() {
  return (
    <section
      className="mx-auto max-w-7xl px-4 sm:px-6 py-10"
      aria-labelledby="documentos-home-heading"
    >
      <div className="relative overflow-hidden rounded-2xl border border-orange-200/60 dark:border-orange-800/40 bg-gradient-to-r from-orange-50 to-rose-50 dark:from-orange-950/20 dark:to-rose-950/20 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-lg">
          <FileText className="h-7 w-7" />
        </div>
        <div className="flex-1 min-w-0">
          <PresentedByOigaBadge className="mb-2" />
          <h2 id="documentos-home-heading" className="text-xl sm:text-2xl font-bold">
            Buro de Documentos
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base max-w-xl">
            Cartas, contratos y trámites para Colombia. Si no está en el catálogo, pídelo —
            OigaGIG aprende de cada solicitud y lo agrega para todos.
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0 bg-orange-600 hover:bg-orange-700">
          <Link href="/documentos">
            <Sparkles className="h-4 w-4 mr-2" />
            Crear documento
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </section>
  )
}