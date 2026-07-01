'use client'

import { Smartphone } from 'lucide-react'

const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL?.trim() || ''
const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() || ''

type StoreBadgeProps = {
  label: string
  sublabel: string
  href?: string
}

function StoreBadge({ label, sublabel, href }: StoreBadgeProps) {
  const content = (
    <>
      <Smartphone className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
      <span className="text-left leading-tight">
        <span className="block text-[10px] uppercase tracking-wide opacity-80">
          {sublabel}
        </span>
        <span className="block text-sm font-semibold">{label}</span>
      </span>
    </>
  )

  const className =
    'inline-flex min-w-[9.5rem] items-center gap-2 rounded-xl border border-border bg-background/80 px-3 py-2 text-foreground transition-colors'

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/20`}
      >
        {content}
      </a>
    )
  }

  return (
    <span
      className={`${className} cursor-default opacity-80`}
      title="Próximamente en las tiendas de aplicaciones"
    >
      {content}
    </span>
  )
}

export function AppStoreBadges() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        App móvil
      </p>
      <div className="flex flex-wrap gap-2">
        <StoreBadge
          sublabel="Disponible en"
          label="App Store"
          href={APP_STORE_URL || undefined}
        />
        <StoreBadge
          sublabel="Disponible en"
          label="Google Play"
          href={PLAY_STORE_URL || undefined}
        />
      </div>
      {!APP_STORE_URL && !PLAY_STORE_URL ? (
        <p className="text-xs text-muted-foreground">
          Mientras tanto, instala la app desde Safari o Chrome con{' '}
          <strong className="text-foreground">Agregar a pantalla de inicio</strong>.
        </p>
      ) : null}
    </div>
  )
}