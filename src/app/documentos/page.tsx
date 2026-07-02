import Link from 'next/link'
import { FileText, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PresentedByOigaBadge } from '@/components/documents/PresentedByOigaBadge'
import { DocumentCatalogCard } from '@/components/documents/DocumentCatalogCard'
import { getPlatformConfig } from '@/lib/prisma'
import { getCustomTemplate } from '@/lib/colombian-documents'
import { getFullDocumentCatalog } from '@/lib/documents/learning'
import { ensurePlatformSeller, PLATFORM_SELLER_SLUG } from '@/lib/platform-seller'

export const metadata = {
  title: 'Buro de Documentos — OigaGIG',
  description:
    'Crea documentos legales y administrativos en Colombia. Presentado por OigaGIG. Envía a tu imprenta.',
}

export default async function DocumentosPage() {
  await ensurePlatformSeller()
  const config = await getPlatformConfig()
  if (config.documentStudioEnabled === false) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Buro de Documentos no disponible</h1>
        <p className="text-muted-foreground mt-2">Vuelve pronto.</p>
      </main>
    )
  }

  const threshold = config.documentLearnThreshold ?? 3
  const catalog = await getFullDocumentCatalog(threshold)
  const custom = getCustomTemplate()
  const learned = catalog.filter((t) => t.fromLearning)
  const staticDocs = catalog.filter((t) => !t.fromLearning)

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 via-red-600 to-rose-600 p-8 sm:p-12 text-white mb-10">
        <div className="relative z-10 max-w-2xl">
          <PresentedByOigaBadge className="bg-white/20 text-white mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-3">
            <FileText className="h-9 w-9" />
            Buro de Documentos
          </h1>
          <p className="mt-3 text-white/90 text-lg">
            Redacta cartas, contratos y trámites para Colombia. Paga, descarga el PDF y envíalo
            directo a tu imprenta.
          </p>
          <p className="mt-2 text-sm text-white/75">
            ¿No encuentras tu documento? Pídelo como &quot;Otro documento&quot; — OigaGIG aprende de
            cada solicitud nueva.
          </p>
          <Link
            href={`/sellers/${PLATFORM_SELLER_SLUG}`}
            className="inline-block mt-3 text-sm text-white/90 underline hover:text-white"
          >
            Servicio oficial de OigaGIG
          </Link>
          <Button
            asChild
            size="lg"
            className="mt-6 bg-white text-orange-700 hover:bg-white/90"
          >
            <Link href="/documentos/custom">
              <Sparkles className="h-4 w-4 mr-2" />
              Crear otro documento
            </Link>
          </Button>
        </div>
      </section>

      {learned.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-1">Solicitados por la comunidad</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Documentos que usuarios pidieron y OigaGIG aprendió a ofrecer.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {learned.map((t) => (
              <DocumentCatalogCard key={t.id} template={t} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Plantillas populares</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staticDocs.map((t) => (
            <DocumentCatalogCard key={t.id} template={t} />
          ))}
        </div>
      </section>

      <section>
        <DocumentCatalogCard template={custom} />
      </section>
    </main>
  )
}