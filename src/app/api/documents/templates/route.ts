import { NextResponse } from 'next/server'
import { getPlatformConfig } from '@/lib/prisma'
import { getCustomTemplate } from '@/lib/colombian-documents'
import { getFullDocumentCatalog } from '@/lib/documents/learning'

export async function GET() {
  try {
    const config = await getPlatformConfig()
    if (config.documentStudioEnabled === false) {
      return NextResponse.json({ enabled: false, templates: [] })
    }

    const threshold = config.documentLearnThreshold ?? 3
    const catalog = await getFullDocumentCatalog(threshold)

    return NextResponse.json({
      enabled: true,
      templates: catalog,
      customTemplate: getCustomTemplate(),
      basePriceCOP: config.documentBasePriceCOP ?? 15000,
      customPriceCOP: config.documentCustomPriceCOP ?? 25000,
      learnThreshold: threshold,
    })
  } catch (e) {
    console.error('[documents/templates]', e)
    return NextResponse.json({ error: 'Error al cargar plantillas' }, { status: 500 })
  }
}