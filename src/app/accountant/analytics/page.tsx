import Link from 'next/link'
import { Button } from '@/components/ui/button'

/** Placeholder — full accountant analytics not shipped yet. */
export default function AccountantAnalyticsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Analítica financiera</h1>
      <p className="mt-3 text-muted-foreground">
        Esta sección estará disponible pronto. Mientras tanto usa transacciones, payouts y earnings.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild variant="outline">
          <Link href="/accountant/transactions">Transacciones</Link>
        </Button>
        <Button asChild>
          <Link href="/accountant">Panel contable</Link>
        </Button>
      </div>
    </div>
  )
}
