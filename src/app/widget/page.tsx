'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { guestWidget, type WidgetPayload } from '@/lib/widget-data'

/**
 * Pin-able PWA surface. On Android Chrome: Add to Home screen.
 * Layout matches the 4×2 Glance widget so the pin looks like a native tile.
 */
export default function WidgetPage() {
  const { status } = useSession()
  const [data, setData] = useState<WidgetPayload>(guestWidget())

  useEffect(() => {
    if (status === 'loading') return
    fetch('/api/widget', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(guestWidget()))
  }, [status])

  return (
    <main className="min-h-dvh bg-[#0b1630] text-white px-4 py-6">
      <p className="text-xs tracking-widest text-amber-300 mb-3">OIGAGIG · WIDGET</p>
      <h1 className="text-2xl font-bold mb-1">{data.greeting}</h1>
      <p className="text-sm text-white/70 mb-5 capitalize">{data.role === 'guest' ? 'Invitado' : data.role}</p>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {data.stats.map((s) => (
          <a key={s.label} href={s.href || '#'} className="rounded-2xl bg-white/10 p-3 text-center">
            <div className="text-lg font-semibold">{s.value}</div>
            <div className="text-[11px] text-white/70">{s.label}</div>
          </a>
        ))}
      </div>

      <div className="space-y-2 mb-6">
        {data.items.map((item) => (
          <a key={item.href + item.title} href={item.href} className="block rounded-2xl bg-white/10 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{item.title}</div>
                {item.subtitle && <div className="text-xs text-white/60">{item.subtitle}</div>}
              </div>
              {item.badge && <span className="text-[10px] rounded-full bg-orange-600 px-2 py-1">{item.badge}</span>}
            </div>
          </a>
        ))}
      </div>

      <div className="flex gap-2">
        <a href={data.primary.href} className="flex-1 text-center rounded-xl bg-orange-700 py-3 font-semibold">
          {data.primary.label}
        </a>
        <a href={data.secondary.href} className="flex-1 text-center rounded-xl border border-white/25 py-3 font-semibold">
          {data.secondary.label}
        </a>
      </div>
    </main>
  )
}
