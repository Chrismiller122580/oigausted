import { notFound } from 'next/navigation'
import { DocumentWizard } from '@/components/documents/DocumentWizard'
import { getPlatformConfig } from '@/lib/prisma'
import { resolveTemplate } from '@/lib/documents/learning'

type Props = { params: Promise<{ templateId: string }> }

export default async function DocumentTemplatePage({ params }: Props) {
  const { templateId } = await params
  if (templateId === 'custom' || templateId === 'pedido') notFound()

  const config = await getPlatformConfig()
  const template = await resolveTemplate(templateId, config.documentLearnThreshold ?? 3)
  if (!template) notFound()

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