import { DocumentWizard } from '@/components/documents/DocumentWizard'
import { getCustomTemplate } from '@/lib/colombian-documents'
import { getPlatformConfig } from '@/lib/prisma'

export const metadata = {
  title: 'Otro documento — Buro de Documentos OigaGIG',
  description: 'Describe el documento que necesitas. OigaGIG aprende de cada solicitud.',
}

export default async function CustomDocumentPage() {
  const config = await getPlatformConfig()
  const template = getCustomTemplate()

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <DocumentWizard
        template={template}
        basePriceCOP={config.documentBasePriceCOP ?? 15000}
        customPriceCOP={config.documentCustomPriceCOP ?? 25000}
        defaultPrintShopEmail={config.documentPrintShopEmail ?? undefined}
      />
    </main>
  )
}