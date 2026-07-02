import { put } from '@vercel/blob'
import { devLog } from '@/lib/utils'
import type { GeneratedDocumentContent } from '@/lib/documents/generate'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function documentToHtml(content: GeneratedDocumentContent): string {
  const bodyHtml = escapeHtml(content.body).replace(/\n/g, '<br/>')
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(content.title)}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; max-width: 700px; margin: 40px auto; padding: 24px; color: #111; line-height: 1.6; }
    h1 { font-size: 18px; text-align: center; margin-bottom: 32px; }
    .body { font-size: 14px; text-align: justify; white-space: pre-wrap; }
    .disclaimer { margin-top: 48px; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 12px; }
    .brand { text-align: center; font-size: 10px; color: #f97316; margin-top: 24px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(content.title)}</h1>
  <div class="body">${bodyHtml}</div>
  <p class="disclaimer">${escapeHtml(content.disclaimer)}</p>
  <p class="brand">Generado por OigaGIG — Buro de Documentos</p>
</body>
</html>`
}

async function renderPdfWithChromium(html: string): Promise<Buffer | null> {
  try {
    const { launchUserLensBrowser } = await import('@/lib/userlens/browser')
    const { browser, context } = await launchUserLensBrowser({})
    try {
      const page = await context.newPage()
      await page.setContent(html, { waitUntil: 'networkidle' })
      const pdf = await page.pdf({
        format: 'Letter',
        margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
        printBackground: true,
      })
      return Buffer.from(pdf)
    } finally {
      await context.close().catch(() => {})
      await browser.close().catch(() => {})
    }
  } catch (e) {
    devLog('[DocumentPDF] chromium render failed', e)
    return null
  }
}

export async function uploadDocumentArtifact(
  content: GeneratedDocumentContent,
  requestId: string,
): Promise<{ pdfUrl: string; htmlUrl?: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  const html = documentToHtml(content)
  const baseName = `documento-${requestId}`

  if (!token) {
    return { pdfUrl: `data:text/html;base64,${Buffer.from(html).toString('base64')}` }
  }

  let pdfUrl = ''
  const pdfBuffer = await renderPdfWithChromium(html)
  if (pdfBuffer) {
    const pdfBlob = await put(`${baseName}.pdf`, pdfBuffer, {
      access: 'public',
      contentType: 'application/pdf',
      addRandomSuffix: true,
      token,
    })
    pdfUrl = pdfBlob.url
  }

  const htmlBlob = await put(`${baseName}.html`, html, {
    access: 'public',
    contentType: 'text/html',
    addRandomSuffix: true,
    token,
  })

  return { pdfUrl: pdfUrl || htmlBlob.url, htmlUrl: htmlBlob.url }
}