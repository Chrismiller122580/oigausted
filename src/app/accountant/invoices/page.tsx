import Link from 'next/link'
import { Button } from '@/components/ui/button'

/** Placeholder — invoicing module not shipped yet. */
export default function AccountantInvoicesPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Facturas</h1>
      <p className="mt-3 text-muted-foreground">
        El módulo de facturación aún no está activo. Consulta transacciones y payouts para el flujo actual.
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
