'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { gigCategories } from '@/lib/gig-categories'

const URGENCY = [
  { id: 'this_week', label: 'Esta semana' },
  { id: 'this_month', label: 'Este mes' },
  { id: 'browsing', label: 'Solo estoy mirando' },
] as const

export default function BuyerInterestsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [city, setCity] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [urgency, setUrgency] = useState('browsing')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login?callbackUrl=/buyer/intereses')
  }, [status, router])

  useEffect(() => {
    fetch('/api/buyer/preferences')
      .then(r => r.json())
      .then(d => {
        if (d.city) setCity(d.city)
        if (Array.isArray(d.interests)) setInterests(d.interests)
        if (d.urgency) setUrgency(d.urgency)
      })
      .finally(() => setLoading(false))
  }, [])

  const toggle = (name: string) => {
    setInterests(prev => {
      if (prev.includes(name)) return prev.filter(x => x !== name)
      if (prev.length >= 3) return prev
      return [...prev, name]
    })
  }

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/buyer/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, interests, urgency }),
    })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error || 'No se pudo guardar')
      return
    }
    toast.success('Listo. Te mostraremos servicios para ti.')
    router.push('/buyer')
  }

  if (loading) return <div className="container py-16 text-center text-muted-foreground">Cargando…</div>

  return (
    <div className="container max-w-2xl py-10 px-4">
      <h1 className="text-2xl font-bold mb-2">¿Qué necesitas?</h1>
      <p className="text-muted-foreground mb-8">
        Tres preguntas para mostrarte servicios en tu ciudad. Puedes cambiarlo cuando quieras.
      </p>

      <label className="block text-sm font-medium mb-2">Tu ciudad</label>
      <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Bucaramanga" className="mb-6 h-12" />

      <p className="text-sm font-medium mb-2">Elige hasta 3 categorías</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {gigCategories.map(c => {
          const on = interests.includes(c.name)
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => toggle(c.name)}
              className={`rounded-full border px-3 py-1.5 text-sm ${on ? 'bg-orange-600 text-white border-orange-600' : 'bg-card hover:bg-muted'}`}
            >
              {c.icon} {c.name}
            </button>
          )
        })}
      </div>

      <p className="text-sm font-medium mb-2">¿Para cuándo?</p>
      <div className="flex flex-wrap gap-2 mb-8">
        {URGENCY.map(u => (
          <button
            key={u.id}
            type="button"
            onClick={() => setUrgency(u.id)}
            className={`rounded-full border px-4 py-2 text-sm ${urgency === u.id ? 'bg-orange-600 text-white border-orange-600' : 'bg-card'}`}
          >
            {u.label}
          </button>
        ))}
      </div>

      <Button onClick={save} disabled={saving || !city.trim() || interests.length === 0} className="w-full h-12 bg-orange-600 hover:bg-orange-700">
        {saving ? 'Guardando…' : 'Ver servicios para mí'}
      </Button>
    </div>
  )
}
