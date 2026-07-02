import { devLog } from '@/lib/utils'
import type { ColombianDocumentTemplate } from '@/lib/colombian-documents'

export interface GeneratedDocumentContent {
  title: string
  body: string
  disclaimer: string
}

export async function generateColombianDocument(opts: {
  template: ColombianDocumentTemplate
  customFields: Record<string, unknown>
  customDescription?: string
  learnedPromptHint?: string
}): Promise<GeneratedDocumentContent> {
  const { template, customFields, customDescription, learnedPromptHint } = opts

  const fieldsText = Object.entries(customFields)
    .filter(([, v]) => v != null && v !== '' && v !== false)
    .map(([k, v]) => `- ${k}: ${String(v)}`)
    .join('\n')

  const promptHint = learnedPromptHint || template.aiPromptHint
  const docName = customDescription?.trim() || template.name

  const fallback: GeneratedDocumentContent = {
    title: docName,
    body: `DOCUMENTO: ${docName}\n\n${fieldsText}\n\n[Borrador generado por OigaGIG — edite antes de imprimir]`,
    disclaimer:
      'Este documento es un borrador informativo generado por OigaGIG. No sustituye asesoría legal profesional. Revise con un abogado antes de firmar o presentar ante autoridades.',
  }

  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY
  if (!apiKey) return fallback

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [
          {
            role: 'user',
            content: `Eres un redactor experto en documentos legales y administrativos en Colombia.

Tipo de documento: ${docName}
Categoría: ${template.categoryHint}
Instrucción: ${promptHint}

Datos proporcionados por el usuario:
${fieldsText || '(sin datos adicionales)'}

Redacta el documento completo en español formal colombiano.
Usa encabezado, cuerpo con cláusulas o párrafos según corresponda, y bloque de firmas al final.
Si faltan datos, usa [COMPLETAR: descripción del dato].

Devuelve SOLO JSON válido (sin markdown):
{
  "title": "Título del documento",
  "body": "Texto completo del documento con saltos de línea \\n",
  "disclaimer": "Aviso legal breve"
}`,
          },
        ],
        temperature: 0.4,
        max_tokens: 2000,
      }),
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim() || ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return fallback

    const parsed = JSON.parse(jsonMatch[0]) as Partial<GeneratedDocumentContent>
    return {
      title: parsed.title || fallback.title,
      body: parsed.body || fallback.body,
      disclaimer: parsed.disclaimer || fallback.disclaimer,
    }
  } catch (e) {
    devLog('[DocumentGenerate] failed', e)
    return fallback
  }
}