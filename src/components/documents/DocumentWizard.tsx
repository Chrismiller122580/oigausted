'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Loader2, Wand2, CreditCard, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PresentedByOigaBadge } from '@/components/documents/PresentedByOigaBadge'
import { computeDocumentPrice } from '@/lib/documents/price'
import type { ColombianDocumentTemplate } from '@/lib/colombian-documents'
import type { DynamicFieldDef } from '@/types/gig-fields'
import { buildWompiWidgetConfig } from '@/lib/wompi-widget'
import type { WompiPrepareResponse } from '@/types/wompi'

type GeneratedContent = { title: string; body: string; disclaimer: string }

interface Props {
  template: ColombianDocumentTemplate
  basePriceCOP: number
  customPriceCOP: number
  defaultPrintShopEmail?: string
}

type Step = 'form' | 'preview' | 'pay'

export function DocumentWizard({
  template,
  basePriceCOP,
  customPriceCOP,
  defaultPrintShopEmail,
}: Props) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isAdmin = session?.user?.role === 'admin'
  const [step, setStep] = useState<Step>('form')
  const [formData, setFormData] = useState<Record<string, string | number | boolean>>({})
  const [printShopEmail, setPrintShopEmail] = useState('')
  const [printShopName, setPrintShopName] = useState('')
  const [printShopPhone, setPrintShopPhone] = useState('')
  const [requestId, setRequestId] = useState<string | null>(null)
  const [content, setContent] = useState<GeneratedContent | null>(null)
  const [editedBody, setEditedBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [similarMatch, setSimilarMatch] = useState<{
    message?: string
    template: { id: string; name: string }
  } | null>(null)
  const [learningNote, setLearningNote] = useState<string | null>(null)
  const [testMode, setTestMode] = useState(false)

  useEffect(() => {
    if (document.querySelector('script[src*="checkout.wompi.co"]')) return
    const script = document.createElement('script')
    script.src = 'https://checkout.wompi.co/widget.js'
    script.async = true
    document.head.appendChild(script)
  }, [])

  const isCustom = template.id === 'custom' || template.fromLearning
  const basePrice = isCustom ? customPriceCOP : basePriceCOP
  const totalPrice = useMemo(
    () => computeDocumentPrice(basePrice, template, formData),
    [basePrice, template, formData],
  )

  const description =
    typeof formData.descripcion === 'string'
      ? formData.descripcion
      : template.name

  const checkSimilar = useCallback(async (text: string) => {
    if (text.length < 8 || template.id !== 'custom') return
    try {
      const res = await fetch('/api/documents/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text }),
      })
      const data = await res.json()
      if (data.match?.template) {
        setSimilarMatch({
          message: data.match.message,
          template: { id: data.match.template.id, name: data.match.template.name },
        })
      } else {
        setSimilarMatch(null)
      }
    } catch {
      setSimilarMatch(null)
    }
  }, [template.id])

  useEffect(() => {
    if (template.id !== 'custom') return
    const text = typeof formData.descripcion === 'string' ? formData.descripcion : ''
    const t = setTimeout(() => checkSimilar(text), 600)
    return () => clearTimeout(t)
  }, [formData.descripcion, template.id, checkSimilar])

  const handleFieldChange = (key: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const renderField = (field: DynamicFieldDef) => {
    const val = formData[field.key]
    if (field.type === 'checkbox') {
      return (
        <label key={field.key} className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!val}
            onChange={(e) => handleFieldChange(field.key, e.target.checked)}
            className="h-5 w-5 accent-orange-600"
          />
          <span className="text-sm">
            {field.label}
            {field.extraPrice ? ` (+$${field.extraPrice.toLocaleString('es-CO')})` : ''}
          </span>
        </label>
      )
    }
    if (field.type === 'number') {
      return (
        <div key={field.key} className="space-y-2">
          <Label>{field.label}</Label>
          <Input
            type="number"
            value={val === undefined || val === false ? '' : String(val)}
            onChange={(e) => handleFieldChange(field.key, e.target.value ? Number(e.target.value) : '')}
          />
        </div>
      )
    }
    return (
      <div key={field.key} className="space-y-2">
        <Label>
          {field.label}
          {field.required ? ' *' : ''}
        </Label>
        <Input
          value={val === undefined || val === false ? '' : String(val)}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          placeholder={field.label}
        />
      </div>
    )
  }

  const createAndGenerate = async () => {
    if (status !== 'authenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    setLoading(true)
    try {
      const createRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          customFields: formData,
          customDescription: template.id === 'custom' ? description : undefined,
        }),
      })
      const created = await createRes.json()
      if (!createRes.ok) throw new Error(created.error || 'Error al crear')

      setRequestId(created.id)
      if (created.learnedRequestId && template.id === 'custom') {
        setLearningNote(
          'OigaGIG registró tu solicitud. Si otros usuarios piden documentos similares, lo agregaremos al catálogo.',
        )
      }

      const genRes = await fetch(`/api/documents/${created.id}/generate`, { method: 'POST' })
      const genData = await genRes.json()
      if (!genRes.ok) throw new Error(genData.error || 'Error al generar')

      setContent(genData.content)
      setEditedBody(genData.content.body)
      setStep('preview')
      toast.success('Borrador generado')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  const saveAndPay = async () => {
    if (!requestId || !content) return

    const email = printShopEmail.trim()
    if (!email) {
      toast.error('Ingresa el correo de tu imprenta')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Correo de imprenta inválido')
      return
    }

    setLoading(true)
    try {
      const patchRes = await fetch(`/api/documents/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editedContent: { ...content, body: editedBody },
          printShopEmail: email,
          printShopName: printShopName.trim() || undefined,
          printShopPhone: printShopPhone.trim() || undefined,
        }),
      })
      const patchData = await patchRes.json()
      if (!patchRes.ok) throw new Error(patchData.error || 'Error al guardar')

      const checkoutRes = await fetch(`/api/documents/${requestId}/checkout`, {
        method: 'POST',
      })
      const checkout = await checkoutRes.json()
      if (!checkoutRes.ok) throw new Error(checkout.error || 'Error en checkout')

      if (checkout.testMode) {
        setTestMode(true)
        setStep('pay')
        toast.message('Modo prueba — simula el pago para recibir el PDF')
        return
      }

      openWompi(checkout)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  const simulatePay = async () => {
    if (!requestId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/documents/${requestId}/simulate-pay`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      router.push(`/documentos/pedido/${requestId}/exito`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  const openWompi = (checkout: WompiPrepareResponse) => {
    const config = buildWompiWidgetConfig(checkout)
    const WidgetCheckout = window.WidgetCheckout || window.WompiCheckout
    if (!WidgetCheckout) {
      toast.error('Widget de pago no disponible')
      return
    }
    const checkoutWidget = new WidgetCheckout(config)
    checkoutWidget.open(async (result: { transaction?: { id?: string } }) => {
      if (requestId && result.transaction?.id) {
        await fetch(`/api/documents/${requestId}/check-wompi`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId: result.transaction.id }),
        })
      }
      router.push(`/documentos/pedido/${requestId}/exito`)
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-4xl" aria-hidden>{template.icon}</span>
        <div>
          <h1 className="text-2xl font-bold">{template.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
        </div>
        <PresentedByOigaBadge className="ml-auto" />
      </div>

      {step === 'form' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-orange-600" />
              Datos del documento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {template.fields.map(renderField)}

            {similarMatch && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/30">
                <p className="flex items-start gap-2 text-amber-900 dark:text-amber-100">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {similarMatch.message}
                </p>
                {similarMatch.template.id !== 'custom' && (
                  <Button
                    variant="link"
                    className="mt-1 h-auto p-0 text-orange-700"
                    onClick={() =>
                      router.push(`/documentos/${encodeURIComponent(similarMatch.template.id)}`)
                    }
                  >
                    Usar plantilla &quot;{similarMatch.template.name}&quot;
                  </Button>
                )}
              </div>
            )}

            {template.id === 'custom' && (
              <p className="text-xs text-muted-foreground">
                Cada documento nuevo ayuda a OigaGIG a aprender qué formatos necesitan los colombianos.
              </p>
            )}

            <div className="flex items-center justify-between border-t pt-4">
              <span className="font-semibold text-lg">
                ${totalPrice.toLocaleString('es-CO')} COP
              </span>
              <Button onClick={createAndGenerate} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Generar borrador
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && content && (
        <Card>
          <CardHeader>
            <CardTitle>Vista previa — edita si necesitas</CardTitle>
            {learningNote && (
              <p className="text-sm text-emerald-700 dark:text-emerald-300">{learningNote}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-medium">{content.title}</p>
            <textarea
              className="w-full min-h-[280px] rounded-lg border p-3 text-sm font-serif leading-relaxed"
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{content.disclaimer}</p>

            <div className="space-y-4 rounded-lg border p-4">
              <div>
                <p className="font-medium text-sm">Tu imprenta</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Enviaremos el PDF a tu imprenta y a {session?.user?.email}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Nombre de la imprenta</Label>
                <Input
                  value={printShopName}
                  onChange={(e) => setPrintShopName(e.target.value)}
                  placeholder="Ej: Imprenta El Centro"
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono de la imprenta</Label>
                <Input
                  type="tel"
                  value={printShopPhone}
                  onChange={(e) => setPrintShopPhone(e.target.value)}
                  placeholder="Ej: 300 123 4567"
                />
              </div>
              <div className="space-y-2">
                <Label>Correo de la imprenta *</Label>
                <Input
                  type="email"
                  required
                  value={printShopEmail}
                  onChange={(e) => setPrintShopEmail(e.target.value)}
                  placeholder={defaultPrintShopEmail || 'imprenta@ejemplo.com'}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setStep('form')}>
                Volver
              </Button>
              <Button onClick={saveAndPay} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Pagar ${totalPrice.toLocaleString('es-CO')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'pay' && testMode && isAdmin && (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <p>Modo prueba — solo administradores pueden simular el pago.</p>
            <Button onClick={simulatePay} disabled={loading}>
              Simular pago y enviar PDF
            </Button>
          </CardContent>
        </Card>
      )}
      {step === 'pay' && testMode && !isAdmin && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Pagos no disponibles en este entorno. Contacta soporte o activa Wompi en admin.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}