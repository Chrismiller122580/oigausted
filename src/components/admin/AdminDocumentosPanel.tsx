'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  FileText, Settings, Sparkles, ShoppingBag, BookOpen, Plus, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PLATFORM_SELLER_SLUG } from '@/lib/platform-seller'

type Tab = 'settings' | 'templates' | 'learned' | 'orders'

type DocSettings = {
  documentStudioEnabled: boolean
  documentPrintShopEmail: string
  documentBasePriceCOP: number
  documentCustomPriceCOP: number
  documentLearnThreshold: number
}

type TemplateRow = {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  categoryHint: string
  aiPromptHint: string
  isActive: boolean
  order: number
  source: string
  basePriceCOP: number | null
}

type LearnedRow = {
  id: string
  slug: string
  displayName: string
  rawDescription: string
  requestCount: number
  status: string
  lastRequestedAt: string
}

type OrderRow = {
  id: string
  templateName: string
  status: string
  priceCOP: number
  buyerEmail: string
  pdfUrl: string | null
  createdAt: string
  user: { name: string | null; email: string | null }
}

const TABS: { id: Tab; label: string; icon: typeof Settings }[] = [
  { id: 'settings', label: 'Configuración', icon: Settings },
  { id: 'templates', label: 'Plantillas', icon: BookOpen },
  { id: 'learned', label: 'Aprendizaje', icon: Sparkles },
  { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
]

export function AdminDocumentosPanel() {
  const [tab, setTab] = useState<Tab>('settings')
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<DocSettings | null>(null)
  const [templates, setTemplates] = useState<TemplateRow[]>([])
  const [learned, setLearned] = useState<LearnedRow[]>([])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [newTpl, setNewTpl] = useState({
    name: '',
    description: '',
    aiPromptHint: '',
    icon: '📄',
    categoryHint: 'custom',
  })

  const loadSettings = useCallback(async () => {
    const res = await fetch('/api/admin/config')
    if (!res.ok) return
    const data = await res.json()
    setSettings({
      documentStudioEnabled: data.documentStudioEnabled ?? true,
      documentPrintShopEmail: data.documentPrintShopEmail || 'impresion@oigagig.com',
      documentBasePriceCOP: data.documentBasePriceCOP ?? 15000,
      documentCustomPriceCOP: data.documentCustomPriceCOP ?? 25000,
      documentLearnThreshold: data.documentLearnThreshold ?? 3,
    })
  }, [])

  const loadTemplates = useCallback(async () => {
    const res = await fetch('/api/admin/documents/templates')
    const data = await res.json()
    if (res.ok) setTemplates(data.templates || [])
  }, [])

  const loadLearned = useCallback(async () => {
    const res = await fetch('/api/admin/documents/learned')
    const data = await res.json()
    if (res.ok) setLearned(data.learned || [])
  }, [])

  const loadOrders = useCallback(async () => {
    const res = await fetch('/api/admin/documents/orders')
    const data = await res.json()
    if (res.ok) setOrders(data.orders || [])
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([loadSettings(), loadTemplates(), loadLearned(), loadOrders()])
    } finally {
      setLoading(false)
    }
  }, [loadSettings, loadTemplates, loadLearned, loadOrders])

  useEffect(() => {
    refresh()
  }, [refresh])

  const saveSettings = async () => {
    if (!settings) return
    const res = await fetch('/api/admin/config')
    const current = await res.json()
    const putRes = await fetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...current, ...settings }),
    })
    if (!putRes.ok) {
      toast.error('Error al guardar')
      return
    }
    toast.success('Configuración guardada')
  }

  const seedTemplates = async () => {
    const res = await fetch('/api/admin/documents/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seedStatic: true }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Error')
      return
    }
    toast.success(`Importadas ${data.seeded} plantillas`)
    loadTemplates()
  }

  const createTemplate = async () => {
    if (!newTpl.name.trim() || !newTpl.aiPromptHint.trim()) {
      toast.error('Nombre y prompt IA requeridos')
      return
    }
    const res = await fetch('/api/admin/documents/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTpl),
    })
    if (!res.ok) {
      toast.error('Error al crear')
      return
    }
    toast.success('Plantilla creada')
    setNewTpl({ name: '', description: '', aiPromptHint: '', icon: '📄', categoryHint: 'custom' })
    loadTemplates()
  }

  const toggleTemplate = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/documents/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    loadTemplates()
  }

  const setLearnedStatus = async (id: string, status: string) => {
    const res = await fetch('/api/admin/documents/learned', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (!res.ok) {
      toast.error('Error')
      return
    }
    toast.success(status === 'promoted' ? 'Promovida a plantilla' : 'Actualizado')
    loadLearned()
    loadTemplates()
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7 text-orange-600" />
            Buro de Documentos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Servicio de plataforma — OigaGIG actúa como vendedor. Sin comisión a terceros.
          </p>
          <Link
            href={`/sellers/${PLATFORM_SELLER_SLUG}`}
            className="text-sm text-orange-600 hover:underline inline-flex items-center gap-1 mt-2"
          >
            Perfil público OigaGIG <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/documentos">Ver catálogo público</Link>
          </Button>
          <Button variant="outline" onClick={refresh} disabled={loading}>
            Actualizar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {TABS.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTab(t.id)}
            className={tab === t.id ? 'bg-orange-600 hover:bg-orange-700' : ''}
          >
            <t.icon className="h-4 w-4 mr-1.5" />
            {t.label}
          </Button>
        ))}
      </div>

      {tab === 'settings' && settings && (
        <Card>
          <CardHeader>
            <CardTitle>Configuración del servicio</CardTitle>
            <CardDescription>Activa o desactiva el Buro de Documentos para todos los usuarios.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.documentStudioEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, documentStudioEnabled: e.target.checked })
                }
                className="h-5 w-5 accent-orange-600"
              />
              <span className="font-medium">Servicio activo</span>
            </label>
            <div className="space-y-2">
              <Label>Correo imprenta predeterminado</Label>
              <Input
                value={settings.documentPrintShopEmail}
                onChange={(e) =>
                  setSettings({ ...settings, documentPrintShopEmail: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio base (COP)</Label>
                <Input
                  type="number"
                  value={settings.documentBasePriceCOP}
                  onChange={(e) =>
                    setSettings({ ...settings, documentBasePriceCOP: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Precio &quot;Otro documento&quot; (COP)</Label>
                <Input
                  type="number"
                  value={settings.documentCustomPriceCOP}
                  onChange={(e) =>
                    setSettings({ ...settings, documentCustomPriceCOP: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Solicitudes para mostrar en comunidad</Label>
              <Input
                type="number"
                min={1}
                value={settings.documentLearnThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, documentLearnThreshold: Number(e.target.value) })
                }
              />
            </div>
            <Button onClick={saveSettings} className="bg-orange-600 hover:bg-orange-700">
              Guardar configuración
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === 'templates' && (
        <div className="space-y-6">
          <div className="flex gap-2">
            <Button variant="outline" onClick={seedTemplates}>
              Importar plantillas iniciales
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nueva plantilla</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Nombre (ej: Carta de renuncia)"
                value={newTpl.name}
                onChange={(e) => setNewTpl({ ...newTpl, name: e.target.value })}
              />
              <Input
                placeholder="Descripción corta"
                value={newTpl.description}
                onChange={(e) => setNewTpl({ ...newTpl, description: e.target.value })}
              />
              <Textarea
                placeholder="Instrucción IA (aiPromptHint) — normativa colombiana aplicable"
                value={newTpl.aiPromptHint}
                onChange={(e) => setNewTpl({ ...newTpl, aiPromptHint: e.target.value })}
                rows={3}
              />
              <Button onClick={createTemplate}>
                <Plus className="h-4 w-4 mr-1" /> Crear plantilla
              </Button>
            </CardContent>
          </Card>
          <div className="space-y-2">
            {templates.map((t) => (
              <Card key={t.id}>
                <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xl mr-2">{t.icon}</span>
                    <span className="font-medium">{t.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">({t.source})</span>
                    {!t.isActive && (
                      <span className="text-xs text-red-600 ml-2">inactiva</span>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
                    <p className="text-xs text-muted-foreground">slug: {t.slug}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toggleTemplate(t.id, t.isActive)}>
                    {t.isActive ? 'Desactivar' : 'Activar'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'learned' && (
        <div className="space-y-3">
          {learned.length === 0 ? (
            <p className="text-muted-foreground">Sin solicitudes personalizadas aún.</p>
          ) : (
            learned.map((row) => (
              <Card key={row.id}>
                <CardContent className="py-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{row.displayName}</span>
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {row.requestCount} solicitudes
                    </span>
                    <span className="text-xs text-muted-foreground">{row.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{row.rawDescription}</p>
                  <div className="flex flex-wrap gap-2">
                    {row.status !== 'promoted' && (
                      <Button size="sm" onClick={() => setLearnedStatus(row.id, 'promoted')}>
                        Promover a plantilla
                      </Button>
                    )}
                    {row.status !== 'dismissed' && (
                      <Button size="sm" variant="ghost" onClick={() => setLearnedStatus(row.id, 'dismissed')}>
                        Descartar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-2">
          {orders.length === 0 ? (
            <p className="text-muted-foreground">Sin pedidos aún.</p>
          ) : (
            orders.map((o) => (
              <Card key={o.id}>
                <CardContent className="py-3 flex flex-wrap justify-between gap-2 text-sm">
                  <div>
                    <span className="font-medium">{o.templateName}</span>
                    <span className="text-muted-foreground ml-2">{o.status}</span>
                    <p className="text-muted-foreground">{o.buyerEmail}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${o.priceCOP.toLocaleString('es-CO')}</p>
                    {o.pdfUrl && (
                      <a href={o.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-orange-600 text-xs hover:underline">
                        PDF
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}